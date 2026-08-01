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

  function setUp(opts: { maxTier?: number; knownStanceIds?: number[]; selectedStanceId?: number | null } = {}): void {
    fixture.componentRef.setInput('cards', ALL_STANCES);
    fixture.componentRef.setInput('maxTier', opts.maxTier ?? 2);
    fixture.componentRef.setInput('knownStanceIds', opts.knownStanceIds ?? []);
    fixture.componentRef.setInput('selectedStanceId', opts.selectedStanceId ?? null);
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
    let emitted: number | null | undefined;
    component.stanceSelected.subscribe(v => (emitted = v));

    component.onCardClicked(TIER2[0]);

    expect(emitted).toBe(5);
  });

  it('blocks selecting a stance above the character tier', () => {
    setUp({ maxTier: 2 });
    let emitted: number | null | undefined;
    component.stanceSelected.subscribe(v => (emitted = v));

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
    let emitted: number | null | undefined;
    component.stanceSelected.subscribe(v => (emitted = v));

    component.onCardClicked(TIER1[0]);

    expect(emitted).toBeUndefined();
  });

  it('deselects the currently selected new stance on second click', () => {
    setUp({ maxTier: 2, selectedStanceId: 5 });
    let emitted: number | null | undefined;
    component.stanceSelected.subscribe(v => (emitted = v));

    component.onCardClicked(TIER2[0]);

    expect(emitted).toBeNull();
  });

  it('shows 1/1 in the badge once a stance is chosen', () => {
    setUp({ maxTier: 2, selectedStanceId: 5 });
    const badge = fixture.nativeElement.querySelector('.selection-badge');
    expect(badge.textContent.replace(/\s+/g, '')).toBe('1/1');
  });

  it('marks tiers above the character tier with an unlock hint', () => {
    setUp({ maxTier: 2 });
    expect(fixture.nativeElement.querySelector('.stance-tier-group__hint')).toBeTruthy();
  });
});
