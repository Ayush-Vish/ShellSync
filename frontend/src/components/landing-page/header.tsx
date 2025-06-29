"use client"

import { FloatingDock } from "@/components/ui/floating-dock"
import { Button } from "@/components/ui/button"
import { Github, Terminal, Home, Zap, Download, Code, HelpCircle } from "lucide-react"
import Link from "next/link"

export function Header() {
  const links = [
    {
      title: "Home",
      icon: <Home className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#",
    },
    {
      title: "Features",
      icon: <Zap className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#features",
    },
    {
      title: "Get Started",
      icon: <Download className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#get-started",
    },
    {
      title: "Open Source",
      icon: <Code className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#open-source",
    },
    {
      title: "FAQ",
      icon: <HelpCircle className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#faq",
    },
    {
      title: "GitHub",
      icon: <Github className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "https://github.com/Ayush-Vish/ShellSync",
    },
  ]

  return (
    <>
      {/* Traditional header for mobile */}
      <header className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 md:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-emerald-400" />
            <span className="text-xl font-bold font-mono text-white">ShellSync</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <Link href="https://github.com/Ayush-Vish/ShellSync" target="_blank">
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Link>
          </Button>
        </div>
      </header>


      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 hidden md:block">
        <FloatingDock items={links} />
      </div>
    </>
  )
}
