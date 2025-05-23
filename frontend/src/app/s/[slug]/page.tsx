'use client'

import { useTerminalSocket } from '@/hooks/useSocket'
import { useSearchParams } from 'next/navigation'
import { useRef } from 'react'
import XTerm from '@/components/terminal/Terminal' 

export default function JoinPage({ params }: { params: { roomId: string } }) {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client_id') || ''
  return (
    <div className="h-screen bg-black p-4 flex justify-center items-center">
      <div className="h-full w-full border-2 border-amber-400">
        <XTerm />
      </div>
    </div>
  )
}
