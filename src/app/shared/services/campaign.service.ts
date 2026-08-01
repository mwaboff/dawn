import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import {
  CampaignResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignInviteResponse,
  JoinCampaignResponse,
  UpdateCharacterTransformationRequest,
  CharacterTransformationStateResponse,
} from '../models/campaign-api.model';

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/campaigns`;

  getMyCampaigns(page = 0, size = 20, expand?: string): Observable<PaginatedResponse<CampaignResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (expand) params = params.set('expand', expand);
    return this.http.get<PaginatedResponse<CampaignResponse>>(
      `${this.baseUrl}/mine`, { params, withCredentials: true }
    );
  }

  getCampaign(id: number, expand?: string): Observable<CampaignResponse> {
    let params = new HttpParams();
    if (expand) params = params.set('expand', expand);
    return this.http.get<CampaignResponse>(
      `${this.baseUrl}/${id}`, { params, withCredentials: true }
    );
  }

  createCampaign(request: CreateCampaignRequest): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      this.baseUrl, request, { withCredentials: true }
    );
  }

  updateCampaign(id: number, request: UpdateCampaignRequest): Observable<CampaignResponse> {
    return this.http.put<CampaignResponse>(
      `${this.baseUrl}/${id}`, request, { withCredentials: true }
    );
  }

  deleteCampaign(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${id}`, { withCredentials: true }
    );
  }

  generateInvite(campaignId: number): Observable<CampaignInviteResponse> {
    return this.http.post<CampaignInviteResponse>(
      `${this.baseUrl}/${campaignId}/invites`, {}, { withCredentials: true }
    );
  }

  joinCampaign(token: string): Observable<JoinCampaignResponse> {
    return this.http.post<JoinCampaignResponse>(
      `${this.baseUrl}/join/${token}`, {}, { withCredentials: true }
    );
  }

  endCampaign(id: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${id}/end`, {}, { withCredentials: true }
    );
  }

  leaveCampaign(id: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${id}/leave`, {}, { withCredentials: true }
    );
  }

  kickPlayer(campaignId: number, userId: number): Observable<CampaignResponse> {
    return this.http.delete<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/players/${userId}`, { withCredentials: true }
    );
  }

  removeCharacterSheet(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.delete<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}`, { withCredentials: true }
    );
  }

  submitCharacterSheet(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}/submit`, {}, { withCredentials: true }
    );
  }

  approveCharacterSheet(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}/approve`, {}, { withCredentials: true }
    );
  }

  rejectCharacterSheet(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}/reject`, {}, { withCredentials: true }
    );
  }

  /**
   * GM-only (campaign GM / creator / Moderator+). Shows or hides the Transformation panel on one
   * character's sheet, and optionally assigns or clears the transformation card.
   *
   * Disabling preserves the assigned card -- it only hides the panel, it never discards the
   * player's selection -- and a card may be assigned while disabled so a GM can pre-load one.
   *
   * The backend returns the full character-sheet response; the narrow
   * {@link CharacterTransformationStateResponse} is used because `shared/` cannot import the sheet
   * contract from `features/`.
   */
  updateCharacterTransformation(
    campaignId: number,
    sheetId: number,
    request: UpdateCharacterTransformationRequest,
  ): Observable<CharacterTransformationStateResponse> {
    return this.http.put<CharacterTransformationStateResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}/transformation`, request, { withCredentials: true }
    );
  }

  addNpc(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/npcs/${sheetId}`, {}, { withCredentials: true }
    );
  }

  addGameMaster(campaignId: number, userId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/game-masters/${userId}`, {}, { withCredentials: true }
    );
  }

  removeGameMaster(campaignId: number, userId: number): Observable<CampaignResponse> {
    return this.http.delete<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/game-masters/${userId}`, { withCredentials: true }
    );
  }

  /** GM-only. `fear` must be 0-12; the backend rejects anything outside that range. */
  updateFear(id: number, fear: number): Observable<CampaignResponse> {
    return this.http.patch<CampaignResponse>(
      `${this.baseUrl}/${id}/fear`, { fear }, { withCredentials: true }
    );
  }

  /** GM-only. Pass an empty string to clear; max 50,000 characters. */
  updateGmNotes(id: number, gmNotes: string): Observable<CampaignResponse> {
    return this.http.patch<CampaignResponse>(
      `${this.baseUrl}/${id}/gm-notes`, { gmNotes }, { withCredentials: true }
    );
  }
}
