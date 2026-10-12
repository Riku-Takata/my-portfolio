type ProjectLike = { id: string; data: { featured: boolean; order: number } };

const MAX_FEATURED = 3;

export function sortProjects<T extends ProjectLike>(
  projects: readonly T[],
): T[] {
  return [...projects].sort((a, b) => a.data.order - b.data.order);
}

export function selectFeatured<T extends ProjectLike>(
  projects: readonly T[],
): T[] {
  const featured = projects.filter((p) => p.data.featured);
  if (featured.length > MAX_FEATURED) {
    throw new Error(
      `featured のプロジェクトは ${MAX_FEATURED} 件までです(${featured.length} 件: ${featured.map((p) => p.id).join(', ')})`,
    );
  }
  const idsByOrder = new Map<number, string[]>();
  for (const p of featured) {
    idsByOrder.set(p.data.order, [
      ...(idsByOrder.get(p.data.order) ?? []),
      p.id,
    ]);
  }
  for (const [order, ids] of idsByOrder) {
    if (ids.length > 1) {
      throw new Error(
        `featured のプロジェクトで order ${order} が重なっています(${ids.join(', ')})`,
      );
    }
  }
  return sortProjects(featured);
}
