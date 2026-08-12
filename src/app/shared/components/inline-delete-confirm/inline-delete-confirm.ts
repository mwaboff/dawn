import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

const DEFAULT_CONFIRM_TEXT = 'Delete?';

@Component({
  selector: 'app-inline-delete-confirm',
  templateUrl: './inline-delete-confirm.html',
  styleUrl: './inline-delete-confirm.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class InlineDeleteConfirm {
  readonly itemLabel = input.required<string>();
  readonly active = input(false);
  /** `md` (32px, the roster row default) or `sm` (26px), to sit on the same baseline as the 26px
   * icon-only controls in an `EntityCard`'s `[card-actions]` slot (`.card-swap-btn--icon`) instead
   * of towering over them. */
  readonly size = input<'md' | 'sm'>('md');
  /** Defaults to the terse "Delete?" every existing call site relies on. A caller whose delete has
   * consequences beyond the item itself (the run screen's Delete Encounter also destroys the
   * in-progress run's live HP/Stress/tokens/notes -- see `RunLifecycleActions`) can override this
   * with copy that names what's actually at stake, rather than every consequential delete forking
   * its own confirm UI. */
  readonly confirmText = input(DEFAULT_CONFIRM_TEXT);

  /** `.roster-inline-confirm` is `flex-shrink: 0` globally (`shared/styles/roster.css`) on purpose
   * -- in a roster row, `.roster-info`'s name is the element meant to give way (`flex: 1; min-width:
   * 0`, truncated with an ellipsis), while the delete control next to it stays a fixed, predictable
   * size. That's correct for every existing caller's short "Delete?", but would silently overflow a
   * longer custom `confirmText` instead of wrapping it -- confirmed by rendering the actual compiled
   * markup/CSS at the GM panel's ~300px floor, where the long copy ran straight off the edge of the
   * panel rather than dropping to a second line. Rather than changing `.roster-inline-confirm`'s
   * shared behaviour (and risking every other call site), this modifier class -- scoped to this
   * component's own un-projected template, so no `::ng-deep` is needed -- opts a caller with custom
   * copy into wrapping instead. Keyed off "is this the default text", not a separate boolean input,
   * so there's nothing for a caller to remember to set. */
  readonly wrapsConfirmText = computed(() => this.confirmText() !== DEFAULT_CONFIRM_TEXT);

  readonly requested = output<void>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  /**
   * Neither transition has anywhere else to send focus once its own button is destroyed by the
   * `@if`/`@else` swap -- a destroyed element takes focus to `<body>` with it, same problem the
   * beta inventory's own bespoke remove-confirm solved before this component existed. Both target
   * elements are looked up by `viewChild` and moved to imperatively (not via a reactive `effect`,
   * which would also fire on initial mount and steal focus from wherever the page already put it).
   */
  private readonly trashButton = viewChild<ElementRef<HTMLButtonElement>>('trashButton');
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');
  private readonly injector = inject(Injector);

  onTrashClick(event: Event): void {
    event.stopPropagation();
    this.requested.emit();
    this.focusAfterRender(() => this.confirmButton());
  }

  onYesClick(event: Event): void {
    event.stopPropagation();
    this.confirmed.emit();
  }

  onNoClick(event: Event): void {
    event.stopPropagation();
    this.cancelled.emit();
    this.focusAfterRender(() => this.trashButton());
  }

  private focusAfterRender(target: () => ElementRef<HTMLButtonElement> | undefined): void {
    afterNextRender(() => target()?.nativeElement.focus(), { injector: this.injector });
  }
}
