import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { AncestrySelector, MixedAncestrySelection } from './ancestry-selector';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';

function makeAncestryCard(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 1,
    name: 'Elf',
    description: 'Graceful folk',
    cardType: 'ancestry',
    features: [
      { id: 10, name: 'Darkvision', description: 'See in darkness', subtitle: 'Ancestry Feature' },
      { id: 11, name: 'Trance', description: 'Meditate instead of sleep', subtitle: 'Ancestry Feature' },
    ],
    metadata: { expansionId: 1 },
    ...overrides,
  };
}

@Component({
  template: `
    <app-ancestry-selector
      [cards]="cards"
      [loading]="loading"
      [error]="error"
      [selectedCard]="selectedCard"
      (ancestrySelected)="onAncestrySelected($event)"
      (mixedAncestrySelected)="onMixedSelected($event)"
      (ancestryDeselected)="onDeselected()"
    />
  `,
  imports: [AncestrySelector],
})
class TestHost {
  cards: CardData[] = [
    makeAncestryCard(),
    makeAncestryCard({
      id: 2,
      name: 'Dwarf',
      description: 'Stout folk',
      features: [
        { id: 20, name: 'Stonecunning', description: 'Know stone', subtitle: 'Ancestry Feature' },
        { id: 21, name: 'Tough', description: 'Extra resilience', subtitle: 'Ancestry Feature' },
      ],
      metadata: { expansionId: 1 },
    }),
  ];
  loading = false;
  error = false;
  selectedCard: CardData | undefined;

  selectedAncestry: CardData | undefined;
  mixedSelection: MixedAncestrySelection | undefined;
  deselectedCount = 0;

  onAncestrySelected(card: CardData): void { this.selectedAncestry = card; }
  onMixedSelected(selection: MixedAncestrySelection): void { this.mixedSelection = selection; }
  onDeselected(): void { this.deselectedCount++; }
}

describe('AncestrySelector', () => {
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
    expect(fixture.nativeElement.querySelector('app-ancestry-selector')).toBeTruthy();
  });

  it('should display bloodline banners', () => {
    fixture.detectChanges();
    const banners = fixture.nativeElement.querySelectorAll('.bloodline-banner');
    expect(banners.length).toBe(2);
  });

  it('should default to single mode', () => {
    fixture.detectChanges();
    const activeBanner = fixture.nativeElement.querySelector('.bloodline-banner--active');
    expect(activeBanner.textContent).toContain('Pure Lineage');
  });

  it('should render card selection grid in single mode', () => {
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('app-card-selection-grid');
    expect(grid).toBeTruthy();
  });

  it('should switch to mixed mode when Mixed Heritage banner is clicked', () => {
    fixture.detectChanges();
    const banners = fixture.nativeElement.querySelectorAll('.bloodline-banner');
    banners[1].click();
    fixture.detectChanges();
    const activeBanner = fixture.nativeElement.querySelector('.bloodline-banner--active');
    expect(activeBanner.textContent).toContain('Mixed Heritage');
  });

  it('should emit ancestryDeselected when switching to mixed mode', () => {
    fixture.detectChanges();
    const banners = fixture.nativeElement.querySelectorAll('.bloodline-banner');
    banners[1].click();
    expect(host.deselectedCount).toBe(1);
  });

  it('should show step instruction in mixed mode', () => {
    fixture.detectChanges();
    const banners = fixture.nativeElement.querySelectorAll('.bloodline-banner');
    banners[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Choose two ancestries to blend');
  });

  it('should not show proceed button with fewer than 2 ancestries selected', () => {
    fixture.detectChanges();
    const banners = fixture.nativeElement.querySelectorAll('.bloodline-banner');
    banners[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.proceed-button')).toBeNull();
  });

  it('should reset mixed state when switching back to single mode', () => {
    fixture.detectChanges();
    const component = fixture.debugElement.children[0].componentInstance as AncestrySelector;
    component.setMode('mixed');
    component.selectedAncestries.set([makeAncestryCard(), makeAncestryCard({ id: 2 })]);
    component.setMode('single');
    fixture.detectChanges();
    expect(component.selectedAncestries()).toEqual([]);
  });

  describe('Feature Forge', () => {
    let component: AncestrySelector;

    beforeEach(() => {
      fixture.detectChanges();
      component = fixture.debugElement.children[0].componentInstance as AncestrySelector;
      component.setMode('mixed');
      component.onAncestriesSelected([host.cards[0], host.cards[1]]);
      component.proceedToFeatures();
      fixture.detectChanges();
    });

    it('should display ancestry names in forge columns', () => {
      const names = fixture.nativeElement.querySelectorAll('.forge-ancestry-name');
      expect(names.length).toBe(2);
      expect(names[0].textContent).toContain('Elf');
      expect(names[1].textContent).toContain('Dwarf');
    });

    it('should display features as selectable buttons', () => {
      const features = fixture.nativeElement.querySelectorAll('.forge-feature');
      expect(features.length).toBe(4);
    });

    it('should highlight selected feature', () => {
      const features = fixture.nativeElement.querySelectorAll('.forge-feature');
      features[0].click();
      fixture.detectChanges();
      expect(features[0].classList.contains('forge-feature--selected')).toBe(true);
    });

    it('should deselect feature when clicked again', () => {
      component.toggleFeature(1, host.cards[0].features![0]);
      component.toggleFeature(1, host.cards[0].features![0]);
      expect(component.isFeatureSelected(1, host.cards[0].features![0])).toBe(false);
    });

    it('should show forge result when both features selected', () => {
      component.toggleFeature(1, host.cards[0].features![0]);
      component.toggleFeature(2, host.cards[1].features![0]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.forge-result')).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('Elf / Dwarf');
    });

    it('should not show forge result with only one feature selected', () => {
      component.toggleFeature(1, host.cards[0].features![0]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.forge-result')).toBeNull();
    });

    it('should emit mixedAncestrySelected on confirm', () => {
      component.toggleFeature(1, host.cards[0].features![0]);
      component.toggleFeature(2, host.cards[1].features![0]);
      component.confirmMixedSelection();
      expect(host.mixedSelection).toBeDefined();
      expect(host.mixedSelection!.ancestry1.name).toBe('Elf');
      expect(host.mixedSelection!.ancestry2.name).toBe('Dwarf');
      expect(host.mixedSelection!.feature1.name).toBe('Darkvision');
      expect(host.mixedSelection!.feature2.name).toBe('Stonecunning');
      expect(host.mixedSelection!.expansionId).toBe(1);
    });

    it('should show back link in feature forge step', () => {
      expect(fixture.nativeElement.querySelector('.back-link')).toBeTruthy();
    });

    it('should go back to ancestry selection when back link is clicked', () => {
      const backLink = fixture.nativeElement.querySelector('.back-link') as HTMLButtonElement;
      backLink.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Choose two ancestries to blend');
    });
  });
});
