import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';
import { DomainCardResponse, DomainResponse } from '../models/domain-card-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { mapDomainCardResponseToCardData } from '../mappers/domain-card.mapper';
import { mapDomainToCardData } from '../mappers/domain.mapper';
import { LookupOption } from '../models/lookup-option.model';

export interface DomainCardBrowseOptions {
  page?: number;
  size?: number;
  expansionId?: number;
  isOfficial?: boolean;
  associatedDomainId?: number;
  tier?: number;
  level?: number;
}

@Injectable({ providedIn: 'root' })
export class DomainService {
  private readonly http = inject(HttpClient);
  private readonly domainsUrl = `${environment.apiUrl}/dh/domains`;
  private readonly domainCardsUrl = `${environment.apiUrl}/dh/cards/domain`;

  private domainNameToId = new Map<string, number>();
  private lookupLoaded = false;

  getDomainOptions(): Observable<LookupOption[]> {
    const params = new HttpParams().set('page', 0).set('size', 100);

    return this.http
      .get<PaginatedResponse<DomainResponse>>(this.domainsUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(d => ({ id: d.id, label: d.name }))));
  }

  getDomains(): Observable<CardData[]> {
    const params = new HttpParams()
      .set('page', 0)
      .set('size', 100)
      .set('expand', 'expansion');

    return this.http
      .get<PaginatedResponse<DomainResponse>>(this.domainsUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(mapDomainToCardData)));
  }

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

  getDomainCards(domainIds: number[], page = 0, size = 100, levels?: number[]): Observable<CardData[]> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('associatedDomainIds', domainIds.join(','))
      .set('expand', 'features,costTags,associatedDomain,modifiers');

    if (levels?.length) {
      params = params.set('levels', levels.join(','));
    }

    return this.http
      .get<PaginatedResponse<DomainCardResponse>>(this.domainCardsUrl, { params, withCredentials: true })
      .pipe(map(response => response.content.map(mapDomainCardResponseToCardData)));
  }

  getDomainCardsForNames(domainNames: string[], levels?: number[]): Observable<CardData[]> {
    return this.loadDomainLookup().pipe(
      switchMap(() => {
        const domainIds = this.resolveDomainIds(domainNames);
        return this.getDomainCards(domainIds, 0, 100, levels);
      }),
    );
  }

  getDomainCardsBrowse(options: DomainCardBrowseOptions = {}): Observable<PaginatedCards> {
    const { page = 0, size = 20, expansionId, isOfficial, associatedDomainId, tier, level } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'features,costTags,associatedDomain,modifiers');

    if (associatedDomainId !== undefined) {
      params = params.set('associatedDomainIds', associatedDomainId);
    }
    if (expansionId !== undefined) {
      params = params.set('expansionId', expansionId);
    }
    if (isOfficial !== undefined) {
      params = params.set('isOfficial', isOfficial);
    }
    if (tier !== undefined) {
      params = params.set('tier', tier);
    }
    if (level !== undefined) {
      params = params.set('levels', level);
    }

    return this.http
      .get<PaginatedResponse<DomainCardResponse>>(this.domainCardsUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapDomainCardResponseToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }

  getDomainsPaginated(page = 0, size = 20): Observable<PaginatedCards> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('expand', 'expansion');

    return this.http
      .get<PaginatedResponse<DomainResponse>>(this.domainsUrl, { params, withCredentials: true })
      .pipe(map(response => ({
        cards: response.content.map(mapDomainToCardData),
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      })));
  }

  clearCache(): void {
    this.domainNameToId.clear();
    this.lookupLoaded = false;
  }
}
