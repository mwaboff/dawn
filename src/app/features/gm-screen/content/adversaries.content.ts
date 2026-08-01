import { GmPanelDef } from '../models/gm-panel.model';

export const ADVERSARY_PANELS: readonly GmPanelDef[] = [
  {
    id: 'battle-guide',
    title: 'Battle Guide (Battle Points)',
    category: 'Combat',
    colSpan: 3,
    defaultOrder: 170,
    defaultCollapsed: true,
    keywords: ['bp', 'encounter building', 'balance', 'minion', 'bruiser', 'solo', 'skulk', 'horde', 'leader'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'callout',
          tone: 'neutral',
          text: 'Starting Battle Points = (3 × the number of PCs in combat) + 2',
        },
        {
          kind: 'text',
          paragraphs: ['Adjusting Battle Points'],
        },
        {
          kind: 'table',
          dense: true,
          headers: ['Adjustment', 'Factor'],
          rows: [
            ['−1', 'For a less difficult or shorter fight'],
            ['−2', 'If you use 2 or more Solo adversaries'],
            ['−2', "If you add +1d4 to all adversaries' damage"],
            ['+1', 'If you use an adversary from a lower tier'],
            ['+1', "If you don't use Bruisers, Hordes, Leaders, or Solos"],
            ['+2', 'For a more dangerous or longer fight'],
          ],
        },
        {
          kind: 'text',
          paragraphs: ['Spending Battle Points'],
        },
        {
          kind: 'table',
          dense: true,
          headers: ['Cost', 'Adversary Type'],
          rows: [
            ['1', 'Group of Minions equal to the size of the party'],
            ['1', 'Social or Support'],
            ['2', 'Horde, Ranged, Skulk, or Standard'],
            ['3', 'Leader'],
            ['4', 'Bruiser'],
            ['5', 'Solo'],
          ],
        },
      ],
    },
  },
  {
    id: 'improvised-adversaries',
    title: 'Improvised Adversaries',
    category: 'Combat',
    colSpan: 2,
    defaultOrder: 180,
    defaultCollapsed: true,
    keywords: ['statblock', 'stat block', 'on the fly', 'homebrew', 'evasion', 'attack modifier', 'thresholds'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'table',
          headers: ['Adversary Statistic', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'],
          rows: [
            ['Attack Modifier', '+1', '+2', '+3', '+4'],
            ['Damage Dice', '1d6+2 to 1d12+4', '2d6+3 to 2d12+4', '3d8+3 to 3d12+5', '4d8+10 to 4d12+15'],
            ['Difficulty', '11', '14', '17', '20'],
            [
              'Damage Thresholds',
              'Major 7/Severe 12',
              'Major 10/Severe 20',
              'Major 20/Severe 32',
              'Major 25/Severe 45',
            ],
          ],
        },
      ],
    },
  },
];
