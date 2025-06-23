// In DraggableTerminal.tsx

import React, { useCallback, useRef, useEffect } from "react";
import Xterm, { XtermRef } from "@/components/terminal/Terminal";
// Remove useTerminalSocket import
import { SocketMessage } from "@/hooks/useSocket";
import { CanvasItem } from "@/app/ws/[slug]/page";
import { Loader2, AlertCircle, X } from "lucide-react";

interface DraggableTerminalProps {
  item: CanvasItem;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onRemove: (id: string) => void;
  // Add these new props
  sendMessage: (type: SocketMessage['type'], content?: string, terminalId?: string) => void;
  latestMessage: SocketMessage | null;

  zoom?: number;
  setCanvasPanningLocked?: (isLocked: boolean) => void;
  sessionId: string;
  clientId: string;
}

const DraggableTerminal = ({
  item,
  onPositionChange,
  onRemove,
  // Destructure the new props
  sendMessage,
  latestMessage,
  zoom = 1,
  setCanvasPanningLocked,

}: DraggableTerminalProps) => {
  const dragRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const initialPointerPosition = useRef({ x: 0, y: 0 });
  const initialItemPosition = useRef({ x: 0, y: 0 });
  const xTermRef = useRef<XtermRef>(null);

  // --- REMOVE THE ENTIRE useTerminalSocket LOGIC ---
  // const handleSocketMessage = ...
  // const { sendMessage } = useTerminalSocket(...)

  // NEW: Use an effect to listen to messages passed from the parent
  useEffect(() => {
    if (
      latestMessage &&
      latestMessage.type === "pty_output" &&
      latestMessage.content &&
      latestMessage.terminalId === item.terminalId &&
      item.status === 'ready'
    ) {
      xTermRef.current?.write(latestMessage.content);
    }
  }, [latestMessage, item.terminalId, item.status]);


  const handleTerminalData = useCallback((data: string) => {
    if (item.terminalId && item.status === 'ready') {
      // Use the sendMessage function passed via props
      sendMessage("pty_input", data, item.terminalId);
    }
  }, [sendMessage, item.terminalId, item.status]);

  // ... rest of the component is unchanged (handlePointerDown, handleClose, renderTerminalContent, etc.)
  // ...
  // ...
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('.close-button')) return;

    setCanvasPanningLocked?.(true);
    e.stopPropagation();

    isDraggingRef.current = true;
    initialPointerPosition.current = { x: e.clientX, y: e.clientY };
    initialItemPosition.current = item.position;

    if (dragRef.current) {
      dragRef.current.style.cursor = "grabbing";
      dragRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - initialPointerPosition.current.x;
    const dy = e.clientY - initialPointerPosition.current.y;

    const newX = initialItemPosition.current.x + dx / zoom;
    const newY = initialItemPosition.current.y + dy / zoom;

    onPositionChange(item.id, { x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setCanvasPanningLocked?.(false);

    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    if (dragRef.current) {
      dragRef.current.style.cursor = "grab";
      dragRef.current.releasePointerCapture(e.pointerId);
    }
  };
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(item.id);
  }, [onRemove, item.id]);

  const renderTerminalContent = () => {
    switch (item.status) {
      case 'creating':
        return (
          <div className="flex-grow flex items-center justify-center bg-[#1e1e1e] text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin" />
              <div className="text-sm">Creating terminal...</div>
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex-grow flex items-center justify-center bg-[#1e1e1e] text-red-400">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle size={32} />
              <div className="text-sm text-center">
                <div>Failed to create terminal</div>
                {item.error && <div className="text-xs text-gray-500 mt-1">{item.error}</div>}
              </div>
              <button 
                onClick={handleClose}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
              >
                Remove
              </button>
            </div>
          </div>
        );
      
      case 'ready':
        return (
          <div className="flex-grow w-full h-full">
            <Xterm onData={handleTerminalData} ref={xTermRef} />
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'creating': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'ready': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  return (
    <div
      ref={dragRef}
      className="absolute flex flex-col w-[640px] h-[400px] rounded-lg shadow-xl select-none overflow-hidden border border-gray-700 bg-[#1e1e1e]"
      style={{
        left: `${item.position.x}px`,
        top: `${item.position.y}px`,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] cursor-grab">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>
        </div>
        
        <div className="flex-grow text-center text-gray-400 text-xs font-sans">
          {item.status === 'ready' && item.terminalId ? (
            <span title={`Terminal ID: ${item.terminalId}`}>
              Terminal: {item.terminalId.substring(0, 8)}...
            </span>
          ) : (
            <span title={`Item ID: ${item.id}`}>
              {item.status === 'creating' ? 'Creating...' : 
               item.status === 'error' ? 'Error' : 
               `ID: ${item.id.substring(0, 8)}...`}
            </span>
          )}
        </div>
        

        <button
          onClick={handleClose}
          className="close-button p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
          title="Close terminal"
        >
          <X size={14} />
        </button>
      </div>

      {renderTerminalContent()}
    </div>
  );
};

export default DraggableTerminal;
