import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { AdversaryCard } from './adversary-card';
import { AdversaryData } from './adversary-card.model';

const MOCK_ADVERSARY: AdversaryData = {
  id: 1,
  name: 'Goblin Scout',
  tier: 1,
  adversaryType: 'MINION',
  difficulty: 10,
  hitPointMax: 3,
  stressMax: 2,
  evasion: 12,
  majorThreshold: 5,
  severeThreshold: 10,
  attackModifier: 3,
  weaponName: 'Short Bow',
  attackRange: 'Far',
  damage: { notation: '1d6+1', damageType: 'phy' },
  motivesAndTactics: 'Flee when outnumbered.',
  features: [
    { name: 'Sneak Attack', description: 'Deal extra damage from hiding.' },
  ],
  description: 'A quick and cowardly goblin.',
};

const MINIMAL_ADVERSARY: AdversaryData = {
  id: 2,
  name: 'Shadow',
  tier: 2,
  adversaryType: 'BRUISER',
};

@Component({
  imports: [AdversaryCard],
  template: `
    <app-adversary-card
      [adversary]="adversary()"
      [layout]="layout()"
      [collapsibleFeatures]="collapsibleFeatures()"
    />
  `,
})
class TestHost {
  adversary = signal<AdversaryData>(MOCK_ADVERSARY);
  layout = signal<'default' | 'wide'>('default');
  collapsibleFeatures = signal(false);
}

