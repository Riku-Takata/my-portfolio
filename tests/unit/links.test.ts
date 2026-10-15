import { describe, expect, it } from 'vitest';
import { linkLabel, sortLinks } from '../../src/lib/links';
import type { ExternalLink, Media } from '../../src/lib/schemas';

describe('AC-13: linkLabel', () => {
  it.each([
    ['github', 'GitHub: Code & README'],
    ['zenn', 'Zenn: 設計・技術解説'],
    ['note', 'note: 開発背景・振り返り'],
    ['slide', 'Slide: 発表資料'],
    ['demo', 'Demo: Webサイト'],
  ] as const)('%s の表示名は %s', (media: Media, expected: string) => {
    expect(linkLabel(media)).toBe(expected);
  });
});

describe('AC-14: sortLinks', () => {
  it('media の定義順 (github -> zenn -> note -> slide -> demo) に並び替えられる', () => {
    const input: ExternalLink[] = [
      { media: 'demo', url: 'https://example.com/demo', label: 'デモ' },
      { media: 'note', url: 'https://example.com/note' },
      { media: 'github', url: 'https://example.com/gh' },
      { media: 'slide', url: 'https://example.com/slide' },
      { media: 'zenn', url: 'https://example.com/zenn', label: '記事' },
    ];
    const sorted = sortLinks(input);

    expect(sorted.map((l) => l.media)).toEqual([
      'github',
      'zenn',
      'note',
      'slide',
      'demo',
    ]);
    expect(sorted[0]).toEqual({
      media: 'github',
      url: 'https://example.com/gh',
    });
    expect(sorted[1]).toEqual({
      media: 'zenn',
      url: 'https://example.com/zenn',
      label: '記事',
    });
    expect(sorted[4]).toEqual({
      media: 'demo',
      url: 'https://example.com/demo',
      label: 'デモ',
    });
  });

  it('空の配列を渡すと空の配列を返す', () => {
    const empty: ExternalLink[] = [];
    expect(sortLinks(empty)).toEqual([]);
  });

  it('引数の配列は書き換えず、新しい配列を返す', () => {
    const input: ExternalLink[] = [
      { media: 'demo', url: 'https://example.com/demo' },
      { media: 'github', url: 'https://example.com/gh' },
    ];
    const copy = [...input];
    const sorted = sortLinks(input);

    expect(input).toEqual(copy);
    expect(sorted).not.toBe(input);
  });
});
