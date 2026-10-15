import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { SITE_NAME } from './site';

const FONT_DIR = 'src/assets/fonts';

// フォントは初回だけ読む(ビルドも vitest もリポジトリのルートで動く)
let fontsPromise: Promise<[Buffer, Buffer]> | undefined;

function loadFonts(): Promise<[Buffer, Buffer]> {
  fontsPromise ??= Promise.all([
    readFile(path.join(process.cwd(), FONT_DIR, 'NotoSansJP-Regular.otf')),
    readFile(path.join(process.cwd(), FONT_DIR, 'NotoSansJP-Bold.otf')),
  ]);
  return fontsPromise;
}

const WIDTH = 1200;
const HEIGHT = 630;
const PADDING = 80;
// 文字の行の幅。左右の余白の内側に収める(指定しないと長い行が右端からはみ出す)
export const TEXT_WIDTH = WIDTH - PADDING * 2;

interface OgInput {
  title: string;
  summary: string;
}

// satori に渡す要素の木(JSX を使わずオブジェクトで書く)
export function buildOgTree({ title, summary }: OgInput) {
  return {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fafafa',
        padding: PADDING,
        // 余白を 1200×630 の内側に取る(content-box だと外に広がり、下端の名前と帯が画像の外に出る)
        boxSizing: 'border-box',
        fontFamily: 'Noto Sans JP',
        position: 'relative',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontSize: 64,
              fontWeight: 700,
              color: '#18181b',
              lineHeight: 1.3,
              width: TEXT_WIDTH,
              wordBreak: 'break-all',
              display: 'block',
              lineClamp: 2,
              overflow: 'hidden',
            },
            children: title,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 32,
              fontWeight: 400,
              color: '#71717a',
              lineHeight: 1.5,
              marginTop: 24,
              width: TEXT_WIDTH,
              wordBreak: 'break-all',
              display: 'block',
              lineClamp: 3,
              overflow: 'hidden',
            },
            children: summary,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 28,
              fontWeight: 400,
              color: '#71717a',
              marginTop: 'auto',
            },
            children: SITE_NAME,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: WIDTH,
              height: 8,
              backgroundColor: '#4f46e5',
            },
          },
        },
      ],
    },
  };
}

export async function renderOgPng(input: OgInput): Promise<Buffer> {
  const [regular, bold] = await loadFonts();
  const root = buildOgTree(input);

  const svg = await satori(root as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Noto Sans JP', data: regular, weight: 400, style: 'normal' },
      { name: 'Noto Sans JP', data: bold, weight: 700, style: 'normal' },
    ],
  });

  return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } })
    .render()
    .asPng();
}
