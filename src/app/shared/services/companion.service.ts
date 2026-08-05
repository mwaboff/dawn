import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import {
  CompanionApiResponse,
  CreateCompanionRequest,
  UpdateCompanionRequest,
} from '../models/companion-api.model';

/**
 * Real per-character CRUD service for companions -- companions are per-character-sheet data,
 * not browsable catalog content (see the WP6 removal of the Codex/admin companion surface).
 * `GET /api/dh/companions` always requires `characterSheetId`; there is no unfiltered listing.
 */
@Injectable({ providedIn: 'root' })
export class CompanionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/companions`;

  getCompanions(characterSheetId: number, page = 0, size = 100): Observable<CompanionApiResponse[]> {
    const params = new HttpParams()
      .set('characterSheetId', characterSheetId)
      .set('page', page)
      .set('size', size)
      .set('expand', 'experiences');

    return this.http
      .get<PaginatedResponse<CompanionApiResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => response.content));
  }

  createCompanion(request: CreateCompanionRequest): Observable<CompanionApiResponse> {
    return this.http.post<CompanionApiResponse>(this.baseUrl, request, { withCredentials: true });
  }

  updateCompanion(id: number, request: UpdateCompanionRequest): Observable<CompanionApiResponse> {
    return this.http.put<CompanionApiResponse>(`${this.baseUrl}/${id}`, request, { withCredentials: true });
  }

  deleteCompanion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
