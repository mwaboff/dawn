import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResponse } from '../models/class-api.model';
import { SubclassCardResponse } from '../models/subclass-api.model';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { mapSubclassResponseToCardData } from './subclass.mapper';

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
      .set('expand', 'features,costTags')
      .set('associatedClassId', classId);

    return this.http
      .get<PaginatedResponse<SubclassCardResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(
        map(response => response.content.map(mapSubclassResponseToCardData)),
        tap(cards => this.cache.set(classId, cards)),
      );
  }

  clearCache(): void {
    this.cache.clear();
  }
}
