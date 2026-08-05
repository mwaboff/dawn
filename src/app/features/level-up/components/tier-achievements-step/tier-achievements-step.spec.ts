import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { CompanionExperienceTarget, TierAchievementsStep } from './tier-achievements-step';
import { CompanionExperienceGrant } from '../../models/level-up-api.model';

@Component({
  template: `
    <app-tier-achievements-step
      [nextLevel]="nextLevel()"
      [currentTier]="currentTier()"
      [nextTier]="nextTier()"
      [initialDescription]="initialDescription()"
      [companionExperienceTargets]="companionExperienceTargets()"
      [initialCompanionExperiences]="initialCompanionExperiences()"
      (experienceDescriptionChanged)="onDescriptionChanged($event)"
      (companionExperiencesChanged)="onCompanionExperiencesChanged($event)"
    />
  `,
  imports: [TierAchievementsStep],
})
class TestHost {
  nextLevel = signal(2);
  currentTier = signal(1);
  nextTier = signal(2);
  initialDescription = signal('');
  companionExperienceTargets = signal<CompanionExperienceTarget[]>([]);
  initialCompanionExperiences = signal<CompanionExperienceGrant[]>([]);
  lastEmittedDescription: string | null = null;
  lastEmittedCompanionExperiences: CompanionExperienceGrant[] | null = null;

  onDescriptionChanged(value: string): void {
    this.lastEmittedDescription = value;
  }

  onCompanionExperiencesChanged(value: CompanionExperienceGrant[]): void {
    this.lastEmittedCompanionExperiences = value;
  }
}

describe('TierAchievementsStep', () => {
  let hostFixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHost);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    const el = hostFixture.nativeElement.querySelector('app-tier-achievements-step');
    expect(el).toBeTruthy();
  });

  it('should render tier info in the banner', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.info-banner__title');
    const subtitle = compiled.querySelector('.info-banner__subtitle');

    expect(title?.textContent).toContain('Entering Tier 2');
    expect(subtitle?.textContent).toContain('Level 1');
    expect(subtitle?.textContent).toContain('Level 2');
  });

  it('should render proficiency and experience achievements', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.achievement-item');

    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].textContent).toContain('+1 Proficiency');
    expect(items[1].textContent).toContain('New Experience (+2)');
  });

  it('should show marked traits cleared for level 5', () => {
    host.nextLevel.set(5);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.achievement-item');
    const texts = Array.from(items).map(i => i.textContent);

    expect(texts.some(t => t?.includes('Marked Traits Cleared'))).toBe(true);
  });

  it('should show marked traits cleared for level 8', () => {
    host.nextLevel.set(8);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.achievement-item');
    const texts = Array.from(items).map(i => i.textContent);

    expect(texts.some(t => t?.includes('Marked Traits Cleared'))).toBe(true);
  });

  it('should not show marked traits cleared for level 2', () => {
    host.nextLevel.set(2);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.achievement-item');
    const texts = Array.from(items).map(i => i.textContent);

    expect(texts.some(t => t?.includes('Marked Traits Cleared'))).toBe(false);
  });

  it('should emit experienceDescriptionChanged when input changes', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#new-experience') as HTMLInputElement;

    input.value = 'Saved the village';
    input.dispatchEvent(new Event('input'));
    hostFixture.detectChanges();

    expect(host.lastEmittedDescription).toBe('Saved the village');
  });

  it('should pre-fill input with initialDescription', async () => {
    host.initialDescription.set('Pre-existing experience');
    hostFixture.detectChanges();

    await TestBed.createComponent(TestHost);

    const freshFixture = TestBed.createComponent(TestHost);
    freshFixture.componentInstance.initialDescription.set('Pre-existing experience');
    freshFixture.detectChanges();

    const compiled = freshFixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#new-experience') as HTMLInputElement;

    expect(input.value).toBe('Pre-existing experience');
  });

  it('should render the experience input with label and hint', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const label = compiled.querySelector('.experience-label');
    const hint = compiled.querySelector('.experience-hint');
    const input = compiled.querySelector('#new-experience');

    expect(label?.textContent).toContain('New Experience Description');
    expect(hint?.textContent).toContain('+2 modifier');
    expect(input).toBeTruthy();
  });

  describe('companion experience targets', () => {
    it('renders no companion rows by default', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('.experience-input-group').length).toBe(1);
    });

    it('renders one input row per companion target, labeled with the companion name', () => {
      host.companionExperienceTargets.set([{ companionId: 7, name: 'Rufus' }, { companionId: 9, name: 'Whiskers' }]);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('.experience-input-group').length).toBe(3);
      expect(compiled.querySelector('#companion-experience-7')).toBeTruthy();
      expect(compiled.querySelector('#companion-experience-9')).toBeTruthy();
      expect(compiled.textContent).toContain("Rufus's New Experience");
    });

    it('emits the full companion experience array on input, keyed by companionId', () => {
      host.companionExperienceTargets.set([{ companionId: 7, name: 'Rufus' }]);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const input = compiled.querySelector('#companion-experience-7') as HTMLInputElement;
      input.value = 'Learned to trust again';
      input.dispatchEvent(new Event('input'));
      hostFixture.detectChanges();

      expect(host.lastEmittedCompanionExperiences).toEqual([{ companionId: 7, description: 'Learned to trust again' }]);
    });

    it('pre-fills companion experience inputs from initialCompanionExperiences', () => {
      // ngOnInit only seeds once, at construction -- must set inputs on a FRESH fixture before
      // its first detectChanges(), same as the "pre-fill input with initialDescription" case above.
      const freshFixture = TestBed.createComponent(TestHost);
      freshFixture.componentInstance.companionExperienceTargets.set([{ companionId: 7, name: 'Rufus' }]);
      freshFixture.componentInstance.initialCompanionExperiences.set([{ companionId: 7, description: 'Already typed' }]);
      freshFixture.detectChanges();

      const compiled = freshFixture.nativeElement as HTMLElement;
      const input = compiled.querySelector('#companion-experience-7') as HTMLInputElement;
      expect(input.value).toBe('Already typed');
    });
  });
});
