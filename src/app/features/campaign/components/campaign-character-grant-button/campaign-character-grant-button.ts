import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

/**
 * Presentational row action that discloses a `CampaignCharacterGrantToggle` drawer (Transformation,
 * Companions, ...). Owns only the button + "On" badge and the aria-expanded/aria-controls wiring;
 * stops the click from bubbling to the row's own click-to-view handler. Retint via
 * `--grant-toggle-accent` on the host (same custom property the toggle/drawer reads), e.g.
 * `--color-card-companion`.
 */
@Component({
  selector: 'app-campaign-character-grant-button',
  templateUrl: './campaign-character-grant-button.html',
  styleUrl: './campaign-character-grant-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignCharacterGrantButton {
  readonly label = input.required<string>();
  readonly on = input(false);
  readonly expanded = input(false);
  readonly controlsId = input.required<string>();

  readonly clicked = output<void>();

  onClick(event: Event): void {
    event.stopPropagation();
    this.clicked.emit();
  }
}
