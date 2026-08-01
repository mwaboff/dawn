import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { MartialStanceFilters, MartialStanceResponse } from '../models/martial-stance-api.model';
import { mapMartialStanceToCardData } from '../mappers/martial-stance.mapper';

@Injectable({ providedIn: 'root' })
export class MartialStanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/martial-stances`;

  /**
   * Fetches the full martial stance catalog as raw responses in a single page. There are 16
   * official stances (4 per tier), so `size` defaults to 100 -- the same headroom convention
   * `BeastformService` uses -- to fit the catalog plus any homebrew additions in one page.
   */
  getAllMartialStances(size = 100): Observable<MartialStanceResponse[]> {
    const params = new HttpParams()
      .set('page', 0)
      .set('size', size)
      .set('expand', 'features');

    return this.http
      .get<PaginatedResponse<MartialStanceResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content));
  }

  getMartialStancesPaginated(options: MartialStanceFilters = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, tier, isOfficial, expansionId } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'features');

    if (tier !== undefined) {
      params = params.set('tier', tier);
    }
    if (isOfficial !== undefined) {
      params = params.set('isOfficial', isOfficial);
    }
    if (expansionId !== undefined) {
      params = params.set('expansionId', expansionId);
    }

    return this.http
      .get<PaginatedResponse<MartialStanceResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapMartialStanceToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }
}
