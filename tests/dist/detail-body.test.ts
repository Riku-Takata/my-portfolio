import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { allFiles, attrs, decode, readDist, startTags } from './html';

const projectsDir = fileURLToPath(
  new URL('../../src/content/projects/', import.meta.url),
);
const tablePath = fileURLToPath(
  new URL('../../src/components/mdx/Table.astro', import.meta.url),
);

const slugs = readdirSync(projectsDir)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.replace(/\.mdx$/, ''));

function body(src: string): string {
  return src.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
}

interface Scan {
  fences: number;
  h2: string[];
  tableLines: string[];
  firstHeader: string | null;
}

function scan(src: string): Scan {
  const out: Scan = { fences: 0, h2: [], tableLines: [], firstHeader: null };
  let inFence = false;
  let prev = '';
  for (const line of body(src).split(/\r?\n/)) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      if (inFence) out.fences += 1;
      prev = line;
      continue;
    }
    if (!inFence) {
      if (line.startsWith('## ')) out.h2.push(line.slice(3).trim());
      if (line.startsWith('|')) out.tableLines.push(line);
      if (out.firstHeader === null && /^\|\s*:?-{3,}/.test(line)) {
        out.firstHeader = prev;
      }
    }
    prev = line;
  }
  return out;
}

function headerCells(line: string): string[] {
  return line
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

function text(fragment: string): string {
  return decode(fragment.replace(/<[^>]*>/g, '')).trim();
}

function classes(tag: string): string[] {
  return (attrs(tag).get('class') ?? '').split(/\s+/).filter(Boolean);
}

const PROSE = ['prose', 'prose-zinc', 'dark:prose-invert', 'max-w-none'];

function proseRanges(html: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  const open = /<([a-zA-Z][a-zA-Z0-9-]*)(?=[\s>/])[^>]*>/g;
  for (const m of html.matchAll(open)) {
    const cl = classes(m[0]);
    if (!PROSE.every((c) => cl.includes(c))) continue;
    const name = m[1];
    const start = m.index ?? 0;
    const re = new RegExp(`<${name}(?=[\\s>/])[^>]*>|</${name}>`, 'g');
    re.lastIndex = start;
    let depth = 0;
    let end = html.length;
    for (let t = re.exec(html); t; t = re.exec(html)) {
      depth += t[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        end = t.index + t[0].length;
        break;
      }
    }
    out.push({ start, end });
  }
  return out;
}

function elements(
  html: string,
  name: string,
): { index: number; inner: string }[] {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'g'))].map(
    (m) => ({ index: m.index ?? 0, inner: m[1] }),
  );
}

interface Rule {
  prelude: string;
  ancestors: string[];
  body: string;
}

function cssRules(css: string): Rule[] {
  const rules: Rule[] = [];
  const stack: { prelude: string; bodyStart: number }[] = [];
  let buf = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '"' || c === "'") {
      const j = css.indexOf(c, i + 1);
      const end = j === -1 ? css.length : j + 1;
      buf += css.slice(i, end);
      i = end - 1;
    } else if (c === '/' && css[i + 1] === '*') {
      const j = css.indexOf('*/', i + 2);
      i = j === -1 ? css.length : j + 1;
    } else if (c === '{') {
      stack.push({ prelude: buf.trim(), bodyStart: i + 1 });
      buf = '';
    } else if (c === '}') {
      const top = stack.pop();
      if (top) {
        rules.push({
          prelude: top.prelude,
          ancestors: stack.map((s) => s.prelude),
          body: css.slice(top.bodyStart, i),
        });
      }
      buf = '';
    } else if (c === ';') {
      buf = '';
    } else {
      buf += c;
    }
  }
  return rules;
}

const selectors = (prelude: string): string[] =>
  prelude
    .split(',')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
const decls = (b: string): string[] =>
  b
    .split(';')
    .map((s) => s.replace(/\s+/g, ''))
    .filter(Boolean);
