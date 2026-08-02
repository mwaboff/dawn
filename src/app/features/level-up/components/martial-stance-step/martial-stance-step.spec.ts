import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MartialStanceStep } from './martial-stance-step';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';

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
});
