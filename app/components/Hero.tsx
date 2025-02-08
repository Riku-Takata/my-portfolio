import { Button } from "@/components/ui/button"
import Link from "next/link"
import DeskAnimation from "./DeskAnimation"

const Hero = () => {
  return (
    <section className="bg-card text-primary-foreground py-16 lg:py-28">
      <div className="container mx-auto px-20">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="lg:w-2/3 text-center lg:text-left mb-8 lg:mb-0">
            <h1 className="text-[#453F3C] text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              <span className="text-primary">高田 莉玖</span><span className="text-3xl lg:text-4xl"> - Riku Takata</span>
            </h1>
            <p className="text-[#453F3C] text-2xl lg:text-3xl mb-8 animate-fade-in-delay-1">
              Toyama Prefecture University | Product Engineer
            </p>
            <Button
              asChild
              className="bg-primary hover:bg-white hover:text-primary text-primary-foreground font-bold py-3 px-8 rounded-full transition duration-300 animate-fade-in-delay-2"
            >
              <Link href="#projects">View My Products</Link>
            </Button>
          </div>
          <div className="lg:w-1/3 flex justify-center items-center">
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
