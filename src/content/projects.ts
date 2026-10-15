import type { ProjectEntry } from '../lib/schemas';

// TODO(content): title と context.period 以外は仮の値。開発者が実際の内容に書き換える
export const projects: ProjectEntry[] = [
  {
    id: 'satellite-insar',
    title: '衛星 InSAR による地表変動の解析基盤',
    context: {
      label: '仮の文脈',
      period: { start: '2024-04', end: 'present' },
    },
    summary: 'TODO(content): 仮の概要',
    highlight: 'TODO(content): 仮のハイライト',
    techStack: ['仮の技術1', '仮の技術2', '仮の技術3'],
    links: [],
    featured: true,
    order: 1,
  },
  {
    id: 'rag-knowledge-base',
    title: 'RAG による社内ナレッジ検索基盤',
    context: {
      label: '仮の文脈',
      period: { start: '2024-10', end: 'present' },
    },
    summary: 'TODO(content): 仮の概要',
    highlight: 'TODO(content): 仮のハイライト',
    techStack: ['仮の技術1', '仮の技術2', '仮の技術3'],
    links: [],
    featured: true,
    order: 2,
  },
];
