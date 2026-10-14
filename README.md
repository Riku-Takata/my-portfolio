# ポートフォリオサイト

## 概要

Astro(`output: 'static'`)で作る静的サイトです。クライアントの JavaScript は出しません(Zero-JS)。例外は Vercel Analytics(`@vercel/analytics/astro`)だけです。JSON-LD は実行されないので例外に数えません。Zenn の記事はビルドのときに取得します。

## 技術スタック

- Astro、MDX(Content Collections + Zod)
- Tailwind CSS v4(`@tailwindcss/vite`)と `@tailwindcss/typography`
- Shiki(2テーマ)
- satori と `@resvg/resvg-js`(OGP 画像)
- Vitest、ESLint、Prettier
- Vercel
- Node は `.nvmrc` の 22 系(`engines` は `>=22.12.0 <23`)

## ディレクトリ構成

| パス                                                        | 内容                                 |
| ----------------------------------------------------------- | ------------------------------------ |
| `src/content/projects/*.mdx`                                | プロジェクト原稿                     |
| `src/content/resume.ts`                                     | プロフィールと経歴                   |
| `src/assets/diagrams/`                                      | 図(`.mmd` と書き出した `.svg`)       |
| `src/assets/fonts/`                                         | OGP 用フォント                       |
| `src/components/`、`src/layouts/`、`src/lib/`、`src/pages/` | 画面と処理                           |
| `scripts/`                                                  | 図の書き出し、公開前の検査           |
| `docs/project-template.mdx`                                 | 原稿の雛形                           |
| `tests/unit`、`tests/dist`                                  | 単体テスト、ビルド成果物のテスト     |
| `.github/workflows/ci.yml`、`rebuild.yml`                   | CI、定期再ビルド                     |
| `public/resume.pdf`                                         | 公開用の職務経歴書(開発者が用意する) |

## 開発の始め方

```sh
npm ci
npm run dev
```

ビルド結果の確認は `npm run preview` です。

## npm scripts

| コマンド                | 内容                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `npm run dev`           | 開発サーバーを起動する                                                |
| `npm run check`         | `astro check` で型を検査する                                          |
| `npm run lint`          | ESLint を流す                                                         |
| `npm run format:check`  | Prettier の整形を検査する                                             |
| `npm test`              | `tests/unit` の単体テストを流す                                       |
| `npm run build`         | 静的サイトを `dist` に書き出す                                        |
| `npm run test:dist`     | `dist` を検査する。`build` の後に流す                                 |
| `npm run diagrams`      | `.mmd` から `.svg` を書き出す                                         |
| `npm run check:release` | 公開前の検査(`TODO(content)` の残り、resume.pdf、featured、図の鮮度) |
| `npm run verify`        | check → lint → format:check → test → build → test:dist を順に流す     |

## プロジェクト原稿の書き方

`docs/project-template.mdx` を `src/content/projects/<slug>.mdx` に写して書きます。

- slug は `^[a-z0-9]+(-[a-z0-9]+)*$` に合わせます。`index` は使えません。
- title は 1〜60 文字、period は `YYYY-MM`(end は `present` でもよい)、summary は 1〜100 文字で改行なし、tech は 1〜8 個で重複なし、outcomes は 1〜3 件で各 60 文字以内、links の demo と github は https、order は 1 以上の整数です。違反すると `npm run build` が失敗します。
- featured は全体で3件以下にし、featured どうしで order を重ねないでください。
- 本文に `# ` の見出しを書かないでください(h1 は title から出ます)。章立ては雛形の4章(`## 1.`〜`## 4.`)を基本にします。
- `TODO(content)` は実際の内容に書き換えます。

図は Figure で入れます。alt は必須で、図の構成を文で説明してください。

```mdx
import Figure from '../../components/mdx/Figure.astro'
import arch from '../../assets/diagrams/<slug>-architecture.svg'

<Figure src={arch} alt="…" caption="…" />
```

## プロフィールと経歴(resume.ts)

`src/content/resume.ts` の `resume`(`satisfies Resume`)を書き換えます。

- profile.summary は 120 文字以内、about は 1〜4 段落です。
- skills は使った実績の順に並べます(星や数値は持ちません)。
- experience の start は `YYYY-MM`、end は `YYYY-MM` か `present` です。表示のときに start の新しい順に並びます。
- `public/resume.pdf` は、住所と電話番号を除いた公開用を置きます。

## 図の書き出し

1. `src/assets/diagrams/<slug>-architecture.mmd` を直す。
2. `npm run diagrams` で `.svg` を書き出す(先頭に `<!-- source-sha256: … -->` が入る)。
3. `.mmd` と `.svg` の両方をコミットする。

`.svg` が古いと `npm test` が失敗します。Vercel のビルドでは書き出しません(Chromium を動かさないため)。

## OGP 用フォントとライセンス

`src/assets/fonts/` の `NotoSansJP-Regular.otf` と `NotoSansJP-Bold.otf` は Noto CJK の日本語サブセット版 OTF です。ライセンスは SIL Open Font License で、`OFL.txt` を一緒に置きます。ビルドのときに読むだけで、配信はしません。

## 定期再ビルドの準備

`rebuild.yml` が毎日 03:00 JST(cron `0 18 * * *`)と手動実行(workflow_dispatch)で Deploy Hook を POST します。開発者が手でやることは次の3つです。

1. Vercel で `main` ブランチ向けの Deploy Hook を作る。
2. GitHub の repository secret `VERCEL_DEPLOY_HOOK_URL` に登録する。
3. workflow_dispatch で一度流し、デプロイが始まるか確かめる。

public リポジトリでは 60 日動きがないと schedule が止まります。下の「依存の確認記録」を参照してください。

## 公開の手順

1. `renewal` で作業し、CI が通ることを確かめる。
2. `npm run verify` と `npm run check:release` を通す。
3. Vercel の Project Settings → Build and Deployment で、Framework Preset を Next.js から Astro に変え、Build Command を `npm run build`、Output Directory を `dist` にする。
4. `main` にマージする。

## 公開前に人間が見ること

- 見た目: ライトとダーク、375px とデスクトップ
- 図が読みやすいか
- OGP の折り返しと、シェアしたときの表示
- 原稿: 30秒で伝わるか。resume.pdf に個人情報がないか
- Lighthouse: Vercel の Preview か本番の URL で測る。ローカルの preview では測らない(Analytics が 404 になるため)。目標は Performance 95 以上、ほか 100、CLS 0、LCP 1.2 秒未満

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
