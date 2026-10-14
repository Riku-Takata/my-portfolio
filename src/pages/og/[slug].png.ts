import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { resume } from '../../content/resume';
import { renderOgPng } from '../../lib/og';

export const getStaticPaths = (async () => {
  const projects = await getCollection('projects');
  return [
    {
      params: { slug: 'index' },
      props: {
        title: resume.profile.nameEn,
        summary: resume.profile.summary,
      },
    },
    ...projects.map((p) => ({
      params: { slug: p.id },
      props: { title: p.data.title, summary: p.data.summary },
    })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ title: string; summary: string }> = async ({
  props,
}) => {
  const png = await renderOgPng(props);
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
