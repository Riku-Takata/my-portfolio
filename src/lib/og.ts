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

export async function renderOgPng({
  title,
  summary,
}: {
  title: string;
  summary: string;
}): Promise<Buffer> {
  const [regular, bold] = await loadFonts();

  const root = {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fafafa',
        padding: 80,
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
              width: 1200,
              height: 8,
              backgroundColor: '#4f46e5',
            },
          },
        },
      ],
    },
  };

  const svg = await satori(root as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Noto Sans JP', data: regular, weight: 400, style: 'normal' },
      { name: 'Noto Sans JP', data: bold, weight: 700, style: 'normal' },
    ],
  });

  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    .render()
    .asPng();
}