describe('AdversaryCard', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    const card = fixture.nativeElement.querySelector('.adversary-card');
    expect(card).toBeTruthy();
  });

  it('should render the adversary name', () => {
    const name = fixture.nativeElement.querySelector('.adversary-card__name');
    expect(name.textContent.trim()).toBe('Goblin Scout');
  });

  it('should render the adversary type as the primary subtitle', () => {
    const subtitle = fixture.nativeElement.querySelector('.adversary-card__subtitle:not(.adversary-card__subtitle--secondary)');
    expect(subtitle.textContent.trim()).toBe('MINION');
  });

  it('should render the tier as the secondary subtitle (Tier 1)', () => {
    const tier = fixture.nativeElement.querySelector('.adversary-card__subtitle--secondary');
    expect(tier.textContent.trim()).toBe('Tier 1');
  });

  it('should render tier as Tier 2 for tier 2', () => {
    host.adversary.set({ ...MOCK_ADVERSARY, tier: 2 });
    fixture.detectChanges();

    const tier = fixture.nativeElement.querySelector('.adversary-card__subtitle--secondary');
    expect(tier.textContent.trim()).toBe('Tier 2');
  });

  it('should have aria-label with name and type', () => {
    const card = fixture.nativeElement.querySelector('.adversary-card');
    expect(card.getAttribute('aria-label')).toBe('Goblin Scout, MINION adversary');
  });

  describe('Stat Blocks', () => {
    it('should render HP stat block when hitPointMax is provided', () => {
      const stats = Array.from<Element>(fixture.nativeElement.querySelectorAll('.adversary-card__stat'));
      const labels = stats.map(s =>
        (s as HTMLElement).querySelector('.adversary-card__stat-label')?.textContent?.trim()
      );
      expect(labels).toContain('HP');
    });

    it('should render Stress stat block when stressMax is provided', () => {
      const stats = Array.from<Element>(fixture.nativeElement.querySelectorAll('.adversary-card__stat'));
      const labels = stats.map(s =>
        (s as HTMLElement).querySelector('.adversary-card__stat-label')?.textContent?.trim()
      );
      expect(labels).toContain('Stress');
    });

    it('should render Evasion stat block when evasion is provided', () => {
      const stats = Array.from<Element>(fixture.nativeElement.querySelectorAll('.adversary-card__stat'));
      const labels = stats.map(s =>
        (s as HTMLElement).querySelector('.adversary-card__stat-label')?.textContent?.trim()
      );
      expect(labels).toContain('Evasion');
    });

    it('should render Difficulty stat block when difficulty is provided', () => {
      const stats = Array.from<Element>(fixture.nativeElement.querySelectorAll('.adversary-card__stat'));
      const labels = stats.map(s =>
        (s as HTMLElement).querySelector('.adversary-card__stat-label')?.textContent?.trim()
      );
      expect(labels).toContain('Difficulty');
    });

    it('should not render stats section when no stats are provided', () => {
      host.adversary.set(MINIMAL_ADVERSARY);
      fixture.detectChanges();

      const statsSection = fixture.nativeElement.querySelector('.adversary-card__stats');
      expect(statsSection).toBeFalsy();
    });

    it('should render correct HP value', () => {
      const stats = Array.from<Element>(fixture.nativeElement.querySelectorAll('.adversary-card__stat'));
      const hpStat = stats.find(s =>
        (s as HTMLElement).querySelector('.adversary-card__stat-label')?.textContent?.trim() === 'HP'
      ) as HTMLElement;
      const value = hpStat?.querySelector('.adversary-card__stat-value');
      expect(value?.textContent?.trim()).toBe('3');
    });
  });

  describe('Thresholds', () => {
    it('should render Major threshold when provided', () => {
      const thresholds = Array.from<Element>(fixture.nativeElement.querySelectorAll('.adversary-card__threshold'));
      const labels = thresholds.map(t =>
        (t as HTMLElement).querySelector('.adversary-card__threshold-label')?.textContent?.trim()
      );
      expect(labels).toContain('Major');
    });

    it('should render Severe threshold when provided', () => {
      const thresholds = Array.from<Element>(fixture.nativeElement.querySelectorAll('.adversary-card__threshold'));
      const labels = thresholds.map(t =>
        (t as HTMLElement).querySelector('.adversary-card__threshold-label')?.textContent?.trim()
      );
      expect(labels).toContain('Severe');
    });

    it('should not render thresholds section when no thresholds are provided', () => {
      host.adversary.set(MINIMAL_ADVERSARY);
      fixture.detectChanges();

      const thresholdsSection = fixture.nativeElement.querySelector('.adversary-card__thresholds');
      expect(thresholdsSection).toBeFalsy();
    });
  });

  describe('Attack Section', () => {
    it('should render attack section when weaponName is provided', () => {
      const attack = fixture.nativeElement.querySelector('.adversary-card__attack');
      expect(attack).toBeTruthy();
    });

    it('should render weapon name', () => {
      const weapon = fixture.nativeElement.querySelector('.adversary-card__weapon-name');
      expect(weapon.textContent.trim()).toBe('Short Bow');
    });

    it('should render attack range when provided', () => {
      const range = fixture.nativeElement.querySelector('.adversary-card__attack-range');
      expect(range.textContent.trim()).toBe('Far');
    });

    it('should render damage notation when provided', () => {
      const damage = fixture.nativeElement.querySelector('.adversary-card__damage');
      expect(damage.textContent.trim()).toContain('1d6+1');
      expect(damage.textContent.trim()).toContain('phy');
    });

    it('should not render attack section when no weaponName', () => {
      host.adversary.set(MINIMAL_ADVERSARY);
      fixture.detectChanges();

      const attack = fixture.nativeElement.querySelector('.adversary-card__attack');
      expect(attack).toBeFalsy();
    });

    it('should not render attack range when not provided', () => {
      host.adversary.set({ ...MOCK_ADVERSARY, attackRange: undefined });
      fixture.detectChanges();

      const range = fixture.nativeElement.querySelector('.adversary-card__attack-range');
      expect(range).toBeFalsy();
    });

    it('should not render damage when not provided', () => {
      host.adversary.set({ ...MOCK_ADVERSARY, damage: undefined });
      fixture.detectChanges();

      const damage = fixture.nativeElement.querySelector('.adversary-card__damage');
      expect(damage).toBeFalsy();
    });
  });

  describe('Features', () => {
    it('should render features when provided', () => {
      const featuresSection = fixture.nativeElement.querySelector('.adversary-card__features');
      expect(featuresSection).toBeTruthy();
    });

    it('should not render features section when no features', () => {
      host.adversary.set(MINIMAL_ADVERSARY);
      fixture.detectChanges();

      const featuresSection = fixture.nativeElement.querySelector('.adversary-card__features');
      expect(featuresSection).toBeFalsy();
    });

    it('should not render features section when features is empty array', () => {
      host.adversary.set({ ...MOCK_ADVERSARY, features: [] });
      fixture.detectChanges();

      const featuresSection = fixture.nativeElement.querySelector('.adversary-card__features');
      expect(featuresSection).toBeFalsy();
    });

    it('should render features expanded by default when collapsibleFeatures is false', () => {
      const list = fixture.nativeElement.querySelector('.adversary-card__features-list');
      expect(list.classList.contains('adversary-card__features-list--expanded')).toBe(true);
    });

    it('should not render toggle button when collapsibleFeatures is false', () => {
      const toggle = fixture.nativeElement.querySelector('.adversary-card__features-toggle');
      expect(toggle).toBeFalsy();
    });
  });

  describe('Collapsible Features', () => {
    beforeEach(() => {
      host.collapsibleFeatures.set(true);
      fixture.detectChanges();
    });

    it('should render toggle button with correct count', () => {
      const toggle = fixture.nativeElement.querySelector('.adversary-card__features-toggle');
      expect(toggle).toBeTruthy();
      expect(toggle.textContent).toContain('1 Feature');
    });

    it('should start with features collapsed', () => {
      const list = fixture.nativeElement.querySelector('.adversary-card__features-list');
      expect(list.classList.contains('adversary-card__features-list--expanded')).toBe(false);
    });

    it('should expand features on toggle click', () => {
      const toggle = fixture.nativeElement.querySelector('.adversary-card__features-toggle');
      toggle.click();
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('.adversary-card__features-list');
      expect(list.classList.contains('adversary-card__features-list--expanded')).toBe(true);
    });

    it('should collapse features on second toggle click', () => {
      const toggle = fixture.nativeElement.querySelector('.adversary-card__features-toggle');
      toggle.click();
      fixture.detectChanges();
      toggle.click();
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('.adversary-card__features-list');
      expect(list.classList.contains('adversary-card__features-list--expanded')).toBe(false);
    });
  });

  describe('Motives and Tactics', () => {
    it('should render motives and tactics when provided', () => {
      const tactics = fixture.nativeElement.querySelector('.adversary-card__tactics');
      expect(tactics).toBeTruthy();
    });

    it('should render tactics text content', () => {
      const tacticsText = fixture.nativeElement.querySelector('.adversary-card__tactics-text');
      expect(tacticsText.textContent.trim()).toBe('Flee when outnumbered.');
    });

    it('should not render tactics section when not provided', () => {
      host.adversary.set(MINIMAL_ADVERSARY);
      fixture.detectChanges();

      const tactics = fixture.nativeElement.querySelector('.adversary-card__tactics');
      expect(tactics).toBeFalsy();
    });
  });

  describe('Description', () => {
    it('should render description when provided', () => {
      const desc = fixture.nativeElement.querySelector('.adversary-card__description');
      expect(desc.textContent.trim()).toBe('A quick and cowardly goblin.');
    });

    it('should not render description when not provided', () => {
      host.adversary.set(MINIMAL_ADVERSARY);
      fixture.detectChanges();

      const desc = fixture.nativeElement.querySelector('.adversary-card__description');
      expect(desc).toBeFalsy();
    });
  });

  describe('Layout', () => {
    it('should not apply wide class by default', () => {
      const card = fixture.nativeElement.querySelector('.adversary-card');
      expect(card.classList.contains('adversary-card--wide')).toBe(false);
    });

    it('should apply wide class when layout is wide', () => {
      host.layout.set('wide');
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.adversary-card');
      expect(card.classList.contains('adversary-card--wide')).toBe(true);
    });

    it('should not apply wide class when layout is default', () => {
      host.layout.set('default');
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.adversary-card');
      expect(card.classList.contains('adversary-card--wide')).toBe(false);
    });
  });
});
