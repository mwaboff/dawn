import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { LookupOption } from '../../../../shared/components/entity-form/entity-form.types';
import { ModalShell } from '../../../../shared/components/modal-shell/modal-shell';
import { CampaignService } from '../../../../shared/services/campaign.service';
import { ItemForm } from '../../../items/components/item-form/item-form';
import { ItemKind } from '../../../../shared/utils/item-routes.utils';
import { ItemFormValue, ITEM_KIND_ACCENTS, ITEM_KIND_LABELS } from '../../../items/models/item-form-value.model';
import { ItemResponse, ItemSubmit } from '../../../items/item-submit';
import { formValueToRequest, responseToFormValue } from '../../../items/item-builder/item-builder.mapper';
import { readSaveErrorMessage, shareableCampaignOptions } from '../../../items/utils/item-form-host.utils';

/** What the sheet needs to drop the new item into inventory: `onAddInventoryItem`'s event shape. */
export interface ItemCreatedEvent {
  type: ItemKind;
  item: ItemResponse;
}

/**
 * Builds or edits a piece of homebrew gear from inside the character sheet, so a player who wants a
 * weapon the books don't have -- or who got a number wrong on one they already wrote -- never
 * leaves the sheet to fix it.
 *
 * The second host of `ItemForm`, alongside the routed `ItemBuilder` page: this owns the POST/PUT,
 * the saving/error state, and the campaign options, exactly as the builder does (both share that
 * plumbing via `item-form-host.utils`), while the form itself stays ignorant of either. The kind is
 * fixed by the inventory tab or the item being edited, so the form's kind picker never appears here.
 *
 * Edit mode is `itemId`: the item is fetched, `responseToFormValue` fills the form, and the save
 * becomes an update. An edit applies everywhere that item is equipped, not just on this sheet --
 * the routed builder says so in prose, and the dialog says so in its subtitle.
 *
 * The buttons come from `ModalShell`'s actions slot rather than the form's own row, so they stay
 * pinned while the body scrolls -- the form is suppressed with `showActions` and reached across the
 * component boundary by `formId`, the same association `companion-form-modal` uses.
 *
 * Deliberately stops at emitting the saved item: inserting a new one into the inventory is
 * `character-sheet.ts`'s existing `onAddInventoryItem` -- the same path a catalogue pick takes,
 * optimistic insert, whole-array PUT, and reload included.
 */
@Component({
  selector: 'app-item-form-modal',
  imports: [ModalShell, ItemForm],
  templateUrl: './item-form-modal.html',
  styleUrl: './item-form-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The kind's accent, fed to `ModalShell` the same way `companion-form-modal` feeds it a
  // companion's. It colours the panel's top stripe and the submit button, so the dialog reads as
  // being about a weapon or an armor rather than generically gold -- matching the kind chip the
  // form shows in place of its picker.
  host: { '[style.--dialog-accent]': 'accent()' },
})
export class ItemFormModal {
  private readonly itemSubmit = inject(ItemSubmit);
  private readonly campaignService = inject(CampaignService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly kind = input.required<ItemKind>();
  /** The catalogue id of an existing item to edit. `null` builds a new one. */
  readonly itemId = input<number | null>(null);

  readonly created = output<ItemCreatedEvent>();
  readonly updated = output<ItemCreatedEvent>();
  readonly dismissed = output<void>();

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly campaignOptions = signal<LookupOption[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly initialValue = signal<ItemFormValue | null>(null);

  readonly canSetPublic = this.authService.isModerator;
  readonly isEditing = computed(() => this.itemId() !== null);
  readonly accent = computed(() => ITEM_KIND_ACCENTS[this.kind()]);

  /** The item names its own dialog once loaded, so an edit reads as being about that weapon. */
  readonly title = computed(() => {
    if (!this.isEditing()) return `Create Your Own ${ITEM_KIND_LABELS[this.kind()]}`;
    return this.initialValue()?.name?.trim() || `Edit ${ITEM_KIND_LABELS[this.kind()]}`;
  });

  readonly submitLabel = computed(() => (this.isEditing() ? 'Save changes' : 'Create & Add'));

  /**
   * Ties the shell's submit button to the form it lives outside of. Fixed rather than uniquified
   * because only one of these modals is ever mounted -- the sheets gate it behind a single `@if` on
   * one signal, so a second instance cannot exist to collide with the id.
   */
  readonly formId = 'item-form-modal-form';

  constructor() {
    shareableCampaignOptions(this.campaignService)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(options => this.campaignOptions.set(options));

    effect(() => {
      const id = this.itemId();
      const kind = this.kind();
      untracked(() => {
        this.initialValue.set(null);
        this.loadError.set(false);
        if (id === null) {
          this.loading.set(false);
          return;
        }
        this.loadItem(kind, id);
      });
    });
  }

  private loadItem(kind: ItemKind, id: number): void {
    this.loading.set(true);
    this.itemSubmit
      .load(kind, id)
      .pipe(
        catchError(() => {
          this.loadError.set(true);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(response => {
        this.loading.set(false);
        if (response) this.initialValue.set(responseToFormValue(kind, response));
      });
  }

  onSubmitted(value: ItemFormValue): void {
    const kind = this.kind();
    const id = this.itemId();
    this.saving.set(true);
    this.saveError.set(null);

    const request = formValueToRequest({ ...value, kind });
    const save$ = id === null ? this.itemSubmit.create(kind, request) : this.itemSubmit.update(kind, id, request);

    save$
      .pipe(
        catchError((err: unknown) => {
          this.saveError.set(readSaveErrorMessage(err));
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(item => {
        this.saving.set(false);
        if (!item) return;
        if (id === null) this.created.emit({ type: kind, item });
        else this.updated.emit({ type: kind, item });
      });
  }

  onDismiss(): void {
    if (!this.saving()) {
      this.dismissed.emit();
    }
  }
}
