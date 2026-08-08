import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';

/**
 * Which accent the group's heading and count chip take. Every value but `neutral` matches a
 * `data-card-type` in shared/styles/card-accents.css, so a single-type group's heading and the
 * cards underneath it always agree on hue. `neutral` is for a group holding more than one card
 * type (Class & Subclass, Ancestry & Community): it reads the page's own gold instead of
 * borrowing one member's hue and implying the whole group is that type.
 */
export type CardGroupAccent =
  | 'neutral'
  | 'domain'
  | 'beastform'
  | 'martialStance'
  | 'transformation'
  | 'companion';

/** Ids must be unique per instance, not per `sectionId` -- two sheets side by side (or a panel
 * rendered twice) would otherwise emit the same `aria-controls` target. Same bug class
 * `EntityCard` and `BeastformSectionBeta` already guard against. */
let nextInstanceId = 0;

/**
 * A `.card-group` whose heading is a disclosure toggle -- the beta sheet's answer to running out of
 * vertical space. Owns the heading row markup (previously hand-inlined per group), so the per-type
 * accent colours had to move here with it: view encapsulation means the sheet's and the panels'
 * stylesheets can no longer reach a heading that lives in this component's template.
 *
 * Collapse state is per-visit and deliberately not persisted; `collapsedByDefault` is the only
 * thing that decides where a group starts on load.
 */
@Component({
  selector: 'app-collapsible-card-group',
  templateUrl: './collapsible-card-group.html',
  styleUrl: './collapsible-card-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card-group' },
})
export class CollapsibleCardGroup {
  readonly heading = input.required<string>();
  readonly accent = input.required<CardGroupAccent>();
  /** Short slug used to build a stable, unique `aria-controls`/body id, e.g. "vault". */
  readonly sectionId = input.required<string>();
  /** Optional chip beside the heading -- 3 or "1/5". Stays visible while the group is collapsed,
   * so a collapsed group still says how much it is hiding. */
  readonly count = input<string | number>();
  readonly collapsedByDefault = input(false);

  readonly collapsed = linkedSignal(() => this.collapsedByDefault());

  private readonly instanceId = nextInstanceId++;

  /** The slug stays in the id purely so it is readable in the DOM inspector; uniqueness is the
   * counter's job. */
  readonly bodyId = computed(() => `card-group-${this.sectionId()}-${this.instanceId}-body`);

  toggle(): void {
    this.collapsed.update(collapsed => !collapsed);
  }
}
