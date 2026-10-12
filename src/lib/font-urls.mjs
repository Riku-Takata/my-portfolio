// BaseLayout の preload 用。global.css の @font-face が参照する woff2 と同じファイルの URL を得る
import geistLatin from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import geistCss from '@fontsource-variable/geist/index.css?raw';

// fontsource の CSS から Geist の latin の @font-face を、書き方を変えずに取り出す。
// url は global.css 経由で出るものと同じファイル(geistLatin)に置き換える
const latinFace = geistCss.match(
  /@font-face\s*\{[^}]*url\(\.\/files\/geist-latin-wght-normal\.woff2\)[^}]*\}/,
);
if (!latinFace) throw new Error('Geist の latin の @font-face が見つからない');

export const geistLatinFontFace =
  latinFace[0].replace('./files/geist-latin-wght-normal.woff2', geistLatin) +
  '\n';

export { geistLatin };
