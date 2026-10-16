import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadFeaturedProjects } from '../../src/lib/content';
import { formatExperiencePeriod } from '../../src/lib/format';
import { linkLabel, sortLinks } from '../../src/lib/links';
import { attrs, decode, distDir, readDist, startTags } from './html';

const featured = loadFeaturedProjects();

const html = readDist('index.html');
const sectionStart = html.indexOf('<section id="projects"');
const sectionEnd = html.indexOf('</section>', sectionStart);
const section =
  sectionStart >= 0 ? html.slice(sectionStart, sectionEnd + 10) : '';
const articles = [...section.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(
  (m) => m[0],
);

function text(s: string): string {
  return decode(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

function linkTexts(fragment: string): string[] {
  return [...fragment.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((m) =>
    decode(m[1].replace(/<[^>]*>/g, '')).trim(),
  );
}

function badges(
  article: string,
): { raw: string; text: string; start: number }[] {
  return [...article.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span>/g)].flatMap(
    (m) => {
      const classAttr = attrs(`<span ${m[1]}>`).get('class') ?? '';
      const tokens = classAttr.split(/\s+/);
      if (!tokens.includes('font-mono')) return [];
      return [
        {
          raw: m[0],
          text: text(m[2]),
          start: m.index ?? 0,
        },
      ];
    },
  );
}

function paragraphs(
  article: string,
): {
  tag: string;
  text: string;
  start: number;
  attrs: Map<string, string>;
}[] {
  return [...article.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)].map((m) => ({
    tag: `<p ${m[1]}>`,
    text: text(m[2]),
    start: m.index ?? 0,
    attrs: attrs(`<p ${m[1]}>`),
  }));
}

describe('dist/index.html の #projects', () => {
  it('#projects が <main> の中に 1 つあり、#about より後ろにある', () => {
    const ids = [...html.matchAll(/<[a-z][^>]*>/g)]
      .map((m) => m[0])
      .filter((t) => attrs(t).get('id') === 'projects');
    expect(ids).toHaveLength(1);
    expect(section).not.toBe('');
    const pos = html.indexOf('id="projects"');
    expect(pos).toBeGreaterThan(html.indexOf('<main'));
    expect(pos).toBeLessThan(html.indexOf('</main>'));
    expect(pos).toBeGreaterThan(html.indexOf('id="about"'));
  });

  it('AC-1: #projects の <h2> の text が Featured Projects である', () => {
    const h2Match = section.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/);
    expect(h2Match).not.toBeNull();
    expect(text(h2Match![1])).toBe('Featured Projects');
  });

  it('AC-2: <article> の数が featured の件数と同じ', () => {
    expect(articles).toHaveLength(featured.length);
  });

  it('AC-3: 各カードに <h3> がちょうど1つあり、title と等しい', () => {
    articles.forEach((article, i) => {
      const p = featured[i];
      const h3s = [...article.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)];
      expect(h3s).toHaveLength(1);
      expect(text(h3s[0][1])).toBe(p.title);
    });
  });

  it('AC-4: 各カードに context.label と等しい Badge がちょうど1つある', () => {
    articles.forEach((article, i) => {
      const p = featured[i];
      const bs = badges(article);
      const matches = bs.filter((b) => b.text === p.context.label);
      expect(matches).toHaveLength(1);
    });
  });

  it('AC-5: 各カードの文字に formatExperiencePeriod(context.period) を含む', () => {
    articles.forEach((article, i) => {
      const p = featured[i];
      const periodStr = formatExperiencePeriod(p.context.period);
      expect(text(article)).toContain(periodStr);
    });
  });

  it('AC-6: text が summary の <p> がちょうど1つある', () => {
    articles.forEach((article, i) => {
      const p = featured[i];
      const ps = paragraphs(article);
      const matches = ps.filter((item) => item.text === p.summary);
      expect(matches).toHaveLength(1);
    });
  });

  it('AC-7: text が highlight の <p> がちょうど1つあり、所定の class を持つ', () => {
    articles.forEach((article, i) => {
      const p = featured[i];
      const ps = paragraphs(article);
      const matches = ps.filter((item) => item.text === p.highlight);
      expect(matches).toHaveLength(1);
      const classAttr = matches[0].attrs.get('class') ?? '';
      const tokens = classAttr.split(/\s+/);
      expect(tokens).toContain('font-medium');
      expect(tokens).toContain('border-l-2');
      expect(tokens).toContain('pl-3');
      expect(tokens.some((t) => t.startsWith('border-zinc-'))).toBe(true);
    });
  });

  it('AC-8: context.label 以外の Badge の文字の並びが techStack と等しい', () => {
    articles.forEach((article, i) => {
      const p = featured[i];
      const bs = badges(article);
      const labelIndex = bs.findIndex((b) => b.text === p.context.label);
      expect(labelIndex).toBeGreaterThanOrEqual(0);
      const techBadges = bs.filter((_, idx) => idx !== labelIndex);
      expect(techBadges.map((b) => b.text)).toEqual(p.techStack);
    });
  });

  it('AC-9: 各要素の先頭位置が所定の順に並ぶ', () => {
    articles.forEach((article, i) => {
      const p = featured[i];
      const bs = badges(article);
      const labelBadge = bs.find((b) => b.text === p.context.label);
      expect(labelBadge).toBeDefined();
      const labelPos = labelBadge!.start;

      const periodStr = formatExperiencePeriod(p.context.period);
      const periodPos = article.indexOf(periodStr);
      expect(periodPos).toBeGreaterThanOrEqual(0);

      const h3Pos = article.indexOf('<h3');
      expect(h3Pos).toBeGreaterThanOrEqual(0);

      const ps = paragraphs(article);
      const summaryMatch = ps.find((item) => item.text === p.summary);
      expect(summaryMatch).toBeDefined();
      const summaryPos = summaryMatch!.start;

      const highlightMatch = ps.find((item) => item.text === p.highlight);
      expect(highlightMatch).toBeDefined();
      const highlightPos = highlightMatch!.start;

      const firstTechBadge = bs.find((b) => b.text === p.techStack[0]);
      expect(firstTechBadge).toBeDefined();
      const firstTechPos = firstTechBadge!.start;

      expect(labelPos).toBeLessThan(periodPos);
      expect(periodPos).toBeLessThan(h3Pos);
      expect(h3Pos).toBeLessThan(summaryPos);
      expect(summaryPos).toBeLessThan(highlightPos);
      expect(highlightPos).toBeLessThan(firstTechPos);

      if (p.links.length > 0) {
        const firstLinkPos = article.indexOf('<a');
        expect(firstLinkPos).toBeGreaterThanOrEqual(0);
        expect(firstTechPos).toBeLessThan(firstLinkPos);
      }
    });
  });

  it('AC-10: <a> の数が links の件数と等しく、属性とテキストが一致する', () => {
    articles.forEach((article, i) => {
      const p = featured[i];
      const aMatches = [...article.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
      expect(aMatches).toHaveLength(p.links.length);
      expect(linkTexts(article)).toHaveLength(p.links.length);
      const sorted = sortLinks(p.links);
      sorted.forEach((link, j) => {
        const m = aMatches[j];
        const aAttr = attrs(`<a ${m[1]}>`);
        expect(aAttr.get('href')).toBe(link.url);
        expect(text(m[2])).toContain(link.label ?? linkLabel(link.media));
        expect(aAttr.get('target')).toBe('_blank');
        expect(aAttr.get('rel') ?? '').toContain('noopener');
      });
    });
  });

  it('AC-11: links が空のプロジェクトには <a> がない', () => {
    articles.forEach((article, i) => {
      const p = featured[i];
      if (p.links.length === 0) {
        expect(startTags(article, 'a')).toHaveLength(0);
      }
    });
  });

  it('AC-12: <article> が <a> の中に入っておらず、<h3> の中に <a> がない', () => {
    for (const article of articles) {
      const h3s = [...article.matchAll(/<h3\b[\s\S]*?<\/h3>/g)];
      for (const h3 of h3s) {
        expect(h3[0]).not.toContain('<a');
      }
    }

    let aDepth = 0;
    for (const m of html.matchAll(/<(?:\/?a\b|article\b)[^>]*>/g)) {
      const tag = m[0];
      if (tag.startsWith('<article')) {
        expect(aDepth).toBe(0);
      } else if (tag.startsWith('</a')) {
        aDepth--;
      } else if (tag.startsWith('<a')) {
        aDepth++;
      }
    }
  });

  it('AC-13: dist/index.html に /projects/ へのリンクと「技術解説を読む」がない', () => {
    const allAHrefs = startTags(html, 'a').map(
      (t) => attrs(t).get('href') ?? '',
    );
    expect(allAHrefs.filter((h) => h.startsWith('/projects/'))).toHaveLength(0);
    expect(html).not.toContain('技術解説を読む');
  });

  it('AC-14: 詳細ページがビルド結果に存在する', () => {
    expect(
      existsSync(path.join(distDir, 'projects/satellite-insar/index.html')),
    ).toBe(true);
    expect(
      existsSync(path.join(distDir, 'projects/rag-knowledge-base/index.html')),
    ).toBe(true);
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
