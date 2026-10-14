import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assertAlt } from '../../src/lib/figure';

describe('assertAlt', () => {
  it.each(['', '   ', '\t\n', '　'])('空白だけ(%j)なら throw する', (v) => {
    expect(() => assertAlt(v)).toThrow(Error);
  });

  it('前後の空白を取り除いて返す', () => {
    expect(assertAlt('  構成図  ')).toBe('構成図');
  });
});

describe('Figure.astro', () => {
  it('assertAlt を ../../lib/figure から import している', () => {
    const src = readFileSync('src/components/mdx/Figure.astro', 'utf8');
    expect(src).toMatch(
      /import\s*\{[^}]*\bassertAlt\b[^}]*\}\s*from\s*['"]\.\.\/\.\.\/lib\/figure(?:\.ts)?['"]/,
    );
  });
});
