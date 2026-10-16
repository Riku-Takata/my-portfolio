// T-014 の受け入れ基準 8〜17(配置、#experience)をビルド後の HTML で確かめる。期間と種別の関数の振る舞いは tests/unit/format.test.ts で確かめる
import { assert, describe, expect, it } from 'vitest';
import { resume } from '../../src/content/resume';
import { sortExperience } from '../../src/lib/format';
import { attrs, decode, readDist } from './html';

const VOID = new Set(['img', 'br', 'meta', 'link', 'input', 'source', 'hr']);

// 属性値の中の ">" と大文字のタグ名も扱う開始タグの本体
const TAG_REST = `(?=[\\s>/])(?:"[^"]*"|'[^']*'|[^>"'])*>`;

function startTags(html: string, name: string): string[] {
  return [...html.matchAll(new RegExp(`<${name}${TAG_REST}`, 'gi'))].map(
    (m) => m[0],
  );
}

interface El {
  from: number;
  to: number;
  tag: string;
  html: string;
}

// 受け入れ基準の「テキスト」と同じく、連続する空白を1つにまとめて trim する
function norm(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function text(s: string): string {
  const raw = s
    .replace(/<\/?[a-zA-Z](?:"[^"]*"|'[^']*'|[^>"'])*>/g, '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)));
  return norm(decode(raw));
}

function outer(html: string, start: number): El {
  const open = new RegExp(`^<[a-zA-Z][^\\s>/]*${TAG_REST}`).exec(
    html.slice(start),
  );
  assert(open, `no tag at ${start}`);
  const tag = open[0];
  const name = /^<([^\s>/]+)/.exec(tag)?.[1].toLowerCase() ?? '';
  if (VOID.has(name) || tag.endsWith('/>')) {
    return { from: start, to: start + tag.length, tag, html: tag };
  }
  const re = new RegExp(`<(/?)${name}(?=[\\s>/])[^>]*>`, 'gi');
  re.lastIndex = start;
  let depth = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] === '/' ? -1 : 1;
    if (depth === 0) {
      const end = m.index + m[0].length;
      return { from: start, to: end, tag, html: html.slice(start, end) };
    }
  }
  return assert.fail(`unclosed <${name}> at ${start}`);
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

function tagName(el: El): string {
  return /^<([^\s>/]+)/.exec(el.tag)?.[1].toLowerCase() ?? '';
}

// el の中(el 自身を除く)にある name 要素
function inner(el: El, name: string): El[] {
  return allElements(el.html)
    .slice(1)
    .filter((e) => tagName(e) === name);
}

let cache: { html: string; experience: El } | undefined;
function page() {
  if (!cache) {
    const html = readDist('index.html');
    const experience = elementsWithId(html, 'experience');
    expect(experience).toHaveLength(1);
    cache = { html, experience: experience[0] };
  }
  return cache;
}

describe('dist/index.html: experience', () => {
  it('#experience は section で、ただ1つの main の中にある', () => {
    const { html, experience } = page();
    expect(experience.tag.startsWith('<section')).toBe(true);
    expect(startTags(html, 'main')).toHaveLength(1);
    const main = outer(html, html.search(/<main(?=[\s>/])/i));
    for (const el of [experience]) {
      expect(el.from).toBeGreaterThan(main.from);
      expect(el.to).toBeLessThan(main.to);
    }
  });

  it('id は top, about, projects, experience, articles の順に出てくる', () => {
    const { html } = page();
    const starts = ['top', 'about', 'projects', 'experience', 'articles'].map(
      (id) => {
        const els = elementsWithId(html, id);
        expect(els, id).toHaveLength(1);
        return els[0].from;
      },
    );
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it('#experience の h2 が1つあり、見出しの文字が合う', () => {
    const { experience } = page();
    const e = inner(experience, 'h2');
    expect(e).toHaveLength(1);
    expect(text(e[0].html)).toBe('Experience & Education');
  });

  it('#experience の ol の直下の li が resume.experience の件数と同じ', () => {
    const { experience } = page();
    const ols = inner(experience, 'ol');
    expect(ols).toHaveLength(1);
    const lis = inner(ols[0], 'li');
    const direct = lis.filter(
      (li) =>
        !lis.some((o) => o !== li && o.from < li.from && li.to <= o.to),
    );
    expect(direct).toHaveLength(resume.experience.length);
  });

  it('#experience の各 li の time の datetime と表示が新しい順の経歴と一致する', () => {
    const { experience } = page();
    const sorted = sortExperience(resume.experience);
    const lis = inner(inner(experience, 'ol')[0], 'li');
    expect(lis).toHaveLength(sorted.length);
    lis.forEach((li, i) => {
      const times = inner(li, 'time');
      expect(times).toHaveLength(1);
      const datetime = attrs(times[0].tag).get('datetime') ?? '';
      expect(datetime).toBe(sorted[i].start);
      expect(datetime).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
      // 期間の文字の形は tests/unit/format.test.ts で確かめる。ここでは経歴の年月が出ていることを見る
      const shown = text(times[0].html);
      const end = (sorted[i] as { end?: string }).end;
      for (const ym of [sorted[i].start, end]) {
        if (ym === undefined || !/^\d{4}-\d{2}$/.test(ym)) continue;
        expect(shown).toContain(ym.slice(0, 4));
        expect(shown).toContain(ym.slice(5, 7));
      }
    });
  });

  it('#experience の各 li に種別・title・org・note が含まれる', () => {
    const { experience } = page();
    const sorted = sortExperience(resume.experience);
    const lis = inner(inner(experience, 'ol')[0], 'li');
    lis.forEach((li, i) => {
      const t = text(li.html);
      const e = sorted[i];
      // 種別と表示名の対応は tests/unit/format.test.ts で確かめる
      expect(t.toLowerCase()).toContain(e.kind);
      expect(t).toContain(norm(e.title));
      expect(t).toContain(norm(e.org));
      const note = (e as { note?: string }).note;
      if (note) expect(t).toContain(norm(note));
    });
  });

  it('#experience は ol の縦線だけで装飾する', () => {
    const { experience } = page();
    const ol = inner(experience, 'ol')[0];
    const c = classes(ol.tag);
    for (const token of [
      'border-l',
      'border-zinc-200',
      'dark:border-zinc-800',
    ]) {
      expect(c).toContain(token);
    }
    const forbidden =
      /^(border|border-.*|dark:border-.*|rounded.*|shadow.*|ring.*|bg-.*|dark:bg-.*)$/;
    for (const el of allElements(experience.html)) {
      if (el.from === ol.from) continue;
      for (const token of classes(el.tag)) {
        expect(token, el.tag).not.toMatch(forbidden);
      }
    }
  });
});
