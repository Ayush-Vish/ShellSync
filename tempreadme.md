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
- Writing concurrently in Sockets.
Below is a comprehensive README for your **ShellSync** project, designed to clearly document the project’s purpose, setup instructions, usage, architecture, and contribution guidelines. It incorporates the functionality described in the landing page prompt, the download instructions for the multiplatform agent binaries, and aligns with the project’s current state as reflected in the GitHub repository details.
