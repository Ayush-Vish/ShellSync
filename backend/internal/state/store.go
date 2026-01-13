package state

import (
	"fmt"
	"sync"
	"time"

	"github.com/Ayush-Vish/shellsync/backend/internal/types"
)

type SessionSnapshot struct {
	ID            string
	Host          string
	Password      string
	AgentHostname string
	HostClientID  string
	CreatedAt     time.Time

	Clients   map[string]*types.Client
	Terminals map[string]*types.Terminal
}
type Store struct {
	sessions map[string]*types.Session
	mu       sync.RWMutex
}

func NewStore() *Store {
	return &Store{
		sessions: make(map[string]*types.Session),
	}
}

func (s *Store) Get(sessionID string) (*types.Session, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	session, exists := s.sessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("session %s not found", sessionID)
	}
	return session, nil

}
func (s *Store) Set(sessionID string, session *types.Session) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[sessionID] = session
}

func (s *Store) Delete(sessionID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, sessionID)
}

func (s *Store) All() map[string]*types.Session {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.sessions
}
