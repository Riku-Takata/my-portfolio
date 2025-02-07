import { Progress } from "@/components/ui/progress"

const skills = [
  { name: "JavaScript", level: 90 },
  { name: "React", level: 85 },
  { name: "Node.js", level: 80 },
  { name: "Python", level: 75 },
  { name: "SQL", level: 70 },
  { name: "GraphQL", level: 65 },
]

const Skills = () => {
  return (
    <section id="skills" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[#453F3C] ">Skills & Expertise</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills.map((skill) => (
            <div key={skill.name} className="bg-background p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2 text-foreground">{skill.name}</h3>
              <Progress value={skill.level} className="h-2 bg-secondary" />
              <span className="text-sm text-muted-foreground">{skill.level}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Skills

