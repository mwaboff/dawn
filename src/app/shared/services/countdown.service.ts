import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CountdownResponse,
  CreateCountdownRequest,
  UpdateCountdownRequest,
} from '../models/countdown-api.model';

/**
 * Campaign countdowns. Every endpoint is GM-only on the backend, reads included.
 */
@Injectable({ providedIn: 'root' })
export class CountdownService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/countdowns`;

  getCountdowns(campaignId: number): Observable<CountdownResponse[]> {
    const params = new HttpParams().set('campaignId', campaignId);
    return this.http.get<CountdownResponse[]>(this.baseUrl, { params, withCredentials: true });
  }

  createCountdown(request: CreateCountdownRequest): Observable<CountdownResponse> {
    return this.http.post<CountdownResponse>(this.baseUrl, request, { withCredentials: true });
  }

  updateCountdown(id: number, request: UpdateCountdownRequest): Observable<CountdownResponse> {
    return this.http.put<CountdownResponse>(`${this.baseUrl}/${id}`, request, {
      withCredentials: true,
    });
  }

  /**
   * Ticks a countdown to an absolute value. The backend applies any loop behaviour when the
   * value reaches 0, so the response may come back reset rather than at zero.
   */
  updateCountdownValue(id: number, currentValue: number): Observable<CountdownResponse> {
    return this.http.patch<CountdownResponse>(
      `${this.baseUrl}/${id}/value`,
      { currentValue },
      { withCredentials: true },
    );
  }

  deleteCountdown(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
