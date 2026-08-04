import { ChangeDetectionStrategy, Component, OnInit, input, output, signal } from '@angular/core';
import {
  CompanionCreateSubmission,
  CompanionFormModal,
} from '../../../character-sheet/components/companion-panel/components/companion-form-modal/companion-form-modal';
import { CompanionApiResponse } from '../../../../shared/models/companion-api.model';

export type CompanionStepSelection =
  | { mode: 'create'; draft: CompanionCreateSubmission }
  | { mode: 'restore'; companionId: number; name: string };

/**
 * The level-up wizard's `companion` tab -- shown when this level-up newly grants the Companion
 * feature and the character has no active companion (see `acquiresCompanionFeature` and
 * `level-up.ts`'s `needsCompanionStep`). Offers "Create new" (reusing `CompanionFormModal`, the
 * same create/edit dialog the character sheet's companion panel uses) or "Restore <name>" for
 * each soft-deleted, `SUBCLASS_FEATURE`-origin companion the backend returns as restorable.
 *
 * Unlike the character sheet's normal use of `CompanionFormModal`, submitting the form here only
 * stages a DRAFT locally -- `selectionChanged` emits it, nothing is POSTed. A brand-new
 * companion's id must exist before the level-up request is sent (`newCompanionId`), so the actual
 * `CompanionService.createCompanion` call happens in `level-up.ts`'s phase-0 submit step, guarded
 * against a double-create on retry. Restoring an existing companion needs no separate call at
 * all: the backend restores it as part of applying the same level-up request.
 */
@Component({
  selector: 'app-companion-step',
  imports: [CompanionFormModal],
  templateUrl: './companion-step.html',
  styleUrl: './companion-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanionStep implements OnInit {
  readonly characterSheetId = input.required<number>();
  readonly restorableCompanions = input<CompanionApiResponse[]>([]);
  readonly initialSelection = input<CompanionStepSelection | null>(null);

  readonly selectionChanged = output<CompanionStepSelection | null>();

  readonly showCreateModal = signal(false);
  readonly selection = signal<CompanionStepSelection | null>(null);

  ngOnInit(): void {
    if (this.initialSelection()) {
      this.selection.set(this.initialSelection());
    }
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  onCreateDismissed(): void {
    this.showCreateModal.set(false);
  }

  onDraftCreated(draft: CompanionCreateSubmission): void {
    this.showCreateModal.set(false);
    const next: CompanionStepSelection = { mode: 'create', draft };
    this.selection.set(next);
    this.selectionChanged.emit(next);
  }

  onRestoreChosen(companion: CompanionApiResponse): void {
    const next: CompanionStepSelection = { mode: 'restore', companionId: companion.id, name: companion.name };
    this.selection.set(next);
    this.selectionChanged.emit(next);
  }

  onChangeSelection(): void {
    this.selection.set(null);
    this.selectionChanged.emit(null);
  }
}
