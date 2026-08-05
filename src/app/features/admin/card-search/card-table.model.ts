import { BrowsableType } from '../../../shared/services/codex-browse.service';

/**
 * One rendered table row. `link` is the router path the name cell anchors to, so
 * ctrl/cmd+click and middle-click open a real new tab -- the reason this table
 * exists instead of the old click-handler card grid.
 */
export interface CardRow {
  id: number;
  name: string;
  typeLabel: string;
  link: (string | number)[];
  /** Type-specific column values, keyed by `ColumnSpec.key`. */
  cells: Record<string, string>;
}

export interface ColumnSpec {
  key: string;
  label: string;
  /** Column width as a CSS grid track value. */
  width: string;
  /** Right-align numeric columns. */
  numeric?: boolean;
}

export interface AdminCategory {
  id: string;
  label: string;
  type: BrowsableType;
  /** Columns shown between Name and Source for this category. */
  columns: ColumnSpec[];
}

const TIER: ColumnSpec = { key: 'tier', label: 'Tier', width: '4rem', numeric: true };
const LEVEL: ColumnSpec = { key: 'level', label: 'Level', width: '4.5rem', numeric: true };

/** Appended to every category so admins can tell core content from expansion content. */
export const EXPANSION_COLUMN: ColumnSpec = { key: 'expansion', label: 'Expansion', width: '11rem' };

const CATEGORY_DEFS: AdminCategory[] = [
  { id: 'domain', label: 'Domains', type: 'DOMAIN', columns: [] },
  { id: 'class', label: 'Classes', type: 'CLASS', columns: [
    { key: 'evasion', label: 'Evasion', width: '5.5rem', numeric: true },
    { key: 'hitPoints', label: 'HP', width: '4rem', numeric: true },
  ] },
  { id: 'subclass', label: 'Subclasses', type: 'SUBCLASS_CARD', columns: [
    { key: 'class', label: 'Class', width: '9rem' },
    { key: 'domains', label: 'Domains', width: '11rem' },
    { key: 'levels', label: 'Cards', width: '16rem' },
  ] },
  { id: 'ancestry', label: 'Ancestries', type: 'ANCESTRY_CARD', columns: [] },
  { id: 'community', label: 'Communities', type: 'COMMUNITY_CARD', columns: [] },
  { id: 'domainCard', label: 'Domain Cards', type: 'DOMAIN_CARD', columns: [
    { key: 'domain', label: 'Domain', width: '8rem' },
    LEVEL,
    { key: 'cardTypeLabel', label: 'Card Type', width: '7rem' },
    { key: 'recallCost', label: 'Recall', width: '5rem', numeric: true },
  ] },
  { id: 'weapon', label: 'Weapons', type: 'WEAPON', columns: [
    TIER,
    { key: 'trait', label: 'Trait', width: '7rem' },
    { key: 'range', label: 'Range', width: '7rem' },
    { key: 'burden', label: 'Burden', width: '6rem' },
    { key: 'damage', label: 'Damage', width: '7rem' },
  ] },
  { id: 'armor', label: 'Armor', type: 'ARMOR', columns: [
    TIER,
    { key: 'baseScore', label: 'Score', width: '5rem', numeric: true },
    { key: 'thresholds', label: 'Thresholds', width: '7rem' },
  ] },
  { id: 'loot', label: 'Loot', type: 'LOOT', columns: [
    TIER,
    { key: 'consumable', label: 'Consumable', width: '7rem' },
  ] },
  { id: 'adversary', label: 'Adversaries', type: 'ADVERSARY', columns: [
    TIER,
    { key: 'adversaryType', label: 'Type', width: '9rem' },
    { key: 'difficulty', label: 'Diff', width: '4.5rem', numeric: true },
    { key: 'hp', label: 'HP', width: '4rem', numeric: true },
  ] },
  { id: 'environment', label: 'Environments', type: 'ENVIRONMENT', columns: [
    TIER,
    { key: 'environmentType', label: 'Type', width: '9rem' },
    { key: 'difficulty', label: 'Diff', width: '4.5rem', numeric: true },
  ] },
  { id: 'feature', label: 'Features', type: 'FEATURE', columns: [
    { key: 'detail', label: 'Detail', width: '14rem' },
  ] },
  { id: 'beastform', label: 'Beastforms', type: 'BEASTFORM', columns: [
    TIER,
    { key: 'example', label: 'Examples', width: '14rem' },
  ] },
  { id: 'transformationCard', label: 'Transformation Cards', type: 'TRANSFORMATION_CARD', columns: [
    { key: 'detail', label: 'Detail', width: '16rem' },
  ] },
  { id: 'martialStance', label: 'Martial Stances', type: 'MARTIAL_STANCE', columns: [
    TIER,
    { key: 'detail', label: 'Detail', width: '14rem' },
  ] },
];

export const ADMIN_CATEGORIES: AdminCategory[] = CATEGORY_DEFS.map(cat => ({
  ...cat,
  columns: [...cat.columns, EXPANSION_COLUMN],
}));

/** Columns shown in place of per-type columns when searching across all types. */
export const ALL_TYPES_COLUMNS: ColumnSpec[] = [
  { key: 'detail', label: 'Detail', width: '16rem' },
  EXPANSION_COLUMN,
];

export const ALL_TYPES_ID = 'all';

export const PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 50;

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}
