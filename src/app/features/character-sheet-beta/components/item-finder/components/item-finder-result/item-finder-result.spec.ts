import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ItemFinderResult } from './item-finder-result';
import { CatalogCardEntry, ItemProvenance } from '../../../../utils/catalog-card.mapper';

function buildEntry(provenance: ItemProvenance | null = null): CatalogCardEntry {
  return {
    type: 'weapon',
    itemId: 1,
    name: 'Broadsword',
    card: {
      id: 1,
      name: 'Broadsword',
      cardType: 'weapon',
      headline: '2d8+3 Phy',
      description: 'A long blade.',
      stats: ['2d8+3 Phy', 'Strength', 'Melee'],
    },
    provenance,
    item: { id: 1, name: 'Broadsword' } as CatalogCardEntry['item'],
  };
}

describe('ItemFinderResult', () => {
  let fixture: ComponentFixture<ItemFinderResult>;
  let component: ItemFinderResult;

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function addButton(): HTMLButtonElement {
    return el().querySelector('.finder-result__add') as HTMLButtonElement;
  }

  async function render(entry: CatalogCardEntry, added = false): Promise<void> {
    fixture = TestBed.createComponent(ItemFinderResult);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entry', entry);
    fixture.componentRef.setInput('added', added);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ItemFinderResult] }).compileComponents();
  });

  it('draws the item as a collapsed card, so a mixed list stays scannable', async () => {
    await render(buildEntry());

    // `compact` renders the header only; the description belongs to the body it hides.
    expect(el().textContent).toContain('Broadsword');
    expect(el().textContent).not.toContain('A long blade.');
  });

  it('expands in place to the full card', async () => {
    await render(buildEntry());

    (el().querySelector('.entity-card__header--interactive') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el().textContent).toContain('A long blade.');
  });

  it('slots into the dialog outline at level 4, inside its h3 type group', async () => {
    await render(buildEntry());

    expect(el().querySelector('[role="heading"]')?.getAttribute('aria-level')).toBe('4');
  });

  it('puts the collapsed row\'s only fact into the header\'s accessible name', async () => {
    await render(buildEntry());

    // At `compact` there is no body, so a name of just "Expand Broadsword" would leave a screen
    // reader with nothing to compare two rows by.
    expect(el().querySelector('.entity-card__header--interactive')?.getAttribute('aria-label'))
      .toBe('Expand Broadsword, 2d8+3 Phy');
  });

  it('keeps the Add button reachable while the card is collapsed', async () => {
    await render(buildEntry());

    expect(addButton()).toBeTruthy();
    expect(addButton().textContent?.trim()).toContain('Add');
  });

  it('shows no origin chip for official gear', async () => {
    await render(buildEntry(null));

    expect(el().querySelector('.finder-result__chip')).toBeNull();
  });

  it('names the origin of homebrew the viewer wrote', async () => {
    await render(buildEntry('yours'));

    expect(el().querySelector('.finder-result__chip')?.textContent).toContain('Yours');
  });

  it('names the origin of gear shared with a campaign', async () => {
    await render(buildEntry('campaign'));

    expect(el().querySelector('.finder-result__chip')?.textContent).toContain('Campaign');
  });

  it('spells the origin out in the button name, not just the chip', async () => {
    await render(buildEntry('campaign'));

    expect(addButton().getAttribute('aria-label')).toBe(
      'Add Broadsword, custom gear shared with your campaign, to inventory',
    );
  });

  it('names official gear without an origin clause', async () => {
    await render(buildEntry(null));

    expect(addButton().getAttribute('aria-label')).toBe('Add Broadsword to inventory');
  });

  it('keeps the button named Add after an add, so the action does not rename itself', async () => {
    await render(buildEntry(), true);

    expect(addButton().textContent?.trim()).toContain('Add');
    expect(addButton().textContent).not.toContain('again');
  });

  it('marks the row as added rather than relabelling the button', async () => {
    await render(buildEntry(), true);

    expect(el().querySelector('.finder-result__chip--added')?.textContent).toContain('Added');
  });

  it('keeps the visible label inside the accessible name in both states', async () => {
    await render(buildEntry(null), true);

    expect(addButton().getAttribute('aria-label')).toBe('Add Broadsword to inventory again');
  });

  it('emits the whole entry so the caller need not look it up again', async () => {
    await render(buildEntry());
    let emitted: CatalogCardEntry | null = null;
    component.add.subscribe(entry => (emitted = entry));

    addButton().click();

    expect(emitted).not.toBeNull();
    expect(emitted!.itemId).toBe(1);
  });
});
