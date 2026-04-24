import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminUserDetailResponse,
  AdminUserListParams,
  AdminUserListResponse,
  AdminUserPatchRequest,
} from '../models/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/users`;

  listUsers(params: AdminUserListParams): Observable<AdminUserListResponse> {
    let httpParams = new HttpParams()
      .set('page', String(params.page))
      .set('size', String(params.size));

    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.ascending !== undefined) httpParams = httpParams.set('ascending', String(params.ascending));
    if (params.isBanned !== undefined) httpParams = httpParams.set('isBanned', String(params.isBanned));
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.username) httpParams = httpParams.set('username', params.username);
    if (params.email) httpParams = httpParams.set('email', params.email);

    return this.http.get<AdminUserListResponse>(this.baseUrl, {
      params: httpParams,
      withCredentials: true,
    });
  }

  getUser(id: number): Observable<AdminUserDetailResponse> {
    const params = new HttpParams().set('expand', 'all');
    return this.http.get<AdminUserDetailResponse>(`${this.baseUrl}/${id}`, {
      params,
      withCredentials: true,
    });
  }

  updateUser(id: number, patch: AdminUserPatchRequest): Observable<AdminUserDetailResponse> {
    return this.http.patch<AdminUserDetailResponse>(`${this.baseUrl}/${id}`, patch, {
      withCredentials: true,
    });
  }

  banUser(id: number, reason?: string): Observable<AdminUserDetailResponse> {
    const body = reason ? { reason } : {};
    return this.http.post<AdminUserDetailResponse>(`${this.baseUrl}/${id}/ban`, body, {
      withCredentials: true,
    });
  }

  unbanUser(id: number): Observable<AdminUserDetailResponse> {
    return this.http.post<AdminUserDetailResponse>(`${this.baseUrl}/${id}/unban`, {}, {
      withCredentials: true,
    });
  }
}
