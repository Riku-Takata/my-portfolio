import { describe, expect, it } from 'vitest';
import { formatDate } from '../../src/lib/format';
import { attrs, decode, readDist } from './html';

const VOID = new Set(['img', 'br', 'meta', 'link', 'input', 'source', 'hr']);

// 属性値の中の ">" と大文字のタグ名も扱う開始タグの本体
const TAG_REST = `(?=[\\s>/])(?:"[^"]*"|'[^']*'|[^>"'])*>`;

interface El {
  start: number;
  end: number;
  tag: string;
  html: string;
}

// 受け入れ基準の「テキスト」と同じく、連続する空白を1つにまとめて trim する
function norm(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

const NAMED: Record<string, string> = { '&copy;': '©', '&nbsp;': ' ' };

function text(s: string): string {
  const raw = s
    .replace(/<\/?[a-zA-Z](?:"[^"]*"|'[^']*'|[^>"'])*>/g, '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&(?:copy|nbsp);/g, (m) => NAMED[m]);
  return norm(decode(raw));
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

function byName(els: El[], name: string): El[] {
  return els.filter((e) => new RegExp(`^<${name}(?=[\\s>/])`, 'i').test(e.tag));
}

// el の直接の子要素
function children(el: El): El[] {
  const inner = el.html;
  const out: El[] = [];
  let pos = el.tag.length;
  const re = new RegExp(`<[a-zA-Z][^\\s>/]*${TAG_REST}`, 'g');
  for (;;) {
    re.lastIndex = pos;
    const m = re.exec(inner);
    if (!m) return out;
    const child = outer(inner, m.index);
    out.push({ ...child, start: el.start + child.start, end: el.start + child.end });
    pos = child.end;
  }
}

function isExternal(tag: string): boolean {
  const a = attrs(tag);
  const rel = (a.get('rel') ?? '').toLowerCase().split(/\s+/);
  return (
    (a.get('target') ?? '').toLowerCase() === '_blank' &&
    rel.includes('noopener') &&
    rel.includes('noreferrer')
  );
}

const ZENN_URL = 'https://zenn.dev/riku_takata';

function articles(): { html: string; el: El; main: El } {
  const html = readDist('index.html');
  const found = elementsWithId(html, 'articles');
  expect(found).toHaveLength(1);
  const mains = byName(allElements(html), 'main');
  expect(mains).toHaveLength(1);
  return { html, el: found[0], main: mains[0] };
}

describe('dist/index.html の Articles', () => {
  it('AC-6: main の最後の子要素の section である', () => {
    const { el, main } = articles();
    expect(el.tag).toMatch(/^<section(?=[\s>/])/i);
    const kids = children(main);
    expect(kids[kids.length - 1].start).toBe(el.start);
  });

  it('AC-7: h2 は Articles の1つだけ', () => {
    const { el } = articles();
    const h2 = byName(allElements(el.html), 'h2');
    expect(h2).toHaveLength(1);
    expect(text(h2[0].html)).toBe('Articles');
  });

  it('AC-8: Experience があるときはその後ろにある', () => {
    const { html, el } = articles();
    const exp = elementsWithId(html, 'experience');
    if (exp.length === 0) return;
    expect(el.start).toBeGreaterThan(exp[0].start);
  });

  it('AC-9, AC-10: 一覧へのリンクが最後の a である', () => {
    const { el } = articles();
    const as = byName(allElements(el.html), 'a');
    const hits = as.filter(
      (a) =>
        attrs(a.tag).get('href') === ZENN_URL &&
        text(a.html) === 'Zenn の記事一覧 →',
    );
    expect(hits).toHaveLength(1);
    expect(isExternal(hits[0].tag)).toBe(true);
    expect(as[as.length - 1].start).toBe(hits[0].start);
    const ol = byName(allElements(el.html), 'ol');
    if (ol.length > 0) {
      expect(hits[0].start).toBeGreaterThanOrEqual(ol[0].end);
    }
  });

  it('AC-11, AC-12: 記事の一覧', () => {
    const { el } = articles();
    const els = allElements(el.html);
    const ol = byName(els, 'ol');
    if (ol.length === 0) {
      expect(byName(els, 'li')).toHaveLength(0);
      expect(byName(els, 'time')).toHaveLength(0);
      expect(byName(els, 'a')).toHaveLength(1);
      return;
    }
    expect(ol).toHaveLength(1);
    const lis = byName(allElements(ol[0].html), 'li');
    expect(lis.length).toBeGreaterThanOrEqual(1);
    expect(lis.length).toBeLessThanOrEqual(5);
    for (const li of lis) {
      const inner = allElements(li.html);
      const times = byName(inner, 'time');
      const as = byName(inner, 'a');
      expect(times).toHaveLength(1);
      expect(as).toHaveLength(1);
      const datetime = attrs(times[0].tag).get('datetime') ?? '';
      expect(datetime).not.toBe('');
      expect(Number.isNaN(Date.parse(datetime))).toBe(false);
      const timeText = text(times[0].html);
      expect(timeText).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
      expect(timeText).toBe(formatDate(datetime));
      expect(attrs(as[0].tag).get('href') ?? '').toMatch(
        /^https:\/\/zenn\.dev\/riku_takata\/articles\//,
      );
      const aText = text(as[0].html);
      expect(aText).not.toBe('');
      expect(isExternal(as[0].tag)).toBe(true);
      expect(text(li.html)).toBe(`${timeText} ${aText}`);
    }
  });

  it('AC-13: img と picture がない', () => {
    const { el } = articles();
    const els = allElements(el.html);
    expect(byName(els, 'img')).toHaveLength(0);
    expect(byName(els, 'picture')).toHaveLength(0);
  });
});
