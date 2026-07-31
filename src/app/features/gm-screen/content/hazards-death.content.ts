import { GmPanelDef } from '../models/gm-panel.model';

export const HAZARDS_DEATH_PANELS: readonly GmPanelDef[] = [
  {
    id: 'environment-hazards',
    title: 'Cover, Darkness, Underwater & Falling',
    category: 'Hazards & Death',
    colSpan: 1,
    defaultOrder: 150,
    defaultCollapsed: true,
    keywords: [
      'line of sight',
      'obscured',
      'concealment',
      'dark',
      'swim',
      'drowning',
      'hold breath',
      'fall damage',
      'collision',
      'terrain',
    ],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'keyValue',
          entries: [
            { key: 'Cover', value: 'Attack rolls made at disadvantage.' },
            { key: 'Out of Sight', value: "Can't be targeted unless by an area of effect." },
            { key: 'Darkness', value: 'Raised Difficulty or disadvantage.' },
          ],
        },
        {
          kind: 'text',
          paragraphs: ['Moving and Fighting Underwater'],
        },
        {
          kind: 'list',
          items: [
            'Attack rolls have disadvantage',
            'Hold Breath equal to a countdown (e.g. 1d3)',
            'Tick the countdown down when a PC takes an action, and again if they roll with failure or Fear',
            'Mark a Stress for each action taken while out of breath',
          ],
        },
        {
          kind: 'text',
          paragraphs: ['Falling and Collision Damage'],
        },
        {
          kind: 'table',
          dense: true,
          headers: ['Distance', 'Damage'],
          rows: [
            ['Very Close', '1d10+3'],
            ['Close', '1d20+5'],
            ['Far or Very Far', '1d100+15 or death'],
            ['Collision', '1d20+5'],
          ],
        },
      ],
    },
  },
  {
    id: 'death-moves',
    title: 'Death Moves',
    category: 'Hazards & Death',
    colSpan: 1,
    defaultOrder: 160,
    defaultCollapsed: true,
    keywords: ['dying', 'dead', 'scar', 'unconscious', 'last hit point', 'retire', 'veil of death'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'callout',
          tone: 'fear',
          text: 'When you mark your last Hit Point, you must make a death move.',
        },
        {
          kind: 'keyValue',
          entries: [
            {
              key: 'Blaze of Glory',
              value: 'Take one action, which automatically critically succeeds, then the PC dies.',
            },
            {
              key: 'Avoid Death',
              value:
                'The PC drops unconscious. Roll your Hope Die; if its value is equal to or under the PC’s level, they gain a scar — cross out one Hope slot, and when they have no Hope slots left, retire the character. They return to consciousness when they clear Hit Points.',
            },
            {
              key: 'Risk It All',
              value:
                'Roll your Duality Dice. With Hope: clear Hit Points or Stress equal to the Hope Die value. With Fear: your character crosses through the veil of death. On a critical success: clear all Hit Points and Stress.',
            },
          ],
        },
      ],
    },
  },
];
