'use client';

import React, { useState, useRef } from 'react';
import InfiniteCanvas, { CanvasRef } from '@/components/canvas/InfiniteCanvas'; // Adjust path
import { Plus, Maximize } from 'lucide-react';

interface CanvasItem {
    id: string;
    position: { x: number; y: number };
    color: string;
}

const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];

// A draggable component to render on the canvas
interface DraggableComponentProps {
    item: CanvasItem;
    onPositionChange: (id: string, position: { x: number; y: number }) => void;
    zoom?: number; // Injected by InfiniteCanvas
    setCanvasPanningLocked?: (isLocked: boolean) => void; // Injected by InfiniteCanvas
}

const DraggableComponent = ({
                                item,
                                onPositionChange,
                                zoom = 1,
                                setCanvasPanningLocked
                            }: DraggableComponentProps) => {
    const dragRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    const initialPointerPosition = useRef({ x: 0, y: 0 });
    const initialItemPosition = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0) return;

        // Tell the canvas to stop panning
        setCanvasPanningLocked?.(true);
        e.stopPropagation();

        isDraggingRef.current = true;
        initialPointerPosition.current = { x: e.clientX, y: e.clientY };
        initialItemPosition.current = item.position;

        if (dragRef.current) {
            dragRef.current.style.cursor = 'grabbing';
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
        // Tell the canvas it can resume panning
        setCanvasPanningLocked?.(false);

        if (!isDraggingRef.current) return;

        isDraggingRef.current = false;
        if (dragRef.current) {
            dragRef.current.style.cursor = 'grab';
            dragRef.current.releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div
            ref={dragRef}
            className="absolute w-64 h-40 rounded-lg shadow-xl flex items-center justify-center font-bold text-white text-lg select-none"
            style={{
                left: `${item.position.x}px`,
                top: `${item.position.y}px`,
                backgroundColor: item.color,
                cursor: 'grab',
                touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp} // Also unlock on cancel
        >
            {`Component ${item.id}`}
        </div>
    );
};


// The Toolbar UI (no changes)
const Toolbar = ({ onAddItem, onReset }: { onAddItem: () => void, onReset: () => void }) => (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <button
            onClick={onAddItem}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-lg"
        >
            <Plus size={18} />
            Add Component
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

// The main page component (no other changes needed)
export default function CanvasPage() {
    const [items, setItems] = useState<CanvasItem[]>([]);
    const canvasRef = useRef<CanvasRef>(null);

    const handleAddItem = () => {
        const newItem: CanvasItem = {
            id: `item-${items.length + 1}`,
            position: canvasRef.current?.getCanvasCenter() ?? { x: 200, y: 200 },
            color: colors[items.length % colors.length],
        };
        setItems((prevItems) => [...prevItems, newItem]);
    };

    const handleResetView = () => {
        canvasRef.current?.resetView();
    };

    const handlePositionChange = (id: string, position: { x: number; y: number }) => {
        setItems((currentItems) =>
            currentItems.map((item) =>
                item.id === id ? { ...item, position } : item
            )
        );
    };

    return (
        <div className="h-screen w-screen bg-neutral-800">
            <Toolbar onAddItem={handleAddItem} onReset={handleResetView} />
            <InfiniteCanvas ref={canvasRef}>
                {items.map((item) => (
                    <DraggableComponent
                        key={item.id}
                        item={item}
                        onPositionChange={handlePositionChange}
                    />
                ))}
            </InfiniteCanvas>
        </div>
    );
}