import { describe, expect, it } from 'vitest';
import { renderOgPng } from '../../src/lib/og';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngInfo(buf: Buffer) {
  return {
    signature: buf.subarray(0, 8).equals(SIGNATURE),
    ihdr: buf.subarray(12, 16).toString('ascii'),
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

const expected = { signature: true, ihdr: 'IHDR', width: 1200, height: 630 };

describe('renderOgPng', () => {
  it('1200x630 の PNG を返す', async () => {
    const png = await renderOgPng({ title: 'テスト', summary: '概要' });
    expect(pngInfo(png)).toEqual(expected);
  }, 30_000);

  it('長いタイトルと概要でも例外を出さず 1200x630 になる', async () => {
    const png = await renderOgPng({
      title: 'あ'.repeat(60),
      summary: 'い'.repeat(120),
    });
    expect(pngInfo(png)).toEqual(expected);
  }, 30_000);

  it('title だけ違うとバイト列が違う', async () => {
    const a = await renderOgPng({ title: 'A', summary: 'S' });
    const b = await renderOgPng({ title: 'B', summary: 'S' });
    expect(a.equals(b)).toBe(false);
  }, 30_000);

  it('summary だけ違うとバイト列が違う', async () => {
    const a = await renderOgPng({ title: 'T', summary: 'A' });
    const b = await renderOgPng({ title: 'T', summary: 'B' });
    expect(a.equals(b)).toBe(false);
  }, 30_000);
});
