import { describe, expect, it } from 'vitest';
import { projectSchema } from '../../src/lib/schemas';

const base = () => ({
  title: 'InSAR 解析基盤',
  period: { start: '2024-04', end: '2025-03' },
  summary: '衛星データから地表の変動を求める解析基盤',
  tech: ['Python', 'GDAL'],
  outcomes: ['処理時間を短くした'],
  links: {
    demo: 'https://example.com',
    github: 'https://github.com/Riku-Takata/x',
  },
  featured: true,
  order: 1,
});

const ok = (patch: Record<string, unknown>) =>
  projectSchema.safeParse({ ...base(), ...patch }).success;

const distinct = (n: number) => Array.from({ length: n }, (_, i) => `t${i}`);

describe('projectSchema: 通る入力', () => {
  it('有効な基準データ', () => {
    expect(projectSchema.safeParse(base()).success).toBe(true);
  });

  it.each([{}, { github: 'https://github.com/a/b' }])(
    'links が %j でも通る',
    (links) => {
      expect(ok({ links })).toBe(true);
    },
  );

  it.each([
    { start: '2025-01', end: '2025-01' },
    { start: '2099-12', end: 'present' },
    { start: '2000-01', end: 'present' },
    { start: '2025-01', end: '2025-12' },
    { start: '1000-01', end: '9999-12' },
  ])('period %j', (period) => {
    expect(ok({ period })).toBe(true);
  });

  it.each([
    ['title 1', { title: 'a' }],
    ['title 60', { title: 'あ'.repeat(60) }],
    ['summary 1', { summary: 'a' }],
    ['summary 100', { summary: 'あ'.repeat(100) }],
    ['tech 1', { tech: ['a'] }],
    ['tech 8', { tech: distinct(8) }],
    ['outcomes 1', { outcomes: ['a'] }],
    ['outcomes 3', { outcomes: ['a', 'b', 'c'] }],
    ['outcome 60', { outcomes: ['あ'.repeat(60)] }],
    ['order 1', { order: 1 }],
    ['featured false', { featured: false }],
    ['title 絵文字 30', { title: '😀'.repeat(30) }],
    ['tech 長い要素', { tech: ['a'.repeat(200)] }],
    [
      'links ホスト非制限',
      {
        links: {
          demo: 'https://github.com/a/b',
          github: 'https://gitlab.com/a/b',
        },
      },
    ],
  ])('%s', (_name, patch) => {
    expect(ok(patch)).toBe(true);
  });

  it('links キーが無いと links は {} になる', () => {
    const rest: Record<string, unknown> = base();
    delete rest.links;
    const r = projectSchema.parse(rest);
    expect(r.links).toEqual({});
  });
});

describe('projectSchema: 失敗する入力', () => {
  it.each([
    'title',
    'period',
    'summary',
    'tech',
    'outcomes',
    'featured',
    'order',
  ])('%s の欠落', (key) => {
    const input: Record<string, unknown> = base();
    delete input[key];
    expect(projectSchema.safeParse(input).success).toBe(false);
  });

  it.each(['start', 'end'])('period.%s の欠落', (key) => {
    const period: Record<string, string> = { ...base().period };
    delete period[key];
    expect(ok({ period })).toBe(false);
  });

  it.each([
    ['title 空', { title: '' }],
    ['title 61', { title: 'a'.repeat(61) }],
    ['title 絵文字 31', { title: '😀'.repeat(31) }],
    ['summary 空', { summary: '' }],
    ['summary 101', { summary: 'a'.repeat(101) }],
    ['summary LF', { summary: '一行目\n二行目' }],
    ['summary CRLF', { summary: '一行目\r\n二行目' }],
    ['summary CR', { summary: '一行目\r二行目' }],
    ['summary タブ', { summary: 'a\tb' }],
    ['summary NUL', { summary: 'a\u0000b' }],
    ['summary DEL', { summary: 'a\u007fb' }],
    ['tech 空', { tech: [] }],
    ['tech 重複', { tech: ['Python', 'Python'] }],
    ['tech 重複 大小', { tech: ['Python', 'python'] }],
    ['tech 重複 大小2', { tech: ['GDAL', 'gdal'] }],
    ['tech 9', { tech: distinct(9) }],
    ['tech 文字列', { tech: 'Python' }],
    ['tech 数値', { tech: [1] }],
    ['tech 空要素', { tech: ['Python', ''] }],
    ['tech 空白要素', { tech: ['Python', '   '] }],
    ['outcomes 空', { outcomes: [] }],
    ['outcomes 4', { outcomes: ['a', 'b', 'c', 'd'] }],
    ['outcome 61', { outcomes: ['a'.repeat(61)] }],
    ['outcome 全角空白', { outcomes: ['　'] }],
    ['demo http', { links: { demo: 'http://example.com' } }],
    ['github http', { links: { github: 'http://github.com/a/b' } }],
    ['demo URL でない', { links: { demo: 'example.com' } }],
    ['github URL でない', { links: { github: 'not a url' } }],
    ['demo ftp', { links: { demo: 'ftp://example.com' } }],
    ['featured 文字列', { featured: 'true' }],
    ['featured 数値', { featured: 1 }],
    ['order 0', { order: 0 }],
    ['order -1', { order: -1 }],
    ['order 1.5', { order: 1.5 }],
    ['order 文字列', { order: '1' }],
    ['未知のキー', { draft: true }],
  ])('%s', (_name, patch) => {
    expect(ok(patch)).toBe(false);
  });

  it.each([
    { start: '2025-1', end: '2025-12' },
    { start: '2025/01', end: '2025-12' },
    { start: '202501', end: '2025-12' },
    { start: '2025-01-01', end: '2025-12' },
    { start: 'present', end: '2025-12' },
    { start: '2025-01', end: '2025-1' },
    { start: '2025-01', end: 'Present' },
    { start: '2025-01', end: '' },
    { start: '2025-03', end: '2025-02' },
    { start: '2025-01', end: '2024-12' },
    { start: '2025-13', end: '2026-01' },
    { start: '2025-00', end: '2026-01' },
    { start: '2025-01', end: '2025-13' },
    { start: '2025-01', end: '2025-00' },
    { start: '25-01', end: '2026-01' },
    { start: '12025-01', end: '2026-01' },
    { start: '2025-01', end: '12025-01' },
  ])('period %j', (period) => {
    expect(ok({ period })).toBe(false);
  });
});
