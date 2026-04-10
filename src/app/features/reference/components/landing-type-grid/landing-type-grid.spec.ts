import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { LandingTypeGrid } from './landing-type-grid';
import { SearchableEntityType } from '../../models/search.model';

@Component({
  template: `<app-landing-type-grid (typeSelect)="onTypeSelect($event)" />`,
  imports: [LandingTypeGrid],
})
class TestHost {
  lastSelectedType: SearchableEntityType | null = null;
  onTypeSelect(t: SearchableEntityType): void { this.lastSelectedType = t; }
}

describe('LandingTypeGrid', () => {
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

  it('creates the component', () => {
    expect(fixture.nativeElement.querySelector('app-landing-type-grid')).toBeTruthy();
  });

  it('renders 11 type cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.type-card');
    expect(cards.length).toBe(11);
  });

  it('renders a glyph for each card', () => {
    const glyphs = fixture.nativeElement.querySelectorAll('.type-glyph');
    expect(glyphs.length).toBe(11);
  });

  it('renders a label for each card', () => {
    const labels = fixture.nativeElement.querySelectorAll('.type-label');
    expect(labels.length).toBe(11);
  });

  it('renders a tagline for each card', () => {
    const taglines = fixture.nativeElement.querySelectorAll('.type-tagline');
    expect(taglines.length).toBe(11);
  });

  it('emits WEAPON when Weapons card is clicked', () => {
    const cards = fixture.nativeElement.querySelectorAll('.type-card') as NodeListOf<HTMLButtonElement>;
    const weaponCard = Array.from(cards).find(c => c.textContent?.includes('Weapons'));
    weaponCard?.click();
    expect(host.lastSelectedType).toBe('WEAPON');
  });

  it('emits ADVERSARY when Adversaries card is clicked', () => {
    const cards = fixture.nativeElement.querySelectorAll('.type-card') as NodeListOf<HTMLButtonElement>;
    const adversaryCard = Array.from(cards).find(c => c.textContent?.includes('Adversaries'));
    adversaryCard?.click();
    expect(host.lastSelectedType).toBe('ADVERSARY');
  });

  it('emits ARMOR when Armor card is clicked', () => {
    const cards = fixture.nativeElement.querySelectorAll('.type-card') as NodeListOf<HTMLButtonElement>;
    const armorCard = Array.from(cards).find(c => c.textContent?.includes('Armor'));
    armorCard?.click();
    expect(host.lastSelectedType).toBe('ARMOR');
  });

  it('emits DOMAIN_CARD when Domain Cards card is clicked', () => {
    const cards = fixture.nativeElement.querySelectorAll('.type-card') as NodeListOf<HTMLButtonElement>;
    const domainCardCard = Array.from(cards).find(c => c.textContent?.includes('Domain Cards'));
    domainCardCard?.click();
    expect(host.lastSelectedType).toBe('DOMAIN_CARD');
  });

  it('emits LOOT when Loot card is clicked', () => {
    const cards = fixture.nativeElement.querySelectorAll('.type-card') as NodeListOf<HTMLButtonElement>;
    const lootCard = Array.from(cards).find(c => c.textContent?.includes('Loot'));
    lootCard?.click();
    expect(host.lastSelectedType).toBe('LOOT');
  });

  it('includes Weapons tagline', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Swords, bows, and the weight they leave behind');
  });

  it('includes Adversaries tagline', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Creatures and foes the GM can unleash');
  });
});
