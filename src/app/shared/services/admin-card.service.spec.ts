import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminCardService } from './admin-card.service';

describe('AdminCardService', () => {
  let service: AdminCardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminCardService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    service = TestBed.inject(AdminCardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCard', () => {
    it('should GET card by type and id', () => {
      service.getCard('class', 1).subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/dh/classes/1');
      expect(req.request.method).toBe('GET');
      req.flush({ id: 1, name: 'Warrior' });
    });

    it('should include expand param when provided', () => {
      service.getCard('domainCard', 5, 'features,costTags').subscribe();
      const req = httpMock.expectOne(r => r.url === 'http://localhost:8080/api/dh/cards/domain/5');
      expect(req.request.params.get('expand')).toBe('features,costTags');
      req.flush({ id: 5, name: 'Fireball' });
    });

    it('should throw for unknown card type', () => {
      expect(() => service.getCard('unknown', 1)).toThrow('Unknown card type: unknown');
    });
  });

  describe('updateCard', () => {
    it('should PUT card update', () => {
      const body = { name: 'Updated' };
      service.updateCard('weapon', 3, body).subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/dh/weapons/3');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({ id: 3, name: 'Updated' });
    });
  });

  describe('bulkCreate', () => {
    it('should POST to bulk endpoint', () => {
      const items = [{ name: 'A' }, { name: 'B' }];
      service.bulkCreate('armor', items).subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/dh/armors/bulk');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(items);
      req.flush([]);
    });
  });

  describe('deleteCard', () => {
    it('should DELETE card', () => {
      service.deleteCard('loot', 7).subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/dh/loot/7');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('restoreCard', () => {
    it('should POST to restore endpoint', () => {
      service.restoreCard('companion', 2).subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/dh/companions/2/restore');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('endpoint mapping', () => {
    it('should map all known card types to correct endpoints', () => {
      const expectedMappings: Record<string, string> = {
        'class': '/dh/classes',
        'subclass': '/dh/cards/subclass',
        'ancestry': '/dh/cards/ancestry',
        'community': '/dh/cards/community',
        'domain': '/dh/domains',
        'domainCard': '/dh/cards/domain',
        'weapon': '/dh/weapons',
        'armor': '/dh/armors',
        'loot': '/dh/loot',
        'companion': '/dh/companions',
        'subclassPath': '/dh/subclass-paths',
        'adversary': '/dh/adversaries',
        'feature': '/dh/features',
      };

      for (const [type, endpoint] of Object.entries(expectedMappings)) {
        service.getCard(type, 1).subscribe();
        const req = httpMock.expectOne(`http://localhost:8080/api${endpoint}/1`);
        req.flush({});
      }
    });
  });
});
