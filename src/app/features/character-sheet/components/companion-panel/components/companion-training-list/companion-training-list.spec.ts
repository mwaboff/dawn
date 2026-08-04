import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { CompanionTrainingList } from './companion-training-list';
import {
  CompanionExperienceApiResponse,
  CompanionTrainingApiResponse,
  CompanionTrainingOption,
  CreateCompanionTrainingRequest,
} from '../../../../../../shared/models/companion-api.model';

@Component({
  imports: [CompanionTrainingList],
  template: `
    <app-companion-training-list
      [trainings]="trainings()"
      [remainingByOption]="remainingByOption()"
      [experiences]="experiences()"
      [damageDice]="damageDice()"
      [attackRange]="attackRange()"
      [canManage]="canManage()"
      [processing]="processing()"
      (trainingAdded)="onAdded($event)"
      (trainingRemoved)="onRemoved($event)"
    />
  `,
})
class TestHost {
  trainings = signal<CompanionTrainingApiResponse[]>([]);
  remainingByOption = signal<Partial<Record<CompanionTrainingOption, number>>>({
    INTELLIGENT: 3, LIGHT_IN_THE_DARK: 1, CREATURE_COMFORT: 1, ARMORED: 1,
    VICIOUS: 3, RESILIENT: 3, BONDED: 1, AWARE: 3,
  });
  experiences = signal<CompanionExperienceApiResponse[]>([]);
  damageDice = signal('D6');
  attackRange = signal('MELEE');
  canManage = signal(true);
  processing = signal(false);
  lastAdded: CreateCompanionTrainingRequest | undefined;
  lastRemoved: number | undefined;

  onAdded(event: CreateCompanionTrainingRequest): void {
    this.lastAdded = event;
  }

  onRemoved(id: number): void {
    this.lastRemoved = id;
  }
}

describe('CompanionTrainingList', () => {
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

  it('renders all 8 training options', () => {
    expect(el.querySelectorAll('.training-option').length).toBe(8);
  });

  it('shows the remaining count for each option', () => {
    const first = el.querySelector('.training-option__remaining');
    expect(first?.textContent?.trim()).toBe('3 left');
  });

  it('disables Take when remaining is 0', () => {
    host.remainingByOption.set({ AWARE: 0 });
    fixture.detectChanges();

    const takeButtons = Array.from(el.querySelectorAll<HTMLButtonElement>('.training-option__take'));
    expect(takeButtons.every(b => b.disabled)).toBe(true);
  });

  it('immediately emits trainingAdded for an option with no sub-choice', () => {
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('.training-option__take'));
    // AWARE is the last option and needs no sub-choice.
    buttons[buttons.length - 1].click();

    expect(host.lastAdded).toEqual({ option: 'AWARE' });
  });

  it('opens a ladder picker for VICIOUS instead of emitting immediately', () => {
    const rows = Array.from(el.querySelectorAll('.training-option'));
    const viciousRow = rows.find(r => r.querySelector('.training-option__label')?.textContent === 'Vicious')!;
    viciousRow.querySelector<HTMLButtonElement>('.training-option__take')!.click();
    fixture.detectChanges();

    expect(host.lastAdded).toBeUndefined();
    expect(viciousRow.querySelectorAll('.training-pending__choice').length).toBe(2);
  });

  it('emits trainingAdded with the chosen Vicious axis', () => {
    const rows = Array.from(el.querySelectorAll('.training-option'));
    const viciousRow = rows.find(r => r.querySelector('.training-option__label')?.textContent === 'Vicious')!;
    viciousRow.querySelector<HTMLButtonElement>('.training-option__take')!.click();
    fixture.detectChanges();

    const rangeChoice = Array.from(viciousRow.querySelectorAll<HTMLButtonElement>('.training-pending__choice'))
      .find(b => b.textContent?.trim() === 'Range')!;
    rangeChoice.click();

    expect(host.lastAdded).toEqual({ option: 'VICIOUS', viciousAxis: 'RANGE' });
  });

  it('shows a blocked message for INTELLIGENT when the companion has no Experiences', () => {
    const rows = Array.from(el.querySelectorAll('.training-option'));
    const row = rows.find(r => r.querySelector('.training-option__label')?.textContent === 'Intelligent')!;
    row.querySelector<HTMLButtonElement>('.training-option__take')!.click();
    fixture.detectChanges();

    expect(row.textContent).toContain('no Experiences to bolster yet');
  });

  it('emits trainingAdded with the chosen Experience id for INTELLIGENT', () => {
    host.experiences.set([{ id: 5, companionId: 1, description: 'Tracker', modifier: 2 }]);
    fixture.detectChanges();

    const rows = Array.from(el.querySelectorAll('.training-option'));
    const row = rows.find(r => r.querySelector('.training-option__label')?.textContent === 'Intelligent')!;
    row.querySelector<HTMLButtonElement>('.training-option__take')!.click();
    fixture.detectChanges();
    row.querySelector<HTMLButtonElement>('.training-pending__choice')!.click();

    expect(host.lastAdded).toEqual({ option: 'INTELLIGENT', targetExperienceId: 5 });
  });

  it('renders already-taken trainings', () => {
    host.trainings.set([{ id: 1, option: 'AWARE', acquiredAtLevel: 2 }]);
    fixture.detectChanges();

    expect(el.querySelector('.training-taken__label')?.textContent).toContain('Aware');
  });

  it('shows the Vicious axis on a taken Vicious training', () => {
    host.trainings.set([{ id: 1, option: 'VICIOUS', viciousAxis: 'DAMAGE_DIE', acquiredAtLevel: 2 }]);
    fixture.detectChanges();

    expect(el.querySelector('.training-taken__label')?.textContent).toContain('Damage Die');
  });

  it('emits trainingRemoved when the remove button is clicked', () => {
    host.trainings.set([{ id: 7, option: 'AWARE', acquiredAtLevel: 2 }]);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.training-taken__remove')!.click();

    expect(host.lastRemoved).toBe(7);
  });

  it('hides remove buttons and take controls for a non-manager', () => {
    host.trainings.set([{ id: 7, option: 'AWARE', acquiredAtLevel: 2 }]);
    host.canManage.set(false);
    fixture.detectChanges();

    expect(el.querySelector('.training-taken__remove')).toBeFalsy();
    expect(el.querySelector('.training-option__take')).toBeFalsy();
  });

  it('greys out a Vicious ladder already at its cap rather than letting the server reject it', () => {
    host.damageDice.set('D12');
    host.attackRange.set('CLOSE');
    fixture.detectChanges();

    const vicious = Array.from(el.querySelectorAll('.training-option'))
      .find(li => li.textContent?.includes('Vicious')) as HTMLElement;
    (vicious.querySelector('.training-option__take') as HTMLButtonElement).click();
    fixture.detectChanges();

    const choices = Array.from(
      vicious.querySelectorAll('.training-pending__choice'),
    ) as HTMLButtonElement[];
    expect(choices[0].disabled).toBe(true);
    expect(choices[0].textContent).toContain('maxed');
    expect(choices[1].disabled).toBe(false);
  });

  it('disables Vicious entirely once both ladders are maxed', () => {
    host.damageDice.set('D12');
    host.attackRange.set('VERY_FAR');
    fixture.detectChanges();

    const vicious = Array.from(el.querySelectorAll('.training-option'))
      .find(li => li.textContent?.includes('Vicious')) as HTMLElement;
    const take = vicious.querySelector('.training-option__take') as HTMLButtonElement;
    expect(take.disabled).toBe(true);
  });

});
