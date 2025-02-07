import { Button } from "@/components/ui/button"
import Link from "next/link"
import DeskAnimation from "./DeskAnimation"

const Hero = () => {
  return (
    <section className="bg-card text-primary-foreground py-20 md:py-32">
      <div className="container mx-auto px-20">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-2/3 text-center md:text-left mb-8 md:mb-0">
            <h1 className="text-[#453F3C] text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Hi, I’m <span className="text-primary">Riku Takata</span>
            </h1>
            <p className="text-[#453F3C] text-xl md:text-2xl mb-8 animate-fade-in-delay-1">
              Toyama Prefecture University | Product Engineer
            </p>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-full transition duration-300 animate-fade-in-delay-2"
            >
              <Link href="#projects">View My Products</Link>
            </Button>
          </div>
          <div className="md:w-1/3 flex justify-center items-center">
            <div className="w-full max-w-lg">
              <DeskAnimation />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
