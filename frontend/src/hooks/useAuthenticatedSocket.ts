import { normalizeMessage, SocketMessage } from '@/lib/types';
import { useEffect, useRef, useCallback, useState } from 'react';

export interface AuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  permission: 'host' | 'read-write' | 'read-only' | null;
  clientId: string | null;
}

export function useAuthenticatedSocket(
  sessionId: string,
  onMessage: (msg: SocketMessage) => void,
  onAuthSuccess?: (clientId: string, permission: string) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isAuthenticating: false,
    authError: null,
    permission: null,
    clientId: null,
  });

  const authenticate = useCallback((password: string, name?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setAuthState(prev => ({
        ...prev,
        authError: 'Connection not established',
        isAuthenticating: false,
      }));
      return;
    }

    setAuthState(prev => ({
      ...prev,
      isAuthenticating: true,
      authError: null,
    }));

    // Send authentication message
    wsRef.current.send(JSON.stringify({
      type: 'authenticate',
      password: password,
      name: name || 'Anonymous',
    }));
  }, []);

  // Get or create persistent client ID for this session
  const getOrCreateClientId = useCallback(() => {
    const cookieName = `shellsync_client_${sessionId}`;
    const cookies = document.cookie.split(';');
    
    // Try to find existing client ID
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === cookieName) {
        return decodeURIComponent(value);
      }
    }
    
    // Generate new client ID
    const newClientId = `client-${Math.random().toString(36).substring(2, 9)}`;
    
    // Save to cookie (expires in 30 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    document.cookie = `${cookieName}=${encodeURIComponent(newClientId)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    
    return newClientId;
  }, [sessionId]);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      return;
    }

    // Get persistent client ID from cookie
    const clientId = getOrCreateClientId();
    const wsUrl = `ws://localhost:5000/ws?session_id=${sessionId}&client_id=${clientId}`;
    console.log(`Connecting to WebSocket: ${wsUrl} with client ID: ${clientId}`);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`WebSocket connected to session: ${sessionId}`);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          console.log('Raw WebSocket message:', rawData);

          const data: SocketMessage = normalizeMessage(rawData);
          console.log('Normalized WebSocket message:', data);

          if (data.type === 'auth_success') {
            console.log('Authentication successful:', data);
            setAuthState({
              isAuthenticated: true,
              isAuthenticating: false,
              authError: null,
              permission: data.permission as 'host' | 'read-write' | 'read-only',
              clientId: data.clientId || null,
            });
            onAuthSuccess?.(data.clientId || '', data.permission || '');
          } else if (data.type === 'auth_error') {
            console.error('Authentication failed:', data.error);
            setAuthState(prev => ({
              ...prev,
              isAuthenticating: false,
              authError: data.error || 'Authentication failed',
            }));
          } else if (data.type === 'permission_updated') {
            // Update permission if it's for this client
            setAuthState(prev => {
              if (prev.clientId === data.clientId) {
                return {
                  ...prev,
                  permission: data.permission as 'host' | 'read-write' | 'read-only',
                };
              }
              return prev;
            });
            onMessage(data);
          } else {
            // Pass all other messages to the handler
            onMessage(data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', event.data, error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setAuthState({
          isAuthenticated: false,
          isAuthenticating: false,
          authError: null,
          permission: null,
          clientId: null,
        });
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [sessionId, onMessage, onAuthSuccess]);

  const sendMessage = useCallback((type: string, content?: string, terminalId?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type,
        content,
        terminalId,
      };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    authState,
    authenticate,
    sendMessage,
    disconnect,
  };
}
