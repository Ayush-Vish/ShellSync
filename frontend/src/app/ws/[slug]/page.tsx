'use client';

import React, { useState, useRef, useCallback, createRef, useEffect } from 'react';
import InfiniteCanvas, { CanvasRef } from '@/components/canvas/InfiniteCanvas';
import DraggableTerminal, { DraggableTerminalRef } from "@/components/terminal/DraggableTerminal";
import { useParams } from "next/navigation";
import { useAuthenticatedSocket } from "@/hooks/useAuthenticatedSocket";
import PasswordPrompt from "@/components/auth/PasswordPrompt";
import PermissionsSidebar, { Client } from "@/components/sidebar/PermissionsSidebar";
import Toolbar from '@/components/canvas/Toolbar';
import { CanvasItem, SocketMessage } from '@/lib/types';

export default function CanvasPage() {
    const [items, setItems] = useState<CanvasItem[]>([]);
    const [isCreatingTerminal, setIsCreatingTerminal] = useState(false);
    const [permission, setPermission] = useState<'host' | 'read-write' | 'read-only' | null>(null);
    const [clients, setClients] = useState<Client[]>([]);

    const canvasRef = useRef<CanvasRef>(null);
    const terminalRefs = useRef(new Map<string, React.RefObject<DraggableTerminalRef | null>>());
    const subscribedTerminalIds = useRef(new Set<string>());

    const params = useParams();
    const sessionId = params.slug as string;

    const handleSocketMessage = useCallback((message: SocketMessage) => {
        console.log('Canvas received socket message:', message);

        if (message.type === 'session_state' && message.terminals) {
            setItems(prevItems => {
                const existingIds = new Set(prevItems.map(item => item.id));
                const newItems = (message.terminals || [])
                    .filter(term => !existingIds.has(term.frontendId))
                    .map(term => ({
                        id: term.frontendId,
                        type: 'terminal' as const,
                        position: { x: term.x, y: term.y },
                        color: "#4bd2f3",
                        terminalId: term.terminalId,
                        status: term.status as 'creating' | 'ready' | 'error',
                        width: term.width || 640,
                        height: term.height || 400,
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
                        width: message.width || 640, // Set width
                        height: message.height || 400, // Set height
                    };
                } else {
                    console.log(`Creating new terminal for other client, frontendId: ${message.frontendId}`);
                    const newItem: CanvasItem = {
                        id: message.frontendId!,
                        type: 'terminal',
                        position: { x: message.x ?? 200, y: message.y ?? 200 },
                        color: "#4bd2f3",
                        terminalId: message.terminalId,
                        status: 'ready',
                        width: message.width || 640,
                        height: message.height || 400,
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

        if (message.type === 'terminal_removed' && message.terminalId) {
            const terminalIdToRemove = message.terminalId;
            setItems(prevItems => prevItems.filter(item => item.terminalId !== terminalIdToRemove));
            terminalRefs.current.delete(terminalIdToRemove);
            subscribedTerminalIds.current.delete(terminalIdToRemove);
            return;
        }

        if (message.type === 'terminal_position_updated' && message.terminalId && message.x !== undefined && message.y !== undefined) {
            console.log('Received position update:', { terminalId: message.terminalId, x: message.x, y: message.y });
            setItems(prevItems => {
                const updatedItems = [...prevItems];
                const itemIndex = updatedItems.findIndex(item => item.terminalId === message.terminalId);
                
                if (itemIndex !== -1) {
                    const currentItem = updatedItems[itemIndex];
                    if (currentItem.position.x !== message.x || currentItem.position.y !== message.y) {
                        updatedItems[itemIndex] = {
                            ...currentItem,
                            position: { 
                                x: message.x as number, 
                                y: message.y as number 
                            }
                        };
                        return updatedItems;
                    }
                }
                return prevItems;
            });
            return;
        }

        // ADD THIS: Handle terminal resize updates from other clients
        if (message.type === 'terminal_resized' && message.terminalId && message.width !== undefined && message.height !== undefined) {
            console.log('Received resize update:', { terminalId: message.terminalId, width: message.width, height: message.height });
            setItems(prevItems => {
                const updatedItems = [...prevItems];
                const itemIndex = updatedItems.findIndex(item => item.terminalId === message.terminalId);
                
                if (itemIndex !== -1) {
                    const currentItem = updatedItems[itemIndex];
                    if (currentItem.width !== message.width || currentItem.height !== message.height) {
                        updatedItems[itemIndex] = {
                            ...currentItem,
                            width: message.width,
                            height: message.height,
                        };
                        return updatedItems;
                    }
                }
                return prevItems;
            });
            return;
        }

        // Handle client list updates
        if (message.type === 'clients_list' && message.clients) {
            console.log('Received clients list:', message.clients);
            setClients(message.clients as Client[]);
            return;
        }

        // Handle permission updates
        if (message.type === 'permission_updated' && message.clientId && message.permission) {
            console.log('Permission updated:', message.clientId, message.permission);
            setClients(prev => prev.map(client =>
                client.clientId === message.clientId
                    ? { ...client, permission: message.permission as 'host' | 'read-write' | 'read-only' }
                    : client
            ));
            return;
        }
    }, []); 

    const handleAuthSuccess = useCallback((clientId: string, userPermission: string) => {
        console.log('Authentication successful:', clientId, userPermission);
        setPermission(userPermission as 'host' | 'read-write' | 'read-only');
    }, []);

    const {
        isConnected,
        authState,
        authenticate,
        sendMessage,
    } = useAuthenticatedSocket(
        sessionId,
        handleSocketMessage,
        handleAuthSuccess
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
            width: 640, // Set initial width
            height: 400, // Set initial height
            type: 'terminal',
        };

        setItems(prevItems => [...prevItems, newItem]);

        const payload = { 
            frontendId, 
            x: newItem.position.x, 
            y: newItem.position.y,
            width: newItem.width, // Send initial dimensions
            height: newItem.height,
        };
        sendMessage('create_terminal', JSON.stringify(payload));

    }, [isConnected, isCreatingTerminal, sendMessage]);

    const handleResetView = useCallback(() => {
        canvasRef.current?.resetView();
    }, []);

    const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
        setItems(currentItems => {
            const updatedItems = currentItems.map(item =>
                item.id === id ? { ...item, position } : item
            );
            
            const movedItem = updatedItems.find(item => item.id === id);
            if (movedItem?.terminalId) {
                const payload = {
                    terminalId: movedItem.terminalId,
                    x: position.x,
                    y: position.y,
                };
                sendMessage(
                    'terminal_position_updated',
                    JSON.stringify(payload),
                    movedItem.terminalId
                );
            }
            
            return updatedItems;
        });
    }, [sendMessage]);

    const handleDimensionChange = useCallback((id: string, dimensions: { width: number; height: number }) => {
        setItems(currentItems => {
            const updatedItems = currentItems.map(item =>
                item.id === id ? { ...item, width: dimensions.width, height: dimensions.height } : item
            );
            
            const resizedItem = updatedItems.find(item => item.id === id);
            if (resizedItem?.terminalId) {
                const payload = {
                    x: resizedItem.position.x,
                    y: resizedItem.position.y,
                    width: dimensions.width,
                    height: dimensions.height,
                };
                sendMessage(
                    'position_update',
                    JSON.stringify(payload),
                    resizedItem.terminalId
                );
            }
            
            return updatedItems;
        });
    }, [sendMessage]);

    const handleRemoveItem = useCallback((id: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
    }, []);

    // Show password prompt if not authenticated
    if (!authState.isAuthenticated) {
        return (
            <PasswordPrompt
                sessionId={sessionId}
                onSubmit={(password, name) => authenticate(password, name)}
                error={authState.authError || undefined}
            />
        );
    }

    return (
        <div className="h-screen w-screen bg-neutral-800">
            {/* Permissions Sidebar - only for host */}
            {permission === 'host' && (
                <PermissionsSidebar
                    isHost={true}
                    currentClientId={authState.clientId || ''}
                    clients={clients}
                    sendMessage={sendMessage}
                />
            )}

            <Toolbar
                onAddItem={handleAddItem}
                onReset={handleResetView}
                isConnected={isConnected}
                isCreating={isCreatingTerminal}
            />

            <InfiniteCanvas ref={canvasRef}>
                {items.map((item) => {
                    const terminalRef = item.terminalId ? terminalRefs.current.get(item.terminalId) : undefined;
                    return (
                        <DraggableTerminal
                            ref={terminalRef}
                            key={item.id}
                            item={item}
                            onPositionChange={handlePositionChange}
                            onDimensionChange={handleDimensionChange}
                            onRemove={handleRemoveItem}
                            sessionId={sessionId}
                            clientId={authState.clientId || ''}
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
