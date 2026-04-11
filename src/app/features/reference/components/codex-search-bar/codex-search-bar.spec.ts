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
  });

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

  it('does not emit immediately on input (debounce pending)', () => {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'flame';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.lastQuery).toBe('');
  });

  it('emits queryChange after debounce settles', () => {
    return new Promise<void>(resolve => {
      const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
      input.value = 'flame';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      setTimeout(() => {
        expect(host.lastQuery).toBe('flame');
        resolve();
      }, 300);
    });
  });

  it('clears query on ESC key and emits empty string', () => {
    return new Promise<void>(resolve => {
      const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
      input.value = 'flame';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      setTimeout(() => {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        fixture.detectChanges();

        setTimeout(() => {
          expect(host.lastQuery).toBe('');
          resolve();
        }, 300);
      }, 300);
    });
  }, 1000);

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
