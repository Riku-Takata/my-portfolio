import { NextResponse } from 'next/server';

const GITHUB_GRAPHQL_API = process.env.GITHUB_GRAPHQL_API || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month';

  const today = new Date();
  const startDate = new Date();

  if (period === 'month') {
    startDate.setMonth(today.getMonth() - 1);
  } else if (period === '3months') {
    startDate.setMonth(today.getMonth() - 3);
  } else if (period === '6months') {
    startDate.setMonth(today.getMonth() - 6);
  } else {
    startDate.setFullYear(today.getFullYear() - 1);
  }

  const query = `{
    viewer {
      contributionsCollection(from: "${startDate.toISOString()}", to: "${today.toISOString()}") {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }`;

  try {
    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();

    if (!data || data.errors) {
      console.error('Error fetching contributions:', data);
      return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
    }

    const contributionData = data.data.viewer.contributionsCollection.contributionCalendar.weeks.flatMap(
      (week: { contributionDays: { date: string; contributionCount: number }[] }) => week.contributionDays
    );

    return NextResponse.json(contributionData, { status: 200 });
  } catch (error) {
    console.error('Exception fetching contributions:', error);
    return NextResponse.json({ error: 'Exception fetching contributions' }, { status: 500 });
  }
}
