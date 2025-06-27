"use client"

import { motion } from "framer-motion"
import { Users, Layout, Download, Zap, Shield, Globe } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Real-Time Terminal Collaboration",
    description:
      "Share terminal sessions instantly with team members using a unique session URL. Multiple users can view and interact with the same terminal in real-time.",
  },
  {
    icon: Layout,
    title: "Infinite Canvas Interface",
    description:
      "A dynamic, draggable canvas where you can create and position multiple terminal windows. Easily manage multiple sessions in a single workspace.",
  },
  {
    icon: Download,
    title: "Cross-Platform Agent",
    description:
      "Lightweight agent runs on your machine to handle terminal execution. Available for macOS (amd64, arm64) and Linux (amd64, arm64).",
  },
  {
    icon: Zap,
    title: "Production-Ready",
    description:
      "Built with robust architecture using WebSocket for frontend-backend communication and gRPC for backend-agent interaction.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description:
      "Enterprise-grade security with encrypted connections and stable, real-time terminal input/output streaming with low latency.",
  },
  {
    icon: Globe,
    title: "User-Friendly Experience",
    description:
      "Simple setup: Download the agent, run it, and access your session via a browser. Intuitive controls for managing terminals.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-900/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Powerful Features for <span className="text-emerald-400">Modern Teams</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            ShellSync combines the power of terminal collaboration with an intuitive interface, making it perfect for
            developers, system administrators, and teams.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 hover:border-emerald-500/50 transition-colors"
            >
              <feature.icon className="h-12 w-12 text-emerald-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
