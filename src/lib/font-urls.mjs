// BaseLayout の preload 用。global.css の @font-face が参照する woff2 と同じファイルの URL を得る
// (tests/unit/theme.test.ts が .astro / .ts での @fontsource-variable の読み込みを禁じているため .mjs に置く)
import geistLatin from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';

export { geistLatin };
