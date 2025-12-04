package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"github.com/Ayush-Vish/shellsync/backend/internal/service"
	"github.com/Ayush-Vish/shellsync/backend/internal/websocket"
	"github.com/gorilla/mux"
	"github.com/improbable-eng/grpc-web/go/grpcweb"
	"google.golang.org/grpc"

	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

func main() {
	shellService := service.NewShellSyncService()
	wsHub := websocket.NewHub(shellService)
	shellService.SetHub(wsHub)

	grpcServer := grpc.NewServer()
	pb.RegisterShellSyncServer(grpcServer, shellService)

	// gRPC-Web wrapper
	grpcWebServer := grpcweb.WrapServer(grpcServer,
		grpcweb.WithOriginFunc(func(origin string) bool { return true }),
	)

	// httpRouter
	httpRouter := mux.NewRouter()

	// Health check
	httpRouter.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ShellSync Backend is Running!"))
	})

	// Sessions endpoint
	httpRouter.HandleFunc("/s", func(w http.ResponseWriter, r *http.Request) {
		sessions := shellService.GetSessions()
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(sessions); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})

	// WebSocket endpoint
	httpRouter.HandleFunc("/ws", wsHub.HandleWebSocket)

	// Main multiplexer for gRPC, gRPC-Web, HTTP, and WebSockets
	mainHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Check for gRPC-Web requests (HTTP/1.1)
		if grpcWebServer.IsGrpcWebRequest(r) {
			grpcWebServer.ServeHTTP(w, r)
			return
		}

		// Check for native gRPC requests (HTTP/2)
		if r.ProtoMajor == 2 && strings.HasPrefix(r.Header.Get("Content-Type"), "application/grpc") {
			grpcServer.ServeHTTP(w, r)
			return
		}

		// Fallback to httpRouter for REST and WebSockets
		httpRouter.ServeHTTP(w, r)
	})

	// Wrap the main multiplexer in h2c
	// this is because gRPC requires HTTP/2, but we also want to support HTTP/1.1 for REST and WebSockets
	h2cHandler := h2c.NewHandler(mainHandler, &http2.Server{})

	const serverAddr = "0.0.0.0:8100"

	server := &http.Server{
		Addr:    serverAddr,
		Handler: h2cHandler,
	}

	go func() {
		log.Println("Starting Unified HTTP, WebSocket, and gRPC server on", serverAddr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Graceful shutdown
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	<-sigs

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
	log.Println("Shutdown complete.")
}
