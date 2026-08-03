import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * The minimize/expand chrome shared by the builder's Roster, Environment, and Add Adversaries
 * sections -- extracted because the three were identical but for a title and an id. Rides the
 * sheet's shared `.expandable-card` vocabulary (shared/styles/expandable-card.css). Battle Points
 * doesn't use this: it's the builder's centrepiece and stays permanently visible.
 */
@Component({
  selector: 'app-collapsible-section',
  templateUrl: './collapsible-section.html',
  styleUrl: './collapsible-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'expandable-card builder-collapsible-section' },
})
export class CollapsibleSection {
  readonly title = input.required<string>();
  /** Short slug used to build a stable, unique `aria-controls`/body id, e.g. "roster". */
  readonly sectionId = input.required<string>();
  readonly collapsed = input.required<boolean>();

  readonly toggled = output<void>();

  readonly bodyId = computed(() => `builder-${this.sectionId()}-body`);
}
