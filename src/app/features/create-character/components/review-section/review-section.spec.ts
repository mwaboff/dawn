import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { ReviewSection } from './review-section';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { TraitAssignments } from '../../models/trait.model';
import { Experience } from '../../models/experience.model';

function makeCard(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 1,
    name: 'Test Card',
    description: 'A test card',
    cardType: 'class',
    ...overrides,
  };
}

function makeClassCard(evasion = 8, hp = 6): CardData {
  return makeCard({
    cardType: 'class',
    name: 'Warrior',
    metadata: { startingEvasion: evasion, startingHitPoints: hp },
  });
}

function makeTraits(overrides: Partial<TraitAssignments> = {}): TraitAssignments {
  return {
    agility: 2,
    strength: 1,
    finesse: 1,
    instinct: 0,
    presence: 0,
    knowledge: -1,
    ...overrides,
  };
}

@Component({
  template: `
    <app-review-section
      [classCard]="classCard"
      [subclassCard]="subclassCard"
      [ancestryCard]="ancestryCard"
      [communityCard]="communityCard"
      [traits]="traits"
      [armor]="armor"
      [experiences]="experiences"
      [domainCards]="domainCards"
      [submitting]="submitting"
      [submitError]="submitError"
      (submitClicked)="onSubmitClicked()"
    />
  `,
  imports: [ReviewSection],
})
class TestHost {
  classCard = makeClassCard();
  subclassCard = makeCard({ cardType: 'subclass', name: 'Shadow', subtitle: 'Midnight / Bone' });
  ancestryCard = makeCard({ cardType: 'ancestry', name: 'Elf' });
  communityCard = makeCard({ cardType: 'community', name: 'Nomadic' });
  traits = makeTraits();
  armor: CardData | null = null;
  experiences: Experience[] = [{ name: 'Acrobatics', modifier: 2 }];
  domainCards: CardData[] = [
    makeCard({ id: 10, cardType: 'domain', name: 'Shadow Step', subtitle: 'Midnight' }),
    makeCard({ id: 11, cardType: 'domain', name: 'Bone Cage', subtitle: 'Bone' }),
  ];
  submitting = false;
  submitError: string | null = null;
  submitClickCount = 0;
  onSubmitClicked(): void { this.submitClickCount++; }
}

describe('ReviewSection', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-review-section')).toBeTruthy();
  });

  it('should display class name', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string)).toContain('Warrior');
  });

  it('should display subclass name and domains', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Shadow');
    expect(text).toContain('Midnight / Bone');
  });

  it('should display ancestry and community names', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Elf');
    expect(text).toContain('Nomadic');
  });

  it('should display base evasion from class metadata', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string)).toContain('8');
  });

  it('should display hit points from class metadata', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string)).toContain('6');
  });

  it('should display trait modifier with sign', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('+2');
    expect(text).toContain('-1');
  });

  it('should display completed experiences', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string)).toContain('Acrobatics');
  });

  it('should not display incomplete experiences', () => {
    host.experiences = [{ name: '', modifier: null }];
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string)).toContain('No experiences added');
  });

  it('should display domain card names', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Shadow Step');
    expect(text).toContain('Bone Cage');
  });

  it('should show evasion with equipment modifier when different', () => {
    host.armor = makeCard({
      cardType: 'armor',
      name: 'Light Armor',
      metadata: {
        baseScore: 2,
        modifiers: [{ target: 'EVASION', operation: 'ADD', value: 1 }],
      },
    });
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string)).toContain('with equipment');
  });

  it('should display default armor score 0 when no armor selected', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string)).toContain('0');
  });

  it('should display default major threshold 3 when no armor', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string)).toContain('3+');
  });

  it('should display default severe threshold 6 when no armor', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement.textContent as string)).toContain('6+');
  });

  describe('Submit Button', () => {
    it('should render the submit button', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.submit-button') as HTMLButtonElement;
      expect(button).toBeTruthy();
    });

    it('should show "Create Character" text when not submitting', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.submit-button') as HTMLButtonElement;
      expect(button.textContent?.trim()).toContain('Create Character');
    });

    it('should show "Creating Character..." text when submitting', () => {
      host.submitting = true;
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.submit-button') as HTMLButtonElement;
      expect(button.textContent?.trim()).toContain('Creating Character...');
    });

    it('should disable the button when submitting', () => {
      host.submitting = true;
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.submit-button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should not disable the button when not submitting', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.submit-button') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });

    it('should emit submitClicked when button is clicked', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.submit-button') as HTMLButtonElement;
      button.click();
      expect(host.submitClickCount).toBe(1);
    });

    it('should display submitError message when provided', () => {
      host.submitError = 'Failed to create character. Please try again.';
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('.submit-error') as HTMLElement;
      expect(error?.textContent?.trim()).toContain('Failed to create character');
    });

    it('should not display error element when submitError is null', () => {
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('.submit-error');
      expect(error).toBeNull();
    });
  });
});
