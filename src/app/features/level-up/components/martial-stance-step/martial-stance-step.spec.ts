import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MartialStanceStep } from './martial-stance-step';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { PreferencesService } from '../../../../core/services/preferences.service';

function makeStance(id: number, tier: number, name = `Stance ${id}`): CardData {
  return {
    id,
    name,
    description: 'A martial stance.',
    cardType: 'martialStance',
    metadata: { tier },
  };
}

const TIER1 = [makeStance(1, 1, 'Aggressive'), makeStance(2, 1, 'Defensive')];
const TIER2 = [makeStance(5, 2, 'Relentless')];
const TIER3 = [makeStance(9, 3, 'Unbreakable')];
const ALL_STANCES = [...TIER1, ...TIER2, ...TIER3];

describe('MartialStanceStep', () => {
  let fixture: ComponentFixture<MartialStanceStep>;
  let component: MartialStanceStep;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MartialStanceStep],
    }).compileComponents();

    fixture = TestBed.createComponent(MartialStanceStep);
    component = fixture.componentInstance;
  });

  function setUp(opts: { maxTier?: number; knownStanceIds?: number[]; selectedStanceIds?: number[]; requiredCount?: number } = {}): void {
    fixture.componentRef.setInput('cards', ALL_STANCES);
    fixture.componentRef.setInput('maxTier', opts.maxTier ?? 2);
    fixture.componentRef.setInput('knownStanceIds', opts.knownStanceIds ?? []);
    fixture.componentRef.setInput('selectedStanceIds', opts.selectedStanceIds ?? []);
    if (opts.requiredCount !== undefined) {
      fixture.componentRef.setInput('requiredCount', opts.requiredCount);
    }
    fixture.detectChanges();
  }

  it('creates', () => {
    setUp();
    expect(component).toBeTruthy();
  });

  it('shows a skeleton while loading', () => {
    fixture.componentRef.setInput('maxTier', 2);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-card-skeleton')).toBeTruthy();
  });

  it('shows an error state on failure', () => {
    fixture.componentRef.setInput('maxTier', 2);
    fixture.componentRef.setInput('error', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-card-error')).toBeTruthy();
  });

  it('allows selecting a stance at or below the character tier', () => {
    setUp({ maxTier: 2 });
    let emitted: number[] | undefined;
    component.stancesSelected.subscribe(v => (emitted = v));

    component.onCardClicked(TIER2[0]);

    expect(emitted).toEqual([5]);
  });

  it('blocks selecting a stance above the character tier', () => {
    setUp({ maxTier: 2 });
    let emitted: number[] | undefined;
    component.stancesSelected.subscribe(v => (emitted = v));

    component.onCardClicked(TIER3[0]);

    expect(emitted).toBeUndefined();
  });

  it('renders already-known stances as selected', () => {
    setUp({ maxTier: 2, knownStanceIds: [1] });
    expect(component.isSelected(TIER1[0])).toBe(true);
  });

  it('renders already-known stances as disabled, not hidden', () => {
    setUp({ maxTier: 2, knownStanceIds: [1] });
    const headings = fixture.nativeElement.querySelectorAll('.stance-tier-group__heading');
    expect(headings.length).toBeGreaterThan(0);
    expect(component.isDisabled(TIER1[0])).toBe(true);
  });

  it('does not let a known stance be toggled off', () => {
    setUp({ maxTier: 2, knownStanceIds: [1] });
    let emitted: number[] | undefined;
    component.stancesSelected.subscribe(v => (emitted = v));

    component.onCardClicked(TIER1[0]);

    expect(emitted).toBeUndefined();
  });

  it('deselects the currently selected new stance on second click', () => {
    setUp({ maxTier: 2, selectedStanceIds: [5] });
    let emitted: number[] | undefined;
    component.stancesSelected.subscribe(v => (emitted = v));

    component.onCardClicked(TIER2[0]);

    expect(emitted).toEqual([]);
  });

  it('shows 1/1 in the badge once a stance is chosen (single-select, default requiredCount)', () => {
    setUp({ maxTier: 2, selectedStanceIds: [5] });
    const badge = fixture.nativeElement.querySelector('.selection-badge');
    expect(badge.textContent.replace(/\s+/g, '')).toBe('1/1');
  });

  it('marks tiers above the character tier with an unlock hint', () => {
    setUp({ maxTier: 2 });
    expect(fixture.nativeElement.querySelector('.stance-tier-group__hint')).toBeTruthy();
  });

  describe('multi-select (acquisition, requiredCount 2)', () => {
    it('shows "0 of 2" style badge before any selection', () => {
      setUp({ maxTier: 1, requiredCount: 2 });
      const badge = fixture.nativeElement.querySelector('.selection-badge');
      expect(badge.textContent.replace(/\s+/g, '')).toBe('0/2');
    });

    it('allows selecting a second stance when only one is chosen', () => {
      setUp({ maxTier: 1, requiredCount: 2, selectedStanceIds: [1] });
      let emitted: number[] | undefined;
      component.stancesSelected.subscribe(v => (emitted = v));

      component.onCardClicked(TIER1[1]);

      expect(emitted).toEqual([1, 2]);
    });

    it('blocks selecting a third stance once 2 are already chosen', () => {
      setUp({ maxTier: 1, requiredCount: 2, selectedStanceIds: [1, 2] });
      let emitted: number[] | undefined;
      component.stancesSelected.subscribe(v => (emitted = v));

      component.onCardClicked(TIER2[0]);

      expect(emitted).toBeUndefined();
    });

    it('marks selection complete only once both are chosen', () => {
      setUp({ maxTier: 1, requiredCount: 2, selectedStanceIds: [1] });
      expect(component.isSelectionComplete()).toBe(false);

      setUp({ maxTier: 1, requiredCount: 2, selectedStanceIds: [1, 2] });
      expect(component.isSelectionComplete()).toBe(true);
    });

    it('rejects tier-2/3/4 stances when maxTier is pinned to 1', () => {
      setUp({ maxTier: 1, requiredCount: 2 });
      expect(component.isSelectable(TIER2[0])).toBe(false);
      expect(component.isSelectable(TIER3[0])).toBe(false);
      expect(component.isSelectable(TIER1[0])).toBe(true);
    });

    it('shows the two-stance instruction copy', () => {
      setUp({ maxTier: 1, requiredCount: 2 });
      expect(fixture.nativeElement.querySelector('.step-instruction').textContent).toContain('2');
    });
  });

  describe('selection cap', () => {
    it('disables unselected stances once the required count is reached', () => {
      setUp({ maxTier: 1, requiredCount: 2, selectedStanceIds: [1, 2] });
      const surplus = makeStance(3, 1, 'Guarded');
      fixture.componentRef.setInput('cards', [...TIER1, surplus]);
      fixture.detectChanges();
      expect(component.isDisabled(surplus)).toBe(true);
    });

    it('keeps already-selected stances enabled at the cap so they can be deselected', () => {
      setUp({ maxTier: 1, requiredCount: 2, selectedStanceIds: [1, 2] });
      expect(component.isDisabled(TIER1[0])).toBe(false);
    });

    it('leaves stances enabled while below the cap', () => {
      setUp({ maxTier: 1, requiredCount: 2, selectedStanceIds: [1] });
      expect(component.isDisabled(TIER1[1])).toBe(false);
    });
  });

  describe('beta layout', () => {
    beforeEach(() => {
      TestBed.inject(PreferencesService).setSheetLayout('beta');
    });

    afterEach(() => {
      localStorage.clear();
      document.documentElement.removeAttribute('data-card-theme');
    });

    it('renders entity cards instead of DaggerheartCards', () => {
      setUp({ maxTier: 2 });
      expect(fixture.nativeElement.querySelector('app-entity-card')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-daggerheart-card')).toBeNull();
    });

    it('scopes the tier groups to a light-only card surface', () => {
      setUp({ maxTier: 2 });
      const surface = fixture.nativeElement.querySelector('[data-card-theme]');
      expect(surface).toBeTruthy();
      expect(surface.querySelector('app-entity-card')).toBeTruthy();
    });

    it('shows "Known" status text, not a Select control, for an already-known stance', () => {
      setUp({ maxTier: 2, knownStanceIds: [1] });
      const status = fixture.nativeElement.querySelector('button[aria-label="Select Aggressive"]');
      expect(status).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Known');
    });

    it('shows "Locked" status text, not a Select control, for a stance above maxTier', () => {
      setUp({ maxTier: 2 });
      const status = fixture.nativeElement.querySelector('button[aria-label="Select Unbreakable"]');
      expect(status).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Locked');
    });

    it('renders a Select control for a selectable, unknown stance', () => {
      setUp({ maxTier: 2 });
      const button = fixture.nativeElement.querySelector('button[aria-label="Select Relentless"]');
      expect(button).toBeTruthy();
    });

    it('emits stancesSelected when a beta Select control is clicked', () => {
      setUp({ maxTier: 2 });
      let emitted: number[] | undefined;
      component.stancesSelected.subscribe(v => (emitted = v));

      const button = fixture.nativeElement.querySelector('button[aria-label="Select Relentless"]') as HTMLButtonElement;
      button.click();

      expect(emitted).toEqual([5]);
    });

    it('marks a surplus, unselected control aria-disabled once the cap is reached', () => {
      setUp({ maxTier: 1, requiredCount: 2, selectedStanceIds: [1, 2] });
      const surplus = makeStance(3, 1, 'Guarded');
      fixture.componentRef.setInput('cards', [...TIER1, surplus]);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[aria-label="Guarded, selection limit reached"]');
      expect(button?.getAttribute('aria-disabled')).toBe('true');
      expect(button?.textContent).toContain('Limit reached');
    });

    describe('ARIA checkbox vocabulary (matches EntitySelectionGrid, not a toggle button)', () => {
      it('uses role="checkbox" and aria-checked, not aria-pressed, for a selectable stance', () => {
        setUp({ maxTier: 2 });
        const button = fixture.nativeElement.querySelector('button[aria-label="Select Relentless"]');
        expect(button.getAttribute('role')).toBe('checkbox');
        expect(button.getAttribute('aria-checked')).toBe('false');
        expect(button.hasAttribute('aria-pressed')).toBe(false);
      });

      it('checks the control once selected', () => {
        setUp({ maxTier: 2, selectedStanceIds: [5] });
        const button = fixture.nativeElement.querySelector('button[aria-label="Relentless selected"]');
        expect(button.getAttribute('role')).toBe('checkbox');
        expect(button.getAttribute('aria-checked')).toBe('true');
      });

      it('renders a Known stance as a permanently-checked, aria-disabled checkbox rather than inert text', () => {
        setUp({ maxTier: 2, knownStanceIds: [1] });
        const button = fixture.nativeElement.querySelector('button[aria-label="Aggressive, known"]');
        expect(button).toBeTruthy();
        expect(button.getAttribute('role')).toBe('checkbox');
        expect(button.getAttribute('aria-checked')).toBe('true');
        expect(button.getAttribute('aria-disabled')).toBe('true');
        expect(button.textContent).toContain('Known');
      });

      it('renders a Locked stance as an unchecked, aria-disabled checkbox rather than inert text', () => {
        setUp({ maxTier: 2 });
        const button = fixture.nativeElement.querySelector('button[aria-label="Unbreakable, locked"]');
        expect(button).toBeTruthy();
        expect(button.getAttribute('role')).toBe('checkbox');
        expect(button.getAttribute('aria-checked')).toBe('false');
        expect(button.getAttribute('aria-disabled')).toBe('true');
        expect(button.textContent).toContain('Locked');
      });

      it('keeps Known and Locked controls focusable (aria-disabled, never the disabled attribute)', () => {
        setUp({ maxTier: 2, knownStanceIds: [1] });
        const known = fixture.nativeElement.querySelector('button[aria-label="Aggressive, known"]');
        const locked = fixture.nativeElement.querySelector('button[aria-label="Unbreakable, locked"]');
        expect(known.hasAttribute('disabled')).toBe(false);
        expect(locked.hasAttribute('disabled')).toBe(false);
      });
    });

    it('leaves classic rendering untouched when sheetLayout is classic', () => {
      TestBed.inject(PreferencesService).setSheetLayout('classic');
      setUp({ maxTier: 2 });
      expect(fixture.nativeElement.querySelector('app-daggerheart-card')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-entity-card')).toBeNull();
    });
  });
});
