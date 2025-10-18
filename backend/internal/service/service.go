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
		AgentInputChan: make(chan types.AgentCommand, 20),
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
					if len(terminal.Data) >= 3000 {
						terminal.Data = terminal.Data[len(terminal.Data)-2999:]
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

	backendTerminalID := fmt.Sprintf("term-%x", rand.Intn(0xffffff))
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
		Data:       make([]types.Message, 0, 2000),
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
		session.Clients[clientID] = &types.Client{ID: clientID, LastSeen: time.Now()}
	}
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
