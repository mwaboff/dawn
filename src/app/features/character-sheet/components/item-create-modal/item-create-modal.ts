import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { LookupOption } from '../../../../shared/components/entity-form/entity-form.types';
import { ModalShell } from '../../../../shared/components/modal-shell/modal-shell';
import { CampaignService } from '../../../../shared/services/campaign.service';
import { ItemForm } from '../../../items/components/item-form/item-form';
import { ItemKind } from '../../../items/item-routes';
import { ItemFormValue, ITEM_KIND_ACCENTS, ITEM_KIND_LABELS } from '../../../items/models/item-form-value.model';
import { ItemResponse, ItemSubmit } from '../../../items/item-submit';
import { formValueToRequest } from '../../../items/item-builder/item-builder.mapper';
import { readSaveErrorMessage, shareableCampaignOptions } from '../../../items/utils/item-form-host.utils';

/** What the sheet needs to drop the new item into inventory: `onAddInventoryItem`'s event shape. */
export interface ItemCreatedEvent {
  type: ItemKind;
  item: ItemResponse;
}

/**
 * Creates a piece of homebrew gear from inside the character sheet, so a player who wants a weapon
 * the books don't have never leaves the sheet to get it.
 *
 * The second host of `ItemForm`, alongside the routed `ItemBuilder` page: this owns the POST, the
 * saving/error state, and the campaign options, exactly as the builder does (both share that
 * plumbing via `item-form-host.utils`), while the form itself stays ignorant of either. The kind is
 * fixed by the inventory tab the request came from, so the form's kind picker never appears here.
 *
 * The buttons come from `ModalShell`'s actions slot rather than the form's own row, so they stay
 * pinned while the body scrolls -- the form is suppressed with `showActions` and reached across the
 * component boundary by `formId`, the same association `companion-form-modal` uses.
 *
 * Deliberately stops at emitting the created item: inserting it into the inventory is
 * `character-sheet.ts`'s existing `onAddInventoryItem` -- the same path a catalogue pick takes,
 * optimistic insert, whole-array PUT, and reload included.
 */
@Component({
  selector: 'app-item-create-modal',
  imports: [ModalShell, ItemForm],
  templateUrl: './item-create-modal.html',
  styleUrl: './item-create-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The kind's accent, fed to `ModalShell` the same way `companion-form-modal` feeds it a
  // companion's. It colours the panel's top stripe and the submit button, so the dialog reads as
  // being about a weapon or an armor rather than generically gold -- matching the kind chip the
  // form shows in place of its picker.
  host: { '[style.--dialog-accent]': 'accent()' },
})
export class ItemCreateModal {
  private readonly itemSubmit = inject(ItemSubmit);
  private readonly campaignService = inject(CampaignService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly kind = input.required<ItemKind>();

  readonly created = output<ItemCreatedEvent>();
  readonly dismissed = output<void>();

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly campaignOptions = signal<LookupOption[]>([]);

  readonly canSetPublic = this.authService.isModerator;
  readonly title = computed(() => `Create Your Own ${ITEM_KIND_LABELS[this.kind()]}`);
  readonly accent = computed(() => ITEM_KIND_ACCENTS[this.kind()]);

  /**
   * Ties the shell's submit button to the form it lives outside of. Fixed rather than uniquified
   * because only one of these modals is ever mounted -- `character-sheet.html` gates it behind a
   * single `@if` on one signal, so a second instance cannot exist to collide with the id.
   */
  readonly formId = 'item-create-modal-form';

  constructor() {
    shareableCampaignOptions(this.campaignService)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(options => this.campaignOptions.set(options));
  }

  onSubmitted(value: ItemFormValue): void {
    const kind = this.kind();
    this.saving.set(true);
    this.saveError.set(null);

    this.itemSubmit
      .create(kind, formValueToRequest({ ...value, kind }))
      .pipe(
        catchError((err: unknown) => {
          this.saveError.set(readSaveErrorMessage(err));
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(item => {
        this.saving.set(false);
        if (item) {
          this.created.emit({ type: kind, item });
        }
      });
  }

  onDismiss(): void {
    if (!this.saving()) {
      this.dismissed.emit();
    }
  }
}
