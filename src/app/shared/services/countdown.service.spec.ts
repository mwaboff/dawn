import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CountdownResponse } from '../models/countdown-api.model';
import { CountdownService } from './countdown.service';

const BASE_URL = 'http://localhost:8080/api/dh/countdowns';

function countdown(): CountdownResponse {
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
  };
}

describe('CountdownService', () => {
  let service: CountdownService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CountdownService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests a campaign\'s countdowns by query param', () => {
    service.getCountdowns(7).subscribe();

    const request = httpMock.expectOne(`${BASE_URL}?campaignId=7`);
    expect(request.request.method).toBe('GET');
    request.flush([countdown()]);
  });

  it('sends credentials so the auth cookie is included', () => {
    service.getCountdowns(7).subscribe();

    const request = httpMock.expectOne(`${BASE_URL}?campaignId=7`);
    expect(request.request.withCredentials).toBe(true);
    request.flush([]);
  });

  it('POSTs a new countdown', () => {
    service
      .createCountdown({
        campaignId: 7,
        name: 'Reinforcements',
        type: 'STANDARD',
        loopBehavior: 'NONE',
        startingValue: 4,
      })
      .subscribe();

    const request = httpMock.expectOne(BASE_URL);
    expect(request.request.body.startingValue).toBe(4);
    request.flush(countdown());
  });

  it('PATCHes an absolute value when ticking', () => {
    service.updateCountdownValue(1, 5).subscribe();

    const request = httpMock.expectOne(`${BASE_URL}/1/value`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ currentValue: 5 });
    request.flush(countdown());
  });

  it('PUTs a countdown definition update', () => {
    service
      .updateCountdown(1, {
        name: 'Renamed',
        type: 'PROGRESS',
        loopBehavior: 'LOOP',
        startingValue: 6,
      })
      .subscribe();

    const request = httpMock.expectOne(`${BASE_URL}/1`);
    expect(request.request.method).toBe('PUT');
    request.flush(countdown());
  });

  it('DELETEs a countdown by id', () => {
    service.deleteCountdown(1).subscribe();

    const request = httpMock.expectOne(`${BASE_URL}/1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
