import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Observable, of, throwError } from 'rxjs';
import { ItemFinder } from './item-finder';
import { CatalogHit, CatalogQuery, CatalogResult, ItemCatalogService } from '../../services/item-catalog.service';
import { CatalogCardEntry } from '../../utils/catalog-card.mapper';
import { ArmorResponse } from '../../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../../shared/models/loot-api.model';
import { WeaponResponse } from '../../../../shared/models/weapon-api.model';

const DEBOUNCE = 300;

function weapon(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 1,
    name: 'Broadsword',
    tier: 1,
    isOfficial: true,
    isPrimary: true,
    trait: 'STRENGTH',
    range: 'MELEE',
    burden: 'ONE_HANDED',
    damage: { diceCount: null, diceType: 'D8', modifier: 3, damageType: 'PHYSICAL', notation: 'd8+3' },
    ...overrides,
  } as WeaponResponse;
}

function armor(overrides: Partial<ArmorResponse> = {}): ArmorResponse {
  return {
    id: 2,
    name: 'Gambeson',
    tier: 1,
    isOfficial: true,
    baseScore: 3,
    baseMajorThreshold: 5,
    baseSevereThreshold: 11,
    ...overrides,
  } as ArmorResponse;
}

function loot(overrides: Partial<LootApiResponse> = {}): LootApiResponse {
  return { id: 3, name: 'Rope', isOfficial: true, isConsumable: false, costTags: [], ...overrides };
}

/** Wraps hits in the service's result envelope; totals default to "that was everything". */
function result(hits: CatalogHit[], totals?: Record<string, number>): CatalogResult {
  const counted = new Map<string, number>();
  for (const hit of hits) counted.set(hit.type, (counted.get(hit.type) ?? 0) + 1);
  return {
    hits,
    totals: new Map(Object.entries(totals ?? Object.fromEntries(counted))) as CatalogResult['totals'],
  };
}

