import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { ArmorResponse, CreateCustomArmorRequest, UpdateArmorRequest } from '../models/armor-api.model';
import { mapArmorResponseToCardData } from '../mappers/armor.mapper';
import { ItemSort } from '../models/item-sort.model';

export interface ArmorOptions {
  /** Case-insensitive substring match on the name. */
  name?: string;
  /** Ordering; the API defaults to insertion order, which buries custom content. */
  sort?: ItemSort;
  page?: number;
  size?: number;
  tier?: number;
  burden?: string;
  isOfficial?: boolean;
  expansionId?: number;
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
    const { page = 0, size = 20, name, sort, tier, burden, isOfficial, expansionId } = options;

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

    if (tier !== undefined) {
      params = params.set('tier', tier);
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
      .get<PaginatedResponse<ArmorResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapArmorResponseToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }

  getArmorsRaw(options: ArmorOptions = {}): Observable<PaginatedArmors> {
    const { page = 0, size = 20, name, sort, tier, burden, isOfficial, expansionId } = options;

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

    if (tier !== undefined) {
      params = params.set('tier', tier);
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
      .get<PaginatedResponse<ArmorResponse>>(this.baseUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        items: response.content,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }

  /**
   * Fetches one armor, expanded far enough for an editor to round-trip it: dropping any of these
   * relationships would silently blank that part of the record on the next save.
   */
  getArmorById(id: number): Observable<ArmorResponse> {
    const params = new HttpParams().set('expand', 'expansion,features,costTags,modifiers');
    return this.http.get<ArmorResponse>(`${this.baseUrl}/${id}`, { params, withCredentials: true });
  }

  /**
   * Creates armor owned by the calling user.
   *
   * Posts to `/custom`, not the bare collection: that endpoint is the admin import path and
   * rejects non-admins. Ownership and the official/public/expansion fields are resolved
   * server-side, so they are not part of the payload.
   */
  createCustomArmor(request: CreateCustomArmorRequest): Observable<ArmorResponse> {
    return this.http.post<ArmorResponse>(`${this.baseUrl}/custom`, request, { withCredentials: true });
  }

  /** Updates armor. Only the author, a moderator, or an admin (for official content) may do this. */
  updateArmor(id: number, request: UpdateArmorRequest): Observable<ArmorResponse> {
    return this.http.put<ArmorResponse>(`${this.baseUrl}/${id}`, request, { withCredentials: true });
  }

  /**
   * Copies any record into a new custom one owned by the caller, official content included.
   * The copy is private, unofficial, carries no sourcebook, and inherits no campaign tags.
   */
  copyArmor(id: number): Observable<ArmorResponse> {
    return this.http.post<ArmorResponse>(`${this.baseUrl}/${id}/copy`, {}, { withCredentials: true });
  }

}
