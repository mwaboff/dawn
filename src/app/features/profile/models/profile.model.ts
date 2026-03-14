export interface ClassEntry {
  className: string;
  subclassName?: string;
}

export interface CharacterSummary {
  id: number;
  name: string;
  pronouns?: string;
  level: number;
  classEntries: ClassEntry[];
  createdAt: string;
}
