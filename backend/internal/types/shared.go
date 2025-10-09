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
	Content    string         `json:"content,omitempty"`
	Sender     string         `json:"sender,omitempty"`
	TerminalID string         `json:"terminalId,omitempty"`
	FrontendID string         `json:"frontendId,omitempty"`
	Status     string         `json:"status,omitempty"`
	Error      string         `json:"error,omitempty"`
	X          float32        `json:"x,omitempty"`
	Y          float32        `json:"y,omitempty"`
	Width      int            `json:"width,omitempty"`
	Height     int            `json:"height,omitempty"`
	Terminals  []TerminalInfo `json:"terminals,omitempty"`
}

// ResizeTerminalCmd with AgentCommand interface implementation
type ResizeTerminalCmd struct {
	TerminalID string
	Cols       uint32
	Rows       uint32
	Width      uint32
	Height     uint32
}

// Add this method to implement AgentCommand interface
func (ResizeTerminalCmd) isAgentCommand() {}

type TerminalInfo struct {
	TerminalID string  `json:"terminalId"`
	FrontendID string  `json:"frontendId"`
	Status     string  `json:"status"`
	X          float32 `json:"x"`
	Y          float32 `json:"y"`
	Width      int     `json:"width,omitempty"`
	Height     int     `json:"height,omitempty"`
}

type Terminal struct {
	ID         string
	FrontendID string
	Status     string
	X          float32
	Y          float32
	Width      int
	Height     int
	CreatedAt  time.Time
	Data       []Message
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
