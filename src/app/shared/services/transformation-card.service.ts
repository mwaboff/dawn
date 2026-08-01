import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { TransformationCardFilters, TransformationCardResponse } from '../models/transformation-card-api.model';
import { mapTransformationCardToCardData } from '../mappers/transformation-card.mapper';

@Injectable({ providedIn: 'root' })
export class TransformationCardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/transformation-cards`;

  /**
   * Fetches the full transformation card catalog as raw responses in a single page, for callers
   * that need the feature/question fields rather than `CardData`. There are only 6 official
   * cards, so `size` defaults to 100 -- the same headroom convention `BeastformService` uses --
   * to fit the catalog plus any homebrew additions in one page.
   */
  getAllTransformationCards(size = 100): Observable<TransformationCardResponse[]> {
    const params = new HttpParams()
      .set('page', 0)
      .set('size', size)
      .set('expand', 'features,questions');

    return this.http
      .get<PaginatedResponse<TransformationCardResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content));
  }

  getTransformationCardsPaginated(options: TransformationCardFilters = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, expansionId } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'features,questions');

    if (expansionId !== undefined) {
      params = params.set('expansionId', expansionId);
    }

    return this.http
      .get<PaginatedResponse<TransformationCardResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapTransformationCardToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }
}
