package websocket

//
//import (
//	"log"
//	"net/http"
//	"sync"
//
//	"github.com/Ayush-Vish/shellsync/backend/internal/service"
//	"github.com/gorilla/websocket"
//)
//
//var upgrader = websocket.Upgrader{
//	CheckOrigin: func(r *http.Request) bool { return true },
//}
//
//type Message struct {
//	Type    string `json:"type"` // "command", "output", "join"
//	Content string `json:"content"`
//	Sender  string `json:"sender"`
//}
//
//type Hub struct {
//	service   *service.ShellSyncService
//	clients   map[string]*websocket.Conn // clientID -> connection
//	broadcast chan Message
//	mu        sync.Mutex
//}
//
//func NewHub(service *service.ShellSyncService) *Hub {
//	return &Hub{
//		service:   service,
//		clients:   make(map[string]*websocket.Conn),
//		broadcast: make(chan Message),
//	}
//}
//
//func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
//	sessionID := r.URL.Query().Get("session_id")
//	clientID := r.URL.Query().Get("client_id")
//
//	log.Printf("New WebSocket connection attempt. SessionID: %s, ClientID: %s", sessionID, clientID)
//
//	// Verify session exists
//	if _, exists := h.service.GetSession(sessionID); !exists {
//		log.Printf("Invalid session ID: %s", sessionID)
//		http.Error(w, "Invalid session", http.StatusBadRequest)
//		return
//	}
//
//	conn, err := upgrader.Upgrade(w, r, nil)
//	if err != nil {
//		log.Printf("WebSocket upgrade failed for Client %s: %v", clientID, err)
//		return
//	}
//
//	log.Printf("Client %s connected to session %s", clientID, sessionID)
//
//	h.mu.Lock()
//	h.clients[clientID] = conn
//	h.mu.Unlock()
//
//	h.service.AddClientToSession(sessionID, clientID)
//
//	go h.handleClient(clientID, sessionID, conn)
//}
//
//func (h *Hub) handleClient(clientID, sessionID string, conn *websocket.Conn) {
//	defer func() {
//		h.mu.Lock()
//		delete(h.clients, clientID)
//		h.mu.Unlock()
//		conn.Close()
//		log.Printf("Client %s disconnected from session %s", clientID, sessionID)
//	}()
//
//	for {
//		var msg Message
//		err := conn.ReadJSON(&msg)
//		if err != nil {
//			log.Printf("Error reading message from Client %s: %v", clientID, err)
//			break
//		}
//
//		log.Printf("Received message from Client %s: Type=%s, Content=%s", clientID, msg.Type, msg.Content)
//		msg.Sender = clientID
//		h.broadcast <- msg
//	}
//}
//
//func (h *Hub) Run() {
//	log.Println("WebSocket Hub started")
//	for msg := range h.broadcast {
//		log.Printf("Broadcasting message from %s: %s", msg.Sender, msg.Content)
//
//		h.mu.Lock()
//		for clientID, conn := range h.clients {
//			if clientID != msg.Sender {
//				err := conn.WriteJSON(msg)
//				if err != nil {
//					log.Printf("Error sending message to Client %s: %v", clientID, err)
//					delete(h.clients, clientID)
//					conn.Close()
//				}
//			}
//		}
//		h.mu.Unlock()
//	}
//}
