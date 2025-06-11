import { useEffect, useRef, useCallback } from 'react'


export interface SocketMessage{
  type: 'pty_input' | 'pty_output'
  content: string
  sender: string
}


export function useTerminalSocket(
    sessionId: string,
    clientId: string ,
    onMessage: (msg: SocketMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Create a connection function that can be reused for reconnection
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      return // Don't try to connect if we already have a connecting/open socket
    }

    const wsUrl = `ws://localhost:8080/ws?session_id=${sessionId}&client_id=${clientId}`;
    console.log(`Connecting to WebSocket: ${wsUrl}`)
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log(`Connected to session: ${sessionId}`)
      // Clear any reconnection timeouts upon successful connection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }

    ws.onmessage = (event) => {
      try {
        const data: SocketMessage = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Failed to parse incoming message:', event.data, error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      // An error will likely be followed by a close event, which will handle reconnection
    }

    ws.onclose = (event) => {
      console.warn(`WebSocket closed. Code: ${event.code}. Reconnecting in 3s...`)
      // Schedule a reconnection attempt
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      reconnectTimeoutRef.current = setTimeout(connect, 3000)
    }

    wsRef.current = ws
  }, [sessionId, clientId, onMessage])

  useEffect(() => {
    // Initiate connection when the component mounts
    if (sessionId && clientId) {
      connect()
    }

    // Cleanup function to run when the component unmounts
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        console.log('Closing WebSocket connection on component unmount.')
        // Set onclose to null to prevent reconnection logic from firing on manual close
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [sessionId, clientId, connect])

  const sendMessage = useCallback((type: SocketMessage['type'], content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: SocketMessage = {
        type,
        content,
        sender: clientId,
      }
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected. Message not sent:', { type, content })
    }
  }, [clientId])


  return { sendMessage }
}
