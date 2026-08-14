export interface TraitInfo {
  key: TraitKey;
  name: string;
  actions: string[];
}

export type TraitKey = 'agility' | 'strength' | 'finesse' | 'instinct' | 'presence' | 'knowledge';

export type TraitAssignments = Record<TraitKey, number | null>;

export const TRAITS: TraitInfo[] = [
  { key: 'agility', name: 'Agility', actions: ['Sprint', 'Leap', 'Maneuver'] },
  { key: 'strength', name: 'Strength', actions: ['Lift', 'Smash', 'Grapple'] },
  { key: 'finesse', name: 'Finesse', actions: ['Control', 'Hide', 'Tinker'] },
  { key: 'instinct', name: 'Instinct', actions: ['Perceive', 'Sense', 'Navigate'] },
  { key: 'presence', name: 'Presence', actions: ['Charm', 'Perform', 'Deceive'] },
  { key: 'knowledge', name: 'Knowledge', actions: ['Recall', 'Analyze', 'Comprehend'] },
];

export const TRAIT_VALUE_POOL: number[] = [2, 1, 1, 0, 0, -1];

export const INITIAL_ASSIGNMENTS: TraitAssignments = {
  agility: null,
  strength: null,
  finesse: null,
  instinct: null,
  presence: null,
  knowledge: null,
};

/**
 * Starting spreads printed under "Suggested Traits" on each class's character guide.
 * Keyed by lowercased class name; every entry is a permutation of TRAIT_VALUE_POOL.
 */
export const SUGGESTED_TRAITS: Record<string, TraitAssignments> = {
  assassin: { agility: 2, strength: -1, finesse: 1, instinct: 0, presence: 0, knowledge: 1 },
  bard: { agility: 0, strength: -1, finesse: 1, instinct: 0, presence: 2, knowledge: 1 },
  brawler: { agility: 1, strength: 1, finesse: 0, instinct: 2, presence: 0, knowledge: -1 },
  druid: { agility: 1, strength: 0, finesse: 1, instinct: 2, presence: -1, knowledge: 0 },
  guardian: { agility: 1, strength: 2, finesse: -1, instinct: 0, presence: 1, knowledge: 0 },
  ranger: { agility: 2, strength: 0, finesse: 1, instinct: 1, presence: -1, knowledge: 0 },
  rogue: { agility: 1, strength: -1, finesse: 2, instinct: 0, presence: 1, knowledge: 0 },
  seraph: { agility: 0, strength: 2, finesse: 0, instinct: 1, presence: 1, knowledge: -1 },
  sorcerer: { agility: 0, strength: -1, finesse: 1, instinct: 2, presence: 1, knowledge: 0 },
  warlock: { agility: 1, strength: -1, finesse: 0, instinct: 1, presence: 2, knowledge: 0 },
  warrior: { agility: 2, strength: 1, finesse: 0, instinct: 1, presence: -1, knowledge: 0 },
  witch: { agility: 0, strength: -1, finesse: 0, instinct: 2, presence: 1, knowledge: 1 },
  wizard: { agility: -1, strength: 0, finesse: 0, instinct: 1, presence: 1, knowledge: 2 },
};

/** Returns the suggested spread for a class, or null for homebrew/unknown classes. */
export function suggestedTraitsFor(className: string | null | undefined): TraitAssignments | null {
  if (!className) return null;
  return SUGGESTED_TRAITS[className.trim().toLowerCase()] ?? null;
}
