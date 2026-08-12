import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CardTable } from './card-table';
import { CardRow, ColumnSpec } from '../card-table.model';

const columns: ColumnSpec[] = [
  { key: 'tier', label: 'Tier', width: '4rem', numeric: true },
  { key: 'trait', label: 'Trait', width: '7rem' },
];

const rows: CardRow[] = [
  { id: 1, name: 'Longsword', typeLabel: 'Weapons', link: ['/admin/cards', 'weapon', 1], cells: { tier: '1', trait: 'Agility' }, srdType: 'WEAPON' },
  { id: 2, name: 'Dagger', typeLabel: 'Weapons', link: ['/admin/cards', 'weapon', 2], cells: { tier: '2', trait: 'Finesse' }, srdType: 'WEAPON' },
];

describe('CardTable', () => {
  let fixture: ComponentFixture<CardTable>;

  function render(overrides: Partial<{
    sort: { key: string; direction: 'asc' | 'desc' } | null;
    showType: boolean;
    rows: CardRow[];
    selectedKeys: ReadonlySet<string>;
  }> = {}) {
    fixture.componentRef.setInput('rows', overrides.rows ?? rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('sort', overrides.sort ?? null);
    fixture.componentRef.setInput('showType', overrides.showType ?? false);
    fixture.componentRef.setInput('selectedKeys', overrides.selectedKeys ?? new Set());
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
    expect(cells).toEqual(['', '1', 'Longsword', '1', 'Agility']);
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

  describe('row selection', () => {
    function rowCheckboxes(): HTMLInputElement[] {
      return Array.from(fixture.nativeElement.querySelectorAll('.card-row .row-checkbox'));
    }

    function headerCheckbox(): HTMLInputElement {
      return fixture.nativeElement.querySelector('thead .row-checkbox');
    }

    it('checks a row whose key is in selectedKeys', () => {
      render({ selectedKeys: new Set(['WEAPON:1']) });
      const boxes = rowCheckboxes();
      expect(boxes[0].checked).toBe(true);
      expect(boxes[1].checked).toBe(false);
    });

    it('emits the row key when a row checkbox is toggled', () => {
      render();
      const emitted: string[] = [];
      fixture.componentInstance.rowSelectionToggled.subscribe(key => emitted.push(key));
      rowCheckboxes()[0].dispatchEvent(new Event('change'));
      expect(emitted).toEqual(['WEAPON:1']);
    });

    it('disables the checkbox for a row with no flaggable type', () => {
      render({ rows: [{ ...rows[0], srdType: null }, rows[1]] });
      expect(rowCheckboxes()[0].disabled).toBe(true);
      expect(rowCheckboxes()[1].disabled).toBe(false);
    });

    it('checks the header box when every flaggable row is selected', () => {
      render({ selectedKeys: new Set(['WEAPON:1', 'WEAPON:2']) });
      expect(headerCheckbox().checked).toBe(true);
      expect(headerCheckbox().indeterminate).toBe(false);
    });

    it('marks the header box indeterminate when only some rows are selected', () => {
      render({ selectedKeys: new Set(['WEAPON:1']) });
      expect(headerCheckbox().checked).toBe(false);
      expect(headerCheckbox().indeterminate).toBe(true);
    });

    it('leaves the header box unchecked and not indeterminate when nothing is selected', () => {
      render();
      expect(headerCheckbox().checked).toBe(false);
      expect(headerCheckbox().indeterminate).toBe(false);
    });

    it('ignores a disabled row when deciding whether every row is selected', () => {
      render({
        rows: [{ ...rows[0], srdType: null }, rows[1]],
        selectedKeys: new Set(['WEAPON:2']),
      });
      expect(headerCheckbox().checked).toBe(true);
    });

    it('emits true from the header checkbox when checked', () => {
      render();
      const emitted: boolean[] = [];
      fixture.componentInstance.pageSelectionToggled.subscribe(v => emitted.push(v));
      const box = headerCheckbox();
      box.checked = true;
      box.dispatchEvent(new Event('change'));
      expect(emitted).toEqual([true]);
    });

    it('emits false from the header checkbox when unchecked', () => {
      render({ selectedKeys: new Set(['WEAPON:1', 'WEAPON:2']) });
      const emitted: boolean[] = [];
      fixture.componentInstance.pageSelectionToggled.subscribe(v => emitted.push(v));
      const box = headerCheckbox();
      box.checked = false;
      box.dispatchEvent(new Event('change'));
      expect(emitted).toEqual([false]);
    });

    it('adds a selected modifier class to a selected row', () => {
      render({ selectedKeys: new Set(['WEAPON:1']) });
      const firstRow = fixture.nativeElement.querySelector('.card-row');
      expect(firstRow.classList.contains('card-row--selected')).toBe(true);
    });
  });

  describe('SRD annotation on the expansion column', () => {
    const expansionColumns: ColumnSpec[] = [{ key: 'expansion', label: 'Expansion', width: '11rem' }];

    function expansionCellText(): string | undefined {
      return fixture.nativeElement.querySelector('.card-row td:last-child')?.textContent?.trim();
    }

    beforeEach(() => {
      fixture.componentRef.setInput('columns', expansionColumns);
    });

    it('appends (SRD) when the row is SRD content with an expansion', () => {
      fixture.componentRef.setInput('rows', [
        { ...rows[0], cells: { expansion: 'Core Set' }, srd: true },
      ]);
      fixture.detectChanges();
      expect(expansionCellText()).toBe('Core Set (SRD)');
    });

    it('leaves the expansion name alone when the row is not SRD content', () => {
      fixture.componentRef.setInput('rows', [
        { ...rows[0], cells: { expansion: 'Hope & Fear' }, srd: false },
      ]);
      fixture.detectChanges();
      expect(expansionCellText()).toBe('Hope & Fear');
    });

    it('never renders a bare (SRD) for a row with no expansion', () => {
      fixture.componentRef.setInput('rows', [
        { ...rows[0], cells: { expansion: '' }, srd: true },
      ]);
      fixture.detectChanges();
      expect(expansionCellText()).toBe('');
    });

    it('does not append the suffix to a non-expansion column', () => {
      fixture.componentRef.setInput('columns', [{ key: 'trait', label: 'Trait', width: '7rem' }]);
      fixture.componentRef.setInput('rows', [
        { ...rows[0], cells: { trait: 'Agility' }, srd: true },
      ]);
      fixture.detectChanges();
      expect(expansionCellText()).toBe('Agility');
    });
  });
});
