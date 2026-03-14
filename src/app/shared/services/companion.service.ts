import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompanionApiResponse } from '../models/companion-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { mapCompanionToCardData } from '../mappers/companion.mapper';

@Injectable({ providedIn: 'root' })
export class CompanionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/companions`;

  getCompanions(): Observable<CardData[]> {
    return this.http
      .get<CompanionApiResponse[]>(this.baseUrl, { withCredentials: true })
      .pipe(map(responses => responses.map(mapCompanionToCardData)));
  }
}
