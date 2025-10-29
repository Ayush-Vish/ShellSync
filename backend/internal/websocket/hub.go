package websocket

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/Ayush-Vish/shellsync/backend/internal/types"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin:     func(r *http.Request) bool { return true },
	ReadBufferSize:  4096, // Optimize read buffer size
	WriteBufferSize: 4096, // Optimize write buffer size
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

	if sessionID == "" {
		http.Error(w, "session_id is required", http.StatusBadRequest)
		return
	}

	// Generate client_id if not provided using crypto/rand for better randomness
	if clientID == "" {
		b := make([]byte, 3)
		if _, err := rand.Read(b); err != nil {
			log.Printf("Failed to generate client ID, using fallback: %v", err)
			clientID = fmt.Sprintf("client-%d", time.Now().UnixNano()%0xffffff)
		} else {
			clientID = fmt.Sprintf("client-%x", b)
		}
		log.Printf("Generated client ID: %s for session %s", clientID, sessionID)
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

	// Don't register client yet - wait for authentication
	go h.authenticateAndReadLoop(conn, sessionID, clientID, session)
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

	// Start the write loop first to ensure it's ready to receive messages
	go h.writeLoop(c, clientID)

	// Send the initial session state to the newly connected client
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

func (h *Hub) authenticateAndReadLoop(conn *websocket.Conn, sessionID, clientID string, session *types.Session) {
	defer conn.Close()

	// Wait for authentication message
	conn.SetReadDeadline(time.Now().Add(30 * time.Second)) // 30 second timeout for auth
	
	var authMsg map[string]interface{}
	if err := conn.ReadJSON(&authMsg); err != nil {
		log.Printf("Failed to read auth message from client %s: %v", clientID, err)
		conn.WriteJSON(types.Message{
			Type:  "auth_error",
			Error: "Authentication timeout or invalid message",
		})
		return
	}

	msgType := getString(authMsg, "type")
	password := getString(authMsg, "password")
	clientName := getString(authMsg, "name")
	
	log.Printf("Received auth message - type: %s, password: %s, name: '%s'", msgType, password, clientName)
	
	if clientName == "" {
		clientName = "Anonymous"
		log.Printf("Name was empty, defaulting to Anonymous")
	}

	if msgType != "authenticate" {
		log.Printf("Client %s sent wrong message type during auth: %s", clientID, msgType)
		conn.WriteJSON(types.Message{
			Type:  "auth_error",
			Error: "Expected authentication message",
		})
		return
	}

	// Check password
	session.Mu.RLock()
	correctPassword := session.Password
	session.Mu.RUnlock()

	if password != correctPassword {
		log.Printf("Client %s failed authentication for session %s", clientID, sessionID)
		conn.WriteJSON(types.Message{
			Type:  "auth_error",
			Error: "Invalid password",
		})
		return
	}

	// Authentication successful
	log.Printf("Client %s authenticated successfully for session %s with name: %s", clientID, sessionID, clientName)
	
	// Determine permission: check if client name matches agent hostname
	permission := "read-only"
	session.Mu.Lock()
	if clientName == session.AgentHostname {
		// Client name matches agent hostname - they are the host
		session.HostClientID = clientID
		permission = "host"
		log.Printf("Client %s identified as host (name '%s' matches agent hostname '%s')", clientID, clientName, session.AgentHostname)
	} else {
		log.Printf("Client %s is a regular user (name '%s' does not match agent hostname '%s')", clientID, clientName, session.AgentHostname)
	}
	session.Mu.Unlock()

	// Send authentication success with permission
	conn.WriteJSON(types.Message{
		Type:       "auth_success",
		Permission: permission,
		ClientID:   clientID,
	})

	// Reset read deadline
	conn.SetReadDeadline(time.Time{})

	// Now register the client and start normal read loop
	h.registerClient(conn, session, clientID)
	
	// Update client permission and name in session
	session.Mu.Lock()
	if client, exists := session.Clients[clientID]; exists {
		// Preserve existing name if client is reconnecting and didn't provide a new name
		if clientName != "" && clientName != "Anonymous" {
			client.Name = clientName
		} else if client.Name == "" {
			client.Name = "Anonymous"
		}
		// Update permission (may have changed based on hostname match)
		client.Permission = permission
		client.LastSeen = time.Now()
		log.Printf("Client %s reconnected with name: %s, permission: %s", clientID, client.Name, client.Permission)
	}
	session.Mu.Unlock()

	// Start the normal read loop
	h.readLoop(conn, sessionID, clientID)
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

// Helper function to check if client has write permission
func (h *Hub) hasWritePermission(sessionID, clientID string) bool {
	session, exists := h.service.GetSession(sessionID)
	if !exists {
		return false
	}
	
	session.Mu.RLock()
	defer session.Mu.RUnlock()
	
	client, exists := session.Clients[clientID]
	if !exists {
		return false
	}
	
	return client.Permission == "host" || client.Permission == "read-write"
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
			// Check write permission
			if !h.hasWritePermission(sessionID, clientID) {
				log.Printf("Client %s attempted pty_input without write permission", clientID)
				continue
			}
			if msg.TerminalID == "" {
				log.Printf("Received pty_input without terminal_id from client %s", clientID)
				continue
			}
			h.service.ForwardInputToAgent(sessionID, msg.TerminalID, []byte(msg.Content))

		case "create_terminal":
			// Check write permission
			if !h.hasWritePermission(sessionID, clientID) {
				log.Printf("Client %s attempted create_terminal without write permission", clientID)
				continue
			}
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

		case "remove_terminal":
			// Check write permission
			if !h.hasWritePermission(sessionID, clientID) {
				log.Printf("Client %s attempted remove_terminal without write permission", clientID)
				continue
			}
			
			if msg.TerminalID == "" {
				log.Printf("Received remove_terminal from client %s without a terminalId", clientID)
				continue
			}

			log.Printf("Processing remove terminal request for terminal %s from client %s", msg.TerminalID, clientID)
			h.service.RequestDeleteTerminal(sessionID, msg.TerminalID)

		case "cursor_position":
			// Handle cursor position updates
			if msg.TerminalID == "" {
				log.Printf("Received cursor_position from client %s without terminalId", clientID)
				continue
			}

			session, exists := h.service.GetSession(sessionID)
			if !exists {
				continue
			}

			// Update cursor position for this client
			session.Mu.Lock()
			if client, ok := session.Clients[clientID]; ok {
				if client.CursorPositions == nil {
					client.CursorPositions = make(map[string]*types.CursorPosition)
				}
				client.CursorPositions[msg.TerminalID] = &types.CursorPosition{
					Row:       msg.CursorRow,
					Col:       msg.CursorCol,
					UpdatedAt: time.Now(),
				}
				client.LastSeen = time.Now()
			}
			session.Mu.Unlock()

			// Broadcast cursor position to other clients
			cursorMsg := types.Message{
				Type:       "cursor_update",
				TerminalID: msg.TerminalID,
				ClientID:   clientID,
				ClientName: msg.ClientName,
				CursorRow:  msg.CursorRow,
				CursorCol:  msg.CursorCol,
				Sender:     clientID,
			}
			h.BroadcastToSession(sessionID, cursorMsg)

		case "ping":
			// Handle ping for latency measurement
			pongMsg := types.Message{
				Type:      "pong",
				Timestamp: msg.Timestamp,
				ClientID:  clientID,
			}
			
			if c, ok := h.clients[clientID]; ok {
				c.mu.Lock()
				if !c.closed {
					select {
					case c.writeChan <- pongMsg:
					default:
						log.Printf("Write channel for client %s is full", clientID)
					}
				}
				c.mu.Unlock()
			}

		case "latency_update":
			// Update client latency
			session, exists := h.service.GetSession(sessionID)
			if !exists {
				continue
			}

			session.Mu.Lock()
			if client, ok := session.Clients[clientID]; ok {
				client.Latency = msg.Latency
				client.LastSeen = time.Now()
			}
			session.Mu.Unlock()

		case "subscribe":
			h.sendTerminalHistory(sessionID, clientID, msg.TerminalID)

		case "get_clients":
			// Send list of clients with their permissions
			session, exists := h.service.GetSession(sessionID)
			if !exists {
				continue
			}
			
			session.Mu.RLock()
			clientList := make([]types.ClientInfo, 0, len(session.Clients))
			for _, client := range session.Clients {
				clientList = append(clientList, types.ClientInfo{
					ClientID:   client.ID,
					Name:       client.Name,
					Permission: client.Permission,
				})
			}
			session.Mu.RUnlock()
			
			// Send to requesting client
			if c, ok := h.clients[clientID]; ok {
				c.mu.Lock()
				if !c.closed {
					select {
					case c.writeChan <- types.Message{
						Type:    "clients_list",
						Clients: clientList,
					}:
					default:
						log.Printf("Write channel for client %s is full", clientID)
					}
				}
				c.mu.Unlock()
			}

		case "update_permission":
			// Only host can update permissions
			session, exists := h.service.GetSession(sessionID)
			if !exists {
				continue
			}
			
			session.Mu.RLock()
			isHost := session.HostClientID == clientID
			session.Mu.RUnlock()
			
			if !isHost {
				log.Printf("Client %s attempted to update permissions without being host", clientID)
				continue
			}
			
			var payload struct {
				TargetClientID string `json:"targetClientId"`
				Permission     string `json:"permission"`
			}
			if err := json.Unmarshal([]byte(msg.Content), &payload); err != nil {
				log.Printf("Error unmarshalling update_permission payload: %v", err)
				continue
			}
			
			// Validate permission value
			if payload.Permission != "read-only" && payload.Permission != "read-write" {
				log.Printf("Invalid permission value: %s", payload.Permission)
				continue
			}
			
			// Update permission
			session.Mu.Lock()
			if client, exists := session.Clients[payload.TargetClientID]; exists {
				client.Permission = payload.Permission
				log.Printf("Host %s updated permission for client %s to %s", clientID, payload.TargetClientID, payload.Permission)
			}
			session.Mu.Unlock()
			
			// Broadcast permission update to all clients
			h.BroadcastToSession(sessionID, types.Message{
				Type:       "permission_updated",
				ClientID:   payload.TargetClientID,
				Permission: payload.Permission,
			})

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
	// First, collect client IDs while holding the lock briefly
	h.mu.RLock()
	sessionClients, ok := h.sessions[sessionID]
	if !ok {
		h.mu.RUnlock()
		return
	}
	
	// Copy client IDs to avoid holding lock during broadcast
	clientIDs := make([]string, 0, len(sessionClients))
	for clientID := range sessionClients {
		clientIDs = append(clientIDs, clientID)
	}
	h.mu.RUnlock()

	// Now broadcast without holding the hub lock
	for _, clientID := range clientIDs {
		h.mu.RLock()
		client, ok := h.clients[clientID]
		h.mu.RUnlock()
		
		if ok {
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

	// Only copy the slice header/metadata, not the actual message data
	// This is safe because Message structs are sent by value
	historyLen := len(terminal.Data)
	session.Mu.RUnlock()

	// Send the historical messages to the subscribing client without copying the entire slice
	session.Mu.RLock()
	for i := 0; i < historyLen && i < len(terminal.Data); i++ {
		msg := terminal.Data[i]
		session.Mu.RUnlock()
		
		client.mu.Lock()
		if !client.closed {
			select {
			case client.writeChan <- msg:
			default:
				log.Printf("Write channel full for client %s while sending history.", clientID)
				client.mu.Unlock()
				return
			}
		}
		client.mu.Unlock()
		
		session.Mu.RLock()
	}
	session.Mu.RUnlock()
	
	log.Printf("Sent %d historical messages for terminal %s to client %s", historyLen, terminalID, clientID)
}
