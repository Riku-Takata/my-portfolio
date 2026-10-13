import { describe, expect, it } from 'vitest';
import { attrs, decode, htmlFiles, readDist } from './html';

// 属性値の中の ">" と大文字のタグ名も扱う開始タグの本体
const TAG_REST = `(?=[\\s>/])(?:"[^"]*"|'[^']*'|[^>"'])*>`;

function norm(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function text(s: string): string {
  const raw = s
    .replace(/<\/?[a-zA-Z](?:"[^"]*"|'[^']*'|[^>"'])*>/g, '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&copy;/g, '©')
    .replace(/&nbsp;/g, ' ');
  return norm(decode(raw));
}

// <footer> の開始タグの位置と、対応する </footer> の後ろの位置
function footers(html: string): { start: number; end: number; tag: string }[] {
  const re = new RegExp(`<footer${TAG_REST}`, 'gi');
  return [...html.matchAll(re)].map((m) => {
    const close = html.indexOf('</footer', m.index);
    const end = close === -1 ? -1 : html.indexOf('>', close) + 1;
    return { start: m.index, end, tag: m[0] };
  });
}

const year = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
}).format(new Date());

const files = htmlFiles();

describe('Footer', () => {
  it('dist に html がある', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  describe.each(files)('%s', (file) => {
    const html = () => readDist(file);

    it('AC-15: footer が1つ、main の後ろ、body の前にある', () => {
      const h = html();
      const fs = footers(h);
      expect(fs).toHaveLength(1);
      const mainEnd = h.lastIndexOf('</main>');
      expect(mainEnd).not.toBe(-1);
      expect(fs[0].start).toBeGreaterThan(mainEnd);
      expect(fs[0].end).toBeGreaterThan(0);
      expect(fs[0].end).toBeLessThanOrEqual(h.indexOf('</body>'));
    });

    it('AC-16: テキストが © 年 Riku Takata', () => {
      const h = html();
      const [f] = footers(h);
      expect(text(h.slice(f.start, f.end))).toBe(`© ${year} Riku Takata`);
    });

    it('AC-17: 規約ページへのリンクと footer 内のリンクがない', () => {
      const h = html();
      const [f] = footers(h);
      const hrefs = [...h.matchAll(new RegExp(`<a${TAG_REST}`, 'gi'))].map(
        (m) => attrs(m[0]).get('href') ?? '',
      );
      for (const href of hrefs) {
        expect(href).not.toMatch(/^\/(privacy-policy|terms-of-service)/);
      }
      expect(h.slice(f.start, f.end)).not.toMatch(/<a(?=[\s>/])/i);
    });

    it('AC-18: border-t と text-zinc-500 と Container', () => {
      const h = html();
      const [f] = footers(h);
      const cls = (attrs(f.tag).get('class') ?? '').split(/\s+/);
      expect(cls).toContain('border-t');
      expect(cls).toContain('text-zinc-500');
      const divs = [
        ...h.slice(f.start, f.end).matchAll(new RegExp(`<div${TAG_REST}`, 'gi')),
      ].map((m) => (attrs(m[0]).get('class') ?? '').split(/\s+/));
      expect(
        divs.some((c) => c.includes('mx-auto') && c.includes('max-w-2xl')),
      ).toBe(true);
    });
  });
});
