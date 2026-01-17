# Build stage
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /shellsync-client ./client/main.go

# --- HARNESS STAGE ---
# Includes Go toolchain for running 'go run' in tests
FROM golang:1.23-alpine AS harness
RUN apk add --no-cache bash ca-certificates netcat-openbsd
WORKDIR /app
COPY . .
# Pre-build for quick access
RUN CGO_ENABLED=0 GOOS=linux go build -o /usr/local/bin/shellsync-client ./client/main.go
ENTRYPOINT ["/bin/bash", "./harness/run.sh"]

# --- PRODUCTION/RUNNER STAGE ---
# Lean image for agent execution
FROM alpine:latest AS runner
RUN apk --no-cache add ca-certificates bash
WORKDIR /app
COPY --from=builder /shellsync-client /usr/local/bin/shellsync-client
ENTRYPOINT ["/usr/local/bin/shellsync-client"]
