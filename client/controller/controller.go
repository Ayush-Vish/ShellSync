package controller

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"os/user"
	"runtime"
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
	ptys        map[string]*os.File
	terminalMap map[string]string
	mu          sync.RWMutex
}

func NewAgent() *Agent {
	return &Agent{
		ptys:        make(map[string]*os.File),
		terminalMap: make(map[string]string),
	}
}

func getDefaultShell(ctx context.Context) *exec.Cmd {
	var shell string
	var args []string

	switch runtime.GOOS {
	case "windows":
		shell = os.Getenv("COMSPEC")
		if shell == "" {
			shell = "cmd.exe"
		}
		args = []string{}
	default:
		// Unix-like systems
		shell = os.Getenv("SHELL")
		if shell == "" {
			shell = "/bin/bash" // fallback
		}
		args = []string{}
	}

	return exec.CommandContext(ctx, shell, args...)
}

func (a *Agent) resizePty(terminalID string, cols uint32, rows uint32) error {
	a.mu.RLock()
	localID, found := a.terminalMap[terminalID]
	ptmx, ok := a.ptys[localID]
	a.mu.RUnlock()

	if !found || !ok {
		return fmt.Errorf("terminal %s not found", terminalID)
	}

	size := &pty.Winsize{
		Cols: uint16(cols),
		Rows: uint16(rows),
	}
	fmt.Println("Agent: Resizing terminal", terminalID, "to", cols, "x", rows)

	if err := pty.Setsize(ptmx, size); err != nil {
		return fmt.Errorf("failed to resize PTY: %w", err)
	}

	log.Printf("Agent: Resized terminal %s (local ID: %s) to %dx%d",
		terminalID, localID, cols, rows)
	return nil
}

