import React, {
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import Xterm, { XtermRef } from "@/components/terminal/Terminal";
import { Loader2, AlertCircle, X, Minus, Maximize2, Square, Plus } from "lucide-react";
import { CanvasItem, SocketMessage } from "@/lib/types";

// Minimum and maximum dimensions for the terminal
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 800;

// Default dimensions
const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 400;

export interface DraggableTerminalRef {
  write: (data: string) => void;
}

interface DraggableTerminalProps {
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

const DraggableTerminal = forwardRef<
  DraggableTerminalRef,
  DraggableTerminalProps
>(
  (
    {
      item,
      onPositionChange,
      onRemove,
      sendMessage,
      zoom = 1,
      setCanvasPanningLocked,
    },
    ref
  ) => {
    const dragRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const initialPointerPosition = useRef({ x: 0, y: 0 });
    const initialItemPosition = useRef({ x: 0, y: 0 });
    const xTermRef = useRef<XtermRef>(null);
    const [dimensions, setDimensions] = useState({
      width: item.width || DEFAULT_WIDTH,
      height: item.height || DEFAULT_HEIGHT,
    });
    const [isMaximized, setIsMaximized] = useState(false);
    const [originalState, setOriginalState] = useState({
      width: item.width || DEFAULT_WIDTH,
      height: item.height || DEFAULT_HEIGHT,
      position: { x: 0, y: 0 }
    });

    // Update dimensions when item dimensions change (e.g., from backend sync)
    useEffect(() => {
      if (item.width !== undefined && item.height !== undefined) {
        setDimensions({
          width: item.width,
          height: item.height,
        });
      }
    }, [item.width, item.height]);

    // Handle window resize to ensure terminal fits
    useEffect(() => {
      const handleResize = () => {
        if (xTermRef.current) {
          xTermRef.current.fit();
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Send position updates via WebSocket
    const sendPositionUpdate = useCallback(() => {
      if (item.terminalId) {
        sendMessage('position_update', JSON.stringify({
          x: item.position.x,
          y: item.position.y,
          width: dimensions.width,
          height: dimensions.height
        }), item.terminalId);
      }
    }, [item.position, dimensions, item.terminalId, sendMessage]);

    // --- REMOVE THE OLD sendSizeUpdate FUNCTION ---
    // (It was here, and it was guessing.)

    // Send updates when position or dimensions change
    useEffect(() => {
      sendPositionUpdate();
    }, [item.position, sendPositionUpdate]);

    // --- ADD THIS EFFECT ---
    // This effect calls fit() whenever the pixel dimensions change
    useEffect(() => {
      // We use a small timeout to ensure the DOM has updated
      // before we tell xterm.js to fit its container.
      const timer = setTimeout(() => {
        xTermRef.current?.fit();
      }, 50);
      return () => clearTimeout(timer);
    }, [dimensions]);


    useImperativeHandle(ref, () => ({
      write: (data: string) => {
        if (item.status === "ready") {
          xTermRef.current?.write(data);
        }
      },
    }));

    // --- SIMPLIFY THIS FUNCTION ---
    // Remove the sendMessage call and all the guessing logic.
    // This function's ONLY job is to update the pixel state.
    const handleResize = useCallback((widthDelta: number, heightDelta: number) => {
      setDimensions(prev => {
        const newWidth = Math.min(Math.max(prev.width + widthDelta, MIN_WIDTH), MAX_WIDTH);
        const newHeight = Math.min(Math.max(prev.height + heightDelta, MIN_HEIGHT), MAX_HEIGHT);
        return {
          width: newWidth,
          height: newHeight
        };
      });
    }, []); // Removed dependencies

    const handleMaximize = useCallback(() => {
      if (isMaximized) {
        // Restore to original size and position
        setDimensions({
          width: originalState.width,
          height: originalState.height
        });
        onPositionChange(item.id, originalState.position);
      } else {
        // Save current state and maximize
        setOriginalState({
          width: dimensions.width,
          height: dimensions.height,
          position: { ...item.position }
        });
        
        // Maximize to 90% of window size
        const maxWidth = Math.min(window.innerWidth * 0.9, MAX_WIDTH);
        const maxHeight = Math.min(window.innerHeight * 0.9, MAX_HEIGHT);
        
        setDimensions({
          width: maxWidth,
          height: maxHeight
        });
        
        // Center on screen
        const centerX = (window.innerWidth - maxWidth) / 2;
        const centerY = (window.innerHeight - maxHeight) / 2;
        onPositionChange(item.id, { x: centerX, y: centerY });
      }
      
      setIsMaximized(!isMaximized);
    }, [isMaximized, originalState, dimensions, item.position, item.id, onPositionChange]);

    const handleMinimize = useCallback(() => {
      // Minimize to minimum size
      setDimensions({
        width: MIN_WIDTH,
        height: MIN_HEIGHT
      });
      setIsMaximized(false);
    }, []);

    const handleTerminalData = useCallback(
      (data: string) => {
        if (item.terminalId && item.status === "ready") {
          sendMessage("pty_input", data, item.terminalId);
        }
      },
      [sendMessage, item.terminalId, item.status]
    );
    
    // --- ADD THIS NEW HANDLER ---
    // This function is called by the <Xterm> component's onResize prop
    // It sends the *accurate* dimensions to the backend.
    const handleTerminalResize = useCallback((size: { cols: number; rows: number }) => {
      if (item.terminalId && item.status === "ready") {
        sendMessage('resize', JSON.stringify({
          cols: size.cols,
          rows: size.rows,
          width: Math.round(dimensions.width),
          height: Math.round(dimensions.height)
        }), item.terminalId);
      }
    }, [item.terminalId, item.status, dimensions.width, dimensions.height, sendMessage]);

    const handlePointerDown = (e: React.PointerEvent) => {
      // ... (no changes in this function)
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (
        target.closest(".close-button") ||
        target.closest(".xterm-viewport") ||
        target.closest(".resize-button")
      ) {
        return;
      }
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
      // ... (no changes in this function)
      if (!isDraggingRef.current) return;
      const dx = e.clientX - initialPointerPosition.current.x;
      const dy = e.clientY - initialPointerPosition.current.y;
      const newX = initialItemPosition.current.x + dx / zoom;
      const newY = initialItemPosition.current.y + dy / zoom;
      onPositionChange(item.id, { x: newX, y: newY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      // ... (no changes in this function)
      setCanvasPanningLocked?.(false);
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (dragRef.current) {
        dragRef.current.style.cursor = "grab";
        dragRef.current.releasePointerCapture(e.pointerId);
      }
    };

    const handleClose = useCallback(
      (e: React.MouseEvent) => {
        // ... (no changes in this function)
        e.stopPropagation();
        onRemove(item.id);
      },
      [onRemove, item.id]
    );

    const renderTerminalContent = () => {
      switch (item.status) {
        case "creating":
          // ... (no changes in this block)
          return (
            <div className="flex-grow flex items-center justify-center bg-[#1e1e1e] text-gray-400">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin" />
                <div className="text-sm">Creating terminal...</div>
              </div>
            </div>
          );

        case "error":
          // ... (no changes in this block)
          return (
            <div className="flex-grow flex items-center justify-center bg-[#1e1e1e] text-red-400">
              <div className="flex flex-col items-center gap-3">
                <AlertCircle size={32} />
                <div className="text-sm text-center">
                  <div>Failed to create terminal</div>
                  {item.error && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.error}
                    </div>
                  )}
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

        case "ready":
          return (
            <div className="flex-grow w-full h-full relative">
              {/* --- ADD THE onResize PROP HERE --- */}
              <Xterm
                onData={handleTerminalData}
                ref={xTermRef}
                onResize={handleTerminalResize}
              />
            </div>
          );

        default:
          return null;
      }
    };

    const getStatusColor = () => {
      // ... (no changes in this function)
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

    return (
      <div
        ref={dragRef}
        className="absolute flex flex-col rounded-lg shadow-xl select-none overflow-hidden border border-gray-700 bg-[#1e1e1e]"
        style={{
          left: `${item.position.x}px`,
          top: `${item.position.y}px`,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          touchAction: "none",
          cursor: isDraggingRef.current ? "grabbing" : "grab",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* ... (no changes to the JSX structure below) ... */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] cursor-grab">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleResize(-10, -10)}
                className="resize-button p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                title="Decrease size (-10px)"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={() => handleResize(10, 10)}
                className="resize-button p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                title="Increase size (+10px)"
              >
                <Plus size={12} />
              </button>
            </div>

            <div className="text-xs text-gray-400 font-mono ml-2">
              {dimensions.width}×{dimensions.height}
            </div>
          </div>

          <div className="flex-grow text-center text-gray-400 text-xs font-sans">
            {item.status === "ready" && item.terminalId ? (
              <span title={`Terminal ID: ${item.terminalId}`}>
                Terminal: {item.terminalId.substring(0, 8)}...
              </span>
            ) : (
              <span title={`Item ID: ${item.id}`}>
                {item.status === "creating"
                  ? "Creating..."
                  : item.status === "error"
                  ? "Error"
                  : `ID: ${
                      typeof item.id === "string"
                        ? item.id.substring(5, 13)
                        : ""
                    }...`}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleMinimize}
              className="resize-button p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
              title="Minimize to minimum size"
            >
              <Minus size={14} />
            </button>

            <button
              onClick={handleMaximize}
              className="resize-button p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
              title={isMaximized ? "Restore to original size" : "Maximize"}
            >
              {isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
            </button>

            <button
              onClick={handleClose}
              className="close-button p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
              title="Close terminal"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {renderTerminalContent()}
      </div>
    );
  }
);

DraggableTerminal.displayName = "DraggableTerminal";

export default DraggableTerminal;
