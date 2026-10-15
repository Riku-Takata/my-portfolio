import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SITE_NAME, SITE_URL } from '../../src/lib/site';
import { attrs, canonicals, metas, startTags, titleTexts } from './html';

const notFoundPath = fileURLToPath(
  new URL('../../dist/404.html', import.meta.url),
);
const html = existsSync(notFoundPath)
  ? readFileSync(notFoundPath, 'utf-8')
  : '';
const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
const text = (s: string) => s.replace(/<[^>]*>/g, '').trim();

describe('dist/404.html', () => {
  it('ある', () => {
    expect(existsSync(notFoundPath)).toBe(true);
  });

  it('<h1> がちょうど1つで、テキストが「ページが見つかりません」', () => {
    expect(startTags(html, 'h1')).toHaveLength(1);
    const inner = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '';
    expect(text(inner)).toBe('ページが見つかりません');
  });

  it('main の <a> は href="/" の1つだけで、テキストが「トップへ戻る」', () => {
    const anchors = startTags(main, 'a').map(attrs);
    expect(anchors).toHaveLength(1);
    expect(anchors[0].get('href')).toBe('/');
    expect(anchors[0].has('target')).toBe(false);
    expect(anchors[0].has('rel')).toBe(false);
    const inner = main.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? '';
    expect(text(inner)).toBe('トップへ戻る');
  });

  it('title', () => {
    expect(titleTexts(html)).toEqual([`ページが見つかりません | ${SITE_NAME}`]);
  });

  it('description と og:description', () => {
    const description =
      'お探しのページは見つかりませんでした。URL が変わったか、ページが削除された可能性があります。';
    expect(metas(html, 'name', 'description')).toEqual([description]);
    expect(metas(html, 'property', 'og:description')).toEqual([description]);
  });

  it('canonical と og:url が SITE_URL/404/', () => {
    expect(canonicals(html)).toEqual([`${SITE_URL}/404/`]);
    expect(metas(html, 'property', 'og:url')).toEqual([`${SITE_URL}/404/`]);
  });
});
