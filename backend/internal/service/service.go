package service

import (
	"context"
	"fmt"
	"math/rand"

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
	hub      types.PtyOutputBroadcaster
}

func NewShellSyncService() *ShellSyncService {
	return &ShellSyncService{
		sessions: make(map[string]*types.Session),
	}
}

func (s *ShellSyncService) SetHub(hub types.PtyOutputBroadcaster) {
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
		Terminals:      make(map[string]*types.Terminal),
		CreatedAt:      time.Now(),
		AgentInputChan: make(chan types.AgentCommand, 20), // Use the new interface type
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
	sessionID := initialMsg.GetInitialMessage().GetSessionId()

	// 2. Find the session and its command channel.
	s.mu.RLock()
	session, exists := s.sessions[sessionID]
	s.mu.RUnlock()
	if !exists {
		return fmt.Errorf("session %s not found for connecting agent", sessionID)
	}
	log.Printf("Agent successfully associated with session %s", sessionID)

	// Goroutine: Read messages from Agent and dispatch them.
	go func() {
		for {
			msgFromAgent, err := stream.Recv()
			if err != nil {
				if err != io.EOF {
					log.Printf("Error receiving from agent for session %s: %v", sessionID, err)
				}
				return // Stop on any error
			}

			// Demultiplex agent messages
			switch payload := msgFromAgent.Payload.(type) {
			case *pb.ClientUpdate_PtyOutput:
				output := payload.PtyOutput
				if s.hub != nil {
					message := types.Message{
						Type:       "pty_output",
						TerminalID: output.GetTerminalId(),
						Content:    string(output.GetData()),
						Sender:     "pty_agent",
					}
					s.hub.BroadcastToSession(sessionID, message)
				}
			case *pb.ClientUpdate_TerminalCreatedResponse:
				resp := payload.TerminalCreatedResponse
				log.Printf("Session [%s]: Agent confirmed creation of terminal [%s]", sessionID, resp.GetTerminalId())
				// Add terminal to session state
				session.Mu.Lock()
				session.Terminals[resp.GetTerminalId()] = &types.Terminal{ID: resp.GetTerminalId(), CreatedAt: time.Now()}
				session.Mu.Unlock()
				// Notify frontend
				message := types.Message{Type: "terminal_created", TerminalID: resp.GetTerminalId()}
				s.hub.BroadcastToSession(sessionID, message)
			}
		}
	}()

	// Goroutine: Read commands from Hub and forward to Agent.
	for {
		select {
		case <-ctx.Done():
			log.Printf("Agent for session %s disconnected.", sessionID)
			close(session.AgentInputChan)
			return ctx.Err()
		case command := <-session.AgentInputChan:
			var serverUpdate *pb.ServerUpdate
			// Multiplex server commands
			switch cmd := command.(type) {
			case types.PtyInputData:
				serverUpdate = &pb.ServerUpdate{
					Payload: &pb.ServerUpdate_PtyInput{
						PtyInput: &pb.TerminalInput{TerminalId: cmd.TerminalID, Data: cmd.Data},
					},
				}
			case types.CreateTerminalCmd:
				serverUpdate = &pb.ServerUpdate{
					Payload: &pb.ServerUpdate_CreateTerminalRequest{
						CreateTerminalRequest: &pb.CreateTerminalRequest{},
					},
				}
			}

			if err := stream.Send(serverUpdate); err != nil {
				log.Printf("Error sending command to agent for session %s: %v", sessionID, err)
				return err
			}
		}
	}
}

func (s *ShellSyncService) ForwardInputToAgent(sessionID, terminalID string, input []byte) {
	s.mu.RLock()
	session, exists := s.sessions[sessionID]
	s.mu.RUnlock()

	if !exists {
		return
	}
	select {
	case session.AgentInputChan <- types.PtyInputData{TerminalID: terminalID, Data: input}:
	default:
		log.Printf("Agent input channel for session %s is full. Input dropped.", sessionID)
	}
}

func (s *ShellSyncService) RequestNewTerminal(sessionID, frontendID string) {
	s.mu.RLock()
	session, ok := s.sessions[sessionID]
	s.mu.RUnlock()

	if !ok {
		log.Printf("Service error: cannot create terminal for non-existent session %s", sessionID)

		if s.hub != nil {
			errorMsg := types.Message{
				Type:       "terminal_error",
				FrontendID: frontendID,
				Error:      "Session not found",
				Sender:     "pty_agent",
			}
			s.hub.BroadcastToSession(sessionID, errorMsg)
		}
		return
	}

	go func() {
		log.Printf("Simulating terminal creation for session %s (FrontendID: %s)...", sessionID, frontendID)

		time.Sleep(100 * time.Millisecond)

		backendTerminalID := fmt.Sprintf("term-%x", rand.Intn(0xffffff))

		message := types.Message{
			Type:       "terminal_created",
			TerminalID: backendTerminalID,
			FrontendID: frontendID,
			Sender:     "pty_agent",
		}

		session.Mu.Lock()
		if session.Terminals == nil {
			session.Terminals = make(map[string]*types.Terminal)
		}
		session.Terminals[backendTerminalID] = &types.Terminal{ID: backendTerminalID, CreatedAt: time.Now()}
		session.Mu.Unlock()

		log.Printf("Terminal created. Broadcasting confirmation. BackendID: %s, FrontendID: %s", backendTerminalID, frontendID)

		if s.hub != nil {
			s.hub.BroadcastToSession(sessionID, message)
		}
	}()
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
