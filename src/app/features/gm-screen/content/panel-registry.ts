import { GmPanelDef } from '../models/gm-panel.model';
import { ACTION_ROLL_PANELS } from './action-rolls.content';
import { ADVERSARY_PANELS } from './adversaries.content';
import { COMBAT_PANELS } from './combat.content';
import { CONDITIONS_TRAITS_PANELS } from './conditions-traits.content';
import { GM_MOVES_PANELS } from './gm-moves.content';
import { HAZARDS_DEATH_PANELS } from './hazards-death.content';
import { INSPIRATION_PANELS } from './inspiration.content';
import { REST_PANELS } from './rests.content';
import { TABLES_PANELS } from './tables.content';
import { TRANSFORMATIONS_STANCES_PANELS } from './transformations-stances.content';

/**
 * Every static reference panel, in default display order. Content files are grouped by topic for
 * authoring; `defaultOrder` — not file order — decides where a panel lands on the screen.
 */
export const STATIC_GM_PANELS: readonly GmPanelDef[] = [
  ...ACTION_ROLL_PANELS,
  ...COMBAT_PANELS,
  ...CONDITIONS_TRAITS_PANELS,
  ...REST_PANELS,
  ...GM_MOVES_PANELS,
  ...ADVERSARY_PANELS,
  ...HAZARDS_DEATH_PANELS,
  ...INSPIRATION_PANELS,
  ...TRANSFORMATIONS_STANCES_PANELS,
  ...TABLES_PANELS,
].sort((a, b) => a.defaultOrder - b.defaultOrder);
