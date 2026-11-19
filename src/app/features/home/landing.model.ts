export interface LandingShot {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
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

const SHOT_WIDTH = 2160;
const SHOT_HEIGHT = 1350;

export const LANDING_CTAS: LandingCta[] = [
  { label: 'Start Your Adventure', route: '/auth', variant: 'primary' },
  { label: 'Explore the Codex', route: '/reference', variant: 'secondary' },
];

export const HERO_SHOT: LandingShot = {
  src: '/landing/hero-sheet.webp',
  width: SHOT_WIDTH,
  height: SHOT_HEIGHT,
  alt: 'The character sheet for Corvane Ashmantle, a level 5 Guardian: six trait modifiers, damage thresholds, Hit Points, Armor, Hope and Stress partly marked, and an equipped Gilded Falchion and Improved Tower Shield.',
  caption: 'A level 5 Guardian, mid-campaign, exactly as the player sees it.',
};

export const LANDING_STEPS: LandingStep[] = [
  {
    id: 'build',
    eyebrow: 'Build',
    title: 'Forge a hero in minutes',
    body: 'Pick a class, subclass, ancestry and community from the full card catalog and read every feature before you commit. Traits, starting gear, experiences and domain cards each get their own step, and every choice collects on a summary as you go.',
    shot: {
      src: '/landing/step-build.webp',
      width: SHOT_WIDTH,
      height: SHOT_HEIGHT,
      alt: 'The character builder on its Domain Cards step: every earlier step is checked off, a summary lists the chosen class, subclass, ancestry, community, traits, weapon and armor, and two Midnight domain cards are selected.',
      caption: 'Ten steps, every option on a real card.',
    },
  },
  {
    id: 'play',
    eyebrow: 'Play',
    title: 'A sheet that keeps up',
    body: 'Mark Hit Points, Stress and Hope with a tap. Tap a trait to roll your Duality Dice with the modifier already added, or roll weapon damage straight from your gear. Evasion, armor and damage thresholds include every bonus from your cards and equipment, so your attention stays on the scene.',
    shot: {
      src: '/landing/step-play.webp',
      width: SHOT_WIDTH,
      height: SHOT_HEIGHT,
      alt: 'The dice roller open over the character sheet after a Strength roll: the Duality Dice came up with Hope, and the chronicle records the Strength +4 modifier.',
      caption: 'One tap on Strength, and the modifier is already in the roll.',
    },
  },
  {
    id: 'grow',
    eyebrow: 'Grow',
    title: 'Level up without the page-flipping',
    body: 'When the party hits a milestone, Oh Sheet walks you through it: the advancements you can take, what each one changes, and the new domain cards open to you. Every level is logged, so the path your hero took is always on record.',
    shot: {
      src: '/landing/step-grow.webp',
      width: SHOT_WIDTH,
      height: SHOT_HEIGHT,
      alt: 'Levelling Corvane Ashmantle from 5 to 6: two advancements chosen, Boost HP Max previewing Hit Points going from 9 to 10, alongside Boost Evasion.',
      caption: 'Every advancement shows exactly what it changes.',
    },
  },
  {
    id: 'gather',
    eyebrow: 'Gather',
    title: 'Bring the whole party together',
    body: 'Start a campaign, share an invite link, and every player’s hero joins your table. Your campaign GM screen shows the whole party’s Evasion, Hit Points, Stress and Hope at a glance, right beside the Fear tracker.',
    shot: {
      src: '/landing/step-gather.webp',
      width: SHOT_WIDTH,
      height: SHOT_HEIGHT,
      alt: 'The campaign GM screen for The Lanterns of Hollowmere: Fear at 4 of 12, and a party panel listing four heroes with their Evasion, Hit Points, Stress, Hope and damage thresholds.',
      caption: 'The whole party, one glance from the GM’s chair.',
    },
  },
  {
    id: 'command',
    eyebrow: 'Command',
    title: 'Run the fight from one screen',
    body: 'Build encounters from the full adversary roster, then run them at the table: Hit Points, Stress, tokens, attacks and features for every foe, with the fallen marked as they drop.',
    shot: {
      src: '/landing/step-command.webp',
      width: SHOT_WIDTH,
      height: SHOT_HEIGHT,
      alt: 'The encounter The Drowned Bell Tolls in progress: four of five adversaries standing, each with difficulty, Hit Points, Stress and thresholds, and a Siren expanded to show its marked Hit Points, Stress, tokens and standard attack.',
      caption: 'Four of five still standing, and the Siren is singing.',
    },
  },
];

export const LANDING_FEATURES: LandingFeature[] = [
  {
    title: 'The Codex',
    description: 'Search every class, ancestry, domain card, adversary, weapon and environment from one box.',
    iconPaths: ['M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5a2.5 2.5 0 0 0 0 5H20', 'M8 7h8M8 11h6'],
  },
  {
    title: 'GM Screen',
    description: 'Rolls, conditions, ranges and GM moves on panels you can drag into your own layout.',
    iconPaths: ['M3 5h7v14H3zM14 5h7v6h-7zM14 15h7v4h-7z'],
  },
  {
    title: 'Encounter Builder',
    description: 'Balance a fight against your party’s size with a battle point budget that adds itself up.',
    iconPaths: ['M14.5 17.5 3 6V3h3l11.5 11.5', 'M13 19l6-6M16 16l4 4M19 21l2-2'],
  },
  {
    title: 'Homebrew',
    description: 'Craft your own weapons, armor and loot, then share them with your campaign.',
    iconPaths: ['M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z'],
  },
  {
    title: 'Dice Roller',
    description: 'Duality Dice and every die from d4 to d100, a click away on your sheet and the GM screen.',
    iconPaths: ['M4 4h16v16H4z', 'M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01'],
  },
  {
    title: 'Invite Links',
    description: 'Send one link and your players join your campaign, heroes in hand.',
    iconPaths: ['M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7', 'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7'],
  },
];
