# my-portfolio 詳細設計

## 目的と範囲

**目的**
選考の面接官やテックリードが、30秒で「技術スタック・設計力・課題解決力」をつかめるポートフォリオにする。今の Next.js 版(ネオン調のカード、Welcome アニメーション、実行時の API Route)を捨て、同じリポジトリ `Riku-Takata/my-portfolio` で Astro の静的サイトに入れ替える。

**作るもの**
- トップページ `/`。1カラムで、Hero / About / Featured Projects / Technical Skills / Experience & Education の5セクションに、Q-3 の答えによる Zenn 記事一覧(Articles)を加える。
- プロジェクト詳細ページ `/projects/[slug]/`。MDX で書き、アーキテクチャ図は事前に書き出した SVG を使う。
- ページごとの OGP 画像。ビルド時に PNG を作る。
- `sitemap`、`robots.txt`、canonical、ページごとの title / description。
- Zenn 記事一覧を更新するための定期再ビルド(GitHub Actions の cron から Vercel Deploy Hook を呼ぶ)。
- 検証の仕組み。型の検査、lint、ユニットテスト、ビルド結果の HTML のテスト、公開前チェックのスクリプト。

**公開の条件(Q-2、Q-8)**
作業は `renewal` ブランチで行い、`main`(本番)にはマージしない。次の条件を `npm run check:release` で機械的に確かめてから、開発者がマージする。
- 開発者がプロジェクトの原稿、resume.ts の実データ、`public/resume.pdf` をそろえる。
- 本番のドメインを決める。

**ナレッジの当てはめ**
- J-20261008-001 を当てはめる。ライブラリの版、Zenn API、Vercel の機能は、この設計を書いた時点では公式の情報を確かめていない(npm レジストリと Web を参照できなかった)。下の表で「未確認」と書いた項目は、タスク T-00 で実装前に確かめる。
- J-20261008-002 は当てはめない。このプロダクトは LLM を使わない。

## 構成(使う技術と、選んだ理由。退けた候補)

| 領域 | 採用 | 理由 | 版 |
|---|---|---|---|
| フレームワーク | **Astro**(`output: 'static'`) | Q-1 の答え。標準でクライアント JS を出さない。Content Collections と Zod で frontmatter を検証できる | 最新の安定版。**未確認**(T-00) |
| MDX | `@astrojs/mdx` | プロジェクト詳細を MDX で書くため | **未確認** |
| スタイル | **Tailwind CSS の最新の安定版**。`@tailwindcss/vite` で組み込む | 前提のとおり v3 は引き継がない。v4 系なら設定は CSS の `@theme` に書き、`dark:` は既定で `prefers-color-scheme` に従う(Q-5 の「JS なし」をそのまま満たす) | **未確認**。Astro 公式が v4 で `@tailwindcss/vite` を推していることも確かめる |
| 本文の組版 | `@tailwindcss/typography`(`prose prose-zinc dark:prose-invert`) | MDX の表、リスト、見出しを1つずつ手で整えなくて済む | **未確認** |
| シンタックスハイライト | Astro 内蔵の Shiki。`themes: { light: 'github-light', dark: 'github-dark' }` の2テーマを CSS 変数で切り替える | ビルド時に色を付けるので、配信時に JS が要らない | Astro に同梱 |
| 図 | `.mmd` と、`@mermaid-js/mermaid-cli` で手元で書き出した `.svg` の両方をコミットする | Q-6 の答え。Vercel のビルドで Chromium を動かさない | **未確認** |
| OGP 画像 | `satori` で SVG にし、`@resvg/resvg-js` で PNG にする。静的エンドポイントでビルド時に出力する | Q-7 の答え。実行時の関数が要らない。日本語フォントを同梱できる | **未確認** |
| 欧文フォント | **Geist Sans**(`@fontsource-variable/geist` を自前配信し、preload する) | 前提の候補は Geist と Inter。Inter はテンプレートで見慣れているので Geist にした | **未確認** |
| 和文フォント | **配信しない**。システムフォント(`"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic UI", Meiryo, sans-serif`)に任せる | 和文の Web フォントは数 MB あり、LCP 1.2 秒の目標を壊す | — |
| 等幅フォント | **JetBrains Mono**(`@fontsource-variable/jetbrains-mono`)。preload しない | 前提のとおり。コードと技術タグだけで使う | **未確認** |
| アイコン | `src/components/icons/*.astro` に SVG を直接書く。GitHub と X は Simple Icons(CC0)、ほかは Lucide(ISC)の path を写す | 必要なのは6個ほど。Lucide の本体はブランドアイコンを含まない(**未確認**)。依存を増やさない | — |
| sitemap | `@astrojs/sitemap` | 標準の方法。`site` の設定が必要 | **未確認** |
| 解析 | `@vercel/analytics` の Astro 用コンポーネント(`@vercel/analytics/astro`) | Q-9 の答え。**これがサイトで唯一のクライアント JS になる**。Zero-JS の例外として明記する | 提供の形と、静的出力で動くことは**未確認** |
| ホスティング | Vercel(静的出力のため adapter なし)。`vercel.json` で `trailingSlash: true` | Q-9 の答え | Framework Preset を Astro にする手順は**未確認** |
| テスト | Vitest。プロジェクトを `unit` と `dist` に分ける | Vite 系で Astro と相性がよい | **未確認** |
| 型・lint | `astro check`(`@astrojs/check`)、ESLint(flat config、`eslint-plugin-astro`、`typescript-eslint`)、Prettier(`prettier-plugin-astro`) | `.astro` ファイルの型を検査できる | **未確認** |
| Node | 22 系の LTS(`.nvmrc` と `engines`) | Astro の対応範囲に合わせる | 対応範囲は**未確認** |
| パッケージ管理 | npm。依存をすべて入れ替えるので、`package-lock.json` は作り直す | — | — |

