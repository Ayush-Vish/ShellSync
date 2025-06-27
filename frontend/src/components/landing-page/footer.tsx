"use client"

import { Terminal, Github, Mail, ExternalLink } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Terminal className="h-8 w-8 text-emerald-400" />
              <span className="text-2xl font-bold font-mono">ShellSync</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Collaborative terminal for seamless team workflows. Built for developers, by developers.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://github.com/Ayush-Vish/ShellSync"
                target="_blank"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <Github className="h-6 w-6" />
              </Link>
              <Link
                href="mailto:contact@shellsync.dev"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <Mail className="h-6 w-6" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-gray-400 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#get-started" className="text-gray-400 hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/Ayush-Vish/ShellSync/releases"
                  target="_blank"
                  className="text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  Downloads
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://github.com/Ayush-Vish/ShellSync"
                  target="_blank"
                  className="text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  GitHub
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/Ayush-Vish/ShellSync/issues"
                  target="_blank"
                  className="text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  Issues
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/Ayush-Vish/ShellSync/discussions"
                  target="_blank"
                  className="text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  Discussions
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/Ayush-Vish/ShellSync/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  className="text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  Contributing
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} ShellSync. Built for developers, by developers.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
            <Link
              href="https://github.com/Ayush-Vish/ShellSync/blob/main/LICENSE"
              target="_blank"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              License
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
