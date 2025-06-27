"use client"

import { Button } from "@/components/ui/button"
import { Github, Terminal } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="h-8 w-8 text-emerald-400" />
          <span className="text-xl font-bold font-mono">ShellSync</span>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#get-started" className="text-gray-300 hover:text-white transition-colors">
            Get Started
          </Link>
          <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
            How It Works
          </Link>
          <Link href="#open-source" className="text-gray-300 hover:text-white transition-colors">
            Open Source
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Link href="https://github.com/Ayush-Vish/ShellSync" target="_blank">
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Link>
          </Button>
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
            Try Now
          </Button>
        </div>
      </div>
    </header>
  )
}
