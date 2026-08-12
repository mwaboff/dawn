import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, signal } from '@angular/core';
import { CompanionCardBeta } from './companion-card-beta';
import { CompanionCard } from '../../../../../character-sheet/components/companion-panel/components/companion-card/companion-card';
import { EntityCard } from '../../../../../../shared/components/entity-card/entity-card';
import { CompanionApiResponse } from '../../../../../../shared/models/companion-api.model';
import { CompanionClassFeatureReminder } from '../../../../../character-sheet/utils/companion-access.utils';

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
  imports: [CompanionCardBeta],
  template: `
    <app-companion-card-beta
      [companion]="companion()"
      [proficiency]="proficiency()"
      [canManage]="canManage()"
      [processing]="processing()"
      [armorAvailable]="armorAvailable()"
      [armorInsteadUnavailableReason]="armorInsteadUnavailableReason()"
      [classFeatureReminders]="classFeatureReminders()"
      (editRequested)="onEditRequested()"
      (deleteConfirmed)="onDeleteConfirmed()"
      (stressChanged)="onStressChanged($event)"
      (markArmorInstead)="onMarkArmorInstead()"
    />
  `,
})
class TestHost {
  companion = signal<CompanionApiResponse>(buildCompanion());
  proficiency = signal(2);
  canManage = signal(true);
  processing = signal(false);
  armorAvailable = signal(false);
  armorInsteadUnavailableReason = signal<string | null>(null);
  classFeatureReminders = signal<CompanionClassFeatureReminder[]>([]);
  editRequestedCount = 0;
  deleteConfirmedCount = 0;
  lastStressChanged: number | undefined;
  markArmorInsteadCount = 0;

  onEditRequested(): void { this.editRequestedCount++; }
  onDeleteConfirmed(): void { this.deleteConfirmedCount++; }
  onStressChanged(v: number): void { this.lastStressChanged = v; }
  onMarkArmorInstead(): void { this.markArmorInsteadCount++; }
}

