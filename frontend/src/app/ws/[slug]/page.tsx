'use client';

import React, { useState, useRef, useCallback, createRef, useEffect } from 'react';
import InfiniteCanvas, { CanvasRef } from '@/components/canvas/InfiniteCanvas';
import DraggableTerminal, { DraggableTerminalRef } from "@/components/terminal/DraggableTerminal";
import { useParams, useSearchParams } from "next/navigation";
import { useTerminalSocket } from "@/hooks/useSocket";
import Toolbar from '@/components/canvas/Toolbar';
import { CanvasItem, SocketMessage } from '@/lib/types';

export default function CanvasPage() {
    const [items, setItems] = useState<CanvasItem[]>([]);
    const [isCreatingTerminal, setIsCreatingTerminal] = useState(false);

    const canvasRef = useRef<CanvasRef>(null);
    const terminalRefs = useRef(new Map<string, React.RefObject<DraggableTerminalRef | null>>());
    const subscribedTerminalIds = useRef(new Set<string>());

    const params = useParams();
    const searchParams = useSearchParams();
    const sessionId = params.slug as string;
    const [clientId] = useState(() =>
        searchParams.get('client_id') || `client_${Math.random().toString(36).substr(2, 9)}`
    );
    const handleSocketMessage = useCallback((message: SocketMessage) => {
        console.log('Canvas received socket message:', message);

        if (message.type === 'session_state' && message.terminals) {
            setItems(prevItems => {
                const existingIds = new Set(prevItems.map(item => item.id));
                const newItems = (message.terminals || [])
                    .filter(term => !existingIds.has(term.frontendId))
                    .map(term => ({
                        id: term.frontendId,
                        position: { x: term.x, y: term.y },
                        color: "#4bd2f3",
                        terminalId: term.terminalId,
                        status: term.status as 'creating' | 'ready' | 'error',
                    }));
                
                newItems.forEach(item => {
                    if (item.terminalId && !terminalRefs.current.has(item.terminalId)) {
                        terminalRefs.current.set(item.terminalId, createRef<DraggableTerminalRef>());
                    }
                });
                return [...prevItems, ...newItems];
            });
            return;
        }

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
            setItems(prevItems => {
                const existingItemIndex = prevItems.findIndex(item => item.id === message.frontendId);
                const updatedItems = [...prevItems];

                if (existingItemIndex !== -1) {
                    console.log(`Updating existing terminal for frontendId: ${message.frontendId}`);
                    updatedItems[existingItemIndex] = {
                        ...updatedItems[existingItemIndex],
                        terminalId: message.terminalId,
                        status: 'ready',
                    };
                } else {
                    console.log(`Creating new terminal for other client, frontendId: ${message.frontendId}`);
                    const newItem: CanvasItem = {
                        id: message.frontendId!,
                        position: { x: message.x ?? 200, y: message.y ?? 200 },
                        color: "#4bd2f3",
                        terminalId: message.terminalId,
                        status: 'ready',
                    };
                    updatedItems.push(newItem);
                }
                return updatedItems;
            });

            if (!terminalRefs.current.has(message.terminalId)) {
                terminalRefs.current.set(message.terminalId, createRef<DraggableTerminalRef>());
            }

            setIsCreatingTerminal(false);
            return;
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
    }, []); // Empty dependency array as we've removed the need for `sendMessage`.

    const {
        sendMessage,
        isConnected,
    } = useTerminalSocket(
        sessionId,
        clientId,
        handleSocketMessage
    );


    useEffect(() => {
        items.forEach(item => {
            if (item.terminalId && !subscribedTerminalIds.current.has(item.terminalId)) {
                console.log(`Subscribing to terminal history for ${item.terminalId}`);
                sendMessage('subscribe', undefined, item.terminalId);
                subscribedTerminalIds.current.add(item.terminalId);
            }
        });
    }, [items, sendMessage]);


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

        const payload = { frontendId, x: newItem.position.x, y: newItem.position.y };
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
            subscribedTerminalIds.current.delete(itemToRemove.terminalId); // Clean up subscription tracking
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
                    // FIX: Retrieve the ref. It can be undefined if the terminalId doesn't exist yet,
                    // which is fine as the ref prop on a component can be null or undefined.
                    const terminalRef = item.terminalId ? terminalRefs.current.get(item.terminalId) : undefined;
                    return (
                        <DraggableTerminal
                            ref={terminalRef}
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
