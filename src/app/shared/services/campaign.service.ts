import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import { CampaignResponse } from '../models/campaign-api.model';

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private readonly http = inject(HttpClient);

  getMyCampaigns(
    page = 0,
    size = 20,
    expand?: string,
  ): Observable<PaginatedResponse<CampaignResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (expand) {
      params = params.set('expand', expand);
    }

    return this.http.get<PaginatedResponse<CampaignResponse>>(
      `${environment.apiUrl}/campaigns/mine`,
      { params, withCredentials: true },
    );
  }
}
