import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import { SubclassPathApiResponse } from '../models/subclass-path-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { mapSubclassPathToCardData } from '../mappers/subclass-path.mapper';

@Injectable({ providedIn: 'root' })
export class SubclassPathService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/subclass-paths`;

  getSubclassPaths(): Observable<CardData[]> {
    const params = new HttpParams()
      .set('expand', 'associatedClass,associatedDomains,expansion')
      .set('size', '100');

    return this.http
      .get<PaginatedResponse<SubclassPathApiResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(mapSubclassPathToCardData)));
  }
}
