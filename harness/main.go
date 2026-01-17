package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"time"
)

// The Harness helps in automated testing of the client-server interaction.
func main() {
	fmt.Println("--- ShellSync Harness Starting ---")

	// Get backend host from environment or default to backend (docker service name)
	backendHost := os.Getenv("SHELLSYNC_HOST")
	if backendHost == "" {
		backendHost = "backend"
	}
	
	backendPort := os.Getenv("SHELLSYNC_PORT")
	if backendPort == "" {
		backendPort = "8100"
	}

	// Launch client connecting to the backend
	cmd := exec.Command("shellsync-client", "--host", backendHost, "--port", backendPort)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Start()
	if err != nil {
		log.Fatalf("Failed to start client: %v", err)
	}

	fmt.Println("Instance started. Monitoring for 10 seconds...")
	time.Sleep(10 * time.Second)

	fmt.Println("Terminating harness test...")
	if err := cmd.Process.Kill(); err != nil {
		log.Fatal("failed to kill process: ", err)
	}

	fmt.Println("Harness run finished successfully.")
}
