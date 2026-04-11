import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateExpansionRequest, ExpansionOption } from '../models/expansion-api.model';
import { PaginatedResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ExpansionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/expansions`;

  private expansions$: Observable<ExpansionOption[]> | null = null;

  getExpansions(): Observable<ExpansionOption[]> {
    if (!this.expansions$) {
      const params = new HttpParams().set('page', 0).set('size', 100);
      this.expansions$ = this.http
        .get<PaginatedResponse<ExpansionOption>>(this.baseUrl, { params, withCredentials: true })
        .pipe(
          map(response => response.content),
          shareReplay(1),
        );
    }
    return this.expansions$;
  }

  createExpansion(body: CreateExpansionRequest): Observable<ExpansionOption> {
    return this.http
      .post<ExpansionOption>(this.baseUrl, body, { withCredentials: true })
      .pipe(tap(() => this.invalidate()));
  }

  invalidate(): void {
    this.expansions$ = null;
  }
}
