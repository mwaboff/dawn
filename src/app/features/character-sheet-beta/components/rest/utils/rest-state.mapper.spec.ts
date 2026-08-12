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

  it('should read Wolf Form when the GM has enabled transformations', () => {
    const enabled = raw({ transformationEnabled: true, wolfFormActive: true });

    expect(toRestCharacterState(sources({ raw: enabled }))?.wolfFormActive).toBe(true);
  });

  /** A revoked grant leaves the flag stranded; clearing it is the GM's job, not the rest's. */
  it('should treat Wolf Form as inactive when transformations are not enabled', () => {
    const revoked = raw({ transformationEnabled: false, wolfFormActive: true });

    expect(toRestCharacterState(sources({ raw: revoked }))?.wolfFormActive).toBe(false);
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

/** The pre-rest values `CHANGES` moved away from: every field differs. */
const BEFORE: RestResourceChanges = {
  hitPointMarked: 9,
  stressMarked: 9,
  armorMarked: 9,
  hopeHeld: 9,
  focusHeld: 9,
  favor: 9,
  wolfFormActive: true,
};

describe('restUpdateRequest', () => {
  it('should map hopeHeld onto the API’s hopeMarked', () => {
    expect(restUpdateRequest(CHANGES, BEFORE).hopeMarked).toBe(4);
  });

  it('should map focusHeld onto the API’s focusMarked', () => {
    expect(restUpdateRequest(CHANGES, BEFORE).focusMarked).toBe(5);
  });

  it('should send exactly the seven fields a rest can move when all seven moved', () => {
    expect(Object.keys(restUpdateRequest(CHANGES, BEFORE)).sort()).toEqual([
      'armorMarked',
      'favor',
      'focusMarked',
      'hitPointMarked',
      'hopeMarked',
      'stressMarked',
      'wolfFormActive',
    ]);
  });

  it('should send only the fields the rest actually moved', () => {
    const before: RestResourceChanges = { ...CHANGES, hitPointMarked: 4 };

    expect(restUpdateRequest(CHANGES, before)).toEqual({ hitPointMarked: 1 });
  });

  /**
   * The bug this guards: the backend rejects a player-side write to transformation state on a
   * character whose GM has not enabled it, and a rejected body loses the HP the rest did clear.
   */
  it('should omit wolfFormActive when the rest left it alone', () => {
    const before: RestResourceChanges = { ...CHANGES, stressMarked: 5 };

    expect(restUpdateRequest(CHANGES, before)).not.toHaveProperty('wolfFormActive');
  });

  it('should send nothing when nothing moved', () => {
    expect(restUpdateRequest(CHANGES, CHANGES)).toEqual({});
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
