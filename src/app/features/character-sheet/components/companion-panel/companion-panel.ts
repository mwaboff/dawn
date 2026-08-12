import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { SavingSpinner } from '../../../../shared/components/saving-spinner/saving-spinner';
import { CompanionCard } from './components/companion-card/companion-card';
import {
  CompanionCreateSubmission,
  CompanionFormModal,
  CompanionUpdateSubmission,
} from './components/companion-form-modal/companion-form-modal';
import { CompanionApiResponse } from '../../../../shared/models/companion-api.model';
import { CompanionClassFeatureReminder } from '../../utils/companion-access.utils';

export interface CompanionStressChangedEvent {
  companionId: number;
  stressMarked: number;
}

/**
 * The "Companions" card-group: one `CompanionCard` per companion plus the add/edit modal. The
 * parent (`character-sheet.ts`) gates whether this renders at all (`showCompanionPanel`); this
 * component assumes it should always render its list once mounted. No injected sheet state --
 * every write bubbles up via `output()` for the parent to persist and roll back on error.
 */
@Component({
  selector: 'app-companion-panel',
  templateUrl: './companion-panel.html',
  styleUrl: './companion-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SavingSpinner, CompanionCard, CompanionFormModal],
})
export class CompanionPanel {
  readonly companions = input.required<CompanionApiResponse[]>();
  readonly proficiency = input.required<number>();
  readonly characterSheetId = input.required<number>();
  readonly canManage = input(false);
  readonly canCreate = input(false);
  readonly saving = input(false);
  readonly armorAvailable = input(false);
  /** Non-null only while the equipped armor is restricted -- see `CharacterSheet
   * .armorInsteadUnavailableReason`'s own doc comment. Forwarded to every `CompanionCard` so the
   * Armored training's "mark Armor instead" offer can stay visible but disabled, with why. */
  readonly armorInsteadUnavailableReason = input<string | null>(null);
  readonly errorMessage = input<string | null>(null);
  /** Forwarded to every `CompanionCard` -- see that component's doc for why this is computed once
   * at the character-sheet level rather than per-companion. */
  readonly classFeatureReminders = input<CompanionClassFeatureReminder[]>([]);

  readonly companionCreated = output<CompanionCreateSubmission>();
  readonly companionUpdated = output<CompanionUpdateSubmission>();
  readonly companionDeleted = output<number>();
  readonly companionStressChanged = output<CompanionStressChangedEvent>();
  readonly markArmorInstead = output<void>();
  readonly dismissError = output<void>();

  readonly modalMode = signal<'create' | 'edit' | null>(null);
  readonly editingCompanion = signal<CompanionApiResponse | null>(null);

  openCreateModal(): void {
    if (!this.canCreate()) return;
    this.editingCompanion.set(null);
    this.modalMode.set('create');
  }

  openEditModal(companion: CompanionApiResponse): void {
    if (!this.canManage()) return;
    this.editingCompanion.set(companion);
    this.modalMode.set('edit');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.editingCompanion.set(null);
  }

  onCreated(submission: CompanionCreateSubmission): void {
    this.companionCreated.emit(submission);
    this.closeModal();
  }

  onUpdated(submission: CompanionUpdateSubmission): void {
    this.companionUpdated.emit(submission);
    this.closeModal();
  }

  onDismissError(): void {
    this.dismissError.emit();
  }

  onDelete(companionId: number): void {
    this.companionDeleted.emit(companionId);
  }

  onMarkArmorInstead(): void {
    this.markArmorInstead.emit();
  }

  onStressChanged(companionId: number, stressMarked: number): void {
    this.companionStressChanged.emit({ companionId, stressMarked });
  }

}
