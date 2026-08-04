import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrainingStep } from './training-step';
import { CompanionTrainingEligibility } from '../../models/level-up-api.model';
import { CompanionApiResponse } from '../../../../shared/models/companion-api.model';

function makeStats(overrides: Partial<CompanionApiResponse> = {}): CompanionApiResponse {
  return {
    id: 7,
    characterSheetId: 1,
    name: 'Rufus',
    evasion: 10,
    baseEvasion: 10,
    attackName: 'Bite',
    attackRange: 'MELEE',
    baseAttackRange: 'MELEE',
    damageDice: 'D6',
    baseDamageDice: 'D6',
    attackDiceCount: 2,
    damageType: 'PHYSICAL',
    stressMax: 3,
    baseStressMax: 3,
    stressMarked: 0,
    outOfScene: false,
    origin: 'SUBCLASS_FEATURE',
    advancesOnLevelUp: true,
    trainings: [],
    remainingByOption: {},
    experiences: [],
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

function makeTraining(overrides: Partial<CompanionTrainingEligibility> = {}): CompanionTrainingEligibility {
  return {
    companionId: 7,
    name: 'Rufus',
    currentStats: makeStats(),
    availableOptions: [
      { option: 'INTELLIGENT', remaining: 3 },
      { option: 'LIGHT_IN_THE_DARK', remaining: 1 },
      { option: 'CREATURE_COMFORT', remaining: 1 },
      { option: 'ARMORED', remaining: 1 },
      { option: 'VICIOUS', remaining: 3 },
      { option: 'RESILIENT', remaining: 3 },
      { option: 'BONDED', remaining: 1 },
      { option: 'AWARE', remaining: 3 },
    ],
    picksAvailable: 1,
    ...overrides,
  };
}

describe('TrainingStep', () => {
  let fixture: ComponentFixture<TrainingStep>;
  let component: TrainingStep;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TrainingStep] }).compileComponents();
    fixture = TestBed.createComponent(TrainingStep);
    component = fixture.componentInstance;
  });

  function setUp(training = makeTraining(), picksAvailable = 1, selections: unknown[] = []): void {
    fixture.componentRef.setInput('training', training);
    fixture.componentRef.setInput('picksAvailable', picksAvailable);
    fixture.componentRef.setInput('selections', selections);
    fixture.detectChanges();
  }

  it('creates and shows the companion name and picks badge', () => {
    setUp();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.training-step__name')?.textContent).toContain('Rufus');
    expect(compiled.querySelector('.selection-badge__max')?.textContent?.trim()).toBe('1');
  });

  it('emits a simple option selection on Take', () => {
    setUp();
    let emitted: unknown;
    component.selectionsChanged.subscribe(v => (emitted = v));

    component.onTakeClicked('AWARE');

    expect(emitted).toEqual([{ companionId: 7, option: 'AWARE' }]);
  });

  it('disables Take once picksAvailable is reached', () => {
    setUp(makeTraining(), 1, [{ companionId: 7, option: 'AWARE' }]);
    expect(component.canTake('RESILIENT')).toBe(false);
  });

  it('disables an option once its server-side remaining count is exhausted', () => {
    setUp(makeTraining({ availableOptions: [{ option: 'CREATURE_COMFORT', remaining: 0 }] }), 5);
    expect(component.canTake('CREATURE_COMFORT')).toBe(false);
    expect(component.remainingFor('CREATURE_COMFORT')).toBe(0);
  });

  it('counts picks already staged this level-up against the same option\'s remaining cap', () => {
    setUp(makeTraining({ availableOptions: [{ option: 'VICIOUS', remaining: 1 }] }), 5, [
      { companionId: 7, option: 'VICIOUS', viciousAxis: 'DAMAGE_DIE' },
    ]);
    expect(component.remainingFor('VICIOUS')).toBe(0);
  });

  it('blocks Intelligent with no available take when the companion has no Experiences', () => {
    setUp(makeTraining({ currentStats: makeStats({ experiences: [] }) }), 5);
    expect(component.canTake('INTELLIGENT')).toBe(false);
    expect(component.hasExperiences()).toBe(false);
  });

  it('allows Intelligent when the companion has Experiences, and requires a sub-choice', () => {
    setUp(makeTraining({ currentStats: makeStats({ experiences: [{ id: 1, companionId: 7, description: 'Loyal', modifier: 2 }] }) }), 5);
    expect(component.canTake('INTELLIGENT')).toBe(true);
    expect(component.needsSubChoice('INTELLIGENT')).toBe(true);

    component.onTakeClicked('INTELLIGENT');
    expect(component.pendingOption()).toBe('INTELLIGENT');

    let emitted: unknown;
    component.selectionsChanged.subscribe(v => (emitted = v));
    component.onExperienceChosen(1);
    expect(emitted).toEqual([{ companionId: 7, option: 'INTELLIGENT', targetExperienceId: 1 }]);
    expect(component.pendingOption()).toBeNull();
  });

  it('disables a Vicious axis already at its cap (D12) while leaving the other axis selectable', () => {
    setUp(makeTraining({ currentStats: makeStats({ damageDice: 'D12', attackRange: 'CLOSE' }) }), 5);
    expect(component.isViciousAxisCapped('DAMAGE_DIE')).toBe(true);
    expect(component.isViciousAxisCapped('RANGE')).toBe(false);
    expect(component.isViciousExhausted()).toBe(false);
    expect(component.canTake('VICIOUS')).toBe(true);
  });

  it('fully disables Vicious once both axes are capped', () => {
    setUp(makeTraining({ currentStats: makeStats({ damageDice: 'D12', attackRange: 'VERY_FAR' }) }), 5);
    expect(component.isViciousExhausted()).toBe(true);
    expect(component.canTake('VICIOUS')).toBe(false);
  });

  it('emits a Vicious selection with the chosen axis', () => {
    setUp();
    let emitted: unknown;
    component.selectionsChanged.subscribe(v => (emitted = v));

    component.onTakeClicked('VICIOUS');
    expect(component.pendingOption()).toBe('VICIOUS');
    component.onViciousAxisChosen('RANGE');

    expect(emitted).toEqual([{ companionId: 7, option: 'VICIOUS', viciousAxis: 'RANGE' }]);
    expect(component.pendingOption()).toBeNull();
  });

  it('removes a staged selection by index', () => {
    setUp(makeTraining(), 5, [
      { companionId: 7, option: 'AWARE' },
      { companionId: 7, option: 'RESILIENT' },
    ]);
    let emitted: unknown;
    component.selectionsChanged.subscribe(v => (emitted = v));

    component.onRemove(0);

    expect(emitted).toEqual([{ companionId: 7, option: 'RESILIENT' }]);
  });

  it('reports complete once the selection count reaches picksAvailable', () => {
    setUp(makeTraining(), 2, [{ companionId: 7, option: 'AWARE' }]);
    expect(component.isComplete()).toBe(false);

    setUp(makeTraining(), 2, [{ companionId: 7, option: 'AWARE' }, { companionId: 7, option: 'RESILIENT' }]);
    expect(component.isComplete()).toBe(true);
  });
});
