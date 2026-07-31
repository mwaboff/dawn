import { GmPanelDef } from '../models/gm-panel.model';

/**
 * Table-facing inspiration prompts rather than hard rules: ways to spend a Success with Fear, and
 * worked examples of what each trait's outcomes can look like. Agility and Strength are absent
 * because the source material marks them WIP.
 */
export const INSPIRATION_PANELS: readonly GmPanelDef[] = [
  {
    id: 'success-with-fear',
    title: 'Handling Success with Fear',
    category: 'GM Moves',
    colSpan: 1,
    defaultOrder: 190,
    defaultCollapsed: true,
    keywords: ['cost', 'consequence', 'catch', 'complication', 'fear forward', 'countdown'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'They get what they want, but it comes with a cost or consequence. The GM gains a Fear.',
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
  {
    id: 'trait-outcome-examples',
    title: 'Trait Outcome Examples',
    category: 'Rolls & Resolution',
    colSpan: 2,
    defaultOrder: 200,
    defaultCollapsed: true,
    keywords: ['finesse', 'instinct', 'presence', 'knowledge', 'critical success', 'failure with fear'],
    body: {
      kind: 'static',
      blocks: [
        { kind: 'text', paragraphs: ['Finesse — Control, Hide, Tinker'] },
        {
          kind: 'keyValue',
          entries: [
            {
              key: 'Critical Success',
              value:
                'While hidden you overhear vital information; you find a shortcut, weak point or opportunity such as a secret door, an unguarded escape route or a hidden stash.',
            },
            {
              key: 'Success with Fear',
              value:
                'You stay hidden but leave a trace — a footprint, a piece of cloth, an item, a scent; a guard hears a suspicious noise and starts investigating; escape is hard or you are trapped, a gate closes behind you or guards return from a shift change; you struggle to control your mount or vehicle and it leaves you stressed; the device, vehicle or animal won’t handle another use.',
            },
            {
              key: 'Failure with Fear',
              value:
                'You are spotted, cornered, stuck or lose something; a trap, weapon or contraption you tinkered with explodes or malfunctions; in a social setting your failure is seen as severe incompetence or even sabotage; your mount is unwilling and throws you off; you are not alone — someone or something is already hiding here.',
            },
          ],
        },
        { kind: 'text', paragraphs: ['Instinct — Perceive, Sense, Navigate'] },
        {
          kind: 'keyValue',
          entries: [
            {
              key: 'Critical Success',
              value:
                'You see through something only magic normally unveils — an illusion, a magical disguise, a ward; you notice a hidden pattern or merge clues in an unexpected way; you catch a lie and deduce from their body language that an ambush is about to happen; you find an alternative route that makes the journey faster, safer, or lets you ambush the enemy.',
            },
            {
              key: 'Success with Fear',
              value:
                'You find something or someone, but it is disturbing or traumatizing; you spot the enemy just as they spot you; you find the right path, but it is dangerous, exhausting or leaves you exposed to the elements and other threats — wild animals, a frozen lake to cross, a blizzard, an avalanche, a cursed stretch of road.',
            },
            {
              key: 'Failure with Fear',
              value:
                'You fail to see a threat and are ambushed; you miss an environmental hazard and are caught in an avalanche, break through ice, or disturb a wasp nest; you trust the wrong person and are betrayed or lose a resource — a merchant scams you, a shady captain takes your fare and leaves, someone you trusted leads you into an ambush; you try to sense the motive of something dark or divine and are left deeply unsettled.',
            },
          ],
        },
        { kind: 'text', paragraphs: ['Presence — Charm, Perform, Deceive, Intimidate'] },
        {
          kind: 'keyValue',
          entries: [
            {
              key: 'Critical Success',
              value:
                'You get something beyond your request — additional help or information, they share or reveal a secret, the enemy flees.',
            },
            {
              key: 'Success with Fear',
              value:
                'A condition, suspicion or additional cost — they want a favor or gold; you succeed but start a commotion or it gets socially awkward; they become suspicious or start investigating, let you through but call for reinforcements, fear you but plot revenge.',
            },
            {
              key: 'Failure with Fear',
              value:
                'They refuse and report you, become hostile, alert further enemies, spread rumors, damage your reputation, or plot your downfall.',
            },
          ],
        },
        { kind: 'text', paragraphs: ['Knowledge — Recall, Analyze, Comprehend'] },
        {
          kind: 'keyValue',
          entries: [
            {
              key: 'Critical Success',
              value:
                'An unexpected insight or hidden truth — you discover who sent the secret message, you analyze a ward and know how to alter it to your advantage, you translate an ancient text and realize it also references a landmark, a statue or a secret passage nearby.',
            },
            {
              key: 'Success with Fear',
              value:
                'Deciphering triggers a ward or curse, or the act and the knowledge itself leave you stressed; you learn how to disrupt a ritual, but something senses your presence and attacks, or you need an expensive or unethical component — children’s tears, a unicorn’s horn, an animal sacrifice.',
            },
            {
              key: 'Failure with Fear',
              value:
                'You misinterpret the code, text or puzzle and reach a false conclusion; your tampering triggers an alarm, a magical trap, a self-destruct, something that siphons your Hit Points or gives you a condition; you are confident you solved it, but missed the real danger, which will unfold later.',
            },
          ],
        },
      ],
    },
  },
];
