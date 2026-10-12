import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resume } from '../../src/content/resume';
import { SITE_URL } from '../../src/lib/site';
import { attrs, canonicals, metas, startTags, titleTexts } from './html';

const indexPath = fileURLToPath(
  new URL('../../dist/index.html', import.meta.url),
);

describe('dist/index.html', () => {
  it('ある', () => {
    expect(existsSync(indexPath)).toBe(true);
  });

  it('<html> の lang が ja', () => {
    const html = readFileSync(indexPath, 'utf-8');
    const match = html.match(/<html\b[^>]*\blang=["']?([^"'\s>]+)/i);
    expect(match?.[1]).toBe('ja');
  });

  describe('メタ情報', () => {
    const html = readFileSync(indexPath, 'utf-8');
    const title = '高田 莉玖 (Riku Takata) | Portfolio';

    it('title', () => {
      expect(titleTexts(html)).toEqual([title]);
    });

    it('description が resume.profile.summary と一致する', () => {
      expect(metas(html, 'name', 'description')).toEqual([
        resume.profile.summary,
      ]);
    });

    it('canonical', () => {
      expect(canonicals(html)).toEqual([`${SITE_URL}/`]);
    });

    it('og:image / og:type / og:locale', () => {
      expect(metas(html, 'property', 'og:image')).toEqual([
        `${SITE_URL}/og/index.png`,
      ]);
      expect(metas(html, 'property', 'og:type')).toEqual(['website']);
      expect(metas(html, 'property', 'og:locale')).toEqual(['ja_JP']);
    });

    it('og:title / og:description / og:url', () => {
      expect(metas(html, 'property', 'og:title')).toEqual([title]);
      expect(metas(html, 'property', 'og:description')).toEqual([
        resume.profile.summary,
      ]);
      expect(metas(html, 'property', 'og:url')).toEqual([`${SITE_URL}/`]);
    });

    it('twitter:card', () => {
      expect(html).toContain(
        '<meta name="twitter:card" content="summary_large_image">',
      );
    });

    it('color-scheme と favicon', () => {
      expect(html).toContain('<meta name="color-scheme" content="light dark">');
      const icons = startTags(html, 'link')
        .map(attrs)
        .filter((a) => a.get('rel') === 'icon');
      expect(icons.map((a) => a.get('href'))).toEqual(['/favicon.png']);
    });

    it('<h1> がちょうど1つ', () => {
      expect(startTags(html, 'h1')).toHaveLength(1);
    });
  });
});
