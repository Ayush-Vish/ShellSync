package main

import (
	"context"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"google.golang.org/grpc"

	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"github.com/Ayush-Vish/shellsync/backend/internal/service"
	"github.com/Ayush-Vish/shellsync/backend/internal/websocket"
)

func main() {
	// Initialize ShellSync service and WebSocket hub
	shellService := service.NewShellSyncService()
	wsHub := websocket.NewHub(shellService)
	shellService.SetHub(wsHub)

	// gRPC server on :5001
	go func() {
		grpcLis, err := net.Listen("tcp", ":5001")
		if err != nil {
			log.Fatalf("Failed to listen on :5001: %v", err)
		}
		grpcServer := grpc.NewServer()
		pb.RegisterShellSyncServer(grpcServer, shellService)

		log.Println("Starting gRPC server on port :5001")
		if err := grpcServer.Serve(grpcLis); err != nil {
			log.Fatalf("gRPC server failed: %v", err)
		}
	}()

	// HTTP server on :5000
	r := mux.NewRouter()
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ShellSync Backend is Running!"))
	})
	r.HandleFunc("/s", func(w http.ResponseWriter, r *http.Request) {
		sessions := shellService.GetSessions()
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(sessions); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})
	r.HandleFunc("/ws", wsHub.HandleWebSocket)

	httpServer := &http.Server{
		Addr:    ":5000",
		Handler: r,
	}

	go func() {
		log.Println("Starting HTTP server on port :5000")
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server failed: %v", err)
		}
	}()

	// Graceful shutdown
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	<-sigs

	log.Println("Shutting down HTTP server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("HTTP server shutdown error: %v", err)
	}
	log.Println("Shutdown complete.")
}
