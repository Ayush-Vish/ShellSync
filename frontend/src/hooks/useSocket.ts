import { useEffect, useRef, useCallback, useState } from 'react';

// In hooks/useSocket.ts or wherever SocketMessage is defined
export interface SocketMessage {
    type: 'terminal_created' | 'pty_output' | 'pty_input' | 'create_terminal' | 'terminal_error';
    content?: string;
    terminalId?: string;
    frontendId?: string;
    error?: string;
    sender?: string;
}

export interface TerminalInfo {
  id: string;
  status: 'creating' | 'ready' | 'error';
  createdAt?: Date;
  error?: string;
}

// Helper function to normalize backend messages to frontend format
function normalizeMessage(data: any): SocketMessage {
  return {
    type: data.type,
    content: data.content,
    terminalId: data.terminalId || data.terminal_id, // Handle both formats
    frontendId: data.frontendId || data.frontend_id, // Handle both formats
    error: data.error,
    sender: data.sender,
  };
}

export function useTerminalSocket(
    sessionId: string,
    clientId: string,
    onMessage: (msg: SocketMessage) => void,
    onTerminalCreated?: (terminalId: string) => void,
    onError?: (error: string) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [terminals, setTerminals] = useState<Map<string, TerminalInfo>>(new Map());

  // Function to establish or re-establish the WebSocket connection
  const connect = useCallback(() => {
    // Prevent reconnecting if already connected or connecting
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      return;
    }

    const wsUrl = `ws://localhost:8080/ws?session_id=${sessionId}&client_id=${clientId}`;
    console.log(`Attempting to connect to WebSocket: ${wsUrl} (attempt ${connectionAttempts + 1})`);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`WebSocket connected to session: ${sessionId}`);
        setIsConnected(true);
        setConnectionAttempts(0);

        // Clear any pending reconnection timeouts upon successful connection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          console.log('Raw WebSocket message:', rawData);
          
          // Normalize the message format
          const data: SocketMessage = normalizeMessage(rawData);
          console.log('Normalized WebSocket message:', data);
          
          // Handle terminal creation response
          if (data.type === 'terminal_created' && data.terminalId) {
            setTerminals(prev => {
              const updated = new Map(prev);
              const existing = updated.get(data.terminalId!);
              if (existing) {
                updated.set(data.terminalId!, {
                  ...existing,
                  status: 'ready',
                  createdAt: new Date()
                });
              } else {
                // Terminal created from another client or restored session
                updated.set(data.terminalId!, {
                  id: data.terminalId!,
                  status: 'ready',
                  createdAt: new Date()
                });
              }
              return updated;
            });
            onTerminalCreated?.(data.terminalId);
          }
          
          // Handle error messages
          if (data.type === 'terminal_error') {
            console.error('WebSocket error message:', data.error);
            onError?.(data.error || 'Unknown error');
            
            // If error is related to a specific terminal, update its status
            if (data.terminalId) {
              setTerminals(prev => {
                const updated = new Map(prev);
                const existing = updated.get(data.terminalId!);
                if (existing) {
                  updated.set(data.terminalId!, {
                    ...existing,
                    status: 'error',
                    error: data.error
                  });
                }
                return updated;
              });
            }
          }
          
          onMessage(data); // Pass the normalized message to the provided callback
        } catch (error) {
          console.error('Failed to parse incoming WebSocket message:', event.data, error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.warn(`WebSocket closed. Code: ${event.code}. Reason: ${event.reason || 'No reason'}.`);
        setIsConnected(false);

        // Only attempt to reconnect if it wasn't a manual close and we haven't exceeded max attempts
        if (event.code !== 1000 && connectionAttempts < 10) {
          console.log(`Reconnecting in 3s... (attempt ${connectionAttempts + 1}/10)`);
          setConnectionAttempts(prev => prev + 1);

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        } else if (connectionAttempts >= 10) {
          console.error('Max reconnection attempts reached. Please refresh the page.');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);

      if (connectionAttempts < 10) {
        setConnectionAttempts(prev => prev + 1);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    }
  }, [sessionId, clientId, onMessage, onTerminalCreated, onError, connectionAttempts]);

  // Effect hook to manage connection lifecycle
  useEffect(() => {
    if (sessionId && clientId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        console.log('Closing WebSocket connection on component unmount.');
        wsRef.current.onclose = null;
        wsRef.current.close();
        setIsConnected(false);
      }
    };
  }, [sessionId, clientId, connect]);

  // Function to send messages over the WebSocket
  const sendMessage = useCallback((type: SocketMessage['type'], content?: string, terminalId?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: SocketMessage = {
        type,
        content,
        sender: clientId,
        terminalId,
      };
      console.log('Sending WebSocket message:', message);
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      const state = wsRef.current?.readyState;
      const stateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
      const stateName = state !== undefined ? stateNames[state] : 'UNDEFINED';
      console.warn(`WebSocket not connected (state: ${stateName}). Message not sent:`, { type, content, terminalId });

      if (state === WebSocket.CLOSED || state === undefined) {
        console.log('Attempting to reconnect...');
        connect();
      }
      return false;
    }
  }, [clientId, connect]);

  // Function to create a new terminal
  const createTerminal = useCallback(() => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add temporary terminal to state
    setTerminals(prev => {
      const updated = new Map(prev);
      updated.set(tempId, {
        id: tempId,
        status: 'creating',
      });
      return updated;
    });

    // Send create terminal request
    const success = sendMessage('create_terminal');
    
    if (!success) {
      // Remove temporary terminal if message failed to send
      setTerminals(prev => {
        const updated = new Map(prev);
        updated.delete(tempId);
        return updated;
      });
      return null;
    }

    return tempId;
  }, [sendMessage]);

  // Function to get terminal info
  const getTerminalInfo = useCallback((terminalId: string) => {
    return terminals.get(terminalId);
  }, [terminals]);

  // Function to remove terminal from local state
  const removeTerminal = useCallback((terminalId: string) => {
    setTerminals(prev => {
      const updated = new Map(prev);
      updated.delete(terminalId);
      return updated;
    });
  }, []);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setConnectionAttempts(0);
    connect();
  }, [connect]);

  return {
    sendMessage,
    createTerminal,
    getTerminalInfo,
    removeTerminal,
    isConnected,
    reconnect,
    connectionAttempts,
    terminals: Array.from(terminals.values()),
  };
}
