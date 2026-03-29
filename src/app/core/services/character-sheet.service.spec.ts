import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';

import { CharacterSheetService } from './character-sheet.service';
import {
  CharacterSheetResponse,
  CreateCharacterSheetRequest,
  CreateExperienceRequest,
} from '../../features/create-character/models/character-sheet-api.model';

function buildCreateRequest(overrides: Partial<CreateCharacterSheetRequest> = {}): CreateCharacterSheetRequest {
  return {
    name: 'Test Hero',
    level: 1,
    evasion: 8,
    armorMax: 0,
    armorMarked: 0,
    majorDamageThreshold: 3,
    severeDamageThreshold: 6,
    agilityModifier: 1,
    agilityMarked: false,
    strengthModifier: 0,
    strengthMarked: false,
    finesseModifier: 0,
    finesseMarked: false,
    instinctModifier: 0,
    instinctMarked: false,
    presenceModifier: 0,
    presenceMarked: false,
    knowledgeModifier: -1,
    knowledgeMarked: false,
    hitPointMax: 6,
    hitPointMarked: 0,
    stressMax: 6,
    stressMarked: 0,
    hopeMax: 6,
    hopeMarked: 2,
    gold: 0,
    ...overrides,
  };
}

function buildSheetResponse(overrides: Partial<CharacterSheetResponse> = {}): CharacterSheetResponse {
  return {
    id: 42,
    name: 'Test Hero',
    level: 1,
    evasion: 8,
    armorMax: 0,
    armorMarked: 0,
    majorDamageThreshold: 3,
    severeDamageThreshold: 6,
    agilityModifier: 1,
    agilityMarked: false,
    strengthModifier: 0,
    strengthMarked: false,
    finesseModifier: 0,
    finesseMarked: false,
    instinctModifier: 0,
    instinctMarked: false,
    presenceModifier: 0,
    presenceMarked: false,
    knowledgeModifier: -1,
    knowledgeMarked: false,
    hitPointMax: 6,
    hitPointMarked: 0,
    stressMax: 6,
    stressMarked: 0,
    hopeMax: 6,
    hopeMarked: 2,
    gold: 0,
    ownerId: 1,
    proficiency: 1,
    equippedDomainCardIds: [],
    vaultDomainCardIds: [],
    communityCardIds: [],
    ancestryCardIds: [],
    subclassCardIds: [],
    domainCardIds: [],
    inventoryWeapons: [],
    inventoryArmors: [],
    inventoryItems: [],
    experienceIds: [],
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('CharacterSheetService', () => {
  let service: CharacterSheetService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CharacterSheetService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('createCharacterSheet', () => {
    it('should POST to the correct URL', () => {
      service.createCharacterSheet(buildCreateRequest()).subscribe();

      const req = httpTesting.expectOne('http://localhost:8080/api/dh/character-sheets');
      expect(req.request.method).toBe('POST');
      req.flush(buildSheetResponse());
    });

    it('should send withCredentials: true', () => {
      service.createCharacterSheet(buildCreateRequest()).subscribe();

      const req = httpTesting.expectOne('http://localhost:8080/api/dh/character-sheets');
      expect(req.request.withCredentials).toBe(true);
      req.flush(buildSheetResponse());
    });

    it('should return the response body', () => {
      const mockResponse = buildSheetResponse({ id: 99, name: 'Hero' });
      let result: CharacterSheetResponse | undefined;

      service.createCharacterSheet(buildCreateRequest()).subscribe(r => (result = r));

      const req = httpTesting.expectOne('http://localhost:8080/api/dh/character-sheets');
      req.flush(mockResponse);

      expect(result?.id).toBe(99);
      expect(result?.name).toBe('Hero');
    });

    it('should propagate HTTP errors', () => {
      let error: HttpErrorResponse | undefined;
      service.createCharacterSheet(buildCreateRequest()).subscribe({ error: e => (error = e) });

      const req = httpTesting.expectOne('http://localhost:8080/api/dh/character-sheets');
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      expect(error?.status).toBe(400);
    });
  });

  describe('createExperience', () => {
    const expRequest: CreateExperienceRequest = {
      characterSheetId: 42,
      description: 'Acrobatics',
      modifier: 2,
    };

    it('should POST to the correct URL', () => {
      service.createExperience(expRequest).subscribe();

      const req = httpTesting.expectOne('http://localhost:8080/api/dh/experiences');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 1, characterSheetId: 42, description: 'Acrobatics', modifier: 2 });
    });

    it('should send withCredentials: true', () => {
      service.createExperience(expRequest).subscribe();

      const req = httpTesting.expectOne('http://localhost:8080/api/dh/experiences');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ id: 1, characterSheetId: 42, description: 'Acrobatics', modifier: 2 });
    });

    it('should return the experience response', () => {
      let result: unknown;
      service.createExperience(expRequest).subscribe(r => (result = r));

      const req = httpTesting.expectOne('http://localhost:8080/api/dh/experiences');
      req.flush({ id: 7, characterSheetId: 42, description: 'Acrobatics', modifier: 2 });

      expect((result as { id: number }).id).toBe(7);
    });
  });

  describe('getCharacterSheet', () => {
    it('should GET from the correct URL', () => {
      service.getCharacterSheet(42).subscribe();

      const req = httpTesting.expectOne('http://localhost:8080/api/dh/character-sheets/42');
      expect(req.request.method).toBe('GET');
      req.flush(buildSheetResponse());
    });

    it('should send withCredentials: true', () => {
      service.getCharacterSheet(42).subscribe();

      const req = httpTesting.expectOne('http://localhost:8080/api/dh/character-sheets/42');
      expect(req.request.withCredentials).toBe(true);
      req.flush(buildSheetResponse());
    });

    it('should include expand query param when provided', () => {
      service.getCharacterSheet(42, ['domainCards', 'subclassCards']).subscribe();

      const req = httpTesting.expectOne(
        r => r.url === 'http://localhost:8080/api/dh/character-sheets/42' &&
          r.params.get('expand') === 'domainCards,subclassCards',
      );
      req.flush(buildSheetResponse());
      expect(req.request.method).toBe('GET');
    });

    it('should not include expand param when not provided', () => {
      service.getCharacterSheet(42).subscribe();

      const req = httpTesting.expectOne('http://localhost:8080/api/dh/character-sheets/42');
      expect(req.request.params.has('expand')).toBe(false);
      req.flush(buildSheetResponse());
    });
  });
});
