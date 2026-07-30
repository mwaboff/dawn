import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { LookupOption } from '../models/lookup-option.model';
import { FeatureResponse } from '../models/feature-api.model';
import { mapFeatureResponseToCardData } from '../mappers/feature.mapper';

interface FeatureItem {
  id: number;
  name: string;
}

export interface FeatureBrowseOptions {
  page?: number;
  size?: number;
  expansionId?: number;
  featureType?: string;
}

@Injectable({ providedIn: 'root' })
export class FeatureLookupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/features`;

  list(params: { featureType: string }): Observable<LookupOption[]> {
    const httpParams = new HttpParams().set('featureType', params.featureType);
    return this.http
      .get<PaginatedResponse<FeatureItem>>(this.baseUrl, { params: httpParams, withCredentials: true })
      .pipe(map(response => response.content.map(item => ({ id: item.id, label: item.name }))));
  }

  /**
   * Fetches a paginated page of features for admin browse mode. Unlike `list()`, this does
   * not require a `featureType` filter -- it surfaces every feature row, including unattached
   * (ownerless) ones that have no owning card (e.g. the standalone p179 features an adversary
   * can be given).
   */
  getFeaturesPaginated(options: FeatureBrowseOptions = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, expansionId, featureType } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'costTags');

    if (expansionId !== undefined) {
      params = params.set('expansionId', expansionId);
    }
    if (featureType !== undefined) {
      params = params.set('featureType', featureType);
    }

    return this.http
      .get<PaginatedResponse<FeatureResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapFeatureResponseToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }
}
