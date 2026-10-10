<img width="1907" alt="スクリーンショット 2025-02-08 11 50 32" src="https://github.com/user-attachments/assets/609db646-a769-4cc2-ad31-e61a6a333a45" />

# ポートフォリオサイト

## 概要
このプロジェクトは、私のスキルや実績を紹介するためのポートフォリオサイトです。主に**Next.js**を使用し、デザインやアニメーションの表現にもこだわった構成となっています。

## 技術スタック
- **フロントエンド:** Next.js, React, TypeScript
- **スタイリング:** Tailwind CSS, SASS, CSSアニメーション
- **ホスティング:** Vercel
- **その他:** ChatGPT, GitHub Actions（CI/CD）

## 主な機能
- **自己紹介セクション:** スキルセットやプロフィールの紹介
- **プロジェクト一覧:** これまでに開発したプロジェクトをGithubのリポジトリから取得して表示する
- **ブログ記事表示機能:** Zennの記事をスライダーで表示する
- **アニメーション:** CSSアニメーションを活用した動的なUI
- **お問い合わせ:** コンタクトページ

## 実装の推しポイント
- **WELCOMEページの表示**

https://github.com/user-attachments/assets/10373b64-563b-4062-b386-ad11a764826d

「Welcome to My Portfolio :)」という文字を順々にドロップさせてパーティクルの広がりと同時に表示する。
そのあとに背景に表示した文字数分だけのカラーバリエーションを表示してスライドアウトさせる。
さいごに顔文字の部分をジャンプさせるような表現でスライドアウトさせて、楽しい雰囲気でサイトに訪れてもらえるように工夫した。

- **Zennの記事のスライダー表示**
  
https://github.com/user-attachments/assets/7c7060a7-0c56-45b4-801d-4b6511686fa8

ZennのAPIを使用して自分の作成した記事の情報を取得し、スライダーでループさせながら表示する。
記事の情報をまとめてカード内に表示する時のデザインにもこだわった。

- **HeroセクションのDESKアニメーション**

https://github.com/user-attachments/assets/e15912e6-0555-4d60-81ed-db5e40022978

デスク、ラップトップ、カップ、本などのオブジェクトを含むSVGを描画する。
そのうちカップからは湯気が出るアニメーションを、ラップトップのディスプレイにはJavascript形式で1文字ずつ「Welcome to portfolio」を
プログラム調の文字デザインで表示するアニメーションを作成した。
プログラムでもWelcomeという気持ちを表現できてよかった。

- **SkillsセクションのGithubのリポジトリで使われている技術スタック表示**
  
<img width="1920" alt="スクリーンショット 2025-02-09 1 39 53" src="https://github.com/user-attachments/assets/e79e9be6-23ac-4f59-ad60-f471dd8619d3" />

GithubのAPIから取得した自分のPublicのリポジトリ情報から、使用されている技術スタックとして
どのような種類の技術を使っているか、使っている技術スタックの割合をレーダーチャートとプログレスバーで表示した。
Githubでは各リポジトリで使用されている技術スタックは見えても、全体的にどの技術を使用して開発しているか、は
見えないと思い、それをわかりやすく可視化するために二つのチャート形式で表示を行った。

また、自分の技術スタックの学習遍歴を簡単にまとめたものをその左側に表示している。

- **ProjectsセクションのGithubのContributionsの表示とリポジトリからの制作物取得**

<img width="1920" alt="スクリーンショット 2025-02-09 1 40 11" src="https://github.com/user-attachments/assets/0b87ceb0-02b4-40a0-9816-44e90d5eeb54" />

Projectsでは、主にGithubから取得した直近から過去一年までの開発実情を表示するConributionsの表示と
Githubのリポジトリで直近編集されたリポジトリ3つをギャラリービュー形式で表示している。

