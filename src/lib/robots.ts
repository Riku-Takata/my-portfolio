// robots.txt の本文。Sitemap は @astrojs/sitemap が出す sitemap-index.xml を指す
export function buildRobotsTxt(siteUrl: string): string {
  return (
    ['User-agent: *', 'Allow: /', `Sitemap: ${siteUrl}/sitemap-index.xml`].join(
      '\n',
    ) + '\n'
  );
}
