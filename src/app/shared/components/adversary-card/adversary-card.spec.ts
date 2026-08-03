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
      [collapsible]="collapsible()"
      [compact]="compact()"
      [effectiveTier]="effectiveTier()"
    >
      @if (showActions()) {
        <button card-actions type="button">Remove</button>
      }
      @if (showCounters()) {
        <span card-counters>HP tracker</span>
      }
    </app-adversary-card>
  `,
})
class TestHost {
  adversary = signal<AdversaryData>(MOCK_ADVERSARY);
  layout = signal<'default' | 'wide'>('default');
  collapsibleFeatures = signal(false);
  collapsible = signal(false);
  compact = signal(false);
  effectiveTier = signal<number | undefined>(undefined);
  showActions = signal(false);
  showCounters = signal(false);
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

  it('should render the adversary type as a visible badge', () => {
    const badge = fixture.nativeElement.querySelector('.adversary-card__type-badge');
    expect(badge.textContent.trim()).toBe('MINION');
  });

  it('should set a per-type glyph on the badge for CSS-generated content', () => {
    const badge = fixture.nativeElement.querySelector('.adversary-card__type-badge');
    expect(badge.getAttribute('data-glyph')).toBe('✱');
  });

  it('should not mark a non-elite type (MINION) with the elite badge modifier', () => {
    const badge = fixture.nativeElement.querySelector('.adversary-card__type-badge');
    expect(badge.classList.contains('adversary-card__type-badge--elite')).toBe(false);
  });

  it.each(['BRUISER', 'HORDE', 'LEADER', 'SOLO'])('should mark %s as an elite type', (adversaryType) => {
    host.adversary.set({ ...MOCK_ADVERSARY, adversaryType });
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.adversary-card__type-badge');
    expect(badge.classList.contains('adversary-card__type-badge--elite')).toBe(true);
  });

  it.each(['MINION', 'SOCIAL', 'SUPPORT', 'RANGED', 'SKULK', 'STANDARD'])('should not mark %s as an elite type', (adversaryType) => {
    host.adversary.set({ ...MOCK_ADVERSARY, adversaryType });
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.adversary-card__type-badge');
    expect(badge.classList.contains('adversary-card__type-badge--elite')).toBe(false);
  });

  it('should mark MINION with the minion badge modifier', () => {
    const badge = fixture.nativeElement.querySelector('.adversary-card__type-badge');
    expect(badge.classList.contains('adversary-card__type-badge--minion')).toBe(true);
  });

  it('should not mark a non-minion type (BRUISER) with the minion badge modifier', () => {
    host.adversary.set({ ...MOCK_ADVERSARY, adversaryType: 'BRUISER' });
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.adversary-card__type-badge');
    expect(badge.classList.contains('adversary-card__type-badge--minion')).toBe(false);
  });

  it('should mark SOLO with both the elite and solo badge modifiers', () => {
    host.adversary.set({ ...MOCK_ADVERSARY, adversaryType: 'SOLO' });
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.adversary-card__type-badge');
    expect(badge.classList.contains('adversary-card__type-badge--elite')).toBe(true);
    expect(badge.classList.contains('adversary-card__type-badge--solo')).toBe(true);
  });

  it('should not mark a non-solo elite type (BRUISER) with the solo badge modifier', () => {
    host.adversary.set({ ...MOCK_ADVERSARY, adversaryType: 'BRUISER' });
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.adversary-card__type-badge');
    expect(badge.classList.contains('adversary-card__type-badge--solo')).toBe(false);
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

  describe('Experiences', () => {
    it('should render experiences in "description +modifier" format', () => {
      host.adversary.set({ ...MOCK_ADVERSARY, experiences: [{ description: 'Thief', modifier: 2 }] });
      fixture.detectChanges();

      const experience = fixture.nativeElement.querySelector('.adversary-card__experience');
      expect(experience.textContent.trim()).toBe('Thief +2');
    });

    it('should render a negative modifier without a doubled sign', () => {
      host.adversary.set({ ...MOCK_ADVERSARY, experiences: [{ description: 'Clumsy', modifier: -1 }] });
      fixture.detectChanges();

      const experience = fixture.nativeElement.querySelector('.adversary-card__experience');
      expect(experience.textContent.trim()).toBe('Clumsy -1');
    });

    it('should render multiple experiences', () => {
      host.adversary.set({
        ...MOCK_ADVERSARY,
        experiences: [{ description: 'Thief', modifier: 2 }, { description: 'Ambush', modifier: 1 }],
      });
      fixture.detectChanges();

      const experiences = fixture.nativeElement.querySelectorAll('.adversary-card__experience');
      expect(experiences.length).toBe(2);
    });

    it('should not render the experiences section when none are provided', () => {
      const section = fixture.nativeElement.querySelector('.adversary-card__experiences');
      expect(section).toBeFalsy();
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

  describe('Projected content', () => {
    it('should not render card-actions content by default', () => {
      const actions = fixture.nativeElement.querySelector('[card-actions]');
      expect(actions).toBeFalsy();
    });

    it('should render projected card-actions content', () => {
      host.showActions.set(true);
      fixture.detectChanges();

      const actions = fixture.nativeElement.querySelector('[card-actions]');
      expect(actions.textContent.trim()).toBe('Remove');
    });

    it('should not render card-counters content by default', () => {
      const counters = fixture.nativeElement.querySelector('[card-counters]');
      expect(counters).toBeFalsy();
    });

    it('should render projected card-counters content', () => {
      host.showCounters.set(true);
      fixture.detectChanges();

      const counters = fixture.nativeElement.querySelector('[card-counters]');
      expect(counters.textContent.trim()).toBe('HP tracker');
    });
  });

  describe('Retiering', () => {
    it('should not show a retiered marker when effectiveTier is unset', () => {
      const marker = fixture.nativeElement.querySelector('.adversary-card__subtitle--retiered');
      expect(marker).toBeFalsy();
    });

    it('should not show a retiered marker when effectiveTier equals the printed tier', () => {
      host.effectiveTier.set(MOCK_ADVERSARY.tier);
      fixture.detectChanges();

      const marker = fixture.nativeElement.querySelector('.adversary-card__subtitle--retiered');
      expect(marker).toBeFalsy();
    });

    it('should show a retiered marker naming the original tier when retiered', () => {
      host.effectiveTier.set(3);
      fixture.detectChanges();

      const marker = fixture.nativeElement.querySelector('.adversary-card__subtitle--retiered');
      expect(marker.textContent.replace(/\s+/g, ' ').trim()).toBe('⟳ Retiered from Tier 1');
    });

    it('should show the effective tier in the tier subtitle when retiered', () => {
      host.effectiveTier.set(3);
      fixture.detectChanges();

      const tier = fixture.nativeElement.querySelector('.adversary-card__subtitle--secondary');
      expect(tier.textContent.trim()).toBe('Tier 3');
    });

    it('should swap the difficulty to the Tier 3 improvised value when retiered to Tier 3', () => {
      host.effectiveTier.set(3);
      fixture.detectChanges();

      const stats = Array.from<Element>(fixture.nativeElement.querySelectorAll('.adversary-card__stat'));
      const difficultyStat = stats.find(s =>
        (s as HTMLElement).querySelector('.adversary-card__stat-label')?.textContent?.trim() === 'Difficulty'
      ) as HTMLElement;
      expect(difficultyStat.querySelector('.adversary-card__stat-value')?.textContent?.trim()).toBe('17');
    });

    it('should swap the thresholds to the Tier 3 improvised values when retiered', () => {
      host.effectiveTier.set(3);
      fixture.detectChanges();

      const thresholds = Array.from<Element>(fixture.nativeElement.querySelectorAll('.adversary-card__threshold'));
      const values = thresholds.map(t => (t as HTMLElement).querySelector('.adversary-card__threshold-value')?.textContent?.trim());
      expect(values).toEqual(['20', '32']);
    });

    it('should swap the attack modifier to the Tier 3 improvised value when retiered', () => {
      host.effectiveTier.set(3);
      fixture.detectChanges();

      const modifier = fixture.nativeElement.querySelector('.adversary-card__attack-modifier');
      expect(modifier.textContent.trim()).toBe('+3');
    });

    it('should fall back to the printed stats when effectiveTier is out of range', () => {
      host.effectiveTier.set(9);
      fixture.detectChanges();

      const stats = Array.from<Element>(fixture.nativeElement.querySelectorAll('.adversary-card__stat'));
      const difficultyStat = stats.find(s =>
        (s as HTMLElement).querySelector('.adversary-card__stat-label')?.textContent?.trim() === 'Difficulty'
      ) as HTMLElement;
      expect(difficultyStat.querySelector('.adversary-card__stat-value')?.textContent?.trim()).toBe('10');
    });
  });

  describe('Whole-card collapse (collapsible unset)', () => {
    // `features/reference` and the encounter roster never set `collapsible` -- this locks in
    // that their rendering is untouched by the browse list's new collapse behaviour.
    it('renders the full body without a toggle button, same as before this feature existed', () => {
      expect(fixture.nativeElement.querySelector('.adversary-card__body')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.adversary-card__toggle')).toBeFalsy();
    });
  });

  describe('Whole-card collapse (collapsible = true)', () => {
    beforeEach(() => {
      host.collapsible.set(true);
      fixture.detectChanges();
    });

    it('starts collapsed, hiding the body', () => {
      expect(fixture.nativeElement.querySelector('.adversary-card__body')).toBeFalsy();
    });

    it('still shows the name, type badge, and tier while collapsed', () => {
      expect(fixture.nativeElement.querySelector('.adversary-card__name').textContent.trim()).toBe('Goblin Scout');
      expect(fixture.nativeElement.querySelector('.adversary-card__type-badge').textContent.trim()).toBe('MINION');
      expect(fixture.nativeElement.querySelector('.adversary-card__subtitle--secondary').textContent.trim()).toBe('Tier 1');
    });

    it('renders a real button as the toggle, closed', () => {
      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.adversary-card__toggle');
      expect(toggle.tagName).toBe('BUTTON');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('omits aria-controls while collapsed, since the body it would reference is not in the DOM', () => {
      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.adversary-card__toggle');
      expect(toggle.hasAttribute('aria-controls')).toBe(false);
    });

    it('expands the body and flips aria-expanded on toggle click', () => {
      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.adversary-card__toggle');
      toggle.click();
      fixture.detectChanges();

      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(fixture.nativeElement.querySelector('.adversary-card__body')).toBeTruthy();
    });

    it('sets aria-controls to the body id once expanded', () => {
      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.adversary-card__toggle');
      toggle.click();
      fixture.detectChanges();

      const body = fixture.nativeElement.querySelector('.adversary-card__body');
      expect(toggle.getAttribute('aria-controls')).toBe(body.id);
    });

    it('collapses again on a second toggle click', () => {
      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.adversary-card__toggle');
      toggle.click();
      fixture.detectChanges();
      toggle.click();
      fixture.detectChanges();

      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(fixture.nativeElement.querySelector('.adversary-card__body')).toBeFalsy();
    });

    it('keeps projected card-actions clickable while collapsed', () => {
      host.showActions.set(true);
      fixture.detectChanges();

      const actions = fixture.nativeElement.querySelector('[card-actions]');
      expect(actions.textContent.trim()).toBe('Remove');
    });

    it('still renders projected card-counters content while collapsed', () => {
      host.showCounters.set(true);
      fixture.detectChanges();

      const counters = fixture.nativeElement.querySelector('[card-counters]');
      expect(counters.textContent.trim()).toBe('HP tracker');
    });

    it('gives two instances of the same adversary distinct body/aria-controls ids', () => {
      // The roster can hold several instances of the same catalog adversary (three Giant
      // Mosquitoes, same `adversary.id`) -- the toggle's aria-controls must not collide once
      // expanded (aria-controls is only set while expanded -- see the collapsed-state test above).
      const other = TestBed.createComponent(TestHost);
      other.componentInstance.collapsible.set(true);
      other.detectChanges();

      const thisToggle: HTMLButtonElement = fixture.nativeElement.querySelector('.adversary-card__toggle');
      const otherToggle: HTMLButtonElement = other.nativeElement.querySelector('.adversary-card__toggle');
      thisToggle.click();
      fixture.detectChanges();
      otherToggle.click();
      other.detectChanges();

      expect(thisToggle.getAttribute('aria-controls')).not.toBe(otherToggle.getAttribute('aria-controls'));
    });
  });

  describe('Compact sizing (roster context)', () => {
    it('does not apply the compact modifier by default', () => {
      const card = fixture.nativeElement.querySelector('.adversary-card');
      expect(card.classList.contains('adversary-card--compact')).toBe(false);
    });

    it('applies the compact modifier when compact is true', () => {
      host.compact.set(true);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.adversary-card');
      expect(card.classList.contains('adversary-card--compact')).toBe(true);
    });

    it('tightens header and body padding, not just the name type size, so compact rows actually fit more per screen', () => {
      const header = fixture.nativeElement.querySelector('.adversary-card__header');
      const comfortablePadding = getComputedStyle(header).padding;

      host.compact.set(true);
      fixture.detectChanges();

      expect(getComputedStyle(header).padding).not.toBe(comfortablePadding);
      // `1.25rem` (comfortable) vs. `.85rem` (compact) top padding -- a real spacing cut, not a
      // font-size-only change that would leave the same amount of chrome around a smaller word.
      expect(getComputedStyle(header).paddingTop).toBe('0.85rem');
    });
  });
});
