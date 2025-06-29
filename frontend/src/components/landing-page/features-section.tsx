"use client";

import { motion } from "framer-motion";
import { Users, Layout, Download, Zap, Shield, Globe } from "lucide-react";

const features = [
  {
    icon: <Users className="h-10 w-10 text-emerald-400" />,
    title: "Real-Time Collaboration",
    description:
      "Share terminal sessions instantly with team members using unique URLs. Perfect for pair programming and debugging.",
  },
  {
    icon: <Layout className="h-10 w-10 text-blue-400" />,
    title: "Infinite Canvas",
    description:
      "Dynamic, draggable workspace where you can create and position multiple terminal windows with zoom and pan.",
  },
  {
    icon: <Download className="h-10 w-10 text-purple-400" />,
    title: "Cross-Platform Agent",
    description:
      "Lightweight agent for macOS and Linux (amd64, arm64) that handles secure terminal execution.",
  },
  {
    icon: <Zap className="h-10 w-10 text-yellow-400" />,
    title: "Production-Ready",
    description:
      "Built with WebSocket and gRPC for stable, real-time communication with enterprise-grade performance.",
  },
  {
    icon: <Shield className="h-10 w-10 text-red-400" />,
    title: "Secure & Reliable",
    description:
      "Encrypted connections with low-latency streaming for secure terminal collaboration.",
  },
  {
    icon: <Globe className="h-10 w-10 text-cyan-400" />,
    title: "User-Friendly",
    description:
      "Simple setup: download agent, run it, access via browser. Intuitive terminal management controls.",
  },
];

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
              className="group/card relative overflow-hidden rounded-lg shadow-lg bg-neutral-900 border border-neutral-800 p-6"
            >
              <div className="absolute inset-0 bg-neutral-950 opacity-0 group-hover/card:opacity-40 transition-opacity duration-300" />
              <div className="relative z-10 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 text-center">
                {feature.title}
              </h3>
              <p className="text-sm text-neutral-400 text-center">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
