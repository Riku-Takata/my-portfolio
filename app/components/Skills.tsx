import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const GITHUB_USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME;
const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN; // GitHub トークン
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;

const Skills = () => {
  const [skills, setSkills] = useState<{ name: string; level: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGitHubLanguages = async () => {
      try {
        const response = await fetch(GITHUB_API_URL, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`, // 認証ヘッダーを追加
          },
        });
        if (!response.ok) throw new Error(`GitHub API Error: ${response.statusText}`);
        const repos = await response.json();

        const languageStats: Record<string, number> = {};
        let totalBytes = 0;

        for (const repo of repos) {
          if (!repo.fork && repo.languages_url) {
            try {
              const langResponse = await fetch(repo.languages_url, {
                headers: {
                  Authorization: `token ${GITHUB_TOKEN}`, // 各リポジトリの言語データ取得にも認証
                },
              });
              if (!langResponse.ok) throw new Error(`Languages API Error: ${langResponse.statusText}`);
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

        if (totalBytes === 0) throw new Error("No language data found");

        const skillsData = Object.entries(languageStats)
          .map(([name, bytes]) => ({
            name,
            level: Math.round((bytes / totalBytes) * 100),
          }))
          .sort((a, b) => b.level - a.level)
          .slice(0, 5);

        setSkills(skillsData);
        setError(null);
      } catch (error) {
        console.error("GitHub API の取得に失敗しました:", error);
      }
    };

    fetchGitHubLanguages();
  }, []);

  return (
    <section id="skills" className="py-20 bg-card flex justify-center">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-center text-center">
        <div className="flex flex-col justify-center lg:w-1/2 w-full mb-10 lg:mb-0 items-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-10 text-center text-[#453F3C]">
            Skills & Expertise(from GitHub)
          </h2>
          <h3 className="text-left text-xl font-semibold mb-6 text-foreground">主な使用技術スタック</h3>
          {error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : (
            <div className="space-y-6 w-full max-w-md text-center">
              {skills.map((skill) => (
                <div key={skill.name} className="flex items-center justify-center w-full">
                  <span className="w-1/4 text-sm font-semibold text-foreground text-right pr-2">{skill.name}</span>
                  <div className="w-1/2">
                    <Progress value={skill.level} className="h-1 bg-secondary" />
                  </div>
                  <span className="w-1/4 text-xs text-muted-foreground text-left pl-2">{skill.level}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center lg:w-1/2 w-full max-w-md">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fill: "#453F3C", fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Skill Level" dataKey="level" stroke="#E07B39" fill="#E07B39" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export default Skills;
