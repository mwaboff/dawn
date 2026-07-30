import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { EnvironmentFilters, EnvironmentResponse } from '../models/environment-api.model';
import { mapEnvironmentToCardData } from '../mappers/environment.mapper';

@Injectable({ providedIn: 'root' })
export class EnvironmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/environments`;

  getEnvironmentsPaginated(options: EnvironmentFilters = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, tier, environmentType, isOfficial, expansionId } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'features');

    if (tier !== undefined) {
      params = params.set('tier', tier);
    }
    if (environmentType !== undefined) {
      params = params.set('environmentType', environmentType);
    }
    if (isOfficial !== undefined) {
      params = params.set('isOfficial', isOfficial);
    }
    if (expansionId !== undefined) {
      params = params.set('expansionId', expansionId);
    }

    return this.http
      .get<PaginatedResponse<EnvironmentResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapEnvironmentToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }
}
