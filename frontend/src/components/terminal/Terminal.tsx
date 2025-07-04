'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal as XTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface XtermProps {
  onData: (data: string) => void; 
}


export interface XtermRef {
  write: (data: string) => void;
  focus: () => void;
}

const Xterm = forwardRef<XtermRef, XtermProps>(({ onData }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerminal | null>(null);

  
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

    });
    termRef.current = term;

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();
    term.focus();
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

Xterm.displayName = 'Xterm';

export default Xterm;
