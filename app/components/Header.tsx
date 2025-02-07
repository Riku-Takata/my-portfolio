"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false)
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#3674B5] shadow-md" : "bg-[#3674B5] shadow-lg"}`}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#A1E3F9]">
            <path d="M12 2L1 21h22L12 2zm0 3.516L20.297 19H3.703L12 5.516z" />
          </svg>
          <span className="text-2xl font-bold text-white">YourName</span>
        </Link>
        <nav className="hidden md:flex space-x-6">
          {["about", "skills", "projects", "contact"].map((section) => (
            <Button
              key={section}
              variant="ghost"
              className="text-white hover:text-[#3674B5] capitalize"
              onClick={() => scrollToSection(section)}
            >
              {section}
            </Button>
          ))}
        </nav>
        <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>
      {isMenuOpen && (
        <nav className="md:hidden bg-[#578FCA] p-4">
          {["about", "skills", "projects", "contact"].map((section) => (
            <Button
              key={section}
              variant="ghost"
              className="block w-full text-left text-white hover:text-[#3674B5] capitalize py-2"
              onClick={() => scrollToSection(section)}
            >
              {section}
            </Button>
          ))}
        </nav>
      )}
    </header>
  )
}

export default Header

