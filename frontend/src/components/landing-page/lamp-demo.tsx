"use client"
import type React from "react"
import { LampContainer } from "@/components/ui/lamp"
import { motion } from "framer-motion"

export function LampDemo({ children }: { children: React.ReactNode }) {
  return (
    <LampContainer>
      <motion.div
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
      >
        {children}
      </motion.div>
    </LampContainer>
  )
}
