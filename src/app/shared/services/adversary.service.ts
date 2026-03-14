import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import { AdversaryApiResponse, AdversaryFilters } from '../models/adversary-api.model';
import { AdversaryData } from '../components/adversary-card/adversary-card.model';
import { mapAdversaryToAdversaryData } from '../mappers/adversary.mapper';

export interface PaginatedAdversaries {
  adversaries: AdversaryData[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

@Injectable({ providedIn: 'root' })
export class AdversaryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/adversaries`;

  getAdversaries(filters: AdversaryFilters = {}): Observable<PaginatedAdversaries> {
    let params = new HttpParams()
      .set('expand', 'features,experiences')
      .set('size', '20');

    if (filters.tier !== undefined) {
      params = params.set('tier', filters.tier);
    }
    if (filters.adversaryType !== undefined) {
      params = params.set('adversaryType', filters.adversaryType);
    }
    if (filters.isOfficial !== undefined) {
      params = params.set('isOfficial', filters.isOfficial);
    }
    if (filters.expansionId !== undefined) {
      params = params.set('expansionId', filters.expansionId);
    }
    if (filters.page !== undefined) {
      params = params.set('page', filters.page);
    }

    return this.http
      .get<PaginatedResponse<AdversaryApiResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        adversaries: response.content.map(mapAdversaryToAdversaryData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }
}
