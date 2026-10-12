import { describe, expect, it } from 'vitest';
import { resume } from '../../src/content/resume';
import { attrs, decode, htmlFiles, readDist } from './html';

const VOID = new Set(['img', 'br', 'meta', 'link', 'input', 'source', 'hr']);

// 属性値の中の ">" と大文字のタグ名も扱う開始タグの本体
const TAG_REST = `(?=[\\s>/])(?:"[^"]*"|'[^']*'|[^>"'])*>`;

function startTags(html: string, name: string): string[] {
  return [...html.matchAll(new RegExp(`<${name}${TAG_REST}`, 'gi'))].map(
    (m) => m[0],
  );
}

interface El {
  start: number;
  end: number;
  tag: string;
  html: string;
}

function text(s: string): string {
  const raw = s
    .replace(/<\/?[a-zA-Z](?:"[^"]*"|'[^']*'|[^>"'])*>/g, '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)));
  return decode(raw).replace(/\s+/g, ' ').trim();
}

function outer(html: string, start: number): El {
  const open = new RegExp(`^<[a-zA-Z][^\\s>/]*${TAG_REST}`).exec(
    html.slice(start),
  );
  if (!open) throw new Error(`no tag at ${start}`);
  const tag = open[0];
  const name = /^<([^\s>/]+)/.exec(tag)?.[1].toLowerCase() ?? '';
  if (VOID.has(name) || tag.endsWith('/>')) {
    return { start, end: start + tag.length, tag, html: tag };
  }
  const re = new RegExp(`<(/?)${name}(?=[\\s>/])[^>]*>`, 'gi');
  re.lastIndex = start;
  let depth = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] === '/' ? -1 : 1;
    if (depth === 0) {
      const end = m.index + m[0].length;
      return { start, end, tag, html: html.slice(start, end) };
    }
  }
  throw new Error(`unclosed <${name}> at ${start}`);
}

function allElements(fragment: string): El[] {
  return [
    ...fragment.matchAll(new RegExp(`<[a-zA-Z][^\\s>/]*${TAG_REST}`, 'g')),
  ].map((m) => outer(fragment, m.index));
}

function elementsWithId(html: string, id: string): El[] {
  return allElements(html).filter((e) => attrs(e.tag).get('id') === id);
}

function classes(tag: string): string[] {
  return (attrs(tag).get('class') ?? '').split(/\s+/).filter((c) => c !== '');
}

function links(fragment: string) {
  return [
    ...fragment.matchAll(new RegExp(`<a${TAG_REST}[\\s\\S]*?</a\\s*>`, 'gi')),
  ].map((m) => {
    const tag = startTags(m[0], 'a')[0] ?? '';
    const a = attrs(tag);
    return {
      tag,
      href: a.get('href'),
      target: a.get('target'),
      rel: a.get('rel'),
      text: text(m[0]),
      inner: m[0],
    };
  });
}

const html = readDist('index.html');
const top = elementsWithId(html, 'top');
const about = elementsWithId(html, 'about');
const hero = top[0]?.html ?? '';
const aboutHtml = about[0]?.html ?? '';
const { profile } = resume;