describe('ItemFinder', () => {
  let fixture: ComponentFixture<ItemFinder>;
  let component: ItemFinder;
  let find: ReturnType<typeof vi.fn>;
  let queries: CatalogQuery[];

  /**
   * Change detection first: the query is a computed piped through `toObservable`, so a signal set
   * directly on the component reaches the debounce only once effects have flushed. Advancing the
   * clock before that would just burn the timer on the previous value.
   */
  function settle(): void {
    fixture.detectChanges();
    vi.advanceTimersByTime(DEBOUNCE);
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  /** Every result across every group, in render order. */
  function entries(): CatalogCardEntry[] {
    return component.groups().flatMap(group => group.entries);
  }

  function type(value: string): void {
    const input = el().querySelector('input[type="search"]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    queries = [];
    find = vi.fn((query: CatalogQuery): Observable<CatalogResult> => {
      queries.push(query);
      return of(
        result([
          { type: 'weapon', item: weapon() },
          { type: 'armor', item: armor() },
          { type: 'loot', item: loot() },
        ]),
      );
    });

    await TestBed.configureTestingModule({
      imports: [ItemFinder],
      providers: [{ provide: ItemCatalogService, useValue: { find } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemFinder);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('proficiency', 2);
    fixture.componentRef.setInput('currentUserId', 42);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('offers one search field for every kind of gear', () => {
    const inputs = el().querySelectorAll('input[type="search"]');

    expect(inputs.length).toBe(1);
    // The long form lives in the label, which has room for it; the placeholder has to survive 360px.
    expect(el().querySelector('label')?.textContent).toContain('weapons, armor and loot');
  });

  it('browses all three catalogues before anything is typed', () => {
    settle();

    expect(queries[0]).toEqual({ term: '', types: ['weapon', 'armor', 'loot'], customOnly: false });
  });

  it('lists a result for every hit, whatever its type', () => {
    settle();

    expect(el().querySelectorAll('app-item-finder-result').length).toBe(3);
  });

  it('groups results under a type rule, so a mixed list says what it mixed', () => {
    settle();

    expect(component.groups().map(group => group.label)).toEqual(['Weapons', 'Armor', 'Loot']);
    expect(el().querySelectorAll('.finder__group').length).toBe(3);
  });

  it('omits a group entirely when that type returned nothing', () => {
    find.mockReturnValue(of(result([{ type: 'loot', item: loot() }])));
    settle();

    expect(component.groups().map(group => group.type)).toEqual(['loot']);
  });

  it('says how many matches it held back, rather than truncating in silence', () => {
    find.mockReturnValue(of(result([{ type: 'weapon', item: weapon() }], { weapon: 112 })));
    settle();

    expect(component.groups()[0].truncated).toBe(true);
    expect(component.groups()[0].countLabel).toBe('1 of 112');
    expect(el().textContent).toContain('narrow your search for the rest');
  });

  it('does not claim truncation when a group came back short of the cap', () => {
    settle();

    expect(component.groups().every(group => group.truncated)).toBe(false);
  });

  it('keeps the previous results on screen while the next query runs', () => {
    settle();
    type('broad');
    fixture.detectChanges();

    // Mid-flight: debounce has not fired, so the old list is still what the player is reading.
    expect(el().querySelectorAll('app-item-finder-result').length).toBe(3);
  });

  it('marks the list busy rather than replacing it during a refetch', () => {
    settle();
    find.mockReturnValue(new Observable<CatalogResult>(() => undefined));
    component.filterType.set('armor');
    fixture.detectChanges();
    vi.advanceTimersByTime(DEBOUNCE);
    fixture.detectChanges();

    const list = el().querySelector('.finder__results');
    expect(list?.getAttribute('aria-busy')).toBe('true');
    expect(el().querySelectorAll('app-item-finder-result').length).toBe(3);
  });

  it('passes the typed term through to the catalogue', () => {
    settle();
    type('broad');
    settle();

    expect(queries.at(-1)?.term).toBe('broad');
  });

  it('waits for a pause in typing rather than querying per keystroke', () => {
    settle();
    type('b');
    type('br');
    type('bro');
    settle();

    expect(queries.length).toBe(2);
  });

  it('narrows to one type when a filter chip is chosen', () => {
    settle();
    component.filterType.set('armor');
    settle();

    expect(queries.at(-1)?.types).toEqual(['armor']);
  });

  it('asks for homebrew only when the custom filter is on', () => {
    settle();
    component.customOnly.set(true);
    settle();

    expect(queries.at(-1)?.customOnly).toBe(true);
  });

  it('emits the untouched catalogue item when a result is added', () => {
    const added: { type: string; item: unknown }[] = [];
    component.itemAdded.subscribe(event => added.push(event));
    settle();

    component.onAdd(entries()[0]);

    expect(added).toEqual([{ type: 'weapon', item: expect.objectContaining({ id: 1, name: 'Broadsword' }) }]);
  });

  it('stays open after an add, so a handful of loot is a handful of clicks', () => {
    let closed = false;
    component.closed.subscribe(() => (closed = true));
    settle();

    component.onAdd(entries()[0]);
    fixture.detectChanges();

    expect(closed).toBe(false);
    expect(el().querySelectorAll('app-item-finder-result').length).toBe(3);
  });

  it('remembers what was already added this visit', () => {
    settle();
    const entry = entries()[0];

    expect(component.isAdded(entry)).toBe(false);
    component.onAdd(entry);
    expect(component.isAdded(entry)).toBe(true);
    expect(component.isAdded(entries()[1])).toBe(false);
  });

  it('announces the add, since the dialog gives no other sign of it', () => {
    settle();

    component.onAdd(entries()[0]);

    expect(component.lastAdded()).toBe('Broadsword added to inventory.');
  });

  it('announces a repeat add differently, or the live region would not fire at all', () => {
    settle();

    component.onAdd(entries()[0]);
    const first = component.lastAdded();
    component.onAdd(entries()[0]);

    expect(component.lastAdded()).not.toBe(first);
    expect(component.lastAdded()).toContain('2 so far');
  });

  it('surfaces a failed add inside the dialog, where the sheet banner cannot reach', () => {
    settle();
    fixture.componentRef.setInput('addError', 'Could not add weapon. Please try again.');
    fixture.detectChanges();

    const alert = el().querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Could not add weapon.');
  });

  it('names the search term in the empty message', () => {
    find.mockReturnValue(of(result([])));
    settle();
    type('nothing at all');
    settle();

    expect(el().textContent).toContain('No gear matches “nothing at all”.');
  });

  it('explains an empty custom-only list in terms of authorship and sharing', () => {
    find.mockReturnValue(of(result([])));
    component.customOnly.set(true);
    settle();

    expect(el().textContent).toContain('nothing shared with your campaigns');
    expect(el().textContent).toContain('nothing shared publicly');
  });

  it('says the filters are part of why an empty search is empty', () => {
    find.mockReturnValue(of(result([])));
    component.filterType.set('armor');
    settle();
    type('rope');
    settle();

    expect(el().textContent).toContain('with these filters');
  });

  it('offers a way out of an over-narrowed empty list', () => {
    find.mockReturnValue(of(result([])));
    component.filterType.set('armor');
    component.customOnly.set(true);
    settle();

    (el().querySelector('.finder__action') as HTMLButtonElement).click();

    expect(component.filterType()).toBe('all');
    expect(component.customOnly()).toBe(false);
  });

  it('offers no way out when nothing was narrowing the search to begin with', () => {
    find.mockReturnValue(of(result([])));
    settle();

    expect(el().querySelector('.finder__action')).toBeNull();
  });

  it('shows an error state instead of an empty list when the catalogue fails', () => {
    find.mockReturnValue(throwError(() => new Error('boom')));
    settle();

    expect(component.loadError()).toBe(true);
    expect(component.loading()).toBe(false);
    expect(el().textContent).toContain('Could not load gear.');
  });

  it('refetches on retry', () => {
    find.mockReturnValue(throwError(() => new Error('boom')));
    settle();
    find.mockReturnValue(of(result([{ type: 'loot', item: loot() }])));

    component.retry();
    settle();

    expect(component.loadError()).toBe(false);
    expect(el().querySelectorAll('app-item-finder-result').length).toBe(1);
  });

  it('emits the kind to create when a create link is used', () => {
    const requested: string[] = [];
    component.createRequested.subscribe(kind => requested.push(kind));
    settle();

    const links = el().querySelectorAll<HTMLButtonElement>('.finder__create-link');
    links[2].click();

    expect(requested).toEqual(['loot']);
  });

  it('closes on Done', () => {
    let closed = false;
    component.closed.subscribe(() => (closed = true));
    settle();

    (el().querySelector('.dialog-btn--cancel') as HTMLButtonElement).click();

    expect(closed).toBe(true);
  });

  it('clears the search field back to browsing everything', () => {
    settle();
    type('broad');
    settle();

    component.clearSearch();
    settle();

    expect(queries.at(-1)?.term).toBe('');
  });

  it('keeps focus in the dialog when the clear button destroys itself', () => {
    settle();
    type('broad');
    settle();

    (el().querySelector('.finder__search-clear') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(el().querySelector('input[type="search"]'));
  });

  it('keeps focus in the dialog when the retry button destroys itself', () => {
    find.mockReturnValue(throwError(() => new Error('boom')));
    settle();
    find.mockReturnValue(of(result([])));

    (el().querySelector('.finder__action') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(el().querySelector('input[type="search"]'));
  });
});