**退けた候補**
- Next.js(App Router と Static Export)を続ける。Q-1 で Astro に決まった。RSC でもランタイムの JS が残る。
- Cloudflare Pages。Q-9 で Vercel を続けると決まった。
- Mermaid をクライアントで描く方法と、ビルド時に変換する方法(`rehype-mermaid` と Playwright)。前者は JS が要る。後者は Vercel のビルドで Chromium が要る。Q-6 の答えのとおり、手元で変換する。
- `@vercel/og`(実行時の Edge Function)。静的出力の方針に合わない。
- `@astrojs/tailwind` 統合。Tailwind v4 系では非推奨だと理解している(**未確認**。T-00 で確かめる)。
- 和文の Web フォント(Noto Sans JP の配信)。LCP の目標のため。
- `lucide-react`、`react-icons`。React を入れることになる。
- Zenn の記事を実行時に取得する方法(今の `app/api/articles`)。Q-3 の答えのとおり、ビルド時に取る。

## ディレクトリとモジュール

```text
.
├── astro.config.mjs            # site, trailingSlash:'always', build.format:'directory', mdx, sitemap, shiki 2テーマ, vite.plugins:[tailwindcss()]
├── vercel.json                 # { "trailingSlash": true }
├── package.json / package-lock.json
├── tsconfig.json               # astro/tsconfigs/strict を継承
├── eslint.config.js / .prettierrc
├── vitest.config.ts            # projects: unit (tests/unit), dist (tests/dist)
├── mermaid.config.json         # theme:'neutral', flowchart.htmlLabels:false, fontFamily: system sans
├── .nvmrc
├── .github/workflows/
│   ├── ci.yml                  # push / PR: check → lint → format:check → test → build → test:dist
│   └── rebuild.yml             # cron 毎日 18:00 UTC (03:00 JST) + workflow_dispatch → Deploy Hook を POST
├── scripts/
│   ├── build-diagrams.mjs      # src/assets/diagrams/*.mmd → *.svg (先頭に <!-- source-sha256: … --> を入れる)
│   └── check-release.mjs       # 公開前のチェック(後述)
├── public/
│   ├── favicon.png             # 今の app/icon.png を移す
│   └── resume.pdf              # 開発者が用意(住所・電話番号を除いた公開用)
├── docs/
│   └── project-template.mdx    # 原稿の雛形(素案4章の見出し + frontmatter の例)
├── tests/
│   ├── unit/                   # schemas, projects, zenn, format, diagrams, source-rules
│   └── dist/                   # ビルド結果の HTML・PNG・XML を読むテスト
└── src/
    ├── content.config.ts       # projects コレクション (glob loader: src/content/projects/*.mdx)
    ├── content/
    │   ├── projects/
    │   │   ├── satellite-insar.mdx
    │   │   └── rag-knowledge-base.mdx
    │   └── resume.ts           # プロフィール・About・スキル・経歴 (型付き)
    ├── assets/
    │   ├── diagrams/           # <slug>-architecture.mmd / .svg
    │   ├── projects/<slug>/    # デモ画像・GIF (astro:assets で読む)
    │   └── fonts/              # OGP 用 NotoSansJP-Regular.ttf, NotoSansJP-Bold.ttf, OFL.txt
    ├── components/
    │   ├── common/             # Header, Footer, Container, Section
    │   ├── sections/           # Hero, About, ProjectsList, Skills, Experience, Articles
    │   ├── ui/                 # Badge, LinkButton, ProjectCard
    │   ├── mdx/                # Figure (図・画像 + キャプション)
    │   └── icons/              # Github, X, Mail, FileText, ArrowRight, ExternalLink
    ├── layouts/
    │   ├── BaseLayout.astro    # <head> 一式 (meta, OGP, canonical, フォント preload, Analytics)
    │   └── ProjectLayout.astro # 詳細ページの枠 (Header, 見出しブロック, prose, 戻るリンク)
    ├── lib/
    │   ├── site.ts             # SITE_URL, SITE_NAME, ZENN_USERNAME などの定数
    │   ├── schemas.ts          # Zod スキーマ (projectSchema, zennResponseSchema)。'astro/zod' から z を import
    │   ├── projects.ts         # selectFeatured(), sortProjects() (純粋関数)
    │   ├── zenn.ts             # fetchLatestArticles() (ビルド時に実行、失敗しても例外を投げない)
    │   ├── format.ts           # formatPeriod(), formatYearMonth(), formatDate()
    │   └── og.ts               # renderOgPng({ title, summary }) → Buffer
    ├── pages/
    │   ├── index.astro
    │   ├── projects/[slug].astro
    │   ├── og/[slug].png.ts    # getStaticPaths: 'index' + 各プロジェクトの slug
    │   └── robots.txt.ts
    └── styles/global.css       # @import "tailwindcss"; @plugin typography; @theme (フォント); Shiki のダークモード切り替え
```

