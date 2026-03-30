import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FeatureUpdateRequest, RawFeatureResponse } from '../../features/admin/models/admin-api.model';

@Injectable({ providedIn: 'root' })
export class FeatureEditService {
  private readonly http = inject(HttpClient);

  updateFeature(id: number, body: FeatureUpdateRequest): Observable<RawFeatureResponse> {
    return this.http.put<RawFeatureResponse>(
      `${environment.apiUrl}/dh/features/${id}`, body, { withCredentials: true }
    );
  }
}
