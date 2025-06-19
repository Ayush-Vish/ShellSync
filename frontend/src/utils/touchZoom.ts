/**
 * @file Handles pan and zoom events to create an infinite canvas.
 * This class is framework-agnostic and can be used in any environment.
 * Based on your provided code, which is inspired by tldraw and Dispict.
 */
import { Gesture, type Handler } from '@use-gesture/vanilla';
import Vec from '@tldraw/vec';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
export const INITIAL_ZOOM = 1.0;

function isDarwin(): boolean {
    if (typeof window === 'undefined') return false;
    return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
}

export class TouchZoom {
    #node: HTMLElement;
    #gesture: Gesture;

    #bounds = { minX: 0, minY: 0 };
    #callbacks = new Set<() => void>();

    isPinching = false;
    center: number[] = [0, 0];
    zoom = INITIAL_ZOOM;

    /** A flag to disable panning, controlled by the parent React component. */
    public isPanningLocked = false;

    constructor(node: HTMLElement) {
        this.#node = node;
        this.#updateBounds();
        window.addEventListener('resize', this.#updateBounds);

        this.#gesture = new Gesture(
            node,
            {
                onWheel: this.#handleWheel,
                onPinchStart: this.#handlePinchStart,
                onPinch: this.#handlePinch,
                onPinchEnd: this.#handlePinchEnd,
                onDrag: this.#handleDrag,
            },
            {
                target: node,
                eventOptions: { passive: false },
                pinch: { from: [this.zoom, 0], scaleBounds: { min: MIN_ZOOM, max: MAX_ZOOM } },
                drag: { filterTaps: true, pointer: { keys: false } },
            },
        );
    }

    // --- Private Methods ---

    #getPoint = (e: PointerEvent | Touch | WheelEvent): number[] => [
        e.clientX - this.#bounds.minX,
        e.clientY - this.#bounds.minY,
    ];

    #updateBounds = () => {
        const rect = this.#node.getBoundingClientRect();
        this.#bounds = { minX: rect.left, minY: rect.top };
    };

    #notify = () => {
        for (const callback of this.#callbacks) {
            callback();
        }
    };

    #handleWheel: Handler<'wheel', WheelEvent> = ({ event: e }) => {
        e.preventDefault();
        if (this.isPinching) return;

        const [x, y] = [e.deltaX, e.deltaY];

        if (e.ctrlKey) {
            const delta = y;
            const point = [this.#node.clientWidth / 2, this.#node.clientHeight / 2];
            const newZoom = Vec.clamp(this.zoom - delta / 100, MIN_ZOOM, MAX_ZOOM);
            const p0 = Vec.sub(point, this.center);
            const p1 = Vec.mul(p0, newZoom / this.zoom);
            this.center = Vec.sub(point, p1);
            this.zoom = newZoom;
            this.#notify();
            return;
        }

        const delta = e.shiftKey && !isDarwin() ? [y, 0] : [x, y];
        if (Vec.isEqual(delta, [0, 0])) return;
        this.center = Vec.sub(this.center, Vec.div(delta, this.zoom));
        this.#notify();
    };

    #handlePinchStart: Handler<'pinch'> = () => {
        this.isPinching = true;
    };

    #handlePinch: Handler<'pinch'> = ({ origin, offset: [d] }) => {
        const point = this.#getPoint({ clientX: origin[0], clientY: origin[1] } as PointerEvent);
        const p0 = Vec.sub(point, this.center);
        const p1 = Vec.mul(p0, d / this.zoom);
        this.center = Vec.sub(point, p1);
        this.zoom = d;
        this.#notify();
    };

    #handlePinchEnd: Handler<'pinch'> = () => {
        this.isPinching = false;
    };

    #handleDrag: Handler<'drag'> = ({ delta }) => {
        // *** THIS IS THE KEY CHANGE ***
        // If panning is locked by a child component, do nothing.
        if (this.isPanningLocked) return;

        this.center = Vec.sub(this.center, Vec.div(delta, this.zoom));
        this.#notify();
    };

    // --- Public API ---

    onMove(callback: () => void): () => void {
        this.#callbacks.add(callback);
        return () => this.#callbacks.delete(callback);
    }

    reset = () => {
        this.center = [0, 0];
        this.zoom = INITIAL_ZOOM;
        this.#notify();
    };

    destroy = () => {
        window.removeEventListener('resize', this.#updateBounds);
        this.#gesture.destroy();
    };
}