import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterSheetView } from '../../../../../../character-sheet/models/character-sheet-view.model';
import { PartyMemberDetail } from './party-member-detail';

function stat(modified: number) {
  return { base: modified, modified, hasModifier: false, modifierSources: [] };
}

function view(overrides: Partial<CharacterSheetView> = {}): CharacterSheetView {
  return {
    id: 42,
    ownerId: 2,
    name: 'Brenna',
    level: 3,
    proficiency: stat(2),
    evasion: stat(11),
    hitPointMax: stat(7),
    armorScore: stat(3),
    majorDamageThreshold: stat(8),
    severeDamageThreshold: stat(16),
    armorRestricted: false,
    hopeMax: stat(6),
    stressMax: stat(6),
    hitPointMarked: 2,
    armorMarked: 1,
    armorMax: 6,
    hopeMarked: 4,
    stressMarked: 1,
    gold: 3,
    traits: [
      { name: 'Agility', abbreviation: 'AGI', modifier: stat(2), marked: false },
      { name: 'Instinct', abbreviation: 'INS', modifier: stat(-1), marked: false },
    ],
    activePrimaryWeapon: null,
    activeSecondaryWeapon: null,
    activeArmor: null,
    classCards: [],
    subclassCards: [],
    ancestryCards: [],
    communityCards: [],
    domainCards: [],
    equippedDomainCards: [],
    vaultDomainCards: [],
    maxEquippedDomainCards: 5,
    inventoryWeapons: [],
    inventoryArmors: [],
    inventoryItems: [],
    experiences: [],
    classEntries: [],
    ...overrides,
  };
}

describe('PartyMemberDetail', () => {
  let fixture: ComponentFixture<PartyMemberDetail>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PartyMemberDetail] });
    fixture = TestBed.createComponent(PartyMemberDetail);
    fixture.componentRef.setInput('sheet', view());
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders trait modifiers with an explicit sign', () => {
    expect(host.textContent).toContain('+2');
    expect(host.textContent).toContain('-1');
  });

  it('says None rather than leaving armor blank when nothing is equipped', () => {
    expect(host.textContent).toContain('None');
    expect(host.textContent).toContain('1/6 marked');
  });

  it('invites nothing and states plainly when a section is empty', () => {
    expect(host.textContent).toContain('None recorded.');
    expect(host.textContent).toContain('Nothing equipped.');
    expect(host.textContent).toContain('No cards equipped.');
  });

  it('lists only the weapons that are actually active', () => {
    fixture.componentRef.setInput(
      'sheet',
      view({
        activePrimaryWeapon: {
          inventoryEntryId: 1,
          name: 'Shortsword',
          trait: 'Agility',
          range: 'Melee',
          damage: 'd8+2 phy',
        } as CharacterSheetView['activePrimaryWeapon'],
      }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.equippedWeapons()).toHaveLength(1);
    expect(host.textContent).toContain('Shortsword');
  });

  describe('restricted equipped armor (SRD vs. paid-expansion content gating)', () => {
    it('shows "score unavailable" rather than the mapper\'s internal 0 fallback', () => {
      fixture.componentRef.setInput('sheet', view({
        armorScore: stat(0),
        armorRestricted: true,
        activeArmor: {
          id: 20, inventoryEntryId: 200, name: 'Content Not Available',
          baseScore: 0, baseMajorThreshold: 0, baseSevereThreshold: 0, features: [],
          restricted: true, expansionName: 'Hope & Fear',
        },
      }));
      fixture.detectChanges();

      expect(host.textContent).toContain('score unavailable');
      expect(host.textContent).not.toContain('score 0');
    });

    it('still shows the placeholder armor name, not "None"', () => {
      fixture.componentRef.setInput('sheet', view({
        armorScore: stat(0),
        armorRestricted: true,
        activeArmor: {
          id: 20, inventoryEntryId: 200, name: 'Content Not Available',
          baseScore: 0, baseMajorThreshold: 0, baseSevereThreshold: 0, features: [],
          restricted: true, expansionName: 'Hope & Fear',
        },
      }));
      fixture.detectChanges();

      expect(host.textContent).toContain('Content Not Available');
    });
  });
});
