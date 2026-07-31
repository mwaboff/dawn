import { Type } from '@angular/core';

/**
 * Shared contract for the GM screen panel dashboard. Both the public `/gm-screen` page and the
 * campaign `/campaign/:id/gm-screen` page render `GmPanelDef[]` through the same grid component,
 * so this file is the single place a panel's shape is defined.
 *
 * Treat this file as frozen: the layout engine, the static content registry and the campaign
 * panels are all authored against it in parallel.
 */

/** How many grid columns a panel occupies. Collapses to 1 below the mobile breakpoint via CSS. */
export type PanelColSpan = 1 | 2;

/**
 * The renderable primitives a static reference panel is built from. Deliberately a small closed
 * set: the filter box flattens these to plain text, so anything not expressible here would be
 * invisible to search.
 */
export type GmContentBlock =
  | { kind: 'text'; paragraphs: readonly string[] }
  | { kind: 'list'; ordered?: boolean; items: readonly string[] }
  | { kind: 'keyValue'; entries: readonly { key: string; value: string }[] }
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
