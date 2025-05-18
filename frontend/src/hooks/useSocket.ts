import { useEffect, useRef, useCallback } from 'react'

export function useTerminalSocket(
  sessionId: string,
  clientId: string,
  onMessage: (msg: any) => void
) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Create a connection function that can be reused for reconnection
  const connectWebSocket = useCallback(() => {
    // Clean up any existing connection first
    if (wsRef.current) {
      wsRef.current.close()
    }
    
    console.log(`Connecting to WS: ws://localhost:8080/ws?session_id=${sessionId}&client_id=${clientId}`)
    
    const ws = new WebSocket(
      `ws://localhost:8080/ws?session_id=${sessionId}&client_id=${clientId}`
    )

    ws.onopen = () => {
      console.log('Connected to terminal session')
      ws.send(JSON.stringify({
        type: 'join',
        content: '',
        sender: clientId
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('Received message:', data)
        onMessage(data)
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    ws.onclose = (event) => {
      console.log(`WebSocket closed with code ${event.code}. Reason: ${event.reason}`)
      
      // Try to reconnect after a delay
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...')
        connectWebSocket()
      }, 3000) // Try to reconnect after 3 seconds
    }

    wsRef.current = ws
  }, [sessionId, clientId, onMessage])

  useEffect(() => {
    connectWebSocket()
    
    return () => {
      // Clean up on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connectWebSocket])

  const sendCommand = useCallback((command: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: 'command',
        content: command,
        sender: clientId
      })
      console.log('Sending to server:', message)
      wsRef.current.send(message)
    } else {
      console.warn('WebSocket not connected. Cannot send command:', command)
    }
  }, [clientId])

  return { sendCommand }
}
