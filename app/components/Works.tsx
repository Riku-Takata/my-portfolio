"use client"

import { Github, ExternalLink, ArrowRight } from "lucide-react"

type Theme = "mint" | "solar" | "ocean" | "violet" | "prism"

interface Work {
  title: string
  description: string
  tags: string[]
  theme: Theme
  github?: string
  demo?: string
}

// TODO: プレースホルダ。実際の個人開発・経歴データに差し替えてください。
const works: Work[] = [
  {
    title: "Portfolio Site",
    description: "Next.js と Framer Motion で構築したポートフォリオ。3D 表現とガラスUIを採用。",
    tags: ["Next.js", "TypeScript", "Tailwind"],
    theme: "mint",
    github: "https://github.com/Riku-Takata",
  },
  {
    title: "衛星画像分析ツール",
    description: "研究で扱う衛星画像を可視化・解析する Web アプリ。Python と地理空間データを活用。",
    tags: ["Python", "GIS", "React"],
    theme: "ocean",
    github: "https://github.com/Riku-Takata",
  },
  {
    title: "XR 体験プロトタイプ",
    description: "XR デバイス向けのインタラクティブな体験。研究で得た知見を Web 技術に応用。",
    tags: ["XR", "WebGL", "Three.js"],
    theme: "violet",
    demo: "#",
  },
  {
    title: "フルスタック Web サービス",
    description: "フロントからバックエンド・DB まで一貫して開発したサービス。実用性を重視。",
    tags: ["Node.js", "PostgreSQL", "Docker"],
    theme: "solar",
    github: "https://github.com/Riku-Takata",
  },
  {
    title: "Coming Soon",
    description: "次の個人開発プロジェクトを準備中。新しい技術への挑戦を続けています。",
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
  return (
    <section id="works" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-foreground/70">Works</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-primary">個人開発と経歴</h2>
          <p className="mt-3 text-muted-foreground">これまでに取り組んできたプロジェクトや経験です。</p>
        </div>

        <div className="grid grid-cols-1 gap-12 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {works.map((work) => {
            const link = work.demo || work.github
            return (
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
                    {link && (
                      <a className="ux-more" href={link} target="_blank" rel="noopener noreferrer">
                        <button type="button" className="ux-more-btn">
                          View <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Works
