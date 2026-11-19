export interface LandingImage {
  src: string;
  width: number;
  height: number;
}

export interface LandingShot extends LandingImage {
  alt: string;
  caption: string;
  /** A capture of the same screen at phone width, served to small viewports instead of the desktop shot. */
  mobile: LandingImage;
}

export interface LandingStep {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  shot: LandingShot;
}

export interface LandingFeature {
  title: string;
  description: string;
  /** SVG path data for a 24x24 stroked icon. */
  iconPaths: string[];
}

export interface LandingCta {
  label: string;
  route: string;
  variant: 'primary' | 'secondary';
}

/** Widths the desktop shots are exported at; `{name}-{width}.webp` beside the full-size `{name}.webp`. */
export const LANDING_SHOT_WIDTHS = [1080, 1620, 2160] as const;

function shot(name: string, alt: string, caption: string): LandingShot {
  return {
    src: `/landing/${name}.webp`,
    width: 2160,
    height: 1350,
    alt,
    caption,
    mobile: { src: `/landing/${name}-mobile.webp`, width: 800, height: 1000 },
  };
}

export const LANDING_CTAS: LandingCta[] = [
  { label: 'Start Your Adventure', route: '/auth', variant: 'primary' },
  { label: 'Explore the Codex', route: '/reference', variant: 'secondary' },
];

export const HERO_SHOT: LandingShot = shot(
  'hero-sheet',
  'The character sheet for Corvane Ashmantle, a level 5 Guardian: six trait modifiers, damage thresholds, Hit Points, Armor, Hope and Stress partly marked, and an equipped Gilded Falchion and Tower Shield.',
  'A level 5 Guardian, deep in a campaign.',
);

export const LANDING_STEPS: LandingStep[] = [
  {
    id: 'build',
    eyebrow: 'Build',
    title: 'Forge a hero in minutes',
    body: 'Pick your class, subclass, ancestry and community from real cards, read every feature before you commit, and watch your hero come together on a running summary.',
    shot: shot(
      'step-build',
      'The character builder on its Domain Cards step: every earlier step is checked off, a summary lists the chosen class, subclass, ancestry, community, traits, weapon and armor, and two Midnight domain cards are selected.',
      'Every option on a real card, every choice kept on the summary.',
    ),
  },
  {
    id: 'play',
    eyebrow: 'Play',
    title: 'A sheet that keeps up',
    body: 'Mark Hit Points, Stress and Hope with a tap. Tap a trait to roll your Duality Dice with the modifier already added, or roll weapon damage straight from your gear. Evasion, Armor Score and damage thresholds fold in the bonuses from your cards and gear, so your attention stays on the scene.',
    shot: shot(
      'step-play',
      'The dice roller open beside the character sheet after a Strength roll, showing the Duality Dice total and a chronicle entry that records the Strength +4 modifier.',
      'One tap on Strength, and the modifier is already in the roll.',
    ),
  },
  {
    id: 'grow',
    eyebrow: 'Grow',
    title: 'Level up without the page-flipping',
    body: 'When the party hits a milestone, Oh Sheet walks you through it: the advancements you can take, what each one changes, and the new domain cards open to you. Change your mind? Level Down undoes the last one.',
    shot: shot(
      'step-grow',
      'Levelling Corvane Ashmantle from 5 to 6: Boost HP Max previews Hit Points going from 9 to 10, and Boost Stress Max previews Stress going from 6 to 7.',
      'Every advancement shows exactly what it changes.',
    ),
  },
  {
    id: 'gather',
    eyebrow: 'Gather',
    title: 'Bring your party to the table',
    body: 'Start a campaign, send each player an invite, and their heroes join your table. Your campaign GM screen shows every hero’s Evasion, Hit Points, Stress and Hope at a glance, alongside your Fear tracker.',
    shot: shot(
      'step-gather',
      'The campaign GM screen for The Lanterns of Hollowmere: Fear at 4 of 12, and a party panel listing four heroes with their Evasion, Hit Points, Stress, Hope and damage thresholds.',
      'The party at a glance, from the GM’s chair.',
    ),
  },
  {
    id: 'command',
    eyebrow: 'Command',
    title: 'Command the battlefield',
    body: 'Build encounters from the adversary roster, then run them at the table: Hit Points, Stress, tokens, attacks and features for every foe, with the fallen marked as they drop.',
    shot: shot(
      'step-command',
      'The encounter The Drowned Bell Tolls in progress: four of five adversaries standing, each with difficulty, Hit Points, Stress and thresholds, and a Siren expanded to show its marked Hit Points, Stress, tokens and standard attack.',
      'Four of five still standing, and the Siren is singing.',
    ),
  },
];

export const LANDING_FEATURES: LandingFeature[] = [
  {
    title: 'The Codex',
    description: 'Search every class, ancestry, domain card, adversary, weapon and environment in seconds.',
    iconPaths: ['M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5a2.5 2.5 0 0 0 0 5H20', 'M8 7h8M8 11h6'],
  },
  {
    title: 'GM Screen',
    description: 'Rolls, conditions, ranges and GM moves on panels you can drag into your own layout.',
    iconPaths: ['M3 5h7v14H3zM14 5h7v6h-7zM14 15h7v4h-7z'],
  },
  {
    title: 'Encounter Builder',
    description: 'Size every fight to your party with a Battle Point budget that tallies as you add foes.',
    iconPaths: ['M14.5 17.5 3 6V3h3l11.5 11.5', 'M13 19l6-6M16 16l4 4M19 21l2-2'],
  },
  {
    title: 'Homebrew',
    description: 'Craft your own weapons, armor and loot, then share them with your campaign.',
    iconPaths: ['M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z'],
  },
  {
    title: 'Dice Roller',
    description: 'Duality Dice and every die from d4 to d100, a tap away on your sheet and the GM screen.',
    iconPaths: ['M4 4h16v16H4z', 'M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01'],
  },
  {
    title: 'Countdowns',
    description: 'Track looming threats and long-term clocks right on your GM screen.',
    iconPaths: ['M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z', 'M12 7v5l3 2'],
  },
];
