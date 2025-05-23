'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const Xterm = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    // Initialize terminal only on client side
    if (!terminalRef.current) return;
    
    // Create terminal instance
    const term = new XTerminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
      },
      fontFamily: 'monospace',
      fontSize: 14,
    });

    // Create fit addon to make terminal resize to container
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;
    
    // Open terminal in the container element
    term.open(terminalRef.current);
    fitAddon.fit();
    
    // Set welcome message
    term.writeln('Welcome to the Terminal!');
    term.writeln('Type something and press Enter...');
    term.writeln('');
    
    // Current line buffer
    let currentLine = '';
    
    // Handle user input
    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
      
      // Handle Enter key
      if (domEvent.key === 'Enter') {
        term.writeln('');
        // Process command (just echo it back for this minimal example)
        term.writeln(`You typed: ${currentLine}`);
        currentLine = '';
        term.write('$ ');
      }
      // Handle Backspace key
      else if (domEvent.key === 'Backspace') {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      }
      // Handle printable characters
      else if (printable) {
        currentLine += key;
        term.write(key);
      }
    });
    
    // Start with a prompt
    term.write('$ ');
    
    // Set the terminal in state
    setTerminal(term);
    
    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      term.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="terminal-container">
      <div 
        ref={terminalRef} 
        className="terminal" 
      />
      <style jsx>{`
        .terminal-container {
          height: 400px;
          width: 100%;
          border-radius: 6px;
          padding: 8px;
          background-color: #1e1e1e;
          overflow: hidden;
        }
        .terminal {
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default Xterm;
