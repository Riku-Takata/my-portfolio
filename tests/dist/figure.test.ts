import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  attrs,
  decode,
  distDir,
  htmlFiles,
  readDist,
  startTags,
} from './html';

const projectsDir = fileURLToPath(
  new URL('../../src/content/projects/', import.meta.url),
);
const slugs = readdirSync(projectsDir)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.replace(/\.mdx$/, ''));

const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source']);
const PROSE = ['prose', 'prose-zinc', 'dark:prose-invert', 'max-w-none'];
const PLATE = [
  'rounded-md',
  'border',
  'border-zinc-200',
  'bg-zinc-50',
  'p-4',
  'dark:border-zinc-800',
  'dark:bg-zinc-100',
];

const text = (f: string): string => decode(f.replace(/<[^>]*>/g, '')).trim();
const classes = (tag: string): string[] =>
  (attrs(tag).get('class') ?? '').split(/\s+/).filter(Boolean);

function proseRanges(html: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  const open = /<([a-zA-Z][a-zA-Z0-9-]*)(?=[\s>/])[^>]*>/g;
  for (const m of html.matchAll(open)) {
    if (!PROSE.every((c) => classes(m[0]).includes(c))) continue;
    const re = new RegExp(`<${m[1]}(?=[\\s>/])[^>]*>|</${m[1]}>`, 'g');
    re.lastIndex = m.index ?? 0;
    let depth = 0;
    let end = html.length;
    for (let t = re.exec(html); t; t = re.exec(html)) {
      depth += t[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        end = t.index + t[0].length;
        break;
      }
    }
    out.push({ start: m.index ?? 0, end });
  }
  return out;
}

function h2Index(html: string, title: string): number {
  for (const m of html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)) {
    if (text(m[1]) === title) return m.index ?? -1;
  }
  return -1;
}

// img より前にあって閉じていない開始タグ
function openAncestors(inner: string): string[] {
  const names: string[] = [];
  const tags: string[] = [];
  for (const t of inner.matchAll(
    /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)(?=[\s>/])[^>]*>/g,
  )) {
    const name = t[2].toLowerCase();
    if (t[1]) {
      const i = names.lastIndexOf(name);
      if (i >= 0) {
        names.length = i;
        tags.length = i;
      }
      continue;
    }
    if (name === 'img') return tags;
    if (VOID.has(name) || t[0].endsWith('/>')) continue;
    names.push(name);
    tags.push(t[0]);
  }
  return [];
}

describe('Figure', () => {
  it('AC-9: Figure.astro がある', () => {
    expect(existsSync('src/components/mdx/Figure.astro')).toBe(true);
  });

  for (const slug of slugs) {
    describe(slug, () => {
      const html = readDist(`projects/${slug}/index.html`);
      const ranges = proseRanges(html);
      const figures = [...html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/g)]
        .map((m) => ({ index: m.index ?? 0, inner: m[1] }))
        .filter(
          (f) =>
            ranges.length > 0 &&
            f.index >= ranges[0].start &&
            f.index < ranges[0].end,
        );
      const withImg = figures.filter(
        (f) => f.inner.includes('<img') && f.inner.includes('<figcaption'),
      );
      const h2a = h2Index(html, '2. システムアーキテクチャ');
      const h2b = h2Index(html, '3. 技術選定とトレードオフ');
      const target = withImg.filter((f) => f.index > h2a && f.index < h2b);

      it('AC-1: figure が1つ以上ある', () => {
        expect(figures.length).toBeGreaterThanOrEqual(1);
      });
      it('AC-2: img と figcaption を持つ figure がある', () => {
        expect(withImg.length).toBeGreaterThanOrEqual(1);
      });
      it('AC-3: 図が 2. と 3. の間にある', () => {
        expect(h2a).toBeGreaterThanOrEqual(0);
        expect(h2b).toBeGreaterThan(h2a);
        expect(target.length).toBeGreaterThanOrEqual(1);
      });
      it('AC-4: figcaption の class と文字', () => {
        expect(target.length).toBeGreaterThanOrEqual(1);
        for (const f of target) {
          const m = /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/.exec(f.inner);
          expect(m).not.toBeNull();
          const cl = classes(startTags(f.inner, 'figcaption')[0]);
          expect(cl).toContain('text-sm');
          expect(cl).toContain('text-zinc-500');
          expect(text(m?.[1] ?? '')).not.toBe('');
        }
      });
      it('AC-5: img を包む板の要素がある', () => {
        expect(target.length).toBeGreaterThanOrEqual(1);
        for (const f of target) {
          const ok = openAncestors(f.inner).some((tag) =>
            PLATE.every((c) => classes(tag).includes(c)),
          );
          expect(ok).toBe(true);
        }
      });
      it('AC-6: figure の中に bg-white がない', () => {
        for (const f of figures) {
          for (const t of f.inner.matchAll(/<[a-zA-Z][^>]*>/g)) {
            expect(classes(t[0])).not.toContain('bg-white');
          }
        }
      });
      it('AC-16: img の src が dist にある svg を指す', () => {
        expect(target.length).toBeGreaterThanOrEqual(1);
        for (const f of target) {
          const src = attrs(startTags(f.inner, 'img')[0]).get('src') ?? '';
          expect(src.startsWith('/')).toBe(true);
          const p = src.split(/[?#]/)[0];
          expect(p.endsWith('.svg')).toBe(true);
          const file = path.join(distDir, p);
          expect(existsSync(file)).toBe(true);
          expect(statSync(file).size).toBeGreaterThan(0);
        }
      });
      it('AC-17: 図の前に pre がある', () => {
        expect(target.length).toBeGreaterThanOrEqual(1);
        const pre = [...html.matchAll(/<pre\b/g)].filter(
          (m) =>
            (m.index ?? 0) > h2a && (m.index ?? 0) < (target[0]?.index ?? 0),
        );
        expect(pre.length).toBeGreaterThanOrEqual(1);
      });
    });
  }

  it('AC-7/AC-8: すべての img に alt・width・height がある', () => {
    let count = 0;
    for (const file of htmlFiles()) {
      for (const tag of startTags(readDist(file), 'img')) {
        const a = attrs(tag);
        count += 1;
        expect(a.has('alt')).toBe(true);
        expect((a.get('alt') ?? '').trim()).not.toBe('');
        expect(a.get('width') ?? '').toMatch(/^[1-9][0-9]*$/);
        expect(a.get('height') ?? '').toMatch(/^[1-9][0-9]*$/);
      }
    }
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
