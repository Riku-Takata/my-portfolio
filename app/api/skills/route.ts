// app/api/skills/route.ts
import { NextResponse } from "next/server";

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // サーバー専用のトークン
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;

export async function GET() {
  try {
    const reposResponse = await fetch(GITHUB_API_URL, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });
    if (!reposResponse.ok) {
      return NextResponse.json(
        { error: `GitHub API Error: ${reposResponse.statusText}` },
        { status: reposResponse.status }
      );
    }
    const repos = await reposResponse.json();

    const languageStats: Record<string, number> = {};
    let totalBytes = 0;

    // 各リポジトリについて言語データを取得
    for (const repo of repos) {
      if (!repo.fork && repo.languages_url) {
        try {
          const langResponse = await fetch(repo.languages_url, {
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
            },
          });
          if (!langResponse.ok) {
            console.warn(`Languages API Error for ${repo.name}: ${langResponse.statusText}`);
            continue;
          }
          const langData = await langResponse.json();

          for (const [lang, bytes] of Object.entries(langData) as [string, number][]) {
            languageStats[lang] = (languageStats[lang] || 0) + bytes;
            totalBytes += bytes;
          }
        } catch (langError) {
          console.warn(`Failed to fetch languages for repo: ${repo.name}`, langError);
        }
      }
    }

    if (totalBytes === 0) {
      return NextResponse.json({ error: "No language data found" }, { status: 404 });
    }

    const skillsData = Object.entries(languageStats)
      .map(([name, bytes]) => ({
        name,
        level: Math.round((bytes / totalBytes) * 100),
      }))
      .sort((a, b) => b.level - a.level)
      .slice(0, 5);

    return NextResponse.json(skillsData, { status: 200 });
  } catch (error) {
    console.error("Error fetching GitHub languages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
