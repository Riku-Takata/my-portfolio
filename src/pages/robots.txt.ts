import type { APIRoute } from 'astro';
import { buildRobotsTxt } from '../lib/robots';
import { SITE_URL } from '../lib/site';

export const GET: APIRoute = () =>
  new Response(buildRobotsTxt(SITE_URL), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
