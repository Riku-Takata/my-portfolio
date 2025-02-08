import Image from "next/image";

const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
        {/* --- 左側（プロフィール画像・アニメーション付き） --- */}
        <div className="lg:w-1/3 flex justify-center">
          <div className="relative">
            <Image
              src="/naptop.jpg?height=300&width=300"
              alt="Your Name"
              width={300}
              height={300}
              className="rounded-full mx-auto animate-float"
            />
          </div>
        </div>

        {/* --- 右側（タイトル + テキスト） --- */}
        <div className="lg:w-2/3 text-left">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-6 text-[#453F3C]">
            About Me
          </h2>
          <p className="text-lg mb-4">
            富山県立大学に所属する2025年現在22歳の大学生です。Webエンジニアとして活動しています。<br/>
            フロントエンドとバックエンドの両方に興味があり、特にユーザー体験を向上させるデザインや機能の実装に力を入れています。<br/>
            研究活動とWebアプリ開発を結びつけることで、より実用的なシステムを構築することを目指し、日々奮闘しています。
          </p>
          <p className="text-lg mb-4">
            所属する研究室ではXRや衛星画像分析などWeb技術以外の分野で活動しています。<br/>
            他の分野の技術や考え方に触れ、知識のキャッチアップ練度を深めやWeb技術とのつながりを考えることで、<br/>
            Web開発にも活かせるスキルを習得しています。<br/>
          </p>
          <p className="text-lg">
            大学入学からPCを触り始め、講義がきっかけでWebプログラミングを始めました。<br/>
            実際にアプリやWebサービスを開発する中で、技術が人の生活を豊かにする力を持っていることを実感し、<br/>
            エンジニアとしての道を歩むことを決意しました。<br/>
            これからも新しい技術を学びながら、より良いプロダクトを作っていきたいと考えています。
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
