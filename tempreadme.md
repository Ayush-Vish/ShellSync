PATH="${PATH}:${HOME}/go/bin"


# ShellSync

Shellsync is a collaborative terminal-sharing application. The Go server manages sessions and relays terminal data, the Go client runs a local shell and communicates via gRPC, and the Next.js frontend provides a web-based terminal interface using WebSocket.


# TODO:

## MileStones

- [x] Create CreateSession functionality.
- [x] Store session in the in memory state.
- [x] Configure Pty on the Shellsync Agent.
- [x] Add Bidirectional streaming functionality b/w the agent and server.
- [x] Integrate `xterm.js` component in the frontend.
- [x] Connect via WebSocket.
- [ ] Make infinite canvas component.
- [ ] Make a gesture Engine to pan and Zoom infinite canvas.
- [ ] Create a Toolbar to spawn a new pty client and in the canvas.
- [ ] Create functionality to spawn multiple pyt in the same client.
- 

## Challenges Faced.
 
- Bidirectional Grpc Implementation.
- Setting up Pseudo Terminals.
- Writing concurrently in Sockets.
- This is a classic React dependency cycle issue, and your code comments point directly to the cause.

Your local terminal's content disappears because the entire xterm.js instance is being destroyed and re-created every time you resize, not just refitted.

Here is the exact sequence of events causing the bug:

You click a resize button (e.g., + or Maximize).

Your handleResize or handleMaximize function calls setDimensions(...).

The DraggableTerminal component re-renders with a new dimensions state.

Your handleTerminalResize function is inside a useCallback that has dimensions.width and dimensions.height in its dependency array:

JavaScript

const handleTerminalResize = useCallback((...) => {
  // ...
  // This line creates the dependency:
  width: Math.round(dimensions.width), 
  height: Math.round(dimensions.height)
  // ...
}, [..., dimensions.width, dimensions.height, ...]); // <-- The problem
Because dimensions just changed, useCallback creates a new instance of the handleTerminalResize function.

This new function instance is passed as the onResize prop to your <Xterm> component.

Inside your <Xterm> component, the main useEffect hook depends on this onResize prop:

JavaScript

useEffect(() => {
  // ...
  return () => {
    // ...
    term.dispose(); // <-- Cleanup function
  };
}, [onData, onResize]); // <-- This prop changed
Because onResize is a new function (a new reference), React re-runs this useEffect.

Before running the effect, React runs the cleanup function from the previous render: term.dispose() is called.

term.dispose() completely destroys the terminal instance, wiping out its buffer and content.

The useEffect then runs again, creating a new XTerminal(...), which is blank.

# FIX 

The Fix
To fix this, you must break the dependency cycle. handleTerminalResize needs to read the current dimensions, but it must not depend on them. The standard way to do this is with a useRef.

You have this same bug in two places: handleTerminalResize and sendPositionUpdate. Here is how to fix both.

In DraggableTerminal
1. Create a ref to hold the current dimensions:

JavaScript

// ...
import {
  useCallback,
  useRef, // <--- Import useRef
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
// ...

const DraggableTerminal = forwardRef<
  DraggableTerminalRef,
  DraggableTerminalProps
>(
  (
    {
      // ...
    },
    ref
  ) => {
    // ...
    const xTermRef = useRef<XtermRef>(null);
    const [dimensions, setDimensions] = useState({
      width: item.width || DEFAULT_WIDTH,
      height: item.height || DEFAULT_HEIGHT,
    });
    
    // --- ADD THIS REF ---
    const dimensionsRef = useRef(dimensions);

    // ... (rest of your state/refs)
2. Keep the ref in sync with the state:

JavaScript

    // ...

    // --- ADD THIS EFFECT ---
    // Keep the ref updated with the latest dimensions state
    // This does not cause functions that read the ref to be re-created
    useEffect(() => {
      dimensionsRef.current = dimensions;
    }, [dimensions]);

    // Update dimensions when item dimensions change (e.g., from backend sync)
    useEffect(() => {
    // ...
3. Modify sendPositionUpdate to use the ref and remove the dependency:

JavaScript

    // Send position updates via WebSocket
    const sendPositionUpdate = useCallback(() => {
      if (item.terminalId) {
        // Read from the ref, not from state
        const currentDimensions = dimensionsRef.current;
        sendMessage('position_update', JSON.stringify({
          x: item.position.x,
          y: item.position.y,
          width: currentDimensions.width,
          height: currentDimensions.height
        }), item.terminalId);
      }
    }, [item.position, item.terminalId, sendMessage]); // <-- Removed 'dimensions'
4. Modify handleTerminalResize to use the ref and remove the dependency:

JavaScript

    // ... (handleTerminalData remains the same)
    
    const handleTerminalResize = useCallback((size: { cols: number; rows: number }) => {
      if (item.terminalId && item.status === "ready") {
        // Read from the ref, not from state
        const currentDimensions = dimensionsRef.current;
        sendMessage('resize', JSON.stringify({
          cols: size.cols,
          rows: size.rows,
          width: Math.round(currentDimensions.width),
          height: Math.round(currentDimensions.height)
        }), item.terminalId);
      }
    }, [item.terminalId, item.status, sendMessage]); // <-- Removed dimensions dependencies
With these changes, calling setDimensions will no longer create new instances of your useCallback functions. This means the onResize prop passed to <Xterm> will remain stable, its useEffect will not re-run, and term.dispose() will not be called. Your useEffect that calls xTermRef.current?.fit() will then correctly resize the existing terminal, preserving its content.



Below is a comprehensive README for your **ShellSync** project, designed to clearly document the project’s purpose, setup instructions, usage, architecture, and contribution guidelines. It incorporates the functionality described in the landing page prompt, the download instructions for the multiplatform agent binaries, and aligns with the project’s current state as reflected in the GitHub repository details.
