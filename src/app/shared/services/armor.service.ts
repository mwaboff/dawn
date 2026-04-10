import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { ArmorResponse } from '../models/armor-api.model';
import { mapArmorResponseToCardData } from '../mappers/armor.mapper';

export interface ArmorOptions {
  page?: number;
  size?: number;
  tier?: number;
}

export interface PaginatedArmors {
  items: ArmorResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

@Injectable({ providedIn: 'root' })
export class ArmorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/armors`;

  getArmors(options: ArmorOptions = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, tier } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'expansion,features,costTags,modifiers');

    if (tier !== undefined) {
      params = params.set('tier', tier);
    }

    return this.http
      .get<PaginatedResponse<ArmorResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapArmorResponseToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }

  getArmorsRaw(options: ArmorOptions = {}): Observable<PaginatedArmors> {
    const { page = 0, size = 20, tier } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'expansion,features,costTags,modifiers');

    if (tier !== undefined) {
      params = params.set('tier', tier);
    }

    return this.http
      .get<PaginatedResponse<ArmorResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        items: response.content,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }
}
