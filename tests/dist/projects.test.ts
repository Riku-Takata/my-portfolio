import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { attrs, decode, readDist, startTags } from './html';

const projectsDir = fileURLToPath(
  new URL('../../src/content/projects/', import.meta.url),
);

type Expected = { id: string; title: string; featured: boolean; order: number };

function readProject(file: string): Expected {
  const text = readFileSync(projectsDir + file, 'utf-8');
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const title = fm.match(/^title:\s*(['"]?)(.*?)\1\s*$/m)?.[2];
  const featured = fm.match(/^featured:\s*(true|false)\s*(#.*)?$/m)?.[1];
  const order = fm.match(/^order:\s*(\d+)\s*(#.*)?$/m)?.[1];
  if (title === undefined || featured === undefined || order === undefined) {
    throw new Error(`${file}: title / featured / order を読めません`);
  }
  return {
    id: file.replace(/\.mdx$/, ''),
    title,
    featured: featured === 'true',
    order: Number(order),
  };
}

const expected = readdirSync(projectsDir)
  .filter((f) => f.endsWith('.mdx'))
  .map(readProject)
  .filter((p) => p.featured)
  .sort((a, b) => a.order - b.order);

const html = readDist('index.html');
const sectionStart = html.indexOf('<section id="projects"');
const sectionEnd = html.indexOf('</section>', sectionStart);
const section =
  sectionStart >= 0 ? html.slice(sectionStart, sectionEnd + 10) : '';
const articles = [...section.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(
  (m) => m[0],
);

describe('dist/index.html の #projects', () => {
  it('前提: featured が 1 件以上ある', () => {
    expect(expected.length).toBeGreaterThan(0);
  });

  it('#projects が <main> の中に 1 つあり、#about より後ろにある', () => {
    const ids = [...html.matchAll(/<[a-z][^>]*>/g)]
      .map((m) => m[0])
      .filter((t) => attrs(t).get('id') === 'projects');
    expect(ids).toHaveLength(1);
    const pos = html.indexOf('id="projects"');
    expect(pos).toBeGreaterThan(html.indexOf('<main'));
    expect(pos).toBeLessThan(html.indexOf('</main>'));
    expect(pos).toBeGreaterThan(html.indexOf('id="about"'));
  });

  it('<article> の数が featured の件数と同じ', () => {
    expect(articles).toHaveLength(expected.length);
  });

  it('<h3> が order の昇順に並ぶ', () => {
    const titles = articles.map((a) =>
      decode((a.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? '').trim()),
    );
    expect(titles).toEqual(expected.map((p) => p.title));
  });

  it('各カードに /projects/<id>/ へのリンクがある', () => {
    expected.forEach((p, i) => {
      const hrefs = startTags(articles[i] ?? '', 'a').map((t) =>
        attrs(t).get('href'),
      );
      expect(hrefs).toContain(`/projects/${p.id}/`);
    });
  });

  it('Live Demo のリンクがない(仮原稿に demo がない)', () => {
    const links = [...section.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((m) =>
      m[1].replace(/<[^>]*>/g, '').trim(),
    );
    expect(links).not.toContain('Live Demo');
  });
});

describe('dist/index.html 全体', () => {
  it('<a> の入れ子がない', () => {
    let depth = 0;
    let max = 0;
    for (const m of html.matchAll(/<a(?=[\s>])|<\/a>/g)) {
      depth += m[0] === '</a>' ? -1 : 1;
      max = Math.max(max, depth);
    }
    expect(max).toBeLessThanOrEqual(1);
  });

  it('target="_blank" の <a> は rel に noopener を含む', () => {
    for (const tag of startTags(html, 'a')) {
      const a = attrs(tag);
      if (a.get('target') === '_blank') {
        expect(a.get('rel') ?? '').toContain('noopener');
      }
    }
  });
});
