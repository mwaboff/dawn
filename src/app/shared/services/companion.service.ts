import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import { CompanionApiResponse } from '../models/companion-api.model';

export interface CompanionOptions {
  page?: number;
  size?: number;
}

/**
 * Companions are no longer browsable catalog content (see WP6 of the companions plan) --
 * this service is a stub kept alive for WP8, which rewrites it into a real per-character
 * CRUD service. `mapCompanionToCardData` and its catalog-card shape are gone; these two
 * methods return the raw API response until that rewrite lands.
 */
@Injectable({ providedIn: 'root' })
export class CompanionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/companions`;

  getCompanions(page = 0, size = 100): Observable<CompanionApiResponse[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'experiences');

    return this.http
      .get<PaginatedResponse<CompanionApiResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content));
  }

  getCompanionsPaginated(options: CompanionOptions = {}): Observable<PaginatedResponse<CompanionApiResponse>> {
    const { page = 0, size = 20 } = options;

    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'experiences');

    return this.http.get<PaginatedResponse<CompanionApiResponse>>(this.baseUrl, { params, withCredentials: true });
  }
}
