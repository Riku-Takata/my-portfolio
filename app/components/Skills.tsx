"use client"

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface Skill {
  name: string;
  level: number;
}

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
    <section id="skills" className="py-20 bg-card flex justify-center">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-center text-center">
        <div className="flex flex-col justify-center lg:w-2/3 w-full mb-10 lg:mb-0 items-center">
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

        <div className="flex items-center justify-center lg:w-1/3 w-full max-w-md">
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
