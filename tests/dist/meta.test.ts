import { describe, expect, it } from 'vitest';
import { SITE_URL } from '../../src/lib/site';
import {
  allFiles,
  canonicals,
  htmlFiles,
  isAnalyticsScript,
  metaNamesStartingWith,
  metas,
  readDist,
  scripts,
  startTags,
  titleTexts,
} from './html';

const files = htmlFiles();

describe('dist: HTML の一覧', () => {
  it('HTML がある', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('title がすべて異なる', () => {
    const titles = files.flatMap((f) => titleTexts(readDist(f)));
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('_astro の .js はどれも Vercel Analytics のもの', () => {
    const js = allFiles().filter(
      (f) => f.startsWith('_astro/') && f.endsWith('.js'),
    );
    const bad = js.filter((f) => !readDist(f).includes('/_vercel/insights'));
    expect(bad).toEqual([]);
  });
});

describe.each(files)('dist: %s', (file) => {
  const html = readDist(file);
  const title = titleTexts(html)[0] ?? '';
  const description = metas(html, 'name', 'description')[0] ?? '';
  const canonical = canonicals(html)[0] ?? '';

  it('<html> に lang="ja" がある', () => {
    const tag = html.match(/<html\b[^>]*>/i)?.[0] ?? '';
    expect(tag).toMatch(/\blang="ja"/);
  });

  it('<h1> がちょうど1つ', () => {
    expect(startTags(html, 'h1')).toHaveLength(1);
  });

  it('<title> が空でない', () => {
    expect(titleTexts(html)).toHaveLength(1);
    expect(title.trim()).not.toBe('');
  });

  it('meta description が空でない', () => {
    expect(metas(html, 'name', 'description')).toHaveLength(1);
    expect(description.trim()).not.toBe('');
  });

  it('canonical が SITE_URL で始まり末尾が /', () => {
    expect(canonicals(html)).toHaveLength(1);
    expect(canonical.startsWith(SITE_URL)).toBe(true);
    expect(canonical.endsWith('/')).toBe(true);
  });

  it('og:image が絶対 URL', () => {
    const v = metas(html, 'property', 'og:image');
    expect(v).toHaveLength(1);
    expect(v[0]).toMatch(/^https?:\/\//);
  });

  it('twitter:card が summary_large_image', () => {
    expect(metas(html, 'name', 'twitter:card')).toEqual([
      'summary_large_image',
    ]);
  });

  it('twitter: の meta は twitter:card だけ', () => {
    expect(metaNamesStartingWith(html, 'twitter:')).toEqual(['twitter:card']);
  });

  it('og:title / og:description / og:url が対応する値と一致する', () => {
    expect(metas(html, 'property', 'og:title')).toEqual([title]);
    expect(metas(html, 'property', 'og:description')).toEqual([description]);
    expect(metas(html, 'property', 'og:url')).toEqual([canonical]);
  });

  it('<script> は Vercel Analytics のものがちょうど1つだけ', () => {
    const all = scripts(html).filter(
      (s) => s.attrs.get('type') !== 'application/ld+json',
    );
    expect(all).toHaveLength(1);
    expect(all.every(isAnalyticsScript)).toBe(true);
  });
});
