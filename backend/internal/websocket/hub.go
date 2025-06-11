package websocket

import (
	"log"
	"net/http"
	"sync"

	"github.com/Ayush-Vish/shellsync/backend/internal/service"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Message struct {
	Type      string `json:"type"` // can be "pty_input", "pty_output", "join"
	Content   string `json:"content"`
	Sender    string `json:"sender"`
	SessionID string `json:"sessionId"`
}

type Hub struct {
	service       *service.ShellSyncService
	clients       map[string]*websocket.Conn // clientID -> connection
	broadcast     chan Message
	outputFromPty chan Message
	mu            sync.Mutex
}

func NewHub(service *service.ShellSyncService) *Hub {
	return &Hub{
		service:       service,
		clients:       make(map[string]*websocket.Conn),
		broadcast:     make(chan Message),
		outputFromPty: make(chan Message),
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

	log.Printf("Client %s connected to session %s", clientID, sessionID)

	h.mu.Lock()
	h.clients[clientID] = conn
	h.mu.Unlock()
	h.service.AddClientToSession(sessionID, clientID) // Assuming clientID can also be the name for now

	go h.handleClient(clientID, sessionID, conn)
}

func (h *Hub) handleClient(clientID, sessionID string, conn *websocket.Conn) {
	defer func() {
		h.mu.Lock()
		delete(h.clients, clientID)
		h.mu.Unlock()
		conn.Close()
		log.Printf("Client %s disconnected from session %s", clientID, sessionID)
	}()

	for {
		var msg Message
		// Read a new message as JSON from the WebSocket connection.
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error reading message from Client %s: %v", clientID, err)
			break // Exit loop on error (e.g., connection closed)
		}

		log.Printf("Received from Client %s: Type=%s , content= %s", clientID, msg.Type, msg.Content)
		msg.Sender = clientID
		// Send the message to the broadcast channel to be processed by Run().
		h.broadcast <- msg
	}
}

func (h *Hub) Run() {
	log.Println("WebSocket Hub started")
	for msg := range h.broadcast {
		log.Printf("Broadcasting message from %s (Type: %s)", msg.Sender, msg.Type)

		switch msg.Type {
		case "pty_input":

		}
		h.mu.Lock()
		// Iterate over all connected clients to broadcast the message.
		for clientID, conn := range h.clients {
			// This minimal example broadcasts to everyone *except* the original sender.
			if clientID != msg.Sender {
				err := conn.WriteJSON(msg)
				if err != nil {
					log.Printf("Error sending message to Client %s: %v", clientID, err)
					// On error, assume client disconnected, remove them and close connection.
					delete(h.clients, clientID)
					conn.Close()
				}
			}
		}
		h.mu.Unlock()
	}
}