意図としてはまず、どれだけ開発を行なってきたかを定量的に可視化するためにGithubのContributionsの機能が有効であると考え、
それをGithubでの可視化方式ではなく、オリジナルのカーブチャートを用いて表示している。
次にリポジトリを元にした開発物の表示は、もともと作っていた[Notionをベースとしたポートフォリオサイト](https://bramble-path-e8e.notion.site/My-Portfolio-6b9aedf71fc448bd97efc11edf2c332d)を都度都度編集して制作物についてまとめるのが非常に手間だと思い、
pushしたリポジトリがそのまま自動的にポートフォリオサイトに反映されるように実装したいと思ったことがきっかけでそのような実装にした。
各リポジトリに表示できる画像はREADMEの一番最初に表示してある画像を取得して、その画像を表示するようにしている。

## デプロイ
このプロジェクトは **Vercel** を使用してデプロイされます。GitHubにプッシュすると自動的にデプロイが実行されます。

## 今後の予定
- ダークモードの実装
- PWA対応


---

## 依存の確認記録

T-001 で、docs/design.md の「未確認」の項目を公式ドキュメントと npm レジストリで確かめた記録です。「確かめた日」は日本時間の日付です。公式の裏付けが取れなかったものは「未確認」と書いています。npm の版は、確かめた日の時点で公開済みの安定版(プレリリースを除く)のうち一番新しいものです。

| 項目 | 版または結論 | 確かめた日 | 出典 |
|---|---|---|---|
| `astro` | 7.3.8(Node の対応範囲は下の `Astro が対応する Node の範囲` の行) | 2026-10-09 | https://www.npmjs.com/package/astro |
| `@astrojs/mdx` | 8.0.3 | 2026-10-09 | https://www.npmjs.com/package/@astrojs/mdx |
| `@astrojs/sitemap` | 3.7.4 | 2026-10-09 | https://www.npmjs.com/package/@astrojs/sitemap |
| `@astrojs/check` | 0.9.10 | 2026-10-09 | https://www.npmjs.com/package/@astrojs/check |
| `tailwindcss` | 4.3.3(v4 系) | 2026-10-09 | https://www.npmjs.com/package/tailwindcss |
| `Tailwind の Astro への組み込み方` | (a) はい: Astro 公式は Tailwind 4 に公式の Vite プラグイン `@tailwindcss/vite` を使う(Astro 5.2.0 以降は `astro add tailwind` で入る); (b) いいえ: `@astrojs/tailwind`(最新 6.0.2)は npm で deprecated の印がなく、Astro 公式は「Tailwind 3 との互換のための旧来の方法で、Tailwind 4 には不要」と書いている | 2026-10-09 | https://docs.astro.build/en/guides/styling/ https://tailwindcss.com/docs/installation/framework-guides/astro https://www.npmjs.com/package/@astrojs/tailwind |
| `@tailwindcss/typography` | 0.5.20(peerDependencies で Tailwind v4 を受け付ける) | 2026-10-09 | https://www.npmjs.com/package/@tailwindcss/typography |
| `@vercel/analytics` | 2.0.1; (a) はい: `import Analytics from '@vercel/analytics/astro'`(default export。exports に `./astro` がある); (b) 未確認: Analytics のクイックスタートは adapter なしでコンポーネントを置く手順だが、Vercel の「Astro on Vercel」は「静的な Astro サイトで Web Analytics などの Vercel の機能を使うには Astro の Vercel adapter を足す必要がある」と書いており、公式の記述が食い違う | 2026-10-09 | https://www.npmjs.com/package/@vercel/analytics https://vercel.com/docs/analytics/quickstart https://vercel.com/docs/frameworks/frontend/astro |
| `satori` | 0.44.3 | 2026-10-09 | https://www.npmjs.com/package/satori |
| `@resvg/resvg-js` | 2.6.2 | 2026-10-09 | https://www.npmjs.com/package/@resvg/resvg-js |
| `@mermaid-js/mermaid-cli` | 12.0.0 | 2026-10-09 | https://www.npmjs.com/package/@mermaid-js/mermaid-cli |
| `vitest` | 5.0.3; `test.projects`: はい(`workspace` は 3.2 で非推奨になり `projects` に置き換わった) | 2026-10-09 | https://www.npmjs.com/package/vitest https://vitest.dev/guide/projects |
| `@fontsource-variable/geist` | 5.3.0 | 2026-10-09 | https://www.npmjs.com/package/@fontsource-variable/geist |
| `@fontsource-variable/jetbrains-mono` | 5.3.0 | 2026-10-09 | https://www.npmjs.com/package/@fontsource-variable/jetbrains-mono |
| `Lucide のブランドアイコン` | 含まない: Lucide 公式は「ブランドのロゴは受け付けず、今後も足す予定はない」と書き、ブランドには Simple Icons を勧めている(GitHub と X は本体にない) | 2026-10-09 | https://lucide.dev/brand-logo-statement |
| `eslint` | 10.12.0; flat config(`eslint.config.js`)に対応している(設定ファイルの説明は flat config だけ) | 2026-10-09 | https://www.npmjs.com/package/eslint https://eslint.org/docs/latest/use/configure/configuration-files |
| `eslint-plugin-astro` | 3.2.1; flat config(`eslint.config.js`)に対応している(公式のユーザーガイドに Flat Config の節がある。ESM のみなので `eslint.config.mjs` か `"type": "module"` が要る) | 2026-10-09 | https://www.npmjs.com/package/eslint-plugin-astro https://ota-meshi.github.io/eslint-plugin-astro/user-guide/ |
| `typescript-eslint` | 8.71.1; flat config(`eslint.config.mjs`)に対応している(公式のクイックスタートが flat config の形)(ESLint の v8.57 以降、v9、v10 を受け付ける) | 2026-10-09 | https://www.npmjs.com/package/typescript-eslint https://typescript-eslint.io/getting-started/ |
| `prettier-plugin-astro` | 1.1.0 | 2026-10-09 | https://www.npmjs.com/package/prettier-plugin-astro |
| `Astro が対応する Node の範囲` | `>=22.12.0`(公式: 「`v22.12.0` or higher. Odd-numbered versions like `v23` are not supported.」); Node 22 系 LTS: 入る(22.12.0 以降の 22 系) | 2026-10-09 | https://docs.astro.build/en/install-and-setup/ https://www.npmjs.com/package/astro |
| `Zenn API` | 公開された仕様は見つからなかった: zenn.dev の FAQ に API の仕様や `/api/articles` の記述はない | 2026-10-09 | https://zenn.dev/faq |
| `GitHub Actions の schedule の停止条件` | public リポジトリでは、リポジトリに 60 日間動き(repository activity)がないと schedule のワークフローが自動で無効になる; 何を「動き」とみなすかは公式のページに定義がない(未確認); 設計の前提との比較: 一致する(ただし公式では public リポジトリに限る) | 2026-10-09 | https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows |
| `Vercel の Framework Preset` | ダッシュボードでプロジェクトを選ぶ → サイドバーの Settings → Build and Deployment → Framework Settings の Framework Preset のドロップダウンで Astro を選んで保存する。選んだ値はプロジェクトのすべてのデプロイに使われる(デプロイ単位で変えるなら `vercel.json` の `framework`) | 2026-10-09 | https://vercel.com/docs/deployments/configure-a-build |
| `Vercel の Preview の Deployment Protection` | 既定で保護がかかるか: 未確認(公式は「新しいプロジェクトの既定はチームの設定(All Deployments / Standard Protection / None)で決まり、プロジェクトごとに上書きできる」と書くだけで、何もしないときの既定は書いていない); Standard Protection は本番のドメイン以外(Preview を含む)を守る; 料金プランの違い: Vercel Authentication、Standard Protection、All Deployments は全プラン(Hobby を含む)で追加料金なし。Password Protection は Hobby で使えず、Pro は 1 プロジェクト月 $20、Enterprise は含む。Trusted IPs と Passport は Enterprise のみ | 2026-10-09 | https://vercel.com/docs/deployment-protection https://vercel.com/docs/deployment-protection/usage-and-pricing https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication |
| `Vercel の静的出力の 404.html` | 未確認: 公式は「Output Directory に 404.html を出すと、どの静的ファイルにも一致しないルートで 404 ページとして返す」と書くが、状態コードが 404 かは書いていない | 2026-10-09 | https://vercel.com/kb/guide/custom-404-page |
| `Noto Sans JP の容量` | Google Fonts(google/fonts の `ofl/notosansjp`)は可変フォントの `NotoSansJP[wght].ttf`(9,589,900 バイト、約 9.6 MB)だけで、Regular と Bold の静的な TTF は配っていない; 公式の GitHub(notofonts/noto-cjk の `Sans/SubsetOTF/JP`)の OTF は Regular が 4,533,028 バイト(約 4.5 MB)、Bold が 4,656,448 バイト(約 4.7 MB)。1 MB = 1,000,000 バイト | 2026-10-09 | https://github.com/notofonts/noto-cjk/tree/main/Sans/SubsetOTF/JP https://github.com/google/fonts/tree/main/ofl/notosansjp https://fonts.google.com/noto/specimen/Noto+Sans+JP |
| `prettier` | 3.9.9 | 2026-10-09 | https://www.npmjs.com/package/prettier |

### 設計との差

- **(a) 設計の前提**: docs/design.md の「`@astrojs/tailwind` 統合。Tailwind v4 系では非推奨だと理解している」 / **(b) 確かめた事実**: `@astrojs/tailwind` は npm で deprecated の印がない。Astro 公式は非推奨とは書かず、「Tailwind 3 との互換のための旧来の方法で、Tailwind 4 には不要」と書いている。Tailwind 4 には `@tailwindcss/vite` を使うという設計の方針はそのままでよい / **(c) 出典**: https://docs.astro.build/en/guides/styling/ https://www.npmjs.com/package/@astrojs/tailwind
- **(a) 設計の前提**: docs/design.md の「Vercel(静的出力のため adapter なし)」と「`@vercel/analytics` の Astro 用コンポーネント(`@vercel/analytics/astro`)」 / **(b) 確かめた事実**: コンポーネントは `import Analytics from '@vercel/analytics/astro'` で提供されている。ただし Vercel の「Astro on Vercel」は「静的な Astro サイトで Web Analytics などの Vercel の機能を使うには Astro の Vercel adapter を足す必要がある」と書いている。Analytics のクイックスタートは adapter なしの手順なので、adapter なしで動くかは未確認 / **(c) 出典**: https://vercel.com/docs/frameworks/frontend/astro https://vercel.com/docs/analytics/quickstart
- **(a) 設計の前提**: docs/design.md の「`src/assets/fonts/` に Noto Sans JP の Regular と Bold の TTF を置き」と「容量(各数 MB と思われる)」 / **(b) 確かめた事実**: Google Fonts は可変フォントの `NotoSansJP[wght].ttf`(約 9.6 MB)だけで、Regular と Bold の静的な TTF はない。公式の GitHub(notofonts/noto-cjk)には Regular(約 4.5 MB)と Bold(約 4.7 MB)の OTF がある。容量は「各数 MB」のとおりだが、形式は TTF でなく OTF になる / **(c) 出典**: https://github.com/google/fonts/tree/main/ofl/notosansjp https://github.com/notofonts/noto-cjk/tree/main/Sans/SubsetOTF/JP
- **(a) 設計の前提**: docs/design.md の「GitHub Actions の schedule の停止条件(リポジトリが60日間動かないと止まる、という扱い)」 / **(b) 確かめた事実**: 60 日は一致するが、公式ではこの自動停止は public リポジトリに限られる。何を「動き」とみなすかは公式に定義がない / **(c) 出典**: https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows
- **(a) 設計の前提**: docs/design.md の「Vercel は静的出力の `404.html` をそのまま 404 で返す(未確認。T-001 で確かめる)」 / **(b) 確かめた事実**: 公式は 404.html を「どの静的ファイルにも一致しないルートで 404 ページとして返す」と書くが、状態コードが 404 かは書いていない(未確認のまま) / **(c) 出典**: https://vercel.com/kb/guide/custom-404-page
