import { GmPanelDef } from '../models/gm-panel.model';

export const ACTION_ROLL_PANELS: readonly GmPanelDef[] = [
  {
    id: 'action-roll-results',
    title: 'Action Roll Results',
    category: 'Rolls & Resolution',
    colSpan: 2,
    defaultOrder: 10,
    keywords: ['crit', 'critical', 'duality dice', 'hope die', 'fear die', 'outcome', 'stakes'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'steps',
          items: [
            {
              label: 'Call for a roll',
              detail:
                'Call for an action roll when a PC makes a move where the outcome is in question and the success or failure of that move is interesting to the story.',
            },
            { label: 'Set the stakes', detail: 'Establish the stakes of the roll with the player.' },
            { label: 'Pick a trait and Difficulty', detail: 'Pick a character trait and decide on a Difficulty.' },
            {
              label: 'Add dice and modifiers',
              detail: 'Add extra dice and modifiers, including Experiences, advantage, and disadvantage.',
            },
            {
              label: 'Roll and resolve',
              detail:
                'Tell the player to roll the Duality Dice and resolve the situation based on the result of their roll.',
            },
          ],
        },
        {
          kind: 'keyValue',
          entries: [
            {
              key: 'Critical Success',
              value: 'They get what they want and a little extra, then gain a Hope and clear a Stress.',
            },
            { key: 'Success with Hope', value: 'They get what they want, then gain a Hope.' },
            {
              key: 'Success with Fear',
              value: 'They get what they want, but it comes with a cost or consequence. The GM gains a Fear.',
            },
            {
              key: 'Failure with Hope',
              value: 'They probably don’t get what they want, and there is a consequence, but they gain a Hope.',
            },
            {
              key: 'Failure with Fear',
              value: 'They don’t get what they want, and things go very badly. The GM gains a Fear.',
            },
          ],
        },
        {
          kind: 'callout',
          tone: 'neutral',
          text: 'The GM takes a turn on a success with Fear, a failure with Hope, and a failure with Fear.',
        },
      ],
    },
  },
  {
    id: 'difficulty',
    title: 'Difficulty Ladder',
    category: 'Rolls & Resolution',
    colSpan: 1,
    defaultOrder: 20,
    keywords: ['dc', 'target number', 'trait roll', 'very easy', 'nearly impossible'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'table',
          dense: true,
          headers: ['Difficulty', 'Description'],
          rows: [
            ['5', 'Very Easy'],
            ['10', 'Easy'],
            ['15', 'Average'],
            ['20', 'Hard'],
            ['25', 'Very Hard'],
            ['30', 'Nearly Impossible'],
          ],
        },
        {
          kind: 'text',
          paragraphs: [
            'Call for a roll by naming the trait, and the Difficulty when it is set in advance — for example “Presence Roll” or “Agility Roll (12)”.',
          ],
        },
      ],
    },
  },
  {
    id: 'range',
    title: 'Range',
    category: 'Rolls & Resolution',
    colSpan: 1,
    defaultOrder: 30,
    keywords: ['melee', 'very close', 'close', 'far', 'very far', 'distance', 'movement', 'feet'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'keyValue',
          entries: [
            { key: 'Melee', value: 'Touch, up to 5 feet.' },
            { key: 'Very Close', value: '5–10 feet. You can move this far with an action.' },
            { key: 'Close', value: '10–30 feet. You can move this far with an action.' },
            { key: 'Far', value: '30–100 feet. Moving this far requires an Agility Roll.' },
            { key: 'Very Far', value: '100–300 feet. Moving this far requires a hard Agility Roll.' },
          ],
        },
      ],
    },
  },
  {
    id: 'advantage',
    title: 'Advantage & Disadvantage',
    category: 'Rolls & Resolution',
    colSpan: 1,
    defaultOrder: 40,
    defaultCollapsed: true,
    keywords: ['d6', 'advantage die', 'disadvantage die', 'stack', 'cancel', 'd20'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'table',
          headers: ['', 'GM', 'Player'],
          rows: [
            ['Advantage', 'Roll an additional d20 and take the higher result.', 'Add a d6 advantage die to the roll.'],
            [
              'Disadvantage',
              'Roll an additional d20 and take the lower result.',
              'Subtract a d6 disadvantage die from the roll.',
            ],
          ],
        },
        {
          kind: 'list',
          items: [
            'Advantage and disadvantage stack, and cancel each other out one for one — e.g. 2 advantage + 1 disadvantage = 1 advantage.',
            'If more than one advantage die is being used on the roll, they only take the highest result.',
          ],
        },
      ],
    },
  },
];
