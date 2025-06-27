"use client"

import { motion } from "framer-motion"
import { Download, Globe, Users, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: Download,
    title: "Download & Run Agent",
    description:
      "Download the ShellSync agent for your platform and run it on your machine. The agent handles terminal execution and communication.",
  },
  {
    icon: Globe,
    title: "Access Browser Interface",
    description:
      "Open the provided URL in your browser to access the infinite canvas interface. No additional setup required.",
  },
  {
    icon: Users,
    title: "Create & Share Sessions",
    description:
      "Create multiple terminals on the canvas and share your session URL with team members for real-time collaboration.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-900/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            How <span className="text-emerald-400">ShellSync</span> Works
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get up and running in three simple steps. No complex configuration, no lengthy setup process.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="flex items-center mb-12 last:mb-0"
            >
              <div className="flex-shrink-0 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mr-6">
                <step.icon className="h-8 w-8 text-black" />
              </div>

              <div className="flex-grow">
                <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-300 text-lg">{step.description}</p>
              </div>

              {index < steps.length - 1 && <ArrowRight className="h-6 w-6 text-gray-500 ml-6 hidden md:block" />}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 bg-gray-800/50 p-8 rounded-lg border border-gray-700 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-semibold mb-4 text-center">Architecture Overview</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="bg-blue-500/20 p-4 rounded-lg mb-3">
                <Globe className="h-8 w-8 text-blue-400 mx-auto" />
              </div>
              <h4 className="font-semibold mb-2">Frontend</h4>
              <p className="text-sm text-gray-300">
                React-based infinite canvas interface with WebSocket communication
              </p>
            </div>
            <div>
              <div className="bg-emerald-500/20 p-4 rounded-lg mb-3">
                <Users className="h-8 w-8 text-emerald-400 mx-auto" />
              </div>
              <h4 className="font-semibold mb-2">Backend</h4>
              <p className="text-sm text-gray-300">
                Node.js server handling session management and real-time communication
              </p>
            </div>
            <div>
              <div className="bg-purple-500/20 p-4 rounded-lg mb-3">
                <Download className="h-8 w-8 text-purple-400 mx-auto" />
              </div>
              <h4 className="font-semibold mb-2">Agent</h4>
              <p className="text-sm text-gray-300">Lightweight client using gRPC for secure terminal execution</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
