import { GmContentBlock, GmPanelDef } from '../models/gm-panel.model';

/**
 * Flattened lowercase text is derived once per panel object. Panel defs are module-level
 * constants, so keying by identity means the whole registry is flattened at most once for the
 * lifetime of the page rather than on every keystroke.
 */
const searchTextCache = new WeakMap<GmPanelDef, string>();

function collectBlockText(block: GmContentBlock, into: string[]): void {
  switch (block.kind) {
    case 'text':
      into.push(...block.paragraphs);
      break;
    case 'list':
      into.push(...block.items);
      break;
    case 'keyValue':
      for (const entry of block.entries) {
        into.push(entry.key, entry.value);
        if (entry.example) into.push(entry.example);
      }
      break;
    case 'table':
      into.push(...block.headers);
      for (const row of block.rows) into.push(...row);
      break;
    case 'steps':
      for (const step of block.items) {
        into.push(step.label);
        if (step.detail) into.push(step.detail);
      }
      break;
    case 'callout':
      into.push(block.text);
      break;
  }
}

/** Title + keywords + every string inside a static body, lowercased and space-joined. */
export function panelSearchText(panel: GmPanelDef): string {
  const cached = searchTextCache.get(panel);
  if (cached !== undefined) return cached;

  const parts: string[] = [panel.title, ...(panel.keywords ?? [])];
  if (panel.body.kind === 'static') {
    for (const block of panel.body.blocks) collectBlockText(block, parts);
  }

  const text = parts.join(' ').toLowerCase();
  searchTextCache.set(panel, text);
  return text;
}

/** Case-insensitive substring match. An empty or whitespace-only query matches every panel. */
export function matchesFilter(panel: GmPanelDef, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return needle === '' || panelSearchText(panel).includes(needle);
}
