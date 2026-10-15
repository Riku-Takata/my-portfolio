import { describe, expect, it } from 'vitest';
import { resume } from '../../src/content/resume';
import {
  buildCreativeWorkJsonLd,
  buildPersonJsonLd,
  serializeJsonLd,
} from '../../src/lib/jsonld';
import { SITE_URL } from '../../src/lib/site';

describe('buildPersonJsonLd', () => {
  const p = buildPersonJsonLd();
  it('Person の基本項目', () => {
    expect(p['@context']).toBe('https://schema.org');
    expect(p['@type']).toBe('Person');
    expect(p.name).toBe(resume.profile.nameEn);
    expect(p.alternateName).toBe(resume.profile.nameJa);
    expect(p.url).toBe(`${SITE_URL}/`);
  });
  it('sameAs は github, x の順', () => {
    expect(p.sameAs).toEqual([
      resume.profile.links.github,
      resume.profile.links.x,
    ]);
  });
  it('affiliation は Organization のオブジェクト', () => {
    expect(p.affiliation).toEqual({
      '@type': 'Organization',
      name: resume.profile.affiliation,
    });
  });
});

describe('buildCreativeWorkJsonLd', () => {
  const w = buildCreativeWorkJsonLd({
    title: 'T',
    summary: 'S',
    period: { start: '2024-10', end: 'present' },
  });
  it('frontmatter の値を使う', () => {
    expect(w['@type']).toBe('CreativeWork');
    expect(w.name).toBe('T');
    expect(w.description).toBe('S');
    expect(w.dateCreated).toBe('2024-10');
  });
  it('author は Person のオブジェクト', () => {
    expect(w.author).toEqual({
      '@type': 'Person',
      name: resume.profile.nameEn,
    });
    expect(w.author.name).toBe(buildPersonJsonLd().name);
  });
});

describe('serializeJsonLd', () => {
  it('< をエスケープし、parse すると元に戻る', () => {
    const out = serializeJsonLd({ a: '</script>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out)).toEqual({ a: '</script>' });
  });
});
