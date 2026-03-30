import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FeatureEditService } from './feature-edit.service';
import { FeatureUpdateRequest } from '../../features/admin/models/admin-api.model';

describe('FeatureEditService', () => {
  let service: FeatureEditService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FeatureEditService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    service = TestBed.inject(FeatureEditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should PUT feature update to correct endpoint', () => {
    const body: FeatureUpdateRequest = {
      name: 'Updated Feature',
      description: 'New desc',
      featureType: 'CLASS',
      expansionId: 1,
    };

    service.updateFeature(42, body).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/dh/features/42');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 42, ...body, costTagIds: [], modifierIds: [] });
  });

  it('should include costTags and modifiers in request', () => {
    const body: FeatureUpdateRequest = {
      name: 'Feature',
      description: 'Desc',
      featureType: 'HOPE',
      expansionId: 1,
      costTags: [{ label: '1 Hope', category: 'HOPE' }],
      modifiers: [{ target: 'EVASION', operation: 'ADD', value: 2 }],
    };

    service.updateFeature(10, body).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/dh/features/10');
    expect(req.request.body.costTags).toEqual([{ label: '1 Hope', category: 'HOPE' }]);
    expect(req.request.body.modifiers).toEqual([{ target: 'EVASION', operation: 'ADD', value: 2 }]);
    req.flush({});
  });
});
