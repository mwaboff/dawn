import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { LookupOption } from '../../../shared/components/entity-form/entity-form.types';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignService } from '../../../shared/services/campaign.service';
import { ItemForm } from '../components/item-form/item-form';
import { ITEM_KIND_LABELS, ItemFormValue } from '../models/item-form-value.model';
import { ItemKind, isItemKind, itemEditPath } from '../item-routes';
import { ItemSubmit } from '../item-submit';
import { readSaveErrorMessage, shareableCampaignOptions } from '../utils/item-form-host.utils';
import { formValueToRequest, responseToFormValue, savedResponseToFormValue } from './item-builder.mapper';

/**
 * Narrows a `returnTo` to a same-origin path before anything navigates to it. The value comes off
 * the query string, so it is whatever was in the address bar: a protocol-relative `//evil.test` or
 * an absolute URL would otherwise send the user off the site from a link that looks like ours.
 */
function readReturnTo(raw: string | null): string | null {
  if (raw === null || !raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

/**
 * Routed create/edit shell for homebrew gear. Owns the route, the fetch, the save, and the
 * navigation; `ItemForm` owns the editing and knows about none of it.
 */
@Component({
  selector: 'app-item-builder',
  imports: [ItemForm, RouterLink],
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
  readonly duplicating = signal(false);
  readonly duplicateError = signal(false);

  readonly canSetPublic = this.authService.isModerator;
  readonly isEdit = computed(() => this.itemId() !== null);
  readonly submitLabel = computed(() => (this.isEdit() ? 'Save Changes' : 'Create Item'));

  /**
   * Which of the page's two jobs is running. Carried by the eyebrow rather than the title, because
   * in edit mode the title is given over to the item's own name.
   */
  readonly eyebrow = computed(() => {
    const kind = this.lockedKind();
    if (!this.isEdit() || kind === null) return 'New homebrew';
    return `Editing your ${ITEM_KIND_LABELS[kind].toLowerCase()}`;
  });

  /**
   * The item names the page it is edited on, so an edit reads as being about that weapon rather
   * than about the act of editing. Falls back while the fetch is still in flight, and for an item
   * saved with a blank name the server let through.
   */
  readonly heading = computed(() => {
    if (!this.isEdit()) return 'Create an Item';
    return this.initialValue()?.name?.trim() || 'Edit Item';
  });

  /**
   * Where Cancel and the back link go. Callers that sent the user here mid-task -- the character
   * sheet's inventory -- pass their own URL as `returnTo` so leaving lands back where they were,
   * rather than dumping them in the codex.
   */
  readonly returnTo = signal<string | null>(null);
  readonly backTarget = computed(() => this.returnTo() ?? '/reference');
  readonly backLabel = computed(() =>
    this.returnTo() === null ? 'Back to the Codex' : 'Back to your sheet',
  );

  ngOnInit(): void {
    this.loadCampaigns();
    this.returnTo.set(readReturnTo(this.route.snapshot.queryParamMap.get('returnTo')));

    // Reads the params as a stream, not a snapshot: Duplicate navigates from one item's edit URL
    // to another's, and Angular reuses this component across that, so a snapshot read would leave
    // the form showing the item that was just forked.
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam === null) return;

      const kind = params.get('type');
      if (!isItemKind(kind)) {
        this.loadError.set(true);
        return;
      }

      const id = Number(idParam);
      // The create flow rewrites the URL to the new item's edit path once the POST lands. That
      // arrives here as a param change for a record whose response we already hold, so skip the
      // refetch rather than clobbering the freshly-saved form.
      if (this.itemId() === id && this.lockedKind() === kind) return;

      this.saveError.set(null);
      this.duplicateError.set(false);
      this.loadError.set(false);
      this.itemId.set(id);
      this.lockedKind.set(kind);
      this.loadItem(kind, id);
    });
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
          this.saveError.set(readSaveErrorMessage(err));
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
          // `preserve` so a `returnTo` handed in by the caller survives the rewrite -- otherwise
          // Cancel after a first save would forget where the user came from.
          this.router.navigate([itemEditPath(kind, response.id)], {
            replaceUrl: true,
            queryParamsHandling: 'preserve',
          });
        }
        this.initialValue.set(savedResponseToFormValue(kind, response, value.features));
      });
  }

  onCancelled(): void {
    this.router.navigateByUrl(this.backTarget());
  }

  /**
   * Forks the item into a new one and moves the editor onto the fork, so "nearly this, but a
   * different damage die" doesn't mean retyping the whole thing.
   *
   * The copy happens server-side from the persisted row, so anything typed but not yet saved is
   * not carried over -- the button is disabled while a save is in flight, but a user with dirty
   * fields still duplicates what was last saved. Only offered in edit mode; there is nothing to
   * fork until the item exists.
   */
  onDuplicate(): void {
    const kind = this.lockedKind();
    const id = this.itemId();
    if (kind === null || id === null || this.duplicating() || this.saving()) return;

    this.duplicating.set(true);
    this.duplicateError.set(false);
    this.itemSubmit
      .copy(kind, id)
      .pipe(
        catchError(() => {
          this.duplicateError.set(true);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(response => {
        this.duplicating.set(false);
        if (!response) return;

        // Reload through the route rather than patching the signals in place: the URL has to
        // become the copy's, or a refresh would land back on the original.
        this.router.navigate([itemEditPath(kind, response.id)], { queryParamsHandling: 'preserve' });
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
        if (response) {
          // No fallback here, unlike after a save: a fetch is authoritative about what the item
          // has, and an item with no features is exactly what an omitted array means.
          this.initialValue.set(responseToFormValue(kind, response));
        }
      });
  }

  private loadCampaigns(): void {
    shareableCampaignOptions(this.campaignService)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(options => this.campaignOptions.set(options));
  }
}
