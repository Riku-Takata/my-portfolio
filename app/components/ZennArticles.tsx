"use client"

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"

interface Article {
  id: string
  title: string
  description: string
  publishedAt: string
  url: string
  likes: number
  image: string
}

export default function ZennArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch("/api/articles")
        if (!response.ok) throw new Error("Failed to fetch articles")
        const data = await response.json()
        setArticles(data)
      } catch (error) {
        console.error("Error fetching articles:", error)
      }
    }

    fetchArticles()
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % articles.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide()
    }, 5000) // 5秒ごとにスライド

    return () => clearInterval(timer)
  }, [nextSlide])

  if (articles.length === 0) {
    return <p className="text-center">記事を読み込み中...</p>
  }

  return (
    <section className="bg-card py-4 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative max-w-7xl mx-auto">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 33.333}%)` }}
              role="region"
              aria-label="Article Slider"
            >
              {[...articles, ...articles.slice(0, 2)].map((article, index) => (
                <div key={`${article.id}-${index}`} className="w-1/3 flex-shrink-0 px-2">
                  <Card className="h-full bg-background/50 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center">
                      <div className="w-full">
                        <CardTitle className="text-lg font-bold line-clamp-1 mb-1">{article.title}</CardTitle>
                        <CardDescription className="text-xs mb-2">{formatDate(article.publishedAt)}</CardDescription>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">❤ {article.likes} LIKES</span>
                          <Button variant="ghost" size="sm" asChild className="text-primary hover:text-white">
                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                              Read More <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 hidden md:flex"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 hidden md:flex"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </section>
  )
}
