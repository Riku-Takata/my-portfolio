import { describe, expect, it } from 'vitest';
import { buildRobotsTxt } from '../../src/lib/robots';

describe('buildRobotsTxt', () => {
  const body = buildRobotsTxt('https://example.com');
  const lines = body.split('\n').map((l) => l.trim());

  it('必要な行がある', () => {
    expect(lines).toContain('User-agent: *');
    expect(lines).toContain('Allow: /');
    expect(lines).toContain('Sitemap: https://example.com/sitemap-index.xml');
  });

  it('Sitemap の行はちょうど1つ', () => {
    expect(lines.filter((l) => l.startsWith('Sitemap:'))).toHaveLength(1);
  });

  it('3行を並べて最後に改行を1つ付ける', () => {
    expect(body).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap-index.xml\n',
    );
  });
});