describe('CompanionCardBeta', () => {
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

  function cardBeta(): CompanionCardBeta {
    return fixture.debugElement.query(By.directive(CompanionCardBeta)).componentInstance;
  }

  it('extends CompanionCard, inheriting its expand/edit/delete/stress state', () => {
    expect(cardBeta()).toBeInstanceOf(CompanionCard);
  });

  it('maps the companion onto EntityCardData with identity, headline and description', () => {
    host.companion.set(buildCompanion({ attackDiceCount: 1, damageDice: 'D6', damageType: 'PHYSICAL', attackRange: 'MELEE' }));
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card();
    expect(card).toMatchObject({
      id: 1,
      name: 'Forest Wolf',
      cardType: 'companion',
      headline: '2d6 phy at Melee',
      description: 'A loyal wolf',
    });
  });

  it('carries the Stress count as a live-state badge of "marked/max"', () => {
    host.companion.set(buildCompanion({ stressMarked: 1, stressMax: 3 }));
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card();
    expect(card.badges).toContainEqual({ label: 'Stress', value: '1/3' });
  });

  it('puts Evasion in the stats ledger as a label/value pair, since it is a number', () => {
    const card = fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card();

    expect(card.stats).toEqual([{ label: 'Evasion', value: '12' }]);
  });

  it('keeps meta to the attack line alone, so Evasion is not stated twice', () => {
    const card = fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card();

    expect(card.meta).toEqual([{ label: 'Attack', value: '2d6 phy at Melee' }]);
  });

  it('renders the Evasion stat cell with its label above the value, not baked into it', () => {
    const cell = el.querySelector('.entity-card__stat')!;

    expect([cell.querySelector('.entity-card__stat-label')?.textContent?.trim(), cell.querySelector('.entity-card__stat-value')?.textContent?.trim()])
      .toEqual(['Evasion', '12']);
  });

  it('adds an "Out of scene" badge only when the companion is out of scene', () => {
    const card = () => fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card();
    expect(card().badges?.some((b: { label: string }) => b.label === 'Out of scene')).toBe(false);

    host.companion.set(buildCompanion({ outOfScene: true }));
    fixture.detectChanges();

    expect(card().badges).toContainEqual({ label: 'Out of scene' });
  });

  it('folds experiences, taken Training and reminders into card().features', () => {
    host.companion.set(buildCompanion({
      experiences: [{ id: 1, companionId: 1, description: 'Loves the outdoors', modifier: 2 }],
      trainings: [{ id: 1, option: 'AWARE', acquiredAtLevel: 2 }, { id: 2, option: 'VICIOUS', viciousAxis: 'DAMAGE_DIE', acquiredAtLevel: 2 }],
    }));
    host.classFeatureReminders.set([{ label: 'Battle-Bonded', text: 'A Beastbound Specialization reminder.' }]);
    fixture.detectChanges();

    const features = fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card().features;
    expect(features).toContainEqual({ name: '+2', description: 'Loves the outdoors' });
    expect(features).toContainEqual({ name: 'Battle-Bonded', description: 'A Beastbound Specialization reminder.' });
  });

  it('gives each taken Training its own feature carrying the printed rules text', () => {
    host.companion.set(buildCompanion({
      trainings: [{ id: 1, option: 'AWARE', acquiredAtLevel: 2 }, { id: 2, option: 'VICIOUS', viciousAxis: 'DAMAGE_DIE', acquiredAtLevel: 2 }],
    }));
    fixture.detectChanges();

    const features = fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card().features;
    expect(features).toContainEqual({
      name: 'Aware — Taken 1 of 3',
      description: 'Your companion gains a permanent +2 bonus to their Evasion.',
    });
    expect(features).toContainEqual({
      name: 'Vicious — Taken 1 of 3',
      description: "Increase your companion's damage dice or range by one step (d6 to d8, Close to Far, etc.).",
      tags: ['Damage Die'],
    });
  });

  it('collapses a repeated Training into one feature carrying its count', () => {
    host.companion.set(buildCompanion({
      trainings: [
        { id: 1, option: 'VICIOUS', viciousAxis: 'DAMAGE_DIE', acquiredAtLevel: 2 },
        { id: 2, option: 'VICIOUS', viciousAxis: 'RANGE', acquiredAtLevel: 3 },
      ],
    }));
    fixture.detectChanges();

    const features = fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card().features;
    const vicious = features.filter((feature: { name?: string }) => feature.name?.startsWith('Vicious'));
    expect(vicious).toHaveLength(1);
    expect(vicious[0].name).toBe('Vicious — Taken 2 of 3');
    expect(vicious[0].tags).toEqual(['Damage Die', 'Range']);
  });

  /** A once-only option has nothing to count, so it carries no "1 of 1". */
  it('leaves a single-pick Training unmarked', () => {
    host.companion.set(buildCompanion({ trainings: [{ id: 1, option: 'BONDED', acquiredAtLevel: 2 }] }));
    fixture.detectChanges();

    const features = fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card().features;
    expect(features.some((feature: { name?: string }) => feature.name === 'Bonded')).toBe(true);
  });

  it('places the Stress ResourceTracker and armor-instead prompt in [card-controls]', () => {
    host.companion.set(buildCompanion({ trainings: [{ id: 1, option: 'ARMORED', acquiredAtLevel: 2 }] }));
    host.armorAvailable.set(true);
    fixture.detectChanges();

    const controls = el.querySelector('.entity-card__controls')!;
    expect(controls.querySelector('app-resource-tracker')).toBeTruthy();

    controls.querySelector<HTMLButtonElement>('.resource-box')!.click();
    fixture.detectChanges();

    expect(controls.querySelector('.armor-instead-prompt')).toBeTruthy();
  });

  it('keeps the Stress tracker reachable without expanding the card', () => {
    expect(el.querySelector('.entity-card__clip app-resource-tracker')).toBeFalsy();
    expect(el.querySelector('.entity-card__controls app-resource-tracker')).toBeTruthy();
  });

  it('places Edit and the InlineDeleteConfirm in [card-actions] for a manager', () => {
    const actions = el.querySelector('.entity-card__actions')!;
    expect(actions.querySelector('[aria-label^="Edit"]')).toBeTruthy();
    expect(actions.querySelector('app-inline-delete-confirm')).toBeTruthy();
  });

  it('omits [card-actions] content for a non-manager', () => {
    host.canManage.set(false);
    fixture.detectChanges();

    expect(el.querySelector('.entity-card__actions')!.children.length).toBe(0);
  });

  it('forwards a Stress box click to stressChanged via the inherited handler', () => {
    el.querySelector<HTMLButtonElement>('.resource-box')!.click();

    expect(host.lastStressChanged).toBe(1);
  });

  it('emits markArmorInstead via the inherited handler when the armor option is chosen', () => {
    host.companion.set(buildCompanion({ trainings: [{ id: 1, option: 'ARMORED', acquiredAtLevel: 2 }] }));
    host.armorAvailable.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.resource-box')!.click();
    fixture.detectChanges();
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('.armor-instead-prompt__btn'));
    buttons.find(b => b.textContent?.includes('Armor'))!.click();

    expect(host.markArmorInsteadCount).toBe(1);
    expect(host.lastStressChanged).toBeUndefined();
  });

  describe('restricted equipped armor (SRD vs. paid-expansion content gating)', () => {
    function armoredCompanion(): CompanionApiResponse {
      return buildCompanion({ trainings: [{ id: 1, option: 'ARMORED', acquiredAtLevel: 2 }] });
    }

    it('still offers the choice (not silently skipped) when armor is restricted', () => {
      host.companion.set(armoredCompanion());
      host.armorAvailable.set(false);
      host.armorInsteadUnavailableReason.set('Armor score unavailable.');
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.resource-box')!.click();
      fixture.detectChanges();

      expect(host.lastStressChanged).toBeUndefined();
      expect(el.querySelector('.armor-instead-prompt')).toBeTruthy();
    });

    it('disables the Mark Armor Instead button and labels it with the reason, via the inherited handler', () => {
      host.companion.set(armoredCompanion());
      host.armorAvailable.set(false);
      host.armorInsteadUnavailableReason.set('Armor score unavailable.');
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.resource-box')!.click();
      fixture.detectChanges();
      const btn = Array.from(el.querySelectorAll<HTMLButtonElement>('.armor-instead-prompt__btn'))
        .find(b => b.textContent?.includes('Armor'))!;

      expect(btn.disabled).toBe(true);
      expect(btn.getAttribute('aria-label')).toBe('Armor score unavailable.');
      btn.click();
      expect(host.markArmorInsteadCount).toBe(0);
    });

    it('leaves the button enabled once armor is no longer restricted', () => {
      host.companion.set(armoredCompanion());
      host.armorAvailable.set(true);
      host.armorInsteadUnavailableReason.set(null);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.resource-box')!.click();
      fixture.detectChanges();
      const btn = Array.from(el.querySelectorAll<HTMLButtonElement>('.armor-instead-prompt__btn'))
        .find(b => b.textContent?.includes('Armor'))!;

      expect(btn.disabled).toBe(false);
    });
  });

  it('emits editRequested via the inherited handler when Edit is clicked', () => {
    const editBtn = el.querySelector<HTMLButtonElement>('.entity-card__actions [aria-label^="Edit"]')!;
    editBtn.click();

    expect(host.editRequestedCount).toBe(1);
  });

  it('emits deleteConfirmed via the inherited handler after the InlineDeleteConfirm flow', () => {
    el.querySelector<HTMLButtonElement>('.roster-delete-btn')!.click();
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.roster-inline-confirm-btn')!.click();

    expect(host.deleteConfirmedCount).toBe(1);
  });
});
