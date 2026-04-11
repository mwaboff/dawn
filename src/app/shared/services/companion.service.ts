import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { CompanionApiResponse } from '../models/companion-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { mapCompanionToCardData } from '../mappers/companion.mapper';

export interface CompanionOptions {
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class CompanionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/companions`;

  getCompanions(page = 0, size = 100): Observable<CardData[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'experiences');

    return this.http
      .get<PaginatedResponse<CompanionApiResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(mapCompanionToCardData)));
  }

  getCompanionsPaginated(options: CompanionOptions = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20 } = options;

    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'experiences');

    return this.http
      .get<PaginatedResponse<CompanionApiResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapCompanionToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }
}
