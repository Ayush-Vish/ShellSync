"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

const faqs = [
  {
    question: "Do I need to install anything to use ShellSync?",
    answer:
      "Yes, you need to download and run the lightweight ShellSync agent on your machine. The agent handles terminal execution and communication with the ShellSync server. No additional software or complex setup is required.",
  },
  {
    question: "Is ShellSync secure for production use?",
    answer:
      "ShellSync is built with enterprise-grade security in mind. All connections are encrypted, and the agent runs locally on your machine, ensuring your terminal sessions remain secure. The architecture uses WebSocket for frontend communication and gRPC for backend-agent interaction.",
  },
  {
    question: "Can multiple users edit the same terminal session?",
    answer:
      "Yes! ShellSync enables real-time collaboration where multiple users can view and interact with the same terminal session simultaneously. This makes it perfect for pair programming, debugging sessions, or teaching CLI basics.",
  },
  {
    question: "What platforms are supported?",
    answer:
      "ShellSync currently supports macOS (both Intel and Apple Silicon) and Linux (both amd64 and arm64 architectures). We're continuously working to expand platform support based on community feedback.",
  },
  {
    question: "How does the infinite canvas work?",
    answer:
      "The infinite canvas is a dynamic, draggable workspace where you can create, position, and manage multiple terminal windows. You can zoom, pan, and organize your terminals however you like, making it easy to work with multiple sessions simultaneously.",
  },
  {
    question: "Is ShellSync free to use?",
    answer:
      "Yes! ShellSync is completely open source and free to use. You can download it, modify it, and even contribute to its development. Check out our GitHub repository to get started or contribute to the project.",
  },
  {
    question: "How do I share a terminal session with my team?",
    answer:
      "After running the ShellSync agent, you'll receive a unique session URL. Simply share this URL with your team members, and they can join your session instantly through their web browser. No additional setup required on their end.",
  },
  {
    question: "What's the difference between ShellSync and other terminal sharing tools?",
    answer:
      "ShellSync combines real-time collaboration with an innovative infinite canvas interface, allowing you to manage multiple terminal sessions in a single workspace. It's web-based, requires minimal setup, and is built with modern technologies for optimal performance.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 bg-gray-900/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Frequently Asked <span className="text-emerald-400">Questions</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Got questions about ShellSync? We've got answers. If you don't find what you're looking for, feel free to
            reach out on GitHub.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="mb-4"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full bg-gray-800/50 p-6 rounded-lg border border-gray-700 hover:border-emerald-500/50 transition-colors text-left flex items-center justify-between"
              >
                <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {openIndex === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-800/30 p-6 rounded-b-lg border-l border-r border-b border-gray-700 -mt-1"
                >
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
