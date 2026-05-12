import { CharacterSheetResponse } from '../../create-character/models/character-sheet-api.model';
import { CharacterSummary, ClassEntry } from './profile.model';

interface SubclassCardLike {
  associatedClassName?: string;
  subclassPathName?: string;
}

interface CharacterSheetLike extends Pick<
  CharacterSheetResponse,
  'id' | 'name' | 'pronouns' | 'level' | 'createdAt' | 'lastModifiedAt'
> {
  subclassCards?: SubclassCardLike[];
}

export function extractClassEntries(subclassCards: SubclassCardLike[]): ClassEntry[] {
  const seen = new Map<string, ClassEntry>();
  for (const card of subclassCards) {
    const className = card.associatedClassName ?? 'Unknown';
    if (!seen.has(className)) {
      seen.set(className, { className, subclassName: card.subclassPathName });
    }
  }
  return Array.from(seen.values());
}

export function mapToSummary(sheet: CharacterSheetLike): CharacterSummary {
  return {
    id: sheet.id,
    name: sheet.name,
    pronouns: sheet.pronouns,
    level: sheet.level,
    classEntries: extractClassEntries(sheet.subclassCards ?? []),
    createdAt: sheet.createdAt,
    lastModifiedAt: sheet.lastModifiedAt,
  };
}
