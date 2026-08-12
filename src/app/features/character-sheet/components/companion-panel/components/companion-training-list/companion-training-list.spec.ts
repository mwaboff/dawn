import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { CompanionTrainingList } from './companion-training-list';
import { CompanionTrainingApiResponse } from '../../../../../../shared/models/companion-api.model';

@Component({
  imports: [CompanionTrainingList],
  template: `<app-companion-training-list [trainings]="trainings()" />`,
})
class TestHost {
  trainings = signal<CompanionTrainingApiResponse[]>([]);
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

  it('renders nothing when the companion has no trainings', () => {
    expect(el.querySelector('.training-list')).toBeFalsy();
  });

  it('renders one item per taken training', () => {
    host.trainings.set([
      { id: 1, option: 'AWARE', acquiredAtLevel: 2 },
      { id: 2, option: 'RESILIENT', acquiredAtLevel: 3 },
    ]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.training-taken__item').length).toBe(2);
  });

  it('labels a taken training with its display name', () => {
    host.trainings.set([{ id: 1, option: 'AWARE', acquiredAtLevel: 2 }]);
    fixture.detectChanges();

    expect(el.querySelector('.training-taken__item')?.textContent).toContain('Aware');
  });

  it('shows the Vicious axis on a taken Vicious training', () => {
    host.trainings.set([{ id: 1, option: 'VICIOUS', viciousAxis: 'DAMAGE_DIE', acquiredAtLevel: 2 }]);
    fixture.detectChanges();

    expect(el.querySelector('.training-taken__item')?.textContent).toContain('Damage Die');
  });

  it('shows the printed rules text under the name, the way features render elsewhere', () => {
    host.trainings.set([{ id: 1, option: 'AWARE', acquiredAtLevel: 2 }]);
    fixture.detectChanges();

    expect(el.querySelector('.training-taken__effect')?.textContent).toContain(
      'Your companion gains a permanent +2 bonus to their Evasion.',
    );
  });

  it('collapses a training taken twice into one item rather than repeating its rules text', () => {
    host.trainings.set([
      { id: 1, option: 'VICIOUS', viciousAxis: 'DAMAGE_DIE', acquiredAtLevel: 2 },
      { id: 2, option: 'VICIOUS', viciousAxis: 'RANGE', acquiredAtLevel: 3 },
    ]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.training-taken__item').length).toBe(1);
    expect(el.querySelector('.training-taken__axes')?.textContent).toContain('Damage Die, Range');
  });

  it('counts the picks against the printed maximum', () => {
    host.trainings.set([
      { id: 1, option: 'VICIOUS', viciousAxis: 'DAMAGE_DIE', acquiredAtLevel: 2 },
      { id: 2, option: 'VICIOUS', viciousAxis: 'RANGE', acquiredAtLevel: 3 },
    ]);
    fixture.detectChanges();

    expect(el.querySelector('.training-taken__count')?.textContent).toContain('Taken 2 of 3');
  });

  /**
   * The count is plain text, never a row of filled/hollow marks: that pattern means "click to
   * toggle" everywhere else on this sheet, and Training is not editable here.
   */
  it('draws no filled/hollow marks that could be mistaken for a tracker', () => {
    host.trainings.set([{ id: 1, option: 'AWARE', acquiredAtLevel: 2 }]);
    fixture.detectChanges();

    expect(el.querySelector('.resource-box')).toBeFalsy();
    expect(el.querySelector('[class*="pip"]')).toBeFalsy();
  });

  /** A once-only option has nothing to count, so it gets no "1 of 1" noise. */
  it('shows no count for a training that can only be taken once', () => {
    host.trainings.set([{ id: 1, option: 'BONDED', acquiredAtLevel: 2 }]);
    fixture.detectChanges();

    expect(el.querySelector('.training-taken__count')).toBeFalsy();
  });

  it('orders items by the printed sheet rather than by when they were acquired', () => {
    host.trainings.set([
      { id: 1, option: 'AWARE', acquiredAtLevel: 2 },
      { id: 2, option: 'INTELLIGENT', acquiredAtLevel: 3 },
    ]);
    fixture.detectChanges();

    const names = [...el.querySelectorAll('.training-taken__name')].map(n => n.textContent?.trim());
    expect(names).toEqual(['Intelligent', 'Aware']);
  });

  it('offers no way to take or remove a training -- both belong to the level-up wizard', () => {
    host.trainings.set([{ id: 7, option: 'AWARE', acquiredAtLevel: 2 }]);
    fixture.detectChanges();

    expect(el.querySelector('button')).toBeFalsy();
  });
});