**モジュールの境界**
- `lib/*.ts` は Astro のランタイム(`astro:content` など)に依存しない純粋な TypeScript にし、`tests/unit` から直接 import できるようにする。`content.config.ts` は `lib/schemas.ts` の `projectSchema` を使う。
- `components/sections/*` はデータを props で受け取る。`content/` を直接 import するのは `pages/` だけにする。

## データとコンテンツ(形式、置き場所、検証)

### プロジェクト(`src/content/projects/<slug>.mdx`)

slug はファイル名から決まる。`^[a-z0-9]+(-[a-z0-9]+)*$` に合わない名前と `index` は禁止する(OGP の `og/index.png` とぶつかるため)。

frontmatter は `lib/schemas.ts` の `projectSchema`(Zod)で検証する。違反があれば `astro build` が失敗する。

| キー | 型・制約 | 用途 |
|---|---|---|
| `title` | string、1〜60文字 | h1、カード、title、OGP |
| `period` | `{ start: 'YYYY-MM', end: 'YYYY-MM' \| 'present' }`。`end >= start` | カードの「(2025 – 2026)」 |
| `summary` | string、1〜100文字、改行なし | 概要1行、meta description、OGP |
| `tech` | string[]、1〜8個、重複なし | 技術バッジ |
| `outcomes` | string[]、1〜3個、各60文字以内 | 成果と工夫 |
| `links` | `{ demo?: url, github?: url }`(https のみ) | Live Demo、GitHub Code のボタン |
| `featured` | boolean | トップに載せるか |
| `order` | 1 以上の整数 | 並び順(昇順) |

**コレクションをまたぐ制約**
`lib/projects.ts` の `selectFeatured()` で確かめ、違反なら throw してビルドを失敗させる。
- featured は 3件以下。
- featured どうしで `order` が重ならない。

**本文の書き方**
- 素案4章の見出し構成を雛形にする(`docs/project-template.mdx`)。`## 1. 概要 & 解決したい課題 (Why)`、`## 2. システムアーキテクチャ`、`## 3. 技術選定とトレードオフ`(GFM の表)、`## 4. 技術的な課題と解決プロセス`。
- **本文に `# ` 見出しは書かない**。h1 は frontmatter の `title` から出す。素案4章の雛形にある `# [プロジェクト名]` は、ここで取り除く。
- 図と画像は、本文の中で `import arch from '../../assets/diagrams/<slug>-architecture.svg'` と書き、`<Figure src={arch} alt="…" caption="…" />` で置く。Figure の `alt` は必須で、構成を文で説明する。

**原稿がそろうまで**
実装担当は2件の仮原稿を置く。frontmatter は有効な値にし、本文と frontmatter の要所に `TODO(content)` を入れる。開発者が本文を書き換える。

### プロフィール・経歴(`src/content/resume.ts`)

型は同じファイルで export し、データは `export const resume = { … } satisfies Resume` と書く。

```ts
type Resume = {
  profile: {
    nameJa: string; nameEn: string;
    affiliation: string;            // 所属・専攻
    focus: string[];                // コア領域 (例: Backend, CS)
    summary: string;                // トップの meta description と OGP の概要 (120文字以内)
    links: { github: string; x: string; email: string; resumePdf: '/resume.pdf' };
  };
  about: string[];                  // 段落。1〜4個
  skills: { category: string; items: string[] }[];  // items は使用実績の順に並べる。星評価や数値は持たない
  experience: {
    kind: 'education' | 'internship' | 'presentation' | 'work';
    title: string; org: string;
    start: 'YYYY-MM' 形式の string; end?: string | 'present';
    note?: string;
  }[];
};
```

- 初期値には、今のコードにある公開済みの値を入れる。
  - 氏名: 高田 莉玖 / Riku Takata
  - GitHub: `https://github.com/Riku-Takata`
  - X: `https://x.com/tk1_chestnut`(開発者に確かめた値。旧コードの `tk1_zansin` と `riku_takata` はどちらも使わない)
  - Email: `RikuChestnut66@gmail.com`
- それ以外(About、スキル、経歴)は `TODO(content)` 付きの仮の値にする。今の About の文章(「2025年現在22歳」などの古い記述を含む)は、開発者の下書きとしてコメントに残してよい。
- 経歴は、表示するときに `start` の降順で並べる(`lib/format.ts` か `lib/projects.ts` の純粋関数にしてテストする)。

