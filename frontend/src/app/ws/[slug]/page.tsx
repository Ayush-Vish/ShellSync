'use client'

import {SocketMessage, useTerminalSocket} from '@/hooks/useSocket'
import {useParams, useSearchParams} from 'next/navigation'
import { useRef } from 'react'
import XTerm, {XtermRef} from '@/components/terminal/Terminal'
import Xterm from "@/components/terminal/Terminal";

export default function JoinPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const sessionId = params.slug as string;
    const clientId = searchParams.get('client_id');
    console.log(clientId, 'client_id')
    console.log(
        'sessionId',
        sessionId,
        'searchParams',
        searchParams,
        'params',
        params,
    )

    const xTermref = useRef<XtermRef>(null);
    const handleSocketMessage = (message: SocketMessage) => {
        if (message.type === 'pty_output' && message.content) {
            // Write the PTY output from the server directly into the terminal UI
            xTermref.current?.write(message.content);
        }
    };
    const { sendMessage } = useTerminalSocket(sessionId, clientId, handleSocketMessage);
    const handleTerminalData = (data: string) => {
        // Send the raw user input to the backend over the WebSocket
        sendMessage('pty_input', data);

    };

    if (!sessionId || !clientId) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-red-500">
                Error: Session ID and Client ID are required.
            </div>
        );
    }


    return (
  <div className="h-screen bg-black p-4 flex flex-col">
    <header className="mb-2 text-center text-sm text-gray-500">
      Session ID: <span className="font-mono text-gray-400">{sessionId}</span> | 
      Client ID: <span className="font-mono text-gray-400">{clientId}</span>
    </header>

    {/* Terminal Container with macOS buttons */}
    <div className="flex-grow flex flex-col rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e]">
      {/* macOS style buttons */}
      <div className="flex space-x-2 px-4 py-2 bg-[#2d2d2d]">
        <div className="w-3 h-3 bg-red-500 rounded-full" />
        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
        <div className="w-3 h-3 bg-green-500 rounded-full" />
      </div>

      {/* Terminal itself */}
      <div className="flex-grow">
        <Xterm ref={xTermref} onData={handleTerminalData} />
      </div>
    </div>
  </div>
);

}
