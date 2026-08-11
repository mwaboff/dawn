import {
  DestroyRef,
  Directive,
  ElementRef,
  OnDestroy,
  ViewContainerRef,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkContextMenuTrigger } from '@angular/cdk/menu';
import { OverlayContainer } from '@angular/cdk/overlay';
import { RollOptionsMenu } from './roll-options-menu';

/** The three ways an action/reaction roll can be modified (Core rules L551-L557: advantage adds
 *  a d6, disadvantage subtracts one, and the two always cancel rather than stacking). */
export type RollOption = 'advantage' | 'normal' | 'disadvantage';

const LONG_PRESS_MS = 500;
const MOVE_CANCEL_THRESHOLD_PX = 10;

/**
 * The one `RollOptionsDirective` instance with its menu open at a time, app-wide. CDK's own
 * cross-trigger exclusivity (`_menuTracker`, which closes an already-open context menu when
 * another one opens) is only ever updated from `CdkContextMenuTrigger`'s native `contextmenu`
 * handler -- our keyboard and long-press paths call the public `open()` method directly and never
 * reach it, so without this, two of our own menus could be open at once. That's invisible with a
 * single trigger and trivial to hit the moment this directive sits on several sibling trait
 * badges, which is exactly how it ships.
 */
let openInstance: RollOptionsDirective | null = null;

/** Assigns via a parameter rather than `openInstance = this` directly, which
 *  `@typescript-eslint/no-this-alias` (correctly, in the general case) disallows. */
function setOpenInstance(instance: RollOptionsDirective): void {
  openInstance = instance;
}

/**
 * Opens an Advantage / Normal / Disadvantage picker on right-click, on a ~500ms long-press, or
 * from the keyboard -- the conventional ways to reach a context/menu-button menu. A thin wrapper
 * around `@angular/cdk/menu`'s `CdkContextMenuTrigger`, composed in via `hostDirectives` so it
 * attaches to the same element this directive is applied to. CDK supplies the overlay,
 * viewport-aware positioning, `role="menu"`/`menuitem` semantics, arrow-key navigation,
 * typeahead, roving-tabindex focus management and Escape/outside-click/scroll dismissal. This
 * directive only adds:
 *   - the long-press gesture (CDK only listens for the native `contextmenu` event),
 *   - the keyboard bindings CDK does not bind itself -- Shift+F10 and the Menu/Apps key are the
 *     Windows conventions for opening a context menu; ArrowDown (with or without Alt) is the
 *     WAI-ARIA menu-button convention and the only one of the three most Mac keyboards have,
 *   - moving focus into the menu after a programmatic (keyboard/long-press) open -- CDK's public
 *     `open()` does not do this itself; only its own native-`contextmenu` handler does,
 *   - moving focus back to the trigger after the menu closes -- on a selection, on Escape, or on
 *     an outside click that didn't land on another focusable element -- `CdkContextMenuTrigger`
 *     has no persistent anchor element of its own (unlike `CdkMenuTrigger`, a right-click can land
 *     anywhere), so nothing in CDK restores it for a context-style trigger, and
 *   - the menu content (an internal `RollOptionsMenu`, created imperatively -- see below).
 *
 * Apply directly to the interactive element that should open the picker (a `<button>`), never to
 * a wrapping element: that element's accessible name is what a screen reader announces, and its
 * own `click` handling is what long-press must suppress a spurious extra activation of.
 *
 * @example
 * <button appRollOptions (rollOptionSelected)="onRoll($event)">Agility +2</button>
 */
