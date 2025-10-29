package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings" // Added import
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
	// Initialize ShellSync service and WebSocket hub
	shellService := service.NewShellSyncService()
	wsHub := websocket.NewHub(shellService)
	shellService.SetHub(wsHub)

	// Set up gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterShellSyncServer(grpcServer, shellService)

	// Set up HTTP/WebSocket router
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

	grpcWebServer := grpcweb.WrapServer(grpcServer,
		grpcweb.WithOriginFunc(func(origin string) bool { return true }),
	)

	httpRouter.PathPrefix("/grpc/").Handler(grpcWebServer)

	mainHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.ProtoMajor == 2 && strings.HasPrefix(r.Header.Get("Content-Type"), "application/grpc") {
			grpcServer.ServeHTTP(w, r)
		} else {
			httpRouter.ServeHTTP(w, r)
		}
	})

	h2cHandler := h2c.NewHandler(mainHandler, &http2.Server{})

	const serverAddr = "[::]:8100"

	server := &http.Server{
		Addr:         serverAddr,
		Handler:      h2cHandler,
		ReadTimeout:  30 * time.Second,  // Prevent slowloris attacks
		WriteTimeout: 30 * time.Second,  // Prevent hanging writes
		IdleTimeout:  120 * time.Second, // Close idle connections
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
