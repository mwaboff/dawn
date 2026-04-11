import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdminLookupService } from './admin-lookup.service';
import { ExpansionService } from '../../../../shared/services/expansion.service';
import { DomainService } from '../../../../shared/services/domain.service';
import { ClassService } from '../../../../shared/services/class.service';
import { SubclassPathService } from '../../../../shared/services/subclass-path.service';
import { FeatureLookupService } from '../../../../shared/services/feature-lookup.service';
import { CostTagLookupService } from '../../../../shared/services/cost-tag-lookup.service';
import { LookupOption } from '../schema/card-edit-schema.types';

const makeOptions = (...labels: string[]): LookupOption[] =>
  labels.map((label, i) => ({ id: i + 1, label }));

describe('AdminLookupService', () => {
  let service: AdminLookupService;
  let expansionSvc: { getExpansions: ReturnType<typeof vi.fn> };
  let domainSvc: { getDomainOptions: ReturnType<typeof vi.fn> };
  let classSvc: { getClassOptions: ReturnType<typeof vi.fn> };
  let subclassPathSvc: { getOptions: ReturnType<typeof vi.fn> };
  let featureSvc: { list: ReturnType<typeof vi.fn> };
  let costTagSvc: { list: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    expansionSvc = { getExpansions: vi.fn().mockReturnValue(of([{ id: 1, name: 'Core' }])) };
    domainSvc = { getDomainOptions: vi.fn().mockReturnValue(of(makeOptions('Arcana'))) };
    classSvc = { getClassOptions: vi.fn().mockReturnValue(of(makeOptions('Warrior'))) };
    subclassPathSvc = { getOptions: vi.fn().mockReturnValue(of(makeOptions('Path A'))) };
    featureSvc = { list: vi.fn().mockReturnValue(of(makeOptions('Feature X'))) };
    costTagSvc = { list: vi.fn().mockReturnValue(of(makeOptions('Tag Y'))) };

    TestBed.configureTestingModule({
      providers: [
        AdminLookupService,
        { provide: ExpansionService, useValue: expansionSvc },
        { provide: DomainService, useValue: domainSvc },
        { provide: ClassService, useValue: classSvc },
        { provide: SubclassPathService, useValue: subclassPathSvc },
        { provide: FeatureLookupService, useValue: featureSvc },
        { provide: CostTagLookupService, useValue: costTagSvc },
      ],
    });

    service = TestBed.inject(AdminLookupService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('expansions', () => {
    it('delegates to ExpansionService.getExpansions()', () => {
      let result: LookupOption[] | undefined;
      service.list('expansions').subscribe(v => (result = v));
      expect(result).toEqual([{ id: 1, label: 'Core' }]);
    });

    it('maps ExpansionOption name to LookupOption label', () => {
      expansionSvc.getExpansions.mockReturnValue(of([{ id: 42, name: 'Stormfall' }]));
      service.invalidate('expansions');
      let result: LookupOption[] | undefined;
      service.list('expansions').subscribe(v => (result = v));
      expect(result).toEqual([{ id: 42, label: 'Stormfall' }]);
    });
  });

  describe('domains', () => {
    it('delegates to DomainService.getDomainOptions()', () => {
      let result: LookupOption[] | undefined;
      service.list('domains').subscribe(v => (result = v));
      expect(domainSvc.getDomainOptions).toHaveBeenCalledTimes(1);
      expect(result).toEqual(makeOptions('Arcana'));
    });
  });

  describe('classes', () => {
    it('delegates to ClassService.getClassOptions()', () => {
      let result: LookupOption[] | undefined;
      service.list('classes').subscribe(v => (result = v));
      expect(classSvc.getClassOptions).toHaveBeenCalledTimes(1);
      expect(result).toEqual(makeOptions('Warrior'));
    });
  });

  describe('subclassPaths', () => {
    it('delegates to SubclassPathService.getOptions() without classId', () => {
      service.list('subclassPaths').subscribe();
      expect(subclassPathSvc.getOptions).toHaveBeenCalledWith(undefined);
    });

    it('delegates to SubclassPathService.getOptions() with classId', () => {
      service.list('subclassPaths', { classId: 3 }).subscribe();
      expect(subclassPathSvc.getOptions).toHaveBeenCalledWith(3);
    });
  });

  describe('feature types', () => {
    it('delegates domainFeatures to FeatureLookupService with featureType DOMAIN', () => {
      service.list('domainFeatures').subscribe();
      expect(featureSvc.list).toHaveBeenCalledWith({ featureType: 'DOMAIN' });
    });

    it('delegates ancestryFeatures to FeatureLookupService with featureType ANCESTRY', () => {
      service.list('ancestryFeatures').subscribe();
      expect(featureSvc.list).toHaveBeenCalledWith({ featureType: 'ANCESTRY' });
    });

    it('delegates classFeatures to FeatureLookupService with featureType CLASS', () => {
      service.list('classFeatures').subscribe();
      expect(featureSvc.list).toHaveBeenCalledWith({ featureType: 'CLASS' });
    });

    it('delegates hopeFeatures to FeatureLookupService with featureType HOPE', () => {
      service.list('hopeFeatures').subscribe();
      expect(featureSvc.list).toHaveBeenCalledWith({ featureType: 'HOPE' });
    });

    it('delegates communityFeatures to FeatureLookupService with featureType COMMUNITY', () => {
      service.list('communityFeatures').subscribe();
      expect(featureSvc.list).toHaveBeenCalledWith({ featureType: 'COMMUNITY' });
    });

    it('delegates subclassFeatures to FeatureLookupService with featureType SUBCLASS', () => {
      service.list('subclassFeatures').subscribe();
      expect(featureSvc.list).toHaveBeenCalledWith({ featureType: 'SUBCLASS' });
    });
  });

  describe('costTags', () => {
    it('delegates to CostTagLookupService.list()', () => {
      service.list('costTags').subscribe();
      expect(costTagSvc.list).toHaveBeenCalledTimes(1);
    });
  });

  describe('caching', () => {
    it('list() called twice returns cached observable (mock called once)', () => {
      service.list('domains').subscribe();
      service.list('domains').subscribe();
      expect(domainSvc.getDomainOptions).toHaveBeenCalledTimes(1);
    });

    it('invalidate() then list() triggers a new fetch', () => {
      service.list('domains').subscribe();
      service.invalidate('domains');
      service.list('domains').subscribe();
      expect(domainSvc.getDomainOptions).toHaveBeenCalledTimes(2);
    });

    it('refresh() always fetches, bypassing cache', () => {
      service.list('classes').subscribe();
      service.refresh('classes').subscribe();
      expect(classSvc.getClassOptions).toHaveBeenCalledTimes(2);
    });

    it('subclassPaths with different classId params create separate cache entries', () => {
      service.list('subclassPaths', { classId: 1 }).subscribe();
      service.list('subclassPaths', { classId: 2 }).subscribe();
      service.list('subclassPaths', { classId: 1 }).subscribe();
      expect(subclassPathSvc.getOptions).toHaveBeenCalledTimes(2);
    });

    it('invalidate() clears all entries for the key including parameterized ones', () => {
      service.list('subclassPaths').subscribe();
      service.list('subclassPaths', { classId: 3 }).subscribe();
      service.invalidate('subclassPaths');
      service.list('subclassPaths').subscribe();
      service.list('subclassPaths', { classId: 3 }).subscribe();
      expect(subclassPathSvc.getOptions).toHaveBeenCalledTimes(4);
    });

    it('refresh() updates the cache so subsequent list() uses the refreshed observable', () => {
      service.list('costTags').subscribe();
      service.refresh('costTags').subscribe();
      service.list('costTags').subscribe();
      expect(costTagSvc.list).toHaveBeenCalledTimes(2);
    });
  });
});
