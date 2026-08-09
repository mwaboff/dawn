import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { CodexSearchBar, FilterChip } from './codex-search-bar';

@Component({
  template: `
    <app-codex-search-bar
      [query]="query()"
      [activeChips]="chips()"
      [placeholder]="placeholder()"
      (queryChange)="onQueryChange($event)"
      (chipRemove)="onChipRemove($event)"
    />
  `,
  imports: [CodexSearchBar],
})
class TestHost {
  query = signal('');
  chips = signal<FilterChip[]>([]);
  placeholder = signal('Search the archives…');
  lastQuery = '';
  lastRemovedChip: FilterChip | null = null;

  onQueryChange(q: string): void { this.lastQuery = q; }
  onChipRemove(chip: FilterChip): void { this.lastRemovedChip = chip; }
}

/** The component's own `debounceTime` window (codex-search-bar.ts). */
const DEBOUNCE_MS = 250;

describe('CodexSearchBar', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();

    // Installed after `compileComponents()`, which awaits real async work of its own. The debounce
    // tests drive the clock rather than sleeping on it: they used to race a real 300ms `setTimeout`
    // against this 250ms debounce, which left 50ms of margin and lost it on a loaded CI runner.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function searchInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
  }

  function typeInto(value: string): void {
    const input = searchInput();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  /** Closes the debounce window, so whatever was typed is emitted. */
  function settleDebounce(): void {
    vi.advanceTimersByTime(DEBOUNCE_MS);
    fixture.detectChanges();
  }

  it('creates the component', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-codex-search-bar')).toBeTruthy();
  });

  it('renders the search input', () => {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    expect(input).toBeTruthy();
  });

  it('renders the placeholder text', () => {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    expect(input.placeholder).toBe('Search the archives…');
  });

  it('shows a custom placeholder when provided', () => {
    host.placeholder.set('Search within weapons…');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    expect(input.placeholder).toBe('Search within weapons…');
  });

  it('holds the query until the debounce window closes', () => {
    typeInto('flame');

    // One tick short of the window: asserting the boundary, not merely "not yet".
    vi.advanceTimersByTime(DEBOUNCE_MS - 1);

    expect(host.lastQuery).toBe('');
  });

  it('emits queryChange once the debounce settles', () => {
    typeInto('flame');

    settleDebounce();

    expect(host.lastQuery).toBe('flame');
  });

  it('emits only the last keystroke of a burst, which is what the debounce is for', () => {
    const emitted: string[] = [];
    host.onQueryChange = (q: string) => emitted.push(q);

    typeInto('f');
    vi.advanceTimersByTime(50);
    typeInto('fl');
    vi.advanceTimersByTime(50);
    typeInto('flame');
    settleDebounce();

    expect(emitted).toEqual(['flame']);
  });

  it('clears the query and emits an empty string on Escape', () => {
    typeInto('flame');
    settleDebounce();
    expect(host.lastQuery).toBe('flame');

    searchInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    // Escape emits synchronously rather than through the debounce -- clearing is a decision the
    // user has already made, so there is nothing to wait for.
    expect(host.lastQuery).toBe('');
  });

  it('does not let the debounced value arrive after Escape and undo the clear', () => {
    typeInto('flame');
    searchInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    settleDebounce();

    expect(host.lastQuery).toBe('');
  });

  it('does not show chip row when no chips', () => {
    host.chips.set([]);
    fixture.detectChanges();
    const chipRow = fixture.nativeElement.querySelector('.chip-row');
    expect(chipRow).toBeNull();
  });

  it('shows chip row when chips are present', () => {
    host.chips.set([{ key: 'tier', label: 'Tier: 2' }]);
    fixture.detectChanges();
    const chipRow = fixture.nativeElement.querySelector('.chip-row');
    expect(chipRow).toBeTruthy();
  });

  it('renders all chips in the chip row', () => {
    host.chips.set([
      { key: 'tier', label: 'Tier: 2' },
      { key: 'trait', label: 'Trait: Agility' },
    ]);
    fixture.detectChanges();
    const chipBtns = fixture.nativeElement.querySelectorAll('.filter-chip');
    expect(chipBtns.length).toBe(2);
  });

  it('emits chipRemove when a chip is clicked', () => {
    const chip: FilterChip = { key: 'tier', label: 'Tier: 2' };
    host.chips.set([chip]);
    fixture.detectChanges();

    const chipBtn = fixture.nativeElement.querySelector('.filter-chip') as HTMLButtonElement;
    chipBtn.click();
    expect(host.lastRemovedChip).toEqual(chip);
  });

  it('focuses input on Ctrl+K keydown', () => {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    const focusSpy = vi.spyOn(input, 'focus');

    const compEl = fixture.nativeElement.querySelector('app-codex-search-bar') as HTMLElement;
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(focusSpy).toHaveBeenCalled();
    expect(compEl).toBeTruthy();
  });

  it('focuses input on Meta+K keydown', () => {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    const focusSpy = vi.spyOn(input, 'focus');

    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(focusSpy).toHaveBeenCalled();
  });
});
