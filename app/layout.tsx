import { Inter } from "next/font/google"
import "./globals.css"
import type React from "react" // Import React
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Riku Takata's Portfolio",
  description: "Personal portfolio showcasing skills and projects",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

