"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { ChevronRight, Play } from "lucide-react"

export function HeroSection({ typedText }: { typedText: string }) {
  return (
    <div className="h-screen w-full bg-neutral-950 relative flex flex-col items-center justify-center antialiased">
      <div className="max-w-2xl mx-auto p-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-lg md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 text-center font-sans font-bold"
        >
          ShellSync
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-neutral-500 max-w-lg mx-auto my-2 text-sm text-center relative z-10"
        >
          Collaborative terminal for seamless team workflows. Share terminal sessions instantly with an infinite canvas
          interface. Built for developers, by developers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex gap-4 justify-center mt-8 relative z-10"
        >
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
            Get Started
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800"
          >
            <Play className="mr-2 h-4 w-4" />
            Watch Demo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 relative z-10"
        >
          <div className="terminal-window bg-neutral-900/80 rounded-lg border border-neutral-700 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="terminal-header bg-neutral-800/80 px-4 py-2 flex items-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="ml-4 text-xs text-neutral-400">shellsync@terminal:~</div>
            </div>
            <div className="terminal-body p-4 font-mono text-sm h-32">
              <div className="text-emerald-400">
                {typedText}
                <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse"></span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <BackgroundBeams />
    </div>
  )
}
