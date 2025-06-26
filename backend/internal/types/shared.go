package types

import (
	"sync"
	"time"
)

type PTYService interface {
	ForwardInputToAgent(sessionID, terminalID string, input []byte)

	RequestNewTerminal(sessionID, frontendID string)
	GetSession(sessionID string) (*Session, bool)
	GetSessions() []*Session
	AddClientToSession(sessionID, clientID string) bool

	SetHub(hub PtyOutputBroadcaster)
}

type Message struct {
	Type       string `json:"type"`
	TerminalID string `json:"terminal_id,omitempty"`
	Content    string `json:"content,omitempty"`
	Sender     string `json:"sender,omitempty"`
	FrontendID string `json:"frontend_id,omitempty"`
	Error      string `json:"error,omitempty"`
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

type Terminal struct {
	ID         string
	FrontendID string
	CreatedAt  time.Time
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
