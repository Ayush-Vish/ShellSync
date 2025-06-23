'use client';

import React, { useState, useRef, useCallback } from 'react';
import InfiniteCanvas, { CanvasRef } from '@/components/canvas/InfiniteCanvas';
import {  Maximize, TerminalIcon, Loader2 } from 'lucide-react';
import DraggableTerminal from "@/components/terminal/DraggableTerminal";
import { useParams, useSearchParams } from "next/navigation";
import { useTerminalSocket, SocketMessage } from "@/hooks/useSocket";

export interface CanvasItem {
    id: string; // This is the frontend-specific ID
    position: { x: number; y: number };
    color: string;
    terminalId?: string; // This is the backend-specific ID
    status: 'creating' | 'ready' | 'error';
    error?: string;
}

// ... Toolbar component is unchanged ...
const Toolbar = ({ 
    onAddItem, 
    onReset, 
    isConnected,
    isCreating 
}: { 
    onAddItem: () => void;
    onReset: () => void;
    isConnected: boolean;
    isCreating: boolean;
}) => (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
             title={isConnected ? 'Connected' : 'Disconnected'} />
        
        <button
            onClick={onAddItem}
            disabled={!isConnected || isCreating}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
            {isCreating ? (
                <Loader2 size={18} className="animate-spin" />
            ) : (
                <TerminalIcon size={18} />
            )}
            {isCreating ? 'Creating...' : 'Add Terminal'}
        </button>
        
        <button
            onClick={onReset}
            className="flex p-2 bg-neutral-700 text-white rounded-md hover:bg-neutral-600 transition-colors shadow-lg"
            title="Reset View"
        >
            <Maximize size={18} />
        </button>
    </div>
);


export default function CanvasPage() {
    const [items, setItems] = useState<CanvasItem[]>([]);
    const [isCreatingTerminal, setIsCreatingTerminal] = useState(false);
    // NEW: State to hold the last message received from the socket
    const [latestMessage, setLatestMessage] = useState<SocketMessage | null>(null);
    const canvasRef = useRef<CanvasRef>(null);
    
    const params = useParams();
    const searchParams = useSearchParams();
    const sessionId = params.slug as string;
    const [clientId] = useState(() => 
        searchParams.get('client_id') || `client_${Math.random().toString(36).substr(2, 9)}`
    );

    // This is now the single source of truth for handling ALL messages.
    const handleSocketMessage = useCallback((message: SocketMessage) => {
        console.log('Canvas received socket message:', message);
        setLatestMessage(message); // Update state to trigger re-render in children
        
        if (message.type === 'terminal_created' && message.terminalId && message.frontendId) {
            setItems(prevItems =>
                prevItems.map(item => {
                    if (item.id === message.frontendId) {
                        return {
                            ...item,
                            terminalId: message.terminalId,
                            status: 'ready' as const,
                        };
                    }
                    return item;
                })
            );
            // This logic might need to be more robust if multiple creations can happen
            // For now, we'll assume it's okay to set this to false on any successful creation.
            setIsCreatingTerminal(false);
        }
        if (message.type === 'terminal_error' && message.frontendId) {
             setItems(prevItems =>
                prevItems.map(item =>
                    item.id === message.frontendId
                        ? { ...item, status: 'error' as const, error: message.error }
                        : item
                )
            );
            setIsCreatingTerminal(false);
        }
    }, []);

    const handleTerminalCreated = useCallback((terminalId: string) => {
        console.log('Terminal created with ID:', terminalId);
    }, []);

    // const handleError = useCallback((error: string) => {
    //     console.error('Terminal creation error:', error);
    //     setIsCreatingTerminal(false);
        
    //     setItems(prevItems => 
    //         prevItems.map(item => 
    //             item.status === 'creating' && !item.terminalId 
    //                 ? { ...item, status: 'error' as const, error }
    //                 : item
    //         )
    //     );
    // }, []);
    const handleError = useCallback((error: string) => {
        console.error('Terminal creation error:', error);
        // This general error handler is now less important, as specific errors are handled above.
        // You might use it for connection errors instead.
        setIsCreatingTerminal(false);
    }, []);

    // This is now the ONLY call to useTerminalSocket
     const { 
        sendMessage,
        isConnected,
    } = useTerminalSocket(
        sessionId,
        clientId,
        handleSocketMessage,
        handleTerminalCreated,
        handleError
    );

    const handleAddItem = useCallback(() => {
        if (!isConnected || isCreatingTerminal) return;
        
        setIsCreatingTerminal(true);
         const frontendId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newItem: CanvasItem = {
            id: frontendId,
            position: canvasRef.current?.getCanvasCenter() ?? { x: 200, y: 200 },
            color: "#4bd2f3",
            status: 'creating',
        };
        
        setItems(prevItems => [...prevItems, newItem]);
        
        // This now just sends a message, doesn't manage a terminal state locally
                const payload = { frontendId };

        sendMessage('create_terminal', JSON.stringify(payload)); 

    }, [isConnected, isCreatingTerminal, sendMessage]); // Use sendMessage from the hook

    const handleResetView = useCallback(() => {
        canvasRef.current?.resetView();
    }, []);

    const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
        setItems(currentItems =>
            currentItems.map(item =>
                item.id === id ? { ...item, position } : item
            )
        );
    }, []);

    const handleRemoveItem = useCallback((id: string) => {
        setItems(currentItems => currentItems.filter(item => item.id !== id));
    }, []);

    return (
        <div className="h-screen w-screen bg-neutral-800">
            <Toolbar 
                onAddItem={handleAddItem} 
                onReset={handleResetView}
                isConnected={isConnected}
                isCreating={isCreatingTerminal}
            />
            
            <InfiniteCanvas ref={canvasRef}>
                {items.map((item) => (
                    <DraggableTerminal
                        key={item.id}
                        item={item}
                        onPositionChange={handlePositionChange}
                        onRemove={handleRemoveItem}
                        sessionId={sessionId}
                        clientId={clientId}
                        // Pass the required props down
                        sendMessage={sendMessage}
                        latestMessage={latestMessage}
                    />
                ))}
            </InfiniteCanvas>
            
            {!isConnected && (
                <div className="absolute bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg">
                    Disconnected from server
                </div>
            )}
        </div>
    );
}
