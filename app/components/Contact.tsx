"use client"

import { Github, Mail, Twitter } from "lucide-react"
import type React from "react" // Added import for React

const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[#453F3C] ">Get In Touch</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2 flex flex-col justify-center items-center md:items-start space-y-4">
            <a
              href="mailto:your.email@example.com"
              className="flex items-center space-x-2 text-[#453F3C] hover:text-[#726d6a] "
            >
              <Mail size={24} />
              <span>your.email@example.com</span>
            </a>
            <a
              href="https://github.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-[#453F3C] hover:text-[#726d6a] "
            >
              <Github size={24} />
              <span>GitHub</span>
            </a>
            <a
              href="https://linkedin.com/in/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-[#453F3C] hover:text-[#726d6a] "
            >
              <Twitter size={24} />
              <span>X</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact

