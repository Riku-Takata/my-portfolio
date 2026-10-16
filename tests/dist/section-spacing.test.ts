import { describe, expect, it } from 'vitest';
import { attrs, readDist } from './html';

// 属性値の中の ">" と大文字のタグ名も扱う開始タグの本体
const TAG_REST = `(?=[\\s>/])(?:"[^"]*"|'[^']*'|[^>"'])*>`;

function classes(tag: string): string[] {
  return (attrs(tag).get('class') ?? '').split(/\s+/).filter(Boolean);
}

function sectionById(
  html: string,
  id: string,
): { tag: string; body: string } {
  const re = new RegExp(`<section${TAG_REST}`, 'gi');
  const sections = [...html.matchAll(re)].filter(
    (m) => attrs(m[0]).get('id') === id,
  );
  if (sections.length === 0) {
    throw new Error(`Section with id="${id}" not found`);
  }
  const m = sections[0];
  const close = html.indexOf('</section', m.index);
  const body = close === -1 ? '' : html.slice(m.index, close);
  return { tag: m[0], body };
}

const IDS = ['about', 'projects', 'timeline', 'articles'];

describe('dist/index.html: セクションの余白', () => {
  const html = readDist('index.html');

  it('AC-1: 各 id の section の開始タグがちょうど1つあり、その class に py-12 を含む', () => {
    const re = new RegExp(`<section${TAG_REST}`, 'gi');
    const allSections = [...html.matchAll(re)];
    for (const id of IDS) {
      const matched = allSections.filter((m) => attrs(m[0]).get('id') === id);
      expect(matched).toHaveLength(1);
      expect(classes(matched[0][0])).toContain('py-12');
    }
  });

  it('AC-2: 5つの section の class から /^py-/ に合うものを取り出してソートした配列が、5つとも [\'py-12\'] に等しい', () => {
    for (const id of IDS) {
      const { tag } = sectionById(html, id);
      const pyClasses = classes(tag)
        .filter((c) => /^py-/.test(c))
        .sort();
      expect(pyClasses).toEqual(['py-12']);
    }
  });

  it('AC-3: id top の section がちょうど1つあり、その class に py-16 を含む', () => {
    const re = new RegExp(`<section${TAG_REST}`, 'gi');
    const allSections = [...html.matchAll(re)];
    const topSections = allSections.filter(
      (m) => attrs(m[0]).get('id') === 'top',
    );
    expect(topSections).toHaveLength(1);
    expect(classes(topSections[0][0])).toContain('py-16');
  });

  it('AC-4: 各 section の body の中の h2 が1つあり、5つの h2 の class 属性がすべて等しく、必要なクラスを含む', () => {
    const h2ClassStrings: string[] = [];
    for (const id of IDS) {
      const { body } = sectionById(html, id);
      const h2Regex = new RegExp(`<h2${TAG_REST}`, 'gi');
      const h2s = [...body.matchAll(h2Regex)];
      expect(h2s).toHaveLength(1);
      const h2Tag = h2s[0][0];
      const classAttr = attrs(h2Tag).get('class') ?? '';
      h2ClassStrings.push(classAttr);
      const h2Classes = classes(h2Tag);
      expect(h2Classes).toContain('text-lg');
      expect(h2Classes).toContain('font-semibold');
      expect(h2Classes).toContain('mb-6');
    }
    expect(new Set(h2ClassStrings).size).toBe(1);
  });

  it('AC-5: 5つの section の開始タグと h2 の classes のどれも禁止クラスに合わない', () => {
    const forbidden = /^(shadow|bg-gradient-|bg-linear-|from-|via-|to-)/;
    const checkNoForbidden = (clsList: string[]) => {
      for (const cls of clsList) {
        const base = cls.slice(cls.lastIndexOf(':') + 1);
        expect(base).not.toMatch(forbidden);
      }
    };

    for (const id of IDS) {
      const { tag, body } = sectionById(html, id);
      const h2Regex = new RegExp(`<h2${TAG_REST}`, 'gi');
      const h2s = [...body.matchAll(h2Regex)];
      expect(h2s).toHaveLength(1);
      checkNoForbidden(classes(tag));
      checkNoForbidden(classes(h2s[0][0]));
    }
  });
});
