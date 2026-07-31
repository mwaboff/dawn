import { Type } from '@angular/core';

/**
 * Shared contract for the GM screen panel dashboard. Both the public `/gm-screen` page and the
 * campaign `/campaign/:id/gm-screen` page render `GmPanelDef[]` through the same grid component,
 * so this file is the single place a panel's shape is defined.
 *
 * Treat this file as frozen: the layout engine, the static content registry and the campaign
 * panels are all authored against it in parallel.
 */

/**
 * How many grid columns a panel occupies. Steps down as columns run out and collapses to 1 below
 * the mobile breakpoint, all via CSS -- see `gm-panel-grid.css`.
 */
export type PanelColSpan = 1 | 2 | 3;

/**
 * The section a panel is filed under. Sections are rendered in `PANEL_CATEGORY_ORDER` order with a
 * heading above each, and a panel can only be dragged within its own section -- grouping and free
 * reordering cannot both be authoritative, and grouping is what makes 24 panels legible.
 */
export type PanelCategory =
  | 'This Campaign'
  | 'Rolls & Resolution'
  | 'Combat'
  | 'Conditions & Resources'
  | 'GM Moves'
  | 'Hazards & Death'
  | 'Downtime'
  | 'Tables';

export const PANEL_CATEGORY_ORDER: readonly PanelCategory[] = [
  'This Campaign',
  'Rolls & Resolution',
  'Combat',
  'Conditions & Resources',
  'GM Moves',
  'Hazards & Death',
  'Downtime',
  'Tables',
];

/**
 * The renderable primitives a static reference panel is built from. Deliberately a small closed
 * set: the filter box flattens these to plain text, so anything not expressible here would be
 * invisible to search.
 */
export type GmContentBlock =
  | { kind: 'text'; paragraphs: readonly string[] }
  | { kind: 'list'; ordered?: boolean; items: readonly string[] }
  | {
      kind: 'keyValue';
      /** `example` renders as an indented aside under `value` -- a worked case, not more rule. */
      entries: readonly { key: string; value: string; example?: string }[];
    }
  | { kind: 'table'; headers: readonly string[]; rows: readonly (readonly string[])[]; dense?: boolean }
  | { kind: 'steps'; items: readonly { label: string; detail?: string }[] }
  | { kind: 'callout'; tone: 'hope' | 'fear' | 'neutral'; text: string };

/**
 * A panel is either pure data (rules reference) or a component (campaign tools).
 *
 * Component bodies are instantiated with `NgComponentOutlet` using the host view's injector, so a
 * campaign panel can simply `inject(GmScreenContext)` and resolve the instance provided by the
 * campaign page shell. The public page never provides that token and never lists these panels.
 */
export type GmPanelBody =
  | { kind: 'static'; blocks: readonly GmContentBlock[] }
  | { kind: 'component'; component: Type<unknown> };

export interface GmPanelDef {
  /** Stable identifier. Used as the localStorage order key and the panel's DOM id. Never rename. */
  readonly id: string;
  readonly title: string;
  readonly category: PanelCategory;
  readonly colSpan: PanelColSpan;
  /**
   * Sort weight when the user has no stored order, and the anchor used to slot a newly shipped
   * panel into an existing stored order. Reference panels use 10, 20, 30...; campaign panels use
   * negatives so they sort above the reference on first load.
   */
  readonly defaultOrder: number;
  readonly body: GmPanelBody;
  /** Extra filter terms that do not appear in the rendered text (synonyms, page references). */
  readonly keywords?: readonly string[];
  readonly defaultCollapsed?: boolean;
}
