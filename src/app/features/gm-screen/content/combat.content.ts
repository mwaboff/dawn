import { GmPanelDef } from '../models/gm-panel.model';

export const COMBAT_PANELS: readonly GmPanelDef[] = [
  {
    id: 'damage-thresholds',
    title: 'Damage, Thresholds & Armor',
    category: 'Combat',
    colSpan: 2,
    defaultOrder: 50,
    keywords: [
      'minor',
      'major',
      'severe',
      'hp',
      'hit points',
      'armor slot',
      'armor score',
      'proficiency',
      'crit',
      'critical damage',
      'resistance',
      'immunity',
      'direct damage',
    ],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'table',
          headers: ['Damage', 'Severity', 'Hit Points marked'],
          rows: [
            ['Below the Major threshold', 'Minor damage', '1'],
            ['At or above the Major threshold', 'Major damage', '2'],
            ['At or above the Severe threshold', 'Severe damage', '3'],
          ],
        },
        {
          kind: 'text',
          paragraphs: [
            'On a successful weapon attack, roll a number of damage dice equal to your Proficiency, add their values together, then add any modifiers to determine the result. For example, a 2d4+2 weapon at Proficiency 2 rolls 4d4+2.',
            'If the attack roll critically succeeds, start with the highest possible value the damage dice can roll, and then make a damage roll as usual, adding it to that value.',
            'Adversaries deal damage equal to their stat block.',
          ],
        },
        {
          kind: 'callout',
          tone: 'neutral',
          text:
            'Your Armor Score represents how many Armor Slots you have available. When you take damage, you can mark an Armor Slot to reduce the severity by one threshold. You can mark only one Armor Slot every time you take damage.',
        },
        {
          kind: 'keyValue',
          entries: [
            { key: 'Physical damage', value: 'Blades, bows, and blows.' },
            { key: 'Magic damage', value: 'Spells.' },
            {
              key: 'Direct damage',
              value: 'Physical or magic damage that can’t be reduced by marking an Armor Slot — e.g. poison.',
            },
            { key: 'Resistance', value: 'Halve the damage, rounding up.' },
            { key: 'Immunity', value: 'Take no damage.' },
          ],
        },
      ],
    },
  },
  {
    id: 'attacks',
    title: 'Attack & Spellcast Rolls',
    category: 'Rolls & Resolution',
    colSpan: 1,
    defaultOrder: 100,
    defaultCollapsed: true,
    keywords: ['evasion', 'attack modifier', 'unarmed', 'throwing', 'spellcast trait', 'd20', 'duality dice'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'keyValue',
          entries: [
            {
              key: 'Adversary attacks',
              value:
                'Roll a d20 and add the adversary’s attack modifier. The attack hits if the result is equal to or greater than the target’s Evasion.',
            },
            {
              key: 'PC attacks',
              value:
                'Roll the Duality Dice and add the associated trait (e.g. Strength +3). Resources such as Experiences and class abilities are spent before the roll. The attack hits if the result is equal to or greater than the adversary’s Difficulty.',
            },
            { key: 'Unarmed attacks', value: 'Roll with Strength or Finesse; the attack deals d4 damage.' },
            { key: 'Throwing', value: 'A Very Close attack roll made with Finesse.' },
            {
              key: 'Spellcast Rolls',
              value:
                'An action roll made with the character’s Spellcast trait, either as an attack or against a set Difficulty — e.g. “Spellcast Roll (14)”.',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'teamwork-rolls',
    title: 'Help, Group, Tag Team & Reaction Rolls',
    category: 'Rolls & Resolution',
    colSpan: 1,
    defaultOrder: 110,
    defaultCollapsed: true,
    keywords: ['assist', 'd6', 'advantage die', 'leader', 'nominate', '3 hope', 'reaction'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'keyValue',
          entries: [
            {
              key: 'Help an Ally',
              value: 'Spend a Hope and roll a d6 advantage die to add to an ally’s roll.',
            },
            {
              key: 'Group Action Roll',
              value:
                'Nominate a leader of the action. All other participants in the group action make reaction rolls. The leader’s action roll gains a +1 bonus for each reaction roll that succeeds and a −1 penalty for each reaction roll that fails. After all other participants have contributed, the leader makes an action roll including these new modifiers.',
            },
            {
              key: 'Tag Team Roll',
              value:
                'Once per session, each player can choose to spend 3 Hope and initiate a Tag Team Roll between their character and another PC. When you do, work with the other player to describe how you combine your actions. You both make separate action rolls, then choose one of the rolls to apply for both of your results. On a roll with Hope, all PCs involved gain a Hope. On a roll with Fear, the GM gains a Fear for each PC involved. On a successful attack, you both roll damage and add the totals together. If the attacks deal different types of damage (physical or magic), you choose which type to deal.',
            },
            {
              key: 'Reaction Rolls',
              value:
                'Reaction rolls work similarly to action rolls, except they don’t generate Hope, Fear, or additional GM moves. Call for one by naming the trait and Difficulty — e.g. “Agility Reaction (14) or take the damage”. On a critical success the character ignores effects that would still trigger on a success, such as damage or Stress.',
            },
          ],
        },
      ],
    },
  },
];
