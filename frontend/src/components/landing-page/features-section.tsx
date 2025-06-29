"use client"

import { motion } from "framer-motion"
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card"
import { Users, Layout, Download, Zap, Shield, Globe } from "lucide-react"

const features = [
  {
    icon: <Users className="h-12 w-12 text-emerald-400" />,
    title: "Real-Time Collaboration",
    description:
      "Share terminal sessions instantly with team members using unique URLs. Perfect for pair programming and debugging.",
  },
  {
    icon: <Layout className="h-12 w-12 text-blue-400" />,
    title: "Infinite Canvas",
    description:
      "Dynamic, draggable workspace where you can create and position multiple terminal windows with zoom and pan.",
  },
  {
    icon: <Download className="h-12 w-12 text-purple-400" />,
    title: "Cross-Platform Agent",
    description: "Lightweight agent for macOS and Linux (amd64, arm64) that handles secure terminal execution.",
  },
  {
    icon: <Zap className="h-12 w-12 text-yellow-400" />,
    title: "Production-Ready",
    description: "Built with WebSocket and gRPC for stable, real-time communication with enterprise-grade performance.",
  },
  {
    icon: <Shield className="h-12 w-12 text-red-400" />,
    title: "Secure & Reliable",
    description: "Encrypted connections with low-latency streaming for secure terminal collaboration.",
  },
  {
    icon: <Globe className="h-12 w-12 text-cyan-400" />,
    title: "User-Friendly",
    description: "Simple setup: download agent, run it, access via browser. Intuitive terminal management controls.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-neutral-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600">
            Powerful Features for Modern Teams
          </h2>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
            Everything you need for seamless terminal collaboration
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <CardContainer className="inter-var">
                <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
                  <CardItem translateZ="50" className="text-xl font-bold text-neutral-600 dark:text-white mb-2">
                    {feature.title}
                  </CardItem>
                  <CardItem
                    as="p"
                    translateZ="60"
                    className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300 mb-4"
                  >
                    {feature.description}
                  </CardItem>
                  <CardItem translateZ="100" className="w-full mt-4">
                    <div className="flex justify-center">{feature.icon}</div>
                  </CardItem>
                </CardBody>
              </CardContainer>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
