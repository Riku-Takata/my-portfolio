import { Button } from "@/components/ui/button"
import Link from "next/link"
import DeskAnimation from "./DeskAnimation"
import { Github, Twitter, ExternalLink } from "lucide-react"
import { SiQiita, SiZenn } from "react-icons/si"

const Hero = () => {
  return (
    <section id="hero" className="bg-card text-primary-foreground py-10 lg:py-20 min-h-screen flex items-center">
      <div className="container mx-auto px-4 lg:px-20">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-10 lg:gap-0">
          <div className="lg:w-1/2 text-center lg:text-left">
            <h1 className="text-[#453F3C] text-4xl lg:text-6xl font-bold mb-4 animate-fade-in">
              <span className="text-primary block lg:inline">高田 莉玖</span>
              <span className="text-2xl lg:text-4xl text-[#453F3C] block lg:inline lg:ml-4">- Riku Takata</span>
            </h1>
            <p className="text-[#453F3C] text-xl lg:text-2xl mb-6 animate-fade-in-delay-1 font-medium">
              Toyama Prefecture University | Product Engineer
            </p>
            
            <div className="mb-8 animate-fade-in-delay-2 space-y-4">
              <p className="text-[#5A524E] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Webエンジニアとして、ユーザー体験を重視した開発を行っています。
                研究ではXRや衛星画像分析に取り組み、そこで得た知見をWeb技術に応用しています。
                人と技術をつなぐ、実用的なシステム構築を目指しています。
              </p>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-4">
                {["Next.js", "React", "TypeScript", "Node.js", "Python", "Satellite Data", "XR"].map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-sm font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 animate-fade-in-delay-3">
              <Button asChild variant="outline" size="icon" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                <a href="https://github.com/Riku-Takata" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="w-5 h-5" />
                </a>
              </Button>
              <Button asChild variant="outline" size="icon" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                <a href="https://x.com/riku_takata" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter className="w-5 h-5" />
                </a>
              </Button>
               <Button asChild variant="outline" size="icon" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                <a href="https://zenn.dev/riku_takata" target="_blank" rel="noopener noreferrer" aria-label="Zenn">
                  <SiZenn className="w-5 h-5" />
                </a>
              </Button>
               <Button asChild variant="outline" size="icon" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                <a href="https://qiita.com/Riku-Takata" target="_blank" rel="noopener noreferrer" aria-label="Qiita">
                  <SiQiita className="w-5 h-5" />
                </a>
              </Button>
            </div>
          </div>
          
          <div className="lg:w-1/2 flex justify-center items-center w-full">
            <div className="w-full max-w-md lg:max-w-xl xl:max-w-2xl">
              <DeskAnimation />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
