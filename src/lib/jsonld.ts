import type { z } from 'astro/zod';
import { resume } from '../content/resume';
import type { projectSchema } from './schemas';
import { SITE_URL } from './site';

function authorPerson() {
  return { '@type': 'Person' as const, name: resume.profile.nameEn };
}

export function buildPersonJsonLd() {
  return {
    '@context': 'https://schema.org',
    ...authorPerson(),
    alternateName: resume.profile.nameJa,
    url: `${SITE_URL}/`,
    sameAs: [resume.profile.links.github, resume.profile.links.x],
    affiliation: {
      '@type': 'Organization' as const,
      name: resume.profile.affiliation,
    },
  };
}

export function buildCreativeWorkJsonLd(
  data: Pick<z.output<typeof projectSchema>, 'title' | 'summary' | 'period'>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork' as const,
    name: data.title,
    description: data.summary,
    dateCreated: data.period.start,
    author: authorPerson(),
  };
}

export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
