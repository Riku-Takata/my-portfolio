import { describe, expect, it } from 'vitest';
import { SITE_URL } from '../../src/lib/site';

describe('SITE_URL', () => {
  it('https:// で始まる', () => {
    expect(SITE_URL).toMatch(/^https:\/\//);
  });

  it('末尾が / でない', () => {
    expect(SITE_URL.endsWith('/')).toBe(false);
  });
});
