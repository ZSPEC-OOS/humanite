package main

import (
	"encoding/json"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "gateway"})
	})

	orchestrationURL := os.Getenv("UPSTREAM_ORCHESTRATION")
	if orchestrationURL == "" {
		orchestrationURL = "http://orchestration:8000"
	}
	userMgmtURL := os.Getenv("UPSTREAM_USER_MGMT")
	if userMgmtURL == "" {
		userMgmtURL = "http://user-management:8004"
	}

	orchestration, err := url.Parse(orchestrationURL)
	if err != nil {
		log.Fatalf("Invalid UPSTREAM_ORCHESTRATION URL: %v", err)
	}
	userMgmt, err := url.Parse(userMgmtURL)
	if err != nil {
		log.Fatalf("Invalid UPSTREAM_USER_MGMT URL: %v", err)
	}

	mux.Handle("/v1/auth/", httputil.NewSingleHostReverseProxy(userMgmt))
	mux.Handle("/v1/user/", httputil.NewSingleHostReverseProxy(userMgmt))
	mux.Handle("/v1/", httputil.NewSingleHostReverseProxy(orchestration))

	log.Println("Gateway listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
