import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resume } from '../../src/content/resume';
import { articleSchema } from '../../src/lib/schemas';
import { fetchLatestNotes } from '../../src/lib/note';

const item = (i: number, date?: string, extra = '') =>
  `<item><title>t${i}</title><link>https://example.com/n/${i}</link><pubDate>${
    date ?? 'Wed, 01 Oct 2026 09:00:00 +0900'
  }</pubDate>${extra}</item>`;
const rss = (items: string) =>
  `<?xml version="1.0"?><rss version="2.0"><channel><title>x</title>${items}</channel></rss>`;
const xmlResponse = (body: string, status = 200) =>
  new Response(body, { status });
const items = (n: number) =>
  Array.from({ length: n }, (_, i) => item(i)).join('');

let fetchMock: ReturnType<typeof vi.fn>;
let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubEnv('NOTE_OFFLINE', undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('fetchLatestNotes', () => {
  it('Promise を返す', async () => {
    fetchMock.mockResolvedValue(xmlResponse(rss(items(1))));
    const p = fetchLatestNotes();
    expect(p).toBeInstanceOf(Promise);
    await p;
  });

  it('引数なしの URL は profile.links.note の末尾の / を除いて /rss を足す', async () => {
    fetchMock.mockResolvedValue(xmlResponse(rss(items(1))));
    await fetchLatestNotes();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      resume.profile.links.note.replace(/\/+$/, '') + '/rss',
    );
  });

  it('引数ありの URL をそのまま渡す', async () => {
    fetchMock.mockResolvedValue(xmlResponse(rss(items(1))));
    await fetchLatestNotes('https://example.com/feed', 3);
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.com/feed');
  });

  it('AbortSignal.timeout(10000) の戻り値を signal に渡す', async () => {
    const sig = new AbortController().signal;
    const spy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(sig);
    fetchMock.mockResolvedValue(xmlResponse(rss(items(1))));
    await fetchLatestNotes();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(10000);
    expect(fetchMock.mock.calls[0][1].signal).toBe(sig);
  });

  it('正常な5件を変換する', async () => {
    fetchMock.mockResolvedValue(xmlResponse(rss(items(5))));
    const r = await fetchLatestNotes();
    expect(r).toHaveLength(5);
    r.forEach((a) => {
      expect(Object.keys(a).sort()).toEqual([
        'media',
        'publishedAt',
        'title',
        'url',
      ]);
      expect(a.media).toBe('note');
      expect(a.publishedAt).toBe('2026-10-01T00:00:00.000Z');
      expect(() => articleSchema.parse(a)).not.toThrow();
    });
    expect(r.map((a) => a.title).sort()).toEqual([
      't0',
      't1',
      't2',
      't3',
      't4',
    ]);
    expect(r.find((a) => a.title === 't2')?.url).toBe(
      'https://example.com/n/2',
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('古い順の入力を新しい順にする', async () => {
    const body = rss(
      item(0, 'Mon, 01 Sep 2026 00:00:00 +0000') +
        item(1, 'Thu, 01 Oct 2026 00:00:00 +0000') +
        item(2, 'Sat, 05 Sep 2026 00:00:00 +0000'),
    );
    fetchMock.mockResolvedValue(xmlResponse(body));
    const r = await fetchLatestNotes();
    expect(r.map((a) => a.title)).toEqual(['t1', 't2', 't0']);
  });

  it('件数を count で切る(既定5件)', async () => {
    const days = [4, 1, 7, 2, 6, 3, 5];
    const body = rss(
      days
        .map(
          (d) =>
            `<item><title>t${d}</title><link>https://example.com/n/${d}</link><pubDate>Mon, 0${d} Sep 2026 00:00:00 +0000</pubDate></item>`,
        )
        .join(''),
    );
    fetchMock.mockResolvedValue(xmlResponse(body));
    const r5 = await fetchLatestNotes();
    expect(r5.map((a) => a.title)).toEqual(['t7', 't6', 't5', 't4', 't3']);
    const r3 = await fetchLatestNotes('https://example.com/feed', 3);
    expect(r3.map((a) => a.title)).toEqual(['t7', 't6', 't5']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(warn).not.toHaveBeenCalled();
  });

  it('1件だけでも配列で返す', async () => {
    fetchMock.mockResolvedValue(xmlResponse(rss(items(1))));
    const r = await fetchLatestNotes();
    expect(r).toHaveLength(1);
    expect(r[0].title).toBe('t0');
  });

  it('&amp; を戻し、数字だけの title は文字列にする', async () => {
    const body = rss(
      `<item><title>A &amp; B</title><link>https://example.com/a</link><pubDate>Wed, 01 Oct 2026 09:00:00 +0900</pubDate></item>` +
        `<item><title>2026</title><link>https://example.com/b</link><pubDate>Wed, 01 Oct 2026 08:00:00 +0900</pubDate></item>`,
    );
    fetchMock.mockResolvedValue(xmlResponse(body));
    const r = await fetchLatestNotes();
    expect(r.map((a) => a.title)).toEqual(['A & B', '2026']);
  });

  it('不正な item を除いて残りを返す', async () => {
    const body = rss(
      item(0) +
        `<item><link>https://example.com/x</link><pubDate>Wed, 01 Oct 2026 09:00:00 +0900</pubDate></item>` +
        `<item><title>x</title><pubDate>Wed, 01 Oct 2026 09:00:00 +0900</pubDate></item>` +
        `<item><title>x</title><link>https://example.com/x</link></item>` +
        `<item><title>x</title><link>http://example.com/x</link><pubDate>Wed, 01 Oct 2026 09:00:00 +0900</pubDate></item>` +
        `<item><title>x</title><link>https://example.com/x</link><pubDate>not a date</pubDate></item>`,
    );
    fetchMock.mockResolvedValue(xmlResponse(body));
    const r = await fetchLatestNotes();
    expect(r.map((a) => a.title)).toEqual(['t0']);
  });

  it.each([500, 404])('HTTP %i では [] と warn 1回', async (status) => {
    fetchMock.mockResolvedValue(xmlResponse('', status));
    expect(await fetchLatestNotes()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it.each([
    new DOMException('x', 'TimeoutError'),
    new DOMException('x', 'AbortError'),
    new TypeError('fetch failed'),
  ])('fetch の reject では [] と warn 1回', async (err) => {
    fetchMock.mockRejectedValue(err);
    expect(await fetchLatestNotes()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('壊れた XML では [] と warn 1回', async () => {
    fetchMock.mockResolvedValue(
      xmlResponse('<rss><channel><item><title>a</title>'),
    );
    expect(await fetchLatestNotes()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it.each(['<rss><channel></channel></rss>', '<foo/>', '<rss></rss>'])(
    'item がない %s では [] と warn 1回',
    async (body) => {
      fetchMock.mockResolvedValue(xmlResponse(body));
      expect(await fetchLatestNotes()).toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
    },
  );

  it('NOTE_OFFLINE=1 では fetch も warn もしない', async () => {
    vi.stubEnv('NOTE_OFFLINE', '1');
    expect(await fetchLatestNotes()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
    fetchMock.mockResolvedValue(xmlResponse(rss(items(1))));
    await fetchLatestNotes();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(['', '0', 'true'])(
    "NOTE_OFFLINE='%s' では fetch を1回呼ぶ",
    async (v) => {
      vi.stubEnv('NOTE_OFFLINE', v);
      fetchMock.mockResolvedValue(xmlResponse(rss(items(1))));
      await fetchLatestNotes();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each([0, -1, 1.5, NaN])('count=%s は reject する', async (count) => {
    const msg = `count は 1 以上の整数にする: ${JSON.stringify(count)}`;
    await expect(fetchLatestNotes(undefined, count)).rejects.toThrow(msg);
    vi.stubEnv('NOTE_OFFLINE', '1');
    await expect(fetchLatestNotes(undefined, count)).rejects.toThrow(msg);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ソースに note.com を書かない', () => {
    expect(readFileSync('src/lib/note.ts', 'utf8')).not.toContain('note.com');
  });
});
