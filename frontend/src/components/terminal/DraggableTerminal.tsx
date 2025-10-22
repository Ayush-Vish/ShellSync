import React, {
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import Xterm, { XtermRef } from "@/components/terminal/Terminal";
import { Loader2, AlertCircle, X, Minus, Maximize2 } from "lucide-react";
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
  onDimensionChange?: (id: string, dimensions: { width: number; height: number }) => void;
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
      onDimensionChange,
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
    
    const dimensionsRef = useRef(dimensions);

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

    // Fit terminal when dimensions change
    useEffect(() => {
      if (xTermRef.current && item.status === 'ready') {
        const timer = setTimeout(() => {
          xTermRef.current?.fit();
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [dimensions.width, dimensions.height, item.status]);

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
    }, [item.position, item.terminalId, sendMessage, dimensions.width, dimensions.height]);

    useEffect(() => {
      sendPositionUpdate();
    }, [item.position, sendPositionUpdate]);

    useEffect(() => {
      const timer = setTimeout(() => {
        xTermRef.current?.fit();
      }, 50);
      return () => clearTimeout(timer);
    }, [dimensions]);

    useEffect(() => {
      dimensionsRef.current = dimensions;
    }, [dimensions]);

    useImperativeHandle(ref, () => ({
      write: (data: string) => {
        if (item.status === "ready") {
          xTermRef.current?.write(data);
        }
      },
    }));

    const handleMaximize = useCallback(() => {
      if (isMaximized) {
        const newDimensions = {
          width: originalState.width,
          height: originalState.height
        };
        setDimensions(newDimensions);
        onPositionChange(item.id, originalState.position);
        onDimensionChange?.(item.id, newDimensions);
      } else {
        setOriginalState({
          width: dimensions.width,
          height: dimensions.height,
          position: { ...item.position }
        });
        
        const maxWidth = Math.min(window.innerWidth * 0.9, MAX_WIDTH);
        const maxHeight = Math.min(window.innerHeight * 0.9, MAX_HEIGHT);
        
        const newDimensions = {
          width: maxWidth,
          height: maxHeight
        };
        setDimensions(newDimensions);
        onDimensionChange?.(item.id, newDimensions);
        
        const centerX = (window.innerWidth - maxWidth) / 2;
        const centerY = (window.innerHeight - maxHeight) / 2;
        onPositionChange(item.id, { x: centerX, y: centerY });
      }
      
      setIsMaximized(!isMaximized);
    }, [isMaximized, originalState, dimensions, item.position, item.id, onPositionChange, onDimensionChange]);

    const handleMinimize = useCallback(() => {
      const newDimensions = {
        width: MIN_WIDTH,
        height: MIN_HEIGHT
      };
      setDimensions(newDimensions);
      onDimensionChange?.(item.id, newDimensions);
      setIsMaximized(false);
    }, [item.id, onDimensionChange]);

    const handleTerminalData = useCallback(
      (data: string) => {
        if (item.terminalId && item.status === "ready") {
          sendMessage("pty_input", data, item.terminalId);
        }
      },
      [sendMessage, item.terminalId, item.status]
    );
    
    const handleTerminalResize = useCallback((size: { cols: number; rows: number }) => {
      if (item.terminalId && item.status === "ready") {
        const currentDimensions = dimensionsRef.current;
        sendMessage('resize', JSON.stringify({
          cols: size.cols,
          rows: size.rows,
          width: Math.round(currentDimensions.width),
          height: Math.round(currentDimensions.height)
        }), item.terminalId);
      }
    }, [item.terminalId, item.status, sendMessage]);

    const handlePointerDown = (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (
        target.closest(".window-button") ||
        target.closest(".xterm-viewport")
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

    const handleClose = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(item.id);
      },
      [onRemove, item.id]
    );

    const renderTerminalContent = () => {
      switch (item.status) {
        case "creating":
          return (
            <div className="flex-grow flex items-center justify-center bg-[#1a1b26] text-gray-400">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin" />
                <div className="text-sm">Creating terminal...</div>
              </div>
            </div>
          );

        case "error":
          return (
            <div className="flex-grow flex items-center justify-center bg-[#1a1b26] text-red-400">
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

    return (
      <div
        ref={dragRef}
        className="absolute flex flex-col rounded-lg shadow-xl select-none overflow-hidden border border-gray-700/50 bg-[#1a1b26]"
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
        {/* macOS-style header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#24283b] cursor-grab border-b border-gray-700/30">
          {/* Left: macOS window controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              className="window-button w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff4136] transition-colors flex items-center justify-center group"
              title="Close"
            >
              <X size={8} className="opacity-0 group-hover:opacity-100 text-[#4a0000] transition-opacity" strokeWidth={3} />
            </button>
            <button
              onClick={handleMinimize}
              className="window-button w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ff9500] transition-colors flex items-center justify-center group"
              title="Minimize"
            >
              <Minus size={8} className="opacity-0 group-hover:opacity-100 text-[#4a3000] transition-opacity" strokeWidth={3} />
            </button>
            <button
              onClick={handleMaximize}
              className="window-button w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#00d100] transition-colors flex items-center justify-center group"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              <Maximize2 size={7} className="opacity-0 group-hover:opacity-100 text-[#003a00] transition-opacity" strokeWidth={3} />
            </button>
          </div>

          {/* Center: Terminal info */}
          <div className="flex-grow text-center text-gray-400 text-xs font-medium">
            {item.status === "ready" && item.terminalId ? (
              <span title={`Terminal ID: ${item.terminalId}`}>
                {item.terminalId.substring(0, 8)}...
              </span>
            ) : (
              <span>
                {item.status === "creating"
                  ? "Creating..."
                  : item.status === "error"
                  ? "Error"
                  : "Terminal"}
              </span>
            )}
          </div>

          {/* Right: Dimensions display */}
          <div className="text-xs text-gray-500 font-mono">
            {dimensions.width}×{dimensions.height}
          </div>
        </div>

        {renderTerminalContent()}
      </div>
    );
  }
);

DraggableTerminal.displayName = "DraggableTerminal";

export default DraggableTerminal;
