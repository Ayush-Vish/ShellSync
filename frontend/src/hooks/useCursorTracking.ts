import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';

interface CursorTrackingOptions {
  terminalId: string;
  clientId: string;
  clientName: string;
  sendMessage: (type: string, content?: string, terminalId?: string) => void;
  enabled?: boolean;
}

export function useCursorTracking({
  terminalId,
  clientId,
  clientName,
  sendMessage,
  enabled = true,
}: CursorTrackingOptions) {
  const cursorPositionRef = useRef({ row: 0, col: 0 });
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendCursorPosition = (row: number, col: number) => {
    if (!enabled) return;

    // Throttle cursor updates to avoid flooding the server
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }

    throttleTimeoutRef.current = setTimeout(() => {
      if (cursorPositionRef.current.row !== row || cursorPositionRef.current.col !== col) {
        cursorPositionRef.current = { row, col };
        
        const message = JSON.stringify({
          terminalId,
          clientName,
          cursorRow: row,
          cursorCol: col,
        });
        
        sendMessage('cursor_position', message, terminalId);
      }
    }, 100); // Send cursor updates at most every 100ms
  };

  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  return {
    sendCursorPosition,
  };
}

// Hook to track cursor from Terminal events
export function useTerminalCursorTracking(
  terminal: Terminal | null,
  options: CursorTrackingOptions
) {
  const { sendCursorPosition } = useCursorTracking(options);

  useEffect(() => {
    if (!terminal || !options.enabled) return;

    // Track cursor position changes
    const cursorMoveHandler = () => {
      const buffer = terminal.buffer.active;
      const row = buffer.cursorY;
      const col = buffer.cursorX;
      sendCursorPosition(row, col);
    };

    // Listen to various events that might move the cursor
    terminal.onData(() => cursorMoveHandler());
    terminal.onCursorMove(() => cursorMoveHandler());

    return () => {
      // Cleanup is handled by terminal disposal
    };
  }, [terminal, sendCursorPosition, options.enabled]);
}
