package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/Ayush-Vish/shellsync/backend/internal/types"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type client struct {
	conn      *websocket.Conn
	writeChan chan interface{} // Channel for messages to
	mu        sync.Mutex
	closed    bool
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

	if sessionID == "" || clientID == "" {
		http.Error(w, "session_id and client_id are required", http.StatusBadRequest)
		return
	}

	session, exists := h.service.GetSession(sessionID)
	if !exists {
		log.Printf("Attempt to connect to non-existent session ID: %s", sessionID)
		http.Error(w, "session not found", http.StatusNotFound)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed for Client %s: %v", clientID, err)
		return
	}

	h.registerClient(conn, session, clientID)
	go h.readLoop(conn, sessionID, clientID)
}
func (h *Hub) registerClient(conn *websocket.Conn, session *types.Session, clientID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	c := &client{
		conn: conn,
		// FIX: Use the typed channel.
		writeChan: make(chan interface{}, 100),
		closed:    false,
	}

	h.clients[clientID] = c
	if h.sessions[session.ID] == nil {
		h.sessions[session.ID] = make(map[string]bool)
	}
	h.sessions[session.ID][clientID] = true

	h.service.AddClientToSession(session.ID, clientID)
	log.Printf("Client %s registered to session %s", clientID, session.ID)

	// Goroutine to send the initial session state to the newly connected client.
	go func() {
		time.Sleep(100 * time.Millisecond) // Small delay for stability.

		session.Mu.RLock()
		terminals := make([]types.TerminalInfo, 0, len(session.Terminals))
		for _, term := range session.Terminals {
			terminals = append(terminals, types.TerminalInfo{
				TerminalID: term.ID,
				FrontendID: term.FrontendID,
				Status:     term.Status,
				X:          term.X,
				Y:          term.Y,
				Width:      term.Width,
				Height:     term.Height,
			})
		}
		session.Mu.RUnlock()

		sessionStateMsg := types.Message{
			Type:      "session_state",
			Terminals: terminals,
		}

		c.mu.Lock()
		if !c.closed {
			select {
			case c.writeChan <- sessionStateMsg:
				log.Printf("Sent session state to client %s for session %s", clientID, session.ID)
			default:
				log.Printf("Write channel for client %s is full, session state dropped", clientID)
			}
		}
		c.mu.Unlock()
	}()

	// Start the write loop in a separate goroutine to send messages to the client.
	go h.writeLoop(c, clientID)
}

