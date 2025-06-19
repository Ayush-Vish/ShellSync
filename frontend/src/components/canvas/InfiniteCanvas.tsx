'use client';

import React, {
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
    MouseEvent,
    Children,
    cloneElement,
    isValidElement
} from 'react';
import { TouchZoom, INITIAL_ZOOM } from '@/utils/touchZoom'; // Adjust import path

export interface CanvasRef {
    resetView: () => void;
    getCanvasCenter: () => { x: number; y: number };
}

interface InfiniteCanvasProps {
    children: React.ReactNode;
}

const InfiniteCanvas = forwardRef<CanvasRef, InfiniteCanvasProps>(({ children }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const touchZoomRef = useRef<TouchZoom | null>(null);

    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(INITIAL_ZOOM);

    const isPanning = useRef(false);

    // This function will be passed to children to let them lock/unlock canvas panning.
    const setCanvasPanningLocked = (isLocked: boolean) => {
        if (touchZoomRef.current) {
            touchZoomRef.current.isPanningLocked = isLocked;
        }
    };

    useImperativeHandle(ref, () => ({
        resetView: () => {
            touchZoomRef.current?.reset();
        },
        getCanvasCenter: () => {
            if (!canvasRef.current) return { x: 0, y: 0 };
            const rect = canvasRef.current.getBoundingClientRect();
            return {
                x: (rect.width / 2 - pan.x) / zoom,
                y: (rect.height / 2 - pan.y) / zoom,
            };
        }
    }));

    useEffect(() => {
        const canvasElement = canvasRef.current;
        if (!canvasElement) return;

        const touchZoom = new TouchZoom(canvasElement);
        touchZoomRef.current = touchZoom;

        const unsubscribe = touchZoom.onMove(() => {
            const [x, y] = touchZoom.center;
            setPan({ x, y });
            setZoom(touchZoom.zoom);
        });

        return () => {
            unsubscribe();
            touchZoom.destroy();
        };
    }, []);

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            isPanning.current = true;
            e.currentTarget.style.cursor = 'grabbing';
        }
    };

    const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
        if (isPanning.current) {
            isPanning.current = false;
            e.currentTarget.style.cursor = 'grab';
        }
    };

    return (
        <div
            ref={canvasRef}
            className="h-full w-full overflow-hidden bg-neutral-900 relative touch-none"
            style={{ cursor: 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                className="absolute top-0 left-0"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                }}
            >
                {/* Clone children to inject the zoom and the pan-locking function */}
                {Children.map(children, (child) => {
                    if (isValidElement(child)) {
                        return cloneElement(child as React.ReactElement<any>, {
                            zoom,
                            setCanvasPanningLocked,
                        });
                    }
                    return child;
                })}
            </div>
        </div>
    );
});

InfiniteCanvas.displayName = 'InfiniteCanvas';
export default InfiniteCanvas;