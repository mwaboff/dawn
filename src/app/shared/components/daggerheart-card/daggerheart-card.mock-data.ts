import { CardData } from './daggerheart-card.model';

export const MOCK_CLASS_CARDS: CardData[] = [
  {
    id: 1,
    name: 'Bard',
    description:
      'Masters of captivation who specialize in performance — singing, playing instruments, weaving tales, or telling jokes. They thrive in social situations and bond at schools or guilds.',
    cardType: 'class',
    subtitle: 'Codex · Grace',
    tags: ['Evasion 10', 'HP 5'],
    features: [
      {
        name: 'Make a Scene',
        description:
          'Spend 3 Hope to temporarily Distract a target within Close range, giving them a -2 penalty to their Difficulty.',
        subtitle: 'Hope Feature',
        tags: ['3 Hope'],
      },
      {
        name: 'Rally',
        description:
          'Once per session, describe how you rally the party and give yourself and each of your allies a Rally Die (d6 at level 1, d8 at level 5).',
        subtitle: 'Class Feature',
        tags: ['1/Session'],
      },
    ],
  },
  {
    id: 2,
    name: 'Druid',
    description:
      'Those called to learn from and protect the magic of the wilderness. Through years of study and dedication, druids can learn to transform into beasts and shape nature itself.',
    cardType: 'class',
    subtitle: 'Sage · Arcana',
    tags: ['Evasion 10', 'HP 6'],
    features: [
      {
        name: 'Beastform',
        description:
          'Mark a Stress to magically transform into a creature of your tier or lower. You gain the Beastform\'s features and Evasion bonus.',
        subtitle: 'Class Feature',
        tags: ['1 Stress'],
      },
    ],
  },
];

export const MOCK_SUBCLASS_CARDS: CardData[] = [
  {
    id: 10,
    name: 'Wordsmith',
    description:
      'A bard who wields the power of language itself, crafting spells from prose and binding foes with silver-tongued enchantments.',
    cardType: 'subclass',
    subtitle: 'Bard Subclass',
    tags: ['Grace'],
  },
  {
    id: 11,
    name: 'Wildheart',
    description:
      'A druid who has formed a deep bond with a specific beast companion, sharing senses and fighting as one.',
    cardType: 'subclass',
    subtitle: 'Druid Subclass',
    tags: ['Sage'],
  },
];

export const MOCK_HERITAGE_CARDS: CardData[] = [
  {
    id: 20,
    name: 'Highborne',
    description:
      'Raised among the elite of society, you carry yourself with an air of authority. Your upbringing grants you knowledge of politics, etiquette, and the corridors of power.',
    cardType: 'heritage',
    subtitle: 'Noble Lineage',
  },
  {
    id: 21,
    name: 'Wanderer',
    description:
      'You grew up on the road, traveling from place to place with no permanent home. This life taught you to adapt quickly and find comfort in the unfamiliar.',
    cardType: 'heritage',
    subtitle: 'Nomadic Roots',
  },
];

export const MOCK_COMMUNITY_CARDS: CardData[] = [
  {
    id: 40,
    name: 'The Broken Compass',
    description:
      'A guild of wanderers and outcasts who navigate by instinct rather than stars. They welcome any who have lost their way.',
    cardType: 'community',
    subtitle: 'Adventurer Guild',
  },
  {
    id: 41,
    name: 'Hearthstone Circle',
    description:
      'A close-knit commune of artisans and healers who believe that the strongest magic is forged through fellowship and shared meals.',
    cardType: 'community',
    subtitle: 'Commune',
  },
];

export const MOCK_ANCESTRY_CARDS: CardData[] = [
  {
    id: 50,
    name: 'Elf',
    description:
      'Long-lived and deeply connected to the natural world, elves carry the weight of centuries in their memories and the grace of the wind in their step.',
    cardType: 'ancestry',
    subtitle: 'Fey-Touched',
    tags: ['Agility +1'],
  },
  {
    id: 51,
    name: 'Dwarf',
    description:
      'Sturdy and resolute, dwarves are master crafters who shape stone and metal with an artistry passed down through countless generations.',
    cardType: 'ancestry',
    subtitle: 'Mountain-Born',
    tags: ['Strength +1'],
  },
];

export const MOCK_DOMAIN_CARDS: CardData[] = [
  {
    id: 60,
    name: 'Grace',
    description:
      'The domain of charisma. Through rapturous storytelling, charming spells, or a shroud of lies, those who channel this power define the realities of their adversaries.',
    cardType: 'domain',
    subtitle: 'Charisma Domain',
  },
  {
    id: 61,
    name: 'Codex',
    description:
      'The domain of intensive magical study. Those who seek magical knowledge turn to the equations of power recorded in books, scrolls, and ancient walls.',
    cardType: 'domain',
    subtitle: 'Knowledge Domain',
  },
  {
    id: 62,
    name: 'Sage',
    description:
      'The domain of the natural world. Those who walk this path tap into the unfettered power of the earth and its creatures to unleash raw magic.',
    cardType: 'domain',
    subtitle: 'Nature Domain',
  },
];

export const ALL_MOCK_CARDS: CardData[] = [
  ...MOCK_CLASS_CARDS,
  ...MOCK_SUBCLASS_CARDS,
  ...MOCK_HERITAGE_CARDS,
  ...MOCK_COMMUNITY_CARDS,
  ...MOCK_ANCESTRY_CARDS,
  ...MOCK_DOMAIN_CARDS,
];
