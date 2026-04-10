import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { LootApiResponse, LootFilters } from '../models/loot-api.model';
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
    if (filters.page !== undefined) {
      params = params.set('page', filters.page);
    }

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
    if (filters.page !== undefined) {
      params = params.set('page', filters.page);
    }

    return this.http
      .get<PaginatedResponse<LootApiResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        items: response.content,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }
}
