import { describe, expect, it } from 'vitest';
import { allFiles, attrs, readDist } from './html';

const TAG_REST = `(?=[\\s>/])(?:"[^"]*"|'[^']*'|[^>"'])*>`;

function classes(tag: string): string[] {
  return (attrs(tag).get('class') ?? '').split(/\s+/).filter(Boolean);
}

function sectionTags(html: string, id: string): string[] {
  const re = new RegExp(`<section${TAG_REST}`, 'gi');
  return [...html.matchAll(re)]
    .map((m) => m[0])
    .filter((tag) => attrs(tag).get('id') === id);
}

const IDS = ['about', 'projects', 'timeline', 'articles'];

describe('Hero と About の間の余白 (T-032)', () => {
  const html = readDist('index.html');

  it('AC-1: id="top" の section の開始タグがちょうど1つある', () => {
    const topSections = sectionTags(html, 'top');
    expect(topSections).toHaveLength(1);
  });

  it("AC-2: #top の class から /^pb-/ に合うトークンをソートした配列が ['pb-12'] に等しい", () => {
    const topSections = sectionTags(html, 'top');
    expect(topSections).toHaveLength(1);
    const pbTokens = classes(topSections[0])
      .filter((c) => /^pb-/.test(c))
      .sort();
    expect(pbTokens).toEqual(['pb-12']);
  });

  it('AC-3: #top の class に py-16 が含まれ、/^pt-/ に合うトークンはない', () => {
    const topSections = sectionTags(html, 'top');
    expect(topSections).toHaveLength(1);
    const topClasses = classes(topSections[0]);
    expect(topClasses).toContain('py-16');
    const ptTokens = topClasses.filter((c) => /^pt-/.test(c));
    expect(ptTokens).toEqual([]);
  });

  it("AC-4: about, projects, timeline, articlesの開始タグの class のうち /^py-/ に合うトークンが ['py-12'] に等しい", () => {
    for (const id of IDS) {
      const tags = sectionTags(html, id);
      expect(tags).toHaveLength(1);
      const pyTokens = classes(tags[0])
        .filter((c) => /^py-/.test(c))
        .sort();
      expect(pyTokens).toEqual(['py-12']);
    }
  });

  it('AC-5: #top の pb- の数値と about の py- の数値が等しい', () => {
    const topSections = sectionTags(html, 'top');
    expect(topSections).toHaveLength(1);
    const topMatches = classes(topSections[0])
      .map((c) => c.match(/^pb-(\d+)$/))
      .filter((m): m is RegExpMatchArray => m !== null);
    expect(topMatches).toHaveLength(1);
    const topBottom = topMatches[0][1];

    const aboutSections = sectionTags(html, 'about');
    expect(aboutSections).toHaveLength(1);
    const aboutMatches = classes(aboutSections[0])
      .map((c) => c.match(/^py-(\d+)$/))
      .filter((m): m is RegExpMatchArray => m !== null);
    expect(aboutMatches).toHaveLength(1);
    const sectionY = aboutMatches[0][1];

    expect(topBottom).toBe(sectionY);
  });

  it('AC-6: ビルドされた CSS の中で .pb-12 が .py-16 より後に出る', () => {
    const cssFiles = allFiles().filter(
      (f) => f.startsWith('_astro/') && f.endsWith('.css'),
    );
    const results = cssFiles.map((file) => {
      const content = readDist(file);
      const pyPos = content.search(/\.py-16\s*\{/);
      const pbPos = content.search(/\.pb-12\s*\{/);
      return { file, pyPos, pbPos };
    });
    const matching = results.filter(
      (r) => r.pyPos !== -1 && r.pbPos !== -1 && r.pbPos > r.pyPos,
    );
    expect(
      matching.length,
      `Expected at least one CSS file where .pb-12 comes after .py-16. Details: ${JSON.stringify(
        results,
        null,
        2,
      )}`,
    ).toBeGreaterThanOrEqual(1);
  });
});
