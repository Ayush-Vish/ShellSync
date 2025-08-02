"use client"

import { FloatingDock } from "@/components/ui/floating-dock"
import { Button } from "@/components/ui/button"
import {
  Github,
  Terminal,
  Home,
  Zap,
  Download,
  Code,
  HelpCircle,
  AlertOctagon,
} from "lucide-react"
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
      {/* 🔴 Critical Server Down Banner */}
      <div className="w-full bg-red-100 border-b border-red-300 text-red-800 text-sm font-semibold px-4 py-2 flex items-center justify-center z-[100] fixed top-0">
        <AlertOctagon className="w-4 h-4 mr-2 text-red-700" />
        ShellSync servers are currently <span className="font-bold mx-1">down</span> due to funding issues. We&apos;re working to restore service soon. 🙏
      </div>

      {/* Header adjusted to be below banner */}
      <header className="fixed top-10 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 md:hidden">
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

      {/* Floating dock for desktop */}
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 hidden md:block">
        <FloatingDock items={links} />
      </div>
    </>
  )
}
