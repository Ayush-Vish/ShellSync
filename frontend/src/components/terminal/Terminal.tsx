'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal as XTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

// Define the props the component will accept from its parent
interface XtermProps {
  onData: (data: string) => void; // Callback to send user input to the parent
}

// Define the methods that the parent can call on this component via a ref
export interface XtermRef {
  write: (data: string) => void;
  focus: () => void;
}

const Xterm = forwardRef<XtermRef, XtermProps>(({ onData }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerminal | null>(null);

  // Expose the 'write' and 'focus' methods to the parent component
  useImperativeHandle(ref, () => ({
    write: (data: string) => {
      termRef.current?.write(data);
    },
    focus: () => {
      termRef.current?.focus();
    },
  }));

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerminal({
      cursorBlink: true,
      theme: {
        background: '#000000',
        foreground: '#00FF00',
        cursor: '#FFFFFF',
      },
      fontFamily: 'monospace',
      fontSize: 16,
      rows: 25,
    });
    termRef.current = term;

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();
    term.focus();

    // This is the crucial change:
    // Instead of local echo, 'onData' sends all user input (keystrokes, pastes)
    // to the parent component, which will then send it over the WebSocket.
    term.onData(onData);

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [onData]);

  return <div ref={terminalRef} className="h-full w-full" />;
});

// Set a display name for easier debugging in React DevTools
Xterm.displayName = 'Xterm';

export default Xterm;