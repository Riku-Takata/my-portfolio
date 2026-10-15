import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resume } from '../../src/content/resume';
import { SITE_URL } from '../../src/lib/site';
import { htmlFiles, readDist, scripts } from './html';

const projectsDir = fileURLToPath(
  new URL('../../src/content/projects/', import.meta.url),
);

function unquote(v: string): string {
  const s = v.trim();
  if (s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
  return s;
}

function readProject(file: string) {
  const src = readFileSync(projectsDir + file, 'utf-8');
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const title = fm.match(/^title:\s*(.+?)\s*$/m)?.[1];
  const summary = fm.match(/^summary:\s*(.+?)\s*$/m)?.[1];
  const start = fm.match(
    /^period:\s*\n(?:[ \t]+.*\n)*?[ \t]+start:\s*(.+?)\s*$/m,
  )?.[1];
  if (title === undefined || summary === undefined || start === undefined) {
    throw new Error(`${file}: frontmatter を読めません`);
  }
  return {
    slug: file.replace(/\.mdx$/, ''),
    title: unquote(title),
    summary: unquote(summary),
    start: unquote(start),
  };
}

function ldScripts(html: string) {
  return scripts(html).filter(
    (s) => s.attrs.get('type') === 'application/ld+json',
  );
}

function jsonLds(html: string): Record<string, unknown>[] {
  return ldScripts(html).map((s) => JSON.parse(s.body));
}

const projects = readdirSync(projectsDir)
  .filter((f) => f.endsWith('.mdx'))
  .map(readProject);

describe('dist: トップの Person', () => {
  const html = readDist('index.html');
  const persons = jsonLds(html).filter((j) => j['@type'] === 'Person');

  it('JSON.parse できる', () => {
    expect(() => jsonLds(html)).not.toThrow();
  });
  it('Person がちょうど1つ', () => {
    expect(persons).toHaveLength(1);
  });
  it('値が resume と一致する', () => {
    const p = persons[0];
    expect(p['@context']).toBe('https://schema.org');
    expect(p.name).toBe(resume.profile.nameEn);
    expect(p.alternateName).toBe(resume.profile.nameJa);
    expect(p.url).toBe(`${SITE_URL}/`);
    expect(p.sameAs).toEqual([
      resume.profile.links.github,
      resume.profile.links.x,
    ]);
  });
  it('affiliation は Organization', () => {
    const a = persons[0].affiliation as Record<string, unknown>;
    expect(typeof a).toBe('object');
    expect(a).not.toBeNull();
    expect(a['@type']).toBe('Organization');
    expect(a.name).toBe(resume.profile.affiliation);
  });
});

describe.each(projects)('dist: projects/$slug', (proj) => {
  const html = readDist(`projects/${proj.slug}/index.html`);
  const works = jsonLds(html).filter((j) => j['@type'] === 'CreativeWork');

  it('CreativeWork がちょうど1つ', () => {
    expect(works).toHaveLength(1);
  });
  it('frontmatter と一致する', () => {
    const w = works[0];
    expect(w['@context']).toBe('https://schema.org');
    expect(w.name).toBe(proj.title);
    expect(w.description).toBe(proj.summary);
    expect(w.dateCreated).toBe(proj.start);
  });
  it('author は Person のオブジェクト', () => {
    const a = works[0].author as Record<string, unknown>;
    expect(typeof a).toBe('object');
    expect(a['@type']).toBe('Person');
    expect(a.name).toBe(resume.profile.nameEn);
  });
});

describe('dist: 具体値', () => {
  const work = (slug: string) =>
    jsonLds(readDist(`projects/${slug}/index.html`))[0];
  it('rag-knowledge-base', () => {
    expect(work('rag-knowledge-base').name).toBe(
      'RAG による社内ナレッジ検索基盤',
    );
    expect(work('rag-knowledge-base').dateCreated).toBe('2024-10');
  });
  it('satellite-insar', () => {
    expect(work('satellite-insar').name).toBe(
      '衛星 InSAR による地表変動の解析基盤',
    );
    expect(work('satellite-insar').dateCreated).toBe('2024-04');
  });
});

describe('dist: 出力範囲', () => {
  it('404 に JSON-LD がない', () => {
    expect(ldScripts(readDist('404.html'))).toHaveLength(0);
  });
  it('JSON-LD を含むのはトップと詳細ページだけ', () => {
    const withLd = htmlFiles()
      .filter((f) => ldScripts(readDist(f)).length > 0)
      .sort();
    const expected = [
      'index.html',
      ...projects.map((p) => `projects/${p.slug}/index.html`),
    ].sort();
    expect(withLd).toEqual(expected);
  });
});
