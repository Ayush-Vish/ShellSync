package controller

import (
	"context"
	"fmt"
	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"github.com/creack/pty"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"io"
	"log"
	"os"
	"os/exec"
	"os/user"
	"strconv"
	"strings"
)

func startStream(client pb.ShellSyncClient) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	stream, err := client.Stream(ctx)
	if err != nil {
		return err
	}
	log.Println("Stream started")

	shell := "/usr/bin/bash"
	cmd := exec.CommandContext(ctx, shell)
	ptmx, err := pty.Start(cmd)
	if err != nil {
		log.Fatalf("Agent: Failed to start PTY with shell %s: %v", shell, err)
	}
	defer ptmx.Close()
	log.Printf("Agent: Local PTY started with shell: %s", shell)

	////////////// // Goroutine: Read from PTY and send to Server    / ///////////////////////
	go func() {
		buffer := make([]byte, 1024*1024)
		for {
			n, err := ptmx.Read(buffer)
			if n > 0 {
				err := stream.Send(&pb.ClientUpdate{Payload: &pb.ClientUpdate_PtyOutput{
					PtyOutput: buffer[:n],
				}})
				if err != nil {
					log.Printf("Agent: Failed to send PTY: %v", err)
					cancel()
					return
				}
			}
			if err != nil {
				if err != io.EOF {
					log.Printf("Agent: PTY->Server: Error reading from PTY: %v", err)

				} else {
					log.Println("Agent: PTY->Server: PTY closed (EOF).")
				}
				cancel()
				stream.CloseSend() // Important: Notify server we're done sending
				return
			}
		}
	}()
	///////////////////////
	// Goroutine: Read from Server and write to PTY

	go func() {
		for {
			msgfromserver, err := stream.Recv()
			if err != nil {
				if ctx.Err() != nil { // Check if context was cancelled
					log.Println("Agent: Server->PTY: Context cancelled, stopping.")
				} else if err == io.EOF {
					log.Println("Agent: Server->PTY: Server closed the stream.")
				} else {
					log.Printf("Agent: Server->PTY: Failed to receive from server: %v", err)
				}
				cancel()
				return
			}

			if inputdata := msgfromserver.GetPtyInput(); inputdata != nil {
				if _, writeErr := ptmx.Write(inputdata); writeErr != nil {
					log.Printf("Agent: Server->PTY: Failed to write to PTY: %v", writeErr)
					cancel()
					return
				}
			} else if serverHello := msgfromserver.GetServerHello(); serverHello != "" {
				log.Printf("Agent: Server says: %s", serverHello)
			}
		}
	}()
	agentHostname, _ := os.Hostname()
	helloMsg := fmt.Sprintf("Agent online from %s", agentHostname)
	if err := stream.Send(&pb.ClientUpdate{Payload: &pb.ClientUpdate_ClientHello{ClientHello: helloMsg}}); err != nil {
		log.Printf("Agent: Failed to send agent hello: %v", err)
		cancel() // If we can't even say hello, cancel the operation
	}
	shellExitErr := cmd.Wait()
	cancel()                                     // Ensure everything is signalled to stop once shell exits or an error occurs
	if shellExitErr != nil && ctx.Err() == nil { // Error not due to our cancellation
		log.Printf("Agent: Shell exited with error: %v", shellExitErr)
	} else if ctx.Err() != nil {
		log.Println("Agent: Shutting down due to context cancellation.")
	} else {
		log.Println("Agent: Shell exited gracefully.")
	}
	log.Println("PTY Agent finished.")
	return nil
}
func CreateSession(client pb.ShellSyncClient) error {
	var name string
	username, err := user.Current()
	if err != nil {
		log.Fatal(err)
		return err
	}

	hostname, err := os.Hostname()
	if err == nil {
		host := strings.SplitN(hostname, ".", 2)[0]
		name = username.Username + "@" + host
	} else {
		name = username.Username
	}
	resp, err := client.CreateSession(context.Background(), &pb.CreateRequest{
		Host: name,
	})
	if err != nil {
		log.Fatalf("Session creation failed: %v", err)
		return err
	}

	fmt.Printf("\nSession created! Share this URL:\n\n")
	fmt.Printf("  ► %s ◄\n\n", resp.FrontendUrl)
	log.Println("strting Srtreaming ")
	if err := startStream(client); err != nil {
		log.Fatalf("Stream failed: %v", err)
	}

	return nil
}
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

	if err := CreateSession(client); err != nil {
		log.Fatalf("Session creation failed: %v", err)
	}

	//commands := []string{"ls", "pwd"}
	//if err := Terminal(commands); err != nil {
	//	log.Fatalf(err.Error())
	//}
	//if err != nil {
	//	log.Fatal(err)
	//}

	//fmt.Printf("\nSession created! Share this URL:\n\n")
	//fmt.Printf("  ► %s ◄\n\n", resp.FrontendUrl)

}