func (a *Agent) spawnNewPty(ctx context.Context, stream pb.ShellSync_StreamClient, backendID string) error {
	localID := "term-" + uuid.New().String()[:8]

	cmd := getDefaultShell(ctx)

	ptmx, err := pty.Start(cmd)

	if err != nil {
		log.Printf("Agent: Failed to start PTY for terminal %s: %v", backendID, err)
		errorMsg := &pb.ClientUpdate{
			Payload: &pb.ClientUpdate_TerminalError{
				TerminalError: &pb.TerminalError{
					TerminalId: backendID,
					Error:      err.Error(),
				},
			},
		}
		if sendErr := stream.Send(errorMsg); sendErr != nil {
			log.Printf("Agent: Failed to send terminal error for %s: %v", backendID, sendErr)
		}
		return err
	}
	log.Printf("Agent: New PTY started with ID: %s (maps to backend ID: %s)", localID, backendID)

	initialSize := &pty.Winsize{
		Cols: 80,
		Rows: 24,
	}
	if err := pty.Setsize(ptmx, initialSize); err != nil {
		log.Printf("Agent: Failed to set initial PTY size for terminal %s: %v", backendID, err)
	}

	psize, err := pty.GetsizeFull(ptmx)
	if err != nil {
		log.Printf("Agent: Failed to get PTY size for terminal %s: %v", backendID, err)
	} else {
		log.Printf("PTY Size: Cols=%d, Rows=%d", psize.Cols, psize.Rows)
	}

	a.mu.Lock()
	a.ptys[localID] = ptmx
	a.terminalMap[backendID] = localID
	a.mu.Unlock()

	go func() {
		defer func() {
			a.mu.Lock()
			ptmx.Close()
			delete(a.ptys, localID)
			delete(a.terminalMap, backendID)
			a.mu.Unlock()
			log.Printf("Agent: Cleaned up PTY for terminal %s (backend ID %s)", localID, backendID)
		}()

		buffer := make([]byte, 1024*1024)
		for {
			n, err := ptmx.Read(buffer)
			if n > 0 {
				outputMsg := &pb.ClientUpdate{
					Payload: &pb.ClientUpdate_PtyOutput{
						PtyOutput: &pb.TerminalOutput{
							TerminalId: backendID,
							Data:       buffer[:n],
						},
					},
				}
				if sendErr := stream.Send(outputMsg); sendErr != nil {
					log.Printf("Agent: Failed to send PTY output for %s: %v", backendID, sendErr)
					return
				}
			}
			if err != nil {
				if err != io.EOF {
					log.Printf("Agent: Error reading from PTY %s: %v", backendID, err)
				}
				return
			}
		}
	}()

	creationResp := &pb.ClientUpdate{
		Payload: &pb.ClientUpdate_TerminalCreatedResponse{
			TerminalCreatedResponse: &pb.TerminalCreatedResponse{TerminalId: backendID},
		},
	}
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

	defaultBackendID := "term-" + uuid.New().String()[:8]
	if err := agent.spawnNewPty(ctx, stream, defaultBackendID); err != nil {
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
			localID, found := agent.terminalMap[input.GetTerminalId()]
			ptmx, ok := agent.ptys[localID]
			agent.mu.RUnlock()

			if found && ok {
				if _, writeErr := ptmx.Write(input.GetData()); writeErr != nil {
					log.Printf("Agent: Failed to write to PTY %s (backend ID %s): %v", localID, input.GetTerminalId(), writeErr)
				}
			} else {
				log.Printf("Agent: Received input for unknown terminal ID: %s", input.GetTerminalId())
			}

		case *pb.ServerUpdate_CreateTerminalRequest:
			backendID := payload.CreateTerminalRequest.GetTerminalId()
			if backendID == "" {
				backendID = "term-" + uuid.New().String()[:8]
			}
			log.Printf("Agent: Received request to create terminal with backend ID: %s", backendID)
			if err := agent.spawnNewPty(ctx, stream, backendID); err != nil {
				log.Printf("Agent: Failed to spawn new terminal: %v", err)
			}

		case *pb.ServerUpdate_ResizeTerminal:
			resize := payload.ResizeTerminal
			log.Printf("Agent: Received resize request for terminal %s: %dx%d",
				resize.GetTerminalId(), resize.GetCols(), resize.GetRows())

			if err := agent.resizePty(resize.GetTerminalId(), resize.GetCols(), resize.GetRows()); err != nil {
				log.Printf("Agent: Failed to resize terminal %s: %v", resize.GetTerminalId(), err)

				errorMsg := &pb.ClientUpdate{
					Payload: &pb.ClientUpdate_TerminalError{
						TerminalError: &pb.TerminalError{
							TerminalId: resize.GetTerminalId(),
							Error:      fmt.Sprintf("Resize failed: %v", err),
						},
					},
				}
				if sendErr := stream.Send(errorMsg); sendErr != nil {
					log.Printf("Agent: Failed to send resize error: %v", sendErr)
				}
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
	fmt.Printf("\n╔════════════════════════════════════════════════════════════╗\n")
	fmt.Printf("║                   SESSION CREATED                          ║\n")
	fmt.Printf("╠════════════════════════════════════════════════════════════╣\n")
	fmt.Printf("║  Session ID: %-45s ║\n", resp.GetSessionId())
	fmt.Printf("║  Password:   %-45s ║\n", resp.GetPassword())
	fmt.Printf("║  Host name to Write in frontend: %-25s ║\n", agentName)
	fmt.Printf("╠════════════════════════════════════════════════════════════╣\n")
	fmt.Printf("║  Share this URL with collaborators:                        ║\n")
	fmt.Printf("║  ► %-54s  ║\n", resp.GetFrontendUrl())
	fmt.Printf("╠════════════════════════════════════════════════════════════╣\n")
	fmt.Printf("║  ⚠️  Keep the password secure!                              ║\n")
	fmt.Printf("║  Only share it with trusted collaborators.                 ║\n")
	fmt.Printf("╚════════════════════════════════════════════════════════════╝\n\n")

	if err := startStream(client, resp.GetSessionId()); err != nil {
		log.Fatalf("Stream failed: %v", err)
	}
}
