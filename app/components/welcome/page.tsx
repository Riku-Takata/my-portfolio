"use client";
import React from "react";
import "./style.scss"; // 同階層の style.scss をインポート

export default function WelcomePage() {
  // 1行目、2行目の文字を配列化
  const line1 = ["W", "e", "l", "c", "o", "m", "e", "to"];
  const line2 = ["M", "y", "P", "o", "r", "t", "f", "o", "l", "i", "o",  ": )"];
  const numberOfParticles = 12;

  // 背景生成に使用する最大文字数
  const maxChars = Math.max(line1.length, line2.length);

  return (
    <main>
      {/* 背景を最大文字数分生成 */}
      {[...Array(maxChars)].map((_, i) => (
        <div key={`bg-${i}`} className={`background background${i}`} />
      ))}

      {/* 1行目 */}
      <div className="criterion line1">
        {line1.map((char, i) => (
          <div key={`custom-text1-${i}`} className={`custom-text custom-text${i}`}>
            {char}
          </div>
        ))}
        {line1.map((_, i) => (
          <div key={`frame1-${i}`} className={`frame frame${i}`} />
        ))}
        {line1.map((_, i) =>
          [...Array(numberOfParticles)].map((__, j) => (
            <div key={`particle1-${i}-${j}`} className={`particle particle${i}${j}`} />
          ))
        )}
      </div>

      {/* 2行目 */}
      <div className="criterion line2">
        {line2.map((char, i) => (
          <div key={`custom-text2-${i}`} className={`custom-text custom-text${i}`}>
            {char}
          </div>
        ))}
        {line2.map((_, i) => (
          <div key={`frame2-${i}`} className={`frame frame${i}`} />
        ))}
        {line2.map((_, i) =>
          [...Array(numberOfParticles)].map((__, j) => (
            <div key={`particle2-${i}-${j}`} className={`particle particle${i}${j}`} />
          ))
        )}
      </div>
    </main>
  );
}
