"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Github, GitFork, Star, Code } from "lucide-react"
import Link from "next/link"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"

export function OpenSourceSection() {
  return (
    <section id="open-source" className="py-20 bg-neutral-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600">
            Open Source & Community Driven
          </h2>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
            ShellSync is completely open source! Contribute to the project, report issues, or fork it to create your own
            version.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <BentoGrid className="max-w-4xl mx-auto">
              <BentoGridItem
                title="GitHub Repository"
                description="Explore the complete source code, contribute features, and help improve ShellSync for everyone."
                header={
                  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 items-center justify-center">
                    <Github className="h-12 w-12 text-neutral-600 dark:text-neutral-400" />
                  </div>
                }
                icon={<Code className="h-4 w-4 text-neutral-500" />}
                className="md:col-span-2"
              />
              <BentoGridItem
                title="Production Ready"
                description="Built with modern technologies and ready for production use."
                header={
                  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-emerald-200 dark:from-emerald-900 dark:to-emerald-800 to-emerald-100 items-center justify-center">
                    <Star className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                }
                icon={<Star className="h-4 w-4 text-neutral-500" />}
              />
              <BentoGridItem
                title="Modern Architecture"
                description="WebSocket frontend communication, gRPC backend-agent interaction."
                header={
                  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-200 dark:from-blue-900 dark:to-blue-800 to-blue-100 items-center justify-center">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-4 w-4 bg-blue-500 rounded"></div>
                      <div className="h-4 w-4 bg-purple-500 rounded"></div>
                      <div className="h-4 w-4 bg-green-500 rounded"></div>
                      <div className="h-4 w-4 bg-yellow-500 rounded"></div>
                    </div>
                  </div>
                }
                icon={<Code className="h-4 w-4 text-neutral-500" />}
              />
              <BentoGridItem
                title="Community Contributions"
                description="Join developers worldwide in building the future of terminal collaboration."
                header={
                  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-200 dark:from-purple-900 dark:to-purple-800 to-purple-100 items-center justify-center">
                    <div className="flex space-x-2">
                      <div className="h-8 w-8 bg-purple-500 rounded-full"></div>
                      <div className="h-8 w-8 bg-blue-500 rounded-full"></div>
                      <div className="h-8 w-8 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                }
                icon={<GitFork className="h-4 w-4 text-neutral-500" />}
                className="md:col-span-2"
              />
            </BentoGrid>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                <Link href="https://github.com/Ayush-Vish/ShellSync" target="_blank">
                  <Github className="h-5 w-5 mr-2" />
                  View on GitHub
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white"
              >
                <Link href="https://github.com/Ayush-Vish/ShellSync/issues" target="_blank">
                  Report Issues
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white"
              >
                <Link href="https://github.com/Ayush-Vish/ShellSync/fork" target="_blank">
                  <GitFork className="h-4 w-4 mr-2" />
                  Fork Project
                </Link>
              </Button>
            </div>

            <p className="text-neutral-400 max-w-2xl mx-auto">
              Help us improve ShellSync by contributing code, reporting bugs, or suggesting new features. Every
              contribution makes a difference in building the future of collaborative development.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
