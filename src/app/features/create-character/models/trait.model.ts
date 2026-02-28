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
