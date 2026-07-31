import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { CampaignResponse } from '../../../../../shared/models/campaign-api.model';
import { GmScreenContext } from '../../gm-screen-context.service';
import { GmNotesPanel } from './gm-notes-panel';

const NOTES_URL = 'http://localhost:8080/api/dh/campaigns/7/gm-notes';

function campaign(gmNotes?: string): CampaignResponse {
  return {
    id: 7,
    name: 'The Hollow Road',
    creatorId: 1,
    gameMasterIds: [1],
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    fear: 0,
    gmNotes,
    isEnded: false,
    createdAt: '',
    lastModifiedAt: '',
  };
}

describe('GmNotesPanel', () => {
  let fixture: ComponentFixture<GmNotesPanel>;
  let component: GmNotesPanel;
  let context: GmScreenContext;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GmNotesPanel],
      providers: [provideHttpClient(), provideHttpClientTesting(), GmScreenContext],
    });
    context = TestBed.inject(GmScreenContext);
    context.setCampaign(campaign('the door is a mimic'));
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(GmNotesPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    httpMock.verify();
  });

  it('renders the existing notes in the textarea', () => {
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.notes__input');
    expect(textarea.value).toBe('the door is a mimic');
  });

  it('shows the character count against the 50,000 cap', () => {
    const footer: string = fixture.nativeElement.querySelector('.notes__count').textContent;
    expect(footer.trim()).toBe('19 / 50000');
  });

  it('issues exactly one request per keystroke burst', () => {
    vi.useFakeTimers();

    component.onInput('a');
    component.onInput('ab');
    component.onInput('abc');
    vi.advanceTimersByTime(800);

    const request = httpMock.expectOne(NOTES_URL);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ gmNotes: 'abc' });
    request.flush(campaign('abc'));
  });

  it('does not save before the debounce elapses', () => {
    vi.useFakeTimers();

    component.onInput('a');
    vi.advanceTimersByTime(500);

    httpMock.expectNone(NOTES_URL);

    vi.advanceTimersByTime(300);
    httpMock.expectOne(NOTES_URL).flush(campaign('a'));
  });

  it('rolls the notes back to the last saved value when the save fails', () => {
    vi.useFakeTimers();

    component.onInput('scrapped draft');
    vi.advanceTimersByTime(800);
    httpMock.expectOne(NOTES_URL).flush('boom', { status: 500, statusText: 'Server Error' });

    expect(context.gmNotes()).toBe('the door is a mimic');
  });

  it('caps the stored value at 50,000 characters', () => {
    vi.useFakeTimers();

    component.onInput('x'.repeat(50_010));
    vi.advanceTimersByTime(800);

    expect(component.charCount()).toBe(50_000);
    httpMock.expectOne(NOTES_URL).flush(campaign('x'.repeat(50_000)));
  });

  it('uses 12 rows on a wide viewport', () => {
    expect(component.rows()).toBe(12);
  });
});
