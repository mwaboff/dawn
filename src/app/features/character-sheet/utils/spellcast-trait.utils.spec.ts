import { describe, it, expect } from 'vitest';
import { resolveSpellcastTrait } from './spellcast-trait.utils';
import { CharacterSheetResponse } from '../../create-character/models/character-sheet-api.model';
import { CharacterSheetView, TraitDisplay } from '../models/character-sheet-view.model';

function trait(name: string, modified: number): TraitDisplay {
  return {
    name,
    abbreviation: name.slice(0, 3).toUpperCase(),
    modifier: { base: modified, modified, hasModifier: false, modifierSources: [] },
    marked: false,
  };
}

function viewWith(traits: TraitDisplay[]): CharacterSheetView {
  return { traits } as CharacterSheetView;
}

function rawWithSpellcast(traitNames: (string | null)[]): CharacterSheetResponse {
  return {
    subclassCards: traitNames.map((name, index) => ({
      id: index + 1,
      name: `Subclass ${index + 1}`,
      spellcastingTrait: name ? { trait: name } : null,
    })),
  } as CharacterSheetResponse;
}

const TRAITS = [trait('Strength', 2), trait('Presence', 1), trait('Instinct', -1)];

describe('resolveSpellcastTrait', () => {
  it('should resolve the named trait to its modified value', () => {
    const result = resolveSpellcastTrait(rawWithSpellcast(['STRENGTH']), viewWith(TRAITS));

    expect(result).toEqual({ name: 'STRENGTH', value: 2 });
  });

  it('should match the trait name case-insensitively', () => {
    const result = resolveSpellcastTrait(rawWithSpellcast(['presence']), viewWith(TRAITS));

    expect(result.value).toBe(1);
  });

  it('should resolve a negative trait value', () => {
    const result = resolveSpellcastTrait(rawWithSpellcast(['INSTINCT']), viewWith(TRAITS));

    expect(result.value).toBe(-1);
  });

  it('should return nulls when no subclass names a Spellcast trait', () => {
    const result = resolveSpellcastTrait(rawWithSpellcast([null]), viewWith(TRAITS));

    expect(result).toEqual({ name: null, value: null });
  });

  it('should return nulls when subclassCards is absent', () => {
    const result = resolveSpellcastTrait({} as CharacterSheetResponse, viewWith(TRAITS));

    expect(result).toEqual({ name: null, value: null });
  });

  it('should use the first subclass that names a trait when multiclassed', () => {
    const result = resolveSpellcastTrait(
      rawWithSpellcast([null, 'PRESENCE', 'STRENGTH']),
      viewWith(TRAITS),
    );

    expect(result.name).toBe('PRESENCE');
  });

  it('should return a null value when the named trait is missing from the view', () => {
    const result = resolveSpellcastTrait(rawWithSpellcast(['KNOWLEDGE']), viewWith(TRAITS));

    expect(result).toEqual({ name: 'KNOWLEDGE', value: null });
  });

  it('should read the modified value, so trait bonuses count', () => {
    const boosted: TraitDisplay = {
      ...trait('Strength', 2),
      modifier: { base: 2, modified: 4, hasModifier: true, modifierSources: [] },
    };

    const result = resolveSpellcastTrait(rawWithSpellcast(['STRENGTH']), viewWith([boosted]));

    expect(result.value).toBe(4);
  });
});
