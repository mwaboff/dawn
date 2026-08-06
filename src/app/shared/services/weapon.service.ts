import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { WeaponResponse, CreateCustomWeaponRequest, UpdateWeaponRequest } from '../models/weapon-api.model';
import { mapWeaponResponseToCardData } from '../mappers/weapon.mapper';
import { ItemSort } from '../models/item-sort.model';

export interface WeaponOptions {
  /** Case-insensitive substring match on the name. */
  name?: string;
  /** Ordering; the API defaults to insertion order, which buries custom content. */
  sort?: ItemSort;
  page?: number;
  size?: number;
  isPrimary?: boolean;
  tier?: number;
  damageType?: 'PHYSICAL' | 'MAGIC' | 'PHYSICAL_AND_MAGIC';
  trait?: string;
  range?: string;
  burden?: string;
  isOfficial?: boolean;
  expansionId?: number;
}

export interface PaginatedWeapons {
  items: WeaponResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

@Injectable({ providedIn: 'root' })
export class WeaponService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/weapons`;

  getWeapons(options: WeaponOptions = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, name, sort, isPrimary, tier, damageType, trait, range, burden, isOfficial, expansionId } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'expansion,features,costTags,modifiers');
    if (name) {
      params = params.set('name', name);
    }
    if (sort) {
      params = params.set('sort', sort);
    }

    if (isPrimary !== undefined) {
      params = params.set('isPrimary', isPrimary);
    }
    if (tier !== undefined) {
      params = params.set('tier', tier);
    }
    if (damageType !== undefined) {
      params = params.set('damageType', damageType);
    }
    if (trait !== undefined) {
      params = params.set('trait', trait);
    }
    if (range !== undefined) {
      params = params.set('range', range);
    }
    if (burden !== undefined) {
      params = params.set('burden', burden);
    }
    if (isOfficial !== undefined) {
      params = params.set('isOfficial', isOfficial);
    }
    if (expansionId !== undefined) {
      params = params.set('expansionId', expansionId);
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

  getWeaponsRaw(options: WeaponOptions = {}): Observable<PaginatedWeapons> {
    const { page = 0, size = 20, name, sort, isPrimary, tier, damageType, trait, range, burden, isOfficial, expansionId } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'expansion,features,costTags,modifiers');
    if (name) {
      params = params.set('name', name);
    }
    if (sort) {
      params = params.set('sort', sort);
    }

    if (isPrimary !== undefined) {
      params = params.set('isPrimary', isPrimary);
    }
    if (tier !== undefined) {
      params = params.set('tier', tier);
    }
    if (damageType !== undefined) {
      params = params.set('damageType', damageType);
    }
    if (trait !== undefined) {
      params = params.set('trait', trait);
    }
    if (range !== undefined) {
      params = params.set('range', range);
    }
    if (burden !== undefined) {
      params = params.set('burden', burden);
    }
    if (isOfficial !== undefined) {
      params = params.set('isOfficial', isOfficial);
    }
    if (expansionId !== undefined) {
      params = params.set('expansionId', expansionId);
    }

    return this.http
      .get<PaginatedResponse<WeaponResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        items: response.content,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }

  /**
   * Fetches one weapon, expanded far enough for an editor to round-trip it: dropping any of these
   * relationships would silently blank that part of the record on the next save.
   */
  getWeaponById(id: number): Observable<WeaponResponse> {
    const params = new HttpParams().set('expand', 'expansion,features,costTags,modifiers');
    return this.http.get<WeaponResponse>(`${this.baseUrl}/${id}`, { params, withCredentials: true });
  }

  /**
   * Creates weapon owned by the calling user.
   *
   * Posts to `/custom`, not the bare collection: that endpoint is the admin import path and
   * rejects non-admins. Ownership and the official/public/expansion fields are resolved
   * server-side, so they are not part of the payload.
   */
  createCustomWeapon(request: CreateCustomWeaponRequest): Observable<WeaponResponse> {
    return this.http.post<WeaponResponse>(`${this.baseUrl}/custom`, request, { withCredentials: true });
  }

  /** Updates weapon. Only the author, a moderator, or an admin (for official content) may do this. */
  updateWeapon(id: number, request: UpdateWeaponRequest): Observable<WeaponResponse> {
    return this.http.put<WeaponResponse>(`${this.baseUrl}/${id}`, request, { withCredentials: true });
  }

  /**
   * Copies any record into a new custom one owned by the caller, official content included.
   * The copy is private, unofficial, carries no sourcebook, and inherits no campaign tags.
   */
  copyWeapon(id: number): Observable<WeaponResponse> {
    return this.http.post<WeaponResponse>(`${this.baseUrl}/${id}/copy`, {}, { withCredentials: true });
  }

}
