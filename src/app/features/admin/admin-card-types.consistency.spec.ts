import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CARD_EDIT_SCHEMAS } from './card-edit/schema/card-edit-schema';
import { CARD_TYPE_OPTIONS } from './bulk-upload/bulk-upload';
import { ADMIN_CATEGORIES } from './card-search/card-search';
import { AdminCardService } from '../../shared/services/admin-card.service';
import {
  FeatureType,
  FEATURE_TYPE_LABELS,
  DEFAULT_FEATURE_TYPE_FOR_CARD,
} from '../../shared/models/feature-type.model';

/**
 * Guard suite for the four lookup maps a new card type must be registered in
 * (ENDPOINT_MAP, CARD_TYPE_OPTIONS, ADMIN_CATEGORIES, DEFAULT_FEATURE_TYPE_FOR_CARD)
 * plus FEATURE_TYPE_LABELS. A mistyped or missing key in any of these silently falls
 * back to OTHER/undefined instead of failing to compile -- these tests exist to make
 * that failure loud instead of silent.
 */
describe('admin card type registration consistency', () => {
  let service: AdminCardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminCardService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AdminCardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('resolves every CARD_EDIT_SCHEMAS key in AdminCardService.ENDPOINT_MAP', () => {
    for (const cardType of Object.keys(CARD_EDIT_SCHEMAS)) {
      expect(() => service.getCard(cardType, 1)).not.toThrow();
    }
    httpMock.match(() => true).forEach(req => req.flush({}));
  });

  it('resolves every CARD_TYPE_OPTIONS value in AdminCardService.ENDPOINT_MAP', () => {
    for (const { value } of CARD_TYPE_OPTIONS) {
      expect(() => service.getCard(value, 1)).not.toThrow();
    }
    httpMock.match(() => true).forEach(req => req.flush({}));
  });

  it('resolves every ADMIN_CATEGORIES id in AdminCardService.ENDPOINT_MAP', () => {
    for (const { id } of ADMIN_CATEGORIES) {
      expect(() => service.getCard(id, 1)).not.toThrow();
    }
    httpMock.match(() => true).forEach(req => req.flush({}));
  });

  // 'expansion' is deliberately absent from CARD_TYPE_OPTIONS: ExpansionController has
  // no '/bulk' endpoint, so bulk-uploading expansions would 404 on every attempt.
  // 'companion' is deliberately absent: Companion is character-owned content, not
  // catalog content, and has no bulk endpoint either.
  const CARD_TYPE_OPTIONS_ALLOWED_OMISSIONS = new Set(['expansion', 'companion']);

  it('every CARD_EDIT_SCHEMAS key is either in CARD_TYPE_OPTIONS or an explicit allowlisted omission', () => {
    const bulkUploadValues = new Set(CARD_TYPE_OPTIONS.map(o => o.value));
    for (const cardType of Object.keys(CARD_EDIT_SCHEMAS)) {
      const registered = bulkUploadValues.has(cardType);
      const allowlisted = CARD_TYPE_OPTIONS_ALLOWED_OMISSIONS.has(cardType);
      expect(registered || allowlisted).toBe(true);
    }
  });

  it('every DEFAULT_FEATURE_TYPE_FOR_CARD key is a known card type (present in CARD_EDIT_SCHEMAS)', () => {
    const knownCardTypes = new Set(Object.keys(CARD_EDIT_SCHEMAS));
    for (const cardType of Object.keys(DEFAULT_FEATURE_TYPE_FOR_CARD)) {
      expect(knownCardTypes.has(cardType)).toBe(true);
    }
  });

  // 'expansion' is deliberately absent from DEFAULT_FEATURE_TYPE_FOR_CARD: an Expansion
  // has no attachable features, so a default feature type for it would be dead code.
  it('has no entry for expansion', () => {
    expect('expansion' in DEFAULT_FEATURE_TYPE_FOR_CARD).toBe(false);
  });

  it('has entries for all five newly-registered card types (transformationCard, environment, martialStance, beastform, condition)', () => {
    for (const cardType of ['transformationCard', 'environment', 'martialStance', 'beastform', 'condition']) {
      expect(cardType in DEFAULT_FEATURE_TYPE_FOR_CARD).toBe(true);
    }
  });

  it('every DEFAULT_FEATURE_TYPE_FOR_CARD value is a member of the FeatureType union', () => {
    const validTypes = new Set(Object.keys(FEATURE_TYPE_LABELS));
    for (const value of Object.values(DEFAULT_FEATURE_TYPE_FOR_CARD)) {
      expect(validTypes.has(value)).toBe(true);
    }
  });

  it('FEATURE_TYPE_LABELS is exhaustive over the FeatureType union', () => {
    const allFeatureTypes: FeatureType[] = [
      'HOPE', 'ANCESTRY', 'CLASS', 'COMMUNITY', 'DOMAIN', 'ITEM', 'SUBCLASS', 'OTHER',
      'TRANSFORMATION', 'ENVIRONMENT', 'CAMPAIGN_FRAME',
      'BEASTFORM', 'MARTIAL_STANCE', 'ADVERSARY',
    ];
    for (const type of allFeatureTypes) {
      expect(FEATURE_TYPE_LABELS[type]).toBeTruthy();
    }
    expect(Object.keys(FEATURE_TYPE_LABELS).length).toBe(allFeatureTypes.length);
  });
});
