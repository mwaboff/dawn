import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { SunMoonGlyph } from './components/sun-moon-glyph/sun-moon-glyph';
import { RestModal } from './rest-modal';
import { RestApplyResult, RestCharacterState, RestMoveAccess, RestOutcome } from './models/rest.model';

/**
 * The Rest affordance in the beta sheet header: the button, and the modal it opens. The beta
 * template mounts this one element, so removing the feature is deleting this directory and one
 * block of markup.
 *
 * Holds open/closed and nothing else. The rest itself lives in `RestModal`, and the save lives on
 * `CharacterSheetBeta`, which is the only thing that can reach the sheet's override signals.
 */
@Component({
  selector: 'app-rest-control',
  imports: [SunMoonGlyph, RestModal],
  templateUrl: './rest-control.html',
  styleUrl: './rest-control.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestControl {
  /** Null until the sheet has loaded; the button does not render against a half-loaded sheet. */
  readonly state = input.required<RestCharacterState | null>();
  readonly access = input.required<RestMoveAccess>();
  /** True while the rest's PUT is in flight. */
  readonly processing = input(false);
  readonly applyResult = input<RestApplyResult | null>(null);

  readonly submitted = output<RestOutcome>();
  /** Fired when the dialog closes, so the host can clear its `applyResult`. */
  readonly closed = output<void>();

  protected readonly open = signal(false);

  protected onOpen(): void {
    this.open.set(true);
  }

  protected onClose(): void {
    if (this.processing()) return;
    this.open.set(false);
    this.closed.emit();
  }
}
