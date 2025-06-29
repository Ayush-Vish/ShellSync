"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Copy, Download, Apple, Monitor } from "lucide-react"
import { useState } from "react"
import { EvervaultCard } from "@/components/ui/evervault-card"

const platforms = [
  {
    name: "macOS (Intel)",
    icon: Apple,
    binary: "client-darwin-amd64",
    command:
      "curl -L -o shellsync-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-darwin-amd64 && chmod +x shellsync-agent",
  },
  {
    name: "macOS (Apple Silicon)",
    icon: Apple,
    binary: "client-darwin-arm64",
    command:
      "curl -L -o shellsync-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-darwin-arm64 && chmod +x shellsync-agent",
  },
  {
    name: "Linux (amd64)",
    icon: Monitor,
    binary: "client-linux-amd64",
    command:
      "curl -L -o shellsync-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-linux-amd64 && chmod +x shellsync-agent",
  },
  {
    name: "Linux (arm64)",
    icon: Monitor,
    binary: "client-linux-arm64",
    command:
      "curl -L -o shellsync-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-linux-arm64 && chmod +x shellsync-agent",
  },
]

export function GetStartedSection() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <section id="get-started" className="py-20 bg-neutral-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600">
            Get Started with ShellSync
          </h2>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto mb-8">
            Download the ShellSync agent for your platform and start collaborating in minutes!
          </p>

          <div className="flex justify-center mb-12">
            <div className="h-[20rem] w-[20rem]">
              <EvervaultCard text="Start" />
            </div>
          </div>

          <div className="bg-neutral-800/50 p-6 rounded-lg border border-neutral-700 max-w-2xl mx-auto backdrop-blur-sm">
            <p className="text-sm text-neutral-400 mb-2">After downloading, run:</p>
            <code className="text-emerald-400 font-mono text-lg">./shellsync-agent</code>
            <p className="text-sm text-neutral-400 mt-2">
              Then access the provided URL in your browser to start your session.
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {platforms.map((platform, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-neutral-800/50 p-6 rounded-lg border border-neutral-700 backdrop-blur-sm hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center mb-4">
                <platform.icon className="h-6 w-6 text-emerald-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">{platform.name}</h3>
                <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">Ready</span>
              </div>

              <div className="bg-neutral-900 p-4 rounded border border-neutral-600 mb-4">
                <code className="text-sm text-neutral-300 font-mono break-all">{platform.command}</code>
              </div>

              <Button
                onClick={() => copyToClipboard(platform.command, index)}
                variant="outline"
                size="sm"
                className="w-full bg-transparent border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedIndex === index ? "Copied!" : "Copy Command"}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
            <Download className="h-5 w-5 mr-2" />
            Start Your First Session
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
