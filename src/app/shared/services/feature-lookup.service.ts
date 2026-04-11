import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import { LookupOption } from '../models/lookup-option.model';

interface FeatureItem {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class FeatureLookupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/features`;

  list(params: { featureType: string }): Observable<LookupOption[]> {
    const httpParams = new HttpParams().set('featureType', params.featureType);
    return this.http
      .get<PaginatedResponse<FeatureItem>>(this.baseUrl, { params: httpParams, withCredentials: true })
      .pipe(map(response => response.content.map(item => ({ id: item.id, label: item.name }))));
  }
}
