// Geist の latin の @font-face を、minify せずに /fonts/geist.css として出す。
// Vite の CSS の minify は unicode-range の U+0000-00FF を U+?? に縮めるので、
// preload している latin の subset を unicode-range で見分けられるように、この1つだけを別に出す。
// 中身は global.css から出る同じ @font-face と同じで、同じ woff2 を指す
import type { APIRoute } from 'astro';
import { geistLatinFontFace } from '../../lib/font-urls.mjs';

export const GET: APIRoute = () =>
  new Response(geistLatinFontFace, {
    headers: { 'Content-Type': 'text/css' },
  });
