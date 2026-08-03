import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EncounterRunFilters,
  EncounterRunResponse,
  StartEncounterRunRequest,
  UpdateEncounterRunAdversaryRequest,
} from '../models/encounter-run-api.model';

/**
 * Encounter runs (`EncounterRun` / `EncounterRunAdversary`) -- the server-side live state for
 * *playing* a fight, distinct from the saved `Encounter` it was started from. Campaign-free by
 * design: `campaignId` is never required to start or play a run.
 */
@Injectable({ providedIn: 'root' })
export class EncounterRunService {
  private readonly http = inject(HttpClient);
  private readonly encountersBaseUrl = `${environment.apiUrl}/dh/encounters`;
  private readonly runsBaseUrl = `${environment.apiUrl}/dh/encounter-runs`;

  /** Omitting `campaignId` starts a standalone, campaign-free run. */
  startRun(encounterId: number, request: StartEncounterRunRequest = {}): Observable<EncounterRunResponse> {
    const body = request.campaignId !== undefined ? { campaignId: request.campaignId } : {};
    return this.http.post<EncounterRunResponse>(`${this.encountersBaseUrl}/${encounterId}/runs`, body, {
      withCredentials: true,
    });
  }

  /** Always expands every instance's full adversary stat block. */
  getRun(runId: number): Observable<EncounterRunResponse> {
    return this.http.get<EncounterRunResponse>(`${this.runsBaseUrl}/${runId}`, { withCredentials: true });
  }

  /** Adversary stat blocks are not expanded here. No `campaignId` returns the caller's own runs. */
  getRuns(filters: EncounterRunFilters = {}): Observable<EncounterRunResponse[]> {
    let params = new HttpParams();
    if (filters.status !== undefined) {
      params = params.set('status', filters.status);
    }
    if (filters.campaignId !== undefined) {
      params = params.set('campaignId', filters.campaignId);
    }

    return this.http.get<EncounterRunResponse[]>(this.runsBaseUrl, { params, withCredentials: true });
  }

  /** Partial update -- every provided field is an absolute value, never a delta. */
  updateAdversary(
    runId: number,
    instanceId: number,
    request: UpdateEncounterRunAdversaryRequest,
  ): Observable<EncounterRunResponse> {
    return this.http.patch<EncounterRunResponse>(`${this.runsBaseUrl}/${runId}/adversaries/${instanceId}`, request, {
      withCredentials: true,
    });
  }

  completeRun(runId: number): Observable<EncounterRunResponse> {
    return this.http.post<EncounterRunResponse>(`${this.runsBaseUrl}/${runId}/complete`, {}, { withCredentials: true });
  }

  /** Hard delete -- discarding a run permanently removes it. */
  deleteRun(runId: number): Observable<void> {
    return this.http.delete<void>(`${this.runsBaseUrl}/${runId}`, { withCredentials: true });
  }
}
