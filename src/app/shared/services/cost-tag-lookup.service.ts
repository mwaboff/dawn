import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LookupOption } from '../models/lookup-option.model';

interface CostTagItem {
  id: number;
  label: string;
  category: string;
}

export interface CostTagFull {
  id: number;
  label: string;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class CostTagLookupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/card-cost-tags`;

  list(): Observable<LookupOption[]> {
    return this.http
      .get<CostTagItem[]>(this.baseUrl, { withCredentials: true })
      .pipe(map(items => items.map(item => ({ id: item.id, label: `${item.label} (${item.category})` }))));
  }

  listFull(): Observable<CostTagFull[]> {
    return this.http
      .get<{ content: CostTagFull[] }>(
        `${environment.apiUrl}/dh/cost-tags?size=200`,
        { withCredentials: true }
      )
      .pipe(map(r => r.content));
  }
}
