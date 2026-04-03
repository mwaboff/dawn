import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import {
  CampaignResponse,
  CreateCampaignRequest,
  InviteResponse,
} from '../models/campaign-api.model';

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/campaigns`;

  getMyCampaigns(page = 0, size = 50, expand = ''): Observable<PaginatedResponse<CampaignResponse>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (expand) {
      params = params.set('expand', expand);
    }
    return this.http.get<PaginatedResponse<CampaignResponse>>(
      `${this.baseUrl}/mine`,
      { params, withCredentials: true },
    );
  }

  getCampaign(id: number, expand = ''): Observable<CampaignResponse> {
    let params = new HttpParams();
    if (expand) {
      params = params.set('expand', expand);
    }
    return this.http.get<CampaignResponse>(
      `${this.baseUrl}/${id}`,
      { params, withCredentials: true },
    );
  }

  createCampaign(request: CreateCampaignRequest): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      this.baseUrl,
      request,
      { withCredentials: true },
    );
  }

  removePlayer(campaignId: number, userId: number): Observable<CampaignResponse> {
    return this.http.delete<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/players/${userId}`,
      { withCredentials: true },
    );
  }

  removeCharacterSheet(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.delete<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}`,
      { withCredentials: true },
    );
  }

  approveCharacterSheet(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}/approve`,
      {},
      { withCredentials: true },
    );
  }

  rejectCharacterSheet(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}/reject`,
      {},
      { withCredentials: true },
    );
  }

  generateInvite(campaignId: number): Observable<InviteResponse> {
    return this.http.post<InviteResponse>(
      `${this.baseUrl}/${campaignId}/invites`,
      {},
      { withCredentials: true },
    );
  }
}
