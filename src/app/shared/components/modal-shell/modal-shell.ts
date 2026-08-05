import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ModalFocusDirective } from '../../directives/modal-focus.directive';

let nextTitleId = 0;

/**
 * Shared dialog shell: backdrop, panel, title, focus trap/restore (via `appModalFocus`), and
 * backdrop-click/Escape dismissal. Consumers project their body into `[modal-body]` and their
 * action buttons into `[modal-actions]` (see `modal-shell.html`); both are plain attribute
 * selectors, so any top-level projected element/`ng-container` carrying the attribute qualifies.
 *
 * `surface` picks which palette the panel is drawn on. `'parchment'` is the light dialog the
 * creation and level-up wizards sit on; `'sheet'` is the dark one, for a dialog opened from the
 * character sheet -- the same surface the shared form controls are themed for.
 */
@Component({
  selector: 'app-modal-shell',
  imports: [ModalFocusDirective],
  templateUrl: './modal-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalShell {
  readonly title = input.required<string>();
  readonly processing = input(false);
  readonly surface = input<'parchment' | 'sheet'>('parchment');

  readonly dismissed = output<void>();

  protected readonly titleId = `modal-shell-title-${nextTitleId++}`;

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.dismiss();
    }
  }

  onEscape(): void {
    this.dismiss();
  }

  private dismiss(): void {
    if (!this.processing()) {
      this.dismissed.emit();
    }
  }
}
