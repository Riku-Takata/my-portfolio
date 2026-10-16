// セクションの配置と #timeline をビルド後の HTML で確かめる。期間と種別の関数の振る舞いは tests/unit/format.test.ts で確かめる
import { assert, describe, expect, it } from 'vitest';
import { loadTimeline } from '../../src/lib/content';
import {
  formatTimelinePeriod,
  timelineKindLabel,
} from '../../src/lib/format';
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

let cache: { html: string; timeline: El } | undefined;
function page() {
  if (!cache) {
    const html = readDist('index.html');
    const timeline = elementsWithId(html, 'timeline');
    expect(timeline).toHaveLength(1);
    cache = { html, timeline: timeline[0] };
  }
  return cache;
}

describe('dist/index.html: timeline', () => {
  it('#timeline は section で、ただ1つの main の中にある', () => {
    const { html, timeline } = page();
    expect(timeline.tag.startsWith('<section')).toBe(true);
    expect(startTags(html, 'main')).toHaveLength(1);
    const main = outer(html, html.search(/<main(?=[\s>/])/i));
    for (const el of [timeline]) {
      expect(el.from).toBeGreaterThan(main.from);
      expect(el.to).toBeLessThan(main.to);
    }
  });

  it('id は top, about, projects, timeline, articles の順に出てくる', () => {
    const { html } = page();
    const starts = ['top', 'about', 'projects', 'timeline', 'articles'].map(
      (id) => {
        const els = elementsWithId(html, id);
        expect(els, id).toHaveLength(1);
        return els[0].from;
      },
    );
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it('#timeline の h2 が1つあり、見出しの文字が合う', () => {
    const { timeline } = page();
    const e = inner(timeline, 'h2');
    expect(e).toHaveLength(1);
    expect(text(e[0].html)).toBe('Timeline');
  });

  it('#timeline の ol の直下の li が loadTimeline() の件数と同じ', () => {
    const { timeline } = page();
    const ols = inner(timeline, 'ol');
    expect(ols).toHaveLength(1);
    const lis = inner(ols[0], 'li');
    const direct = lis.filter(
      (li) =>
        !lis.some((o) => o !== li && o.from < li.from && li.to <= o.to),
    );
    expect(direct).toHaveLength(loadTimeline().length);
  });

  it('#timeline の各 li の time の datetime と表示が項目と一致する', () => {
    const { timeline } = page();
    const items = loadTimeline();
    const lis = inner(inner(timeline, 'ol')[0], 'li');
    expect(lis).toHaveLength(items.length);
    lis.forEach((li, i) => {
      const times = inner(li, 'time');
      expect(times).toHaveLength(1);
      const datetime = attrs(times[0].tag).get('datetime') ?? '';
      expect(datetime).toBe(items[i].period.start);
      expect(text(times[0].html)).toBe(formatTimelinePeriod(items[i].period));
    });
  });

  it('#timeline の各 li に種別・title・org が含まれる', () => {
    const { timeline } = page();
    const items = loadTimeline();
    const lis = inner(inner(timeline, 'ol')[0], 'li');
    lis.forEach((li, i) => {
      const t = text(li.html);
      const e = items[i];
      expect(t).toContain(timelineKindLabel(e.kind));
      expect(t).toContain(norm(e.title));
      if (e.org) expect(t).toContain(norm(e.org));
    });
  });

  it('#timeline は ol の縦線だけで装飾する', () => {
    const { timeline } = page();
    const ol = inner(timeline, 'ol')[0];
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
    for (const el of allElements(timeline.html)) {
      if (el.from === ol.from) continue;
      for (const token of classes(el.tag)) {
        expect(token, el.tag).not.toMatch(forbidden);
      }
    }
  });
});
