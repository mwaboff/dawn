import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import { CommunityCardResponse } from '../models/community-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { mapCommunityResponseToCardData } from '../mappers/community.mapper';

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/cards/community`;

  getCommunities(page = 0, size = 20): Observable<CardData[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'expansion,features,costTags');

    return this.http
      .get<PaginatedResponse<CommunityCardResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(mapCommunityResponseToCardData)));
  }
}
