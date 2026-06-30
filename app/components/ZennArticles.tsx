"use client"

import { useState, useEffect } from "react"
import { ExternalLink, Heart } from "lucide-react"
import Loader from "./Loader"

interface Article {
  id: string
  title: string
  publishedAt: string
  url: string
  likes: number
  image: string
}

// 画像が無い記事用のグラデーション（パレットに合わせた配色）
const gradients = [
  "linear-gradient(160deg, #3ea8ff 0%, #1f6feb 100%)",
  "linear-gradient(160deg, #f97316 0%, #dc2626 100%)",
  "linear-gradient(160deg, #14b8a6 0%, #0284c7 100%)",
  "linear-gradient(160deg, #a855f7 0%, #6366f1 100%)",
  "linear-gradient(160deg, #fbbf24 0%, #f97316 100%)",
]
const hasImage = (src: string) => /^https?:\/\//.test(src)

// カード幅(em)。半径計算とカード描画で共有する
const CARD_W = 15

export default function ZennArticles() {
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: Article[]) => setArticles(data))
      .catch((err) => console.error("Error fetching articles:", err))
  }, [])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })

  const n = articles.length
  // シリンダーの半径(em)：カード同士が隣り合うように配置
  const radius = n > 1 ? (0.5 * CARD_W + 0.5) / Math.tan(Math.PI / n) : 0

  return (
    <section id="blog" className="bg-white py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-foreground/70">Blog</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-primary">Zenn Articles</h2>
          <p className="mt-3 text-muted-foreground">技術記事を Zenn に投稿しています。ホバーで停止・クリックで開く。</p>
        </div>

        {n === 0 ? (
          <Loader />
        ) : (
          <div className="zen-scene">
            <div className="zen-ring">
              {articles.map((article, i) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="zen-card group block"
                  style={{
                    width: `${CARD_W}em`,
                    background: gradients[i % gradients.length],
                    transform: `rotateY(${i * (360 / n)}deg) translateZ(${-radius}em)`,
                  }}
                >
                  {hasImage(article.image) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.image} alt={article.title} className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c]/88 via-[#1c1c1c]/25 to-transparent" />
                  <div className="absolute right-4 top-3 text-5xl font-black text-white/15 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="mb-2 flex items-center gap-3 text-[11px] text-white/80">
                      <span>{formatDate(article.publishedAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3 fill-current" /> {article.likes}
                      </span>
                    </div>
                    <h3 className="text-base font-bold leading-snug line-clamp-4">{article.title}</h3>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                      Read more <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
