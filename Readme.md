PATH="${PATH}:${HOME}/go/bin"


# ShellSync

Shellsync is a collaborative terminal-sharing application. The Go server manages sessions and relays terminal data, the Go client runs a local shell and communicates via gRPC, and the Next.js frontend provides a web-based terminal interface using WebSocket.


# TODO:

## MileStones

- [x] Create CreateSession functionality.
- [x] Store session in the in memory state.
- [x] Configure Pty on the Shellsync Agent.
- [x] Add Bidirectional streaming functionality b/w the agent and server.
- [x] Integrate `xterm.js` component in the frontend.
- [x] Connect via WebSocket.
- [ ] Make infinite canvas component.
- [ ] Make a gesture Engine to pan and Zoom infinite canvas.
- [ ] Create a Toolbar to spawn a new pty client and in the canvas.
- [ ] Create functionality to spawn multiple pyt in the same client.
- 

## Challenges Faced.
 
- Bidirectional Grpc Implementation.
- Setting up Pseudo Terminals.
- 