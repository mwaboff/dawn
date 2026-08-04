import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * `hope` swaps the box for the diamond treatment (`.resource-box--hope` in `styles.css`);
 * `stress` tags each box `.resource-box--stress` for any future stress-specific styling hook.
 */
export type ResourceTrackerVariant = 'default' | 'hope' | 'stress';

/**
 * The HP / Stress / Hope / Armor / Focus box tracker used across the character sheet, wrapping
 * the global `.resource-row` / `.resource-box` classes in `styles.css` rather than redefining
 * them. Clicking a box marks up to it; clicking the already-marked top box unmarks it.
 */
@Component({
  selector: 'app-resource-tracker',
  templateUrl: './resource-tracker.html',
  styleUrl: './resource-tracker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceTracker {
  readonly max = input.required<number>();
  readonly marked = input.required<number>();
  /** Visible `.resource-row__label` text. Leave empty to omit the label, e.g. when a host
   * renders its own (differently styled) label alongside the tracker. */
  readonly label = input<string>('');
  readonly variant = input<ResourceTrackerVariant>('default');
  /** Prefix for a per-box `id`, so multiple trackers on one page don't collide. */
  readonly idPrefix = input<string>('');
  /** Spoken label for each box's `aria-label`; falls back to `label()` when unset. */
  readonly ariaLabel = input<string>('');
  /** Extra boxes appended after `max()`, styled with `.resource-box--companion` -- e.g. Hope
   * slots granted by a companion's `Light in the Dark` Training (`--color-card-companion`). */
  readonly bonusCount = input<number>(0);

  readonly markedChange = output<number>();

  readonly totalBoxes = computed(() => Math.max(0, this.max()) + Math.max(0, this.bonusCount()));
  readonly boxNumbers = computed(() => Array.from({ length: this.totalBoxes() }, (_, i) => i + 1));
  readonly boxAriaLabel = computed(() => this.ariaLabel() || this.label());

  toggle(index: number): void {
    const current = this.marked();
    const next = current === index ? index - 1 : index;
    this.markedChange.emit(Math.max(0, Math.min(next, this.totalBoxes())));
  }

  boxId(index: number): string | null {
    return this.idPrefix() ? `${this.idPrefix()}-${index}` : null;
  }

  isBonusBox(index: number): boolean {
    return index > this.max();
  }
}
