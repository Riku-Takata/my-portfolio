import { Button } from "@/components/ui/button"
import Link from "next/link"

const Hero = () => {
  return (
    <section className="bg-[#3674B5] text-white py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
          Hi, I’m <span className="text-[#A1E3F9]">Riku Takata</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 animate-fade-in-delay-1">
          富山県立大学 | プロダクトエンジニア | 研究未定
        </p>
        <Button
          asChild
          className="bg-[#578FCA] hover:bg-white hover:text-[#3674B5] text-white font-bold py-3 px-8 rounded-full transition duration-300 animate-fade-in-delay-2"
        >
          <Link href="#projects">View My Work</Link>
        </Button>
      </div>
    </section>
  )
}

export default Hero

