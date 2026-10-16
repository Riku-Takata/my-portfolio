// T-038 の受け入れ基準(Hero のタグとリンク、About と Media Policy、Skills がないこと)をビルド後の HTML で確かめる
import { describe, expect, it } from 'vitest';
import { resume } from '../../src/content/resume';
import { loadProfile } from '../../src/lib/content';
import { attrs, decode, htmlFiles, readDist } from './html';

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
  if (!open) throw new Error(`no tag at ${start}`);
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
  throw new Error(`unclosed <${name}> at ${start}`);
}

function allElements(fragment: string): El[] {
  return [
    ...fragment.matchAll(new RegExp(`<[a-zA-Z][^\\s>/]*${TAG_REST}`, 'g')),
  ].map((m) => outer(fragment, m.index));
}

function tagName(el: El): string {
  return /^<([^\s>/]+)/.exec(el.tag)?.[1].toLowerCase() ?? '';
}

function classes(tag: string): string[] {
  return (attrs(tag).get('class') ?? '').split(/\s+/).filter((c) => c !== '');
}

// el の中(el 自身を除く)にある name 要素
function inner(el: El, name: string): El[] {
  return allElements(el.html)
    .slice(1)
    .filter((e) => tagName(e) === name);
}

function byId(html: string, id: string): El[] {
  return allElements(html).filter((e) => attrs(e.tag).get('id') === id);
}

function badges(el: El): string[] {
  return inner(el, 'span')
    .filter((s) => {
      const c = classes(s.tag);
      return ['font-mono', 'text-xs', 'border'].every((t) => c.includes(t));
    })
    .map((s) => text(s.html));
}

function directLis(ul: El): El[] {
  const lis = inner(ul, 'li');
  return lis.filter(
    (li) => !lis.some((o) => o !== li && o.from < li.from && li.to <= o.to),
  );
}

const profile = loadProfile();
const { domains, mediaPolicy } = resume;
const index = () => readDist('index.html');

function section(id: string): El {
  const found = byId(index(), id);
  expect(found, `dist/index.html の #${id}`).toHaveLength(1);
  return found[0];
}

describe('dist: Hero のタグとリンク', () => {
  it('AC-4: Badge の文字が coreTags と一致する', () => {
    expect(badges(section('top'))).toEqual(profile.coreTags.map(norm));
  });

  it('AC-6: Hero の7つのリンク', () => {
    const links = inner(section('top'), 'a').map((a) => [
      attrs(a.tag).get('href'),
      text(a.html),
    ]);
    expect(links).toEqual([
      [profile.links.github, 'GitHub'],
      [profile.links.zenn, 'Zenn'],
      [profile.links.note, 'note'],
      [profile.links.speakerDeck, 'Speaker Deck'],
      [profile.links.x, 'X'],
      ['mailto:' + profile.links.email, 'Mail'],
      ['/resume.pdf', 'Resume (PDF)'],
    ]);
  });
});

describe('dist: About と Media Policy', () => {
  it('AC-11: ドメインのカードの ul と li の件数', () => {
    const about = section('about');
    const uls = inner(about, 'ul').filter((u) => {
      const c = classes(u.tag);
      return c.includes('grid') && c.includes('sm:grid-cols-2');
    });
    expect(uls).toHaveLength(1);
    const lis = directLis(uls[0]);
    expect(lis).toHaveLength(domains.length);
    lis.forEach((li, i) => {
      const t = text(li.html);
      expect(t).toContain(norm(domains[i].title));
      expect(t).toContain(norm(domains[i].description));
      expect(badges(li)).toEqual(domains[i].keywords.map(norm));
    });
  });

  function policyItems(): El[] {
    const about = section('about');
    const h3 = inner(about, 'h3').filter((e) => text(e.html) === 'Media Policy');
    expect(h3).toHaveLength(1);
    const uls = inner(about, 'ul').filter((u) => u.from >= h3[0].to);
    const withFour = uls.filter((u) => directLis(u).length === 4);
    expect(withFour).toHaveLength(1);
    return directLis(withFour[0]);
  }

  const names = {
    github: 'GitHub',
    zenn: 'Zenn',
    note: 'note',
    slide: 'Speaker Deck',
  } as const;
  const hrefs = {
    github: profile.links.github,
    zenn: profile.links.zenn,
    note: profile.links.note,
    slide: profile.links.speakerDeck,
  } as const;

  it('AC-15〜AC-17: 件の順、媒体名、description、role', () => {
    const items = policyItems();
    expect(items).toHaveLength(mediaPolicy.length);
    items.forEach((li, i) => {
      const m = mediaPolicy[i];
      const t = text(li.html);
      expect(t, `件 ${i}`).toContain(names[m.media]);
      expect(t, `件 ${i}`).toContain(norm(m.description));
      const role = allElements(li.html).filter((e) => {
        const c = classes(e.tag);
        return (
          c.includes('font-mono') &&
          c.includes('text-xs') &&
          text(e.html) === norm(m.role)
        );
      });
      expect(role.length, `件 ${i} の role`).toBeGreaterThan(0);
    });
  });

  it('AC-18: 各件のリンク', () => {
    policyItems().forEach((li, i) => {
      const m = mediaPolicy[i];
      const as = inner(li, 'a');
      expect(as, `件 ${i}`).toHaveLength(1);
      const a = attrs(as[0].tag);
      expect(a.get('href')).toBe(hrefs[m.media]);
      expect(a.get('target')).toBe('_blank');
      expect((a.get('rel') ?? '').split(/\s+/)).toContain('noopener');
      expect(text(as[0].html)).not.toBe('');
    });
  });
});

describe('dist: Skills がない', () => {
  it('AC-21: id="skills" も Technical Skills もない', () => {
    const html = index();
    expect(byId(html, 'skills')).toHaveLength(0);
    expect(html).not.toContain('Technical Skills');
  });

  it('AC-23: 全ページの header の nav', () => {
    for (const file of htmlFiles()) {
      const html = readDist(file);
      const header = byId(html, 'site-header');
      expect(header, `${file}: site-header`).toHaveLength(1);
      const navs = inner(header[0], 'nav');
      expect(navs, `${file}: nav`).toHaveLength(1);
      const links = inner(navs[0], 'a').map((a) => [
        attrs(a.tag).get('href'),
        text(a.html),
      ]);
      expect(links, file).toEqual([
        ['/#about', 'About'],
        ['/#projects', 'Projects'],
        ['/#experience', 'Experience'],
        ['/#articles', 'Articles'],
      ]);
    }
  });
});
