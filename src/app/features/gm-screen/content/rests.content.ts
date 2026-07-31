import { GmPanelDef } from '../models/gm-panel.model';

export const REST_PANELS: readonly GmPanelDef[] = [
  {
    id: 'rests',
    title: 'Short Rest & Long Rest',
    colSpan: 2,
    defaultOrder: 140,
    keywords: ['downtime', 'recover', 'heal', 'healing', 'loadout', 'vault', 'domain cards', 'project', 'countdown'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Short Rest (1 hour): each player can swap any domain cards in their loadout for cards in their vault, then choose two of the following moves (or choose the same move twice).',
          ],
        },
        {
          kind: 'callout',
          tone: 'fear',
          text: 'On a Short Rest, the GM gains 1d4 Fear.',
        },
        {
          kind: 'table',
          headers: ['Move', 'Description'],
          rows: [
            [
              'Tend to Wounds',
              'Describe how you hastily patch yourself up, then clear a number of Hit Points equal to 1d4 + your tier. You can do this to an ally instead.',
            ],
            [
              'Clear Stress',
              'Describe how you blow off steam or pull yourself together, then clear a number of Stress equal to 1d4 + your tier.',
            ],
            [
              'Repair Armor',
              "Describe how you quickly repair your armor, then clear a number of Armor Slots equal to 1d4 + your tier. You can do this to an ally's armor instead.",
            ],
            [
              'Prepare',
              'Describe how you prepare yourself for the path ahead, then gain a Hope. If you choose to Prepare with one or more members of your party, you each gain 2 Hope.',
            ],
          ],
        },
        {
          kind: 'text',
          paragraphs: [
            'Long Rest (6 hours or more): each player can swap any domain cards in their loadout for cards in their vault, then choose two of the following moves (or choose the same move twice).',
          ],
        },
        {
          kind: 'callout',
          tone: 'fear',
          text: 'On a Long Rest, the GM gains an amount of Fear equal to 1d4 + the number of PCs and can advance a long-term countdown.',
        },
        {
          kind: 'table',
          headers: ['Move', 'Description'],
          rows: [
            [
              'Tend to All Wounds',
              'Describe how you patch yourself up, then clear all Hit Points. You can do this to an ally instead.',
            ],
            [
              'Clear All Stress',
              'Describe how you blow off steam or pull yourself together, then clear all Stress.',
            ],
            [
              'Repair All Armor',
              "Describe how you spend time repairing your armor, then clear all Armor Slots. You can do this to an ally's armor instead.",
            ],
            [
              'Prepare',
              "Describe how you prepare for the next day's adventure, then gain a Hope. If you choose to Prepare with one or more members of your party, you each gain 2 Hope.",
            ],
            [
              'Work on a Project',
              'Establish or continue work on a project. The GM might ask for an action roll to determine how much to tick down on the Progress Countdown.',
            ],
          ],
        },
        {
          kind: 'text',
          paragraphs: [
            'Swapping domain cards outside a rest costs Stress equal to the card’s Recall Cost; swapping during a Short or Long Rest is free.',
          ],
        },
      ],
    },
  },
];
