import { Component, input, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { AdversaryData } from './adversary-card.model';
import { CardFeatureItem } from '../daggerheart-card/card-feature-item/card-feature-item';
import { FormatTextPipe } from '../../pipes/format-text.pipe';
import { improvisedTierStats } from '../../utils/improvised-tier-stats.utils';
import { titleCase } from '../../utils/text.utils';
import { RESTRICTED_CARD_TITLE, restrictedCardMessage } from '../daggerheart-card/daggerheart-card.model';
import { LockIcon } from '../lock-icon/lock-icon';

/**
 * One small ornamental mark per adversary type, in the same spirit as the entity-type glyphs in
 * `search.model.ts` — a quick silhouette a GM can recognize at a glance, not just a text label.
 */
const ADVERSARY_TYPE_GLYPHS: Record<string, string> = {
  MINION: '✱',
  SOCIAL: '☙',
  SUPPORT: '❈',
  HORDE: '⁂',
  RANGED: '➶',
  SKULK: '◐',
  STANDARD: '●',
  LEADER: '♛',
  BRUISER: '▲',
  SOLO: '★',
};

/**
 * The rulebook's own grouping (the "no Bruisers, Hordes, Leaders, or Solos" Battle Point
 * adjustment) — the types a GM should read as heavier threats at a glance.
 */
export const ELITE_ADVERSARY_TYPES = new Set(['BRUISER', 'HORDE', 'LEADER', 'SOLO']);

type AdversaryThreatTier = 'elite' | 'minion' | 'standard';

let nextInstanceId = 0;

@Component({
  selector: 'app-adversary-card',
  templateUrl: './adversary-card.html',
  styleUrls: ['./adversary-card.css', './adversary-card-wide.css', './adversary-card-restricted.css'],
  imports: [CardFeatureItem, FormatTextPipe, LockIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdversaryCard {
  readonly adversary = input.required<AdversaryData>();
  readonly layout = input<'default' | 'wide'>('default');
  readonly collapsibleFeatures = input<boolean>(false);
  /**
   * Whole-card collapse, distinct from `collapsibleFeatures` (which only folds the Features
   * list). Used by the encounter builder's browse list and roster so a long list of cards reads
   * as scannable rows -- default false keeps `features/reference` exactly as it renders today.
   * Projected `card-actions` content is a sibling of the toggle, not inside it, so it stays
   * reachable (Add / Remove / retier / nickname) whether the card is expanded or not.
   */
  readonly collapsible = input<boolean>(false);
  /** Smaller name type step for narrow contexts (the roster grid), where the default 1.4rem
   * display name can overflow the header and squeeze out the projected actions next to it. */
  readonly compact = input<boolean>(false);
  /**
   * A per-instance retier target (encounter roster's "retier" control). When set and different
   * from the printed tier, the Attack Modifier/Difficulty/Thresholds swap to the book's
   * Improvised Statistics by Tier table and a "retiered from Tier N" marker appears.
   */
  readonly effectiveTier = input<number | undefined>(undefined);

  /** Exposed for the template; the copy itself lives in `daggerheart-card.model.ts` so this face
   * and the classic/beta `DaggerheartCard`/`EntityCard` faces never drift apart. */
  readonly restrictedTitle = RESTRICTED_CARD_TITLE;

  private readonly featuresExpanded = signal(false);
  private readonly descriptionExpanded = signal(false);
  private readonly cardExpanded = signal(false);

  /** True whenever the body should render: always when not `collapsible`, else user-toggled. */
  readonly isExpanded = computed(() => !this.collapsible() || this.cardExpanded());

  toggleCard(): void {
    this.cardExpanded.update(v => !v);
  }

  /** Per rendered instance, not per adversary -- the roster can hold several instances of the
   * same catalog adversary (three Giant Mosquitoes), which would collide on a shared DOM id. */
  private readonly instanceId = `adversary-card-${nextInstanceId++}`;

  get bodyId(): string {
    return `${this.instanceId}-body`;
  }

  private readonly retieredStats = computed(() => {
    const tier = this.effectiveTier();
    return tier === undefined ? undefined : improvisedTierStats(tier);
  });

  readonly isRetiered = computed(() => {
    const tier = this.effectiveTier();
    return tier !== undefined && tier !== this.adversary().tier;
  });

  get isFeaturesExpanded(): boolean {
    return this.featuresExpanded();
  }

  toggleFeatures(event: Event): void {
    event.stopPropagation();
    this.featuresExpanded.set(!this.featuresExpanded());
  }

  get isDescriptionExpanded(): boolean {
    return this.descriptionExpanded();
  }

  toggleDescription(event: Event): void {
    event.stopPropagation();
    this.descriptionExpanded.set(!this.descriptionExpanded());
  }

  get tierLabel(): string {
    return `Tier ${this.effectiveTier() ?? this.adversary().tier}`;
  }

  get retieredFromLabel(): string {
    return `Retiered from Tier ${this.adversary().tier}`;
  }

  restrictedMessage(expansionName: string | undefined): string {
    return restrictedCardMessage(expansionName);
  }

  get typeGlyph(): string {
    return ADVERSARY_TYPE_GLYPHS[this.adversary().adversaryType ?? ''] ?? '◆';
  }

  /** `BRUISER` -> `Bruiser` -- the printed term, not the raw backend enum (`shared/utils/
   * text.utils.ts`'s own doc comment covers exactly this case). The raw value stays in
   * `adversary().adversaryType` for the glyph lookup and threat-tier checks below, which key off
   * the enum on purpose; only the text a person reads goes through `titleCase`. */
  get typeLabel(): string {
    return titleCase(this.adversary().adversaryType);
  }

  /** `VERY_CLOSE` -> `Very Close`. Empty string (not "Undefined") when the adversary has no
   * ranged attack, matching `titleCase`'s own null/undefined handling. */
  get attackRangeLabel(): string {
    return titleCase(this.adversary().attackRange);
  }

  /**
   * The Battle Guide's three visual weight classes: Elite (Bruiser/Horde/Leader/Solo), Minion
   * (uniquely costed per group rather than per creature), and everything else. Drives the type
   * badge's tier styling, not just its text.
   */
  private readonly threatTier = computed<AdversaryThreatTier>(() => {
    const type = this.adversary().adversaryType;
    if (type === 'MINION') return 'minion';
    if (ELITE_ADVERSARY_TYPES.has(type ?? '')) return 'elite';
    return 'standard';
  });

  get isEliteType(): boolean {
    return this.threatTier() === 'elite';
  }

  get isMinionType(): boolean {
    return this.threatTier() === 'minion';
  }

  /** Solo is the single most dangerous adversary type — the elite tier's own high end. */
  get isSoloType(): boolean {
    return this.adversary().adversaryType === 'SOLO';
  }

  get effectiveDifficulty(): number | undefined {
    return this.retieredStats()?.difficulty ?? this.adversary().difficulty;
  }

  get effectiveMajorThreshold(): number | undefined {
    return this.retieredStats()?.majorThreshold ?? this.adversary().majorThreshold;
  }

  get effectiveSevereThreshold(): number | undefined {
    return this.retieredStats()?.severeThreshold ?? this.adversary().severeThreshold;
  }

  /**
   * `notation` is the backend's already-formatted printed damage line, and for every adversary
   * (verified against the Core Rulebook's own printed stat blocks -- e.g. Acid Burrower's
   * "1d12+2 phy" -- and 24 others, plus `adversary.mapper.spec.ts`'s own fixtures) it already ends
   * in the abbreviated damage type ("phy"/"mag"). Appending `damageType` on top of that printed
   * "physical"/"magic" duplicated it -- "1d12+2 phy physical". Unlike weapons (`weapon.mapper.ts`),
   * where `notation` is dice-only and the type is shown separately, an adversary's `notation` is
   * the single printed line and needs nothing appended to it.
   */
  get damageLabel(): string {
    return this.adversary().damage?.notation ?? '';
  }

  get attackModifierLabel(): string {
    const mod = this.retieredStats()?.attackModifier ?? this.adversary().attackModifier;
    if (mod === undefined || mod === null) return '';
    return this.formatModifier(mod);
  }

  /** `Thief +2` -- the book's own format for an Experience's Fear-spend bonus. */
  formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
}
