import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../../../shared/components/adversary-card/adversary-card.model';
import { SearchableEntityType } from '../../../shared/models/search.model';
import { CardRow, ColumnSpec, SortState, ADMIN_CATEGORIES } from './card-table.model';

/** A fetched entity awaiting row construction, kept so rows can be rebuilt when the
 *  expansion lookup resolves after the results do. */
export type RowItem =
  | { kind: 'card'; card: CardData; category: string }
  | { kind: 'adversary'; adversary: AdversaryData };

/** Expansion id -> display name, resolved from the cached expansion list. */
export type ExpansionNames = ReadonlyMap<number, string>;

/** Maps a search result's entity type to its admin route segment / category id. */
const SEARCH_TYPE_TO_CATEGORY: Partial<Record<SearchableEntityType, string>> = {
  DOMAIN: 'domain',
  CLASS: 'class',
  SUBCLASS_CARD: 'subclass',
  ANCESTRY_CARD: 'ancestry',
  COMMUNITY_CARD: 'community',
  DOMAIN_CARD: 'domainCard',
  WEAPON: 'weapon',
  ARMOR: 'armor',
  LOOT: 'loot',
  ADVERSARY: 'adversary',
  ENVIRONMENT: 'environment',
  COMPANION: 'companion',
  FEATURE: 'feature',
  BEASTFORM: 'beastform',
  TRANSFORMATION_CARD: 'transformationCard',
  MARTIAL_STANCE: 'martialStance',
};

export function categoryForSearchType(type: SearchableEntityType): string | null {
  return SEARCH_TYPE_TO_CATEGORY[type] ?? null;
}

export function categoryLabel(categoryId: string): string {
  return ADMIN_CATEGORIES.find(c => c.id === categoryId)?.label ?? categoryId;
}

