import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const relDir = 'src/content/projects';
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const listFiles = () =>
  readdirSync(path.join(root, relDir), { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();

const FRONT = /^---[ \t]*$/;
const OPEN = /^ {0,3}(`{3,}|~{3,})/;
const CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;
const H1 = /^ {0,3}#(?:[ \t]|$)/;

// frontmatter とコードブロックの外にある h1 行を返す
const findH1Lines = (source: string): { line: number; text: string }[] => {
  const text0 = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const lines = text0.split(/\r?\n/);
  let start = 0;
  if (FRONT.test(lines[0] ?? '')) {
    const end = lines.findIndex((l, i) => i > 0 && FRONT.test(l));
    if (end !== -1) start = end + 1;
  }
  const found: { line: number; text: string }[] = [];
  let fence: string | null = null;
  for (let i = start; i < lines.length; i++) {
    const text = lines[i] ?? '';
    if (fence === null) {
      const open = OPEN.exec(text);
      if (open) {
        fence = open[1] ?? '';
        continue;
      }
      if (H1.test(text)) found.push({ line: i + 1, text });
    } else {
      const mark = CLOSE.exec(text)?.[1] ?? '';
      if (mark !== '' && mark[0] === fence[0] && mark.length >= fence.length) {
        fence = null;
      }
    }
  }
  return found;
};

describe('findH1Lines', () => {
  const doc = (line: string) => `---\ntitle: x\n---\n\n${line}\n`;

  it.each(['# 見出し', ' # 見出し', '   # 見出し', '#\t見出し', '#'])(
    '%j は違反になる',
    (line) => {
      expect(findH1Lines(doc(line))).toEqual([{ line: 5, text: line }]);
    },
  );

  it.each([
    '## 見出し',
    '### 小見出し',
    '#見出し',
    '    # 見出し',
    '本文 # 途中',
  ])('%j は違反にならない', (line) => {
    expect(findH1Lines(doc(line))).toEqual([]);
  });

  it('``` で囲んだ中は対象外', () => {
    expect(findH1Lines(doc('```\n# コメント\n```'))).toEqual([]);
  });

  it('~~~ で囲んだ中は対象外', () => {
    expect(findH1Lines(doc('~~~\n# コメント\n~~~'))).toEqual([]);
  });

  it('長いフェンスの中にある短いフェンスでは閉じない', () => {
    expect(findH1Lines(doc('````\n```\n# コメント\n````'))).toEqual([]);
  });

  it('frontmatter の中は対象外', () => {
    const src = '---\n# TODO(content): 仮\ntitle: x\n---\n本文\n';
    expect(findH1Lines(src)).toEqual([]);
  });

  it('コードブロックの後ろの h1 行は拾う', () => {
    const src = doc('```\n# a\n```\n# 見出し');
    expect(findH1Lines(src)).toEqual([{ line: 8, text: '# 見出し' }]);
  });
});

describe(`${relDir}/`, () => {
  it('拡張子が .mdx のファイルだけがある', () => {
    const bad = listFiles()
      .filter((n) => !n.endsWith('.mdx'))
      .map((n) => `${relDir}/${n}`);
    expect(bad).toEqual([]);
  });

  it('slug が規則に合い、index でない', () => {
    const bad = listFiles()
      .filter((n) => n.endsWith('.mdx'))
      .map((n) => ({ n, slug: n.slice(0, -'.mdx'.length) }))
      .filter(({ slug }) => !SLUG.test(slug) || slug === 'index')
      .map(({ n, slug }) => `${relDir}/${n}: ${slug}`);
    expect(bad).toEqual([]);
  });

  it('本文に h1 行がない', () => {
    const bad = listFiles()
      .filter((n) => n.endsWith('.mdx'))
      .flatMap((n) =>
        findH1Lines(readFileSync(path.join(root, relDir, n), 'utf8')).map(
          (h) => `${relDir}/${n}:${h.line}: ${h.text}`,
        ),
      );
    expect(bad).toEqual([]);
  });
});
