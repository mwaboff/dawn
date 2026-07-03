import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { ItemRoster } from './item-roster';
import { CreatedItemSummary } from '../../models/created-item.model';

function buildItems(): CreatedItemSummary[] {
  return [
    {
      id: 1, itemType: 'weapon', name: 'Custom Blade', tier: 1,
      trait: 'STRENGTH', range: 'MELEE', burden: 'ONE_HANDED', damageNotation: '1d8',
      features: [{ name: 'Reach', description: 'Extends range.' }],
    },
    {
      id: 2, itemType: 'armor', name: 'Custom Plate', tier: 2,
      baseScore: 3, baseMajorThreshold: 8, baseSevereThreshold: 16,
    },
    {
      id: 3, itemType: 'loot', name: 'Custom Elixir', tier: 1,
      description: 'Restores hope.', isConsumable: true,
    },
  ];
}

describe('ItemRoster', () => {
  let component: ItemRoster;
  let fixture: ComponentFixture<ItemRoster>;

  function setup(overrides: Partial<{ items: CreatedItemSummary[]; loading: boolean; error: boolean; canEdit: boolean; creatorId: number | null }> = {}) {
    TestBed.configureTestingModule({
      imports: [ItemRoster],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(ItemRoster);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', overrides.items ?? buildItems());
    fixture.componentRef.setInput('loading', overrides.loading ?? false);
    fixture.componentRef.setInput('error', overrides.error ?? false);
    fixture.componentRef.setInput('canEdit', overrides.canEdit ?? false);
    fixture.componentRef.setInput('creatorId', overrides.creatorId ?? 42);
    fixture.detectChanges();
  }

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('should show the empty state when there are no items', () => {
    setup({ items: [] });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.roster-empty-text')?.textContent).toContain('No created items yet');
  });

  it('should show an error message when error is true', () => {
    setup({ error: true });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.roster-message')).toBeTruthy();
  });

  it('should show loading skeletons when loading is true', () => {
    setup({ loading: true });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.roster-skeleton').length).toBeGreaterThan(0);
  });

  it('should render a group for each item type present', () => {
    setup();
    const el = fixture.nativeElement as HTMLElement;
    const titles = Array.from(el.querySelectorAll('.item-roster-group-title')).map(n => n.textContent);
    expect(titles).toEqual(['Weapons', 'Armor', 'Loot']);
  });

  it('should not render a group for an item type with no items', () => {
    setup({ items: buildItems().filter(i => i.itemType !== 'armor') });
    const el = fixture.nativeElement as HTMLElement;
    const titles = Array.from(el.querySelectorAll('.item-roster-group-title')).map(n => n.textContent);
    expect(titles).not.toContain('Armor');
  });

  it('should not expand a row by default', () => {
    setup();
    expect(component.isExpanded(buildItems()[0])).toBe(false);
  });

  it('should expand a row on toggle and set aria-expanded', () => {
    setup();
    const item = buildItems()[0];
    component.toggleExpanded(item);
    fixture.detectChanges();

    expect(component.isExpanded(item)).toBe(true);
    const header = fixture.nativeElement.querySelector('.item-roster-entry-header') as HTMLElement;
    expect(header.getAttribute('aria-expanded')).toBe('true');
  });

  it('should collapse an expanded row on second toggle', () => {
    setup();
    const item = buildItems()[0];
    component.toggleExpanded(item);
    component.toggleExpanded(item);
    expect(component.isExpanded(item)).toBe(false);
  });

  it('should render weapon details when expanded', () => {
    setup();
    component.toggleExpanded(buildItems()[0]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('1d8');
    expect(el.textContent).toContain('Reach');
    expect(el.textContent).toContain('Extends range.');
  });

  it('should render loot details when expanded', () => {
    setup();
    component.toggleExpanded(buildItems()[2]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Restores hope.');
    expect(el.textContent).toContain('Yes');
  });

  it('should not show the edit button when canEdit is false', () => {
    setup({ canEdit: false });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.item-roster-edit-btn')).toBeNull();
  });

  it('should show the edit button when canEdit is true', () => {
    setup({ canEdit: true });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.item-roster-edit-btn').length).toBe(3);
  });

  it('should emit editItem with itemType and id when the edit button is clicked', () => {
    setup({ canEdit: true });
    let emitted: { itemType: string; id: number } | undefined;
    component.editItem.subscribe(e => (emitted = e));

    const btn = fixture.nativeElement.querySelector('.item-roster-edit-btn') as HTMLButtonElement;
    btn.click();

    expect(emitted).toEqual({ itemType: 'weapon', id: 1 });
  });

  it('should not toggle row expansion when the edit button is clicked', () => {
    setup({ canEdit: true });
    const btn = fixture.nativeElement.querySelector('.item-roster-edit-btn') as HTMLButtonElement;
    btn.click();

    expect(component.isExpanded(buildItems()[0])).toBe(false);
  });

  it('should build the codex link query params from creatorId', () => {
    setup({ creatorId: 7 });
    expect(component.codexQueryParams()).toEqual({ filters: JSON.stringify({ creatorId: 7 }) });
  });
});
