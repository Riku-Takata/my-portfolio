import { assert, describe, expect, it } from 'vitest';
import { resume } from '../../src/content/resume';
import {
  experienceKindLabel,
  formatExperiencePeriod,
  sortExperience,
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

let cache: { html: string; skills: El; experience: El } | undefined;
function page() {
  if (!cache) {
    const html = readDist('index.html');
    const skills = elementsWithId(html, 'skills');
    const experience = elementsWithId(html, 'experience');
    expect(skills).toHaveLength(1);
    expect(experience).toHaveLength(1);
    cache = { html, skills: skills[0], experience: experience[0] };
  }
  return cache;
}

describe('dist/index.html: skills と experience', () => {
  it('AC-8: section が1つずつあり、main の中にある', () => {
    const { html, skills, experience } = page();
    expect(skills.tag.startsWith('<section')).toBe(true);
    expect(experience.tag.startsWith('<section')).toBe(true);
    expect(startTags(html, 'main')).toHaveLength(1);
    const main = outer(html, html.search(/<main(?=[\s>/])/i));
    for (const el of [skills, experience]) {
      expect(el.from).toBeGreaterThan(main.from);
      expect(el.to).toBeLessThan(main.to);
    }
  });

  it('AC-9: top < about < projects < skills < experience の順', () => {
    const { html } = page();
    const starts = ['top', 'about', 'projects', 'skills', 'experience'].map(
      (id) => {
        const els = elementsWithId(html, id);
        expect(els, id).toHaveLength(1);
        return els[0].from;
      },
    );
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it('AC-10: h2 が1つずつある', () => {
    const { skills, experience } = page();
    const s = inner(skills, 'h2');
    const e = inner(experience, 'h2');
    expect(s).toHaveLength(1);
    expect(e).toHaveLength(1);
    expect(text(s[0].html)).toBe('Technical Skills');
    expect(text(e[0].html)).toBe('Experience & Education');
  });

  it('AC-11: dl の dt がカテゴリと一致する', () => {
    const { skills } = page();
    const dls = inner(skills, 'dl');
    expect(dls).toHaveLength(1);
    const dts = inner(dls[0], 'dt').map((e) => text(e.html));
    expect(dts).toEqual(resume.skills.map((s) => norm(s.category)));
  });

  it('AC-12: dd の Badge が items と一致する', () => {
    const { skills } = page();
    const dl = inner(skills, 'dl')[0];
    const dds = inner(dl, 'dd');
    expect(dds).toHaveLength(resume.skills.length);
    dds.forEach((dd, i) => {
      const badges = inner(dd, 'span')
        .filter((s) => {
          const c = classes(s.tag);
          return (
            c.includes('font-mono') &&
            c.includes('text-xs') &&
            c.includes('border')
          );
        })
        .map((s) => text(s.html));
      expect(badges).toEqual(resume.skills[i].items.map(norm));
    });
  });

  it('AC-13: 評価の表示がない', () => {
    const { skills } = page();
    const t = text(skills.html);
    for (const ch of ['%', '★', '☆']) expect(t).not.toContain(ch);
    const lower = skills.html.toLowerCase();
    expect(lower).not.toContain('<progress');
    expect(lower).not.toContain('<meter');
    for (const el of allElements(skills.html)) {
      const a = attrs(el.tag);
      expect(['progressbar', 'meter']).not.toContain(a.get('role'));
      expect(a.has('style')).toBe(false);
    }
  });

  it('AC-14: ol の直下の li が経歴の件数と同じ', () => {
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

  it('AC-15: time の datetime と表示が期間と一致する', () => {
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
      expect(text(times[0].html)).toBe(formatExperiencePeriod(sorted[i]));
    });
  });

  it('AC-16: li に種別・title・org・note が含まれる', () => {
    const { experience } = page();
    const sorted = sortExperience(resume.experience);
    const lis = inner(inner(experience, 'ol')[0], 'li');
    lis.forEach((li, i) => {
      const t = text(li.html);
      const e = sorted[i];
      expect(t).toContain(norm(experienceKindLabel(e.kind)));
      expect(t).toContain(norm(e.title));
      expect(t).toContain(norm(e.org));
      const note = (e as { note?: string }).note;
      if (note) expect(t).toContain(norm(note));
    });
  });

  it('AC-17: ol の縦線だけで装飾する', () => {
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
