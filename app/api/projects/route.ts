import { NextResponse } from "next/server";

const GITHUB_GRAPHQL_API = process.env.GITHUB_GRAPHQL_API || "https://api.github.com/graphql";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

// プロジェクト用の型定義
interface Project {
  name: string;
  description?: string;
  url: string;
  contributions: number;
  image: string;
  languages: { nodes: { name: string }[] };
}

async function fetchGitHubData(query: string) {
  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({ query }),
  });
  return response.json();
}

export async function GET() {
  const query = `{
    viewer {
      repositories(first: 5, orderBy: { field: PUSHED_AT, direction: DESC }) {
        nodes {
          name
          description
          url
          isPrivate
          stargazerCount
          languages(first: 5) {
            nodes {
              name
            }
          }
          defaultBranchRef {
            name
          }
          object(expression: "HEAD:README.md") {
            ... on Blob {
              text
            }
          }
        }
      }
    }
  }`;

  try {
    const data = await fetchGitHubData(query);
    if (!data || !data.data || !data.data.viewer) {
      console.error('Invalid API response:', data);
      return NextResponse.json({ error: 'Invalid API response' }, { status: 500 });
    }

    const repos = data.data.viewer.repositories.nodes;
    const projects: Project[] = repos
      .filter((repo: { isPrivate: boolean }) => !repo.isPrivate)
      .map((repo: {
        name: string;
        description?: string;
        url: string;
        stargazerCount: number;
        languages: { nodes: { name: string }[] };
        defaultBranchRef: { name: string };
        object?: { text?: string };
      }) => {
        function extractFirstImageFromReadme(readmeContent: string | undefined): string {
          if (!readmeContent) return "No Image Available";
          const imgRegex = /<img[^>]+src=["'](https:\/\/github\.com\/user-attachments\/assets\/[^"']+)["'][^>]*>/;
          const match = readmeContent.match(imgRegex);
          return match ? match[1].trim() : "No Image Available";
        }

        const readmeContent = repo.object?.text || "";
        const imageUrl = extractFirstImageFromReadme(readmeContent);

        return {
          name: repo.name,
          description: repo.description,
          url: repo.url,
          contributions: repo.stargazerCount,
          image: imageUrl,
          languages: repo.languages,
        };
      });

    projects.sort((a: Project, b: Project) => b.contributions - a.contributions);
    return NextResponse.json(projects.slice(0, 3));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Error fetching projects' }, { status: 500 });
  }
}
