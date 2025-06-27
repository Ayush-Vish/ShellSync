"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Copy, Download, Apple, Monitor } from "lucide-react"
import { useState } from "react"


const binaryname = "shellsync"
const platforms = [
  {
    name: "macOS (Intel)",
    icon: Apple,
    binary: "client-darwin-amd64",
    command:
      `curl -L -o ${binaryname}-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-darwin-amd64 && chmod +x ${binaryname}-agent`,
  },
  {
    name: "macOS (Apple Silicon)",
    icon: Apple,
    binary: "client-darwin-arm64",
    command:
      `curl -L -o ${binaryname}-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-darwin-arm64 && chmod +x ${binaryname}-agent`,
  },
  {
    name: "Linux (amd64)",
    icon: Monitor,
    binary: "client-linux-amd64",
    command:
      `curl -L -o ${binaryname}-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-linux-amd64 && chmod +x ${binaryname}-agent`,
  },
  {
    name: "Linux (arm64)",
    icon: Monitor,
    binary: "client-linux-arm64",
    command:
      `curl -L -o ${binaryname}-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-linux-arm64 && chmod +x ${binaryname}-agent`,
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
    <section id="get-started" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Get Started with <span className="text-emerald-400">ShellSync</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Download the ShellSync agent for your platform and start collaborating in minutes!
          </p>
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 max-w-2xl mx-auto">
            <p className="text-sm text-gray-400 mb-2">After downloading, run:</p>
            <code className="text-emerald-400 font-mono">./shellsync-agent</code>
            <p className="text-sm text-gray-400 mt-2">
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
              className="bg-gray-800/50 p-6 rounded-lg border border-gray-700"
            >
              <div className="flex items-center mb-4">
                <platform.icon className="h-6 w-6 text-emerald-400 mr-3" />
                <h3 className="text-lg font-semibold">{platform.name}</h3>
                <span className="ml-auto text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">Updated last week</span>
              </div>

              <div className="bg-gray-900 p-4 rounded border border-gray-600 mb-4">
                <code className="text-sm text-gray-300 font-mono break-all">{platform.command}</code>
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
          <p className="text-gray-400 mb-4">All binaries updated with MILESTONE 4: Created infinite canvas component</p>
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
            <Download className="h-5 w-5 mr-2" />
            Start Your First Session
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
