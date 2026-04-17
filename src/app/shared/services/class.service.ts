import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClassResponse } from '../models/class-api.model';
import { ClassCardResponse } from '../../features/create-character/models/character-sheet-api.model';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { mapClassResponseToCardData } from '../mappers/class.mapper';
import { LookupOption } from '../models/lookup-option.model';

export interface ClassOptions {
  page?: number;
  size?: number;
  expansionId?: number;
  isOfficial?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClassService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/classes`;

  getClassOptions(): Observable<LookupOption[]> {
    const params = new HttpParams().set('page', 0).set('size', 100);

    return this.http
      .get<PaginatedResponse<ClassResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(c => ({ id: c.id, label: c.name }))));
  }

  getClassCard(id: number, expand?: string[]): Observable<ClassCardResponse> {
    let params = new HttpParams();
    if (expand?.length) {
      params = params.set('expand', expand.join(','));
    }
    return this.http.get<ClassCardResponse>(`${this.baseUrl}/${id}`, {
      params,
      withCredentials: true,
    });
  }

  getClasses(page = 0, size = 100): Observable<CardData[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'associatedDomains,classFeatures,hopeFeatures,costTags');

    return this.http
      .get<PaginatedResponse<ClassResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(mapClassResponseToCardData)));
  }

  getClassesPaginated(options: ClassOptions = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, expansionId, isOfficial } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'associatedDomains,classFeatures,hopeFeatures,costTags');

    if (expansionId !== undefined) {
      params = params.set('expansionId', expansionId);
    }
    if (isOfficial !== undefined) {
      params = params.set('isOfficial', isOfficial);
    }

    return this.http
      .get<PaginatedResponse<ClassResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapClassResponseToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }
}
