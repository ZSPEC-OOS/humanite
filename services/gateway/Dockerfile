FROM golang:1.22-alpine AS development
WORKDIR /app
RUN go install github.com/cosmtrek/air@latest
COPY go.mod go.sum ./
RUN go mod download
COPY . .
CMD ["air"]

FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o gateway ./cmd/gateway

FROM gcr.io/distroless/static-debian12 AS production
COPY --from=builder /app/gateway /gateway
ENTRYPOINT ["/gateway"]
