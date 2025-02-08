"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FaEnvelope, FaGithub, FaXTwitter } from "react-icons/fa6"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

const contactMethods = [
  {
    name: "Email",
    icon: FaEnvelope,
    value: "RikuChestnut66@gmail.com",
    href: "mailto:RikuChestnut66@gmail.com",
  },
  {
    name: "GitHub",
    icon: FaGithub,
    value: "Riku-Takata",
    href: "https://github.com/Riku-Takata",
  },
  {
    name: "X",
    icon: FaXTwitter,
    value: "RIKU TAKATA",
    href: "https://x.com/tk1_zansin",
  },
]

const Contact = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section id="contact" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-primary">Contact</h2>
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-lg mb-12 text-muted-foreground">
            常に新しいチャレンジや面白いことに取り組みたいと思っています！<br />
            ご連絡は以下のいずれかの方法でお気軽にご連絡ください。<br />
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.name}
                className="relative"
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
              >
                <motion.div
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  initial={false}
                  animate={{
                    scale: hoveredIndex === index ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                />
                <div className="relative z-10 flex flex-col items-center p-6 bg-background rounded-lg shadow-lg bg-white">
                  <method.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{method.name}</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">{method.value}</p>
                  <Button asChild variant="outline" size="sm">
                    <a href={method.href} target="_blank" rel="noopener noreferrer" className="flex bg-white items-center text-primary border-primary hover:border-secondary">
                      Connect <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact