import { NextResponse } from "next/server"

export async function GET() {
  const username = "riku_takata"
  const apiUrl = `https://zenn.dev/api/articles?username=${username}&order=latest&count=5`

  try {
    const response = await fetch(apiUrl)

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 })
    }

    const data = await response.json()

    const articles = data.articles.map((article: { id: string; title: string; body_text: string; published_at: string; slug: string; liked_count: number; og_image_url?: string; user: { username: string } }) => ({
      id: article.id,
      title: article.title,
      publishedAt: article.published_at,
      url: `https://zenn.dev/${article.user.username}/articles/${article.slug}`,
      likes: article.liked_count,
      image: article.og_image_url || "/placeholder.svg",
    }))

    return NextResponse.json(articles, { status: 200 })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
