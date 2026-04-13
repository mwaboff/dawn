import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CampaignRoster } from './campaign-roster';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';

function makeCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Dragon Slayers',
    isEnded: false,
    creatorId: 10,
    creator: { id: 10, username: 'dungeon_master', email: 'dm@test.com', role: 'USER', createdAt: '2025-01-01T00:00:00', lastModifiedAt: '2025-01-01T00:00:00', usernameChosen: true },
    gameMasterIds: [10],
    playerIds: [1, 2, 3],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    createdAt: '2025-06-15T10:30:00',
    lastModifiedAt: '2025-06-15T10:30:00',
    ...overrides,
  };
}

@Component({
  template: `
    <app-campaign-roster
      [campaigns]="campaigns()"
      [loading]="loading()"
      [error]="error()"
      (viewCampaign)="viewedId = $event"
      (createCampaign)="createCalled = true"
    />
  `,
  imports: [CampaignRoster],
})
class TestHost {
  campaigns = signal<CampaignResponse[]>([]);
  loading = signal(false);
  error = signal(false);
  viewedId: number | null = null;
  createCalled = false;
}

describe('CampaignRoster', () => {
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
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(el.querySelector('app-campaign-roster')).toBeTruthy();
  });

  it('should show loading skeletons when loading is true', () => {
    host.loading.set(true);
    fixture.detectChanges();

    expect(el.querySelectorAll('.roster-skeleton').length).toBe(2);
  });

  it('should show error message when error is true', () => {
    host.error.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.roster-message')).toBeTruthy();
  });

  it('should show empty state when campaigns is empty', () => {
    fixture.detectChanges();

    expect(el.querySelector('.roster-empty')).toBeTruthy();
    expect(el.querySelector('.roster-empty-text')?.textContent?.trim()).toBe('No adventures yet');
  });

  it('should emit createCampaign when create button is clicked', () => {
    fixture.detectChanges();
    const btn = el.querySelector('.roster-create-btn') as HTMLButtonElement;
    btn.click();

    expect(host.createCalled).toBe(true);
  });

  it('should render campaign entries', () => {
    host.campaigns.set([
      makeCampaign({ id: 1, name: 'Dragon Slayers' }),
      makeCampaign({ id: 2, name: 'Goblin Hunters' }),
    ]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.roster-entry').length).toBe(2);
  });

  it('should display campaign name', () => {
    host.campaigns.set([makeCampaign({ name: 'The Lost Mines' })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-character-name')?.textContent?.trim()).toBe('The Lost Mines');
  });

  it('should display GM username', () => {
    host.campaigns.set([makeCampaign()]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-class-name')?.textContent?.trim()).toBe('GM: dungeon_master');
  });

  it('should display player count', () => {
    host.campaigns.set([makeCampaign({ playerIds: [1, 2, 3, 4] })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-class-subclass')?.textContent?.trim()).toBe('4 players');
  });

  it('should show "Ended" badge for ended campaigns', () => {
    host.campaigns.set([makeCampaign({ isEnded: true })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-badge')?.textContent?.trim()).toBe('Ended');
  });

  it('should not show "Ended" badge for active campaigns', () => {
    host.campaigns.set([makeCampaign({ isEnded: false })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-badge')).toBeFalsy();
  });

  it('should emit viewCampaign with id when entry is clicked', () => {
    host.campaigns.set([makeCampaign({ id: 42 })]);
    fixture.detectChanges();
    const entry = el.querySelector('.roster-entry') as HTMLElement;
    entry.click();

    expect(host.viewedId).toBe(42);
  });

  it('should show "View All Campaigns" link when campaigns exist', () => {
    host.campaigns.set([makeCampaign()]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-add-link')?.textContent?.trim()).toBe('View All Campaigns');
  });
});
