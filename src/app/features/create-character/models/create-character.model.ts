export interface Tab {
  id: TabId;
  label: string;
}

export type TabId =
  | 'class'
  | 'subclass'
  | 'ancestry'
  | 'community'
  | 'traits'
  | 'starting-weapon'
  | 'starting-armor'
  | 'experiences'
  | 'domain-cards';

export type CharacterFormField = 'name' | 'pronouns';

export interface CharacterSelections {
  class?: string;
  subclass?: string;
  domains?: string;
  ancestry?: string;
  community?: string;
  traits?: string;
  weapon?: string;
  armor?: string;
}

export const CHARACTER_TABS: Tab[] = [
  { id: 'class', label: 'Class' },
  { id: 'subclass', label: 'Subclass' },
  { id: 'ancestry', label: 'Ancestry' },
  { id: 'community', label: 'Community' },
  { id: 'traits', label: 'Traits' },
  { id: 'starting-weapon', label: 'Starting Weapon' },
  { id: 'starting-armor', label: 'Starting Armor' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'domain-cards', label: 'Domain Cards' },
];
