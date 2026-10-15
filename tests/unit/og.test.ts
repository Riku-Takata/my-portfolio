import { describe, expect, it } from 'vitest';
import { TEXT_WIDTH, buildOgTree, renderOgPng } from '../../src/lib/og';

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

describe('buildOgTree', () => {
  // 上限に近い長さ(スキーマの上限はタイトル 60 文字、概要 100 文字)
  const long = {
    title:
      '長いタイトルの例: 衛星 InSAR による地表変動の解析基盤と、可視化・通知・運用までを一つにまとめた基盤',
    summary:
      '長い概要の例: 衛星の SAR データから地表の変動を求め、地図に重ねて表示し、閾値を超えたら通知する。監視と再処理の仕組みも含めて一つの基盤として設計した。',
  };
  const tree = buildOgTree(long);
  const [title, summary, name, band] = tree.props.children;

  it('外枠は余白を 1200×630 の内側に取る', () => {
    expect(tree.props.style).toMatchObject({
      width: 1200,
      height: 630,
      padding: 80,
      boxSizing: 'border-box',
    });
  });

  it('タイトルと概要の幅を左右の余白の内側(1040px)に収め、2行・3行で省略する', () => {
    expect(TEXT_WIDTH).toBe(1040);
    expect(title.props.style).toMatchObject({ width: 1040, lineClamp: 2 });
    expect(summary.props.style).toMatchObject({ width: 1040, lineClamp: 3 });
  });

  it('左下の名前と下端の帯を持つ', () => {
    expect(name.props.style).toMatchObject({ marginTop: 'auto' });
    expect(band.props.style).toMatchObject({
      position: 'absolute',
      bottom: 0,
      height: 8,
      backgroundColor: '#4f46e5',
    });
  });

  it('上限に近い長さでも 1200x630 の PNG になる', async () => {
    expect(pngInfo(await renderOgPng(long))).toEqual(expected);
  }, 30_000);
});
