import { describe, it, expect } from 'vitest';
import {
  applyRestToRaw,
  applyRestToView,
  restUpdateRequest,
  RestStateSources,
  toRestCharacterState,
} from './rest-state.mapper';
import { RestResourceChanges } from '../models/rest.model';
import { CharacterSheetView, DisplayStat, TraitDisplay } from '../../../../character-sheet/models/character-sheet-view.model';
import { CharacterSheetResponse } from '../../../../create-character/models/character-sheet-api.model';

function stat(value: number): DisplayStat {
  return { base: value, modified: value, hasModifier: false, modifierSources: [] };
}

function trait(name: string, modifier: number): TraitDisplay {
  return { name, abbreviation: name.slice(0, 3).toUpperCase(), modifier: stat(modifier), marked: false };
}

function view(overrides: Partial<CharacterSheetView> = {}): CharacterSheetView {
  return {
    id: 1,
    ownerId: 2,
    name: 'Aragorn',
    level: 5,
    proficiency: stat(2),
    evasion: stat(10),
    hitPointMax: stat(10),
    armorScore: stat(5),
    majorDamageThreshold: stat(3),
    severeDamageThreshold: stat(6),
    hopeMax: stat(6),
    stressMax: stat(6),
    hitPointMarked: 0,
    armorMarked: 0,
    armorMax: 5,
    hopeMarked: 0,
    stressMarked: 0,
    gold: 0,
    traits: [trait('Instinct', 3), trait('Presence', 2)],
    activePrimaryWeapon: null,
    activeSecondaryWeapon: null,
    activeArmor: null,
    classCards: [],
    subclassCards: [],
    ancestryCards: [],
    communityCards: [],
    domainCards: [],
    equippedDomainCards: [],
    vaultDomainCards: [],
    ...overrides,
  } as CharacterSheetView;
}

function raw(overrides: Partial<CharacterSheetResponse> = {}): CharacterSheetResponse {
  return { id: 1, instinctModifier: 3, ...overrides } as CharacterSheetResponse;
}

function sources(overrides: Partial<RestStateSources> = {}): RestStateSources {
  return {
    view: view(),
    raw: raw(),
    hitPointMarked: 4,
    stressMarked: 3,
    armorMarked: 2,
    hopeHeld: 1,
    hopeCap: 6,
    focusHeld: 0,
    focusMax: 6,
    favor: 3,
    ...overrides,
  };
}

describe('toRestCharacterState', () => {
  it('should return null before the view has loaded', () => {
    expect(toRestCharacterState(sources({ view: null }))).toBeNull();
  });

  it('should return null before the raw response has loaded', () => {
    expect(toRestCharacterState(sources({ raw: null }))).toBeNull();
  });

  it('should derive the tier from the character level', () => {
    expect(toRestCharacterState(sources({ view: view({ level: 8 }) }))?.tier).toBe(4);
  });

  it('should carry the live marked values through', () => {
    expect(toRestCharacterState(sources({ hitPointMarked: 7 }))?.hitPointMarked).toBe(7);
  });

  it('should read Instinct from the raw column, matching refreshFocus', () => {
    expect(toRestCharacterState(sources({ raw: raw({ instinctModifier: 2 }) }))?.instinct).toBe(2);
  });

  it('should resolve the Spellcast trait value from the subclass card', () => {
    const withPatron = view({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the view's subclass summary is not the API shape
      subclassCards: [] as any,
    });
    const state = toRestCharacterState(
      sources({
        view: withPatron,
        raw: raw({
          subclassCards: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- only spellcastingTrait matters here
            { id: 1, name: 'Pact of the Endless', spellcastingTrait: { trait: 'PRESENCE' } } as any,
          ],
        }),
      }),
    );

    expect(state?.spellcastTrait).toBe(2);
  });

  it('should match the trait name case-insensitively', () => {
    const state = toRestCharacterState(
      sources({
        raw: raw({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- only spellcastingTrait matters here
          subclassCards: [{ id: 1, name: 'Path', spellcastingTrait: { trait: 'instinct' } } as any],
        }),
      }),
    );

    expect(state?.spellcastTrait).toBe(3);
  });

  it('should report no Spellcast trait when no subclass names one', () => {
    expect(toRestCharacterState(sources())?.spellcastTrait).toBeNull();
  });

  it('should keep the trait name but no value when the named trait is unknown', () => {
    const state = toRestCharacterState(
      sources({
        raw: raw({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- only spellcastingTrait matters here
          subclassCards: [{ id: 1, name: 'Path', spellcastingTrait: { trait: 'CHARM' } } as any],
        }),
      }),
    );

    expect(state).toMatchObject({ spellcastTrait: null, spellcastTraitName: 'CHARM' });
  });

  it('should default Wolf Form to inactive when the field is absent', () => {
    expect(toRestCharacterState(sources())?.wolfFormActive).toBe(false);
  });
});

const CHANGES: RestResourceChanges = {
  hitPointMarked: 1,
  stressMarked: 2,
  armorMarked: 3,
  hopeHeld: 4,
  focusHeld: 5,
  favor: 6,
  wolfFormActive: false,
};

describe('restUpdateRequest', () => {
  it('should map hopeHeld onto the API’s hopeMarked', () => {
    expect(restUpdateRequest(CHANGES).hopeMarked).toBe(4);
  });

  it('should map focusHeld onto the API’s focusMarked', () => {
    expect(restUpdateRequest(CHANGES).focusMarked).toBe(5);
  });

  it('should send exactly the seven fields a rest can move', () => {
    expect(Object.keys(restUpdateRequest(CHANGES)).sort()).toEqual([
      'armorMarked',
      'favor',
      'focusMarked',
      'hitPointMarked',
      'hopeMarked',
      'stressMarked',
      'wolfFormActive',
    ]);
  });
});

describe('applyRestToRaw', () => {
  it('should write every changed field', () => {
    expect(applyRestToRaw(raw(), CHANGES)).toMatchObject({ hopeMarked: 4, focusMarked: 5, favor: 6 });
  });

  it('should leave unrelated fields alone', () => {
    expect(applyRestToRaw(raw({ gold: 12 }), CHANGES).gold).toBe(12);
  });
});

describe('applyRestToView', () => {
  it('should write the four tracks the view holds', () => {
    expect(applyRestToView(view(), CHANGES)).toMatchObject({
      hitPointMarked: 1,
      stressMarked: 2,
      armorMarked: 3,
      hopeMarked: 4,
    });
  });

  it('should leave the view’s other fields alone', () => {
    expect(applyRestToView(view({ gold: 9 }), CHANGES).gold).toBe(9);
  });
});
