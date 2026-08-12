import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormatTextPipe } from '../../../../../../shared/pipes/format-text.pipe';
import { ResourceTracker } from '../../../../../../shared/components/resource-tracker/resource-tracker';
import { InlineDeleteConfirm } from '../../../../../../shared/components/inline-delete-confirm/inline-delete-confirm';
import { CompanionTrainingList } from '../companion-training-list/companion-training-list';
import { titleCase } from '../../../../../../shared/utils/text.utils';
import { CompanionApiResponse } from '../../../../../../shared/models/companion-api.model';
import { CompanionClassFeatureReminder } from '../../../../utils/companion-access.utils';

const DAMAGE_TYPE_CODES: Record<string, string> = { PHYSICAL: 'phy', MAGIC: 'mag' };

/**
 * `Bonded`/`Creature Comfort` are table-adjudicated Training effects -- shown as VERBATIM
 * reminder text, never automated, never paraphrased. See companions plan §6.3 and
 * `resources/rules/chapters/core-01-preparing-for-adventure.md:1351-1365`. `BONDED`'s full
 * procedure (how many dice, what to mark, what counts as success) is information a player needs
 * to resolve the moment, not flavor text to shorten.
 */
const TRAINING_REMINDERS: Partial<Record<string, string>> = {
  BONDED: 'When you mark your last Hit Point, your companion rushes to your side to comfort you. Roll a number of d6s equal to the unmarked Stress slots they have and mark them. If any roll a 6, your companion helps you up. Clear your last Hit Point and return to the scene.',
  CREATURE_COMFORT: 'Once per rest, when you take time during a quiet moment to give your companion love and attention, you can gain a Hope or you can both clear a Stress.',
};

/**
 * One companion's expandable card: attack line, Stress, Experiences, Training, description, and
 * owner/admin controls. Follows `transformation-panel`'s shape -- no injected sheet state, every
 * mutating method guards on `canManage()`, all writes bubble up via `output()` for the parent to
 * persist through the sheet's existing optimistic-save pipeline.
 */
@Component({
  selector: 'app-companion-card',
  templateUrl: './companion-card.html',
  styleUrl: './companion-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatTextPipe, ResourceTracker, InlineDeleteConfirm, CompanionTrainingList],
})
export class CompanionCard {
  readonly companion = input.required<CompanionApiResponse>();
  /** The owning character's live Proficiency, read from the sheet -- never the companion
   * response's own `attackDiceCount`, which can go stale between companion refetches. */
  readonly proficiency = input.required<number>();
  readonly canManage = input(false);
  readonly processing = input(false);
  /** Whether the character has an unmarked Armor Slot right now, for the `Armored` training's
   * "mark Armor instead of Stress" offer. */
  readonly armorAvailable = input(false);
  /** Non-null only while the equipped armor is restricted (SRD vs. paid-expansion content
   * gating). The offer stays visible in that case rather than silently vanishing the way it would
   * if this were folded into `armorAvailable` -- see `offersArmorInstead` -- but the button itself
   * is disabled and carries this as its reason, since we cannot tell whether a slot is actually
   * free. See `CharacterSheet.armorInsteadUnavailableReason` for where the text comes from. */
  readonly armorInsteadUnavailableReason = input<string | null>(null);
  /** Verbatim reminders for Beastbound Specialization/Mastery features that affect the companion
   * but aren't Training options -- "Battle-Bonded"/"Loyal Friend" -- so have nowhere else on this
   * card to be shown. Computed once at the character-sheet level from the owning character's
   * subclass cards (`companionClassFeatureReminders`), not per-companion data. */
  readonly classFeatureReminders = input<CompanionClassFeatureReminder[]>([]);

  readonly editRequested = output<void>();
  readonly deleteConfirmed = output<void>();
  readonly stressChanged = output<number>();
  readonly markArmorInstead = output<void>();

  readonly expanded = signal(false);
  readonly deleteConfirmActive = signal(false);
  /** A stress increase pending the "mark Stress or mark Armor instead?" choice; null otherwise. */
  readonly pendingStressValue = signal<number | null>(null);

  readonly attackLine = computed(() => {
    const c = this.companion();
    const die = c.damageDice.toLowerCase();
    const dmg = DAMAGE_TYPE_CODES[c.damageType] ?? c.damageType.toLowerCase();
    return `${this.proficiency()}${die} ${dmg} at ${titleCase(c.attackRange)}`;
  });

  readonly hasArmoredTraining = computed(() => this.companion().trainings.some(t => t.option === 'ARMORED'));
  /**
   * Whether the "mark Armor instead" choice is offered at all. True either because a slot is
   * genuinely free, or because the equipped armor is restricted and we cannot tell -- the second
   * case must still surface the choice (disabled, with a reason) rather than silently behaving as
   * if the character had no Armor capacity at all, which is what folding
   * `armorInsteadUnavailableReason` into `armorAvailable` itself would do.
   */
  readonly offersArmorInstead = computed(() =>
    this.hasArmoredTraining() && (this.armorAvailable() || this.armorInsteadUnavailableReason() !== null),
  );

  /** Drives the "Mark Armor Instead" button's `disabled`/label -- shared by classic and beta so
   * the two templates read the same condition instead of repeating it. */
  readonly armorInsteadDisabled = computed(() => !this.armorAvailable() && this.armorInsteadUnavailableReason() !== null);

  readonly reminders = computed(() =>
    this.companion().trainings
      .map(t => TRAINING_REMINDERS[t.option])
      .filter((text): text is string => !!text),
  );

  readonly outOfSceneAnnouncement = computed(() =>
    this.companion().outOfScene ? `${this.companion().name} is out of scene.` : '',
  );

  toggleExpanded(): void {
    this.expanded.update(v => !v);
  }

  onEditClicked(): void {
    if (!this.canManage()) return;
    this.editRequested.emit();
  }

  onDeleteRequested(): void {
    if (!this.canManage()) return;
    this.deleteConfirmActive.set(true);
  }

  onDeleteConfirmed(): void {
    this.deleteConfirmActive.set(false);
    this.deleteConfirmed.emit();
  }

  onDeleteCancelled(): void {
    this.deleteConfirmActive.set(false);
  }

  onStressMarkedChange(newValue: number): void {
    if (!this.canManage()) return;
    const markingUp = newValue > this.companion().stressMarked;
    if (markingUp && this.offersArmorInstead()) {
      this.pendingStressValue.set(newValue);
      return;
    }
    this.stressChanged.emit(newValue);
  }

  confirmMarkStress(): void {
    const value = this.pendingStressValue();
    if (value != null) this.stressChanged.emit(value);
    this.pendingStressValue.set(null);
  }

  confirmMarkArmorInstead(): void {
    // Defense in depth -- the button that calls this is already `disabled` in this state, so this
    // only matters if something reaches the handler another way.
    if (this.armorInsteadDisabled()) return;
    this.markArmorInstead.emit();
    this.pendingStressValue.set(null);
  }

  cancelPendingStress(): void {
    this.pendingStressValue.set(null);
  }
}