describe('dist: トップの Hero と About', () => {
  it('AC-1: id="top" の要素がちょうど1つ', () => {
    expect(top).toHaveLength(1);
  });

  it('AC-24: main は1つで top と about を含み、top は section', () => {
    const mains = startTags(html, 'main');
    expect(mains).toHaveLength(1);
    const main = outer(html, html.indexOf(mains[0]));
    expect(top).toHaveLength(1);
    expect(about).toHaveLength(1);
    expect(top[0].start).toBeGreaterThan(main.start);
    expect(top[0].end).toBeLessThanOrEqual(main.end);
    expect(about[0].start).toBeGreaterThan(main.start);
    expect(about[0].end).toBeLessThanOrEqual(main.end);
    expect(/^<section\b/i.test(top[0].tag)).toBe(true);
  });

  const h1Tags = startTags(html, 'h1');
  const h1 = h1Tags.length === 1 ? outer(html, html.indexOf(h1Tags[0])) : null;

  it('AC-2: h1 は1つで Hero の中、テキストは nameJa', () => {
    expect(h1Tags).toHaveLength(1);
    expect(top).toHaveLength(1);
    expect(h1).not.toBeNull();
    expect(h1!.start).toBeGreaterThan(top[0].start);
    expect(h1!.end).toBeLessThanOrEqual(top[0].end);
    expect(text(h1!.html)).toBe(profile.nameJa);
  });

  it('AC-3: h1 の class', () => {
    expect(classes(h1?.tag ?? '')).toEqual(
      expect.arrayContaining(['text-3xl', 'font-semibold', 'tracking-tight']),
    );
  });

  it('AC-4: h1 に nameEn が入っていない', () => {
    expect(h1).not.toBeNull();
    expect(text(h1!.html)).not.toContain(profile.nameEn);
  });

  const heroEls = allElements(hero);
  const heroOffset = top[0]?.start ?? 0;
  const inH1 = (e: El) =>
    h1 !== null &&
    e.start + heroOffset >= h1.start &&
    e.start + heroOffset < h1.end;

  it('AC-5: h1 の外に nameEn の要素がある', () => {
    const found = heroEls.filter(
      (e) => !inH1(e) && text(e.html) === profile.nameEn,
    );
    expect(found.length).toBeGreaterThan(0);
    expect(classes(found[0].tag)).toEqual(
      expect.arrayContaining(['text-sm', 'text-zinc-500', 'dark:text-zinc-400']),
    );
  });

  it('AC-6: affiliation の要素がある', () => {
    expect(heroEls.some((e) => text(e.html) === profile.affiliation)).toBe(true);
  });

  it('AC-7: focus の要素がある', () => {
    expect(
      heroEls.some(
        (e) =>
          JSON.stringify(
            text(e.html)
              .split('·')
              .map((s) => s.trim()),
          ) === JSON.stringify(profile.focus),
      ),
    ).toBe(true);
  });

  const heroLinks = links(hero);

  it('AC-8: Hero の4つのリンク', () => {
    expect(heroLinks.map((l) => [l.href, l.text])).toEqual([
      [profile.links.github, 'GitHub'],
      [profile.links.x, 'X'],
      ['mailto:' + profile.links.email, 'Mail'],
      ['/resume.pdf', 'Resume (PDF)'],
    ]);
  });

  it('AC-9: アイコンの svg は aria-hidden', () => {
    expect(heroLinks).toHaveLength(4);
    for (const l of heroLinks) {
      expect(startTags(l.inner, 'svg').length).toBeGreaterThanOrEqual(1);
    }
    const bad = startTags(hero, 'svg').filter(
      (t) => attrs(t).get('aria-hidden') !== 'true',
    );
    expect(bad).toEqual([]);
  });

  it('AC-10: target と rel', () => {
    expect(heroLinks).toHaveLength(4);
    for (const l of heroLinks.slice(0, 2)) {
      expect(l.target).toBe('_blank');
      expect(l.rel).toBe('noopener noreferrer');
    }
    for (const l of heroLinks.slice(2)) {
      expect(attrs(l.tag).has('target')).toBe(false);
    }
  });

  it('AC-11: img と picture がない', () => {
    expect(startTags(hero, 'img')).toEqual([]);
    expect(startTags(hero, 'picture')).toEqual([]);
  });

  it('AC-12: about は1つで top より後', () => {
    expect(about).toHaveLength(1);
    expect(top).toHaveLength(1);
    expect(about[0].start).toBeGreaterThan(top[0].start);
  });

  it('AC-13: about の h2 は About', () => {
    const h2 = allElements(aboutHtml).filter((e) => /^<h2\b/i.test(e.tag));
    expect(h2).toHaveLength(1);
    expect(text(h2[0].html)).toBe('About');
  });

  const ps = allElements(aboutHtml).filter((e) => /^<p\b/i.test(e.tag));

  it('AC-14: about の p は resume.about と同じ', () => {
    expect(ps.map((e) => text(e.html))).toEqual(resume.about);
  });

  it('AC-15: about の p の class', () => {
    expect(ps.length).toBeGreaterThan(0);
    for (const p of ps) {
      expect(classes(p.tag)).toEqual(
        expect.arrayContaining(['text-base', 'leading-7']),
      );
    }
  });

  it('AC-19: デモの出力がない', () => {
    const demo = allElements(html)
      .map((e) => e.tag)
      .filter((t) => attrs(t).has('data-demo'));
    const ext = links(html)
      .filter((l) => l.href === 'http://example.com/')
      .map((l) => l.tag);
    expect([...demo, ...ext]).toEqual([]);
  });
});

describe('dist: 全ページの target="_blank"', () => {
  it('AC-20: rel に noopener がある', () => {
    const bad = htmlFiles().flatMap((f) =>
      startTags(readDist(f), 'a')
        .filter((t) => {
          const a = attrs(t);
          return (
            a.get('target') === '_blank' &&
            !(a.get('rel') ?? '').split(/\s+/).includes('noopener')
          );
        })
        .map((t) => `${f}: ${t}`),
    );
    expect(bad).toEqual([]);
  });
});
