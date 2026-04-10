import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { SubclassCardResponse } from '../models/subclass-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { mapSubclassResponseToCardData } from '../mappers/subclass.mapper';

export interface SubclassOptions {
  page?: number;
  size?: number;
  associatedClassId?: number;
  expansionId?: number;
  isOfficial?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SubclassService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/cards/subclass`;
  private readonly cache = new Map<number, CardData[]>();

  getSubclasses(classId: number, page = 0, size = 20): Observable<CardData[]> {
    const cached = this.cache.get(classId);
    if (cached) {
      return of(cached);
    }

    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'features,costTags,subclassPath')
      .set('associatedClassId', classId);

    return this.http
      .get<PaginatedResponse<SubclassCardResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(
        map(response => response.content.map(mapSubclassResponseToCardData)),
        tap(cards => this.cache.set(classId, cards)),
      );
  }

  getSubclassesPaginated(options: SubclassOptions = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, associatedClassId, expansionId, isOfficial } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'features,costTags,subclassPath');

    if (associatedClassId !== undefined) {
      params = params.set('associatedClassId', associatedClassId);
    }
    if (expansionId !== undefined) {
      params = params.set('expansionId', expansionId);
    }
    if (isOfficial !== undefined) {
      params = params.set('isOfficial', isOfficial);
    }

    return this.http
      .get<PaginatedResponse<SubclassCardResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapSubclassResponseToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }

  clearCache(): void {
    this.cache.clear();
  }
}
