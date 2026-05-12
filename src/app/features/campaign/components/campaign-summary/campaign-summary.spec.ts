import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CampaignSummary } from './campaign-summary';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';
import { CampaignService } from '../../../../shared/services/campaign.service';

function buildCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Test Campaign',
    creatorId: 1,
    creator: { id: 1, username: 'gm_user', email: '', role: 'USER', createdAt: '', lastModifiedAt: '', usernameChosen: true },
    gameMasterIds: [1],
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    isEnded: false,
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

@Component({
  template: `<app-campaign-summary [campaign]="campaign()" [canManage]="canManage()" (updated)="lastUpdated.set($event)" />`,
  imports: [CampaignSummary],
})
class TestHost {
  campaign = signal(buildCampaign());
  canManage = signal(false);
  lastUpdated = signal<CampaignResponse | null>(null);
}

describe('CampaignSummary', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;
  const updateCampaignSpy = vi.fn();

  beforeEach(async () => {
    updateCampaignSpy.mockReset();

    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        { provide: CampaignService, useValue: { updateCampaign: updateCampaignSpy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(el.querySelector('app-campaign-summary')).toBeTruthy();
  });

  it('should display campaign name', () => {
    host.campaign.set(buildCampaign({ name: 'Dragon Slayers' }));
    fixture.detectChanges();

    expect(el.querySelector('.summary-name')?.textContent?.trim()).toBe('Dragon Slayers');
  });

  it('should display GM username', () => {
    expect(el.querySelector('.summary-gm')?.textContent).toContain('gm_user');
  });

  it('should display description when present', () => {
    host.campaign.set(buildCampaign({ description: 'An epic adventure' }));
    fixture.detectChanges();

    expect(el.querySelector('.summary-description')?.innerHTML).toContain('An epic adventure');
  });

  it('should not display description when absent', () => {
    expect(el.querySelector('.summary-description')).toBeFalsy();
  });

  it('should show ended badge when campaign is ended', () => {
    host.campaign.set(buildCampaign({ isEnded: true }));
    fixture.detectChanges();

    expect(el.querySelector('.summary-badge-ended')).toBeTruthy();
  });

  it('should not show ended badge for active campaign', () => {
    expect(el.querySelector('.summary-badge-ended')).toBeFalsy();
  });

  it('should not show edit button when canManage is false', () => {
    host.canManage.set(false);
    fixture.detectChanges();

    expect(el.querySelector('.summary-edit-btn')).toBeFalsy();
  });

  it('should show "Edit description" button when canManage is true and description present', () => {
    host.campaign.set(buildCampaign({ description: 'Some story' }));
    host.canManage.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.summary-edit-btn')?.textContent?.trim()).toBe('Edit description');
  });

  it('should show "Add description" button when canManage is true and description absent', () => {
    host.canManage.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.summary-edit-btn')?.textContent?.trim()).toBe('Add description');
  });

  it('should render description with newlines as <br>', () => {
    host.campaign.set(buildCampaign({ description: 'line one\nline two' }));
    fixture.detectChanges();

    const descEl = el.querySelector('.summary-description');
    expect(descEl?.innerHTML).toContain('<br>');
    expect(descEl?.textContent).toContain('line one');
    expect(descEl?.textContent).toContain('line two');
  });

  it('should enter edit mode and prefill textarea when edit button clicked', () => {
    host.campaign.set(buildCampaign({ description: 'My story' }));
    host.canManage.set(true);
    fixture.detectChanges();

    (el.querySelector('.summary-edit-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    const textarea = el.querySelector('.summary-textarea') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.value).toBe('My story');
  });

  it('should call updateCampaign and emit updated on save', () => {
    const savedCampaign = buildCampaign({ description: 'new text' });
    updateCampaignSpy.mockReturnValue(of(savedCampaign));

    host.campaign.set(buildCampaign({ description: 'old text' }));
    host.canManage.set(true);
    fixture.detectChanges();

    (el.querySelector('.summary-edit-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    const textarea = el.querySelector('.summary-textarea') as HTMLTextAreaElement;
    textarea.value = 'new text';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (el.querySelector('.summary-edit-save') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(updateCampaignSpy).toHaveBeenCalledWith(1, { description: 'new text' });
    expect(host.lastUpdated()).toEqual(savedCampaign);
    expect(el.querySelector('.summary-edit')).toBeFalsy();
  });

  it('should exit edit mode and revert UI on cancel', () => {
    host.campaign.set(buildCampaign({ description: 'My story' }));
    host.canManage.set(true);
    fixture.detectChanges();

    (el.querySelector('.summary-edit-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.summary-edit')).toBeTruthy();

    (el.querySelector('.summary-edit-cancel') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.summary-edit')).toBeFalsy();
    expect(el.querySelector('.summary-edit-btn')).toBeTruthy();
  });

  it('should show error message when save fails', () => {
    updateCampaignSpy.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
    );

    host.canManage.set(true);
    fixture.detectChanges();

    (el.querySelector('.summary-edit-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    (el.querySelector('.summary-edit-save') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.summary-edit-error')?.textContent?.trim()).toBe(
      'Failed to save changes. Please try again.'
    );
    expect(el.querySelector('.summary-edit')).toBeTruthy();
  });
});
