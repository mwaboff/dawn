import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClassResponse } from '../models/class-api.model';
import { PaginatedResponse } from '../../../shared/models/api.model';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { mapClassResponseToCardData } from './class.mapper';

@Injectable({ providedIn: 'root' })
export class ClassService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/classes`;

  getClasses(page = 0, size = 100): Observable<CardData[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'classFeatures,hopeFeatures,costTags');

    return this.http
      .get<PaginatedResponse<ClassResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(mapClassResponseToCardData)));
  }
}
