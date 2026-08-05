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

  it('offers no way to take or remove a training -- both belong to the level-up wizard', () => {
    host.trainings.set([{ id: 7, option: 'AWARE', acquiredAtLevel: 2 }]);
    fixture.detectChanges();

    expect(el.querySelector('button')).toBeFalsy();
  });
});
