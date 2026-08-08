import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormatTextPipe } from '../../pipes/format-text.pipe';
import { CARD_TYPE_LABELS } from '../daggerheart-card/daggerheart-card.model';
import { EntityCardData, EntityCardSize } from './entity-card.model';

/**
 * One card face for every Daggerheart entity the app shows -- class, subclass, ancestry, community,
 * domain card, companion, beastform, stance, transformation. Callers map their view model onto
 * `EntityCardData` instead of this growing a branch per source, and project their own controls into
 * the `[card-controls]` / `[card-actions]` slots when a card needs to be interactive. Both slots
 * render outside the clipped body, so a companion's stress tracker is never visually hidden.
 *
 * Sizing is the reason this exists. In a grid, one long card used to stretch the row and leave its
 * neighbours floating in whitespace, so `normal` clips the body to a fixed height and `expanded`
 * lifts that cap and scrolls internally -- either way the card's outer height is bounded and the
 * cards beside it stay aligned. `compact` drops to a single scannable row.
 */
@Component({
  selector: 'app-entity-card',
  imports: [FormatTextPipe, NgTemplateOutlet],
  templateUrl: './entity-card.html',
  styleUrl: './entity-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-card-type]': 'card().cardType',
    '[class.entity-card--muted]': 'muted()',
  },
})
export class EntityCard {
  readonly card = input.required<EntityCardData>();
  /** The height the card rests at. The disclosure toggle moves it between this and `expanded`. */
  readonly size = input<EntityCardSize>('normal');
  /** Dims read-only content for an inactive card -- a vaulted domain card. Never dims a control. */
  readonly muted = input(false);
  /**
   * Heading level for the card name, so the card slots into its host page's outline instead of
   * hard-coding one. Card groups head their section with an `h3`, hence the default.
   */
  readonly headingLevel = input<2 | 3 | 4 | 5>(4);

  readonly sizeChange = output<EntityCardSize>();

  private readonly clip = viewChild<ElementRef<HTMLElement>>('clip');

  /** Resets whenever the caller changes the resting size, so a controlled size input still wins. */
  private readonly isExpanded = linkedSignal(() => this.size() === 'expanded');

  /**
   * Whether the body is taller than the `normal` clip, i.e. whether there is anything to reveal.
   * `protected`, not `private` -- the fade overlay and `showToggle` read it from the template,
   * and `strictTemplates` rejects a `private` member there.
   */
  protected readonly overflows = signal(false);

  readonly displaySize = computed<EntityCardSize>(() => {
    if (this.isExpanded()) return 'expanded';
    // An `expanded` input that the user has collapsed rests at `normal` -- there is no way back to
    // "expanded by default" once collapsed, and collapsing to `compact` would hide more than asked.
    return this.size() === 'expanded' ? 'normal' : this.size();
  });

  readonly typeLabel = computed(() => this.card().eyebrow ?? CARD_TYPE_LABELS[this.card().cardType]);

  /**
   * Ids are per-source-table (a domain card, a companion, and a beastform can all be database id
   * 3), so the id alone collides across types -- the type qualifies it.
   */
  readonly bodyId = computed(() => `entity-card-body-${this.card().cardType}-${this.card().id}`);

  /**
   * A `compact` card always has more to show, and an expanded one always has something to collapse.
   * At `normal` the toggle only appears once the body actually overflows, so a short card doesn't
   * offer to reveal nothing.
   */
  readonly showToggle = computed(() => this.displaySize() !== 'normal' || this.overflows());

  readonly toggleLabel = computed(() => (this.isExpanded() ? 'Collapse' : 'Expand'));

  constructor() {
    effect((onCleanup) => {
      const el = this.clip()?.nativeElement;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const measure = () => this.overflows.set(el.scrollHeight - el.clientHeight > 1);
      // Observes the scrolling box and its content: the box for viewport/density changes, the
      // content because feature text arrives after the first paint on a lazily-loaded catalog.
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      if (el.firstElementChild) observer.observe(el.firstElementChild);
      measure();
      onCleanup(() => observer.disconnect());
    });
  }

  toggle(): void {
    this.isExpanded.update((expanded) => !expanded);
    this.sizeChange.emit(this.displaySize());
  }
}
