import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { LookupOption } from '../../../shared/components/entity-form/entity-form.types';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignService } from '../../../shared/services/campaign.service';
import { ItemForm } from '../components/item-form/item-form';
import { ItemFormValue } from '../models/item-form-value.model';
import { ItemKind, isItemKind, itemEditPath } from '../item-routes';
import { ItemSubmit } from '../item-submit';
import { formValueToRequest, responseToFormValue } from './item-builder.mapper';

/** Enough campaigns to cover any realistic table list without paging the picker. */
const CAMPAIGN_PAGE_SIZE = 100;

/**
 * Routed create/edit shell for homebrew gear. Owns the route, the fetch, the save, and the
 * navigation; `ItemForm` owns the editing and knows about none of it.
 */
@Component({
  selector: 'app-item-builder',
  imports: [ItemForm],
  templateUrl: './item-builder.html',
  styleUrl: './item-builder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemBuilder implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly itemSubmit = inject(ItemSubmit);
  private readonly campaignService = inject(CampaignService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly itemId = signal<number | null>(null);
  /** Set only in edit mode, where the kind is fixed by the URL and the picker is hidden. */
  readonly lockedKind = signal<ItemKind | null>(null);
  readonly initialValue = signal<ItemFormValue | null>(null);
  readonly campaignOptions = signal<LookupOption[]>([]);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly canSetPublic = this.authService.isModerator;
  readonly isEdit = computed(() => this.itemId() !== null);
  readonly heading = computed(() => (this.isEdit() ? 'Edit Item' : 'Create an Item'));
  readonly submitLabel = computed(() => (this.isEdit() ? 'Save Changes' : 'Create Item'));

  ngOnInit(): void {
    this.loadCampaigns();

    const params = this.route.snapshot.paramMap;
    const idParam = params.get('id');
    if (idParam === null) return;

    const kind = params.get('type');
    if (!isItemKind(kind)) {
      this.loadError.set(true);
      return;
    }

    this.itemId.set(Number(idParam));
    this.lockedKind.set(kind);
    this.loadItem(kind, Number(idParam));
  }

  onSubmitted(value: ItemFormValue): void {
    this.saving.set(true);
    this.saveError.set(null);

    const kind = this.lockedKind() ?? value.kind;
    const id = this.itemId();
    const request = formValueToRequest({ ...value, kind });
    const save$ = id === null
      ? this.itemSubmit.create(kind, request)
      : this.itemSubmit.update(kind, id, request);

    save$
      .pipe(
        catchError((err: unknown) => {
          this.saveError.set(readErrorMessage(err));
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(response => {
        this.saving.set(false);
        if (!response) return;

        if (id === null) {
          this.itemId.set(response.id);
          this.lockedKind.set(kind);
          this.router.navigate([itemEditPath(kind, response.id)], { replaceUrl: true });
        }
        this.initialValue.set(responseToFormValue(kind, response));
      });
  }

  onCancelled(): void {
    this.router.navigate(['/reference']);
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
        if (response) {
          this.initialValue.set(responseToFormValue(kind, response));
        }
      });
  }

  /**
   * A failure here is not worth an error state: the picker simply offers nothing, and the item
   * still saves. Sharing is optional, and can be added later from the edit page.
   */
  private loadCampaigns(): void {
    this.campaignService
      .getMyCampaigns(0, CAMPAIGN_PAGE_SIZE)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(response => {
        if (!response) return;
        this.campaignOptions.set(
          response.content
            // Ended campaigns are history; sharing new homebrew into one helps nobody.
            .filter(campaign => !campaign.isEnded)
            .map(campaign => ({ id: campaign.id, label: campaign.name })),
        );
      });
  }
}

/**
 * Turns a failed save into something a user can act on.
 *
 * `fieldErrors` is checked first and spelled out in full: this backend's `ValidationErrorResponse`
 * sends per-field messages with no top-level `message` at all, so reading only `message` would
 * replace "Severe threshold must not be null" with a shrug. Attaching these to the individual
 * controls would be better still, but that needs a new input on the presentational form -- see the
 * bd issue.
 */
function readErrorMessage(err: unknown): string {
  const body = (err as { error?: { message?: string; fieldErrors?: Record<string, string> } } | null)?.error;

  const fieldErrors = body?.fieldErrors;
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return Object.entries(fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('; ');
  }

  return body?.message ?? 'Save failed. Please try again.';
}
