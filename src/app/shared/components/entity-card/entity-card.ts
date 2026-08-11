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
    // Lets the stylesheet reach the two slot elements, which are template nodes here rather than
    // projected ones, and tighten their padding when the card is drawn as a single row.
    '[class.entity-card--compact]': "displaySize() === 'compact'",
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

  /**
   * The one secondary line a `compact` row has room for, as `subtitle · headline`.
   *
   * It carries both because the two answer different questions and a roster needs both at a glance:
   * `subtitle` is what the thing IS ("Bruiser", "Exploration", "Physical") and `headline` is its one
   * loudest number ("Difficulty 14", "2d8+1 phy", "Score 3"). Compact used to render `headline`
   * alone, which left the encounter builder's adversary and environment rows with no way to say
   * which of seven adversary types or four environment types they were without being expanded.
   * Joined with the same `·` the domain-card subtitle already uses for "Valor · Spell", so the
   * separator means the same thing here as everywhere else on the card.
   */
  readonly compactLine = computed(() => {
    const { subtitle, headline, badges } = this.card();
    // The power-level scalar, as TEXT rather than as a chip. `EntityCardData`'s slot contract puts
    // it first and it is the only badge carrying a `value`, which is what distinguishes it from a
    // state chip like `Equipped`. Rendering it as a chip instead was measurably wrong: a chip is
    // ~60px of unshrinkable width, and tab + title + chip + chevron overflows a 19rem card, so
    // every environment and adversary row in the encounter builder wrapped to two lines -- and the
    // width the chip took came out of the name, which then broke mid-word ("ABANDON/ED GROVE")
    // because `.entity-card__name` carries `overflow-wrap: anywhere`. In the text line the tier
    // costs nothing unshrinkable and ellipsises with everything else.
    const scalar = badges?.[0];
    const tier = scalar?.value ? `${scalar.label} ${scalar.value}` : undefined;
    return [tier, subtitle, headline].filter(Boolean).join(' · ') || undefined;
  });

  /**
   * No chips at `compact` -- see `compactLine`, which carries the scalar as text instead. Live state
   * and the homebrew chip wait for the expand, where there is width for them.
   */
  readonly headerBadges = computed(() =>
    this.displaySize() === 'compact' ? [] : this.card().badges ?? [],
  );

  /**
   * A `compact` card renders no body, so its secondary line -- the type, the damage line, the armor
   * score -- exists only in the header, where `aria-label` would otherwise override it away. Folding
   * it into the label is what lets a screen-reader user compare two collapsed rows without opening
   * both. The badge is left out: it renders as real text beside the name, so it is already read.
   */
  readonly headerLabel = computed(() => {
    const label = `${this.toggleLabel()} ${this.card().name}`;
    const line = this.compactLine();
    return this.displaySize() === 'compact' && line ? `${label}, ${line}` : label;
  });

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
