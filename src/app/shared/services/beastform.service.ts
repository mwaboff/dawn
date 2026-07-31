import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { BeastformFilters, BeastformResponse } from '../models/beastform-api.model';
import { mapBeastformToCardData } from '../mappers/beastform.mapper';

@Injectable({ providedIn: 'root' })
export class BeastformService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/beastforms`;

  getBeastformsPaginated(options: BeastformFilters = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, expansionId, isOfficial, isPublic } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'features');

    if (expansionId !== undefined) {
      params = params.set('expansionId', expansionId);
    }
    if (isOfficial !== undefined) {
      params = params.set('isOfficial', isOfficial);
    }
    if (isPublic !== undefined) {
      params = params.set('isPublic', isPublic);
    }

    return this.http
      .get<PaginatedResponse<BeastformResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapBeastformToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }
}
