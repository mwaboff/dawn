import { Component, input, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { AdversaryData } from './adversary-card.model';
import { CardFeatureItem } from '../daggerheart-card/card-feature-item/card-feature-item';
import { FormatTextPipe } from '../../pipes/format-text.pipe';
import { improvisedTierStats } from '../../utils/improvised-tier-stats.utils';

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

@Component({
  selector: 'app-adversary-card',
  templateUrl: './adversary-card.html',
  styleUrls: ['./adversary-card.css', './adversary-card-wide.css'],
  imports: [CardFeatureItem, FormatTextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdversaryCard {
  readonly adversary = input.required<AdversaryData>();
  readonly layout = input<'default' | 'wide'>('default');
  readonly collapsibleFeatures = input<boolean>(false);
  /**
   * A per-instance retier target (encounter roster's "retier" control). When set and different
   * from the printed tier, the Attack Modifier/Difficulty/Thresholds swap to the book's
   * Improvised Statistics by Tier table and a "retiered from Tier N" marker appears.
   */
  readonly effectiveTier = input<number | undefined>(undefined);

  private readonly featuresExpanded = signal(false);
  private readonly descriptionExpanded = signal(false);

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

  get typeGlyph(): string {
    return ADVERSARY_TYPE_GLYPHS[this.adversary().adversaryType] ?? '◆';
  }

  /**
   * The Battle Guide's three visual weight classes: Elite (Bruiser/Horde/Leader/Solo), Minion
   * (uniquely costed per group rather than per creature), and everything else. Drives the type
   * badge's tier styling, not just its text.
   */
  private readonly threatTier = computed<AdversaryThreatTier>(() => {
    const type = this.adversary().adversaryType;
    if (type === 'MINION') return 'minion';
    if (ELITE_ADVERSARY_TYPES.has(type)) return 'elite';
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

  get damageLabel(): string {
    const dmg = this.adversary().damage;
    if (!dmg) return '';
    return `${dmg.notation} ${dmg.damageType}`;
  }

  get attackModifierLabel(): string {
    const mod = this.retieredStats()?.attackModifier ?? this.adversary().attackModifier;
    if (mod === undefined || mod === null) return '';
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
}
