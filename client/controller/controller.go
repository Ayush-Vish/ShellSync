package controller

import (
	"context"
	"fmt"
	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"log"
	"os"
	"os/user"
	"strconv"
	"strings"
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
	var name string
	username, err := user.Current()
	if err != nil {
		log.Fatal(err)
		return
	}

	hostname, err := os.Hostname()
	if err == nil {
		host := strings.SplitN(hostname, ".", 2)[0]
		name = username.Username + "@" + host
	} else {
		name = username.Username
	}

	// Create new session
	resp, err := client.CreateSession(context.Background(), &pb.CreateRequest{
		Host: name,
	})
	if err != nil {
		log.Fatalf("Session creation failed: %v", err)
	}
	commands := []string{"ls"}

	if err := Terminal(commands); err != nil {
		log.Fatalf(err.Error())
	}
	if err != nil {
		log.Fatal(err)
	}
	//fmt.Print(op)

	fmt.Printf("\nSession created! Share this URL:\n\n")
	fmt.Printf("  ► %s ◄\n\n", resp.FrontendUrl)

}