@Directive({
  selector: '[appRollOptions]',
  hostDirectives: [CdkContextMenuTrigger],
  host: {
    'aria-haspopup': 'menu',
    '[attr.aria-expanded]': 'ariaExpanded()',
    // Suppresses the mobile browser's own long-press handling (text-selection callout, and on
    // some platforms a native context menu) so it doesn't race our long-press timer. Needs
    // verification on a real touch device -- JSDOM cannot exercise either behavior.
    '[style.touch-action]': "'none'",
    '[style.-webkit-touch-callout]': "'none'",
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerCancel($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class RollOptionsDirective implements OnDestroy {
  readonly rollOptionSelected = output<RollOption>();

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly contextMenuTrigger = inject(CdkContextMenuTrigger);
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlayContainer = inject(OverlayContainer);
  private readonly menuContentRef = this.createMenuContent();

  private readonly isOpen = signal(false);
  readonly ariaExpanded = computed(() => (this.isOpen() ? 'true' : 'false'));

  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressOpened = false;
  private pointerStart: { x: number; y: number } | null = null;
  /** Scopes an in-progress long-press to the pointer that started it, so a second concurrent
   *  touch can't cancel or restart a gesture the first one is already mid-way through. */
  private activePointerId: number | null = null;

  constructor() {
    this.contextMenuTrigger.opened.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isOpen.set(true);
      // Close whichever other instance was open -- covers all three open paths uniformly (this
      // fires for the native contextmenu path too), and is a safe no-op if CDK's own tracker, or
      // a plain Escape/outside-click, already closed it.
      if (openInstance && openInstance !== this) {
        openInstance.contextMenuTrigger.close();
      }
      setOpenInstance(this);
    });
    this.contextMenuTrigger.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isOpen.set(false);
      if (openInstance === this) {
        openInstance = null;
      }
      // A selection already moved focus back to the trigger itself (see optionSelected.subscribe
      // below), so by the time this runs `document.activeElement` is already the trigger and this
      // is a no-op. On Escape, or an outside click that didn't land on another focusable element,
      // nothing in CDK restores focus for a context-style trigger (see the class doc comment), and
      // focus is otherwise about to be stranded -- move it back to the trigger. If the outside
      // click landed on something focusable instead, that element is already `document.activeElement`
      // by now (native focus-on-click runs before this listener), so this deliberately leaves it
      // there rather than stealing focus back.
      //
      // This check runs synchronously, in the same tick that closed the menu -- `overlayRef.detach()`
      // (which is what would otherwise fall focus back to <body>) hasn't run yet at this point, so
      // a still-focused, not-yet-detached menu item reads as `[data-roll-options-item]`, not <body>.
      // Only one roll-options menu can be open app-wide (see `openInstance` above), so matching the
      // item selector can't false-positive on some unrelated overlay's own focused control.
      const activeElement = document.activeElement;
      const focusIsStranded =
        activeElement === document.body || activeElement?.matches('[data-roll-options-item]');
      if (focusIsStranded) {
        this.elementRef.nativeElement.focus();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearLongPressTimer();
    // Guards against a stale reference if this instance is destroyed while its own menu is open
    // (e.g. navigating away mid-press) rather than via a normal close.
    if (openInstance === this) {
      openInstance = null;
    }
    this.menuContentRef.destroy();
  }

  onPointerDown(event: PointerEvent): void {
    // Right mouse button opens via the native `contextmenu` event CDK already listens for; don't
    // also race it with a long-press timer on the same press. Ignore a second concurrent pointer
    // while one gesture is already in progress.
    if (event.button !== 0 || this.activePointerId !== null) return;
    this.activePointerId = event.pointerId;
    this.pointerStart = { x: event.clientX, y: event.clientY };
    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      this.longPressOpened = true;
      this.openMenuAt({ x: event.clientX, y: event.clientY });
    }, LONG_PRESS_MS);
  }

  onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId || !this.pointerStart) return;
    const dx = event.clientX - this.pointerStart.x;
    const dy = event.clientY - this.pointerStart.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD_PX) {
      // The pointer moved enough that this reads as a scroll/drag, not a hold -- never trigger.
      this.clearLongPressTimer();
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    this.clearLongPressTimer();
    this.activePointerId = null;
    this.pointerStart = null;
  }

  onPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    this.clearLongPressTimer();
    this.longPressOpened = false;
    this.activePointerId = null;
    this.pointerStart = null;
  }

  onClick(event: MouseEvent): void {
    if (!this.longPressOpened) return;
    // The pointerup that ends a long-press also synthesizes a click on the host, which would
    // otherwise double as a normal activation of the button underneath the menu.
    event.preventDefault();
    event.stopPropagation();
    this.longPressOpened = false;
  }

  onKeydown(event: KeyboardEvent): void {
    // CdkContextMenuTrigger only listens for the native `contextmenu` event, which pointer and
    // mouse right-click dispatch automatically but a keyboard-only user cannot. Shift+F10 and the
    // Menu/Apps key are the Windows conventions; ArrowDown (checked without regard to Alt, since
    // Alt+ArrowDown is still `key === 'ArrowDown'`) is the WAI-ARIA menu-button convention and the
    // one that works on a Mac keyboard, which has neither of the other two.
    const opensMenu =
      event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey) || event.key === 'ArrowDown';
    if (!opensMenu) return;
    event.preventDefault();
    const { left, bottom } = this.elementRef.nativeElement.getBoundingClientRect();
    this.openMenuAt({ x: left, y: bottom });
  }

  /**
   * `CdkContextMenuTrigger.open()` does not move focus into the menu -- only its own
   * native-`contextmenu` handler does that (and `childMenu`, which holds the rendered `Menu`, is
   * `protected` -- not reachable from outside CDK's own class hierarchy). Every programmatic open
   * (keyboard, long-press) needs to move focus in itself, or the menu is visually open but arrow
   * keys/typeahead/Enter do nothing. `open()` attaches the menu to the overlay synchronously, so
   * the first item is already in the DOM by the time this returns.
   */
  private openMenuAt(coordinates: { x: number; y: number }): void {
    this.contextMenuTrigger.open(coordinates);
    this.overlayContainer.getContainerElement().querySelector<HTMLElement>('[data-roll-options-item]')?.focus();
  }

  private createMenuContent() {
    const ref = this.viewContainerRef.createComponent(RollOptionsMenu);
    // RollOptionsMenu's entire template is an <ng-template>, which Angular does not render to the
    // DOM on its own -- resolving its viewChild needs one change-detection pass first.
    ref.changeDetectorRef.detectChanges();
    this.contextMenuTrigger.menuTemplateRef = ref.instance.menuTemplateRef();
    // OutputEmitterRef.subscribe() ties its own listener to the emitting component's destroy
    // lifecycle (unlike a plain RxJS Observable), so this needs no separate teardown beyond
    // destroying `ref` itself, which ngOnDestroy already does.
    ref.instance.optionSelected.subscribe((option) => {
      // No manual `.close()` here: `CdkMenuItem.trigger()` (which just ran, synchronously, to
      // get here) already calls `menuStack.closeAll({ focusParentTrigger: true })` right after
      // this listener returns. Closing a second time here was worse than redundant -- it ran
      // FIRST, with no `focusParentTrigger`, so the menu was already empty by the time CDK's own
      // close ran, and the true close silently no-opped. `CdkContextMenuTrigger` has no anchor
      // element of its own to restore focus to even when `focusParentTrigger` does take effect,
      // so we still have to move focus back to the trigger ourselves.
      this.rollOptionSelected.emit(option);
      this.elementRef.nativeElement.focus();
    });
    return ref;
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
}
