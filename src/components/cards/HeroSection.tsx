"use client";
import { motion } from 'framer-motion';
import { ChevronRight, Lamp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlowingStarsBackgroundCard } from '@/components/ui/glowing-stars';
import { SparklesPreview } from './SparklesPreview';
import { LampDemo } from './LampDemo';

export function HeroSection({ typedText }: { typedText: string }) {
  return (
    <div className="flex  items-center justify-center antialiased">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <LampDemo>

            <div className="md:w-1/2 mb-10 md:mb-0 flex flex-col items-center text-center">
              <h1 
                className="text-4xl md:text-6xl font-bold leading-tight mb-6"
             
              >
                Collaborative <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">Terminal</span> for Seamless Team Workflows
              </h1>
              <p 
                className="text-lg md:text-xl text-gray-300 mb-8"
               
              >
                A secure web-based terminal that enables real-time collaboration over SSH. Code together, troubleshoot together, ship faster.
              </p>
              
            </div>
          </LampDemo>
          <SparklesPreview>
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="terminal-window bg-gray-900/80 rounded-lg border border-gray-700 overflow-hidden shadow-2xl">
                <div className="terminal-header bg-gray-800/80 px-4 py-2 flex items-center text-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="ml-4 text-xs text-center text-gray-400">ayush@shellsync:~</div>
                </div>
                <div className="terminal-body p-4 font-mono text-sm">
                  <div className="text-green-400">
                    {typedText}
                    <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse"></span>
                  </div>
                </div>
              </div>
            </motion.div>
            </SparklesPreview>
        </div>
    </div>
  );
}
