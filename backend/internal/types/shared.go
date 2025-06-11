package types

import (
	"github.com/gorilla/websocket"
	"sync"
	"time"
)

type PTYService interface {
	ForwardInputToAgent(sessionID string, input []byte)
	GetSession(sessionID string) (*Session, bool)       // Hub needs this to validate sessions
	AddClientToSession(sessionID, clientID string) bool // Hub needs this to add clients
}
type Message struct {
	Type    string `json:"type"`
	Content string `json:"content"`
	Sender  string `json:"sender"`
}
type Hub struct {
	service  PTYService
	clients  map[string]*websocket.Conn // Maps clientID -> connection
	sessions map[string]map[string]bool // Maps sessionID -> set of clientIDs
	mu       sync.RWMutex               // Protects clients and sessions maps
}

type PtyOutputBroadcaster interface {
	BroadcastToSession(sessionID string, message Message)
}
type Session struct {
	ID             string
	Host           string
	CreatedAt      time.Time
	Clients        map[string]*Client
	AgentInputChan chan []byte // Channel to send commands TO the agent
	mu             sync.Mutex
}
type Client struct {
	ID       string
	Name     string
	LastSeen time.Time
}
