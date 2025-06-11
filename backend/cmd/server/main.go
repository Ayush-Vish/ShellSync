package main

import (
	"context"
	"encoding/json"
	"github.com/Ayush-Vish/shellsync/backend/internal/websocket"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"github.com/Ayush-Vish/shellsync/backend/internal/service"
	"github.com/gorilla/mux"
	"google.golang.org/grpc"
)

func main() {
	// Initialize services
	shellService := service.NewShellSyncService()
	wsHub := websocket.NewHub(shellService)

	// Start WebSocket hub
	go wsHub.Run()

	// Setup gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterShellSyncServer(grpcServer, shellService)

	go func() {
		lis, err := net.Listen("tcp", ":5000")
		if err != nil {
			log.Fatalf("Failed to listen: %v", err)
		}
		log.Println("gRPC server started on http://localhost:5000")
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("gRPC server failed: %v", err)
		}
	}()

	// Setup HTTP server
	r := mux.NewRouter()
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("This is a test message"))
	})
	//r.HandleFunc("/ws", wsHub.HandleWebSocket)
	r.HandleFunc("/s", func(w http.ResponseWriter, r *http.Request) {
		sessions := shellService.GetSessions()
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(sessions); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

	})
	r.HandleFunc("/ws", wsHub.HandleWebSocket)
	httpServer := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	go func() {
		log.Println("HTTP server started on http://localhost:8080")
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	// Wait for termination signal
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	<-sigs

	log.Println("Shutting down servers...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Stop HTTP server
	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("HTTP server shutdown error: %v", err)
	}

	// Stop gRPC server
	grpcServer.GracefulStop()

	log.Println("Shutdown complete.")
}
