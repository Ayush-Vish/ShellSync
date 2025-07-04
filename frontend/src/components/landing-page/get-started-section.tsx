"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Copy, Apple, Monitor, Terminal } from "lucide-react"
import { useState } from "react"
import { EvervaultCard } from "../ui/evervault-card"

export function GetStartedSection() {
  const [copiedCommand, setCopiedCommand] = useState(false)

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedCommand(true)
    setTimeout(() => setCopiedCommand(false), 2000)
  }

  const oneLineInstall =
    "curl -fsSL https://raw.githubusercontent.com/Ayush-Vish/ShellSync/main/scripts/get_linux.sh | sh"
  const windowsInstall =
    "iwr -useb https://raw.githubusercontent.com/Ayush-Vish/ShellSync/main/scripts/get_windows.ps1 | iex"

  return (
    <section id="get-started" className="py-20 bg-neutral-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600">
            Installation
          </h2>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
            Get started with ShellSync in seconds. Choose your platform and run the script or download the agent directly.
          </p>
        </motion.div>

        <div className="grid md:grid-rows-2 gap-12 max-w-6xl mx-auto">
          {/* macOS / Linux Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="group/card relative overflow-hidden rounded-lg shadow-lg bg-neutral-900 border border-neutral-800 p-8"
          >
            <div className="absolute inset-0 bg-neutral-950 opacity-0 group-hover/card:opacity-40 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <Apple className="h-6 w-6 text-emerald-400 mr-3" />
                <Terminal className="h-6 w-6 text-emerald-400 mr-3" />
                <h3 className="text-2xl font-bold text-white">macOS / Linux</h3>
              </div>

              <p className="text-neutral-400 mb-3">Run in your terminal:</p>
              <div className="bg-neutral-800/70 rounded px-4 py-3 mb-4 flex items-center justify-between overflow-auto">
                <code className="text-sm font-mono text-white">{oneLineInstall}</code>
                <Button
                  onClick={() => copyToClipboard(oneLineInstall)}
                  variant="ghost"
                  size="sm"
                  className="ml-4 text-emerald-400 hover:text-emerald-300"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copiedCommand ? "Copied!" : "Copy"}
                </Button>
              </div>

              <p className="text-neutral-400 mb-2">Or download the binary:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DownloadButton label="macOS ARM64" href="https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-darwin-arm64" />
                <DownloadButton label="macOS x86-64" href="https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-darwin-amd64" />
                <DownloadButton label="Linux ARM64" href="https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-linux-arm64" />
                <DownloadButton label="Linux x86-64" href="https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-linux-amd64" />
              </div>
            </div>
          </motion.div>

          {/* Windows Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group/card relative overflow-hidden rounded-lg shadow-lg bg-neutral-900 border border-neutral-800 p-8"
          >
            <div className="absolute inset-0 bg-neutral-950 opacity-0 group-hover/card:opacity-40 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <Monitor className="h-6 w-6 text-blue-400 mr-3" />
                <h3 className="text-2xl font-bold text-white">Windows</h3>
              </div>

              <p className="text-neutral-400 mb-3">Run in PowerShell:</p>
              <div className="bg-neutral-800/70 rounded px-4 py-3 mb-4 flex items-center justify-between overflow-auto">
                <code className="text-sm font-mono text-white">{windowsInstall}</code>
                <Button
                  onClick={() => copyToClipboard(windowsInstall)}
                  variant="ghost"
                  size="sm"
                  className="ml-4 text-blue-400 hover:text-blue-300"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copiedCommand ? "Copied!" : "Copy"}
                </Button>
              </div>

              <p className="text-neutral-400 mb-2">Or download the executable:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DownloadButton label="Windows x86-64" href="https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-windows-amd64.exe" />
                <DownloadButton label="Windows ARM64" href="https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-windows-arm64.exe" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Post-Installation Steps */}
      <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.4 }}
  className="mt-16 bg-emerald-500/10 p-6 rounded-lg border border-emerald-500/20 max-w-3xl mx-auto"
>
  <h4 className="text-lg font-semibold text-white mb-4">After Installation</h4>
  <ul className="space-y-3 text-sm text-neutral-300 list-disc list-inside">
    <li>
      <span className="text-white font-medium">If you used the install script:</span><br />
      Run the agent directly:
      <code className="text-emerald-400 font-mono ml-1">shellsync-agent</code>
    </li>
    <li>
      <span className="text-white font-medium">If you downloaded the binary manually:</span>
      <ul className="list-decimal list-inside ml-4 mt-1 space-y-1">
        <li>
          Make it executable:
          <code className="text-emerald-400 font-mono ml-1">chmod +x shellsync-agent</code>
        </li>
        <li>
          (Optional) Move to global path:
          <code className="text-emerald-400 font-mono ml-1">sudo mv shellsync-agent /usr/bin/</code>
        </li>
        <li>
          Run the agent:
          <code className="text-emerald-400 font-mono ml-1">shellsync-agent</code>
        </li>
      </ul>
    </li>
    <li>
      <span className="text-white font-medium">Browser will open:</span> use the displayed URL to start collaborating with your team!
    </li>
  </ul>

  {/* Auto-Detect Install Card */}
  <div className="mt-6 max-w-xs mx-auto">
    <EvervaultCard text="Download " />
    <p className="text-center text-xs text-neutral-400 mt-2">
      Uses your OS & architecture to fetch the correct binary {" "}
    </p>
  </div>
</motion.div>

      </div>
    </section>
  )
}

function DownloadButton({ label, href }: { label: string; href: string }) {
  return (
    <Button
      variant="outline"
      asChild
      className="bg-transparent border-neutral-700 text-white hover:bg-neutral-800"
    >
      <a href={href} download="shellsync-agent">
        {label}
      </a>
    </Button>
  )
}