const inDark = (r: Rule): boolean =>
  r.ancestors.some((a) => /@media[^{]*prefers-color-scheme\s*:\s*dark/.test(a));

const pages = slugs.map((slug) => ({
  slug,
  html: readDist(`projects/${slug}/index.html`),
  info: scan(readFileSync(`${projectsDir}${slug}.mdx`, 'utf-8')),
}));

const cssRulesAll = allFiles()
  .filter((f) => f.startsWith('_astro/') && f.endsWith('.css'))
  .flatMap((f) => cssRules(readDist(f)));

describe('詳細ページの本文の組版', () => {
  it('原稿が1件以上ある', () => {
    expect(slugs.length).toBeGreaterThan(0);
  });

  for (const { slug, html, info } of pages) {
    describe(slug, () => {
      const ranges = proseRanges(html);

      it('AC-1: prose 要素がちょうど1つ', () => {
        expect(ranges.length).toBe(1);
      });

      it('AC-2: 原稿の h2 がすべて prose 要素の中にある', () => {
        expect(info.h2.length).toBeGreaterThan(0);
        const { start, end } = ranges[0];
        const inside = new Set(
          elements(html, 'h2')
            .filter((e) => e.index >= start && e.index < end)
            .map((e) => text(e.inner)),
        );
        for (const h of info.h2) expect(inside.has(h)).toBe(true);
      });

      it('AC-3: h1 と戻るリンクは prose 要素の外', () => {
        const { start, end } = ranges[0];
        const outside = (i: number) => i < start || i >= end;
        const h1 = html.search(/<h1[\s>]/);
        expect(h1).toBeGreaterThanOrEqual(0);
        expect(outside(h1)).toBe(true);
        const links = [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].filter(
          (m) =>
            attrs(m[0]).get('href') === '/#projects' &&
            text(m[1]) === '← Featured Projects へ戻る',
        );
        expect(links.length).toBeGreaterThan(0);
        for (const l of links) expect(outside(l.index ?? 0)).toBe(true);
      });

      it('AC-4: 原稿に表があれば <table> がある', () => {
        if (info.tableLines.length > 0) {
          expect(startTags(html, 'table').length).toBeGreaterThanOrEqual(1);
        }
      });

      it('AC-5: <table> は overflow-x-auto の div の直下', () => {
        for (const m of html.matchAll(/<table(?=[\s>/])/g)) {
          const at = m.index ?? 0;
          const before = html.slice(0, at);
          const open = /<div\b[^>]*>\s*$/.exec(before);
          expect(open).not.toBeNull();
          expect(classes(open![0].trim())).toContain('overflow-x-auto');
          const close = html.indexOf('</table>', at);
          expect(close).toBeGreaterThan(-1);
          expect(/^\s*<\/div>/.test(html.slice(close + '</table>'.length))).toBe(
            true,
          );
        }
      });

      it('T-029: <table> の class に min-w- で始まるクラスがある(狭い画面では表の中だけを横スクロール)', () => {
        for (const tag of startTags(html, 'table')) {
          expect(classes(tag).some((c) => c.startsWith('min-w-'))).toBe(true);
        }
      });

      it('AC-6: 表の中身が失われない', () => {
        if (info.tableLines.length === 0) return;
        const tables = elements(html, 'table');
        expect(tables.length).toBeGreaterThan(0);
        for (const t of tables) {
          expect(t.inner).toMatch(/<th[\s>]/);
          expect(t.inner).toMatch(/<td[\s>]/);
        }
        const ths = new Set(
          tables.flatMap((t) =>
            elements(t.inner, 'th').map((e) => text(e.inner)),
          ),
        );
        for (const cell of headerCells(info.firstHeader ?? '')) {
          expect(ths.has(cell)).toBe(true);
        }
      });

      it('AC-8: astro-code の pre の数がコードブロックの数と等しい', () => {
        const pres = startTags(html, 'pre').filter((t) =>
          classes(t).includes('astro-code'),
        );
        expect(pres.length).toBe(info.fences);
      });

      it('AC-9: astro-code の pre はライトとダークの色を持つ', () => {
        const pres = startTags(html, 'pre').filter((t) =>
          classes(t).includes('astro-code'),
        );
        for (const pre of pres) {
          const names = new Set(
            (attrs(pre).get('style') ?? '')
              .split(';')
              .map((d) => d.split(':')[0].trim()),
          );
          for (const n of [
            '--shiki-dark',
            '--shiki-dark-bg',
            'color',
            'background-color',
          ]) {
            expect(names.has(n)).toBe(true);
          }
        }
      });
    });
  }

  it('AC-4: 全詳細ページを合わせて <table> が1つ以上ある', () => {
    const total = pages.reduce(
      (n, p) => n + startTags(p.html, 'table').length,
      0,
    );
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it('AC-6: 検査の対象になった見出し文字が1件以上ある', () => {
    const total = pages.reduce(
      (n, p) =>
        n +
        (p.info.tableLines.length > 0
          ? headerCells(p.info.firstHeader ?? '').length
          : 0),
      0,
    );
    expect(total).toBeGreaterThan(0);
  });

  it('AC-7: Table.astro がある', () => {
    expect(existsSync(tablePath)).toBe(true);
  });

  it('AC-8: 全詳細ページを合わせて astro-code の pre が1つ以上ある', () => {
    const total = pages.reduce(
      (n, p) =>
        n +
        startTags(p.html, 'pre').filter((t) => classes(t).includes('astro-code'))
          .length,
      0,
    );
    expect(total).toBeGreaterThanOrEqual(1);
  });

  for (const sel of ['.astro-code', '.astro-code span']) {
    it(`AC-10: ダークの @media に ${sel} の上書き規則がある`, () => {
      const hit = cssRulesAll.some(
        (r) =>
          inDark(r) &&
          selectors(r.prelude).includes(sel) &&
          decls(r.body).includes('color:var(--shiki-dark)!important') &&
          decls(r.body).includes('background-color:var(--shiki-dark-bg)!important'),
      );
      expect(hit).toBe(true);
    });
  }

  it('AC-11: ダークの @media の外で .astro-code に shiki-dark を当てない', () => {
    const bad = cssRulesAll.filter(
      (r) =>
        !inDark(r) &&
        selectors(r.prelude).some((s) => s.includes('.astro-code')) &&
        r.body.includes('var(--shiki-dark'),
    );
    expect(bad).toEqual([]);
  });
});
