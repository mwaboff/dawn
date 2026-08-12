import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminContentService } from './admin-content.service';
import { BulkSrdUpdateResponse } from '../models/bulk-srd.model';
import { environment } from '../../../../../environments/environment';

describe('AdminContentService', () => {
  let service: AdminContentService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/admin/content`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminContentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('PATCHes the bulk SRD endpoint with the request body', () => {
    service.updateSrd({ type: 'WEAPON', ids: [1, 2], srd: true }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/srd`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ type: 'WEAPON', ids: [1, 2], srd: true });
    expect(req.request.withCredentials).toBe(true);

    const response: BulkSrdUpdateResponse = { type: 'WEAPON', srd: true, updatedIds: [1, 2], unknownIds: [] };
    req.flush(response);
  });

  it('propagates errors so the caller can build a partial-success summary', () => {
    let captured: unknown;
    service.updateSrd({ type: 'DOMAIN', ids: [1], srd: false }).subscribe({ error: (e) => (captured = e) });
    const req = httpMock.expectOne(`${baseUrl}/srd`);
    req.flush({ message: 'Cannot flag srd on type=SUBCLASS_CARD' }, { status: 400, statusText: 'Bad Request' });
    expect((captured as { status: number }).status).toBe(400);
  });
});
