package websocket

import (
	"github.com/Ayush-Vish/shellsync/backend/internal/types"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Hub struct {
	service  types.PTYService
	clients  map[string]*websocket.Conn // Maps clientID -> connection
	sessions map[string]map[string]bool // Maps sessionID -> set of clientIDs
	mu       sync.RWMutex               // Protects clients and sessions maps
}

func NewHub(service types.PTYService) *Hub {
	return &Hub{
		service:  service,
		clients:  make(map[string]*websocket.Conn),
		sessions: make(map[string]map[string]bool),
	}
}

func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("session_id")
	clientID := r.URL.Query().Get("client_id")

	log.Printf("New WebSocket connection attempt. SessionID: %s, ClientID: %s", sessionID, clientID)
	if sessionID == "" || clientID == "" {
		http.Error(w, "session_id and client_id are required", http.StatusBadRequest)
		return
	}
	// Verify session exists
	if _, exists := h.service.GetSession(sessionID); !exists {
		log.Printf("Invalid session ID: %s", sessionID)
		http.Error(w, "Invalid session", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed for Client %s: %v", clientID, err)
		return
	}
	if err != nil {
		log.Printf("WebSocket upgrade failed for Client %s: %v", clientID, err)
		return
	}

	h.registerClient(conn, sessionID, clientID)
	go h.readLoop(conn, sessionID, clientID)
}
func (h *Hub) registerClient(conn *websocket.Conn, sessionID, clientID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.clients[clientID] = conn
	if h.sessions[sessionID] == nil {
		h.sessions[sessionID] = make(map[string]bool)
	}
	h.sessions[sessionID][clientID] = true
	h.service.AddClientToSession(sessionID, clientID)
	log.Printf("Client %s registered to session %s", clientID, sessionID)
}
func (h *Hub) unregisterClient(clientID, sessionID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[clientID]; ok {
		delete(h.clients, clientID)
		if h.sessions[sessionID] != nil {
			delete(h.sessions[sessionID], clientID)
			if len(h.sessions[sessionID]) == 0 {
				delete(h.sessions, sessionID)
			}
		}
		log.Printf("Client %s unregistered from session %s", clientID, sessionID)
	}
}

func (h *Hub) readLoop(conn *websocket.Conn, sessionID, clientID string) {
	defer func() {
		h.unregisterClient(clientID, sessionID)
		conn.Close()
	}()

	for {
		var msg types.Message
		if err := conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error reading from client %s: %v", clientID, err)
			}
			break
		}
		if msg.Type == "pty_input" {
			h.processPtyInput(sessionID, clientID, msg.Content)
		}
	}
}
func (h *Hub) processPtyInput(sessionID, senderClientID, content string) {
	log.Printf("Processing pty_input for session %s from sender %s", sessionID, senderClientID)
	h.service.ForwardInputToAgent(sessionID, []byte(content))
}
func (h *Hub) BroadcastToSession(sessionID string, message types.Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	sessionClients, ok := h.sessions[sessionID]
	if !ok {
		return
	}

	for clientID := range sessionClients {
		conn, clientOk := h.clients[clientID]
		if clientOk {
			if err := conn.WriteJSON(message); err != nil {
				log.Printf("Error writing message to client %s: %v", clientID, err)
			}
		}
	}
}
