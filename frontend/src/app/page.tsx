"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Terminal,
  Users,
  Shield,
  Zap,
  Code,
  GitBranch,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlowingStarsBackgroundCardPreview, HeroSection } from '@/components/cards/HeroSection';

export default function Home() {
  const [typedText, setTypedText] = useState('');
  const fullText = '$ shellsync';



  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>ShellSync - Collaborative Terminal over SSH</title>
        <meta name="description" content="Secure web-based collaborative terminal over SSH" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className="container mx-auto py-6 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Terminal className="text-emerald-500 h-6 w-6" />
          <span className="font-bold text-xl">ShellSync</span>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection typedText={fullText} />


      {/* Social Proof */}
      <section className="bg-gray-900 py-10">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-400 mb-8">Trusted by developers at</p>
          <div className="flex justify-center flex-wrap gap-8 md:gap-16 opacity-70">
            <img src="/api/placeholder/120/40" alt="Company Logo" className="h-8" />
            <img src="/api/placeholder/120/40" alt="Company Logo" className="h-8" />
            <img src="/api/placeholder/120/40" alt="Company Logo" className="h-8" />
            <img src="/api/placeholder/120/40" alt="Company Logo" className="h-8" />
            <img src="/api/placeholder/120/40" alt="Company Logo" className="h-8" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ShellSync?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Experience the next generation of collaborative terminal environments</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div 
              className="feature-card bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-emerald-500/50 transition-colors"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-emerald-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-time Collaboration</h3>
              <p className="text-gray-400">Multiple team members can work in the same terminal session simultaneously, seeing each other's inputs and outputs in real-time.</p>
            </motion.div>
            
            <motion.div 
              className="feature-card bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Enterprise-grade Security</h3>
              <p className="text-gray-400">End-to-end encryption with robust authentication ensures your sessions remain secure and private.</p>
            </motion.div>
            
            <motion.div 
              className="feature-card bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-purple-500/50 transition-colors"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-purple-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Lightning Fast Performance</h3>
              <p className="text-gray-400">Low-latency connections and optimized data transfer make ShellSync feel like a local terminal experience.</p>
            </motion.div>
            
            <motion.div 
              className="feature-card bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-yellow-500/50 transition-colors"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-yellow-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Code className="text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Custom Permissions</h3>
              <p className="text-gray-400">Granular access controls let you define exactly what each collaborator can see and do within a session.</p>
            </motion.div>
            
            <motion.div 
              className="feature-card bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-red-500/50 transition-colors"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-red-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <GitBranch className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Version Control Integration</h3>
              <p className="text-gray-400">Seamlessly integrates with Git and other version control systems for efficient code management.</p>
            </motion.div>
            
            <motion.div 
              className="feature-card bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-colors"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-indigo-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Terminal className="text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Persistent Sessions</h3>
              <p className="text-gray-400">Sessions persist even after disconnection, allowing team members to join or leave as needed without losing progress.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How ShellSync Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Get started in minutes with these simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-500">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Connect Your Server</h3>
              <p className="text-gray-400">Link ShellSync to your existing servers using our secure SSH integration.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-emerald-500">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Invite Your Team</h3>
              <p className="text-gray-400">Add team members and define their access permissions with a few clicks.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-500">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Collaborate in Real-time</h3>
              <p className="text-gray-400">Start coding, debugging, and deploying together instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 rounded-2xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your team's terminal experience?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">Join thousands of developers who are already using ShellSync to collaborate and ship faster.</p>
            <Button className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-6 px-8 rounded-md font-medium text-lg hover:shadow-lg transition-all">
              Get Started Free - No Credit Card Required
              <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Terminal className="text-emerald-500 h-6 w-6" />
                <span className="font-bold text-xl">ShellSync</span>
              </div>
              <p className="text-gray-400">A secure web-based, collaborative terminal over SSH.</p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Enterprise</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">API</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Legal</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">© 2025 ShellSync. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
