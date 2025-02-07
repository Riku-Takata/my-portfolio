import Image from "next/image"

const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[#3674B5]">About Me</h2>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <Image
              src="/naptop.jpg?height=300&width=300"
              alt="Your Name"
              width={300}
              height={300}
              className="rounded-full mx-auto"
            />
          </div>
          <div className="md:w-1/2">
          <p className="text-lg mb-4">
            私は情報系の大学に所属する大学生で、Webエンジニアとしてこのポートフォリオを作成しています。
            フロントエンドとバックエンドの両方に興味があり、特にユーザー体験を向上させるデザインや機能の実装に力を入れています。
          </p>
          <p className="text-lg mb-4">
            現在の研究テーマは〇〇（研究内容を具体的に記述）。
            この研究を通じて、データ処理や最適化技術に関する知識を深めており、Web開発にも活かせるスキルを習得しています。
            研究と実践を結びつけることで、より実用的なシステムを構築することを目指しています。
          </p>
          <p className="text-lg">
            幼い頃から〇〇に興味があり、それがきっかけでプログラミングを始めました。
            実際にアプリやWebサービスを開発する中で、技術が人の生活を豊かにする力を持っていることを実感し、エンジニアとしての道を歩むことを決意しました。
            これからも新しい技術を学びながら、より良いプロダクトを作っていきたいと考えています。
          </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About

