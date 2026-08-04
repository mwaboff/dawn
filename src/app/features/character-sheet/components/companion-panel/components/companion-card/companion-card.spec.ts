import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { CompanionCard } from './companion-card';
import { CompanionApiResponse, CreateCompanionTrainingRequest } from '../../../../../../shared/models/companion-api.model';

function buildCompanion(overrides: Partial<CompanionApiResponse> = {}): CompanionApiResponse {
  return {
    id: 1,
    characterSheetId: 1,
    name: 'Forest Wolf',
    description: 'A loyal wolf',
    evasion: 12,
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
    remainingByOption: { AWARE: 3 },
    experiences: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

@Component({
  imports: [CompanionCard],
  template: `
    <app-companion-card
      [companion]="companion()"
      [proficiency]="proficiency()"
      [canManage]="canManage()"
      [processing]="processing()"
      [armorAvailable]="armorAvailable()"
      (editRequested)="onEditRequested()"
      (deleteConfirmed)="onDeleteConfirmed()"
      (stressChanged)="onStressChanged($event)"
      (markArmorInstead)="onMarkArmorInstead()"
      (trainingAdded)="onTrainingAdded($event)"
      (trainingRemoved)="onTrainingRemoved($event)"
    />
  `,
})
class TestHost {
  companion = signal<CompanionApiResponse>(buildCompanion());
  proficiency = signal(2);
  canManage = signal(true);
  processing = signal(false);
  armorAvailable = signal(false);
  editRequestedCount = 0;
  deleteConfirmedCount = 0;
  lastStressChanged: number | undefined;
  markArmorInsteadCount = 0;
  lastTrainingAdded: CreateCompanionTrainingRequest | undefined;
  lastTrainingRemoved: number | undefined;

  onEditRequested(): void { this.editRequestedCount++; }
  onDeleteConfirmed(): void { this.deleteConfirmedCount++; }
  onStressChanged(v: number): void { this.lastStressChanged = v; }
  onMarkArmorInstead(): void { this.markArmorInsteadCount++; }
  onTrainingAdded(r: CreateCompanionTrainingRequest): void { this.lastTrainingAdded = r; }
  onTrainingRemoved(id: number): void { this.lastTrainingRemoved = id; }
}

describe('CompanionCard', () => {
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

  function expandCard(): void {
    el.querySelector<HTMLButtonElement>('.expandable-card__header')!.click();
    fixture.detectChanges();
  }

  it('renders the companion name', () => {
    expect(el.querySelector('.expandable-card__name')?.textContent?.trim()).toBe('Forest Wolf');
  });

  it('is collapsed by default', () => {
    expect(el.querySelector('.expandable-card__body')).toBeFalsy();
  });

  it('expands on header click', () => {
    expandCard();
    expect(el.querySelector('.expandable-card__body')).toBeTruthy();
  });

  it('does not show the out-of-scene badge when not out of scene', () => {
    expect(el.querySelector('.expandable-card__meta-badge--depleted')).toBeFalsy();
  });

  it('shows the out-of-scene badge when at max stress', () => {
    host.companion.set(buildCompanion({ outOfScene: true }));
    fixture.detectChanges();

    expect(el.querySelector('.expandable-card__meta-badge--depleted')?.textContent).toContain('Out of scene');
  });

  it('announces out-of-scene via an sr-only status region', () => {
    host.companion.set(buildCompanion({ outOfScene: true, name: 'Shadow Cat' }));
    fixture.detectChanges();

    const status = el.querySelector('[role="status"]');
    expect(status?.textContent).toContain('Shadow Cat is out of scene');
  });

  it('renders the attack line using live proficiency, not the response attackDiceCount', () => {
    host.companion.set(buildCompanion({ attackDiceCount: 99, damageDice: 'D8', damageType: 'MAGIC', attackRange: 'VERY_CLOSE' }));
    host.proficiency.set(3);
    fixture.detectChanges();
    expandCard();

    expect(el.querySelector('.companion-stats')?.textContent).toContain('3d8 mag at Very Close');
  });

  it('emits stressChanged directly when marking down (no armor prompt)', () => {
    host.companion.set(buildCompanion({ stressMarked: 1 }));
    fixture.detectChanges();
    expandCard();

    // Clicking the already-marked top box (index 0 == box 1, the only marked box) unmarks it.
    const boxes = Array.from(el.querySelectorAll<HTMLButtonElement>('.resource-box'));
    boxes[0].click();

    expect(host.lastStressChanged).toBe(0);
  });

  it('emits stressChanged directly when marking up without Armored training', () => {
    expandCard();

    const boxes = Array.from(el.querySelectorAll<HTMLButtonElement>('.resource-box'));
    boxes[0].click();

    expect(host.lastStressChanged).toBe(1);
  });

  it('offers to mark Armor instead when marking up with Armored training and Armor available', () => {
    host.companion.set(buildCompanion({ trainings: [{ id: 1, option: 'ARMORED', acquiredAtLevel: 2 }] }));
    host.armorAvailable.set(true);
    fixture.detectChanges();
    expandCard();

    const boxes = Array.from(el.querySelectorAll<HTMLButtonElement>('.resource-box'));
    boxes[0].click();
    fixture.detectChanges();

    expect(host.lastStressChanged).toBeUndefined();
    expect(el.querySelector('.armor-instead-prompt')).toBeTruthy();
  });

  it('emits markArmorInstead when the armor option is chosen', () => {
    host.companion.set(buildCompanion({ trainings: [{ id: 1, option: 'ARMORED', acquiredAtLevel: 2 }] }));
    host.armorAvailable.set(true);
    fixture.detectChanges();
    expandCard();

    el.querySelector<HTMLButtonElement>('.resource-box')!.click();
    fixture.detectChanges();
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('.armor-instead-prompt__btn'));
    buttons.find(b => b.textContent?.includes('Armor'))!.click();

    expect(host.markArmorInsteadCount).toBe(1);
    expect(host.lastStressChanged).toBeUndefined();
  });

  it('does not offer Armor instead when no Armor Slot is available', () => {
    host.companion.set(buildCompanion({ trainings: [{ id: 1, option: 'ARMORED', acquiredAtLevel: 2 }] }));
    host.armorAvailable.set(false);
    fixture.detectChanges();
    expandCard();

    el.querySelector<HTMLButtonElement>('.resource-box')!.click();

    expect(host.lastStressChanged).toBe(1);
  });

  it('renders a verbatim reminder for a Bonded training', () => {
    host.companion.set(buildCompanion({ trainings: [{ id: 1, option: 'BONDED', acquiredAtLevel: 2 }] }));
    fixture.detectChanges();
    expandCard();

    expect(el.querySelector('.companion-reminder')?.textContent).toContain('rushes to your side');
  });

  it('shows edit/delete controls for a manager', () => {
    expandCard();
    expect(el.querySelector('.companion-action-btn')).toBeTruthy();
  });

  it('hides edit/delete controls for a non-manager', () => {
    host.canManage.set(false);
    fixture.detectChanges();
    expandCard();

    expect(el.querySelector('.companion-actions')).toBeFalsy();
  });

  it('emits editRequested when Edit is clicked', () => {
    expandCard();
    el.querySelector<HTMLButtonElement>('.companion-action-btn')!.click();

    expect(host.editRequestedCount).toBe(1);
  });

  it('emits deleteConfirmed after the inline confirm flow', () => {
    expandCard();
    el.querySelector<HTMLButtonElement>('.roster-delete-btn')!.click();
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.roster-inline-confirm-btn')!.click();

    expect(host.deleteConfirmedCount).toBe(1);
  });

  it('forwards trainingAdded from the child training list', () => {
    host.companion.set(buildCompanion({ remainingByOption: { AWARE: 1 } }));
    fixture.detectChanges();
    expandCard();

    const rows = Array.from(el.querySelectorAll('.training-option'));
    const awareRow = rows.find(r => r.querySelector('.training-option__label')?.textContent === 'Aware')!;
    awareRow.querySelector<HTMLButtonElement>('.training-option__take')!.click();

    expect(host.lastTrainingAdded).toEqual({ option: 'AWARE' });
  });
});
