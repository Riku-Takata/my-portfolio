import { createHash } from 'node:crypto';

/**
 * .mmd のバイト列の SHA-256 を小文字の16進64文字で返す。改行コードや BOM は正規化しない。
 * @param {string | Buffer} source
 * @returns {string}
 */
export function computeSourceHash(source) {
  return createHash('sha256').update(source).digest('hex');
}

/**
 * SVG の1行目が `<!-- source-sha256: <64文字> -->` のときだけ、その64文字を返す。
 * @param {string} svg
 * @returns {string | null}
 */
export function extractSourceHash(svg) {
  const firstLine = svg.split('\n', 1)[0];
  const match = /^<!-- source-sha256: ([0-9a-f]{64}) -->$/.exec(firstLine);
  return match ? match[1] : null;
}

/**
 * SVG が今の .mmd から書き出されたものか。
 * @param {string | Buffer} mmdSource
 * @param {string} svg
 * @returns {boolean}
 */
export function isSvgFresh(mmdSource, svg) {
  const hash = extractSourceHash(svg);
  return hash !== null && hash === computeSourceHash(mmdSource);
}