function titleCase(value: unknown): string {
  if (value == null || value === '') return '';
  return String(value)
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function str(value: unknown): string {
  return value == null || value === '' ? '' : String(value);
}

/** First sentence/line of a description, for the generic Detail column. */
function summarize(text: string | undefined): string {
  if (!text) return '';
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > 90 ? `${flat.slice(0, 89)}…` : flat;
}

function cardCell(card: CardData, key: string, expansions: ExpansionNames): string {
  const meta = card.metadata ?? {};
  switch (key) {
    case 'expansion': return expansionName(meta['expansionName'], meta['expansionId'], expansions);
    case 'tier': return str(meta['tier']);
    case 'level': return str(meta['level']);
    case 'domain': return str(meta['domainName']);
    case 'cardTypeLabel': return titleCase(meta['type']);
    case 'recallCost': return str(meta['recallCost']);
    case 'trait': return titleCase(meta['trait']);
    case 'range': return titleCase(meta['range']);
    case 'burden': return titleCase(meta['burden']);
    case 'damage': {
      const damage = meta['damage'] as { notation?: string } | undefined;
      return str(damage?.notation);
    }
    case 'baseScore': return str(meta['baseScore']);
    case 'thresholds': {
      const major = meta['baseMajorThreshold'];
      const severe = meta['baseSevereThreshold'];
      return major == null && severe == null ? '' : `${str(major)} / ${str(severe)}`;
    }
    case 'consumable': return meta['isConsumable'] === true ? 'Yes' : 'No';
    case 'environmentType': return titleCase(meta['environmentType']);
    case 'difficulty': return str(meta['difficulty']);
    case 'evasion': return str(meta['startingEvasion']);
    case 'hitPoints': return str(meta['startingHitPoints']);
    case 'example': return str(meta['example']);
    case 'class': return str(meta['associatedClassName']);
    case 'domains': {
      const domains = meta['domainNames'];
      return Array.isArray(domains) ? domains.join(' · ') : '';
    }
    case 'levels': return titleCase(meta['level']);
    case 'detail':
      return card.subtitle
        ? [card.subtitle, card.subtitleSecondary].filter(Boolean).join(' · ')
        : summarize(card.description);
    default: return '';
  }
}

function adversaryCell(adversary: AdversaryData, key: string, expansions: ExpansionNames): string {
  switch (key) {
    case 'expansion': return expansionName(undefined, adversary.expansionId, expansions);
    case 'tier': return str(adversary.tier);
    case 'adversaryType': return titleCase(adversary.adversaryType);
    case 'difficulty': return str(adversary.difficulty);
    case 'hp': return str(adversary.hitPointMax);
    case 'detail':
      return [titleCase(adversary.adversaryType), adversary.tier ? `Tier ${adversary.tier}` : '']
        .filter(Boolean).join(' · ');
    default: return '';
  }
}

/**
 * Prefers a name the API already sent; otherwise resolves the id against the cached
 * expansion list. Falls back to `#<id>` so a row is never silently blank when the
 * lookup has not loaded or the expansion was deleted.
 */
function expansionName(name: unknown, id: unknown, expansions: ExpansionNames): string {
  if (typeof name === 'string' && name) return name;
  if (typeof id !== 'number') return '';
  return expansions.get(id) ?? `#${id}`;
}

/**
 * Subclass cards edit through their parent path, not the generic card editor.
 * Falls back to the card route when the path id is missing so the row is never
 * a dead link.
 */
function cardLink(card: CardData, categoryId: string): (string | number)[] {
  if (categoryId === 'subclass') {
    const pathId = card.metadata?.['subclassPathId'] as number | undefined;
    if (pathId) return ['/admin/cards/subclass-path', pathId];
  }
  return ['/admin/cards', categoryId, card.id];
}

export function buildCardRow(
  card: CardData,
  categoryId: string,
  columns: ColumnSpec[],
  expansions: ExpansionNames = new Map(),
): CardRow {
  const cells: Record<string, string> = {};
  for (const col of columns) cells[col.key] = cardCell(card, col.key, expansions);

  // A subclass row stands for the whole path (the thing its link edits), so it is
  // identified by the path rather than by whichever level card produced it.
  const pathId = categoryId === 'subclass'
    ? card.metadata?.['subclassPathId'] as number | undefined
    : undefined;
  const pathName = card.metadata?.['subclassPathName'] as string | undefined;

  return {
    id: pathId ?? card.id,
    name: (pathId && pathName) || card.name,
    typeLabel: categoryLabel(categoryId),
    link: cardLink(card, categoryId),
    cells,
  };
}

const SUBCLASS_LEVELS = ['Foundation', 'Specialization', 'Mastery'];

/**
 * Collapses rows that open the same editor into one. Subclass browse returns a
 * separate card per level (foundation/specialization/mastery) but all three edit
 * the same path, so without this the table shows three identical-looking rows
 * pointing at one destination.
 */
export function dedupeRowsByLink(rows: CardRow[]): CardRow[] {
  const byLink = new Map<string, CardRow>();

  for (const row of rows) {
    const key = row.link.join('/');
    const existing = byLink.get(key);
    if (!existing) {
      byLink.set(key, { ...row, cells: { ...row.cells } });
      continue;
    }
    for (const [cellKey, value] of Object.entries(row.cells)) {
      if (cellKey === 'levels') existing.cells[cellKey] = mergeLevels(existing.cells[cellKey], value);
      else if (!existing.cells[cellKey]) existing.cells[cellKey] = value;
    }
  }

  return [...byLink.values()];
}

function mergeLevels(existing: string, incoming: string): string {
  const merged = new Set([...existing.split(' · '), ...incoming.split(' · ')].filter(Boolean));
  const known = SUBCLASS_LEVELS.filter(level => merged.has(level));
  const other = [...merged].filter(level => !SUBCLASS_LEVELS.includes(level));
  return [...known, ...other].join(' · ');
}

export function buildAdversaryRow(
  adversary: AdversaryData,
  columns: ColumnSpec[],
  expansions: ExpansionNames = new Map(),
): CardRow {
  const cells: Record<string, string> = {};
  for (const col of columns) cells[col.key] = adversaryCell(adversary, col.key, expansions);
  return {
    id: adversary.id,
    name: adversary.name,
    typeLabel: categoryLabel('adversary'),
    link: ['/admin/cards', 'adversary', adversary.id],
    cells,
  };
}

/**
 * Sorts rows client-side. The backend paginates every catalogue endpoint with a
 * hardcoded `Sort.by("id").ascending()` and exposes no sort param, so this only
 * orders the page already loaded -- the UI says as much next to the page-size picker.
 */
export function sortRows(rows: CardRow[], sort: SortState | null): CardRow[] {
  if (!sort) return rows;
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => factor * compareBy(a, b, sort.key));
}

function compareBy(a: CardRow, b: CardRow, key: string): number {
  if (key === 'id') return a.id - b.id;
  if (key === 'name') return a.name.localeCompare(b.name);
  if (key === 'typeLabel') return a.typeLabel.localeCompare(b.typeLabel);

  const av = a.cells[key] ?? '';
  const bv = b.cells[key] ?? '';
  const an = Number(av);
  const bn = Number(bv);
  // Blank cells sort last in ascending order rather than clumping at the top.
  if (av === '' || bv === '') return av === bv ? 0 : av === '' ? 1 : -1;
  if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
  return av.localeCompare(bv);
}

/** Builds and collapses the rows for a set of fetched items. */
export function buildRows(
  items: readonly RowItem[],
  columns: ColumnSpec[],
  expansions: ExpansionNames,
): CardRow[] {
  return dedupeRowsByLink(items.map(item => item.kind === 'adversary'
    ? buildAdversaryRow(item.adversary, columns, expansions)
    : buildCardRow(item.card, item.category, columns, expansions)));
}
