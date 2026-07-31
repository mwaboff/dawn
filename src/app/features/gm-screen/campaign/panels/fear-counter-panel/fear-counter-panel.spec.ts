import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CampaignResponse } from '../../../../../shared/models/campaign-api.model';
import { GmScreenContext } from '../../gm-screen-context.service';
import { FearCounterPanel } from './fear-counter-panel';

const FEAR_URL = 'http://localhost:8080/api/dh/campaigns/7/fear';

function campaign(fear: number): CampaignResponse {
  return {
    id: 7,
    name: 'The Hollow Road',
    creatorId: 1,
    gameMasterIds: [1],
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    fear,
    isEnded: false,
    createdAt: '',
    lastModifiedAt: '',
  };
}

describe('FearCounterPanel', () => {
  let fixture: ComponentFixture<FearCounterPanel>;
  let component: FearCounterPanel;
  let context: GmScreenContext;
  let httpMock: HttpTestingController;

  function setUp(fear: number): void {
    TestBed.configureTestingModule({
      imports: [FearCounterPanel],
      providers: [provideHttpClient(), provideHttpClientTesting(), GmScreenContext],
    });
    context = TestBed.inject(GmScreenContext);
    context.setCampaign(campaign(fear));
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FearCounterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('renders the current fear value', () => {
    setUp(3);

    expect(fixture.nativeElement.querySelector('.fear__value').textContent.trim()).toBe('3');
  });

  it('PATCHes the new value when fear is increased', () => {
    setUp(3);

    component.adjust(1);

    const request = httpMock.expectOne(FEAR_URL);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ fear: 4 });
    request.flush(campaign(4));
  });

  it('updates optimistically before the request resolves', () => {
    setUp(3);

    component.adjust(1);

    expect(component.fear()).toBe(4);
    httpMock.expectOne(FEAR_URL).flush(campaign(4));
  });

  it('rolls the local value back when the save fails', () => {
    setUp(3);

    component.adjust(1);
    httpMock.expectOne(FEAR_URL).flush('boom', { status: 500, statusText: 'Server Error' });

    expect(component.fear()).toBe(3);
  });

  it('clamps at 12 and issues no request', () => {
    setUp(12);

    component.adjust(1);

    expect(component.fear()).toBe(12);
    httpMock.expectNone(FEAR_URL);
  });

  it('clamps at 0 and issues no request', () => {
    setUp(0);

    component.adjust(-1);

    expect(component.fear()).toBe(0);
    httpMock.expectNone(FEAR_URL);
  });

  it('disables the decrement button at 0', () => {
    setUp(0);

    const decrement: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.fear__step')[0];
    expect(decrement.disabled).toBe(true);
  });

  it('saves when the increment button is clicked', () => {
    setUp(5);

    const increment: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.fear__step')[1];
    increment.click();

    expect(httpMock.expectOne(FEAR_URL).request.body).toEqual({ fear: 6 });
  });
});
