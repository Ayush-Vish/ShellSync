package server

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func Start(host string, port int) {
	serverUrl := host + ":" + strconv.Itoa(port)
	conn, err := grpc.NewClient(serverUrl, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect to gRPC server at localhost:5000: %v", err)
	}
	// defer conn.Close()
	if err != nil {
		log.Fatalf("Connection failed: %v", err)
	}
	defer conn.Close()

	client := pb.NewShellSyncClient(conn)

	// Create new session
	resp, err := client.CreateSession(context.Background(), &pb.CreateRequest{
		Host:     "localhost",
		ClientId: generateClientID(),
	})
	if err != nil {
		log.Fatalf("Session creation failed: %v", err)
	}

	fmt.Printf("\nSession created! Share this URL:\n\n")
	fmt.Printf("  ► %s ◄\n\n", resp.FrontendUrl)

}
func generateClientID() string {
	return fmt.Sprintf("client-%d", time.Now().UnixNano())
}
