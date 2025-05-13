package main

import (
	"log"
	"net"

		"google.golang.org/grpc"

	pb "github.com/ayush-Vish/shellSync/shellsync_core/pb/proto"
)

type server struct {
	pb.UnimplementedHelloServiceServer
}

func main() {
	conn, err := net.Listen("tcp", ":2222")
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
	s := grpc.NewServer()
	pb.HelloService(s, &server{})
	log.Printf(" Grpc Server started on port %s", "2222")
	if err := s.Serve(conn); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
	defer conn.Close()
}
