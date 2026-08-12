import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { BulkSrdUpdateRequest, BulkSrdUpdateResponse } from '../models/bulk-srd.model';

/** Backs the admin bulk SRD-flagging tool: `PATCH /api/admin/content/srd`. */
@Injectable({ providedIn: 'root' })
export class AdminContentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/content`;

  updateSrd(request: BulkSrdUpdateRequest): Observable<BulkSrdUpdateResponse> {
    return this.http.patch<BulkSrdUpdateResponse>(`${this.baseUrl}/srd`, request, {
      withCredentials: true,
    });
  }
}
