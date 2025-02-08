import { NextResponse } from 'next/server';

const GITHUB_API_URL = 'https://api.github.com/repos';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

async function fetchDefaultBranch(repoName: string, username: string): Promise<string> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/${username}/${repoName}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.error(`Error fetching repository info: ${await response.text()}`);
      return 'main';
    }
    const data = await response.json();
    return data.default_branch || 'main';
  } catch (error) {
    console.error('Error fetching default branch:', error);
    return 'main';
  }
}

async function fetchReadmeContent(repoName: string, username: string, branch: string): Promise<string> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/${username}/${repoName}/readme?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.raw',
      },
    });

    if (!response.ok) {
      console.error(`Error fetching README (${repoName} - ${branch}): ${await response.text()}`);
      return '';
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching README:', error);
    return '';
  }
}

function extractFirstImageFromReadme(
  readmeContent: string,
  repoName: string,
  username: string,
  branch: string
): string | null {
  const imgRegex = /!\[.*?\]\(([^)]+)\)/;
  const match = readmeContent.match(imgRegex);
  if (!match) return null;

  let imageUrl = match[1].trim();
  if (!imageUrl.startsWith('http')) {
    imageUrl = imageUrl.replace(/^\.?\//, '');
    imageUrl = `https://raw.githubusercontent.com/${username}/${repoName}/${branch}/${imageUrl}`;
  }
  return imageUrl;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get('repo');
  const username = searchParams.get('username');

  if (!repo || !username) {
    return NextResponse.json({ error: 'Missing repository name or username' }, { status: 400 });
  }

  const defaultBranch = await fetchDefaultBranch(repo, username);
  const readmeContent = await fetchReadmeContent(repo, username, defaultBranch);
  if (!readmeContent) {
    return NextResponse.json({ error: 'README not found' }, { status: 404 });
  }

  const imageUrl = extractFirstImageFromReadme(readmeContent, repo, username, defaultBranch);

  return NextResponse.json({ imageUrl: imageUrl || 'No Image Available' }, { status: 200 });
}
