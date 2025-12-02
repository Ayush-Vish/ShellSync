package controller

import (
	"context"
	"runtime"
	"testing"
)

func TestNewAgent(t *testing.T) {
	agent := NewAgent()
	if agent == nil {
		t.Fatal("NewAgent returned nil")
	}
	if agent.ptys == nil {
		t.Error("Agent ptys map is nil")
	}
	if agent.terminalMap == nil {
		t.Error("Agent terminalMap is nil")
	}
}

func TestGetDefaultShell(t *testing.T) {
	ctx := context.Background()
	cmd := getDefaultShell(ctx)

	if cmd == nil {
		t.Fatal("getDefaultShell returned nil")
	}

	if runtime.GOOS == "windows" {
		// Can't easily verify exact shell on all envs, but check path is not empty
		if cmd.Path == "" {
			t.Error("Command path is empty")
		}
	} else {
		// Unix-like
		if cmd.Path == "" {
			t.Error("Command path is empty")
		}
		// Typically /bin/bash or /bin/sh or similar.
		// Just ensuring it's not empty is a good start.
	}
}

// NOTE: Testing spawnNewPty and startStream requires mocking grpc streams and pty.Start
// which involves os/exec interactions that are hard to mock without refactoring the code
// to use interfaces for command execution and PTY creation.
// Given the constraints, we focus on available unit tests.
