import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  formatPeriod,
  formatYearMonth,
  formatDate,
  sortExperience,
} from '../../src/lib/format';

const exp = (start: string, title: string) => ({
  kind: 'work',
  title,
  org: 'Org',
  start,
  end: 'present',
  note: 'note',
});

describe('formatPeriod', () => {
  it('年が違う期間は en dash でつなぐ', () => {
    const result = formatPeriod({ start: '2025-04', end: '2026-03' });
    expect(result).toBe('2025 – 2026');
    expect(result).not.toContain('-');
    expect(result).not.toContain('—');
  });

  it('end が present なら Present', () => {
    expect(formatPeriod({ start: '2025-04', end: 'present' })).toBe(
      '2025 – Present',
    );
  });

  it('同じ年は年を 1 つだけ出す', () => {
    expect(formatPeriod({ start: '2025-01', end: '2025-09' })).toBe('2025');
  });

  it('同じ年月でも年を 1 つだけ出す', () => {
    expect(formatPeriod({ start: '2025-04', end: '2025-04' })).toBe('2025');
  });

  it('年をまたぐ短い期間は両方の年を出す', () => {
    expect(formatPeriod({ start: '2019-12', end: '2020-01' })).toBe(
      '2019 – 2020',
    );
  });

  it('形が違う start は値を含めて throw する', () => {
    expect(() => formatPeriod({ start: '2025/04', end: '2026-03' })).toThrow(
      '2025/04',
    );
  });

  it('形が違う end は値を含めて throw する', () => {
    expect(() => formatPeriod({ start: '2025-04', end: '2026-3' })).toThrow(
      '2026-3',
    );
  });

  it('start が end より後なら両方の値を含めて throw する', () => {
    let error: unknown;
    try {
      formatPeriod({ start: '2026-04', end: '2025-03' });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    expect(message).toContain('2026-04');
    expect(message).toContain('2025-03');
  });
});

describe('formatYearMonth', () => {
  it('YYYY-MM を YYYY.MM にする', () => {
    expect(formatYearMonth('2024-04')).toBe('2024.04');
    expect(formatYearMonth('2026-12')).toBe('2026.12');
  });

  it('present は Present', () => {
    expect(formatYearMonth('present')).toBe('Present');
  });

  it('形が違う値は値を含めて throw する', () => {
    expect(() => formatYearMonth('2025/04')).toThrow('2025/04');
    expect(() => formatYearMonth('2025-4')).toThrow('2025-4');
  });
});

describe('formatDate', () => {
  it('+09:00 の日時はそのまま JST の日付になる', () => {
    expect(formatDate('2025-01-01T00:30:00+09:00')).toBe('2025.01.01');
  });

  it('UTC の 12/31 15:30 は JST の 1/1 になる', () => {
    expect(formatDate('2024-12-31T15:30:00Z')).toBe('2025.01.01');
  });

  it('UTC の 12/31 14:59:59 は JST の 12/31 のまま', () => {
    expect(formatDate('2024-12-31T14:59:59Z')).toBe('2024.12.31');
  });

  it('ミリ秒付きでも月と日を 2 桁にする', () => {
    expect(formatDate('2025-03-05T09:00:00.000+09:00')).toBe('2025.03.05');
  });

  it('読めない文字列は値を含めて throw する', () => {
    expect(() => formatDate('not-a-date')).toThrow('not-a-date');
  });
});

describe('sortExperience', () => {
  it('start の新しい順に並べる', () => {
    const result = sortExperience([
      exp('2022-04', 'a'),
      exp('2024-04', 'b'),
      exp('2023-10', 'c'),
    ]);
    expect(result.map((e) => e.start)).toEqual([
      '2024-04',
      '2023-10',
      '2022-04',
    ]);
  });

  it('同じ年は月で並べる', () => {
    const result = sortExperience([exp('2024-09', 'a'), exp('2024-10', 'b')]);
    expect(result.map((e) => e.start)).toEqual(['2024-10', '2024-09']);
  });

  it('元の配列を書き換えず、別の配列を返す', () => {
    const input = [
      exp('2022-04', 'a'),
      exp('2024-04', 'b'),
      exp('2023-10', 'c'),
    ];
    const before = [...input];
    const result = sortExperience(input);
    expect(result).not.toBe(input);
    expect(input).toHaveLength(before.length);
    expect(input).toEqual(before);
    input.forEach((item, i) => expect(item).toBe(before[i]));
  });

  it('要素は同じオブジェクトのまま', () => {
    const input = [exp('2022-04', 'a'), exp('2024-04', 'b')];
    const result = sortExperience(input);
    expect(result[0]).toBe(input[1]);
    expect(result[1]).toBe(input[0]);
    expect(result[0]).toEqual(exp('2024-04', 'b'));
  });

  it('空配列には空配列を返す', () => {
    expect(sortExperience([])).toEqual([]);
  });

  it('同じ start は渡した順を保つ(安定ソート)', () => {
    const a = exp('2023-04', 'A');
    const b = exp('2024-04', 'B');
    const c = exp('2023-04', 'C');
    const result = sortExperience([a, b, c]);
    expect(result[0]).toBe(b);
    expect(result[1]).toBe(a);
    expect(result[2]).toBe(c);
  });
});

describe('format.ts のモジュール境界', () => {
  it('astro: で始まるモジュールを import しない', () => {
    const source = readFileSync(
      new URL('../../src/lib/format.ts', import.meta.url),
      'utf8',
    );
    const matches = [
      ...source.matchAll(/(?:from\s+|import\s*\(\s*)['"](astro:[^'"]*)['"]/g),
    ].map((m) => m[1]);
    expect(matches, `src/lib/format.ts: ${matches.join(', ')}`).toEqual([]);
  });
});
