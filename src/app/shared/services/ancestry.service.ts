import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import { AncestryCardResponse } from '../models/ancestry-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { mapAncestryResponseToCardData } from '../mappers/ancestry.mapper';

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
}
