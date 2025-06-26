package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/Ayush-Vish/shellsync/backend/internal/types"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type client struct {
	conn      *websocket.Conn
	writeChan chan interface{} // Channel for messages to be written
	mu        sync.Mutex       // Mutex for connection state
	closed    bool             // Flag to indicate if client is closed
}

type Hub struct {
	service  types.PTYService
	clients  map[string]*client // Changed to store client struct
	sessions map[string]map[string]bool
	mu       sync.RWMutex
}

func NewHub(service types.PTYService) *Hub {
	return &Hub{
		service:  service,
		clients:  make(map[string]*client),
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

	h.ensureSessionExists(sessionID)

	if _, exists := h.service.GetSession(sessionID); !exists {
		log.Printf("Attempt to connect to non-existent session ID: %s", sessionID)
		h.service.AddClientToSession(sessionID, "host")
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed for Client %s: %v", clientID, err)
		return
	}

	h.registerClient(conn, sessionID, clientID)
	go h.readLoop(conn, sessionID, clientID)
}

func (h *Hub) ensureSessionExists(sessionID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.sessions[sessionID] == nil {
		h.sessions[sessionID] = make(map[string]bool)
		log.Printf("Created session %s in WebSocket hub", sessionID)
	}
}

func (h *Hub) registerClient(conn *websocket.Conn, sessionID, clientID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	c := &client{
		conn:      conn,
		writeChan: make(chan interface{}, 100),
		closed:    false,
	}

	h.clients[clientID] = c
	if h.sessions[sessionID] == nil {
		h.sessions[sessionID] = make(map[string]bool)
	}
	h.sessions[sessionID][clientID] = true

	h.service.AddClientToSession(sessionID, clientID)
	log.Printf("Client %s registered to session %s", clientID, sessionID)

	go h.writeLoop(c, clientID)
}

func (h *Hub) unregisterClient(clientID, sessionID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if c, ok := h.clients[clientID]; ok {
		c.mu.Lock()
		c.closed = true
		close(c.writeChan)
		c.conn.Close()
		c.mu.Unlock()
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

func (h *Hub) writeLoop(c *client, clientID string) {
	for msg := range c.writeChan {
		c.mu.Lock()
		if c.closed {
			c.mu.Unlock()
			return
		}
		if err := c.conn.WriteJSON(msg); err != nil {
			log.Printf("Error writing message to client %s: %v", clientID, err)
			c.mu.Unlock()
			h.unregisterClient(clientID, "")
			return
		}
		c.mu.Unlock()
	}
}

func normalizeMessage(msg types.Message) map[string]interface{} {
	result := map[string]interface{}{
		"type":    msg.Type,
		"content": msg.Content,
		"sender":  msg.Sender,
	}

	if msg.TerminalID != "" {
		result["terminalId"] = msg.TerminalID
	}
	if msg.FrontendID != "" {
		result["frontendId"] = msg.FrontendID
	}
	if msg.Error != "" {
		result["error"] = msg.Error
	}

	return result
}

func (h *Hub) readLoop(conn *websocket.Conn, sessionID, clientID string) {
	defer func() {
		h.unregisterClient(clientID, sessionID)
	}()

	for {
		var rawMsg map[string]interface{}
		if err := conn.ReadJSON(&rawMsg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error reading from client %s: %v", clientID, err)
			}
			break
		}

		msg := types.Message{
			Type:    getString(rawMsg, "type"),
			Content: getString(rawMsg, "content"),
			Sender:  clientID,
		}

		if terminalId := getString(rawMsg, "terminalId"); terminalId != "" {
			msg.TerminalID = terminalId
		} else if terminalId := getString(rawMsg, "terminal_id"); terminalId != "" {
			msg.TerminalID = terminalId
		}

		if frontendId := getString(rawMsg, "frontendId"); frontendId != "" {
			msg.FrontendID = frontendId
		} else if frontendId := getString(rawMsg, "frontend_id"); frontendId != "" {
			msg.FrontendID = frontendId
		}

		log.Printf("Received message from client %s: Type=%s, TerminalID=%s, Content=%s",
			clientID, msg.Type, msg.TerminalID, msg.Content)

		switch msg.Type {
		case "pty_input":
			if msg.TerminalID == "" {
				log.Printf("Received pty_input without terminal_id from client %s", clientID)
				continue
			}
			log.Printf("Forwarding pty_input to agent: TerminalID=%s, Content=%s", msg.TerminalID, msg.Content)
			h.service.ForwardInputToAgent(sessionID, msg.TerminalID, []byte(msg.Content))

		case "create_terminal":
			var payload struct {
				FrontendID string `json:"frontendId"`
			}

			if err := json.Unmarshal([]byte(msg.Content), &payload); err != nil {
				log.Printf("Error unmarshalling create_terminal payload from client %s: %v", clientID, err)
				continue
			}

			if payload.FrontendID == "" {
				log.Printf("Received create_terminal from client %s without a frontendId", clientID)
				continue
			}

			log.Printf("Client %s requested a new terminal for session %s with FrontendID %s", clientID, sessionID, payload.FrontendID)
			h.service.RequestNewTerminal(sessionID, payload.FrontendID)

		default:
			log.Printf("Received unknown message type '%s' from client %s", msg.Type, clientID)
		}
	}
}

func getString(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func (h *Hub) BroadcastToSession(sessionID string, message types.Message) {
	h.mu.RLock()
	sessionClients, ok := h.sessions[sessionID]
	if !ok {
		log.Printf("Attempted to broadcast to non-existent session: %s. Creating session now.", sessionID)
		h.mu.RUnlock()
		h.ensureSessionExists(sessionID)
		h.mu.RLock()
		sessionClients, ok = h.sessions[sessionID]
		if !ok {
			log.Printf("Failed to create session %s", sessionID)
			return
		}
	}

	normalizedMsg := normalizeMessage(message)
	log.Printf("Broadcasting to session %s: %+v", sessionID, normalizedMsg)

	for clientID := range sessionClients {
		c, clientOk := h.clients[clientID]
		if clientOk {
			c.mu.Lock()
			if !c.closed {
				select {
				case c.writeChan <- normalizedMsg:

				default:
					log.Printf("Write channel for client %s is full, dropping message", clientID)
				}
			}
			c.mu.Unlock()
		}
	}
	h.mu.RUnlock()
}
