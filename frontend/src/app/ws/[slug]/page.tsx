'use client';

import React, { useState, useRef, useCallback, createRef } from 'react';
import InfiniteCanvas, { CanvasRef } from '@/components/canvas/InfiniteCanvas';
import {  Maximize, TerminalIcon, Loader2 } from 'lucide-react';
import DraggableTerminal, { DraggableTerminalRef } from "@/components/terminal/DraggableTerminal";
import { useParams, useSearchParams } from "next/navigation";
import { useTerminalSocket, SocketMessage } from "@/hooks/useSocket";


export interface CanvasItem {
    id: string;
    position: { x: number; y: number };
    color: string;
    terminalId?: string;
    status: 'creating' | 'ready' | 'error';
    error?: string;
}

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

    // 3. REMOVE the latestMessage state. It's no longer the right pattern.
    // const [latestMessage, setLatestMessage] = useState<SocketMessage | null>(null);

    const canvasRef = useRef<CanvasRef>(null);
    // 4. Create a ref to hold a map of terminal IDs to their component refs.
    const terminalRefs = useRef(new Map<string, React.RefObject<DraggableTerminalRef>>());

    const params = useParams();
    const searchParams = useSearchParams();
    const sessionId = params.slug as string;
    const [clientId] = useState(() =>
        searchParams.get('client_id') || `client_${Math.random().toString(36).substr(2, 9)}`
    );

    const handleSocketMessage = useCallback((message: SocketMessage) => {
        console.log('Canvas received socket message:', message);
        // setLatestMessage(message); // REMOVE THIS

        // This is the new, direct way to handle output
        if (message.type === 'pty_output' && message.terminalId && message.content) {
            const termRef = terminalRefs.current.get(message.terminalId);
            if (termRef?.current) {
                termRef.current.write(message.content);
            } else {
                console.warn(`Ref not found for terminalId: ${message.terminalId}`);
            }
            return; 
        }

        if (message.type === 'terminal_created' && message.terminalId && message.frontendId) {
            setItems(prevItems =>
                prevItems.map(item => {
                    if (item.id === message.frontendId) {

                        if (!terminalRefs.current.has(message.terminalId!)) {

                            terminalRefs.current.set(message.terminalId!, createRef() as React.RefObject<DraggableTerminalRef>);
                        }
                        return {
                            ...item,
                            terminalId: message.terminalId,
                            status: 'ready' as const,
                        };
                    }
                    return item;
                })
            );

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

    const handleError = useCallback((error: string) => {
        console.error('Terminal creation error:', error);
        setIsCreatingTerminal(false);
    }, []);

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

        const payload = { frontendId };
        sendMessage('create_terminal', JSON.stringify(payload));

    }, [isConnected, isCreatingTerminal, sendMessage]);

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
        const itemToRemove = items.find(item => item.id === id);
        if (itemToRemove && itemToRemove.terminalId) {
            terminalRefs.current.delete(itemToRemove.terminalId);
        }
        setItems(currentItems => currentItems.filter(item => item.id !== id));
    }, [items]); 

    return (
        <div className="h-screen w-screen bg-neutral-800">
            <Toolbar
                onAddItem={handleAddItem}
                onReset={handleResetView}
                isConnected={isConnected}
                isCreating={isCreatingTerminal}
            />

            <InfiniteCanvas ref={canvasRef}>
                {items.map((item) => {
                    const ref = item.terminalId ? terminalRefs.current.get(item.terminalId) : null;
                    return (
                        <DraggableTerminal
                            ref={ref}
                            key={item.id}
                            item={item}
                            onPositionChange={handlePositionChange}
                            onRemove={handleRemoveItem}
                            sessionId={sessionId}
                            clientId={clientId}
                            sendMessage={sendMessage}
                          
                        />
                    );
                })}
            </InfiniteCanvas>

            {!isConnected && (
                <div className="absolute bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg">
                    Disconnected from server
                </div>
            )}
        </div>
    );
}
