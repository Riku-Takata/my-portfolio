import { projects } from '../content/projects';
import { resume } from '../content/resume';
import { timeline } from '../content/timeline';
import { selectFeatured } from './projects';
import {
  profileSchema,
  projectEntrySchema,
  timelineItemSchema,
  type Profile,
  type ProjectEntry,
  type TimelineItem,
} from './schemas';

export function loadProjects(): ProjectEntry[] {
  return projects.map((p) => projectEntrySchema.parse(p));
}

export function loadFeaturedProjects(): ProjectEntry[] {
  const loaded = loadProjects();
  const wrapped = loaded.map((p) => ({ id: p.id, data: p }));
  return selectFeatured(wrapped).map((w) => w.data);
}

export function sortTimeline<T extends { period: { start: string } }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) =>
    a.period.start < b.period.start
      ? 1
      : a.period.start > b.period.start
        ? -1
        : 0,
  );
}

export function loadTimeline(): TimelineItem[] {
  const parsed = timeline.map((t) => timelineItemSchema.parse(t));
  return sortTimeline(parsed);
}

export function loadProfile(): Profile {
  return profileSchema.parse(resume.profile);
}
