import { RestMoveAccess, RestMoveDefinition, RestMoveId, RestType } from '../models/rest.model';

/**
 * The downtime moves, with their rules text taken verbatim from the Downtime section of the core
 * rulebook (and, for the last two, the Hope & Fear class features). This is the single place the
 * rules text lives -- edit it here or nowhere.
 */
export const REST_MOVES: readonly RestMoveDefinition[] = [
  {
    id: 'tendToWounds',
    name: 'Tend to Wounds',
    text: 'Clear a number of Hit Points equal to 1d4 + your tier. You can do this to an ally instead.',
    rests: ['short'],
    targetable: true,
    partyOption: false,
    requires: null,
    roll: { kind: 'tierPool' },
  },
  {
    id: 'clearStress',
    name: 'Clear Stress',
    text: 'Clear a number of Stress equal to 1d4 + your tier.',
    rests: ['short'],
    targetable: false,
    partyOption: false,
    requires: null,
    roll: { kind: 'tierPool' },
  },
  {
    id: 'repairArmor',
    name: 'Repair Armor',
    text: 'Clear a number of Armor Slots equal to 1d4 + your tier. You can do this to an ally’s armor instead.',
    rests: ['short'],
    targetable: true,
    partyOption: false,
    requires: null,
    roll: { kind: 'tierPool' },
  },
  {
    id: 'tendToAllWounds',
    name: 'Tend to All Wounds',
    text: 'Clear all Hit Points. You can do this to an ally instead.',
    rests: ['long'],
    targetable: true,
    partyOption: false,
    requires: null,
    roll: null,
  },
  {
    id: 'clearAllStress',
    name: 'Clear All Stress',
    text: 'Clear all Stress.',
    rests: ['long'],
    targetable: false,
    partyOption: false,
    requires: null,
    roll: null,
  },
  {
    id: 'repairAllArmor',
    name: 'Repair All Armor',
    text: 'Clear all Armor Slots. You can do this to an ally’s armor instead.',
    rests: ['long'],
    targetable: true,
    partyOption: false,
    requires: null,
    roll: null,
  },
  {
    id: 'prepare',
    name: 'Prepare',
    text: 'Gain a Hope. If you Prepare with one or more members of your party, you each gain 2 Hope.',
    rests: ['short', 'long'],
    targetable: false,
    partyOption: true,
    requires: null,
    roll: null,
  },
  {
    id: 'workOnAProject',
    name: 'Work on a Project',
    text: 'Establish or continue work on a project. Your GM ticks its countdown; nothing on your sheet changes.',
    rests: ['long'],
    targetable: false,
    partyOption: false,
    requires: null,
    roll: null,
  },
  {
    id: 'showTribute',
    name: 'Show tribute to your patron',
    text: 'Describe how you show tribute, then gain Favor equal to your Spellcast trait.',
    rests: ['short', 'long'],
    targetable: false,
    partyOption: false,
    requires: 'warlockResources',
    roll: null,
  },
  {
    id: 'refocus',
    name: 'Refocus',
    text: 'Clear your Focus track, then roll a number of d6s equal to your Instinct and gain Focus equal to the highest result.',
    rests: ['short', 'long'],
    targetable: false,
    partyOption: false,
    requires: 'martialStances',
    roll: { kind: 'focusRefresh' },
  },
];

export const REST_MOVES_BY_ID: Readonly<Record<RestMoveId, RestMoveDefinition>> =
  Object.fromEntries(REST_MOVES.map(move => [move.id, move])) as Readonly<
    Record<RestMoveId, RestMoveDefinition>
  >;

/**
 * The moves this character may take on this rest.
 *
 * `substituteLongRestMove` is the MANUAL short-rest opt-in that unions the long-rest moves in --
 * Clank's "Efficient", the Recovery domain card, and anything else a table rules the same way.
 * Nothing here name-matches ancestry or loot; the player asserts the grant, because matching
 * printed item names is wrong the moment one is spelled differently.
 */
export function movesForRest(
  restType: RestType,
  access: RestMoveAccess,
  substituteLongRestMove: boolean,
): readonly RestMoveDefinition[] {
  return REST_MOVES.filter(move => {
    if (move.requires === 'warlockResources' && !access.warlockResources) return false;
    if (move.requires === 'martialStances' && !access.martialStances) return false;
    if (move.rests.includes(restType)) return true;
    return restType === 'short' && substituteLongRestMove && move.rests.includes('long');
  });
}
