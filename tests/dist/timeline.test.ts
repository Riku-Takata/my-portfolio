// T-041 の受け入れ基準 1〜7(#timeline)をビルド後の HTML で確かめる
import { assert, describe, expect, it } from 'vitest';
import { loadTimeline } from '../../src/lib/content';
import {
  formatTimelinePeriod,
  timelineKindLabel,
} from '../../src/lib/format';
import { sortLinks } from '../../src/lib/links';
import { attrs, decode, readDist } from './html';

const VOID = new Set(['img', 'br', 'meta', 'link', 'input', 'source', 'hr']);

// 属性値の中の ">" と大文字のタグ名も扱う開始タグの本体
const TAG_REST = `(?=[\\s>/])(?:"[^"]*"|'[^']*'|[^>"'])*>`;

interface El {
  from: number;
  to: number;
  tag: string;
  html: string;
}

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

function tagName(el: El): string {
  return /^<([^\s>/]+)/.exec(el.tag)?.[1].toLowerCase() ?? '';
}

// el の中(el 自身を除く)にある name 要素
function inner(el: El, name: string): El[] {
  return allElements(el.html)
    .slice(1)
    .filter((e) => tagName(e) === name);
}

function timelineSection(): El {
  const html = readDist('index.html');
  const els = allElements(html).filter(
    (e) => attrs(e.tag).get('id') === 'timeline',
  );
  expect(els).toHaveLength(1);
  return els[0];
}

function directItems(section: El): El[] {
  const ols = inner(section, 'ol');
  expect(ols).toHaveLength(1);
  const lis = inner(ols[0], 'li');
  return lis.filter(
    (li) => !lis.some((o) => o !== li && o.from < li.from && li.to <= o.to),
  );
}

describe('dist/index.html: #timeline', () => {
  it('AC-1: section で、h2 が1つあり文字が Timeline', () => {
    const section = timelineSection();
    expect(section.tag.startsWith('<section')).toBe(true);
    const h2 = inner(section, 'h2');
    expect(h2).toHaveLength(1);
    expect(text(h2[0].html)).toBe('Timeline');
  });

  it('AC-2: ol が1つで class に border-l がある', () => {
    const ols = inner(timelineSection(), 'ol');
    expect(ols).toHaveLength(1);
    const classes = (attrs(ols[0].tag).get('class') ?? '').split(/\s+/);
    expect(classes).toContain('border-l');
  });

  it('AC-3: 直下の li の数が loadTimeline() の件数と同じ', () => {
    expect(directItems(timelineSection())).toHaveLength(loadTimeline().length);
  });

  it('AC-4: 各 li の time の datetime と文字が合う', () => {
    const items = loadTimeline();
    directItems(timelineSection()).forEach((li, i) => {
      const times = inner(li, 'time');
      expect(times).toHaveLength(1);
      expect(attrs(times[0].tag).get('datetime')).toBe(items[i].period.start);
      expect(text(times[0].html)).toBe(formatTimelinePeriod(items[i].period));
    });
  });

  it('AC-5: 各 li に種別のラベル・title・org が含まれる', () => {
    const items = loadTimeline();
    directItems(timelineSection()).forEach((li, i) => {
      const t = text(li.html);
      expect(t).toContain(timelineKindLabel(items[i].kind));
      expect(t).toContain(norm(items[i].title));
      const org = items[i].org;
      if (org) expect(t).toContain(norm(org));
    });
  });

  it('AC-6: a の数と各 li の href の列が links と合う', () => {
    const items = loadTimeline();
    const section = timelineSection();
    const total = items.reduce((n, item) => n + item.links.length, 0);
    expect(inner(section, 'a')).toHaveLength(total);
    directItems(section).forEach((li, i) => {
      const hrefs = inner(li, 'a').map((a) => attrs(a.tag).get('href'));
      expect(hrefs).toEqual(sortLinks(items[i].links).map((l) => l.url));
    });
  });

  it('AC-7: a は target=_blank で rel に noopener を持つ', () => {
    for (const a of inner(timelineSection(), 'a')) {
      const a_attrs = attrs(a.tag);
      expect(a_attrs.get('target')).toBe('_blank');
      const rel = (a_attrs.get('rel') ?? '').split(/\s+/);
      expect(rel).toContain('noopener');
    }
  });
});
