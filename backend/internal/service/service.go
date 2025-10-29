package service

import (
	"context"
	"crypto/rand"
	"fmt"

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
	
	// Generate a secure 6-digit password using crypto/rand
	var passwordNum int32
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		log.Printf("Failed to generate secure password: %v", err)
		return nil, fmt.Errorf("failed to generate session password: %w", err)
	}
	// Convert bytes to uint32 and mod by 1000000 to get 6 digits
	passwordNum = int32(uint32(b[0])<<24 | uint32(b[1])<<16 | uint32(b[2])<<8 | uint32(b[3]))
	if passwordNum < 0 {
		passwordNum = -passwordNum
	}
	password := fmt.Sprintf("%06d", passwordNum%1000000)
	
	session := &types.Session{
		ID:             sessionID,
		Host:           req.Host,
		Password:       password,
		AgentHostname:  req.Host, // Store agent hostname for host identification
		Clients:        make(map[string]*types.Client),
		Terminals:      make(map[string]*types.Terminal),
		CreatedAt:      time.Now(),
		AgentInputChan: make(chan types.AgentCommand, 20),
	}
	s.sessions[sessionID] = session

	log.Printf("Created session: %s for host: %s with password: %s", sessionID, req.Host, password)
	
	return &pb.CreateResponse{
		SessionId:   sessionID,
		FrontendUrl: fmt.Sprintf("http://localhost:3000/ws/%s", sessionID),
		Password:    password,
	}, nil
}

