'use client'

import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import 'xterm/css/xterm.css';


interface TerminalProps {
  onData: (data: string) => void
  onBinary?: (data: string) => void
  className?: string
  initialMessage?: string
}

export default function XTerm({ 
  onData, 
  onBinary, 
  className = "h-full w-full", 
  initialMessage = 'Welcome to the terminal!\r\n' 
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstance = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)

  // Expose the terminal instance through a ref
  const getTerminal = () => terminalInstance.current

  // Method to write to the terminal
  const writeToTerminal = (data: string) => {
    if (terminalInstance.current) {
      terminalInstance.current.write(data)
    }
  }

  useEffect(() => {
    if (!terminalRef.current) return

    // Initialize terminal
    const term =  new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff'
      }
    });


    // Setup addons
    fitAddon.current = new FitAddon()
    term.loadAddon(fitAddon.current)
    term.loadAddon(new WebLinksAddon())

    // Attach to DOM
    term.open(terminalRef.current)
    fitAddon.current.fit()
    
    // Write initial message if provided
    if (initialMessage) {
      term.write(initialMessage)
    }

    // Event handlers
    term.onData((data) => {
      // Echo the command locally for immediate feedback
      // For control characters and special keys, we'll let the server handle them
      if (data.charCodeAt(0) >= 32 || data === '\r') {
        // Local echo for visible characters and Enter
        term.write(data)
      }
      
      onData(data)
    })
    
    if (onBinary) {
      term.onBinary(onBinary)
    }

    terminalInstance.current = term

    // Handle window resize
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit()
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [onData, onBinary, initialMessage])

  // Expose terminal methods
  useEffect(() => {
    // This trick allows the parent component to get access to terminal methods
    if (terminalInstance.current) {
      // You could use a ref callback here to expose methods to parent component if needed
    }
  }, [])

  return <div ref={terminalRef} className={className} />
}
