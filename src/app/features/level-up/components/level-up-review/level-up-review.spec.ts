import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { LevelUpReview } from './level-up-review';
import { AdvancementChoice, DomainCardTradeRequest, LevelUpOptionsResponse } from '../../models/level-up-api.model';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';

function buildLevelUpOptions(overrides: Partial<LevelUpOptionsResponse> = {}): LevelUpOptionsResponse {
  return {
    currentLevel: 1,
    nextLevel: 2,
    currentTier: 1,
    nextTier: 1,
    tierTransition: false,
    availableAdvancements: [],
    domainCardLevelCap: null,
    accessibleDomainIds: [1, 2],
    equippedDomainCardCount: 2,
    maxEquippedDomainCards: 5,
    ...overrides,
  };
}

function buildCardData(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 42,
    name: 'Fireball',
    description: 'A blazing orb of flame',
    cardType: 'domain',
    ...overrides,
  };
}

@Component({
  template: `
    <app-level-up-review
      [levelUpOptions]="levelUpOptions()"
      [advancements]="advancements()"
      [newExperienceDescription]="newExperienceDescription()"
      [selectedDomainCards]="selectedDomainCards()"
      [equipNewDomainCard]="equipNewDomainCard()"
      [trades]="trades()"
      [submitting]="submitting()"
      [submitError]="submitError()"
      (submitClicked)="onSubmitClicked()"
    />
  `,
  imports: [LevelUpReview],
})
class TestHost {
  levelUpOptions = signal<LevelUpOptionsResponse>(buildLevelUpOptions());
  advancements = signal<AdvancementChoice[]>([]);
  newExperienceDescription = signal('');
  selectedDomainCards = signal<CardData[]>([]);
  equipNewDomainCard = signal(false);
  trades = signal<DomainCardTradeRequest[]>([]);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  submitClickedCount = 0;

  onSubmitClicked(): void {
    this.submitClickedCount++;
  }
}