### Zenn 記事(ビルド時に取得)

- `lib/zenn.ts` の `fetchLatestArticles(username = 'riku_takata', count = 5)` を使う。
- 取得先は `https://zenn.dev/api/articles?username=riku_takata&order=latest&count=5`(今の route.ts と同じ)。この API は**公式に公開された仕様かどうか未確認**(T-00)。
- レスポンスは `zennResponseSchema` で検証する。使う値は `articles[].title`、`slug`、`published_at`、`user.username` だけ。URL は `https://zenn.dev/${username}/articles/${slug}` で組み立てる。
- タイムアウトは10秒(`AbortSignal.timeout`)。
- **失敗しても(通信エラー、HTTP エラー、スキーマ違反)ビルドを止めない。** `console.warn` を出して空の配列を返す。空のときは一覧を出さず、「Zenn の記事一覧 →」のリンクだけを出す。
- 理由: Zenn が落ちているときにプロジェクトの更新までデプロイできなくなるのを避ける。

### 図(`src/assets/diagrams/`)

- `<slug>-architecture.mmd` が元になる。`npm run diagrams` で、`mermaid.config.json` を使って `.svg` を書き出す。
- 書き出した SVG の先頭に `<!-- source-sha256: <.mmd の SHA-256> -->` を入れる。
- 古い SVG が残っていないかは、ユニットテストでこのハッシュを比べて確かめる。

### OGP 用のフォント

- `src/assets/fonts/` に Noto Sans JP の Regular と Bold の TTF を置き、ライセンスの `OFL.txt` も一緒に置く。
- ビルド時に読むだけで、配信はしない。容量(各数 MB と思われる)は**未確認**。

## 画面・機能(素案の各項目を、実装できる単位に)

### 共通のデザイン規律(すべての画面)

- **色**
  - 背景: `bg-zinc-50` / `dark:bg-zinc-950`
  - 本文: `text-zinc-800` / `dark:text-zinc-200`
  - サブの文字: `text-zinc-500` / `dark:text-zinc-400`
  - 境界線: `border-zinc-200` / `dark:border-zinc-800`
  - アクセント: リンクとフォーカスだけに indigo を使う。`text-indigo-600` / `dark:text-indigo-400`、`focus-visible:outline-indigo-500`
  - **zinc と indigo 以外の色と、グラデーションは使わない。**
- **ダークモード**: OS の設定に従うだけ。`<meta name="color-scheme" content="light dark">` を入れ、切り替えボタンは作らない。
- **幅**: `Container` = `mx-auto max-w-2xl px-4 sm:px-6`。
- **文字の階層**

  | 要素 | クラス |
  |---|---|
  | h1(氏名、プロジェクト名) | `text-3xl font-semibold tracking-tight` |
  | h2(セクションのラベル。英語) | `text-lg font-semibold` |
  | h3(カードの題) | `text-base font-semibold` |
  | 本文 | `text-base leading-7` |
  | 補足 | `text-sm text-zinc-500` |
  | 技術タグとコード | `font-mono text-xs` |

- **動き**: 使ってよいのは `transition-colors duration-150` だけ(ホバーで背景色や文字色が変わる程度)。`animate-*`、`transform`、`rotate`、`scale`、`backdrop-blur`、スムーズスクロールは使わない。
- **フォント**: `global.css` の `@theme` で次のように決める。
  - `--font-sans: "Geist Variable", <和文システムフォント>, sans-serif`
  - `--font-mono: "JetBrains Mono Variable", ui-monospace, monospace`
  - Geist の woff2(latin)は `<link rel="preload" as="font" crossorigin>` で読み込む。

### F-01 BaseLayout(`layouts/BaseLayout.astro`)

- props: `title`, `description`, `ogImage`(`/og/<id>.png`), `type`('website' | 'article')
- 出力する要素:
  - `<html lang="ja">`
  - `<title>`、`meta description`
  - `link rel="canonical"`(`Astro.site` を元にした絶対 URL で、末尾は `/`)
  - `og:title` / `og:description` / `og:image`(絶対 URL)/ `og:url` / `og:type` / `og:locale=ja_JP`
  - `twitter:card=summary_large_image`
  - favicon、`color-scheme`、フォントの preload
  - `<Analytics />`(Vercel)
- title の形式
  - トップ: `高田 莉玖 (Riku Takata) | Portfolio`
  - 詳細: `<project.title> | Riku Takata`

### F-02 Hero(`sections/Hero.astro`)、`#top`

- h1: `nameJa`。その横か下に `nameEn` を補足の文字で出す。
- `affiliation` を1行出す。`focus` を `·` でつないで1行出す。
- リンクを横に並べる(アイコン + テキスト。アイコンは `aria-hidden`)。
  - GitHub / X / Mail(`mailto:`)/ Resume (PDF)(`/resume.pdf`)
  - 外部リンクには `target="_blank" rel="noopener noreferrer"` を付ける。
- 写真と画像は置かない。

### F-03 About(`sections/About.astro`)、`#about`

