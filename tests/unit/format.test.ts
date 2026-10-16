import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatPeriod,
  formatTimelinePeriod,
  formatYearMonth,
  timelineKindLabel,
} from '../../src/lib/format';

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

describe('formatTimelinePeriod', () => {
  it('AC-12: end がなければ start だけ', () => {
    const result = formatTimelinePeriod({ start: '2025-08' });
    expect(result).toBe('2025.08');
    expect(result).not.toContain('–');
  });

  it('AC-12: start と end を en dash でつなぐ', () => {
    expect(formatTimelinePeriod({ start: '2025-08', end: '2025-12' })).toBe(
      '2025.08 – 2025.12',
    );
  });

  it('AC-12: end が present なら Present', () => {
    expect(formatTimelinePeriod({ start: '2025-08', end: 'present' })).toBe(
      '2025.08 – Present',
    );
  });

  it('AC-12: 同じ年月はまとめない', () => {
    expect(formatTimelinePeriod({ start: '2025-08', end: '2025-08' })).toBe(
      '2025.08 – 2025.08',
    );
  });

  it.each(['2025/08', '2025-8', '2025-13'])(
    'AC-13: 形が違う start %s は throw する',
    (value) => {
      expect(() => formatTimelinePeriod({ start: value })).toThrow(value);
    },
  );

  it.each(['2025/08', '2025-8', '2025-13'])(
    'AC-13: 形が違う end %s は throw する',
    (value) => {
      expect(() =>
        formatTimelinePeriod({ start: '2025-01', end: value }),
      ).toThrow(value);
    },
  );

  it('AC-13: start が end より後なら両方の値を含めて throw する', () => {
    let error: unknown;
    try {
      formatTimelinePeriod({ start: '2026-04', end: '2025-03' });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    expect(message).toContain('2026-04');
    expect(message).toContain('2025-03');
  });

  it('AC-13: present は start と比べない', () => {
    expect(formatTimelinePeriod({ start: '2099-01', end: 'present' })).toBe(
      '2099.01 – Present',
    );
  });
});

describe('timelineKindLabel', () => {
  it.each([
    ['education', 'Education'],
    ['research', 'Research'],
    ['exhibition', 'Exhibition'],
    ['presentation', 'Presentation'],
    ['conference', 'Conference'],
    ['internship', 'Internship'],
    ['work', 'Work'],
  ] as const)('AC-11: %s は %s', (kind, label) => {
    expect(timelineKindLabel(kind)).toBe(label);
  });
});
