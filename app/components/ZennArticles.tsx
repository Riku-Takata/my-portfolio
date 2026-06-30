"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, ExternalLink, Heart } from "lucide-react"
import Loader from "./Loader"

// 画像が無い記事用のグラデーション（パレットに合わせた配色）
const gradients = [
  "linear-gradient(135deg, #3ea8ff 0%, #1f6feb 100%)",
  "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #0284c7 100%)",
  "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
  "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
]
const hasImage = (src: string) => /^https?:\/\//.test(src)

interface Article {
  id: string
  title: string
  publishedAt: string
  url: string
  likes: number
  image: string
}

// 各カードの重なり（前面=0）に応じた 3D トランスフォームを計算
const cardStyle = (offset: number, total: number) => {
  const depth = Math.min(offset, 3)
  return {
    y: -depth * 26,
    z: -depth * 70,
    scale: 1 - depth * 0.07,
    opacity: offset > 3 ? 0 : 1 - depth * 0.18,
    zIndex: total - offset,
  }
}

export default function ZennArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: Article[]) => setArticles(data))
      .catch((err) => console.error("Error fetching articles:", err))
  }, [])

  const next = useCallback(() => {
    setCurrent((c) => (articles.length ? (c + 1) % articles.length : 0))
  }, [articles.length])

  const prev = useCallback(() => {
    setCurrent((c) => (articles.length ? (c - 1 + articles.length) % articles.length : 0))
  }, [articles.length])

  // 5秒ごとに自動送り
  useEffect(() => {
    if (articles.length < 2) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, articles.length])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })

  return (
    <section id="blog" className="bg-white py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-foreground/70">Blog</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-primary">Zenn Articles</h2>
          <p className="mt-3 text-muted-foreground">技術記事を Zenn に投稿しています。カードをめくって読む。</p>
        </div>

        {articles.length === 0 ? (
          <Loader />
        ) : (
          <div className="mx-auto max-w-2xl">
            <div className="zen-stage">
              {articles.map((article, index) => {
                // 前面からの距離（current が前面）
                const offset = (index - current + articles.length) % articles.length
                const s = cardStyle(offset, articles.length)
                const isFront = offset === 0
                return (
                  <motion.article
                    key={article.id}
                    className="absolute inset-x-0 mx-auto h-[400px] w-[90%] max-w-xl -translate-y-1/2 top-1/2 rounded-3xl overflow-hidden shadow-2xl"
                    style={{
                      transformStyle: "preserve-3d",
                      pointerEvents: isFront ? "auto" : "none",
                      background: gradients[index % gradients.length],
                    }}
                    animate={s}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  >
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="block h-full w-full" tabIndex={isFront ? 0 : -1}>
                      {hasImage(article.image) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={article.image} alt={article.title} className="absolute inset-0 h-full w-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c]/85 via-[#1c1c1c]/20 to-transparent" />
                      <div className="absolute right-6 top-6 text-6xl font-black text-white/15 tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                        <div className="mb-3 flex items-center gap-3 text-xs text-white/80">
                          <span>{formatDate(article.publishedAt)}</span>
                          <span className="inline-flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 fill-current" /> {article.likes}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold leading-snug line-clamp-3">{article.title}</h3>
                        {isFront && (
                          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white">
                            Read more <ExternalLink className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </a>
                  </motion.article>
                )
              })}
            </div>

            <div className="mt-8 flex items-center justify-center gap-6">
              <button
                onClick={prev}
                aria-label="Previous article"
                className="grid h-11 w-11 place-content-center rounded-full bg-background/70 text-primary shadow-md transition hover:bg-primary hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                {articles.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => setCurrent(i)}
                    aria-label={`Go to article ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "w-2 bg-secondary/50"}`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                aria-label="Next article"
                className="grid h-11 w-11 place-content-center rounded-full bg-background/70 text-primary shadow-md transition hover:bg-primary hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
