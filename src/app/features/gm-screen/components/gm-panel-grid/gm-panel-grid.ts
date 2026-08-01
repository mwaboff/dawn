import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { GmPanelDef } from '../../models/gm-panel.model';
import { MasonryGridDirective } from '../../layout/masonry-grid.directive';
import { MasonryItemDirective } from '../../layout/masonry-item.directive';
import { PanelLayoutStore, createPanelLayoutStore } from '../../layout/panel-layout.store';
import { PanelSection, groupIntoSections } from '../../layout/panel-sections.util';
import { matchesFilter } from '../../layout/panel-search.util';
import { GmBoardControls } from '../gm-board-controls/gm-board-controls';
import { GmPanelCard } from '../gm-panel-card/gm-panel-card';

const NARROW_QUERY = '(max-width: 700px)';

/**
 * The panel board shared by the public and campaign GM screens: filtering, sectioning,
 * drag-to-reorder, collapse and masonry, all driven from a `GmPanelDef[]` and a localStorage key.
 */
@Component({
  selector: 'app-gm-panel-grid',
  templateUrl: './gm-panel-grid.html',
  styleUrls: ['./gm-panel-grid.css', './gm-panel-grid-controls.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkDropList,
    CdkDrag,
    MasonryGridDirective,
    MasonryItemDirective,
    GmBoardControls,
    GmPanelCard,
  ],
})
export class GmPanelGrid {
  readonly panels = input.required<readonly GmPanelDef[]>();
  /** Middle part of the storage keys, e.g. `gm-screen`. Must not change after first render. */
  readonly storageKey = input.required<string>();

  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly masonry = viewChildren(MasonryGridDirective);

  readonly filter = signal('');
  readonly isFiltering = computed(() => this.filter().trim().length > 0);

  /** Single source of truth for the mobile breakpoint: disables both masonry and drag. */
  readonly isNarrow = signal(false);

  // Required inputs cannot be read during construction, so the store is built on first use --
  // which is the first template read, by which time inputs are set.
  private storeRef: PanelLayoutStore | null = null;

  readonly sections = computed(() => groupIntoSections(this.store.orderedPanels()));
  readonly collapsedIds = computed(() => this.store.collapsed());
  readonly matchCount = computed(() => this.panels().filter(p => this.matches(p)).length);

  constructor() {
    if (this.isBrowser && typeof matchMedia === 'function') {
      const mql = matchMedia(NARROW_QUERY);
      this.isNarrow.set(mql.matches);
      const onChange = (event: MediaQueryListEvent) => this.isNarrow.set(event.matches);
      mql.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => mql.removeEventListener('change', onChange));
    }
  }

  private get store(): PanelLayoutStore {
    this.storeRef ??= createPanelLayoutStore({
      storageKey: untracked(() => this.storageKey()),
      panels: this.panels,
      isBrowser: this.isBrowser,
    });
    return this.storeRef;
  }

  matches(panel: GmPanelDef): boolean {
    return matchesFilter(panel, this.filter());
  }

  /** A section with no surviving panels is hidden outright rather than left as a bare heading. */
  sectionMatches(section: PanelSection): boolean {
    return section.panels.some(p => this.matches(p));
  }

  isCollapsed(panel: GmPanelDef): boolean {
    return this.collapsedIds().has(panel.id);
  }

  isSectionCollapsed(section: PanelSection): boolean {
    return section.panels.every(p => this.isCollapsed(p));
  }

  toggleCollapsed(panel: GmPanelDef): void {
    this.store.toggleCollapsed(panel.id);
  }

  toggleSection(section: PanelSection): void {
    const collapse = !this.isSectionCollapsed(section);
    for (const panel of section.panels) this.store.setCollapsed(panel.id, collapse);
  }

  /** Chromium auto-expands on a find-in-page hit; sync state so the chevron does not lie. */
  onBeforeMatch(panel: GmPanelDef): void {
    this.store.setCollapsed(panel.id, false);
  }

  setAllCollapsed(collapsed: boolean): void {
    this.store.setAllCollapsed(collapsed);
  }

  resetLayout(): void {
    this.store.reset();
    this.remeasure();
  }

  /** Section-local indices are mapped back onto the flat order the store persists. */
  moveBy(section: PanelSection, index: number, delta: number): void {
    const target = index + delta;
    if (target < 0 || target >= section.indices.length) return;
    this.store.move(section.indices[index], section.indices[target]);
    this.remeasure();
  }

  /** Drag is disabled while filtering, so CDK indices are indices into the unfiltered section. */
  onDrop(section: PanelSection, event: CdkDragDrop<unknown>): void {
    this.store.move(section.indices[event.previousIndex], section.indices[event.currentIndex]);
    this.remeasure();
  }

  /** `track p.id` moves nodes rather than recreating them, but the column each lands in changes. */
  private remeasure(): void {
    afterNextRender(() => this.masonry().forEach(grid => grid.recalcAll()), {
      injector: this.injector,
    });
  }
}
