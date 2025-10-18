'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal as XTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { SearchAddon, ISearchOptions } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
interface XtermProps {
  onData: (data: string) => void;
  onResize?: (size: { cols: number; rows: number }) => void;
}

export interface XtermRef {
  write: (data: string) => void;
  focus: () => void;
  fit: () => void;
  getCols: () => number;
  getRows: () => number;
}

const Xterm = forwardRef<XtermRef, XtermProps>(
  ({ onData, onResize }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<XTerminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    useImperativeHandle(ref, () => ({
      write: (data: string) => {
        termRef.current?.write(data);
      },
      focus: () => {
        termRef.current?.focus();
      },
      fit: () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      },
      getCols: () => {
        return termRef.current?.cols || 80;
      },
      getRows: () => {
        return termRef.current?.rows || 24;
      },
    }), []);

    useEffect(() => {
      if (!terminalRef.current) return;

      const term = new XTerminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'monospace',
      });
      termRef.current = term;

      const fitAddon = new FitAddon();
      const clipboardAddon = new ClipboardAddon();
      const searchAddon = new SearchAddon();
      const webLinksAddon = new WebLinksAddon();
      fitAddonRef.current = fitAddon;

      term.loadAddon(clipboardAddon);
      term.loadAddon(searchAddon);
      term.loadAddon(webLinksAddon);
      term.loadAddon(fitAddon);

      term.open(terminalRef.current);
      fitAddon.fit();
      term.focus();

      term.onData(onData);

      term.onResize((size) => {
        onResize?.(size);
      });

      const handleResize = () => {
        fitAddon.fit();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
      };
    }, [onData, onResize]);

    return <div ref={terminalRef} className="h-full w-full" />;
  }
);

Xterm.displayName = 'Xterm';

export default Xterm;
