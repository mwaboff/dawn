import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, signal } from '@angular/core';
import { CompanionPanelBeta } from './companion-panel-beta';
import { CompanionPanel } from '../../../character-sheet/components/companion-panel/companion-panel';
import { CompanionCardBeta } from './components/companion-card-beta/companion-card-beta';
import { CompanionApiResponse } from '../../../../shared/models/companion-api.model';

function buildCompanion(overrides: Partial<CompanionApiResponse> = {}): CompanionApiResponse {
  return {
    id: 1,
    characterSheetId: 5,
    name: 'Forest Wolf',
    evasion: 10,
    baseEvasion: 10,
    attackName: 'Bite',
    attackRange: 'MELEE',
    baseAttackRange: 'MELEE',
    damageDice: 'D6',
    baseDamageDice: 'D6',
    attackDiceCount: 1,
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
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

@Component({
  imports: [CompanionPanelBeta],
  template: `
    <app-companion-panel-beta
      [companions]="companions()"
      [proficiency]="proficiency()"
      [characterSheetId]="5"
      [canManage]="true"
      [canCreate]="true"
    />
  `,
})
class TestHost {
  companions = signal<CompanionApiResponse[]>([]);
  proficiency = signal(2);
}

describe('CompanionPanelBeta', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('extends CompanionPanel, inheriting its create/edit/delete/stress-forwarding logic', () => {
    const panel = fixture.debugElement.query(By.directive(CompanionPanelBeta)).componentInstance;
    expect(panel).toBeInstanceOf(CompanionPanel);
  });

  it('renders one CompanionCardBeta per companion, with the inherited inputs forwarded', () => {
    host.companions.set([buildCompanion({ id: 1 }), buildCompanion({ id: 2, name: 'Shadow Cat' })]);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.directive(CompanionCardBeta));
    expect(cards.length).toBe(2);
    const instances = cards.map(c => c.componentInstance as CompanionCardBeta);
    expect(instances[0].companion().name).toBe('Forest Wolf');
    expect(instances[1].companion().name).toBe('Shadow Cat');
    expect(instances[0].proficiency()).toBe(2);
  });

  it('opens the create modal via the inherited handler when Add Companion is clicked', () => {
    el.querySelector<HTMLButtonElement>('.companion-add-btn')!.click();
    fixture.detectChanges();

    expect(el.querySelector('app-companion-form-modal')).toBeTruthy();
  });
});
