"use client"

import { useEffect, useState } from "react"
import Header from "./components/Header"
import Hero from "./components/Hero"
import About from "./components/About"
import Skills from "./components/Skills"
import Projects from "./components/Projects"
import Contact from "./components/Contact"
import Footer from "./components/Footer"
import WelcomePage from "./components/welcome/page"
import ZennArticles from "./components/ZennArticles"

export default function Home() {
  // Welcome ページを表示するかどうかのフラグ
  const [showWelcome, setShowWelcome] = useState(false)
  // まだローカルストレージの判定中かどうかを示すフラグ
  const [loading, setLoading] = useState(true)

  // リンク内アンカー（#about など）にスムーズスクロールで飛ぶ仕組み
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1)
      if (hash) {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      }
    }

    handleHashChange() // 初回ページロード時のハッシュ処理
    window.addEventListener("hashchange", handleHashChange)

    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [])

  useEffect(() => {
    // sessionStorage からフラグを読み取る
    const visitedThisSession = sessionStorage.getItem("visitedThisSession")

    // セッション内でまだ訪問していない場合(=リロード時でない & 新規タブでのアクセス)
    if (!visitedThisSession) {
      setShowWelcome(true)
      // タブを閉じるまではフラグを保持
      sessionStorage.setItem("visitedThisSession", "true")
    }

    setLoading(false)
  }, [])

  // Welcome ページを数秒後に自動的に閉じる
  // (時間はお好みで調整、または WelcomePage 側にボタンを置いてユーザー操作で閉じる等でもOK)
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false)
      }, 7000) // 7秒後にメイン画面に切り替え

      return () => clearTimeout(timer)
    }
  }, [showWelcome])

  // ローディング中は何も表示しない (ちらつき防止)
  if (loading) {
    return null
  }

  // Welcome ページを表示するフラグが true のときは WelcomePage を描画
  if (showWelcome) {
    return (
      <div className="h-screen overflow-hidden">
        <WelcomePage />
      </div>
    )
  }

  // それ以外は通常の Home ページを表示
  return (
    <div className="min-h-screen bg-[#D1F8EF]">
      <Header />
      <main>
        <ZennArticles />
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
