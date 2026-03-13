import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResponse } from '../../../shared/models/api.model';
import { DomainCardResponse } from '../models/domain-card-api.model';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { mapDomainCardResponseToCardData } from './domain-card.mapper';

interface DomainResponse {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class DomainService {
  private readonly http = inject(HttpClient);
  private readonly domainsUrl = `${environment.apiUrl}/dh/domains`;
  private readonly domainCardsUrl = `${environment.apiUrl}/dh/cards/domain`;

  private domainNameToId = new Map<string, number>();
  private lookupLoaded = false;

  loadDomainLookup(): Observable<Map<string, number>> {
    if (this.lookupLoaded) {
      return of(this.domainNameToId);
    }

    const params = new HttpParams().set('page', 0).set('size', 100);

    return this.http
      .get<PaginatedResponse<DomainResponse>>(this.domainsUrl, { params, withCredentials: true })
      .pipe(
        tap(response => {
          for (const domain of response.content) {
            this.domainNameToId.set(domain.name, domain.id);
          }
          this.lookupLoaded = true;
        }),
        map(() => this.domainNameToId),
      );
  }

  resolveDomainIds(domainNames: string[]): number[] {
    return domainNames
      .map(name => this.domainNameToId.get(name))
      .filter((id): id is number => id !== undefined);
  }

  getDomainCards(domainIds: number[], page = 0, size = 100): Observable<CardData[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('levels', '1')
      .set('associatedDomainIds', domainIds.join(','))
      .set('expand', 'features,costTags,associatedDomain');

    return this.http
      .get<PaginatedResponse<DomainCardResponse>>(this.domainCardsUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(mapDomainCardResponseToCardData)));
  }

  getDomainCardsForNames(domainNames: string[]): Observable<CardData[]> {
    return this.loadDomainLookup().pipe(
      switchMap(() => {
        const domainIds = this.resolveDomainIds(domainNames);
        return this.getDomainCards(domainIds);
      }),
    );
  }

  clearCache(): void {
    this.domainNameToId.clear();
    this.lookupLoaded = false;
  }
}
