import type { ExternalLink, Media } from './schemas';

const MEDIA_ORDER: readonly Media[] = [
  'github',
  'zenn',
  'note',
  'slide',
  'demo',
];

const DEFAULT_LABELS: Record<Media, string> = {
  github: 'GitHub: Code & README',
  zenn: 'Zenn: 設計・技術解説',
  note: 'note: 開発背景・振り返り',
  slide: 'Slide: 発表資料',
  demo: 'Demo: Webサイト',
};

export function linkLabel(media: Media): string {
  return DEFAULT_LABELS[media];
}

export function sortLinks<T extends Pick<ExternalLink, 'media'>>(
  links: readonly T[],
): T[] {
  return [...links].sort(
    (a, b) => MEDIA_ORDER.indexOf(a.media) - MEDIA_ORDER.indexOf(b.media),
  );
}
