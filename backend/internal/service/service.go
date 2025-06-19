package service

import (
	"context"
	"fmt"
	"github.com/Ayush-Vish/shellsync/backend/internal/websocket"

	"io"
	"log"

	"sync"
	"time"

	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"github.com/Ayush-Vish/shellsync/backend/internal/types"
	"github.com/google/uuid"
)

type PtyOutputBroadcaster interface {
	BroadcastToSession(sessionID string, message types.Message)
}
type websocketMessage = types.Message

type ShellSyncService struct {
	pb.UnimplementedShellSyncServer
	sessions map[string]*types.Session
	mu       sync.RWMutex
	hub      PtyOutputBroadcaster // Reference to the WebSocket hub
}

func NewShellSyncService() *ShellSyncService {
	return &ShellSyncService{
		sessions: make(map[string]*types.Session),
	}
}
func (s *ShellSyncService) SetHub(hub *websocket.Hub) {
	s.hub = hub
}
func (s *ShellSyncService) CreateSession(ctx context.Context, req *pb.CreateRequest) (*pb.CreateResponse, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	sessionID := uuid.New().String()[:8]
	session := &types.Session{
		ID:             sessionID,
		Host:           req.Host,
		Clients:        make(map[string]*types.Client),
		CreatedAt:      time.Now(),
		AgentInputChan: make(chan []byte, 20), // Buffered channel for commands
	}
	s.sessions[sessionID] = session

	log.Printf("Created session: %s for host: %s", sessionID, req.Host)
	frontendClientID := "user-" + uuid.New().String()[:5]
	return &pb.CreateResponse{
		SessionId:   sessionID,
		FrontendUrl: fmt.Sprintf("http://localhost:3000/ws/%s?client_id=%s", sessionID, frontendClientID),
	}, nil
}

func (s *ShellSyncService) Stream(stream pb.ShellSync_StreamServer) error {
	log.Println("Server: New agent stream connected. Waiting for initial message...")
	ctx := stream.Context()

	// 1. Agent MUST send its session id in the first message
	initialMsg, err := stream.Recv()
	if err != nil {
		log.Printf("Failed to receive initial message from agent: %v", err)
		return err
	}

	// Check the payload for the initial message
	initPayload := initialMsg.GetInitialMessage()
	if initPayload == nil {
		return fmt.Errorf("agent's first message was not InitialAgentMessage")
	}
	sessionID := initPayload.GetSessionId()

	// 2. Find the session and its command channel.
	s.mu.RLock()
	session, exists := s.sessions[sessionID]
	s.mu.RUnlock()
	if !exists {
		return fmt.Errorf("session %s not found for connecting agent", sessionID)
	}
	log.Printf("Agent successfully associated with session %s", sessionID)

	// Goroutine => forward PTY output from Agent -> WebSocket Hub
	go func() {
		for {
			msgFromAgent, err := stream.Recv()
			if err != nil {
				if err != io.EOF {
					log.Printf("Error receiving PTY output from agent for session %s: %v", sessionID, err)
				}
				return // Stop on any error
			}
			if outputData := msgFromAgent.GetPtyOutput(); outputData != nil {
				if s.hub != nil {
					// Broadcast the output to all frontend clients in the session.
					message := types.Message{
						Type:    "pty_output",
						Content: string(outputData),
						Sender:  "pty_agent",
					}
					s.hub.BroadcastToSession(sessionID, message)
				}
			}
		}
	}()

	// Goroutine => forward commands from WebSocket Hub -> Agent
	for {
		select {
		case <-ctx.Done():
			log.Printf("Agent for session %s disconnected.", sessionID)
			close(session.AgentInputChan) // Clean up the channel
			return ctx.Err()
		case inputData := <-session.AgentInputChan:
			err := stream.Send(&pb.ServerUpdate{
				Payload: &pb.ServerUpdate_PtyInput{PtyInput: inputData},
			})
			if err != nil {
				log.Printf("Error sending input to agent for session %s: %v", sessionID, err)
				return err
			}
		}
	}
}

// ForwardInputToAgent is called by the Hub.
func (s *ShellSyncService) ForwardInputToAgent(sessionID string, input []byte) {
	s.mu.RLock()
	session, exists := s.sessions[sessionID]
	s.mu.RUnlock()

	if !exists {
		return
	}
	select {
	case session.AgentInputChan <- input:
	default:
		log.Printf("Agent input channel for session %s is full. Input dropped.", sessionID)
	}
}

func (s *ShellSyncService) GetSession(sessionID string) (*types.Session, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	session, exists := s.sessions[sessionID]
	return session, exists
}
func (s *ShellSyncService) AddClientToSession(sessionID, clientID string) bool {
	return true
}
func (s *ShellSyncService) GetSessions() []*types.Session {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var sessions []*types.Session
	for _, s := range s.sessions {
		sessions = append(sessions, s)
	}
	return sessions
}
