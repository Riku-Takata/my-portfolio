import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { zennResponseSchema } from '../../src/lib/schemas';
import { fetchLatestArticles } from '../../src/lib/zenn';

const article = (i: number, patch: Record<string, unknown> = {}) => ({
  id: i,
  emoji: '📝',
  liked_count: 0,
  title: `t${i}`,
  slug: `s${i}`,
  published_at: '2026-10-01T09:00:00.000+09:00',
  user: { username: 'riku_takata' },
  ...patch,
});
const articles = (n: number) => Array.from({ length: n }, (_, i) => article(i));
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

let fetchMock: ReturnType<typeof vi.fn>;
let warn: ReturnType<typeof vi.spyOn>;

const calledUrl = () => new URL(String(fetchMock.mock.calls[0][0]));

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('zennResponseSchema', () => {
  it('正常なレスポンスを通す', () => {
    expect(
      zennResponseSchema.safeParse({ articles: articles(2) }).success,
    ).toBe(true);
  });
  it('user がなくても通す', () => {
    const noUser = { title: 'a', slug: 'b', published_at: '2026-10-01' };
    const noName = { ...noUser, user: {} };
    expect(
      zennResponseSchema.safeParse({ articles: [noUser, noName] }).success,
    ).toBe(true);
  });
  it.each([{}, { articles: 'x' }, { articles: null }])(
    '全体の形が違うと失敗する %j',
    (v) => {
      expect(zennResponseSchema.safeParse(v).success).toBe(false);
    },
  );
});

