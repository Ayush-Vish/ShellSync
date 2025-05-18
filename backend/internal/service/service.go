package service

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	pb "github.com/Ayush-Vish/shellsync/api/proto"
	"github.com/google/uuid"
)

type Client struct {
	ID       string
	IsAdmin  bool
	LastSeen time.Time
}

type Session struct {
	ID        string
	Host      string // Host machine address
	CreatedAt time.Time
	Clients   map[string]*Client // Connected client IDs
	mu        sync.Mutex
}

type ShellSyncService struct {
	pb.UnimplementedShellSyncServer
	sessions map[string]*Session
	mu       sync.RWMutex
}

func NewShellSyncService() *ShellSyncService {
	return &ShellSyncService{
		sessions: make(map[string]*Session),
	}
}

func (s *ShellSyncService) CreateSession(ctx context.Context, req *pb.CreateRequest) (*pb.CreateResponse, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	sessionID := uuid.New().String()[:8]
	adminID := uuid.New().String()[:8]

	session := &Session{
		ID:        sessionID,
		Host:      req.GetHost(),
		Clients:   map[string]*Client{},
		CreatedAt: time.Now(),
	}

	session.Clients[adminID] = &Client{
		ID:       adminID,
		IsAdmin:  true,
		LastSeen: time.Now(),
	}

	s.sessions[sessionID] = session

	log.Printf("Created session: %s by admin: %s on host: %s", sessionID, adminID, req.GetHost())

	return &pb.CreateResponse{
		SessionId:   sessionID,
		FrontendUrl: fmt.Sprintf("http://localhost:3000/s/%s?client_id=%s", sessionID, adminID),
	}, nil
}

func (s *ShellSyncService) GetSession(sessionID string) (*Session, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	session, exists := s.sessions[sessionID]
	if exists {
		log.Printf("Session %s found", sessionID)
	} else {
		log.Printf("Session %s not found", sessionID)
	}
	return session, exists
}

func (s *ShellSyncService) AddClientToSession(sessionID, clientID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, exists := s.sessions[sessionID]
	if !exists {
		log.Printf("Failed to add client %s: session %s not found", clientID, sessionID)
		return false
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	session.Clients[clientID] = &Client{
		ID:       clientID,
		IsAdmin:  false,
		LastSeen: time.Now(),
	}

	log.Printf("Added client %s to session %s", clientID, sessionID)

	return true
}
