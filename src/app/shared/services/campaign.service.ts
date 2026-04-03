import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JoinCampaignResponse } from '../models/campaign-api.model';

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/campaigns`;

  joinCampaign(token: string): Observable<JoinCampaignResponse> {
    return this.http.post<JoinCampaignResponse>(
      `${this.baseUrl}/join/${token}`,
      {},
      { withCredentials: true }
    );
  }
}
