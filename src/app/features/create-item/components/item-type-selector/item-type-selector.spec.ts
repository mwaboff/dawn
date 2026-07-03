import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemTypeSelector } from './item-type-selector';

describe('ItemTypeSelector', () => {
  let fixture: ComponentFixture<ItemTypeSelector>;
  let component: ItemTypeSelector;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemTypeSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemTypeSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders a radiogroup with a radio option per item type', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="radiogroup"]')).toBeTruthy();
    const radios = compiled.querySelectorAll('[role="radio"]');
    expect(radios.length).toBe(3);
  });

  it('renders labels for Weapon, Armor, and Loot', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = Array.from(compiled.querySelectorAll('.type-card-label')).map(el => el.textContent?.trim());
    expect(labels).toEqual(['Weapon', 'Armor', 'Loot']);
  });

  it('emits typeSelected with the clicked type', () => {
    let emitted: string | undefined;
    component.typeSelected.subscribe(type => emitted = type);

    const compiled = fixture.nativeElement as HTMLElement;
    (compiled.querySelector('#item-type-option-armor') as HTMLButtonElement).click();

    expect(emitted).toBe('armor');
  });

  describe('keyboard navigation', () => {
    it('moves focus to the next option on ArrowRight', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      component.onKeydown(event, 0);
      expect(component.focusedIndex()).toBe(1);
    });

    it('wraps focus to the first option after the last on ArrowRight', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      component.onKeydown(event, 2);
      expect(component.focusedIndex()).toBe(0);
    });

    it('moves focus to the previous option on ArrowLeft', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      component.onKeydown(event, 1);
      expect(component.focusedIndex()).toBe(0);
    });

    it('selects the focused option on Enter', () => {
      let emitted: string | undefined;
      component.typeSelected.subscribe(type => emitted = type);

      component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), 2);

      expect(emitted).toBe('loot');
    });
  });
});
