import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import {
  CreateEncounterRequest,
  EncounterFilters,
  EncounterResponse,
  UpdateEncounterRequest,
} from '../models/encounter-api.model';

/**
 * Defence-in-depth for `getOwnEncounters`'s page walk: `totalPages` is a TypeScript-only
 * guarantee, not a runtime one, so a malformed/corrupted response (or a wildly wrong count from
 * the server) could otherwise drive the recursive walk arbitrarily far. 50 pages at 100/page is
 * 5,000 encounters -- far beyond any real GM's collection -- so tripping this is itself a signal
 * something is wrong, not a real user's data being truncated.
 */
export const MAX_OWN_ENCOUNTER_PAGES = 50;

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
    if (filters.creatorId !== undefined) {
      params = params.set('creatorId', filters.creatorId);
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

  /**
   * All of the given user's own encounters, across every page. Uses `creatorId` server-side --
   * it composes as an independent `AND` on top of the usual official/public/own visibility rule,
   * so it only ever narrows what the caller could already see: passing another user's id returns
   * only that user's official/public encounters, never their private ones (see the caveat on
   * `Profile.canViewEncounters`, which is why this is only ever called with the caller's own id).
   * The result set is now just one user's encounters rather than the whole site's catalog, but a
   * prolific GM could still exceed one page, so this still walks pages -- just over a small,
   * bounded set instead of the full shared catalog. Centralized here so the dashboard and
   * profile previews (and, once adopted, the encounters list page) can't drift out of sync on
   * the pagination handling.
   */
  getOwnEncounters(userId: number): Observable<EncounterResponse[]> {
    const pageSize = 100;
    const fetchPage = (page: number): Observable<EncounterResponse[]> =>
      this.getEncounters({ page, size: pageSize, creatorId: userId }).pipe(
        switchMap(response => {
          const nextPage = page + 1;
          // A non-finite totalPages (undefined/null/NaN across the network boundary, where
          // TypeScript's compile-time guarantee doesn't apply) can't tell us there's a next page,
          // so it's treated as "no more pages" rather than looping forever.
          const reachedLastPage = !Number.isFinite(response.totalPages) || nextPage >= response.totalPages;
          if (reachedLastPage) {
            return of(response.content);
          }
          if (nextPage >= MAX_OWN_ENCOUNTER_PAGES) {
            console.error(
              `EncounterService.getOwnEncounters: stopped at the ${MAX_OWN_ENCOUNTER_PAGES}-page safety ` +
              `cap (server reported totalPages=${response.totalPages}); results may be incomplete.`
            );
            return of(response.content);
          }
          return fetchPage(nextPage).pipe(map(rest => [...response.content, ...rest]));
        }),
      );
    return fetchPage(0);
  }
}