- h2 は「About」。`resume.about` を段落にして出す(1〜4段落)。

### F-04 Featured Projects(`sections/ProjectsList.astro` + `ui/ProjectCard.astro`)、`#projects`

- h2 は「Featured Projects」。`selectFeatured()` の結果を `order` 順に出す。
- カードは `<article>` にし、`border` と `rounded-lg` で囲む。影は付けない。中身は次のとおり。
  1. h3 にプロジェクト名、補足に期間(`formatPeriod`: `2025 – 2026`、進行中なら `2025 – Present`)
  2. 概要(`summary`)
  3. 技術(`tech` を `Badge` で並べる)
  4. 成果と工夫(`outcomes` の箇条書き)
  5. リンク: `[Live Demo]`(`links.demo` があるとき)、`[GitHub Code]`(`links.github` があるとき)、`[技術解説を読む →]`(`/projects/<slug>/`)
- カード全体を1つのリンクにはしない(リンクが入れ子になるのを避ける)。

### F-05 Technical Skills(`sections/Skills.astro`)、`#skills`

- h2 は「Technical Skills」。
- `<dl>` を使い、`dt` にカテゴリ、`dd` に `items` を書いた順に `Badge`(等幅)で並べる。
- 星、%、バーなどの評価の表示は一切しない。

### F-06 Experience & Education(`sections/Experience.astro`)、`#experience`

- h2 は「Experience & Education」。
- `<ol>` のタイムラインにし、`start` の降順で並べる。
- 各行の中身: 期間(`<time datetime="YYYY-MM">`、表示は `2024.04 – 2026.03`)、種別のラベル(Education / Internship / Presentation / Work)、`title`、`org`、`note`。
- 左に縦線を引く程度の装飾にとどめる(`border-l`)。

### F-07 Articles(`sections/Articles.astro`)、`#articles`

- Q-3 の答えで追加するセクション。トップの最後(Experience の後)に置く。
- h2 は「Articles」。ビルド時に取った最新5件を、日付(`YYYY.MM.DD`)とタイトル(外部リンク)のテキストだけで並べる。サムネイルといいね数は出さない。
- 末尾に「Zenn の記事一覧 →」(`https://zenn.dev/riku_takata`)を置く。取得に失敗したときは、このリンクだけを出す。

### F-08 Footer / Header(`common/`)

- Footer: `© <ビルドした年> Riku Takata` だけにする。今の Footer にある `/privacy-policy` と `/terms-of-service` は存在しないページへのリンクなので消す。
- Header: 詳細ページにだけ出す。左に `Riku Takata` を置き、`/` へリンクする。トップでは Hero が Header を兼ねる。

### F-09 プロジェクト詳細ページ(`pages/projects/[slug].astro` + `ProjectLayout.astro`)

- `getStaticPaths` で、コレクションの全件(featured でないものも含む)のページを作る。
- 見出しのブロック: h1 にタイトル、期間、`summary`、技術バッジ、リンク(Live Demo / GitHub Code)。
- 本文: MDX を `prose prose-zinc dark:prose-invert max-w-none` で包む。
  - 表は横にはみ出すとき、表だけを横スクロールにする(ページ全体は横にスクロールさせない)。
  - コードブロックは Shiki の2テーマで、色の切り替えは CSS だけで行う。
- 末尾に `← Featured Projects へ戻る`(`/#projects`)を置く。

### F-10 Figure(`components/mdx/Figure.astro`)

- props: `src`(`ImageMetadata`)、`alt`(必須)、`caption?`
- `astro:assets` の `<Image>` で出し、`width` と `height` を付けて CLS を防ぐ。
- 図の SVG は、ダークモードでも読めるように `bg-white rounded-md border p-4` の明るい板の上に置く。
- `<figcaption>` は補足の文字で出す。

### F-11 OGP 画像(`pages/og/[slug].png.ts` + `lib/og.ts`)

- 1200×630 の PNG。`index`(トップ)と、各プロジェクトの slug の分を作る。
- レイアウト
  - 背景は zinc-50、左上の余白は 80px。
  - タイトルは Bold 64px、zinc-900。2行を超えたら省略する。
  - 概要は Regular 32px、zinc-500。最大3行。
  - 左下に `Riku Takata`、下端に indigo-600 の細い帯(8px)。
- satori には JSX を使わず、要素のオブジェクトを渡す(React を入れない)。

### F-12 SEO の付属物

- `@astrojs/sitemap` で `sitemap-index.xml` を出す。
- `pages/robots.txt.ts`: `User-agent: *` / `Allow: /` / `Sitemap: <SITE_URL>/sitemap-index.xml`
- `astro.config.mjs` の `site`
  - `lib/site.ts` の `SITE_URL` と同じ値にする。
  - **本番のドメインはまだ決まっていない**。開発者が決める。それまでは `https://my-portfolio-riku-takata.vercel.app` のような仮の値に `TODO(content)` を付ける。

### F-13 定期再ビルド(`.github/workflows/rebuild.yml`)

