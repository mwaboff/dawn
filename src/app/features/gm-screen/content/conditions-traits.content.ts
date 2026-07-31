import { GmPanelDef } from '../models/gm-panel.model';

export const CONDITIONS_TRAITS_PANELS: readonly GmPanelDef[] = [
  {
    id: 'conditions',
    title: 'Conditions',
    colSpan: 1,
    defaultOrder: 60,
    keywords: ['hidden', 'restrained', 'vulnerable', 'temporary', 'clear a condition', 'stealth'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'keyValue',
          entries: [
            {
              key: 'Hidden',
              value:
                'While you’re out of sight from all foes and they don’t know where you are, you gain the Hidden condition. While Hidden, any rolls against you have disadvantage. After a foe moves to where they would see you, you move into their line of sight, or you make an attack, you are no longer Hidden.',
            },
            {
              key: 'Restrained',
              value:
                'When you gain the Restrained condition, you can’t move until this condition is cleared, but you can still take actions from your current position.',
            },
            {
              key: 'Vulnerable',
              value:
                'When you gain the Vulnerable condition, you’re in a difficult position within the fiction. When a creature becomes Vulnerable, the players and GM should work together to describe narratively how that happened. While you are Vulnerable, all rolls targeting you have advantage.',
            },
            {
              key: 'Temporary Conditions — GM',
              value:
                'If an adversary is affected by a temporary condition, use a GM move to spotlight the adversary and show how they clear the condition; this doesn’t require a roll but does use that adversary’s spotlight. When it fits the story, you can end the condition in other ways instead.',
            },
            {
              key: 'Temporary Conditions — Player',
              value:
                'You can make an action roll, with a Difficulty determined by the GM, to try clearing a temporary condition, though the GM might have you clear it in another way. As always, this action roll should be described and negotiated narratively.',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'traits',
    title: 'Character Traits',
    colSpan: 1,
    defaultOrder: 70,
    keywords: ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge', 'trait roll'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'table',
          dense: true,
          headers: ['Trait', 'Actions'],
          rows: [
            ['Agility', 'Sprint, Leap, Maneuver'],
            ['Instinct', 'Perceive, Sense, Navigate'],
            ['Strength', 'Lift, Smash, Grapple'],
            ['Presence', 'Charm, Perform, Deceive'],
            ['Finesse', 'Control, Hide, Tinker'],
            ['Knowledge', 'Recall, Analyze, Comprehend'],
          ],
        },
      ],
    },
  },
  {
    id: 'hope-fear',
    title: 'Spending Hope & Fear',
    colSpan: 1,
    defaultOrder: 80,
    keywords: ['experience', 'tag team', 'hope feature', 'fear feature', 'interrupt', 'spotlight'],
    body: {
      kind: 'static',
      blocks: [
        { kind: 'text', paragraphs: ['On a roll with Hope, the player gains a Hope. They can spend Hope to:'] },
        {
          kind: 'list',
          items: ['Help an Ally', 'Utilize an Experience', 'Initiate a Tag Team Roll', 'Activate a Hope Feature'],
        },
        { kind: 'text', paragraphs: ['On a roll with Fear, the GM gains a Fear. You can spend a Fear to:'] },
        {
          kind: 'list',
          items: [
            'Interrupt the players to make a move',
            'Make an additional GM move',
            'Spotlight an additional adversary during a battle',
            'Use an adversary’s Fear Feature',
            'Use an environment’s Fear Feature',
            'Add an adversary’s Experience to a roll',
          ],
        },
        { kind: 'callout', tone: 'fear', text: 'The GM starts with 2 Fear.' },
      ],
    },
  },
  {
    id: 'stress',
    title: 'Stress',
    colSpan: 1,
    defaultOrder: 90,
    keywords: ['mark stress', 'clear stress', 'recall cost', 'vulnerable', 'last stress'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'list',
          items: [
            'PCs gain Stress from adversaries, complications, or GM moves.',
            'Swapping a domain card outside of a rest costs Stress equal to the card’s Recall Cost.',
            'If you mark your last Stress, you become Vulnerable until you clear at least one Stress.',
            'If you can’t mark a Stress slot, you must instead mark one Hit Point.',
          ],
        },
      ],
    },
  },
];
