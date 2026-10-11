import { describe, expect, it } from 'vitest';
import { selectFeatured, sortProjects } from '../../src/lib/projects';

const p = (id: string, featured: boolean, order: number) => ({
  id,
  data: { featured, order },
});

describe('selectFeatured', () => {
  it('featured でない要素を除く', () => {
    const r = selectFeatured([
      p('a', true, 1),
      p('b', false, 2),
      p('c', true, 3),
    ]);
    expect(r.map((x) => x.id)).toEqual(['a', 'c']);
  });

  it('order の昇順に並べる', () => {
    const r = selectFeatured([
      p('c', true, 3),
      p('a', true, 1),
      p('b', true, 2),
    ]);
    expect(r.map((x) => x.data.order)).toEqual([1, 2, 3]);
  });

  it('3件なら throw しない', () => {
    expect(
      selectFeatured([p('a', true, 1), p('b', true, 2), p('c', true, 3)]),
    ).toHaveLength(3);
  });

  it('0件なら空配列', () => {
    expect(selectFeatured([p('a', false, 1)])).toEqual([]);
    expect(selectFeatured([])).toEqual([]);
  });

  it('4件のとき throw し、メッセージに id を含める', () => {
    const input = [
      p('w', true, 1),
      p('x', true, 2),
      p('y', true, 3),
      p('z', true, 4),
    ];
    const fn = () => selectFeatured(input);
    expect(fn).toThrow();
    for (const id of ['w', 'x', 'y', 'z']) expect(fn).toThrow(new RegExp(id));
  });

  it('5件以上でも throw する', () => {
    const input = [1, 2, 3, 4, 5].map((n) => p(`p${n}`, true, n));
    expect(() => selectFeatured(input)).toThrow();
  });

  it('featured どうしで order が重なると throw し、order と id を含める', () => {
    const fn = () => selectFeatured([p('x', true, 1), p('y', true, 1)]);
    expect(fn).toThrow(/order 1\D/);
    expect(fn).toThrow(/x/);
    expect(fn).toThrow(/y/);
  });

  it('featured と非 featured の order が同じでも throw しない', () => {
    expect(() =>
      selectFeatured([p('a', true, 1), p('b', false, 1)]),
    ).not.toThrow();
  });

  it('非 featured が4件以上でも throw しない', () => {
    const input = [1, 2, 3, 4, 5].map((n) => p(`p${n}`, false, n));
    expect(() => selectFeatured(input)).not.toThrow();
  });

  it('入力を変えず、要素の参照を保つ', () => {
    const input = [p('c', true, 3), p('b', false, 2), p('a', true, 1)];
    const before = [...input];
    const r = selectFeatured(input);
    expect(input).toHaveLength(before.length);
    input.forEach((x, i) => expect(x).toBe(before[i]));
    expect(r).not.toBe(input);
    expect(r[0]).toBe(input[2]);
    expect(r[1]).toBe(input[0]);
  });
});

describe('sortProjects', () => {
  it('featured に関係なく order の昇順に並べる', () => {
    const r = sortProjects([
      p('a', false, 2),
      p('b', true, 1),
      p('c', false, 3),
    ]);
    expect(r.map((x) => x.data.order)).toEqual([1, 2, 3]);
  });

  it('件数が入力と同じ', () => {
    const input = [
      p('a', false, 2),
      p('b', true, 1),
      p('c', false, 3),
      p('d', true, 4),
    ];
    expect(sortProjects(input)).toHaveLength(input.length);
  });

  it('入力を変えず、要素の参照を保つ', () => {
    const input = [p('a', false, 2), p('b', true, 1)];
    const before = [...input];
    const r = sortProjects(input);
    expect(input).toHaveLength(before.length);
    input.forEach((x, i) => expect(x).toBe(before[i]));
    expect(r).not.toBe(input);
    expect(r[0]).toBe(input[1]);
    expect(r[1]).toBe(input[0]);
  });

  it('order が同じ要素は入力の順を保つ', () => {
    const r = sortProjects([
      p('b', false, 2),
      p('a', false, 1),
      p('c', true, 1),
    ]);
    expect(r.map((x) => x.id)).toEqual(['a', 'c', 'b']);
  });
});
