import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { attrs, htmlFiles, readDist, startTags as tagsOf } from './html';

const distDir = fileURLToPath(new URL('../../dist/', import.meta.url));
const html = readFileSync(path.join(distDir, 'index.html'), 'utf-8');
const all = (readdirSync(distDir, { recursive: true }) as string[]).map((f) =>
  String(f).split(path.sep).join('/'),
);
const cssFiles = all.filter((f) => f.endsWith('.css'));
const cssText = cssFiles.map((f) => ({
  file: f,
  text: readFileSync(path.join(distDir, f), 'utf-8'),
}));

// 規則(`{` の直前のセレクタ)と、その祖先のブロック見出しを集める
function rules(css: string): { prelude: string; ancestors: string[] }[] {
  const out: { prelude: string; ancestors: string[] }[] = [];
  const stack: string[] = [];
  let buf = '';
  for (const ch of css) {
    if (ch === '{') {
      const prelude = buf.trim();
      out.push({ prelude, ancestors: [...stack] });
      stack.push(prelude);
      buf = '';
    } else if (ch === '}') {
      stack.pop();
      buf = '';
    } else if (ch === ';') {
      buf = '';
    } else {
      buf += ch;
    }
  }
  return out;
}

const DARK = /@media[^{]*prefers-color-scheme\s*:\s*dark/;

function darkRuleExists(cls: string): boolean {
  const needle = cls.replace(':', '\\:');
  return cssText.some(({ text }) => {
    const rs = rules(text);
    return rs.some(
      (r, i) =>
        r.prelude.includes(needle) &&
        (r.ancestors.some((a) => DARK.test(a)) ||
          // 子として出る形(.x { @media (...) { ... } })
          rs
            .slice(i + 1)
            .some(
              (c) => DARK.test(c.prelude) && c.ancestors.includes(r.prelude),
            )),
    );
  });
}

const fontFaces = cssText.flatMap(({ file, text }) =>
  [...text.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => ({
    file,
    block: m[0],
    family: m[0].match(/font-family\s*:\s*([^;}]*)/)?.[1].replace(/["']/g, '') ?? '',
  })),
);

function startTags(name: string): string[] {
  return [...html.matchAll(new RegExp(`<${name}(?=[\\s>/])[^>]*>`, 'g'))].map(
    (m) => m[0],
  );
}

describe('dist: テーマ', () => {
  it('dark: の規則が prefers-color-scheme の中にある', () => {
    expect(darkRuleExists('dark:bg-zinc-950')).toBe(true);
    expect(darkRuleExists('dark:text-zinc-200')).toBe(true);
  });

  it('body に配色のクラスがある', () => {
    const body = startTags('body')[0];
    const cls = (body.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/);
    expect(cls).toEqual(
      expect.arrayContaining([
        'bg-zinc-50',
        'dark:bg-zinc-950',
        'text-zinc-800',
        'dark:text-zinc-200',
      ]),
    );
  });

  it('color-scheme の meta が残っている', () => {
    expect(html).toContain('<meta name="color-scheme" content="light dark">');
  });
});

describe('dist: フォント', () => {
  it.each(['Geist Variable', 'JetBrains Mono Variable'])(
    '%s の @font-face と woff2 がある',
    (family) => {
      const faces = fontFaces.filter((f) => f.family.trim() === family);
      expect(faces.length).toBeGreaterThan(0);
      const missing = faces.flatMap((f) =>
        [...f.block.matchAll(/url\(\s*["']?([^"')]+\.woff2)["']?\s*\)/g)]
          .map((m) => m[1])
          .map((u) =>
            u.startsWith('/')
              ? path.join(distDir, u)
              : path.join(distDir, path.dirname(f.file), u),
          )
          .filter((p) => !existsSync(p))
          .map((p) => `${f.file}: ${p}`),
      );
      expect(missing).toEqual([]);
    },
  );

  function woff2Urls(family: string, latinOnly: boolean): string[] {
    return fontFaces
      .filter((f) => f.family.trim() === family)
      .filter((f) => !latinOnly || /U\+0000-00FF/i.test(f.block))
      .flatMap((f) =>
        [...f.block.matchAll(/url\(\s*["']?([^"')]+\.woff2)["']?\s*\)/g)].map(
          (m) =>
            m[1].startsWith('/')
              ? m[1]
              : '/' + path.posix.join(path.posix.dirname(f.file), m[1]),
        ),
      );
  }

  it('Geist の latin を preload している', () => {
    const preloads = startTags('link')
      .map(attrs)
      .filter((a) => a.get('rel') === 'preload' && a.get('as') === 'font');
    expect(preloads).toHaveLength(1);
    expect(preloads[0].get('type')).toBe('font/woff2');
    expect(preloads[0].has('crossorigin')).toBe(true);
    const href = preloads[0].get('href') ?? '';
    expect(existsSync(path.join(distDir, href))).toBe(true);
    expect(woff2Urls('Geist Variable', true)).toEqual([href]);
  });

  it('JetBrains Mono を preload しない', () => {
    const mono = woff2Urls('JetBrains Mono Variable', false);
    expect(mono.length).toBeGreaterThan(0);
    const preloaded = htmlFiles().flatMap((f) =>
      tagsOf(readDist(f), 'link')
        .map(attrs)
        .filter((a) => a.get('rel') === 'preload')
        .map((a) => a.get('href') ?? ''),
    );
    expect(preloaded.filter((h) => mono.includes(h))).toEqual([]);
  });

  it('和文の Web フォントを配信しない', () => {
    const found = fontFaces
      .filter((f) => /Noto Sans JP|Hiragino|Yu Gothic|Meiryo/.test(f.family))
      .map((f) => `${f.file}: ${f.family}`);
    expect(found).toEqual([]);
  });
});

describe('dist: デモ', () => {
  it('id 付きの section とその中の h2 がある', () => {
    expect(html).toMatch(/<section\b[^>]*\bid="[^"]+"[^>]*>[\s\S]*?<h2\b/);
  });

  it('Badge の出力がある', () => {
    expect(html).toMatch(
      /<span\b[^>]*class="[^"]*\bfont-mono\b[^"]*\btext-xs\b[^"]*"/,
    );
  });

  it('外部と内部の LinkButton がある', () => {
    const hrefs = startTags('a').map((t) => t.match(/\bhref="([^"]*)"/)?.[1] ?? '');
    expect(hrefs.some((h) => /^https?:\/\//.test(h))).toBe(true);
    expect(hrefs.some((h) => !/^https?:\/\//.test(h))).toBe(true);
  });

  it('aria-hidden の svg が6つ以上ある', () => {
    const n = startTags('svg').filter((t) => t.includes('aria-hidden="true"'));
    expect(n.length).toBeGreaterThanOrEqual(6);
  });
});
