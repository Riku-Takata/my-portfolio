"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Home, User, LayoutGrid, FileText, Mail } from "lucide-react"

const navItems = [
  { id: "hero", label: "Home", icon: Home },
  { id: "about", label: "About", icon: User },
  { id: "works", label: "Works", icon: LayoutGrid },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "contact", label: "Contact", icon: Mail },
] as const

const Header = () => {
  const [active, setActive] = useState<string>("hero")
  const glareRef = useRef<HTMLDivElement>(null)

  // スクロールに応じてアクティブなセクションを判定（スクロールスパイ）
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    )

    navItems.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
    setActive(id)
  }

  // マウス追従のグレア（ガラスに走る光）
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    glareRef.current?.style.setProperty("--x", `${e.clientX - rect.left}px`)
    glareRef.current?.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  return (
    <header className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="liquid-nav pointer-events-auto" onMouseMove={handleMouseMove}>
        <div ref={glareRef} className="liquid-glare" />
        <ul className="relative z-[3] flex items-center gap-1">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = active === id
            return (
              <li key={id} className="relative">
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-white/80 shadow-[0_4px_12px_rgba(69,63,60,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <button
                  onClick={() => scrollToSection(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative z-10 flex h-11 items-center gap-2 rounded-full px-3 sm:px-5 text-sm font-semibold transition-colors ${
                    isActive ? "text-primary" : "text-[#7a716c] hover:text-[#453F3C]"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}

export default Header
