"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
// import Image from "next/image"

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
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "bg-card shadow-md" : "bg-card shadow-lg"}`}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          {/* <Image
            src="/naptop.jpg?height=300&width=300"
            alt="Your Name"
            width={30}
            height={30}
            className="rounded-full mx-auto"
          /> */}
          <span className="text-2xl font-bold text-primary">Portfolio</span>
        </Link>
        <nav className="hidden md:flex space-x-6">
          {["about", "skills", "projects", "contact"].map((section) => (
            <Button
              key={section}
              variant="ghost"
              className="text-primary hover:text-white capitalize"
              onClick={() => scrollToSection(section)}
            >
              {section}
            </Button>
          ))}
        </nav>
        <Button variant="ghost" size="icon" className="md:hidden text-primary" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>
      {isMenuOpen && (
        <nav className="md:hidden bg-card p-4">
          {["about", "skills", "projects", "contact"].map((section) => (
            <Button
              key={section}
              variant="ghost"
              className="block w-full text-left text-primary hover:text-white capitalize py-2"
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