describe('fetchLatestArticles', () => {
  it('Promise を返す', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ articles: [] }));
    const p = fetchLatestArticles();
    expect(p).toBeInstanceOf(Promise);
    await p;
  });

  it('引数なしの URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ articles: [] }));
    await fetchLatestArticles();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const u = calledUrl();
    expect(u.origin).toBe('https://zenn.dev');
    expect(u.pathname).toBe('/api/articles');
    expect(u.searchParams.get('username')).toBe('riku_takata');
    expect(u.searchParams.get('order')).toBe('latest');
    expect(u.searchParams.get('count')).toBe('5');
  });

  it('引数ありの URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ articles: [] }));
    await fetchLatestArticles('someone', 3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const u = calledUrl();
    expect(u.searchParams.get('username')).toBe('someone');
    expect(u.searchParams.get('count')).toBe('3');
    expect(u.searchParams.get('order')).toBe('latest');
  });

  it('既定値は ZENN_USERNAME を参照する', () => {
    const src = readFileSync('src/lib/zenn.ts', 'utf8');
    expect(src).toMatch(/import\s*\{\s*ZENN_USERNAME\s*\}\s*from\s*'\.\/site'/);
    expect(src).toContain('username: string = ZENN_USERNAME');
    expect(src).toContain('count: number = 5');
  });

  it('AbortSignal.timeout(10000) の戻り値を signal に渡す', async () => {
    const spy = vi.spyOn(AbortSignal, 'timeout');
    fetchMock.mockResolvedValue(jsonResponse({ articles: [] }));
    await fetchLatestArticles();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(10000);
    expect(fetchMock.mock.calls[0][1].signal).toBe(spy.mock.results[0].value);
  });

  it('正常な5件を変換する', async () => {
    const list = articles(5);
    fetchMock.mockResolvedValue(jsonResponse({ articles: list }));
    const r = await fetchLatestArticles();
    expect(r).toHaveLength(5);
    r.forEach((a, i) => {
      expect(Object.keys(a).sort()).toEqual(['publishedAt', 'title', 'url']);
      expect(a.title).toBe(list[i].title);
      expect(a.publishedAt).toBe(list[i].published_at);
      expect(a.url).toBe(
        `https://zenn.dev/riku_takata/articles/${list[i].slug}`,
      );
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('空配列は []', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ articles: [] }));
    await expect(fetchLatestArticles()).resolves.toEqual([]);
  });

  it.each([500, 404])('HTTP %i は [] と warn 1回', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse({}, status));
    await expect(fetchLatestArticles()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['AbortError', () => new DOMException('x', 'AbortError')],
    ['TimeoutError', () => new DOMException('x', 'TimeoutError')],
    ['TypeError', () => new TypeError('fetch failed')],
  ])('%s で reject しても [] と warn 1回', async (_n, make) => {
    fetchMock.mockRejectedValue(make());
    await expect(fetchLatestArticles()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it.each([{}, { articles: 'x' }, { articles: null }])(
    '全体の形が違うと [] と warn 1回 %j',
    async (body) => {
      fetchMock.mockResolvedValue(jsonResponse(body));
      await expect(fetchLatestArticles()).resolves.toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
    },
  );

  it('JSON でない本文は [] と warn 1回', async () => {
    fetchMock.mockResolvedValue(new Response('not json', { status: 200 }));
    await expect(fetchLatestArticles()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('url は引数 username から作る', async () => {
    const list = articles(5);
    fetchMock.mockResolvedValue(jsonResponse({ articles: list }));
    const r = await fetchLatestArticles('someone', 5);
    r.forEach((a, i) =>
      expect(a.url).toBe(`https://zenn.dev/someone/articles/${list[i].slug}`),
    );
  });

  it('user がない記事も通り warn しない', async () => {
    const list = articles(5).map((a) => {
      const copy: Record<string, unknown> = { ...a };
      delete copy.user;
      return copy as typeof a;
    });
    fetchMock.mockResolvedValue(jsonResponse({ articles: list }));
    const r = await fetchLatestArticles();
    expect(r.map((a) => a.title)).toEqual(list.map((a) => a.title));
    expect(warn).not.toHaveBeenCalled();
  });

  it('username をエンコードする', async () => {
    const list = articles(2);
    fetchMock.mockResolvedValue(jsonResponse({ articles: list }));
    const r = await fetchLatestArticles('a&b c/d', 5);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      'username=a%26b%20c%2Fd',
    );
    const u = calledUrl();
    expect(u.searchParams.get('username')).toBe('a&b c/d');
    expect(u.searchParams.get('order')).toBe('latest');
    expect(u.searchParams.get('count')).toBe('5');
    r.forEach((a, i) =>
      expect(a.url).toBe(
        `https://zenn.dev/a%26b%20c%2Fd/articles/${list[i].slug}`,
      ),
    );
  });

  it('count 件に切り詰める', async () => {
    const list = articles(7);
    fetchMock.mockResolvedValue(jsonResponse({ articles: list }));
    const r = await fetchLatestArticles();
    expect(r.map((a) => a.title)).toEqual(list.slice(0, 5).map((a) => a.title));

    fetchMock.mockResolvedValue(jsonResponse({ articles: articles(5) }));
    const r3 = await fetchLatestArticles('riku_takata', 3);
    expect(r3.map((a) => a.title)).toEqual(['t0', 't1', 't2']);
  });

  it('正しくない記事を除く', async () => {
    const list: unknown[] = articles(5);
    list[1] = article(1, { title: 123 });
    const noSlug: Record<string, unknown> = article(3);
    delete noSlug.slug;
    list[3] = noSlug;
    fetchMock.mockResolvedValue(jsonResponse({ articles: list }));
    const r = await fetchLatestArticles();
    expect(r.map((a) => a.title)).toEqual(['t0', 't2', 't4']);
  });

  it('日時でない published_at の記事を除く', async () => {
    const list = articles(5);
    list[1] = article(1, { published_at: 'not a date' });
    list[3] = article(3, { published_at: '' });
    fetchMock.mockResolvedValue(jsonResponse({ articles: list }));
    const r = await fetchLatestArticles();
    expect(r.map((a) => a.title)).toEqual(['t0', 't2', 't4']);
    expect(r[0].publishedAt).toBe('2026-10-01T09:00:00.000+09:00');
  });

  it('記事がすべて不正なら []', async () => {
    const list = [article(0, { title: 1 }), article(1, { slug: null })];
    fetchMock.mockResolvedValue(jsonResponse({ articles: list }));
    await expect(fetchLatestArticles()).resolves.toEqual([]);
  });

  it.each([0, -1, 1.5, NaN])('count=%s は例外で fetch しない', async (c) => {
    await expect(async () =>
      fetchLatestArticles('riku_takata', c),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('username が空文字なら例外で fetch しない', async () => {
    await expect(async () => fetchLatestArticles('', 5)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('fetchLatestArticles と ZENN_OFFLINE', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ZENN_OFFLINE=1 なら fetch も warn もせず [] を返す', async () => {
    vi.stubEnv('ZENN_OFFLINE', '1');
    await expect(fetchLatestArticles()).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('呼ぶたびに ZENN_OFFLINE を読む', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ articles: [] }));
    vi.stubEnv('ZENN_OFFLINE', '1');
    await fetchLatestArticles();
    expect(fetchMock).toHaveBeenCalledTimes(0);
    vi.unstubAllEnvs();
    await fetchLatestArticles();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(['', '0', 'true'])('ZENN_OFFLINE=%j なら fetch する', async (v) => {
    fetchMock.mockResolvedValue(jsonResponse({ articles: [] }));
    vi.stubEnv('ZENN_OFFLINE', v);
    await fetchLatestArticles();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(calledUrl().pathname).toBe('/api/articles');
  });

  it('ZENN_OFFLINE=1 でも引数が不正なら reject する', async () => {
    vi.stubEnv('ZENN_OFFLINE', '1');
    await expect(async () =>
      fetchLatestArticles('riku_takata', 0),
    ).rejects.toThrow();
    await expect(async () => fetchLatestArticles('', 5)).rejects.toThrow();
  });
});
