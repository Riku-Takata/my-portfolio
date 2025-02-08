"use client"

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import Loader from "./Loader"

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
  const [slidesToShow, setSlidesToShow] = useState(3) // デフォルトはデスクトップ用の3枚表示

  // ウィンドウサイズに応じた表示枚数を設定
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) { // スマホ
        setSlidesToShow(1)
      } else if (width < 1024) { // タブレット
        setSlidesToShow(2)
      } else { // デスクトップ
        setSlidesToShow(3)
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 記事の取得
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

  // スライド移動の関数（1枚ずつ移動）
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % articles.length)
  }, [articles.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length)
  }, [articles.length])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // 自動スライド（5秒ごと）
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide()
    }, 5000)
    return () => clearInterval(timer)
  }, [nextSlide])

  if (articles.length === 0) {
    return (
      <div className="bg-card mx-auto w-full items-center ">
        <Loader />
      </div>
    )
  }

  // 無限ループ対応のため、最初の「slidesToShow」分の記事をクローン
  const displayedArticles = [...articles, ...articles.slice(0, slidesToShow)]

  return (
    <section className="bg-card py-4 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative max-w-7xl mx-auto">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / slidesToShow)}%)` }}
              role="region"
              aria-label="Article Slider"
            >
              {displayedArticles.map((article, index) => (
                <div
                  key={`${article.id}-${index}`}
                  className="flex-shrink-0 px-2"
                  style={{ width: `${100 / slidesToShow}%` }}
                >
                  <Card className="h-full bg-background/50 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center">
                      <div className="w-full">
                        <CardTitle className="text-lg font-bold line-clamp-1 mb-1">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="text-xs mb-2">
                          {formatDate(article.publishedAt)}
                        </CardDescription>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            ❤ {article.likes} LIKES
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-primary hover:text-white"
                          >
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

          {/* ナビゲーションボタン（必要に応じてモバイル表示用にクラスを調整可） */}
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