describe('LevelUpReview', () => {
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
    const el = hostFixture.nativeElement.querySelector('app-level-up-review');
    expect(el).toBeTruthy();
  });

  it('should render level transition info', () => {
    host.levelUpOptions.set(buildLevelUpOptions({ currentLevel: 3, nextLevel: 4 }));
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const subtitle = compiled.querySelector('.review-banner__subtitle');

    expect(subtitle?.textContent).toContain('Level 3');
    expect(subtitle?.textContent).toContain('Level 4');
  });

  it('should render tier transition info when tierTransition is true', () => {
    host.levelUpOptions.set(buildLevelUpOptions({
      currentLevel: 4,
      nextLevel: 5,
      currentTier: 1,
      nextTier: 2,
      tierTransition: true,
    }));
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const tier = compiled.querySelector('.review-banner__tier');

    expect(tier).toBeTruthy();
    expect(tier?.textContent).toContain('Tier 1');
    expect(tier?.textContent).toContain('Tier 2');
  });

  it('should not render tier info when tierTransition is false', () => {
    host.levelUpOptions.set(buildLevelUpOptions({ tierTransition: false }));
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const tier = compiled.querySelector('.review-banner__tier');
    expect(tier).toBeNull();
  });

  it('should render tier achievements section for tier transition', () => {
    host.levelUpOptions.set(buildLevelUpOptions({ tierTransition: true }));
    host.newExperienceDescription.set('Defeated the dragon');
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const sectionTitles = compiled.querySelectorAll('.review-section__title');
    const titlesText = Array.from(sectionTitles).map(t => t.textContent?.trim());

    expect(titlesText).toContain('Tier Achievements');

    const items = compiled.querySelectorAll('.review-item__value');
    const itemsText = Array.from(items).map(i => i.textContent?.trim());
    expect(itemsText.some(t => t?.includes('Defeated the dragon'))).toBe(true);
    expect(itemsText.some(t => t?.includes('+1'))).toBe(true);
  });

  it('should not render tier achievements section when not a tier transition', () => {
    host.levelUpOptions.set(buildLevelUpOptions({ tierTransition: false }));
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const sectionTitles = compiled.querySelectorAll('.review-section__title');
    const titlesText = Array.from(sectionTitles).map(t => t.textContent?.trim());

    expect(titlesText).not.toContain('Tier Achievements');
  });

  it('should render advancement summaries', () => {
    host.advancements.set([
      { type: 'GAIN_HP' },
      { type: 'BOOST_TRAITS', traits: ['AGILITY', 'STRENGTH'] },
    ]);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.review-item');
    const allText = Array.from(items).map(i => i.textContent);

    expect(allText.some(t => t?.includes('+1 Hit Points'))).toBe(true);
    expect(allText.some(t => t?.includes('Boost Traits'))).toBe(true);
    expect(allText.some(t => t?.includes('AGILITY, STRENGTH'))).toBe(true);
  });

  it('should render domain card name', () => {
    host.selectedDomainCards.set([buildCardData({ name: 'Fireball' })]);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.review-item__value');
    const texts = Array.from(items).map(i => i.textContent?.trim());

    expect(texts.some(t => t?.includes('Fireball'))).toBe(true);
  });

  it('should show (none selected) when no domain card is selected', () => {
    host.selectedDomainCards.set([]);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.review-item__value');
    const texts = Array.from(items).map(i => i.textContent?.trim());

    expect(texts.some(t => t?.includes('(none selected)'))).toBe(true);
  });

  it('should show Equipped badge when equipNewDomainCard is true', () => {
    host.selectedDomainCards.set([buildCardData()]);
    host.equipNewDomainCard.set(true);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.review-item__badge');

    expect(badge).toBeTruthy();
    expect(badge?.textContent?.trim()).toBe('Equipped');
  });

  it('should not show Equipped badge when equipNewDomainCard is false', () => {
    host.selectedDomainCards.set([buildCardData()]);
    host.equipNewDomainCard.set(false);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.review-item__badge');
    expect(badge).toBeNull();
  });

  it('should render trades section when trades are provided', () => {
    host.trades.set([
      { tradeOutCardIds: [1, 2], tradeInCardIds: [3], equipTradedInCardIds: [] },
    ]);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const sectionTitles = compiled.querySelectorAll('.review-section__title');
    const titlesText = Array.from(sectionTitles).map(t => t.textContent?.trim());

    expect(titlesText).toContain('Domain Card Trades');

    const items = compiled.querySelectorAll('.review-item__value');
    const texts = Array.from(items).map(i => i.textContent?.trim());
    expect(texts.some(t => t?.includes('2 out / 1 in'))).toBe(true);
  });

  it('should not render trades section when trades are empty', () => {
    host.trades.set([]);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const sectionTitles = compiled.querySelectorAll('.review-section__title');
    const titlesText = Array.from(sectionTitles).map(t => t.textContent?.trim());

    expect(titlesText).not.toContain('Domain Card Trades');
  });

  it('should emit submitClicked when submit button is clicked', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const btn = compiled.querySelector('.submit-btn') as HTMLButtonElement;

    btn.click();
    expect(host.submitClickedCount).toBe(1);
  });

  it('should not emit submitClicked when submitting', () => {
    host.submitting.set(true);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const btn = compiled.querySelector('.submit-btn') as HTMLButtonElement;

    btn.click();
    expect(host.submitClickedCount).toBe(0);
  });

  it('should disable submit button when submitting', () => {
    host.submitting.set(true);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const btn = compiled.querySelector('.submit-btn') as HTMLButtonElement;

    expect(btn.disabled).toBe(true);
  });

  it('should show "Leveling Up..." text when submitting', () => {
    host.submitting.set(true);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const btn = compiled.querySelector('.submit-btn');

    expect(btn?.textContent?.trim()).toBe('Leveling Up...');
  });

  it('should show "Level Up!" text when not submitting', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const btn = compiled.querySelector('.submit-btn');

    expect(btn?.textContent?.trim()).toBe('Level Up!');
  });

  it('should display error message when submitError is set', () => {
    host.submitError.set('Something went wrong');
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const error = compiled.querySelector('.review-error');

    expect(error).toBeTruthy();
    expect(error?.textContent?.trim()).toBe('Something went wrong');
    expect(error?.getAttribute('role')).toBe('alert');
  });

  it('should not display error message when submitError is null', () => {
    host.submitError.set(null);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const error = compiled.querySelector('.review-error');
    expect(error).toBeNull();
  });
});
