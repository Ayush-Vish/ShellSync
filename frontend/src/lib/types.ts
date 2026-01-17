export interface CanvasItem {
  id: string;
  type: 'terminal';
  position: { x: number; y: number };
  status: 'creating' | 'ready' | 'error';
  terminalId?: string;
  error?: string;
  width?: number;
  height?: number;
  color?: string;
}

export interface SocketMessage {
  type: string;
  content?: string;
  sender?: string;
  terminalId?: string;
  frontendId?: string;
  status?: string;
  error?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  terminals?: Array<{
    terminalId: string;
    frontendId: string;
    status: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
  }>;
  cols?: number;
  rows?: number;
  permission?: string;
  clientId?: string;
  clients?: Array<{clientId: string; name?: string; permission: string}>;
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
        cols: data.cols,
        rows: data.rows,
        permission: data.permission,
        clientId: data.clientId || data.client_id,
        clients: data.clients,
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
