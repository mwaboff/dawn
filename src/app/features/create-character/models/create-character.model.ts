export interface Tab {
  id: TabId;
  label: string;
}

export type TabId =
  | 'class'
  | 'heritage'
  | 'traits'
  | 'additional-info'
  | 'starting-equipment'
  | 'background'
  | 'experiences'
  | 'domain-cards'
  | 'connections';

export type CharacterFormField = 'name' | 'pronouns';

export const CHARACTER_TABS: Tab[] = [
  { id: 'class', label: 'Class' },
  { id: 'heritage', label: 'Heritage' },
  { id: 'traits', label: 'Traits' },
  { id: 'additional-info', label: 'Additional Info' },
  { id: 'starting-equipment', label: 'Starting Equipment' },
  { id: 'background', label: 'Background' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'domain-cards', label: 'Domain Cards' },
  { id: 'connections', label: 'Connections' },
];
