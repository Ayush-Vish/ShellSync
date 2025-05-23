PATH="${PATH}:${HOME}/go/bin"


# ShellSync

Shellsync is a collaborative terminal-sharing application. The Go server manages sessions and relays terminal data, the Go client runs a local shell and communicates via gRPC, and the Next.js frontend provides a web-based terminal interface using WebSocket.


# TODO:

## MileStone 1 - Go server with Session Creation.

#### Create a gRPC server and implement CreateSession method and Store the session in in memory map



```json
Session Server Side.
{
      sessionId,
  hostId,
  
      
}
```
