import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignCharacterList } from './campaign-character-list';
import { CampaignResponse, CampaignCharacterSheet, CampaignCharacterSummary } from '../../../../shared/models/campaign-api.model';

function buildCharacter(overrides: Partial<CampaignCharacterSheet> = {}): CampaignCharacterSheet {
  return {
    id: 10,
    name: 'Kael',
    level: 3,
    ownerId: 2,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

function buildSummary(overrides: Partial<CampaignCharacterSummary> = {}): CampaignCharacterSummary {
  return {
    id: 10,
    name: 'Kael',
    level: 3,
    ownerId: 2,
    ownerUsername: 'player1',
    ancestryNames: [],
    classNames: [],
    subclassNames: [],
    transformationEnabled: false,
    companionsEnabled: false,
    ...overrides,
  };
}

function buildCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Test',
    creatorId: 1,
    gameMasterIds: [1],
    playerIds: [2],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [10],
    playerCharacters: [buildCharacter()],
    nonPlayerCharacterIds: [],
    fear: 0,
    isEnded: false,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

@Component({
  template: `
    <app-campaign-character-list
      [campaign]="campaign()"
      [canManage]="canManage()"
      [canGrantTransformations]="canGrantTransformations()"
      [canGrantCompanions]="canGrantCompanions()"
      [confirmingRemoveId]="confirmingRemoveId()"
      [characterSummaries]="characterSummaries()"
      [openTransformationId]="openTransformationId()"
      [openCompanionId]="openCompanionId()"
      (removeCharacter)="removedId = $event"
      (viewCharacter)="viewedId = $event"
      (cancelRemove)="cancelCalled = true"
      (toggleTransformation)="toggledId = $event"
      (toggleCompanion)="toggledCompanionId = $event"
      (companionChange)="companionChangeEvent = $event"
    />
  `,
  imports: [CampaignCharacterList],
})
class TestHost {
  campaign = signal(buildCampaign());
  canManage = signal(false);
  canGrantTransformations = signal(false);
  canGrantCompanions = signal(false);
  confirmingRemoveId = signal<number | null>(null);
  characterSummaries = signal<CampaignCharacterSummary[]>([]);
  openTransformationId = signal<number | null>(null);
  openCompanionId = signal<number | null>(null);
  removedId: number | null = null;
  viewedId: number | null = null;
  cancelCalled = false;
  toggledId: number | null = null;
  toggledCompanionId: number | null = null;
  companionChangeEvent: unknown = null;
}

describe('CampaignCharacterList', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(el.querySelector('app-campaign-character-list')).toBeTruthy();
  });

  it('should display character entries', () => {
    expect(el.querySelectorAll('.character-entry').length).toBe(1);
  });

  it('should display character name', () => {
    expect(el.querySelector('.character-name')?.textContent?.trim()).toBe('Kael');
  });

  it('should display character level', () => {
    expect(el.querySelector('.character-level')?.textContent?.trim()).toBe('3');
  });

  it('should display owner username as a link from summary', () => {
    host.characterSummaries.set([buildSummary()]);
    fixture.detectChanges();

    const ownerLink = el.querySelector('.character-owner') as HTMLAnchorElement;
    expect(ownerLink?.textContent?.trim()).toBe('player1');
    expect(ownerLink?.tagName).toBe('A');
  });

  it('should not display owner link when no summary exists', () => {
    expect(el.querySelector('.character-owner')).toBeFalsy();
  });

  it('should display class names from subclass cards fallback', () => {
    host.campaign.set(buildCampaign({
      playerCharacters: [buildCharacter({ subclassCards: [{ associatedClassName: 'Guardian' }, { associatedClassName: 'Ranger' }] })],
    }));
    fixture.detectChanges();

    const classText = el.querySelector('.character-class')?.textContent?.replace(/\s+/g, ' ').trim();
    expect(classText).toContain('Guardian');
    expect(classText).toContain('Ranger');
  });

  it('should display class and subclass from characterSummaries', () => {
    host.campaign.set(buildCampaign({
      playerCharacters: [buildCharacter()],
    }));
    host.characterSummaries.set([buildSummary({ classNames: ['Guardian'], subclassNames: ['Iron Wall'] })]);
    fixture.detectChanges();

    const classText = el.querySelector('.character-class')?.textContent?.replace(/\s+/g, ' ').trim();
    expect(classText).toContain('Guardian');
    expect(classText).toContain('Iron Wall');
  });

  it('should show empty state when no characters', () => {
    host.campaign.set(buildCampaign({ playerCharacters: [], playerCharacterIds: [] }));
    fixture.detectChanges();

    expect(el.querySelector('.character-list-empty')).toBeTruthy();
  });

  it('should not show remove button when canManage is false', () => {
    expect(el.querySelector('.character-remove-btn')).toBeFalsy();
  });

  it('should show remove button when canManage is true', () => {
    host.canManage.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.character-remove-btn')).toBeTruthy();
  });

  it('should emit viewCharacter when entry is clicked', () => {
    (el.querySelector('.character-entry') as HTMLElement).click();

    expect(host.viewedId).toBe(10);
  });

  it('should not show the transformation button when canGrantTransformations is false', () => {
    expect(el.querySelector('.character-transformation-grant .grant-btn')).toBeFalsy();
  });

  it('should keep remove available but hide the transformation button on an ended campaign', () => {
    host.canManage.set(true);
    host.canGrantTransformations.set(false);
    fixture.detectChanges();

    expect(el.querySelector('.character-remove-btn')).toBeTruthy();
    expect(el.querySelector('.character-transformation-grant .grant-btn')).toBeFalsy();
  });

  it('should show the transformation button when canGrantTransformations is true', () => {
    host.canManage.set(true);
    host.canGrantTransformations.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.character-transformation-grant .grant-btn')).toBeTruthy();
  });

  it('should place the transformation and companion buttons before the destructive remove button', () => {
    host.canManage.set(true);
    host.canGrantTransformations.set(true);
    host.canGrantCompanions.set(true);
    fixture.detectChanges();

    const actionLabels = Array.from(el.querySelectorAll('.character-actions button'))
      .map(b => b.textContent?.replace(/\s+/g, ' ').trim());
    expect(actionLabels).toEqual(['Transformation', 'Companions', 'Remove']);
  });

  it('should show the On badge when the transformation panel is enabled', () => {
    host.canManage.set(true);
    host.canGrantTransformations.set(true);
    host.characterSummaries.set([buildSummary({ transformationEnabled: true })]);
    fixture.detectChanges();

    expect(el.querySelector('.character-transformation-grant .grant-badge')?.textContent?.trim()).toBe('On');
  });

  it('should emit toggleTransformation without navigating when the transformation button is clicked', () => {
    host.canManage.set(true);
    host.canGrantTransformations.set(true);
    fixture.detectChanges();

    (el.querySelector('.character-transformation-grant .grant-btn') as HTMLButtonElement).click();

    expect(host.toggledId).toBe(10);
  });

  it('should not navigate to the sheet when the transformation button is clicked', () => {
    host.canManage.set(true);
    host.canGrantTransformations.set(true);
    fixture.detectChanges();

    (el.querySelector('.character-transformation-grant .grant-btn') as HTMLButtonElement).click();

    expect(host.viewedId).toBeNull();
  });

  it('should not render the drawer when no character is open', () => {
    host.canManage.set(true);
    host.canGrantTransformations.set(true);
    fixture.detectChanges();

    expect(el.querySelector('app-campaign-transformation-control')).toBeFalsy();
  });

  it('should render the drawer for the open character only', () => {
    host.canManage.set(true);
    host.canGrantTransformations.set(true);
    host.campaign.set(buildCampaign({
      playerCharacters: [buildCharacter(), buildCharacter({ id: 11, name: 'Bryn' })],
      playerCharacterIds: [10, 11],
    }));
    host.openTransformationId.set(11);
    fixture.detectChanges();

    const drawers = el.querySelectorAll('app-campaign-transformation-control');
    expect(drawers.length).toBe(1);
  });

  it('should link the button to the drawer via aria-controls', () => {
    host.canManage.set(true);
    host.canGrantTransformations.set(true);
    host.openTransformationId.set(10);
    fixture.detectChanges();

    const controls = el.querySelector('.character-transformation-grant .grant-btn')?.getAttribute('aria-controls');
    expect(el.querySelector(`#${controls}`)).toBeTruthy();
  });

  it('should mark the button expanded when its drawer is open', () => {
    host.canManage.set(true);
    host.canGrantTransformations.set(true);
    host.openTransformationId.set(10);
    fixture.detectChanges();

    expect(el.querySelector('.character-transformation-grant .grant-btn')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('should show confirmation when confirmingRemoveId matches', () => {
    host.canManage.set(true);
    host.canGrantTransformations.set(true);
    host.confirmingRemoveId.set(10);
    fixture.detectChanges();

    expect(el.querySelector('.character-confirm-text')).toBeTruthy();
  });

  it('should not show the companion button when canGrantCompanions is false', () => {
    expect(el.querySelector('.character-companion-grant .grant-btn')).toBeFalsy();
  });

  it('should show the companion button when canGrantCompanions is true', () => {
    host.canManage.set(true);
    host.canGrantCompanions.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.character-companion-grant .grant-btn')).toBeTruthy();
  });

  it('should show the On badge when companions are enabled', () => {
    host.canManage.set(true);
    host.canGrantCompanions.set(true);
    host.characterSummaries.set([buildSummary({ companionsEnabled: true })]);
    fixture.detectChanges();

    expect(el.querySelector('.character-companion-grant .grant-badge')?.textContent?.trim()).toBe('On');
  });

  it('should emit toggleCompanion without navigating when the companion button is clicked', () => {
    host.canManage.set(true);
    host.canGrantCompanions.set(true);
    fixture.detectChanges();

    (el.querySelector('.character-companion-grant .grant-btn') as HTMLButtonElement).click();

    expect(host.toggledCompanionId).toBe(10);
    expect(host.viewedId).toBeNull();
  });

  it('should not render the companion drawer when no character is open', () => {
    host.canManage.set(true);
    host.canGrantCompanions.set(true);
    fixture.detectChanges();

    expect(el.querySelector('app-campaign-character-grant-toggle')).toBeFalsy();
  });

  it('should render the companion drawer for the open character with the enabled state from its summary', () => {
    host.canManage.set(true);
    host.canGrantCompanions.set(true);
    host.characterSummaries.set([buildSummary({ companionsEnabled: true })]);
    host.openCompanionId.set(10);
    fixture.detectChanges();

    expect(el.querySelector('.grant-toggle-status')?.textContent?.trim())
      .toBe("Kael can create a companion from their sheet.");
  });

  it('should say existing companions are unaffected when companions are disabled', () => {
    host.canManage.set(true);
    host.canGrantCompanions.set(true);
    host.openCompanionId.set(10);
    fixture.detectChanges();

    expect(el.querySelector('.grant-toggle-status')?.textContent).toContain("doesn't remove or hide");
  });

  it('should emit companionChange with the flipped enabled state when the drawer toggle is clicked', () => {
    host.canManage.set(true);
    host.canGrantCompanions.set(true);
    host.openCompanionId.set(10);
    fixture.detectChanges();

    (el.querySelector('.grant-toggle-btn') as HTMLButtonElement).click();

    expect(host.companionChangeEvent).toEqual({ sheetId: 10, request: { enabled: true } });
  });
});
