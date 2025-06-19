package types

import (
	"sync"
	"time"
)

type PTYService interface {
	ForwardInputToAgent(sessionID string, input []byte)
	GetSession(sessionID string) (*Session, bool)
	AddClientToSession(sessionID, clientID string) bool
}
type Message struct {
	Type    string `json:"type"`
	Content string `json:"content"`
	Sender  string `json:"sender"`
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