func (s *ShellSyncService) Stream(stream pb.ShellSync_StreamServer) error {
	ctx := stream.Context()

	initialMsg, err := stream.Recv()
	if err != nil {
		log.Printf("Failed to receive initial message from agent: %v", err)
		return err
	}
	sessionID := initialMsg.GetInitialMessage().GetSessionId()

	s.mu.RLock()
	session, exists := s.sessions[sessionID]
	s.mu.RUnlock()
	if !exists {
		return fmt.Errorf("session %s not found for connecting agent", sessionID)
	}

	// Goroutine: Read messages from Agent and dispatch them.
	go func() {
		for {
			msgFromAgent, err := stream.Recv()
			if err != nil {
				if err != io.EOF {
					log.Printf("Error receiving from agent for session %s: %v", sessionID, err)
				}
				return
			}

			switch payload := msgFromAgent.Payload.(type) {

			case *pb.ClientUpdate_PtyOutput:
				output := payload.PtyOutput
				terminalID := output.GetTerminalId()

				message := types.Message{
					Type:       "pty_output",
					TerminalID: terminalID,
					Content:    string(output.GetData()),
					Sender:     "pty_agent",
				}

				session.Mu.Lock()
				if terminal, exists := session.Terminals[terminalID]; exists {
					// Keep only the last 1000 messages to prevent unbounded memory growth
					// This is more efficient than the previous 3000/2999 approach
					if len(terminal.Data) >= 1000 {
						// Use copy to shift elements instead of reslicing to avoid keeping old data
						copy(terminal.Data, terminal.Data[len(terminal.Data)-999:])
						terminal.Data = terminal.Data[:999]
					}
					terminal.Data = append(terminal.Data, message)
				}
				session.Mu.Unlock()

				if s.hub != nil {
					s.hub.BroadcastToSession(sessionID, message)
				}
			case *pb.ClientUpdate_TerminalCreatedResponse:
				resp := payload.TerminalCreatedResponse
				var message types.Message

				session.Mu.Lock()
				if terminal, exists := session.Terminals[resp.GetTerminalId()]; exists {
					terminal.Status = "ready"
					message = types.Message{
						Type:       "terminal_created",
						TerminalID: terminal.ID,
						FrontendID: terminal.FrontendID,
						Status:     terminal.Status,
						X:          terminal.X,
						Y:          terminal.Y,
						Width:      terminal.Width,
						Height:     terminal.Height,
					}
				}
				session.Mu.Unlock()

				if message.Type != "" {
					s.hub.BroadcastToSession(sessionID, message)
				}
			case *pb.ClientUpdate_TerminalError:
				errMsg := payload.TerminalError
				session.Mu.Lock()
				frontendID := ""
				if terminal, exists := session.Terminals[errMsg.GetTerminalId()]; exists {
					terminal.Status = "error"
					frontendID = terminal.FrontendID
				}
				session.Mu.Unlock()
				if s.hub != nil {
					errorMsg := types.Message{
						Type:       "terminal_error",
						TerminalID: errMsg.GetTerminalId(),
						FrontendID: frontendID,
						Error:      errMsg.GetError(),
						Sender:     "pty_agent",
					}
					s.hub.BroadcastToSession(sessionID, errorMsg)
				}

			}
		}
	}()

	for {
		select {
		case <-ctx.Done():
			log.Printf("Agent for session %s disconnected.", sessionID)
			close(session.AgentInputChan)
			return ctx.Err()
		case command := <-session.AgentInputChan:
			var serverUpdate *pb.ServerUpdate

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
						CreateTerminalRequest: &pb.CreateTerminalRequest{
							TerminalId: cmd.TerminalID,
						},
					},
				}
			case types.ResizeTerminalCmd:
				serverUpdate = &pb.ServerUpdate{
					Payload: &pb.ServerUpdate_ResizeTerminal{
						ResizeTerminal: &pb.TerminalResize{
							TerminalId: cmd.TerminalID,
							Cols:       cmd.Cols,
							Rows:       cmd.Rows,
							Width:      cmd.Width,
							Height:     cmd.Height,
						},
					},
				}
			case types.DeleteTerminalCmd:
				serverUpdate = &pb.ServerUpdate{
					Payload: &pb.ServerUpdate_CloseTerminalRequest{
						CloseTerminalRequest: &pb.CloseTerminalRequest{
							TerminalId: cmd.TerminalID,
						},
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

func (s *ShellSyncService) RequestNewTerminal(sessionID, frontendID string, x float32, y float32) {
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

	backendTerminalID := "term-" + uuid.New().String()[:8]
	session.Mu.Lock()
	if session.Terminals == nil {
		session.Terminals = make(map[string]*types.Terminal)
	}
	session.Terminals[backendTerminalID] = &types.Terminal{
		ID:         backendTerminalID,
		CreatedAt:  time.Now(),
		FrontendID: frontendID,
		Status:     "creating",
		X:          float32(x),
		Y:          float32(y),
		Width:      640, // Default width
		Height:     400, // Default height
		Data:       make([]types.Message, 0), // Start with minimal capacity, will grow as needed
	}
	session.Mu.Unlock()

	// Immediately broadcast that a terminal is being created
	if s.hub != nil {
		creatingMsg := types.Message{
			Type:       "terminal_created",
			TerminalID: backendTerminalID,
			FrontendID: frontendID,
			Status:     "creating",
			X:          x,
			Y:          y,
			Width:      640,
			Height:     400,
		}
		s.hub.BroadcastToSession(sessionID, creatingMsg)
	}

	log.Printf("Requesting agent to create terminal with ID %s for session %s", backendTerminalID, sessionID)

	select {
	case session.AgentInputChan <- types.CreateTerminalCmd{
		TerminalID: backendTerminalID,
		FrontendID: frontendID,
	}:
	default:
		log.Printf("Agent input channel for session %s is full. Terminal creation dropped.", sessionID)
		if s.hub != nil {
			errorMsg := types.Message{
				Type:       "terminal_error",
				FrontendID: frontendID,
				Error:      "Agent is busy. Try again.",
				Sender:     "pty_agent",
			}
			s.hub.BroadcastToSession(sessionID, errorMsg)
		}
	}
}

func (s *ShellSyncService) GetSession(sessionID string) (*types.Session, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	session, exists := s.sessions[sessionID]
	return session, exists
}
func (s *ShellSyncService) AddClientToSession(sessionID, clientID string) bool {
	s.mu.RLock()
	session, exists := s.sessions[sessionID]
	s.mu.RUnlock()
	if !exists {
		return false
	}
	session.Mu.Lock()
	defer session.Mu.Unlock()
	if _, ok := session.Clients[clientID]; !ok {
		session.Clients[clientID] = &types.Client{
			ID:              clientID,
			LastSeen:        time.Now(),
			Permission:      "read-only", // Default permission, will be updated after auth
			CursorPositions: make(map[string]*types.CursorPosition),
			Latency:         0,
		}
	}
	return true
}

func (s *ShellSyncService) RequestDeleteTerminal(sessionID, terminalID string) {
	s.mu.RLock()
	session, ok := s.sessions[sessionID]
	s.mu.RUnlock()

	if !ok {
		log.Printf("Service error: cannot delete terminal for non-existent session %s", sessionID)
		return
	}

	// Remove terminal from session memory
	session.Mu.Lock()
	if _, exists := session.Terminals[terminalID]; exists {
		delete(session.Terminals, terminalID)
		log.Printf("Removed terminal %s from session %s memory", terminalID, sessionID)
	}
	session.Mu.Unlock()

	// Send delete request to agent to close the PTY
	log.Printf("Requesting agent to close terminal %s for session %s", terminalID, sessionID)

	select {
	case session.AgentInputChan <- types.DeleteTerminalCmd{
		TerminalID: terminalID,
	}:
		log.Printf("Sent close terminal request to agent for terminal %s", terminalID)
	default:
		log.Printf("Agent input channel for session %s is full. Terminal close request dropped.", sessionID)
	}

	// Broadcast terminal deletion to all clients
	if s.hub != nil {
		deleteMsg := types.Message{
			Type:       "terminal_deleted",
			TerminalID: terminalID,
			Sender:     "server",
		}
		s.hub.BroadcastToSession(sessionID, deleteMsg)
	}
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
