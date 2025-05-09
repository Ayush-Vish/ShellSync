package main

import (
	"bufio"
	"fmt"
	"net"
)

func main() {
	listener, err := net.Listen("tcp", ":5003")
	if err != nil {
		fmt.Println("❌ Failed to start server:", err)
		return
	}
	defer listener.Close()

	fmt.Println("🚀 Shellsync server is running on port 5003...")

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Println("⚠️ Failed to accept connection:", err)
			continue
		}
		go handleConnection(conn)
	}
}

func handleConnection(conn net.Conn) {
	defer conn.Close()

	clientAddr := conn.RemoteAddr().String()
	fmt.Printf("🔌 New client connected: %s\n", clientAddr)

	reader := bufio.NewReader(conn)
	message, err := reader.ReadString('\n')
	if err != nil {
		fmt.Printf("⚠️ Failed to read from %s: %v\n", clientAddr, err)
		return
	}
	fmt.Printf("📥 Received from %s: %s", clientAddr, message)

	response := "WELCOME TO SHELLSYNC\n"
	conn.Write([]byte(response))
}
