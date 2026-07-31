import { GmPanelDef } from '../models/gm-panel.model';

export const GM_MOVES_PANELS: readonly GmPanelDef[] = [
  {
    id: 'spotlight',
    title: 'Spotlighting Adversaries',
    colSpan: 1,
    defaultOrder: 120,
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
    colSpan: 2,
    defaultOrder: 210,
    keywords: ['soft move', 'hard move', 'consequence', 'complication', 'inspiration'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'table',
          headers: ['Move', 'Example'],
          rows: [
            [
              'Show how the world reacts',
              '"The kick shatters the door. Light spills in from the barracks as a half-dozen sleepy soldiers stumble to their feet, looking worried."',
            ],
            [
              'Ask a question and build on the answer',
              '"How is it that you notice the assassin lurking in the treetops?"',
            ],
            [
              'Make an NPC act in accordance with their motive',
              "When a scene includes characters other than the PCs, you can spotlight what these NPCs are doing in response to the PCs' actions. You might show a friendly NPC helping the party in a fight, a group of townsfolk taking cover, or an enemy moving positions. Make sure their actions always flow from their motive.",
            ],
            [
              "Lean on the PCs' goals to drive them to action",
              '"The governor\'s husband lies groggy on the altar as the cultists continue to chant. The ritual is coming to a climax earlier than expected. What do you do?"',
            ],
            [
              'Signal an imminent off-screen threat',
              '"You hear the crashing of falling trees and shattered branches as thundering steps approach. What do you do?"',
            ],
            [
              'Reveal an unwelcome truth or unexpected danger',
              '"He reaches into his cloak and produces the Orb of Vengeance as you realize that he was the necromancer the entire time."',
            ],
            [
              'Force the group to split up',
              '"The elementals are scattering—two heading for the town, three bearing down on the mill. What do you do?"',
            ],
            [
              'Make a PC mark Stress as a consequence for their actions',
              '"You can pull the baron to safety if you mark a Stress. Otherwise you can only get yourself out of the way. What do you do?"',
            ],
            ["Make a move the characters don't see", '"Everything is fine... for now."'],
            [
              'Show the collateral damage',
              '"The minotaur barrels into the street, shattering a vegetable cart, sending cabbages flying and knocking the merchant into the wall."',
            ],
            ['Clear a temporary condition or effect', '"The guard cuts through the vines holding her in place."'],
            ['Shift the environment', '"The rope bridge snaps, leaving you stranded."'],
            [
              'Spotlight an adversary',
              '"As the skeleton guard shambles forward to strike you, you see the two others on their flank turn their attention toward you as well."',
            ],
            [
              'Capture someone or something important',
              '"The thief slides past you and jumps into the cart, grabbing the idol from the seat and stuffing it into their pouch."',
            ],
            [
              "Use a PC's backstory against them",
              '"Your mentor sighs, drawing their blade. \'I wish it hadn\'t come to this, child. But you still don\'t understand what sacrifices are required to maintain the peace.\'"',
            ],
            [
              'Take away an opportunity permanently',
              '"The door slams shut, cutting you off from the vault as the temple continues to collapse."',
            ],
          ],
        },
      ],
    },
  },
  {
    id: 'gm-principles',
    title: 'GM Principles & Best Practices',
    colSpan: 1,
    defaultOrder: 220,
    keywords: ['agenda', 'advice', 'running the game', 'table'],
    body: {
      kind: 'static',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['GM Principles'],
        },
        {
          kind: 'list',
          items: [
            'Begin and end with the fiction',
            'Collaborate at all times, especially during conflict',
            'Fill the world with life, wonder, and danger',
            'Ask questions and incorporate the answers',
            'Make every roll important',
            'Play to find out what happens',
            'Hold on gently',
          ],
        },
        {
          kind: 'text',
          paragraphs: ['GM Best Practices'],
        },
        {
          kind: 'list',
          items: [
            'Cultivate a curious table',
            "Gain your players' trust",
            'Keep the story moving forward',
            'Cut to the action',
            'Help the players use the game',
            'Create a meta conversation',
            'Tell them what they would know',
            'Ground the world in motive',
            "Bring the game's mechanics to life",
            'Reframe rather than reject',
            'Work in moments and montages',
          ],
        },
      ],
    },
  },
];
