import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SITE_NAME, SITE_URL } from '../../src/lib/site';
import {
  allFiles,
  attrs,
  canonicals,
  decode,
  metas,
  readDist,
  startTags,
  titleTexts,
} from './html';

const projectsDir = fileURLToPath(
  new URL('../../src/content/projects/', import.meta.url),
);

type Project = { slug: string; title: string; summary: string };

function unquote(v: string): string {
  const s = v.trim();
  if (s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
  return s;
}

function readProject(file: string): Project {
  const src = readFileSync(projectsDir + file, 'utf-8');
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const title = fm.match(/^title:\s*(.+?)\s*$/m)?.[1];
  const summary = fm.match(/^summary:\s*(.+?)\s*$/m)?.[1];
  if (title === undefined || summary === undefined) {
    throw new Error(`${file}: title / summary を読めません`);
  }
  return {
    slug: file.replace(/\.mdx$/, ''),
    title: unquote(title),
    summary: unquote(summary),
  };
}

const projects = readdirSync(projectsDir)
  .filter((f) => f.endsWith('.mdx'))
  .map(readProject);

const text = (fragment: string) =>
  decode(fragment.replace(/<[^>]*>/g, '')).trim();

describe('詳細ページ', () => {
  it('原稿が1件以上ある', () => {
    expect(projects.length).toBeGreaterThan(0);
  });

  it('AC-1: 原稿ごとに index.html があり、ほかにはない', () => {
    const found = allFiles()
      .filter((f) => f.startsWith('projects/') && f.endsWith('index.html'))
      .sort();
    const want = projects.map((p) => `projects/${p.slug}/index.html`).sort();
    expect(found).toEqual(want);
  });

  for (const p of projects) {
    describe(p.slug, () => {
      const html = readDist(`projects/${p.slug}/index.html`);
      const mainStart = html.indexOf('<main');
      const mainEnd = html.indexOf('</main>');

      it('AC-2: title', () => {
        expect(titleTexts(html)).toEqual([`${p.title} | ${SITE_NAME}`]);
      });

      it('AC-3: og:type', () => {
        expect(metas(html, 'property', 'og:type')).toEqual(['article']);
      });

      it('AC-4: canonical', () => {
        expect(canonicals(html)).toEqual([`${SITE_URL}/projects/${p.slug}/`]);
      });

      it('AC-5: og:image', () => {
        expect(metas(html, 'property', 'og:image')).toEqual([
          `${SITE_URL}/og/${p.slug}.png`,
        ]);
      });

      it('AC-6: description', () => {
        expect(metas(html, 'name', 'description')).toEqual([p.summary]);
      });

      it('AC-7: h1 は main の中に1つで、文字が title', () => {
        expect(startTags(html, 'h1')).toHaveLength(1);
        const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
        expect(m).not.toBeNull();
        expect(m!.index!).toBeGreaterThan(mainStart);
        expect(m!.index!).toBeLessThan(mainEnd);
        expect(text(m![1])).toBe(p.title);
      });

      it('AC-8: header', () => {
        const tags = startTags(html, 'header').filter(
          (t) => attrs(t).get('id') === 'site-header',
        );
        expect(tags).toHaveLength(1);
        const start = html.indexOf(tags[0]);
        const end = html.indexOf('</header>', start);
        expect(start >= 0 && (end < mainStart || start > mainEnd)).toBe(true);
        const header = html.slice(start, end);
        const anchors = [...header.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(
          (m) => m[0],
        );
        expect(anchors).toHaveLength(1);
        const a = attrs(startTags(anchors[0], 'a')[0]);
        expect(a.get('href')).toBe('/');
        expect(a.has('target')).toBe(false);
        expect(text(anchors[0])).toBe(SITE_NAME);
      });

      it('AC-9: 戻るリンクは最後の h2 より後ろ', () => {
        const back = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].filter(
          (m) =>
            attrs(startTags(m[0], 'a')[0]).get('href') === '/#projects' &&
            text(m[0]) === '← Featured Projects へ戻る',
        );
        expect(back).toHaveLength(1);
        expect(back[0].index!).toBeGreaterThan(html.lastIndexOf('<h2'));
      });
    });
  }

  it('AC-10: トップと 404 に site-header がない', () => {
    expect(readDist('index.html')).not.toContain('id="site-header"');
    expect(readDist('404.html')).not.toContain('id="site-header"');
  });
});
