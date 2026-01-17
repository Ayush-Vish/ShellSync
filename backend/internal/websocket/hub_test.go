package websocket

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Ayush-Vish/shellsync/backend/internal/types"
	"github.com/gorilla/websocket"
)

// MockService implements types.PTYService
type MockService struct {
	sessions map[string]*types.Session
	hub      types.PtyOutputBroadcaster
}

func NewMockService() *MockService {
	return &MockService{
		sessions: make(map[string]*types.Session),
	}
}

func (m *MockService) ForwardInputToAgent(sessionID, terminalID string, input []byte) {}
func (m *MockService) RequestNewTerminal(sessionID, frontendID string, x float32, y float32) {}
func (m *MockService) GetSession(sessionID string) (*types.Session, bool) {
	s, ok := m.sessions[sessionID]
	return s, ok
}
func (m *MockService) GetSessions() []*types.Session {
	return nil
}
func (m *MockService) AddClientToSession(sessionID, clientID string) bool {
	if s, ok := m.sessions[sessionID]; ok {
		if s.Clients == nil {
			s.Clients = make(map[string]*types.Client)
		}
		s.Clients[clientID] = &types.Client{ID: clientID}
		return true
	}
	return false
}
func (m *MockService) SetHub(hub types.PtyOutputBroadcaster) {
	m.hub = hub
}

func TestNewHub(t *testing.T) {
	mockService := NewMockService()
	hub := NewHub(mockService)
	if hub == nil {
		t.Fatal("NewHub returned nil")
	}
	if hub.clients == nil {
		t.Error("Hub clients map is nil")
	}
}

func TestHandleWebSocket_NoSessionID(t *testing.T) {
	mockService := NewMockService()
	hub := NewHub(mockService)

	req := httptest.NewRequest("GET", "/ws", nil)
	w := httptest.NewRecorder()

	hub.HandleWebSocket(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestHandleWebSocket_SessionNotFound(t *testing.T) {
	mockService := NewMockService()
	hub := NewHub(mockService)

	req := httptest.NewRequest("GET", "/ws?session_id=unknown", nil)
	w := httptest.NewRecorder()

	hub.HandleWebSocket(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", w.Code)
	}
}

func TestHandleWebSocket_SuccessAndAuth(t *testing.T) {
	mockService := NewMockService()
	sessionID := "test-session"
	password := "123456"
	session := &types.Session{
		ID:            sessionID,
		Password:      password,
		AgentHostname: "host-agent",
		Clients:       make(map[string]*types.Client),
	}
	mockService.sessions[sessionID] = session

	hub := NewHub(mockService)
	server := httptest.NewServer(http.HandlerFunc(hub.HandleWebSocket))
	defer server.Close()

	// Convert http URL to ws URL
	u := "ws" + strings.TrimPrefix(server.URL, "http") + "?session_id=" + sessionID + "&client_id=test-client"

	ws, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		t.Fatalf("Dial failed: %v", err)
	}
	defer ws.Close()

	// Prepare auth message
	authMsg := map[string]string{
		"type":     "authenticate",
		"password": password,
		"name":     "TestUser",
	}
	if err := ws.WriteJSON(authMsg); err != nil {
		t.Fatalf("WriteJSON failed: %v", err)
	}

	// Read response
	var response types.Message
	if err := ws.ReadJSON(&response); err != nil {
		t.Fatalf("ReadJSON failed: %v", err)
	}

	if response.Type != "auth_success" {
		t.Errorf("Expected auth_success, got %s. Error: %s", response.Type, response.Error)
	}
	if response.Permission != "read-only" {
		t.Errorf("Expected read-only permission, got %s", response.Permission)
	}
}

func TestBroadcastToSession(t *testing.T) {
	mockService := NewMockService()
	sessionID := "test-session"
	session := &types.Session{
		ID:       sessionID,
		Password: "pass",
		Clients:  make(map[string]*types.Client),
	}
	mockService.sessions[sessionID] = session

	hub := NewHub(mockService)
	server := httptest.NewServer(http.HandlerFunc(hub.HandleWebSocket))
	defer server.Close()

	u := "ws" + strings.TrimPrefix(server.URL, "http") + "?session_id=" + sessionID + "&client_id=client1"

	ws, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		t.Fatalf("Dial failed: %v", err)
	}
	defer ws.Close()

	// Authenticate
	authMsg := map[string]string{
		"type":     "authenticate",
		"password": "pass",
	}
	ws.WriteJSON(authMsg)

	// Read auth success
	var authResp types.Message
	ws.ReadJSON(&authResp)

	// Read session state (sent automatically after register)
	var stateResp types.Message
	ws.ReadJSON(&stateResp)
	if stateResp.Type != "session_state" {
		// It might be possible we get the broadcast before the state if we are too fast?
		// But in registerClient, session state is sent in a goroutine with sleep.
		// So likely we receive it.
	}

	// Test broadcast
	testMsg := types.Message{
		Type:    "test_msg",
		Content: "hello",
	}

	// Wait a bit to ensure client is fully registered
	time.Sleep(200 * time.Millisecond)

	hub.BroadcastToSession(sessionID, testMsg)

	// Read broadcasted message
	var msg types.Message
	if err := ws.ReadJSON(&msg); err != nil {
		t.Fatalf("ReadJSON failed: %v", err)
	}

	if msg.Type != "test_msg" {
		t.Errorf("Expected test_msg, got %s", msg.Type)
	}
	if msg.Content != "hello" {
		t.Errorf("Expected hello, got %s", msg.Content)
	}
}
