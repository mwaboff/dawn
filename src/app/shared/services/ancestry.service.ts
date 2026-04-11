import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { AncestryCardResponse, CreateMixedAncestryRequest } from '../models/ancestry-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { mapAncestryResponseToCardData } from '../mappers/ancestry.mapper';

export interface AncestryOptions {
  page?: number;
  size?: number;
  expansionId?: number;
  isOfficial?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AncestryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/cards/ancestry`;

  getAncestries(page = 0, size = 20): Observable<CardData[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'expansion,features,costTags');

    return this.http
      .get<PaginatedResponse<AncestryCardResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(mapAncestryResponseToCardData)));
  }

  getAncestriesPaginated(options: AncestryOptions = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, expansionId, isOfficial } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'expansion,features,costTags');

    if (expansionId !== undefined) {
      params = params.set('expansionId', expansionId);
    }
    if (isOfficial !== undefined) {
      params = params.set('isOfficial', isOfficial);
    }

    return this.http
      .get<PaginatedResponse<AncestryCardResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapAncestryResponseToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }

  createMixedAncestry(request: CreateMixedAncestryRequest): Observable<CardData> {
    return this.http
      .post<AncestryCardResponse>(`${this.baseUrl}/mixed`, request, { withCredentials: true })
      .pipe(map(mapAncestryResponseToCardData));
  }
}