- `on: schedule: cron '0 18 * * *'`(毎日 03:00 JST)と `workflow_dispatch` で動かす。
- ステップは `curl -fsS -X POST "$VERCEL_DEPLOY_HOOK_URL"` だけ。secret が空なら、エラーのメッセージを出して失敗させる。
- 開発者が手でやること
  - Vercel で `main` ブランチ向けの Deploy Hook を作る。
  - GitHub の secret `VERCEL_DEPLOY_HOOK_URL` に登録する。

### F-14 図の書き出し(`scripts/build-diagrams.mjs`、`npm run diagrams`)

- `src/assets/diagrams/*.mmd` をすべて、mermaid-cli で `.svg` に書き出し、先頭に source-sha256 のコメントを入れる。
- `@mermaid-js/mermaid-cli` は devDependency に入れるが、Vercel のビルドでは呼ばない(`build` スクリプトに含めない)。

### F-15 404 ページ(`src/pages/404.astro`)

- BaseLayout を使い、h1 に「ページが見つかりません」、本文にトップへのリンク(`/`)だけを置く。
- `dist/404.html` ができる。Vercel は静的出力の `404.html` をそのまま 404 で返す(未確認。T-001 で確かめる)。

### F-16 構造化データ(JSON-LD)

- トップに `Person`(name、alternateName、url、sameAs に GitHub と X、affiliation)を、詳細ページに `CreativeWork`(name、description、author、dateCreated)を、`<script type="application/ld+json">` で出す。
- これは実行される JS ではないので、Zero-JS の検査(ビルド結果のテストの「JS」)では `type="application/ld+json"` を例外にする。
- 値は `resume.ts` と各プロジェクトの frontmatter から作り、手で二重に書かない。

## 既存のコードからの移行(既存のリポジトリがあるとき)

今のリポジトリは Next.js 16、React 19、Tailwind v3、shadcn/ui、framer-motion で、テストはない。トップは `"use client"` の1ページで、Welcome の演出があり、Zenn 記事は実行時に `/api/articles` から取っている。

**消すもの(git の履歴には残る)**

| パス | 理由 |
|---|---|
| `app/` 一式(`layout.tsx`, `page.tsx`, `globals.css`, `components/*`, `components/welcome/*`, `api/articles/route.ts`) | Next.js 版の本体。Welcome / DeskAnimation / Loader / Works のネオンカード / 3D の Zenn カルーセルは、前提のとおり捨てる |
| `components/ui/*`, `components.json`, `hooks/use-toast.ts`, `lib/utils.ts` | shadcn/ui 一式 |
| `styles/*.module.css` | DeskAnimation と Loader 用 |
| `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `tsconfig.json` | Astro 用に作り直す |
| `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Next.js の雛形の残り |
| `public/naptop.jpg` | 写真は載せない |
| `package.json` の依存のすべて | 作り直す(framer-motion, radix, shadcn-ui, react-icons, recharts, react-typed, react-syntax-highlighter, sass, stylus, stylelint 系, 誤って入ったと思われる `add` と `tabs` など)。`package-lock.json` は作り直す |

**残すもの・移すもの**

| 元 | 先 |
|---|---|
| `app/icon.png` | `public/favicon.png`(容量が大きければ 512px 以下に縮める) |
| Contact.tsx の GitHub、X、Email の値 | `resume.ts` の `profile.links` |
| Hero.tsx の氏名と所属 | `resume.ts` の `profile` |
| About.tsx の文章 | `resume.ts` に下書きのコメントとして残す(開発者が書き直す) |
| route.ts の Zenn のユーザー名と URL の組み立て方 | `lib/site.ts`、`lib/zenn.ts` |
| Vercel Analytics | Astro 用のコンポーネントで続ける |
| `.gitignore` | `/.next/`、`next-env.d.ts` を消し、`/dist/`、`/.astro/` を足す。`/materials`、`.env*`、`.vercel` は残す |
| `README.md` | 新しい構成、npm scripts、原稿の書き方、図の書き出し、公開の手順に書き換える。古い説明(Welcome、GitHub API のチャートなど)は消す |

**進め方**
1. `renewal` ブランチを作る。最初のコミット(T-01)で旧コードを消し、Astro の骨組みを入れる。
2. Vercel の Preview デプロイで確かめる。Preview に保護(Deployment Protection)がかかっているかは**未確認**。
3. 公開の条件がそろったら、開発者が次の作業を手で行う。
   - Vercel の Project Settings で Framework Preset を Next.js から Astro に変え、Build Command を `npm run build`、Output Directory を `dist` にする。
   - そのうえで `main` にマージする。
- 消える URL は `/api/articles` だけ。旧サイトのアンカー(`#works`、`#contact`、`#blog`)を外から張っているリンクは、トップに着地するので、リダイレクトは要らない。

## 検証の方針(Stage 0、受け入れテストで確かめること、人間が見ること)

### npm scripts

