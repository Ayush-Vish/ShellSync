package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
)

func main() {
	conn, err := net.Dial("tcp", "localhost:5003")
	if err != nil {
		fmt.Println("❌ Failed to connect to server:", err)
		os.Exit(1)
	}
	defer conn.Close()

	fmt.Println("🔗 Connected to shellsync server at localhost:5003")

	// Send a basic handshake message
	_, err = conn.Write([]byte("HELLO SHELLSYNC\n"))
	if err != nil {
		fmt.Println("❌ Failed to send message:", err)
		return
	}

	// Read server response
	message, err := bufio.NewReader(conn).ReadString('\n')
	if err != nil {
		fmt.Println("❌ Failed to read response:", err)
		return
	}
	fmt.Print("🖥️ Server says: ", message)
}
