"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Github, GitFork, Clock } from "lucide-react"
import Link from "next/link"

export function OpenSourceSection() {
  return (
    <section id="open-source" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Open Source & <span className="text-emerald-400">Community Driven</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            ShellSync is completely open source! Contribute to the project, report issues, or fork it to create your own
            version. Built for developers, by developers.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-800/50 p-8 rounded-lg border border-gray-700 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Github className="h-8 w-8 text-white mr-3" />
                <div>
                  <h3 className="text-2xl font-semibold">Ayush-Vish/ShellSync</h3>
                  <p className="text-gray-400">Minimal client, server, and frontend are working on production</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Updated 2 weeks ago
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-900/50 p-4 rounded border border-gray-600">
                <h4 className="font-semibold mb-2 text-emerald-400">Latest Milestone</h4>
                <p className="text-sm text-gray-300">MILESTONE 4: Created infinite canvas component</p>
                <p className="text-xs text-gray-400 mt-1">Updated last week</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded border border-gray-600">
                <h4 className="font-semibold mb-2 text-blue-400">Technology Stack</h4>
                <p className="text-sm text-gray-300">React, Node.js, WebSocket, gRPC</p>
                <p className="text-xs text-gray-400 mt-1">Production ready</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded border border-gray-600">
                <h4 className="font-semibold mb-2 text-purple-400">License</h4>
                <p className="text-sm text-gray-300">Open Source</p>
                <p className="text-xs text-gray-400 mt-1">Free to use and modify</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                <Link href="https://github.com/Ayush-Vish/ShellSync" target="_blank">
                  <Github className="h-5 w-5 mr-2" />
                  View on GitHub
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Link href="https://github.com/Ayush-Vish/ShellSync/issues" target="_blank">
                  Report Issues
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Link href="https://github.com/Ayush-Vish/ShellSync/fork" target="_blank">
                  <GitFork className="h-4 w-4 mr-2" />
                  Fork Project
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <h3 className="text-2xl font-semibold mb-4">Join the Community</h3>
            <p className="text-gray-300 mb-6">
              Help us improve ShellSync by contributing code, reporting bugs, or suggesting new features. Every
              contribution makes a difference!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                className="bg-transparent border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black"
              >
                Contribute Code
              </Button>
              <Button
                variant="outline"
                className="bg-transparent border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-black"
              >
                Request Features
              </Button>
              <Button
                variant="outline"
                className="bg-transparent border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-black"
              >
                Join Discussions
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
