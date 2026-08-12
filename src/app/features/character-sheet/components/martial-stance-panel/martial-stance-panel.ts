import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MartialStanceResponse } from '../../../../shared/models/martial-stance-api.model';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';
import { RestrictedCardPlaceholder } from '../restricted-card-placeholder/restricted-card-placeholder';
import { RESTRICTED_CARD_TITLE } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';

/** Drop conditions shown as a static reminder -- never varies per character, per rules text. */
export const MARTIAL_STANCE_DROP_CONDITIONS: readonly string[] = [
  'You take Severe damage',
  'You mark your last Hit Point',
  'You shift to another stance',
  'The scene ends',
];

/**
 * Known-stance display with active-stance selection, rendered in the sheet's expandable-card
 * vocabulary so a stance reads as the same kind of thing as a subclass or beastform card. Entering
 * a stance costs 1 Focus, so activation is disabled once Focus is empty; the four drop conditions
 * are shown as a static rules reminder since they are triggered by gameplay events this app does
 * not track.
 */
@Component({
  selector: 'app-martial-stance-panel',
  templateUrl: './martial-stance-panel.html',
  styleUrl: './martial-stance-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatTextPipe, RestrictedCardPlaceholder],
})
export class MartialStancePanel {
  readonly knownStances = input<MartialStanceResponse[]>([]);
  readonly activeStanceId = input<number | null>(null);
  readonly focusMarked = input(0);
  readonly canAct = input(false);
  readonly actionInFlight = input(false);

  readonly activateStance = output<number>();
  readonly clearStance = output<void>();

  readonly dropConditions = MARTIAL_STANCE_DROP_CONDITIONS;

  private readonly expandedIds = signal<ReadonlySet<number>>(new Set());

  /**
   * Tier carries the same weight here as on a beastform card -- a meta badge, not a group heading.
   * A restricted stance's `name` is redacted (SRD vs. paid-expansion content gating), so the
   * comparator falls back to `''` rather than reading `.localeCompare` off `undefined` -- it sorts
   * first within its tier, which is fine since nothing about a locked stance's printed order is
   * knowable anyway.
   */
  readonly stances = computed(() =>
    [...this.knownStances()].sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0) || (a.name ?? '').localeCompare(b.name ?? '')),
  );

  readonly canActivateAnotherStance = computed(() => this.canAct() && !this.actionInFlight() && this.focusMarked() >= 1);

  /** The collapsed badge is visual only, so the state change is announced separately. A
   * restricted active stance announces the shared placeholder title rather than `undefined`. */
  readonly activeStanceAnnouncement = computed(() => {
    const active = this.stances().find(stance => stance.id === this.activeStanceId());
    if (!active) return 'No stance active';
    return `Active stance: ${active.restricted ? RESTRICTED_CARD_TITLE : active.name}`;
  });

  isActive(stanceId: number): boolean {
    return this.activeStanceId() === stanceId;
  }

  isExpanded(stanceId: number): boolean {
    return this.expandedIds().has(stanceId);
  }

  toggleStance(stanceId: number): void {
    this.expandedIds.update(current => {
      const next = new Set(current);
      if (!next.delete(stanceId)) {
        next.add(stanceId);
      }
      return next;
    });
  }

  onActivate(stanceId: number): void {
    if (this.isActive(stanceId) || !this.canActivateAnotherStance()) return;
    this.activateStance.emit(stanceId);
  }

  onClear(): void {
    if (!this.canAct() || this.actionInFlight() || this.activeStanceId() === null) return;
    this.clearStance.emit();
  }
}
