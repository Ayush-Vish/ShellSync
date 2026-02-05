package service

import (
	"context"
	"testing"
	"time"

	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"github.com/Ayush-Vish/shellsync/backend/internal/types"
)

// MockHub implements types.PtyOutputBroadcaster
type MockHub struct {
	broadcasts []types.Message
}

func (m *MockHub) BroadcastToSession(sessionID string, message types.Message) {
	m.broadcasts = append(m.broadcasts, message)
}

func TestNewShellSyncService(t *testing.T) {
	s := NewShellSyncService()
	if s == nil {
		t.Fatal("NewShellSyncService returned nil")
	}
	if s.sessions == nil {
		t.Error("NewShellSyncService sessions map is nil")
	}
}

func TestCreateSession(t *testing.T) {
	s := NewShellSyncService()
	ctx := context.Background()
	req := &pb.CreateRequest{
		Host: "test-host",
	}

	resp, err := s.CreateSession(ctx, req)
	if err != nil {
		t.Fatalf("CreateSession failed: %v", err)
	}

	if resp.SessionId == "" {
		t.Error("Expected SessionId, got empty string")
	}
	if len(resp.Password) != 6 {
		t.Errorf("Expected 6-digit password, got %s", resp.Password)
	}

	// Verify session is stored
	session, exists := s.GetSession(resp.SessionId)
	if !exists {
		t.Error("Session was not stored")
	}
	if session.Host != "test-host" {
		t.Errorf("Expected host test-host, got %s", session.Host)
	}
	if session.AgentHostname != "test-host" {
		t.Errorf("Expected AgentHostname test-host, got %s", session.AgentHostname)
	}
}

func TestGetSession(t *testing.T) {
	s := NewShellSyncService()

	// Test non-existent session
	_, exists := s.GetSession("non-existent")
	if exists {
		t.Error("GetSession returned true for non-existent session")
	}

	// Create and test existing session manually to avoid dependence on CreateSession
	sessionID := "test-session"
	session := &types.Session{
		ID: sessionID,
		CreatedAt: time.Now(),
	}
	s.sessions[sessionID] = session

	retrieved, exists := s.GetSession(sessionID)
	if !exists {
		t.Error("GetSession returned false for existing session")
	}
	if retrieved != session {
		t.Error("GetSession returned wrong session object")
	}
}

func TestAddClientToSession(t *testing.T) {
	s := NewShellSyncService()
	sessionID := "test-session"
	session := &types.Session{
		ID:      sessionID,
		Clients: make(map[string]*types.Client),
	}
	s.sessions[sessionID] = session

	clientID := "client-1"
	success := s.AddClientToSession(sessionID, clientID)
	if !success {
		t.Error("AddClientToSession failed for existing session")
	}

	session.Mu.RLock()
	client, ok := session.Clients[clientID]
	session.Mu.RUnlock()

	if !ok {
		t.Error("Client was not added to session")
	}
	if client.ID != clientID {
		t.Errorf("Expected client ID %s, got %s", clientID, client.ID)
	}
	if client.Permission != "read-only" {
		t.Errorf("Expected default permission read-only, got %s", client.Permission)
	}

	// Test adding to non-existent session
	success = s.AddClientToSession("fake-session", "client-2")
	if success {
		t.Error("AddClientToSession succeeded for non-existent session")
	}
}

func TestRequestNewTerminal(t *testing.T) {
	s := NewShellSyncService()
	mockHub := &MockHub{}
	s.SetHub(mockHub)

	sessionID := "test-session"
	session := &types.Session{
		ID:             sessionID,
		AgentInputChan: make(chan types.AgentCommand, 1),
		Terminals:      make(map[string]*types.Terminal),
	}
	s.sessions[sessionID] = session

	frontendID := "frontend-term-1"

	// Test requesting new terminal
	s.RequestNewTerminal(sessionID, frontendID, 100, 200)

	// Check if terminal was created in session
	session.Mu.Lock()
	if len(session.Terminals) != 1 {
		t.Errorf("Expected 1 terminal, got %d", len(session.Terminals))
	}
	var term *types.Terminal
	for _, t := range session.Terminals {
		term = t
		break
	}
	session.Mu.Unlock()

	if term.FrontendID != frontendID {
		t.Errorf("Expected FrontendID %s, got %s", frontendID, term.FrontendID)
	}
	if term.Status != "creating" {
		t.Errorf("Expected status creating, got %s", term.Status)
	}

	// Check if message was broadcasted
	if len(mockHub.broadcasts) == 0 {
		t.Error("No message broadcasted")
	} else {
		msg := mockHub.broadcasts[0]
		if msg.Type != "terminal_created" {
			t.Errorf("Expected message type terminal_created, got %s", msg.Type)
		}
	}

	// Check if command was sent to agent
	select {
	case cmd := <-session.AgentInputChan:
		createCmd, ok := cmd.(types.CreateTerminalCmd)
		if !ok {
			t.Error("Expected CreateTerminalCmd in channel")
		}
		if createCmd.FrontendID != frontendID {
			t.Errorf("Expected FrontendID %s in command, got %s", frontendID, createCmd.FrontendID)
		}
	default:
		t.Error("No command sent to agent channel")
	}
}

func TestForwardInputToAgent(t *testing.T) {
	s := NewShellSyncService()
	sessionID := "test-session"
	session := &types.Session{
		ID:             sessionID,
		AgentInputChan: make(chan types.AgentCommand, 1),
	}
	s.sessions[sessionID] = session

	terminalID := "term-1"
	inputData := []byte("ls\n")

	s.ForwardInputToAgent(sessionID, terminalID, inputData)

	select {
	case cmd := <-session.AgentInputChan:
		inputCmd, ok := cmd.(types.PtyInputData)
		if !ok {
			t.Error("Expected PtyInputData in channel")
		}
		if inputCmd.TerminalID != terminalID {
			t.Errorf("Expected TerminalID %s, got %s", terminalID, inputCmd.TerminalID)
		}
		if string(inputCmd.Data) != string(inputData) {
			t.Errorf("Expected data %s, got %s", string(inputData), string(inputCmd.Data))
		}
	default:
		t.Error("No input command sent to agent channel")
	}
}
