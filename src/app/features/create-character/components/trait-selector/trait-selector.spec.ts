import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TraitSelector } from './trait-selector';
import { TRAITS } from '../../models/trait.model';

describe('TraitSelector', () => {
  let component: TraitSelector;
  let fixture: ComponentFixture<TraitSelector>;

  function assignViaSelect(key: string, value: string): void {
    const event = { target: { value } } as unknown as Event;
    component.onSelectChange(event, key as Parameters<typeof component.onSelectChange>[1]);
  }

  function assignAllTraits(): void {
    const values = ['2', '1', '1', '0', '0', '-1'];
    TRAITS.forEach((trait, i) => assignViaSelect(trait.key, values[i]));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraitSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(TraitSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with all traits unassigned', () => {
    for (const trait of TRAITS) {
      expect(component.getAssignment(trait.key)).toBeNull();
    }
  });

  it('should report not complete when no traits assigned', () => {
    expect(component.isComplete()).toBe(false);
  });

  it('should report no assignments initially', () => {
    expect(component.hasAnyAssignment()).toBe(false);
  });

  it('should format positive values with plus sign', () => {
    expect(component.formatValue(2)).toBe('+2');
    expect(component.formatValue(1)).toBe('+1');
  });

  it('should format zero as 0', () => {
    expect(component.formatValue(0)).toBe('0');
  });

  it('should format negative values with minus sign', () => {
    expect(component.formatValue(-1)).toBe('-1');
  });

  it('should format null as em dash', () => {
    expect(component.formatValue(null)).toBe('\u2014');
  });

  describe('onSelectChange', () => {
    it('should assign value via select change', () => {
      assignViaSelect('agility', '2');
      expect(component.getAssignment('agility')).toBe(2);
    });

    it('should clear value via select change with empty value', () => {
      assignViaSelect('agility', '2');
      assignViaSelect('agility', '');
      expect(component.getAssignment('agility')).toBeNull();
    });

    it('should not assign a value already used by another trait', () => {
      assignViaSelect('agility', '2');
      assignViaSelect('strength', '2');
      expect(component.getAssignment('strength')).toBeNull();
    });

    it('should allow reassigning a trait to a different available value', () => {
      assignViaSelect('agility', '2');
      assignViaSelect('agility', '1');
      expect(component.getAssignment('agility')).toBe(1);
    });

    it('should free the previous value when reassigning', () => {
      assignViaSelect('agility', '2');
      assignViaSelect('agility', '1');
      const values = component.getSelectableValues('strength');
      expect(values).toContain(2);
    });
  });

  describe('getSelectableValues', () => {
    it('should return all unique pool values when nothing is assigned', () => {
      expect(component.getSelectableValues('agility')).toEqual([2, 1, 0, -1]);
    });

    it('should include current assignment in selectable values', () => {
      assignViaSelect('agility', '2');
      expect(component.getSelectableValues('agility')).toContain(2);
    });

    it('should exclude values used by other traits', () => {
      assignViaSelect('agility', '2');
      expect(component.getSelectableValues('strength')).not.toContain(2);
    });
  });

  describe('clearAll', () => {
    it('should clear all assignments', () => {
      assignViaSelect('agility', '2');
      assignViaSelect('strength', '1');
      component.clearAll();
      expect(component.hasAnyAssignment()).toBe(false);
    });

    it('should restore all pool values after clearing', () => {
      assignViaSelect('agility', '2');
      component.clearAll();
      expect(component.getSelectableValues('agility')).toEqual([2, 1, 0, -1]);
    });
  });

  describe('completion', () => {
    it('should emit traitsChanged when an assignment changes', () => {
      const spy = vi.fn();
      component.traitsChanged.subscribe(spy);
      assignViaSelect('agility', '2');
      expect(spy).toHaveBeenCalled();
    });

    it('should report complete when all traits assigned', () => {
      assignAllTraits();
      expect(component.isComplete()).toBe(true);
    });

    it('should report not complete after clearing one trait', () => {
      assignAllTraits();
      assignViaSelect('agility', '');
      expect(component.isComplete()).toBe(false);
    });
  });

  describe('rendering', () => {
    it('should render the stepper grid', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.stepper-grid')).toBeTruthy();
    });

    it('should render 6 stepper cards', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelectorAll('.stepper-card').length).toBe(6);
    });

    it('should render a select for each trait', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelectorAll('.stepper-select').length).toBe(6);
    });

    it('should show reset button when assignments exist', () => {
      assignViaSelect('agility', '2');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.reset-btn')).toBeTruthy();
    });

    it('should not show reset button when no assignments', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.reset-btn')).toBeNull();
    });

    it('should show complete badge when all traits assigned', () => {
      assignAllTraits();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.complete-badge')).toBeTruthy();
    });

    it('should apply assigned class to a card when value is set', () => {
      assignViaSelect('agility', '2');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const cards = el.querySelectorAll('.stepper-card');
      expect(cards[0].classList.contains('stepper-card--assigned')).toBe(true);
    });

    it('should display trait names', () => {
      const el = fixture.nativeElement as HTMLElement;
      const names = Array.from(el.querySelectorAll('.stepper-name')).map((n) =>
        n.textContent?.trim(),
      );
      expect(names).toContain('Agility');
      expect(names).toContain('Knowledge');
    });

    it('should display trait actions', () => {
      const el = fixture.nativeElement as HTMLElement;
      const actions = el.querySelector('.stepper-actions');
      expect(actions?.textContent).toContain('Sprint');
    });
  });
});
