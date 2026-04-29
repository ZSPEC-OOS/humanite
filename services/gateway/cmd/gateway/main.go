package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"

	"humanite/gateway/internal/auth"
	"humanite/gateway/internal/middleware"
)

func main() {
	// Load and parse RSA public key — required in all environments
	pubKeyPEM := os.Getenv("JWT_PUBLIC_KEY")
	if pubKeyPEM == "" {
		log.Println("Warning: JWT_PUBLIC_KEY not set — authentication disabled (dev only)")
	}

	var handler http.Handler

	mux := http.NewServeMux()

	// Health — always unauthenticated
	mux.HandleFunc("GET /v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","service":"gateway","version":"0.2.0"}`))
	})

	// Upstream service URLs
	orchestrationURL, _ := url.Parse(getEnv("UPSTREAM_ORCHESTRATION", "http://orchestration:8000"))
	userMgmtURL, _ := url.Parse(getEnv("UPSTREAM_USER_MGMT", "http://user-management:8004"))

	orchestrationProxy := httputil.NewSingleHostReverseProxy(orchestrationURL)
	userMgmtProxy := httputil.NewSingleHostReverseProxy(userMgmtURL)

	// Auth routes — proxied to user-management (no JWT required; they issue tokens)
	mux.Handle("/v1/auth/", userMgmtProxy)
	mux.Handle("/v1/user/", userMgmtProxy)

	// All other v1 routes — require JWT
	mux.Handle("/v1/", orchestrationProxy)

	if pubKeyPEM != "" {
		pubKey, err := auth.ParsePublicKey(pubKeyPEM)
		if err != nil {
			log.Fatalf("Failed to parse JWT public key: %v", err)
		}
		handler = middleware.Auth(pubKey)(mux)
	} else {
		handler = mux
	}

	addr := ":" + getEnv("PORT", "8080")
	log.Printf("Gateway listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
