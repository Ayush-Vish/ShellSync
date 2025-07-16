export interface CanvasItem {
  id: string;
  position: { x: number; y: number };
  color: string;
  terminalId?: string;
  status: "creating" | "ready" | "error";
  error?: string;
}

export interface SocketMessage {
    type: 'terminal_created' | 'pty_output' | 'pty_input' | 'create_terminal' | 'terminal_error' | 'session_state' | 'subscribe';
    content?: string;
    terminalId?: string;
    frontendId?: string;
    error?: string;
    sender?: string;
    terminals?: { terminalId: string; frontendId: string; status: string; x: number; y: number }[];
    chunkNum?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeMessage(data: any): SocketMessage {
    return {
        type: data.type,
        content: data.content,
        terminalId: data.terminalId || data.terminal_id,
        frontendId: data.frontendId || data.frontend_id,
        error: data.error,
        sender: data.sender,
        terminals: data.terminals,
        chunkNum: data.chunkNum,
    };
}
export interface DraggableTerminalRef {
  write: (data: string) => void;
}

export interface DraggableTerminalProps {
  item: CanvasItem;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onRemove: (id: string) => void;
  sendMessage: (
    type: SocketMessage["type"],
    content?: string,
    terminalId?: string
  ) => void;

  zoom?: number;
  setCanvasPanningLocked?: (isLocked: boolean) => void;
  sessionId: string;
  clientId: string;
}
export const getStatusColor = (item: CanvasItem) => {
  switch (item.status) {
    case "creating":
      return "bg-yellow-500";
    case "error":
      return "bg-red-500";
    case "ready":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};
