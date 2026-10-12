import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  // TODO(content): 仮の URL。正式な URL が決まったら src/lib/site.ts の SITE_URL と一緒に直す
  site: 'https://my-portfolio-riku-takata.vercel.app',
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});
