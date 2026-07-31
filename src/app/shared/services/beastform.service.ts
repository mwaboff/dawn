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

  /**
   * Fetches the full beastform catalog as raw responses in a single page, for callers that need
   * the stat fields (trait modifiers, evasion, attack) rather than `CardData`.
   *
   * `BeastformController`'s GET exposes no `tier` filter param (see `BeastformFilters`), so any
   * tier narrowing has to happen client-side on this list. `size` defaults to 100 -- the same
   * convention `AncestryService.getAncestries()` uses -- so the 24 official beastforms fit in one
   * page with headroom for expansions, rather than silently truncating at the current count.
   */
  getAllBeastforms(size = 100): Observable<BeastformResponse[]> {
    const params = new HttpParams()
      .set('page', 0)
      .set('size', size)
      .set('expand', 'features');

    return this.http
      .get<PaginatedResponse<BeastformResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content));
  }

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
