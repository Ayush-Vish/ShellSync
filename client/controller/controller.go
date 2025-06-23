package controller

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"os/user"
	"strconv"
	"strings"
	"sync"

	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"github.com/creack/pty"
	"github.com/google/uuid"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Agent struct {
	ptys map[string]*os.File
	mu   sync.RWMutex
}

func NewAgent() *Agent {
	return &Agent{
		ptys: make(map[string]*os.File),
	}
}

func (a *Agent) spawnNewPty(ctx context.Context, stream pb.ShellSync_StreamClient) error {
	terminalID := "term-" + uuid.New().String()[:8]
	shell := "/bin/bash"
	cmd := exec.CommandContext(ctx, shell)

	ptmx, err := pty.Start(cmd)
	if err != nil {
		log.Printf("Agent: Failed to start PTY for new terminal %s: %v", terminalID, err)
		return err
	}
	log.Printf("Agent: New PTY started with ID: %s", terminalID)

	a.mu.Lock()
	a.ptys[terminalID] = ptmx
	a.mu.Unlock()

	go func() {
		defer func() {
			a.mu.Lock()
			ptmx.Close()
			delete(a.ptys, terminalID)
			a.mu.Unlock()
			log.Printf("Agent: Cleaned up PTY for terminal %s", terminalID)
		}()

		buffer := make([]byte, 1024*1024)
		for {
			n, err := ptmx.Read(buffer)
			if n > 0 {
				outputMsg := &pb.ClientUpdate{
					Payload: &pb.ClientUpdate_PtyOutput{
						PtyOutput: &pb.TerminalOutput{
							TerminalId: terminalID,
							Data:       buffer[:n],
						},
					},
				}

				if sendErr := stream.Send(outputMsg); sendErr != nil {
					log.Printf("Agent: Failed to send PTY output for %s: %v", terminalID, sendErr)
					return
				}
			}
			if err != nil {
				if err != io.EOF {
					log.Printf("Agent: Error reading from PTY %s: %v", terminalID, err)
				}
				return
			}
		}
	}()

	creationResp := &pb.ClientUpdate{
		Payload: &pb.ClientUpdate_TerminalCreatedResponse{
			TerminalCreatedResponse: &pb.TerminalCreatedResponse{TerminalId: terminalID},
		},
	}
	// This call is also now correct.
	return stream.Send(creationResp)
}

func startStream(client pb.ShellSyncClient, sessionID string) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	stream, err := client.Stream(ctx)
	if err != nil {
		return err
	}
	log.Println("Stream started")

	initialMsg := &pb.ClientUpdate{
		Payload: &pb.ClientUpdate_InitialMessage{
			InitialMessage: &pb.InitialAgentMessage{SessionId: sessionID},
		},
	}
	if err := stream.Send(initialMsg); err != nil {
		return fmt.Errorf("agent: failed to send initial session ID message: %w", err)
	}

	agent := NewAgent()

	if err := agent.spawnNewPty(ctx, stream); err != nil {
		return fmt.Errorf("agent: failed to spawn initial terminal: %w", err)
	}

	for {

		msgFromServer, err := stream.Recv()
		if err != nil {
			if ctx.Err() != nil {
				log.Println("Agent: Context cancelled, stopping.")
			} else if err == io.EOF {
				log.Println("Agent: Server closed the stream.")
			} else {
				log.Printf("Agent: Failed to receive from server: %v", err)
			}
			return err
		}

		switch payload := msgFromServer.Payload.(type) {
		case *pb.ServerUpdate_PtyInput:
			input := payload.PtyInput
			agent.mu.RLock()
			ptmx, ok := agent.ptys[input.GetTerminalId()]
			agent.mu.RUnlock()

			if ok {
				if _, writeErr := ptmx.Write(input.GetData()); writeErr != nil {
					log.Printf("Agent: Failed to write to PTY %s: %v", input.GetTerminalId(), writeErr)
				}
			} else {
				log.Printf("Agent: Received input for unknown terminal ID: %s", input.GetTerminalId())
			}

		case *pb.ServerUpdate_CreateTerminalRequest:
			log.Println("Agent: Received request to create a new terminal.")

			if err := agent.spawnNewPty(ctx, stream); err != nil {
				log.Printf("Agent: Failed to spawn new terminal on request: %v", err)
			}

		case *pb.ServerUpdate_ServerHello:
			log.Printf("Agent: Server says: %s", payload.ServerHello)
		}
	}
}

func Start(host string, port int) {
	serverUrl := host + ":" + strconv.Itoa(port)
	conn, err := grpc.NewClient(serverUrl, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Failed to connect to gRPC server: %v", err)
	}
	defer conn.Close()

	client := pb.NewShellSyncClient(conn)

	var agentName string
	username, err := user.Current()
	if err != nil {
		agentName = "unknown-agent"
	} else {
		hostname, _ := os.Hostname()
		agentName = fmt.Sprintf("%s@%s", username.Username, strings.SplitN(hostname, ".", 2)[0])
	}

	resp, err := client.CreateSession(context.Background(), &pb.CreateRequest{
		Host: agentName,
	})
	if err != nil {
		log.Fatalf("Session creation failed: %v", err)
	}
	log.Printf("Session %s created successfully.", resp.GetSessionId())
	fmt.Printf("\nShare this URL:\n  ► %s ◄\n\n", resp.GetFrontendUrl())

	if err := startStream(client, resp.GetSessionId()); err != nil {
		log.Fatalf("Stream failed: %v", err)
	}
}
