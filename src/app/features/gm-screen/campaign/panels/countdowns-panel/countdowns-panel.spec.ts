import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CampaignResponse } from '../../../../../shared/models/campaign-api.model';
import { CountdownResponse } from '../../../../../shared/models/countdown-api.model';
import { GmScreenContext } from '../../gm-screen-context.service';
import { CountdownsPanel } from './countdowns-panel';

const LIST_URL = 'http://localhost:8080/api/dh/countdowns?campaignId=7';
const BASE_URL = 'http://localhost:8080/api/dh/countdowns';

function campaign(): CampaignResponse {
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
    isEnded: false,
    createdAt: '',
    lastModifiedAt: '',
  } as CampaignResponse;
}

function countdown(overrides: Partial<CountdownResponse> = {}): CountdownResponse {
  return {
    id: 1,
    campaignId: 7,
    name: 'The ritual completes',
    type: 'CONSEQUENCE',
    loopBehavior: 'NONE',
    startingValue: 8,
    currentValue: 8,
    displayOrder: 0,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

describe('CountdownsPanel', () => {
  let fixture: ComponentFixture<CountdownsPanel>;
  let component: CountdownsPanel;
  let context: GmScreenContext;
  let httpMock: HttpTestingController;

  function setUp(seedCampaign = true): void {
    TestBed.configureTestingModule({
      imports: [CountdownsPanel],
      providers: [provideHttpClient(), provideHttpClientTesting(), GmScreenContext],
    });
    context = TestBed.inject(GmScreenContext);
    if (seedCampaign) context.setCampaign(campaign());
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CountdownsPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => httpMock.verify());

  it('loads the campaign countdowns on init', () => {
    setUp();
    const request = httpMock.expectOne(LIST_URL);
    expect(request.request.method).toBe('GET');
    request.flush([countdown()]);
  });

  it('issues no request when the campaign id is not yet known', () => {
    setUp(false);
    httpMock.expectNone(LIST_URL);
  });

  it('renders a row per countdown', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([countdown(), countdown({ id: 2, name: 'Reinforcements' })]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-countdown-row').length).toBe(2);
  });

  it('shows an empty state when there are no countdowns', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.gm-panel__note').textContent).toContain(
      'No countdowns yet',
    );
  });

  it('reports a failed load', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.loadFailed()).toBe(true);
  });

  it('ticks optimistically before the request resolves', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([countdown()]);

    component.onTick(countdown(), 7);
    expect(component.countdowns()[0].currentValue).toBe(7);

    httpMock.expectOne(`${BASE_URL}/1/value`).flush(countdown({ currentValue: 7 }));
  });

  it('sends the absolute value when ticking', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([countdown()]);

    component.onTick(countdown(), 7);

    const request = httpMock.expectOne(`${BASE_URL}/1/value`);
    expect(request.request.body).toEqual({ currentValue: 7 });
    request.flush(countdown({ currentValue: 7 }));
  });

  it('rolls the value back when a tick fails', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([countdown()]);

    component.onTick(countdown(), 7);
    httpMock.expectOne(`${BASE_URL}/1/value`).flush('boom', { status: 500, statusText: 'Error' });

    expect(component.countdowns()[0].currentValue).toBe(8);
  });

  it('adopts a looped value returned by the server', () => {
    setUp();
    const looping = countdown({ currentValue: 1, startingValue: 3, loopBehavior: 'LOOP' });
    httpMock.expectOne(LIST_URL).flush([looping]);

    component.onTick(looping, 0);
    httpMock.expectOne(`${BASE_URL}/1/value`).flush(countdown({ currentValue: 3, startingValue: 3 }));

    expect(component.countdowns()[0].currentValue).toBe(3);
  });

  it('issues no request when a tick would exceed the starting value', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([countdown()]);

    component.onTick(countdown(), 9);

    httpMock.expectNone(`${BASE_URL}/1/value`);
  });

  it('issues no request when a tick would go below zero', () => {
    setUp();
    const spent = countdown({ currentValue: 0 });
    httpMock.expectOne(LIST_URL).flush([spent]);

    component.onTick(spent, -1);

    httpMock.expectNone(`${BASE_URL}/1/value`);
  });

  it('removes the row and DELETEs on a confirmed delete', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([countdown()]);

    component.onDeleteConfirmed(countdown());
    expect(component.countdowns()).toHaveLength(0);

    httpMock.expectOne(`${BASE_URL}/1`).flush(null);
  });

  it('restores the row when a delete fails', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([countdown()]);

    component.onDeleteConfirmed(countdown());
    httpMock.expectOne(`${BASE_URL}/1`).flush('boom', { status: 500, statusText: 'Error' });

    expect(component.countdowns()).toHaveLength(1);
  });

  it('POSTs and appends a newly created countdown', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([]);

    component.form.setValue({
      name: 'Reinforcements',
      type: 'STANDARD',
      loopBehavior: 'NONE',
      startingValue: 4,
    });
    component.onSubmit();

    const request = httpMock.expectOne(BASE_URL);
    expect(request.request.body.campaignId).toBe(7);
    request.flush(countdown({ id: 9, name: 'Reinforcements' }));

    expect(component.countdowns()).toHaveLength(1);
  });

  it('does not submit an invalid form', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([]);

    component.form.setValue({ name: '', type: 'STANDARD', loopBehavior: 'NONE', startingValue: 4 });
    component.onSubmit();

    httpMock.expectNone(BASE_URL);
  });

  it('clears the adding flag when creation fails', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([]);

    component.form.setValue({
      name: 'Reinforcements',
      type: 'STANDARD',
      loopBehavior: 'NONE',
      startingValue: 4,
    });
    component.onSubmit();
    httpMock.expectOne(BASE_URL).flush('boom', { status: 500, statusText: 'Error' });

    expect(component.adding()).toBe(false);
  });

  it('exposes the advancement table once help is opened', () => {
    setUp();
    httpMock.expectOne(LIST_URL).flush([]);

    component.toggleHelp();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.gm-panel__table')).not.toBeNull();
  });
});
