import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import { SubclassPathApiResponse } from '../models/subclass-path-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { mapSubclassPathToCardData } from '../mappers/subclass-path.mapper';
import { LookupOption } from '../models/lookup-option.model';

@Injectable({ providedIn: 'root' })
export class SubclassPathService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/subclass-paths`;

  getOptions(classId?: number): Observable<LookupOption[]> {
    let params = new HttpParams().set('page', 0).set('size', 100);

    if (classId !== undefined) {
      params = params.set('classId', classId);
    }

    return this.http
      .get<PaginatedResponse<SubclassPathApiResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(p => ({ id: p.id, label: p.name }))));
  }

  getSubclassPaths(): Observable<CardData[]> {
    const params = new HttpParams()
      .set('expand', 'associatedClass,associatedDomains,expansion')
      .set('size', '100');

    return this.http
      .get<PaginatedResponse<SubclassPathApiResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(mapSubclassPathToCardData)));
  }
}
