# Use Golang image to build the binary
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the entire source tree
COPY . .

# Build the backend server
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./backend/cmd/server/main.go

# Final lean image
FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /root/
COPY --from=builder /server .

# Expose gRPC and WebSocket ports
EXPOSE 50051 8080

CMD ["./server"]
