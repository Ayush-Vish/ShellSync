package main

import "net"

func main() {
	conn, err := net.Listen("tcp", ":2222")
	if err != nil {
		panic(err)
	}
	defer conn.Close()
}
