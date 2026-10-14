import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SITE_URL } from '../../src/lib/site';
import { distDir, readDist } from './html';

const projectsDir = fileURLToPath(
  new URL('../../src/content/projects/', import.meta.url),
);
const slugs = readdirSync(projectsDir)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.replace(/\.mdx$/, ''));

function locsIn(xml: string, parent: string): string[] {
  return [
    ...xml.matchAll(new RegExp(`<${parent}>\\s*<loc>([^<]*)</loc>`, 'g')),
  ].map((m) => m[1].trim());
}

function allLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1].trim());
}

const indexXml = readDist('sitemap-index.xml');
const sitemapLocs = locsIn(indexXml, 'sitemap');
const sitemapFiles = sitemapLocs.map((l) => l.slice(SITE_URL.length));
const urlLocs = sitemapFiles.flatMap((rel) =>
  locsIn(readDist(rel), 'url').map((loc) => ({ file: rel, loc })),
);

describe('sitemap', () => {
  it('AC-1: index の参照先が dist にある', () => {
    expect(sitemapLocs.length).toBeGreaterThan(0);
    const bad = sitemapLocs.filter((l) => !l.startsWith(`${SITE_URL}/`));
    expect(bad).toEqual([]);
    const missing = sitemapFiles.filter(
      (rel) => !existsSync(path.join(distDir, rel)),
    );
    expect(missing).toEqual([]);
  });

  it('AC-2: トップページがある', () => {
    expect(urlLocs.map((u) => u.loc)).toContain(`${SITE_URL}/`);
  });

  it.each(slugs)('AC-3: projects/%s/ がある', (slug) => {
    expect(urlLocs.map((u) => u.loc)).toContain(
      `${SITE_URL}/projects/${slug}/`,
    );
  });

  it('AC-4: /og/ を含む loc がない', () => {
    const files = ['sitemap-index.xml', ...sitemapFiles];
    const violations = files.flatMap((file) =>
      allLocs(readDist(file))
        .filter((l) => l.includes('/og/'))
        .map((l) => `${file}: ${l}`),
    );
    expect(violations).toEqual([]);
  });

  it('AC-14: HTML のページだけが入っている', () => {
    const banned = ['/og/', '/fonts/', '/404', 'robots.txt'];
    const violations = urlLocs
      .filter(
        ({ loc }) => !loc.endsWith('/') || banned.some((s) => loc.includes(s)),
      )
      .map(({ file, loc }) => `${file}: ${loc}`);
    expect(violations).toEqual([]);
  });
});

describe('robots.txt', () => {
  it('AC-5: 必要な行がある', () => {
    expect(existsSync(path.join(distDir, 'robots.txt'))).toBe(true);
    const lines = readDist('robots.txt')
      .split(/\r?\n/)
      .map((l) => l.trim());
    expect(lines).toContain('User-agent: *');
    expect(lines).toContain('Allow: /');
    expect(lines).toContain(`Sitemap: ${SITE_URL}/sitemap-index.xml`);
  });
});