| script | 中身 |
|---|---|
| `check` | `astro check` |
| `lint` | `eslint .` |
| `format:check` | `prettier --check .` |
| `test` | `vitest run --project unit` |
| `build` | `astro build` |
| `test:dist` | `vitest run --project dist`(`build` の後に流す) |
| `diagrams` | `node scripts/build-diagrams.mjs` |
| `check:release` | `node scripts/check-release.mjs` |
| `verify` | `check` → `lint` → `format:check` → `test` → `build` → `test:dist` を順に流す |

### Stage 0(最初のタスクで通す状態)

- **T-00**: 下の項目を公式ドキュメントと npm で確かめ、確かめた版と出典を `README.md` の「依存の確認記録」に書く。確かめられなかったものは「未確認」と書く(J-20261008-001)。
  - Astro、`@astrojs/mdx`、`@astrojs/sitemap`、`@astrojs/check`
  - Tailwind CSS と、Astro での推奨の組み込み方
  - `@tailwindcss/typography`
  - `@vercel/analytics` の Astro 用コンポーネントと、静的出力での動作
  - satori、`@resvg/resvg-js`、mermaid-cli、Vitest、Node の対応範囲
  - Zenn API の仕様が公開されているかどうか
  - GitHub Actions の schedule の停止条件(リポジトリが60日間動かないと止まる、という扱い)
- **T-01**: 旧コードを消し、Astro の骨組みを入れる。中身は BaseLayout、空の `index.astro`、Tailwind、ESLint、Prettier、Vitest、`ci.yml`。
  - 受け入れの条件: `npm ci && npm run verify` が通る。CI も緑になる。
  - `tests/dist` には最小のテストを1本置く(`dist/index.html` があり、`lang="ja"` になっている)。

### ユニットテスト(`tests/unit`)

- `schemas.test.ts`
  - 正しい frontmatter が通る。
  - 次のそれぞれで失敗する: 必須項目の欠落、`summary` が101文字以上、`period` の形式違いや `end < start`、`tech` が空や重複、`http:` の URL。
- `projects.test.ts`
  - `selectFeatured` が `order` 順に並べる。
  - featured が4件以上、または `order` が重なると throw する。
  - featured でないものは除く。
- `zenn.test.ts`(`fetch` はモック)
  - 正常なときは5件を返し、URL を正しく組み立てる。
  - HTTP 500、タイムアウト、スキーマ違反のときは空の配列を返し、`console.warn` を1回出す。
- `format.test.ts`
  - `formatPeriod` が `present` と、年が同じ場合(`2025`)を正しく扱う。
  - 経歴が降順に並ぶ。
- `diagrams.test.ts`
  - すべての `.mmd` に同じ名前の `.svg` がある。
  - SVG の `source-sha256` が、今の `.mmd` と合う。
- `content.test.ts`
  - すべての MDX の本文に、行の先頭が `# ` の見出しがない。
  - slug が規則に合い、`index` を使っていない。
- `source-rules.test.ts`(デザイン規律を機械で確かめる)
  - `src/**/*.{astro,ts,css}` に次の文字列が出てこない(MDX の本文は技術解説の英文を含み誤検知するので対象にしない)。
    - `animate-`
    - `transition-` のうち `transition-colors` 以外
    - `duration-` のうち `duration-150` 以外
    - `bg-gradient` / `bg-linear` / `from-` / `via-` / `to-`(グラデーション)
    - zinc と indigo 以外の Tailwind の色名(`(bg|text|border|ring|outline|fill|stroke)-(red|orange|amber|…)-\d`)
    - `rounded-full`(アイコンの丸ボタンの再発を防ぐ)
  - `src/` に `.tsx`、`.jsx`、`client:` ディレクティブがない(Zero-JS)。

### ビルド結果のテスト(`tests/dist`、`dist/` を読む)

- **ページ**
  - `dist/index.html` と、各 slug の `dist/projects/<slug>/index.html` がある。
  - トップに `#about`、`#projects`、`#skills`、`#experience`、`#articles` がある。
  - featured の件数分、`<article>` がある。
- **全 HTML のメタ情報**
  - `<html lang="ja">`、`<h1>` がちょうど1つ、`<title>` は空でなく全ページで重ならない、`meta description` は空でない。
  - `canonical` は `SITE_URL` で始まる絶対 URL で、末尾が `/`。
  - `og:image` は絶対 URL で、指す PNG が `dist/` にある。
  - `twitter:card=summary_large_image` がある。
- **JS**
  - `<script>` は Vercel Analytics の1つ(src が `/_vercel/insights/` で始まるもの、またはそのコンポーネントが出す inline の初期化コード)だけ。
  - それ以外の `<script>` があれば失敗にする。`dist/_astro/*.js` は、Vercel Analytics のコンポーネントが出すもの(中身に `/_vercel/insights` を含むもの)だけを許し、それ以外があれば失敗にする。
- **画像とリンク**
  - すべての `<img>` に `alt`、`width`、`height` がある。
  - `target="_blank"` のリンクには `rel` に `noopener` が入っている。
  - `/privacy-policy` へのリンクがない。
