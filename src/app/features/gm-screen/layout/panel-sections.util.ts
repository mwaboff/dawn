import { GmPanelDef, PANEL_CATEGORY_ORDER, PanelCategory } from '../models/gm-panel.model';

export interface PanelSection {
  readonly category: PanelCategory;
  readonly panels: readonly GmPanelDef[];
  /**
   * Where each of `panels` sits in the flat ordered list the layout store persists. Reordering
   * inside a section is expressed as a move between two of these, so the store never needs to know
   * sections exist.
   */
  readonly indices: readonly number[];
}

/**
 * Buckets the flat ordered panel list into rendered sections.
 *
 * Order within a section follows the flat list, so drag-to-reorder still works; order *of* the
 * sections is fixed by `PANEL_CATEGORY_ORDER` rather than by the panels, because a section whose
 * position shifted every time a panel moved would defeat the point of grouping. Empty categories
 * are dropped -- the public GM screen has no `This Campaign` panels.
 */
export function groupIntoSections(panels: readonly GmPanelDef[]): readonly PanelSection[] {
  const buckets = new Map<PanelCategory, { panels: GmPanelDef[]; indices: number[] }>();

  panels.forEach((panel, index) => {
    let bucket = buckets.get(panel.category);
    if (!bucket) {
      bucket = { panels: [], indices: [] };
      buckets.set(panel.category, bucket);
    }
    bucket.panels.push(panel);
    bucket.indices.push(index);
  });

  return PANEL_CATEGORY_ORDER.filter(category => buckets.has(category)).map(category => {
    const bucket = buckets.get(category)!;
    return { category, panels: bucket.panels, indices: bucket.indices };
  });
}
