import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CardTable } from './card-table';
import { CardRow, ColumnSpec } from '../card-table.model';

const columns: ColumnSpec[] = [
  { key: 'tier', label: 'Tier', width: '4rem', numeric: true },
  { key: 'trait', label: 'Trait', width: '7rem' },
];

const rows: CardRow[] = [
  { id: 1, name: 'Longsword', typeLabel: 'Weapons', link: ['/admin/cards', 'weapon', 1], cells: { tier: '1', trait: 'Agility' } },
  { id: 2, name: 'Dagger', typeLabel: 'Weapons', link: ['/admin/cards', 'weapon', 2], cells: { tier: '2', trait: 'Finesse' } },
];

describe('CardTable', () => {
  let fixture: ComponentFixture<CardTable>;

  function render(overrides: Partial<{ sort: { key: string; direction: 'asc' | 'desc' } | null; showType: boolean }> = {}) {
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('sort', overrides.sort ?? null);
    fixture.componentRef.setInput('showType', overrides.showType ?? false);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardTable],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(CardTable);
  });

  it('renders one row per card', () => {
    render();
    expect(fixture.nativeElement.querySelectorAll('.card-row').length).toBe(2);
  });

  it('renders the name as an anchor so it can be opened in a new tab', () => {
    render();
    const link = fixture.nativeElement.querySelector('.card-row__link') as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/admin/cards/weapon/1');
  });

  it('renders each column cell', () => {
    render();
    const cells = Array.from(fixture.nativeElement.querySelectorAll('.card-row')[0].querySelectorAll('td'))
      .map(el => (el as HTMLElement).textContent?.trim());
    expect(cells).toEqual(['1', 'Longsword', '1', 'Agility']);
  });

  it('hides the type column by default', () => {
    render();
    expect(fixture.nativeElement.querySelector('.card-row__type')).toBeNull();
  });

  it('shows the type column when asked', () => {
    render({ showType: true });
    expect(fixture.nativeElement.querySelector('.card-row__type').textContent.trim()).toBe('Weapons');
  });

  it('emits the column key when a header is clicked', () => {
    render();
    const emitted: string[] = [];
    fixture.componentInstance.sortChanged.subscribe(key => emitted.push(key));
    const headers = fixture.nativeElement.querySelectorAll('.col-sort');
    headers[headers.length - 1].click();
    expect(emitted).toEqual(['trait']);
  });

  it('marks the sorted column with aria-sort and an arrow', () => {
    render({ sort: { key: 'tier', direction: 'desc' } });
    const sorted = Array.from(fixture.nativeElement.querySelectorAll('th'))
      .find(el => (el as HTMLElement).textContent?.includes('Tier')) as HTMLElement;
    expect(sorted.getAttribute('aria-sort')).toBe('descending');
    expect(sorted.textContent).toContain('▼');
  });

  it('reports aria-sort none on unsorted columns', () => {
    render({ sort: { key: 'tier', direction: 'asc' } });
    const unsorted = Array.from(fixture.nativeElement.querySelectorAll('th'))
      .find(el => (el as HTMLElement).textContent?.includes('Trait')) as HTMLElement;
    expect(unsorted.getAttribute('aria-sort')).toBe('none');
  });

  it('renders an empty tbody without error when there are no rows', () => {
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('columns', columns);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.card-row').length).toBe(0);
  });
});
