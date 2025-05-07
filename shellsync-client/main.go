package main

import (
	"fmt"
	"log"
	"net"
	"google.golang.org/grpc"
)
func main()  {
	list, err := net.Listen("tcp", ":8080")
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
	grpcServer := grpc.NewServer()

	if  err := grpcServer.Serve(list); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
	

}
