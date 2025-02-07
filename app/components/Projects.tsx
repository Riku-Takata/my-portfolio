import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const GITHUB_USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "";
const GITHUB_GRAPHQL_API = process.env.NEXT_PUBLIC_GITHUB_GRAPHQL_API || "";
const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN || "";

interface Repo {
  id: string;
  name: string;
  description?: string;
  url: string;
}

interface ContributionDay {
  contributionCount: number;
  date: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

const Projects = () => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [contributions, setContributions] = useState<ContributionCalendar | null>(null);

  useEffect(() => {
    if (!GITHUB_GRAPHQL_API || !GITHUB_TOKEN) {
      console.error("GitHub API URL or Token is missing.");
      return;
    }
    
    fetch(GITHUB_GRAPHQL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        query: `{
          viewer {
            repositories(first: 3, orderBy: {field: UPDATED_AT, direction: DESC}) {
              nodes {
                id
                name
                description
                url
              }
            }
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.viewer?.repositories?.nodes) {
          setRepos(data.data.viewer.repositories.nodes);
        }
        if (data.data?.viewer?.contributionsCollection?.contributionCalendar) {
          const calendar = data.data.viewer.contributionsCollection.contributionCalendar;
          const days = calendar.weeks.flatMap((week: ContributionWeek) => week.contributionDays);
          setContributions({ totalContributions: calendar.totalContributions, weeks: [{ contributionDays: days }] });
        }
      })
      .catch((error) => console.error("Failed to fetch data:", error));
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">GitHub Contributions</h2>
          {contributions ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={contributions.weeks[0].contributionDays}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="contributionCount" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>Loading contributions...</p>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4 text-center">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repos.map((repo) => (
              <Card key={repo.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{repo.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{repo.description || "No description available"}</p>
                  <div className="mt-4 flex justify-between">
                    <Button asChild variant="outline">
                      <a href={repo.url} target="_blank" rel="noopener noreferrer">
                        View on GitHub
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button asChild>
              <a href={`https://github.com/${GITHUB_USERNAME}?tab=repositories`} target="_blank" rel="noopener noreferrer">
                View All
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
