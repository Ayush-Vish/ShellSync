package types

import (
	"sync"
	"time"
)

type PTYService interface {
	ForwardInputToAgent(sessionID, terminalID string, input []byte)

	RequestNewTerminal(sessionID, frontendID string, x float32, y float32)
	GetSession(sessionID string) (*Session, bool)
	GetSessions() []*Session
	AddClientToSession(sessionID, clientID string) bool

	SetHub(hub PtyOutputBroadcaster)
}

type Message struct {
	Type       string         `json:"type"`
	TerminalID string         `json:"terminal_id,omitempty"`
	Content    string         `json:"content,omitempty"`
	Sender     string         `json:"sender,omitempty"`
	FrontendID string         `json:"frontend_id,omitempty"`
	Error      string         `json:"error,omitempty"`
	Terminals  []TerminalInfo `json:"terminals,omitempty"`
	Status     string         `json:"status,omitempty"`
	X          float32        `json:"x,omitempty"`
	Y          float32        `json:"y,omitempty"`
}

type TerminalInfo struct {
	TerminalID string  `json:"terminal_id"`
	FrontendID string  `json:"frontend_id"`
	Status     string  `json:"status"`
	X          float32 `json:"x"` // Add position for canvas
	Y          float32 `json:"y"`
}

type Terminal struct {
	ID         string
	FrontendID string
	CreatedAt  time.Time
	Status     string
	X          float32 // Add position
	Y          float32
	Data       []Message // Store terminal output for new clients
}

type PtyOutputBroadcaster interface {
	BroadcastToSession(sessionID string, message Message)
}

type Session struct {
	ID             string
	Host           string
	CreatedAt      time.Time
	Clients        map[string]*Client
	AgentInputChan chan AgentCommand
	Terminals      map[string]*Terminal
	Mu             sync.RWMutex
}

type AgentCommand interface {
	isAgentCommand()
}

type PtyInputData struct {
	TerminalID string
	Data       []byte
}

func (PtyInputData) isAgentCommand() {}

type CreateTerminalCmd struct {
	FrontendID string
	TerminalID string
}

func (CreateTerminalCmd) isAgentCommand() {}

type Client struct {
	ID       string
	Name     string
	LastSeen time.Time
}
