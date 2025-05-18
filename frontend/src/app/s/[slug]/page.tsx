'use client'

import { useTerminalSocket } from '@/hooks/useSocket'
import { useSearchParams } from 'next/navigation'
import { useRef } from 'react'
import XTerm from '@/components/terminal/Terminal'  // Adjust import path as needed

export default function JoinPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client_id') || ''
  
  // This ref can be used to store received messages that need to be written to terminal
  const messageQueueRef = useRef<string[]>([])
  const terminalWriteRef = useRef<((data: string) => void) | null>(null)

  // Function to handle terminal output
  const handleTerminalOutput = (msg: any) => {
    console.log('Received message:', msg)
    
    if (terminalWriteRef.current) {
      // If we have a reference to the write function, use it
      terminalWriteRef.current(msg.content)
    } else {
      // Otherwise queue the message for when terminal is ready
      messageQueueRef.current.push(msg.content)
    }
  }

  // Setup the terminal socket connection
  const { sendCommand } = useTerminalSocket(
    params.id, 
    clientId, 
    handleTerminalOutput
  )

  // Function to handle terminal data input
  const handleTerminalInput = (data: string) => {
    console.log('Sending command:', data)
    sendCommand(data)
  }

  // Function to handle terminal binary input (optional)
  const handleTerminalBinary = (data: string) => {
    console.log('Sending binary data:', data)
    // Implement if needed
  }

  return (
    <div className="h-screen bg-black p-4 flex justify-center items-center">
      <div className="h-full w-full border-2 border-amber-400">
        <XTerm 
          onData={handleTerminalInput} 
          onBinary={handleTerminalBinary}
          className="h-full w-full"
          initialMessage="Connected to ShellSync terminal. Ready for commands.\r\n"
        />
      </div>
    </div>
  )
}
