import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { ExpansionService } from '../../../../shared/services/expansion.service';
import { DomainService } from '../../../../shared/services/domain.service';
import { ClassService } from '../../../../shared/services/class.service';
import { SubclassPathService } from '../../../../shared/services/subclass-path.service';
import { FeatureLookupService } from '../../../../shared/services/feature-lookup.service';
import { CostTagLookupService } from '../../../../shared/services/cost-tag-lookup.service';
import { LookupKey, LookupOption } from '../schema/card-edit-schema.types';

interface LookupParams {
  classId?: number;
  expansionId?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminLookupService {
  private readonly expansionService = inject(ExpansionService);
  private readonly domainService = inject(DomainService);
  private readonly classService = inject(ClassService);
  private readonly subclassPathService = inject(SubclassPathService);
  private readonly featureLookupService = inject(FeatureLookupService);
  private readonly costTagLookupService = inject(CostTagLookupService);

  private readonly cache = new Map<string, Observable<LookupOption[]>>();

  list(key: LookupKey, params?: LookupParams): Observable<LookupOption[]> {
    const cacheKey = this.buildCacheKey(key, params);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const obs = this.fetch(key, params);
    this.cache.set(cacheKey, obs);
    return obs;
  }

  refresh(key: LookupKey, params?: LookupParams): Observable<LookupOption[]> {
    const obs = this.fetch(key, params);
    this.cache.set(this.buildCacheKey(key, params), obs);
    return obs;
  }

  invalidate(key: LookupKey): void {
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(`${key}:`)) {
        this.cache.delete(cacheKey);
      }
    }
  }

  private fetch(key: LookupKey, params?: LookupParams): Observable<LookupOption[]> {
    return this.resolve(key, params).pipe(shareReplay(1));
  }

  private resolve(key: LookupKey, params?: LookupParams): Observable<LookupOption[]> {
    switch (key) {
      case 'expansions':
        return this.expansionService
          .getExpansions()
          .pipe(map(items => items.map(e => ({ id: e.id, label: e.name }))));
      case 'domains':
        return this.domainService.getDomainOptions();
      case 'classes':
        return this.classService.getClassOptions();
      case 'subclassPaths':
        return this.subclassPathService.getOptions(params?.classId);
      case 'domainFeatures':
        return this.featureLookupService.list({ featureType: 'DOMAIN' });
      case 'ancestryFeatures':
        return this.featureLookupService.list({ featureType: 'ANCESTRY' });
      case 'classFeatures':
        return this.featureLookupService.list({ featureType: 'CLASS' });
      case 'hopeFeatures':
        return this.featureLookupService.list({ featureType: 'HOPE' });
      case 'communityFeatures':
        return this.featureLookupService.list({ featureType: 'COMMUNITY' });
      case 'subclassFeatures':
        return this.featureLookupService.list({ featureType: 'SUBCLASS' });
      case 'costTags':
        return this.costTagLookupService.list();
    }
  }

  private buildCacheKey(key: LookupKey, params?: LookupParams): string {
    if (!params || Object.keys(params).length === 0) {
      return `${key}:`;
    }
    const filtered: Partial<LookupParams> = {};
    if (params.classId !== undefined) filtered.classId = params.classId;
    if (params.expansionId !== undefined) filtered.expansionId = params.expansionId;
    if (Object.keys(filtered).length === 0) {
      return `${key}:`;
    }
    return `${key}:${JSON.stringify(filtered)}`;
  }
}
