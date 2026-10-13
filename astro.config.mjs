import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  integrations: [mdx()],
  // TODO(content): 仮の URL。正式な URL が決まったら src/lib/site.ts の SITE_URL と一緒に直す
  site: 'https://my-portfolio-riku-takata.vercel.app',
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});
