import { GmPanelDef } from '../models/gm-panel.model';

export const GM_MOVES_PANELS: readonly GmPanelDef[] = [
  {
    id: 'spotlight',
    title: 'Spotlighting Adversaries',
    category: 'Combat',
    colSpan: 1,
    defaultOrder: 120,
    defaultCollapsed: true,
    keywords: ['turn', 'initiative', 'action tracker', 'spend fear', 'monster turn'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['When you spotlight an adversary, you might have them:'],
        },
        {
          kind: 'list',
          items: [
            'Move within Close range and make a standard attack',
            'Move within Close range and use an adversary action',
            'Clear a temporary condition or effect',
            'Sprint somewhere else on the battlefield',
          ],
        },
        {
          kind: 'callout',
          tone: 'fear',
          text: 'Spend a Fear to spotlight an additional adversary during a battle.',
        },
      ],
    },
  },
  {
    id: 'gm-moves-triggers',
    title: 'When to Make a GM Move',
    category: 'GM Moves',
    colSpan: 1,
    defaultOrder: 130,
    keywords: ['trigger', 'gm turn', 'golden opportunity', 'when do I go'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['Make a move when:'],
        },
        {
          kind: 'list',
          items: [
            'A player rolls with Fear on an action roll',
            'A player fails an action roll',
            'A PC does something that would have consequences',
            'The PCs give you a golden opportunity',
            'The players look to you for what happens next',
          ],
        },
        {
          kind: 'callout',
          tone: 'fear',
          text: 'Spend a Fear to interrupt the players to make a move, or to make an additional GM move.',
        },
      ],
    },
  },
  {
    id: 'example-gm-moves',
    title: 'Example GM Moves',
    category: 'GM Moves',
    colSpan: 1,
    defaultOrder: 210,
    defaultCollapsed: true,
    keywords: ['soft move', 'hard move', 'consequence', 'complication', 'inspiration'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'list',
          items: [
            'Show how the world reacts',
            'Ask a question and build on the answer',
            'Make an NPC act in accordance with their motive',
            "Lean on the PCs' goals to drive them to action",
            'Signal an imminent off-screen threat',
            'Reveal an unwelcome truth or unexpected danger',
            'Force the group to split up',
            'Make a PC mark Stress as a consequence for their actions',
            "Make a move the characters don't see",
            'Show the collateral damage',
            'Clear a temporary condition or effect',
            'Shift the environment',
            'Spotlight an adversary',
            'Capture someone or something important',
            "Use a PC's backstory against them",
            'Take away an opportunity permanently',
          ],
        },
      ],
    },
  },
];
