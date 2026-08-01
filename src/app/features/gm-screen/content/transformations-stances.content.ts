import { GmPanelDef } from '../models/gm-panel.model';

export const TRANSFORMATIONS_STANCES_PANELS: readonly GmPanelDef[] = [
  {
    id: 'transformations',
    title: 'Transformations',
    category: 'Tables',
    colSpan: 2,
    defaultOrder: 190,
    defaultCollapsed: true,
    keywords: [
      'hope and fear',
      'demigod',
      'ghost',
      'reanimated',
      'shapeshifter',
      'vampire',
      'werewolf',
      'narrative identity',
      'ancestry feature',
      'community feature',
    ],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'A Transformation is a narrative identity you grant a PC — any class, no level or class gate. A PC can hold only one at a time, and it does not count against their domain card loadout limit, same as an ancestry or community card.',
            'Each Transformation card has 2 features (usually one benefit, one drawback) and 6 backstory questions to answer with the player. It does not override normal damage or death rules unless its card says otherwise.',
          ],
        },
        {
          kind: 'table',
          headers: ['Transformation', 'Summary'],
          rows: [
            [
              'Demigod',
              '+1 to action rolls, reaction rolls, and damage rolls. On a failed roll, mark a Stress or the GM gains a Fear.',
            ],
            [
              'Ghost',
              'Resistant to physical damage, but takes double magic damage. Spend 2 Stress to pass through solid objects.',
            ],
            [
              'Reanimated',
              'Can only clear HP during a rest if you have access to your remains. Can permanently mark HP to survive Risk It All.',
            ],
            [
              'Shapeshifter',
              'Can swap your ancestry during a rest via a downtime move; only one ancestry feature is active at a time.',
            ],
            [
              'Vampire',
              'Gains a Fangs bite attack. Spend a Feed token (max 6) to make your Fear Die a d20; lose one per long rest, and suffer disadvantage at zero.',
            ],
            [
              'Werewolf',
              'Mark Stress to enter Wolf Form after marking HP; gain +1d10 to attack and damage rolls. Howling Rampage triggers on your last Stress.',
            ],
          ],
        },
      ],
    },
  },
  {
    id: 'martial-stances',
    title: 'Martial Stances & Focus',
    category: 'Tables',
    colSpan: 2,
    defaultOrder: 200,
    defaultCollapsed: true,
    keywords: [
      'hope and fear',
      'martial artist',
      'brawler',
      'stance fighter',
      'focus track',
      'instinct',
    ],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'The Martial Artist subclass of Brawler gets stances through its "Stance Fighter" foundation feature. They know 2 Tier 1 stances on pick, and choose one more (at their tier or lower) each time they level up.',
            'Focus: once per rest, in a moment of calm, clear the Focus track and roll a number of d6s equal to Instinct. Gain Focus equal to the highest single result rolled (not the sum). Max 6 Focus.',
            'Spend 1 Focus to shift into a known stance. Only one stance is active at a time.',
          ],
        },
        {
          kind: 'list',
          items: [
            'You take Severe damage.',
            'You mark your last Hit Point.',
            'You shift into a different stance.',
            'The scene ends.',
          ],
        },
        {
          kind: 'table',
          dense: true,
          headers: ['Tier', 'Stance', 'Effect'],
          rows: [
            ['1', 'Favored', 'Gain a bonus to damage rolls equal to a trait of your choice.'],
            ['1', 'Invigorating', 'On a successful attack, roll a d4. On a result of 4, gain a Focus.'],
            [
              '1',
              'Quick',
              'When you make an attack, spend a Focus or mark a Stress to target another creature within range with that attack.',
            ],
            ['1', 'Reliable', 'Gain a +1 bonus to your attack rolls.'],
            [
              '2',
              'Aggressive',
              '-1 penalty to Evasion. On a successful attack, roll an additional damage die and discard the lowest.',
            ],
            [
              '2',
              'Anchored',
              '+2 bonus to your damage thresholds. While in this stance, you can’t be moved against your will.',
            ],
            [
              '2',
              'Defensive',
              'Attack rolls against you from Melee range have disadvantage unless the attacker marks a Stress to negate it.',
            ],
            ['2', 'Otherworldly', 'On a successful attack, you can deal physical or magic damage.'],
            [
              '3',
              'Grappling',
              'On a successful Melee attack, spend a Focus or mark a Stress to Restrain the target or throw it up to Close range.',
            ],
            ['3', 'Scary', 'On a successful attack, the target must mark a Stress.'],
            ['3', 'Stable', 'Spend a Focus instead of an Armor Slot to reduce damage.'],
            ['3', 'Vigilant', 'When targeted by an attack, mark a Stress to gain a d6 bonus to your Evasion against it.'],
            [
              '4',
              'Crushing',
              'When you deal Severe damage, spend a Hope to force the target to mark an additional Hit Point.',
            ],
            ['4', 'Exacting', 'When you roll a 1 on a damage die, treat it as the highest value on the die instead.'],
            ['4', 'Honed', 'Spend a Focus before an attack roll to gain a +1 bonus to Proficiency for that attack.'],
            [
              '4',
              'Isolating',
              'Gain advantage on attack rolls when no other creatures are within Very Close range of you or your target.',
            ],
          ],
        },
      ],
    },
  },
];
