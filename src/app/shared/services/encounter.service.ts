import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import {
  CreateEncounterRequest,
  EncounterFilters,
  EncounterResponse,
  UpdateEncounterRequest,
} from '../models/encounter-api.model';

/**
 * Saved encounters (`Encounter` / `EncounterAdversary`). The server is authoritative on Battle
 * Point spend — `shared/utils/battle-points.utils.ts` mirrors the math for instant feedback
 * while the builder is open, but `suggestedBattlePoints`/`spentBattlePoints` here are what wins
 * on save.
 */
@Injectable({ providedIn: 'root' })
export class EncounterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/encounters`;

  getEncounters(filters: EncounterFilters = {}): Observable<PaginatedResponse<EncounterResponse>> {
    let params = new HttpParams().set('page', filters.page ?? 0).set('size', filters.size ?? 20);

    if (filters.tier !== undefined) {
      params = params.set('tier', filters.tier);
    }
    if (filters.isOfficial !== undefined) {
      params = params.set('isOfficial', filters.isOfficial);
    }
    if (filters.name !== undefined) {
      params = params.set('name', filters.name);
    }
    if (filters.expand !== undefined) {
      params = params.set('expand', filters.expand);
    }

    return this.http.get<PaginatedResponse<EncounterResponse>>(this.baseUrl, {
      params,
      withCredentials: true,
    });
  }

  getEncounter(id: number, expand?: string): Observable<EncounterResponse> {
    let params = new HttpParams();
    if (expand) {
      params = params.set('expand', expand);
    }
    return this.http.get<EncounterResponse>(`${this.baseUrl}/${id}`, { params, withCredentials: true });
  }

  createEncounter(request: CreateEncounterRequest): Observable<EncounterResponse> {
    return this.http.post<EncounterResponse>(this.baseUrl, request, { withCredentials: true });
  }

  updateEncounter(id: number, request: UpdateEncounterRequest): Observable<EncounterResponse> {
    return this.http.put<EncounterResponse>(`${this.baseUrl}/${id}`, request, { withCredentials: true });
  }

  deleteEncounter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  copyEncounter(id: number): Observable<EncounterResponse> {
    return this.http.post<EncounterResponse>(`${this.baseUrl}/${id}/copy`, {}, { withCredentials: true });
  }
}
