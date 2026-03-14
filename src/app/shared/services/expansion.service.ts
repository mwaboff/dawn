import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExpansionOption } from '../models/expansion-api.model';

@Injectable({ providedIn: 'root' })
export class ExpansionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/expansions`;

  private expansions$: Observable<ExpansionOption[]> | null = null;

  getExpansions(): Observable<ExpansionOption[]> {
    if (!this.expansions$) {
      this.expansions$ = this.http
        .get<ExpansionOption[]>(this.baseUrl, { withCredentials: true })
        .pipe(shareReplay(1));
    }
    return this.expansions$;
  }
}
