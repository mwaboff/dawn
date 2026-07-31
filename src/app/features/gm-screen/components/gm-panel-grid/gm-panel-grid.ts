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
  viewChild,
} from '@angular/core';
import { NgComponentOutlet, isPlatformBrowser } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { GmPanelDef } from '../../models/gm-panel.model';
import { MasonryGridDirective } from '../../layout/masonry-grid.directive';
import { MasonryItemDirective } from '../../layout/masonry-item.directive';
import { PanelLayoutStore, createPanelLayoutStore } from '../../layout/panel-layout.store';
import { matchesFilter } from '../../layout/panel-search.util';
import { GmPanelBlocks } from '../gm-panel-blocks/gm-panel-blocks';

const NARROW_QUERY = '(max-width: 700px)';

/**
 * The panel board shared by the public and campaign GM screens: filtering, drag-to-reorder,
 * collapse and masonry, all driven from a `GmPanelDef[]` and a localStorage key.
 */
@Component({
  selector: 'app-gm-panel-grid',
  templateUrl: './gm-panel-grid.html',
  styleUrls: ['./gm-panel-grid.css', './gm-panel-grid-controls.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgComponentOutlet,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    MasonryGridDirective,
    MasonryItemDirective,
    GmPanelBlocks,
  ],
})
export class GmPanelGrid {
  readonly panels = input.required<readonly GmPanelDef[]>();
  /** Middle part of the storage keys, e.g. `gm-screen`. Must not change after first render. */
  readonly storageKey = input.required<string>();

  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly masonry = viewChild.required(MasonryGridDirective);

  readonly filter = signal('');
  readonly isFiltering = computed(() => this.filter().trim().length > 0);

  /** Single source of truth for the mobile breakpoint: disables both masonry and drag. */
  readonly isNarrow = signal(false);

  // Required inputs cannot be read during construction, so the store is built on first use --
  // which is the first template read, by which time inputs are set.
  private storeRef: PanelLayoutStore | null = null;

  readonly orderedPanels = computed(() => this.store.orderedPanels());
  readonly collapsedIds = computed(() => this.store.collapsed());

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

  isCollapsed(panel: GmPanelDef): boolean {
    return this.collapsedIds().has(panel.id);
  }

  /**
   * `until-found` rather than `@if` so Chromium's find-in-page can reveal collapsed content.
   * An active filter forces every panel open so matches are never hidden behind a chevron.
   */
  bodyHidden(panel: GmPanelDef): 'until-found' | null {
    return this.isCollapsed(panel) && !this.isFiltering() ? 'until-found' : null;
  }

  toggleCollapsed(panel: GmPanelDef): void {
    this.store.toggleCollapsed(panel.id);
  }

  /** Chromium auto-expands on a find-in-page hit; sync state so the chevron does not lie. */
  onBeforeMatch(panel: GmPanelDef): void {
    this.store.setCollapsed(panel.id, false);
  }

  setAllCollapsed(collapsed: boolean): void {
    this.store.setAllCollapsed(collapsed);
  }

  onFilterInput(event: Event): void {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  clearFilter(): void {
    this.filter.set('');
  }

  moveBy(index: number, delta: number): void {
    this.store.move(index, index + delta);
    this.remeasure();
  }

  /**
   * Drag is disabled while filtering, so the CDK indices are indices into the full list and need
   * no remapping.
   */
  onDrop(event: CdkDragDrop<unknown>): void {
    this.store.move(event.previousIndex, event.currentIndex);
    this.remeasure();
  }

  /** `track p.id` moves nodes rather than recreating them, but the column each lands in changes. */
  private remeasure(): void {
    afterNextRender(() => this.masonry().recalcAll(), { injector: this.injector });
  }
}
