import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { LootApiResponse, LootFilters, CreateCustomLootRequest, UpdateLootRequest } from '../models/loot-api.model';
import { mapLootToCardData } from '../mappers/loot.mapper';

export interface PaginatedLoot {
  items: LootApiResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

@Injectable({ providedIn: 'root' })
export class LootService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/loot`;

  getLoot(filters: LootFilters = {}): Observable<PaginatedCards> {
    let params = new HttpParams().set('expand', 'expansion,features,costTags');

    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    if (filters.tier !== undefined) {
      params = params.set('tier', filters.tier);
    }
    if (filters.isConsumable !== undefined) {
      params = params.set('isConsumable', filters.isConsumable);
    }
    if (filters.expansionId !== undefined) {
      params = params.set('expansionId', filters.expansionId);
    }
    if (filters.isOfficial !== undefined) {
      params = params.set('isOfficial', filters.isOfficial);
    }
    if (filters.createdByUserId !== undefined) {
      params = params.set('createdByUserId', filters.createdByUserId);
    }
    if (filters.page !== undefined) {
      params = params.set('page', filters.page);
    }
    params = params.set('size', filters.size ?? 20);

    return this.http
      .get<PaginatedResponse<LootApiResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapLootToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }

  getLootRaw(filters: LootFilters = {}): Observable<PaginatedLoot> {
    let params = new HttpParams().set('expand', 'expansion,features,costTags');

    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    if (filters.tier !== undefined) {
      params = params.set('tier', filters.tier);
    }
    if (filters.isConsumable !== undefined) {
      params = params.set('isConsumable', filters.isConsumable);
    }
    if (filters.expansionId !== undefined) {
      params = params.set('expansionId', filters.expansionId);
    }
    if (filters.isOfficial !== undefined) {
      params = params.set('isOfficial', filters.isOfficial);
    }
    if (filters.createdByUserId !== undefined) {
      params = params.set('createdByUserId', filters.createdByUserId);
    }
    if (filters.page !== undefined) {
      params = params.set('page', filters.page);
    }
    params = params.set('size', filters.size ?? 20);

    return this.http
      .get<PaginatedResponse<LootApiResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        items: response.content,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }

  /**
   * Fetches one loot record, expanded far enough for an editor to round-trip it: dropping any of
   * these relationships would silently blank that part of the record on the next save.
   */
  getLootById(id: number): Observable<LootApiResponse> {
    const params = new HttpParams().set('expand', 'expansion,features,costTags');
    return this.http.get<LootApiResponse>(`${this.baseUrl}/${id}`, { params, withCredentials: true });
  }

  /**
   * Creates loot owned by the calling user.
   *
   * Posts to `/custom`, not the bare collection: that endpoint is the admin import path and
   * rejects non-admins. Ownership and the official/public/expansion fields are resolved
   * server-side, so they are not part of the payload.
   */
  createCustomLoot(request: CreateCustomLootRequest): Observable<LootApiResponse> {
    return this.http.post<LootApiResponse>(`${this.baseUrl}/custom`, request, { withCredentials: true });
  }

  /** Updates loot. Only the author, a moderator, or an admin (for official content) may do this. */
  updateLoot(id: number, request: UpdateLootRequest): Observable<LootApiResponse> {
    return this.http.put<LootApiResponse>(`${this.baseUrl}/${id}`, request, { withCredentials: true });
  }

  /**
   * Copies any record into a new custom one owned by the caller, official content included.
   * The copy is private, unofficial, carries no sourcebook, and inherits no campaign tags.
   */
  copyLoot(id: number): Observable<LootApiResponse> {
    return this.http.post<LootApiResponse>(`${this.baseUrl}/${id}/copy`, {}, { withCredentials: true });
  }

  /**
   * Soft-deletes loot. Same ownership rule as {@link updateLoot}: the author, a moderator,
   * or an admin. Soft, so an author who deletes by mistake can still be restored server-side.
   */
  deleteLoot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

}
