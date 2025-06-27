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
	"github.com/soheilhy/cmux"

	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"github.com/Ayush-Vish/shellsync/backend/internal/service"
	"github.com/Ayush-Vish/shellsync/backend/internal/websocket"
)

func main() {
	shellService := service.NewShellSyncService()
	wsHub := websocket.NewHub(shellService)
	shellService.SetHub(wsHub)

	lis, err := net.Listen("tcp", ":5000")
	if err != nil {
		log.Fatalf("Failed to listen on :5000: %v", err)
	}

	m := cmux.New(lis)

	grpcL := m.MatchWithWriters(cmux.HTTP2MatchHeaderFieldSendSettings("content-type", "application/grpc"))

	httpL := m.Match(cmux.HTTP1Fast())

	grpcServer := grpc.NewServer()
	pb.RegisterShellSyncServer(grpcServer, shellService)

	r := mux.NewRouter()
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ShellSync Backend is Running!"))
	})
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
		Handler: r,
	}

	go func() {
		log.Println("Starting gRPC server on shared port :5000")
		if err := grpcServer.Serve(grpcL); err != nil {
			log.Fatalf("gRPC server failed: %v", err)
		}
	}()

	go func() {
		log.Println("Starting HTTP server on shared port :5000")
		if err := httpServer.Serve(httpL); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server failed: %v", err)
		}
	}()

	go func() {
		if err := m.Serve(); err != nil {
			log.Fatalf("cmux serve error: %v", err)
		}
	}()

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	<-sigs

	log.Println("Shutting down servers...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("HTTP server shutdown error: %v", err)
	}
	grpcServer.GracefulStop()
	log.Println("Shutdown complete.")
}
