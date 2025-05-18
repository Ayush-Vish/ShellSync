package pkg

import(
	"github.com/Ayush-Vish/shellsync/backend/utils"
)
type Session struct {
	ID    string
	Host  string
	Users []User
}

type User struct {
	Name     string
	HostName string
	IsViewer bool
}

func NewSession(host string) *Session {
	return &Session{
		ID:   utils.GenerateRandomID(10),
		Host: host,
	}
}
