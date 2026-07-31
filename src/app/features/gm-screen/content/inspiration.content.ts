import { GmPanelDef } from '../models/gm-panel.model';

/**
 * Table-facing inspiration prompts rather than hard rules: ways to hand out a consequence.
 *
 * Scoped to success with Fear in the source material, but every entry reads the same on a failure
 * with Hope — the other outcome where the PCs get a consequence — so the panel is titled for the
 * job rather than the die result. It sits next to `action-roll-results` because that is the table
 * you are looking at when you need it.
 *
 * The per-trait outcome examples that used to live here were four repetitions of the same three
 * outcomes. They now appear once, in `roll-result-examples`.
 */
export const INSPIRATION_PANELS: readonly GmPanelDef[] = [
  {
    id: 'success-with-fear',
    title: 'Consequence Menu',
    category: 'Rolls & Resolution',
    colSpan: 1,
    defaultOrder: 15,
    defaultCollapsed: true,
    keywords: [
      'cost',
      'consequence',
      'catch',
      'complication',
      'fear forward',
      'countdown',
      'success with fear',
      'failure with hope',
    ],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Ways to charge for a success with Fear or a failure with Hope — the results where the PCs still owe you something.',
          ],
        },
        {
          kind: 'keyValue',
          entries: [
            {
              key: 'Make players spend a resource',
              value:
                'Stress, Hope, an armor slot, a handful of gold, a favor or information — and they get their success in return.',
            },
            {
              key: 'Spotlight the adversary',
              value:
                'The guard hears a noise and investigates; the werewolf chasing you leaps across the chasm; the intimidated bouncer who let you through is calling for backup; something stirs in the magical darkness you just investigated.',
            },
            {
              key: '"Fear forward"',
              value:
                'Create a minor complication that spotlights the strengths of your party, a roll or an ability. The sorcerer is water-infused? Start a fire. The ranger has Nature’s Tongue? Make a guard dog about to bark. The guardian has high Strength? Make the door stick and require a Strength roll.',
            },
            {
              key: '…another path closes',
              value:
                'They had two paths but you had one better prepared? One path closes. You didn’t plan for an NPC conversation? They’re no longer available. You planned for your inventor NPC next? Make the party need to visit them.',
            },
            {
              key: 'Nothing bad happens…right?',
              value:
                'Emphasize it — the PC succeeds and nothing bad happens, isn’t that great? Use sparingly to build tension while you simply gather Fear, or spend Fear on something the PCs aren’t aware of: the enemy gathers their forces, the ritual has started, reinforcements are on their way.',
            },
          ],
        },
        {
          kind: 'callout',
          tone: 'fear',
          text: 'Do not run this the other way around and make their success cost them.',
        },
      ],
    },
  },
];
