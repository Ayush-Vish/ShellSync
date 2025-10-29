package types

import (
	"sync"
	"time"
)

type PTYService interface {
	ForwardInputToAgent(sessionID, terminalID string, input []byte)
	RequestNewTerminal(sessionID, frontendID string, x float32, y float32)
	RequestDeleteTerminal(sessionID, terminalID string)
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
	Password   string         `json:"password,omitempty"`   // For authentication messages
	Permission string         `json:"permission,omitempty"` // For permission updates
	ClientID   string         `json:"clientId,omitempty"`   // For client-specific messages
	Clients    []ClientInfo   `json:"clients,omitempty"`    // For client list
	// Cursor tracking fields
	CursorRow int    `json:"cursorRow,omitempty"` // Terminal cursor row position
	CursorCol int    `json:"cursorCol,omitempty"` // Terminal cursor column position
	ClientName string `json:"clientName,omitempty"` // Name of client for cursor display
	// Latency tracking
	Timestamp int64 `json:"timestamp,omitempty"` // Unix timestamp in milliseconds for RTT calculation
	Latency   int64 `json:"latency,omitempty"`   // Round-trip time in milliseconds
}

type ClientInfo struct {
	ClientID   string `json:"clientId"`
	Name       string `json:"name,omitempty"`
	Permission string `json:"permission"` // "host", "read-write", "read-only"
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
	Password       string     // 6-digit password for session access
	AgentHostname  string     // Hostname of the agent (used to identify host)
	HostClientID   string     // Client ID of the host (creator)
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

type DeleteTerminalCmd struct {
	TerminalID string
}

func (DeleteTerminalCmd) isAgentCommand() {}

type Client struct {
	ID         string
	Name       string
	Permission string    // "host", "read-write", "read-only"
	LastSeen   time.Time
	// Cursor tracking per terminal
	CursorPositions map[string]*CursorPosition // terminalID -> cursor position
	Latency         int64                      // Most recent latency in milliseconds
}

type CursorPosition struct {
	Row       int
	Col       int
	UpdatedAt time.Time
}
