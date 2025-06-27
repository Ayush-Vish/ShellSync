"use client"

import { FAQSection } from "@/components/landing-page/faq-section"
import { FeaturesSection } from "@/components/landing-page/features-section"
import { Footer } from "@/components/landing-page/footer"
import { GetStartedSection } from "@/components/landing-page/get-started-section"
import { Header } from "@/components/landing-page/header"
import { HeroSection } from "@/components/landing-page/hero-section"
import { HowItWorksSection } from "@/components/landing-page/how-it-works-section"
import { OpenSourceSection } from "@/components/landing-page/open-source-section"
import { useState, useEffect } from "react"


export default function Home() {
  const [typedText, setTypedText] = useState("")
  const fullText =
    "$ ./shellsync-agent\n✓ ShellSync agent started\n✓ Session URL: https://shellsync.dev/session/abc123\n✓ Ready for collaboration..."

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />
      <HeroSection typedText={typedText} />
      <FeaturesSection />
      <GetStartedSection />
      <HowItWorksSection />
      <OpenSourceSection />
      <FAQSection />
      <Footer />
    </div>
  )
}
