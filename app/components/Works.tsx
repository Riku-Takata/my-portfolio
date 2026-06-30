"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Github, ExternalLink, ArrowRight, X } from "lucide-react"

type Theme = "mint" | "solar" | "ocean" | "violet" | "prism"

interface Work {
  title: string
  description: string
  detail?: string
  tags: string[]
  theme: Theme
  thumbnail?: string
  github?: string
  demo?: string
}

// テーマ別グラデーション（サムネイル未設定時のプレースホルダに使用）
const themeGradient: Record<Theme, string> = {
  mint: "linear-gradient(135deg, #00ffd6 0%, #08e260 100%)",
  solar: "linear-gradient(135deg, #fbbf24 0%, #dc2626 100%)",
  ocean: "linear-gradient(135deg, #22d3ee 0%, #1e3a8a 100%)",
  violet: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
  prism: "linear-gradient(135deg, #22d3ee 0%, #f472b6 100%)",
}

// TODO: プレースホルダ。実際の個人開発・経歴データに差し替えてください。
//       thumbnail に画像URL（/public 配下 or 外部URL）を入れるとサムネイル表示されます。
const works: Work[] = [
  {
    title: "Portfolio Site",
    description: "Next.js と Framer Motion で構築したポートフォリオ。3D 表現とガラスUIを採用。",
    detail:
      "Next.js（App Router）と Framer Motion を用いて構築したポートフォリオサイト。スクロールスパイ付きのガラス調ナビ、3D カードカルーセル、ホバーで傾く 3D カードなど、インタラクティブな表現を実装しています。",
    tags: ["Next.js", "TypeScript", "Tailwind"],
    theme: "mint",
    github: "https://github.com/Riku-Takata",
  },
  {
    title: "衛星画像分析ツール",
    description: "研究で扱う衛星画像を可視化・解析する Web アプリ。Python と地理空間データを活用。",
    detail:
      "研究で扱う衛星画像を可視化・解析するための Web アプリケーション。Python による画像処理と地理空間データの解析結果を、ブラウザ上でインタラクティブに確認できるようにしました。",
    tags: ["Python", "GIS", "React"],
    theme: "ocean",
    github: "https://github.com/Riku-Takata",
  },
  {
    title: "XR 体験プロトタイプ",
    description: "XR デバイス向けのインタラクティブな体験。研究で得た知見を Web 技術に応用。",
    detail:
      "XR デバイス向けに制作したインタラクティブ体験のプロトタイプ。研究で得た空間表現の知見を WebGL / Three.js を用いて Web 上に展開しました。",
    tags: ["XR", "WebGL", "Three.js"],
    theme: "violet",
    demo: "#",
  },
  {
    title: "フルスタック Web サービス",
    description: "フロントからバックエンド・DB まで一貫して開発したサービス。実用性を重視。",
    detail:
      "フロントエンドからバックエンド、データベース設計まで一貫して開発した Web サービス。Docker でローカル環境を統一し、実運用を見据えた構成を意識しました。",
    tags: ["Node.js", "PostgreSQL", "Docker"],
    theme: "solar",
    github: "https://github.com/Riku-Takata",
  },
  {
    title: "Coming Soon",
    description: "次の個人開発プロジェクトを準備中。新しい技術への挑戦を続けています。",
    detail: "次の個人開発プロジェクトを準備中です。新しい技術への挑戦を続けています。",
    tags: ["WIP"],
    theme: "prism",
  },
]

const CardIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4Zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4Z" />
  </svg>
)

const Works = () => {
  const [selected, setSelected] = useState<Work | null>(null)

  // モーダル表示中は背面スクロールを止め、Escで閉じる
  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null)
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [selected])

  return (
    <section id="works" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-foreground/70">Works</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-primary">個人開発と経歴</h2>
          <p className="mt-3 text-muted-foreground">これまでに取り組んできたプロジェクトや経験です。</p>
        </div>

        <div className="grid grid-cols-1 gap-12 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {works.map((work) => (
            <div key={work.title} className={`ux-parent ux-parent--${work.theme}`}>
              <div className="ux-card">
                <div className="ux-logo" aria-hidden="true">
                  <span className="ux-circle" />
                  <span className="ux-circle" />
                  <span className="ux-circle" />
                  <span className="ux-circle" />
                  <span className="ux-circle">
                    <CardIcon />
                  </span>
                </div>
                <div className="ux-glass" />
                <div className="ux-content">
                  <span className="ux-title">{work.title}</span>
                  <span className="ux-text">{work.description}</span>
                  <div className="ux-tags">
                    {work.tags.map((tag) => (
                      <span key={tag} className="ux-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="ux-bottom">
                  <div className="ux-social">
                    {work.github && (
                      <a className="ux-social-btn" href={work.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <Github />
                      </a>
                    )}
                    {work.demo && (
                      <a className="ux-social-btn" href={work.demo} target="_blank" rel="noopener noreferrer" aria-label="Demo">
                        <ExternalLink />
                      </a>
                    )}
                  </div>
                  <div className="ux-more">
                    <button type="button" className="ux-more-btn" onClick={() => setSelected(work)}>
                      View <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* プロジェクト詳細ポップアップ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-[#1c1c1c]/60 backdrop-blur-sm" onClick={() => setSelected(null)} />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="work-modal-title"
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="閉じる"
                className="absolute right-4 top-4 z-10 grid h-9 w-9 place-content-center rounded-full bg-white/80 text-[#453F3C] shadow-md transition hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* サムネイル */}
              <div className="relative h-52 w-full" style={{ background: themeGradient[selected.theme] }}>
                {selected.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.thumbnail} alt={selected.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-content-center">
                    <span className="px-6 text-center text-2xl font-black tracking-tight text-white/90">{selected.title}</span>
                  </div>
                )}
              </div>

              {/* 本文 */}
              <div className="p-7">
                <h3 id="work-modal-title" className="text-2xl font-bold text-[#453F3C]">
                  {selected.title}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-4 leading-relaxed text-muted-foreground">{selected.detail || selected.description}</p>

                {/* リンク（GitHub アイコン / デモ） */}
                <div className="mt-6 flex items-center gap-3">
                  {selected.github && (
                    <a
                      href={selected.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub リポジトリを開く"
                      className="grid h-11 w-11 place-content-center rounded-full bg-[#453F3C] text-white transition hover:bg-primary"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {selected.demo && (
                    <a
                      href={selected.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                    >
                      Live Demo <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default Works
