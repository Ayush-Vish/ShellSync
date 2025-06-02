package service

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"sync"
	"time"

	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"github.com/google/uuid"
)

type Client struct {
	ID   string
	Name string
	//Conn     *websocket.Hub
	LastSeen time.Time
}

type Session struct {
	ID        string
	Name      string
	Host      string // Host machine address
	CreatedAt time.Time
	LastSeen  time.Time
	Clients   map[string]*Client // Connected client IDs
	mu        sync.Mutex
}

type ShellSyncService struct {
	pb.UnimplementedShellSyncServer
	sessions map[string]*Session
	mu       sync.RWMutex
}

func NewShellSyncService() *ShellSyncService {
	return &ShellSyncService{
		sessions: make(map[string]*Session),
	}
}
func (s *ShellSyncService) Stream(stream pb.ShellSync_StreamServer) error {
	log.Println("Server: New agent stream connected.")
	ctx := stream.Context()
	// for goroutine exuit
	doneSignal := make(chan struct{})
	defer close(doneSignal)
	// Read from the agent pty op and print it

	go func() {
		for {
			msgfromagent, err := stream.Recv()
			if err != nil {
				if ctx.Err() != nil { // Check if context was cancelled
					log.Println("Server: Agent->Console: Context cancelled, stopping.")
				} else if err == io.EOF {
					log.Println("Server: Agent->Console: Agent closed the stream.")
				} else {
					log.Printf("Server: Agent->Console: Failed to receive from agent: %v", err)
				}
				return // Stop this goroutine
			}
			if outputData := msgfromagent.GetPtyOutput(); outputData != nil {
				fmt.Print(string(outputData))

			} else if agentHello := msgfromagent.GetClientHello(); agentHello != "" {
				log.Println("Server: Agent->Console: Client Hello:", agentHello)
				if err := stream.Send(&pb.ServerUpdate{
					Payload: &pb.ServerUpdate_ServerHello{ServerHello: "Server acknowledges agent!"},
				}); err != nil {
					log.Printf("Server: Failed to send server hello to agent: %v", err)
				}
			}

		}

	}()

	// read from the server and stdin and send to agent -> later replaced by websocket
	go func() {
		log.Println("Server: Reading commands from file to send to the agent's PTY.")

		// Open the file (replace "commands.txt" with your filename)
		file, err := os.Open("commands.txt")
		if err != nil {
			log.Fatalf("Server: Failed to open command file: %v", err)
			return
		}
		defer file.Close()

		scanner := bufio.NewScanner(file)

		for {
			select {
			case <-doneSignal:
				log.Println("Server: Console->Agent: Stream closed, stopping file read.")
				return

			default:
				if !scanner.Scan() {
					if err := scanner.Err(); err != nil {
						log.Printf("Server: Console->Agent: Error reading from file: %v", err)
					} else {
						log.Println("Server: Console->Agent: End of file reached.")
					}
					return
				}

				line := scanner.Text()
				err := stream.Send(&pb.ServerUpdate{
					Payload: &pb.ServerUpdate_PtyInput{PtyInput: []byte(line + "\n")},
				})
				if err != nil {
					if ctx.Err() == nil {
						log.Printf("Server: Console->Agent: Failed to send PTY input to agent: %v", err)
					}
					return
				}
				time.Sleep(500 * time.Millisecond) // Optional: slow down sending
			}
		}
	}()

	//go func() {
	//	log.Println("Server: Type commands here to send to the agent's PTY. Ctrl+D on a new line to close this input stream.")
	//	scanner := bufio.NewScanner(os.Stdin)
	//	for {
	//		select {
	//		case <-doneSignal:
	//			log.Println("Server: Console->Agent: Stream closed, stopping stdin read.")
	//			return
	//
	//		default:
	//			if scanner.Scan() {
	//				if err := scanner.Err(); err != nil {
	//					log.Printf("Server: Console->Agent: Error reading server stdin: %v", err)
	//				} else {
	//					log.Println("Server: Console->Agent: Server stdin closed (EOF).")
	//				}
	//				return // St
	//			}
	//			line := scanner.Text()
	//			// Send command with a newline for shell execution
	//			err := stream.Send(&pb.ServerUpdate{
	//				Payload: &pb.ServerUpdate_PtyInput{PtyInput: []byte(line + "\n")},
	//			})
	//			if err != nil {
	//				if ctx.Err() == nil { // Only log if context isn't already done
	//					log.Printf("Server: Console->Agent: Failed to send PTY input to agent: %v", err)
	//				}
	//				return // Stop this goroutine if send fails
	//			}
	//		}
	//
	//	}
	//}()
	<-ctx.Done() // Keep handler alive until stream context is done
	log.Printf("Server: Agent stream disconnected: %v", ctx.Err())
	return ctx.Err()

}
func (s *ShellSyncService) CreateSession(ctx context.Context, req *pb.CreateRequest) (*pb.CreateResponse, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	sessionID := uuid.New().String()[:8]
	hostUserId := uuid.New().String()[:8]

	session := &Session{
		ID:        sessionID,
		Host:      req.Host,
		Clients:   map[string]*Client{},
		CreatedAt: time.Now(),
	}
	hostName := req.Host

	session.Clients[hostUserId] = &Client{
		ID:       hostUserId,
		Name:     hostName,
		LastSeen: time.Now(),
	}

	s.sessions[sessionID] = session

	log.Printf("Created session: %s by admin: %s ", sessionID, req.GetHost())

	return &pb.CreateResponse{
		SessionId:   sessionID,
		FrontendUrl: fmt.Sprintf("http://localhost:3000/s/%s?client_id=%s", sessionID, req.GetHost()),
	}, nil
}

func (s *ShellSyncService) GetSession(sessionID string) (*Session, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	session, exists := s.sessions[sessionID]
	if exists {
		log.Printf("Session %s found", sessionID)
	} else {
		log.Printf("Session %s not found", sessionID)
	}
	return session, exists
}
func (s *ShellSyncService) GetSessions() []*Session {
	s.mu.RLock()
	defer s.mu.RUnlock()

	sessions := make([]*Session, 0, len(s.sessions))
	for _, session := range s.sessions {
		sessions = append(sessions, session)
	}

	log.Printf("Retrieved %d sessions", len(sessions))

	return sessions
}

//func (s *ShellSyncService) AddClientToSession(sessionID, clientID string) bool {
//	s.mu.Lock()
//	defer s.mu.Unlock()
//
//	session, exists := s.sessions[sessionID]
//	if !exists {
//		log.Printf("Failed to add client %s: session %s not found", clientID, sessionID)
//		return false
//	}
//
//	session.mu.Lock()
//	defer session.mu.Unlock()
//
//	session.Clients[clientID] = &Client{
//		ID:       clientID,
//		IsAdmin:  false,
//		LastSeen: time.Now(),
//	}
//
//	log.Printf("Added client %s to session %s", clientID, sessionID)
//
//	return true
//}
