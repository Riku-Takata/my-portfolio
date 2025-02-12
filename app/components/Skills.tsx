"use client"

import { useEffect, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Progress } from "@/components/ui/progress";

interface Skill {
  name: string;
  level: number;
}

interface SkillTimeline {
  year: string
  title: string
  description: string
  icon: string
  skills: string[]
}

// スキルの時系列データ
const timelineData: SkillTimeline[] = [
  {
    year: "2023",
    title: "プログラミングとの出会い",
    description: "大学でプログラミングを始め、WebアプリケーションとJavaScriptに興味を持つ",
    icon: "/placeholder.svg?height=80&width=80",
    skills: ["HTML", "CSS", "JavaScript"],
  },
  {
    year: "2024",
    title: "フロントエンド開発の探求",
    description: "ReactとTypeScriptを学び、モダンなWeb開発技術のキャッチアップを開始",
    icon: "/placeholder.svg?height=80&width=80",
    skills: ["React", "TypeScript", "Next.js"],
  },
  {
    year: "2025",
    title: "フルスタック開発への挑戦",
    description: "バックエンド技術とデータベースの学習を開始し、フルスタック開発に取り組む",
    icon: "/placeholder.svg?height=80&width=80",
    skills: ["Node.js", "PostgreSQL", "Docker"],
  },
]

const Skills = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch("/api/skills");
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        const data: Skill[] = await response.json();
        setSkills(data);
        setError(null);
      } catch (err) {
        console.error("GitHub API の取得に失敗しました:", err);
      }
    };

    fetchSkills();
  }, []);

  return (
    <section id="skills" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-primary">
          Skills & Expertise (from GitHub)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Timeline */}
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-8 text-foreground">スキル習得の沿革</h3>
            <div className="relative pl-8 border-l-2 border-primary/30">
              {timelineData.map((item) => (
                <div key={item.year} className="mb-12 relative">
                  {/* Icon */}
                  <div className="absolute -left-12 w-8 h-7 rounded-full bg-primary/30 line-clamp-2" />
                  {/* Year */}
                  <div className="absolute -left-[0.5rem] flex items-center">
                    <span className="text-lg font-semibold text-primary">{item.year}</span>
                  </div>
                  {/* Content */}
                  <div className="ml-4">
                    {/* <div className="mb-4 overflow-hidden rounded-full w-20 h-20 border-4 border-secondary/30">
                      <Image
                        src={item.icon || "/placeholder.svg"}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="object-cover"
                      />
                    </div> */}
                    <h4 className="text-lg font-semibold text-foreground mb-2">{item.title}</h4>
                    <p className="text-muted-foreground mb-3">{item.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 text-xs rounded-full bg-secondary/50 text-secondary-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Radar Chart */}
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold text-foreground">主な保有技術</h3>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Skills</p>
                <p className="text-2xl font-bold text-primary">{skills.length}</p>
              </div>
            </div>
            <div className="relative h-[500px] flex flex-col">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                    <PolarGrid gridType="polygon" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: "#453F3C", fontSize: 12 }} />
                    <PolarRadiusAxis angle={22.5} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Skill Level" dataKey="level" stroke="#E07B39" fill="#E07B39" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {error ? (
                <p className="text-red-500 text-sm">{error}</p>
              ) : (
                <div className="mt-4 p-4">
                  <div className="h-32">
                    <div className="grid grid-cols-2 gap-4">
                      {skills.map((skill) => (
                        <div key={skill.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-foreground">{skill.name}</span>
                            <span className="text-muted-foreground">{skill.level}%</span>
                          </div>
                          <Progress value={skill.level} className="h-1 bg-secondary" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