- **OGP**
  - `dist/og/index.png` と `dist/og/<slug>.png` がある。
  - PNG のヘッダーを読んで、1200×630 であることを確かめる。
- **SEO**
  - `sitemap-index.xml` があり、参照先の sitemap に全ページの URL が入っていて、`/og/` が入っていない。
  - `robots.txt` に `Sitemap:` の行がある。
- **詳細ページ**
  - Shiki が出したコードブロック(`pre.shiki` やその仲間)に、2テーマ用の CSS 変数が入っている。
  - 本文に `<table>` と Figure の `<img>` がある(仮原稿に1つずつ入れておく)。

### 公開前のチェック(`npm run check:release`、`main` にマージする前に開発者が流す)

**失敗にするもの**
- `public/resume.pdf` がない、または0バイト。
- `src/` と `astro.config.mjs` に `TODO(content)` が残っている(仮原稿、仮の resume、仮の `SITE_URL`)。
- featured のプロジェクトが2件未満。
- `diagrams.test.ts` と同じ鮮度のチェックに落ちる。

**警告だけ出すもの**
- MDX に、素案4章の4つの h2(「概要」「アーキテクチャ」「技術選定」「課題」を含む見出し)のどれかがない。前提の「基本にする」に合わせ、失敗にはしない。

### 人間が見ること(公開前に開発者が判断する)

- **見た目**
  - ライトとダーク(OS の設定を切り替える)の両方で、色、余白、文字の階層が「引き算のミニマル」になっているか。
  - スマホの幅(375px)とデスクトップの幅の両方で確かめる。
- **図**
  - Mermaid の SVG が、明るい板の上で読めるか。日本語のラベルが崩れていないか(`htmlLabels:false` で日本語が詰まらないか)。
- **OGP**
  - 生成された PNG の文字の折り返しと省略。
  - X か Facebook のシェアのデバッガーで、実際に表示されるか。
- **原稿**
  - 30秒で Why・技術選定・成果が伝わるか。
  - resume.pdf に住所や電話番号が入っていないか。
- **Lighthouse / PageSpeed Insights**
  - Vercel の Preview か本番の URL で手動で測る。ローカルの preview では Analytics のスクリプトが 404 になり、Best Practices が下がるので測らない。
  - 目標は Performance 95以上、Accessibility / Best Practices / SEO は100、CLS 0、LCP 1.2秒未満。
  - FID はすでに INP に置き換わっていて、ラボの計測では TBT で代わりに見る。
  - LCP 1.2秒は、モバイル(Slow 4G のシミュレーション)では静的ページでも届かないことがある。判定にデスクトップとモバイルのどちらを使うかは、開発者が決める(「提案」を参照)。
  - CLS が0にならなければ、Geist の `font-display` を `swap` から `optional` に変えることを検討する。

## 範囲外

- お問い合わせフォーム(連絡は Hero の mailto、GitHub、X で受ける)
- 英語版、多言語化
- ダークモードの手動の切り替えボタン
- ページ遷移のアニメーション、スクロール連動の演出、プロフィール写真
- GitHub API からのリポジトリやコントリビューションの自動取得(旧 README にある機能)
- Lighthouse CI の GitHub Actions への組み込み(前提のとおり、最初の範囲には入れない)
- Qiita へのリンク(旧 Hero にはあったが、新しい Hero の仕様は GitHub、X、Mail、Resume の4つ)
- Zenn 以外のブログの取り込み、記事のサムネイルやいいね数の表示
- Cloudflare Pages への移行
- 3件目のプロジェクトの原稿(開発者が必要と判断したときに MDX を足すだけで、コードの変更は要らない)

## 提案(素案にはないが、検討するとよいこと)

1. **X のアカウント**:開発者に確かめ、`https://x.com/tk1_chestnut` に決まった(解決済み)。
2. **LCP 1.2秒の判定条件を決める。** デスクトップの PSI で判定し、モバイルは「Performance 95以上」だけを見る、という分け方を勧める。
3. **404 ページ(`src/pages/404.astro`)を作る。** トップへのリンクだけの最小のもの。今は Vercel 既定の 404 になる。(採用:F-15)
4. **構造化データ(JSON-LD の `Person` と `CreativeWork`)を入れる。** 検索結果に氏名や所属が出やすくなる。SEO の点数には影響しない。(採用:F-16)
5. **図をライト用とダーク用の2枚書き出す。** `<picture>` と `prefers-color-scheme` で切り替えれば、今の「明るい板に置く」方式より、ダークモードでなじむ。
6. **Lighthouse CI を後から足す。** 公開した後に、品質が下がったら気づけるようにするため。
7. **resume.pdf のメタデータ(作成者、ソフト名、パス)を消してから置く。**(採用:公開前のチェックで確かめる)
8. **Zenn の取得が3日続けて失敗したら、GitHub Actions で通知する。** 今の設計では、取得に失敗しても気づきにくい。
9. **GitHub Actions の schedule の停止条件(リポジトリが一定期間動かないと止まる)が本当なら、対策を考える。** たとえば `rebuild.yml` の実行状態を、たまに手で確かめる。
