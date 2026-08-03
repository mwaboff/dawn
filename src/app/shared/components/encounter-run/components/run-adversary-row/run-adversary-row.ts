import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { EncounterRunAdversaryResponse } from '../../../../models/encounter-run-api.model';
import { mapAdversaryToAdversaryData } from '../../../../mappers/adversary.mapper';
import { improvisedTierStats } from '../../../../utils/improvised-tier-stats.utils';
import { titleCase } from '../../../../utils/text.utils';
import { ELITE_ADVERSARY_TYPES } from '../../../adversary-card/adversary-card';
import { RunStatRow } from '../run-stat-row/run-stat-row';
import { RunAdversaryDetail } from './components/run-adversary-detail/run-adversary-detail';

/**
 * One instance's scannable row + expandable stat block: the unit a GM reads and clicks on during
 * a fight. Rebuilt on the campaign GM screen's party-list pattern (`sheet-viewer-panel.html`, via
 * the shared `RunStatRow` shell) rather than wrapping `AdversaryCard` -- a colourful, card-shaped
 * stat block reads well for one adversary at a time, but not for scanning a whole roster the way
 * this pattern's brown/yellow, numbers-first rows do. `AdversaryCard` is untouched and still used
 * by the encounter builder's roster/browse list -- this is a parallel, purpose-built presentation,
 * not a replacement.
 *
 * Adversaries don't use Evasion (Core ch. 4: "Adversaries don't use Evasion like PCs -- instead,
 * all rolls against them use their Difficulty") -- the row's read-only-numbers slot uses
 * Difficulty, matching every printed stat block, where the party row it's modelled on uses PC
 * Evasion because that row is showing PCs.
 *
 * Every interactive control (HP/Stress marking, tokens +/-, Mark Defeated/Revive) now lives in the
 * expanded `RunAdversaryDetail`, not the row -- several rounds of trimming moved them there to
 * keep the row scannable. That leaves the row itself purely read-only content plus one disclosure
 * control, so unlike the first draft of this component, it genuinely can be one `<button>` the
 * way `.party__row` is -- no nested-interactive-control workaround needed any more.
 *
 * `role: 'listitem'` on the host, not on anything inside `RunAdversaryRow`'s own template: this
 * component's selector (`<app-run-adversary-row>`) is the actual DOM child of the run view's
 * `role="list"` container (`EncounterRunView`'s `.run-view__adversaries`), so this is the element
 * that has to carry the role for the list/listitem relationship to hold. `RunStatRow`, one level
 * further in, stays a plain `<div>`.
 */
@Component({
  selector: 'app-run-adversary-row',
  templateUrl: './run-adversary-row.html',
  styleUrls: ['../run-stat-row/run-row-content.css', './run-adversary-row.css'],
  imports: [RunStatRow, RunAdversaryDetail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'listitem' },
})
export class RunAdversaryRow {
  readonly adversary = input.required<EncounterRunAdversaryResponse>();
  readonly density = input<'comfortable' | 'compact'>('comfortable');

  readonly hpMarkedChange = output<number>();
  readonly stressMarkedChange = output<number>();
  readonly tokensChange = output<number>();
  readonly defeatedToggle = output<void>();
  readonly noteChange = output<string>();

  private readonly expanded = signal(false);
  readonly isExpanded = this.expanded.asReadonly();

  /** Keyed on the run instance's own id, never the catalog adversaryId -- a run can hold three
   * Giant Mosquitoes sharing one catalog id, and they must not collide on ResourceTracker's
   * generated box ids or this row's own aria-controls target. */
  readonly idPrefix = computed(() => `run-adversary-${this.adversary().id}`);
  readonly detailId = computed(() => `${this.idPrefix()}-detail`);

  readonly rowLabel = computed(() => this.adversary().label ?? this.adversary().adversary?.name ?? 'Adversary');

  readonly adversaryData = computed(() => {
    const statBlock = this.adversary().adversary;
    return statBlock ? mapAdversaryToAdversaryData(statBlock) : undefined;
  });

  /** A GM-given nickname (`label`) is the primary name once set; the catalog name then becomes a
   * secondary line so the printed stat block is still identifiable at a glance. */
  readonly catalogName = computed(() => {
    const label = this.adversary().label;
    const name = this.adversaryData()?.name;
    return label && name && label !== name ? name : undefined;
  });

  readonly effectiveTier = computed(() => this.adversary().tierOverride);

  readonly isRetiered = computed(() => {
    const tier = this.effectiveTier();
    return tier !== undefined && tier !== this.adversaryData()?.tier;
  });

  private readonly retieredStats = computed(() => {
    const tier = this.effectiveTier();
    return tier === undefined ? undefined : improvisedTierStats(tier);
  });

  readonly tierLabel = computed(() => `Tier ${this.effectiveTier() ?? this.adversaryData()?.tier}`);

  /** `Solo` -- the book-printed term, not the raw `SOLO` enum value (`shared/utils/text.utils.ts`).
   * Feeds the row's "Solo · Tier 3" secondary line, which replaced the type/tier pair that used to
   * sit in the expanded detail's meta block (now removed -- this line is the one place it shows). */
  readonly typeLabel = computed(() => titleCase(this.adversaryData()?.adversaryType));

  /** The rulebook's own grouping (the "no Bruisers, Hordes, Leaders, or Solos" Battle Point
   * adjustment) -- carried onto the secondary line's type segment so it's still visible at a
   * glance now that it moved out of the expanded detail. */
  readonly isEliteType = computed(() => {
    const type = this.adversaryData()?.adversaryType;
    return type !== undefined && ELITE_ADVERSARY_TYPES.has(type);
  });

  readonly effectiveDifficulty = computed(() => this.retieredStats()?.difficulty ?? this.adversaryData()?.difficulty);
  readonly effectiveMajorThreshold = computed(
    () => this.retieredStats()?.majorThreshold ?? this.adversaryData()?.majorThreshold,
  );
  readonly effectiveSevereThreshold = computed(
    () => this.retieredStats()?.severeThreshold ?? this.adversaryData()?.severeThreshold,
  );

  /** Bare `+2`/`-1` -- the number a GM actually rolls against. The weapon name/range/damage that
   * used to sit alongside it on the row moved to the expanded detail; it was consistently the
   * widest item on the line across several rounds of trimming. */
  readonly attackModifierLabel = computed(() => {
    const mod = this.retieredStats()?.attackModifier ?? this.adversaryData()?.attackModifier;
    return mod === undefined ? undefined : this.formatModifier(mod);
  });

  toggleExpanded(): void {
    this.expanded.update(v => !v);
  }

  private formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
}
