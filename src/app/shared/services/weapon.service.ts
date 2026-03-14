import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { WeaponResponse } from '../models/weapon-api.model';
import { mapWeaponResponseToCardData } from '../mappers/weapon.mapper';

export interface WeaponOptions {
  page?: number;
  size?: number;
  isPrimary?: boolean;
  tier?: number;
  damageType?: 'PHYSICAL' | 'MAGIC';
}

@Injectable({ providedIn: 'root' })
export class WeaponService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/weapons`;

  getWeapons(options: WeaponOptions = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, isPrimary, tier, damageType } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'expansion,features,costTags,modifiers');

    if (isPrimary !== undefined) {
      params = params.set('isPrimary', isPrimary);
    }
    if (tier !== undefined) {
      params = params.set('tier', tier);
    }
    if (damageType !== undefined) {
      params = params.set('damageType', damageType);
    }

    return this.http
      .get<PaginatedResponse<WeaponResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapWeaponResponseToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }
}
