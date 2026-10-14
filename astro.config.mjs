import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/lib/site.ts';

export default defineConfig({
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      // HTML のページだけを入れる(OGP 画像、フォントの CSS、404、robots.txt などを除く)
      filter: (page) =>
        page.endsWith('/') &&
        !page.includes('/og/') &&
        !page.includes('/fonts/') &&
        !page.includes('/404'),
    }),
  ],
  site: SITE_URL,
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});
