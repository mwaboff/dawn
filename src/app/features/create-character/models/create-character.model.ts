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
  | 'starting-equipment'
  | 'background'
  | 'experiences'
  | 'domain-cards';

export type CharacterFormField = 'name' | 'pronouns';

export interface CharacterSelections {
  class?: string;
  subclass?: string;
  ancestry?: string;
  community?: string;
}

export const CHARACTER_TABS: Tab[] = [
  { id: 'class', label: 'Class' },
  { id: 'subclass', label: 'Subclass' },
  { id: 'ancestry', label: 'Ancestry' },
  { id: 'community', label: 'Community' },
  { id: 'traits', label: 'Traits' },
  { id: 'starting-equipment', label: 'Starting Equipment' },
  { id: 'background', label: 'Background' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'domain-cards', label: 'Domain Cards' },
];
