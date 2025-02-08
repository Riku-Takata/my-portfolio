"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface ContributionDay {
  date: string;
  contributionCount: number;
}

interface Language {
  name: string;
}

interface Project {
  name: string;
  description?: string;
  url: string;
  contributions: number;
  image?: string;
  languages: { nodes: Language[] };
}

const getContributionData = async (period: string): Promise<ContributionDay[]> => {
  const response = await fetch(`/api/contributions?period=${period}`)
  if (!response.ok) {
    throw new Error("Failed to fetch contributions")
  }
  return response.json()
}

const getProjects = async (): Promise<Project[]> => {
  const response = await fetch(`/api/projects`)
  if (!response.ok) {
    throw new Error("Failed to fetch projects")
  }
  return response.json()
}

const Projects = () => {
  const [period, setPeriod] = useState("month")
  const [contributionData, setContributionData] = useState<ContributionDay[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    getContributionData(period).then(setContributionData).catch(console.error)
    getProjects().then(setProjects).catch(console.error)
  }, [period])

  const totalContributions = contributionData.reduce((sum, day) => sum + day.contributionCount, 0)

  return (
    <section id="projects" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-primary">Featured Projects</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">GitHub Contributions</CardTitle>
              <CardDescription>Total contributions in selected period: {totalContributions}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="month" value={period} onValueChange={setPeriod} className="mb-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="3months">3 Months</TabsTrigger>
                  <TabsTrigger value="6months">6 Months</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={contributionData}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => date.slice(5).replace("-", "/")}
                      interval={period === "year" ? 30 : period === "6months" ? 15 : 7}
                    />
                    <Tooltip />
                    <Line type="monotone" dataKey="contributionCount" stroke="#E07B39" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          {/* Right Column - Projects Gallery */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <Card key={project.name} className="overflow-hidden bg-card">
                  {project.image === "No Image Available" ? (
                    <div className="w-full h-40 flex items-center justify-center bg-gray-200 text-gray-500">
                      No Image Available
                    </div>
                  ) : (
                    <Image
                      src={project.image || "/placeholder.svg"}
                      alt={project.name}
                      width={300}
                      height={200}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg text-foreground">{project.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="p-4 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {project.languages.nodes
                        .slice(0, 4)
                        .map((tech) => (
                        <Badge
                          key={tech.name}
                          variant="secondary"
                          className="bg-secondary/50 text-secondary-foreground text-xs"
                        >
                          {tech.name}
                        </Badge>
                      ))}
                      {project.languages.nodes.length > 4 && (
                        <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground text-xs">
                          +{project.languages.nodes.length - 2}
                        </Badge>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
              <Card className="flex items-center justify-center bg-card/50 border-dashed">
                <Button variant="ghost" className="text-primary hover:text-primary/90 hover:bg-primary/10" asChild>
                  <a href="https://github.com/Riku-Takata">View All Projects →</a>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Projects