func (h *Hub) unregisterClient(clientID, sessionID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if c, ok := h.clients[clientID]; ok {
		c.mu.Lock()
		if !c.closed {
			c.closed = true
			close(c.writeChan)
			c.conn.Close()
		}
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
			c.mu.Unlock()                    // Unlock before calling unregister to avoid deadlock
			h.unregisterClient(clientID, "") // SessionID can be empty, unregister will still work
			return
		}
		c.mu.Unlock()
	}
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
			Type:       getString(rawMsg, "type"),
			Content:    getString(rawMsg, "content"),
			Sender:     clientID,
			TerminalID: getString(rawMsg, "terminalId"),
			FrontendID: getString(rawMsg, "frontendId")}

		log.Printf("Received message from client %s: Type=%s, TerminalID=%s, Content=%s",
			clientID, msg.Type, msg.TerminalID, msg.Content)

		switch msg.Type {
		case "pty_input":
			if msg.TerminalID == "" {
				log.Printf("Received pty_input without terminal_id from client %s", clientID)
				continue
			}
			h.service.ForwardInputToAgent(sessionID, msg.TerminalID, []byte(msg.Content))

		case "create_terminal":
			var payload struct {
				FrontendID string  `json:"frontendId"`
				X          float32 `json:"x"`
				Y          float32 `json:"y"`
			}
			if err := json.Unmarshal([]byte(msg.Content), &payload); err != nil {
				log.Printf("Error unmarshalling create_terminal payload from client %s: %v", clientID, err)
				continue
			}
			if payload.FrontendID == "" {
				log.Printf("Received create_terminal from client %s without a frontendId", clientID)
				continue
			}
			h.service.RequestNewTerminal(sessionID, payload.FrontendID, payload.X, payload.Y)

		// ADD THIS CASE: Handle resize messages
		case "resize":
			var payload struct {
				Cols   uint32 `json:"cols"`
				Rows   uint32 `json:"rows"`
				Width  uint32 `json:"width"`
				Height uint32 `json:"height"`
			}
			if err := json.Unmarshal([]byte(msg.Content), &payload); err != nil {
				log.Printf("Error unmarshalling resize payload from client %s: %v", clientID, err)
				continue
			}
			if msg.TerminalID == "" {
				log.Printf("Received resize from client %s without a terminalId", clientID)
				continue
			}

			log.Printf("Processing resize for terminal %s: %dx%d (cols x rows)",
				msg.TerminalID, payload.Cols, payload.Rows)

			// Forward resize command to service
			session, exists := h.service.GetSession(sessionID)
			if !exists {
				log.Printf("Session %s not found when resizing terminal", sessionID)
				continue
			}

			// Send resize command to agent
			resizeCmd := types.ResizeTerminalCmd{
				TerminalID: msg.TerminalID,
				Cols:       payload.Cols,
				Rows:       payload.Rows,
				Width:      payload.Width,
				Height:     payload.Height,
			}

			select {
			case session.AgentInputChan <- resizeCmd:
				log.Printf("Sent resize command for terminal %s: %dx%d", msg.TerminalID, payload.Cols, payload.Rows)
			default:
				log.Printf("Agent input channel for session %s is full. Resize command dropped.", sessionID)
			}

			// Also update terminal dimensions in session
			session.Mu.Lock()
			if terminal, ok := session.Terminals[msg.TerminalID]; ok {
				terminal.Width = int(payload.Width)
				terminal.Height = int(payload.Height)

				// Broadcast resize to all clients
				resizeMsg := types.Message{
					Type:       "terminal_resized",
					TerminalID: msg.TerminalID,
					Width:      int(payload.Width),
					Height:     int(payload.Height),
				}
				h.BroadcastToSession(sessionID, resizeMsg)
			}
			session.Mu.Unlock()

		// ADD THIS CASE: Handle position_update messages
		case "position_update":
			var payload struct {
				X      float32 `json:"x"`
				Y      float32 `json:"y"`
				Width  int     `json:"width"`
				Height int     `json:"height"`
			}
			if err := json.Unmarshal([]byte(msg.Content), &payload); err != nil {
				log.Printf("Error unmarshalling position_update payload from client %s: %v", clientID, err)
				continue
			}
			if msg.TerminalID == "" {
				log.Printf("Received position_update from client %s without a terminalId", clientID)
				continue
			}

			log.Printf("Processing position update for terminal %s: (%.2f, %.2f)",
				msg.TerminalID, payload.X, payload.Y)

			// Update terminal position and dimensions in session
			session, exists := h.service.GetSession(sessionID)
			if !exists {
				log.Printf("Session %s not found when updating terminal position", sessionID)
				continue
			}

			session.Mu.Lock()
			if terminal, ok := session.Terminals[msg.TerminalID]; ok {
				terminal.X = payload.X
				terminal.Y = payload.Y
				terminal.Width = payload.Width
				terminal.Height = payload.Height

				// Broadcast position update to all clients
				updateMsg := types.Message{
					Type:       "terminal_position_updated",
					TerminalID: msg.TerminalID,
					X:          payload.X,
					Y:          payload.Y,
					Width:      payload.Width,
					Height:     payload.Height,
				}
				h.BroadcastToSession(sessionID, updateMsg)
				log.Printf("Broadcast position update for terminal %s", msg.TerminalID)
			} else {
				log.Printf("Terminal %s not found in session %s", msg.TerminalID, sessionID)
			}
			session.Mu.Unlock()

		case "subscribe":
			h.sendTerminalHistory(sessionID, clientID, msg.TerminalID)

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
	defer h.mu.RUnlock()

	sessionClients, ok := h.sessions[sessionID]
	if !ok {
		return
	}

	for clientID := range sessionClients {
		if client, ok := h.clients[clientID]; ok {
			client.mu.Lock()
			if !client.closed {
				select {
				case client.writeChan <- message:
				default:
					log.Printf("Write channel for client %s is full. Message of type '%s' dropped.", clientID, message.Type)
				}
			}
			client.mu.Unlock()
		}
	}
}
func (h *Hub) sendTerminalHistory(sessionID, clientID, terminalID string) {
	session, exists := h.service.GetSession(sessionID)
	if !exists {
		return
	}

	client, clientExists := h.clients[clientID]
	if !clientExists {
		return
	}

	session.Mu.RLock()
	terminal, termExists := session.Terminals[terminalID]
	if !termExists {
		session.Mu.RUnlock()
		return
	}

	// Create a copy of the data slice to avoid holding the lock while writing.
	history := make([]types.Message, len(terminal.Data))
	copy(history, terminal.Data)
	session.Mu.RUnlock()

	// Send the historical messages to the subscribing client.
	for _, msg := range history {
		client.mu.Lock()
		if !client.closed {
			select {
			case client.writeChan <- msg:
			default:
				log.Printf("Write channel full for client %s while sending history.", clientID)
			}
		}
		client.mu.Unlock()
	}
	log.Printf("Sent %d historical messages for terminal %s to client %s", len(history), terminalID, clientID)
}
