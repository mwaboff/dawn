import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

/**
 * Presentational toggle + status line for a GM-controlled per-character grant (Transformation,
 * Companions, ...). Dumb by design: it only renders `enabled`/`statusText` and emits `toggled` --
 * callers own what "on"/"off" means for their grant and any extra fields (e.g. Transformation's
 * card picker) that sit alongside it. `--grant-toggle-accent` (default `--color-accent`) lets a
 * consumer retint the button, e.g. to `--color-card-companion`.
 */
@Component({
  selector: 'app-campaign-character-grant-toggle',
  templateUrl: './campaign-character-grant-toggle.html',
  styleUrl: './campaign-character-grant-toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignCharacterGrantToggle {
  readonly enabled = input.required<boolean>();
  readonly label = input.required<string>();
  readonly statusText = input.required<string>();
  readonly saving = input(false);

  readonly toggled = output<void>();

  readonly toggleLabel = computed(() => (this.enabled() ? 'Turn off' : 'Turn on'));
  readonly toggleAriaLabel = computed(() => `${this.toggleLabel()} ${this.label()}`);

  onToggle(): void {
    this.toggled.emit();
  }
}
