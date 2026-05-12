const CLASS_COLORS: Record<string, string> = {
  bard: '#d4a056',
  druid: '#56d478',
  guardian: '#5e8ed4',
  ranger: '#a8d456',
  rogue: '#b87fd4',
  seraph: '#d4c256',
  sorcerer: '#d48056',
  warrior: '#c44',
  wizard: '#7fd4c2',
};

const DEFAULT_CLASS_COLOR = 'rgba(212, 160, 86, 0.4)'; // muted gold fallback

export function classBorderColor(className: string | null | undefined): string {
  if (!className) return DEFAULT_CLASS_COLOR;
  return CLASS_COLORS[className.trim().toLowerCase()] ?? DEFAULT_CLASS_COLOR;
}
