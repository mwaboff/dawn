import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SearchParams, SearchResponse } from '../../features/reference/models/search.model';

/**
 * Client for GET /api/search.
 *
 * We pass `expand=all` so each result's `expandedEntity` is populated with the
 * fullest DTO the search endpoint can produce.
 *
 * ASSUMPTION: `expand=all` returns nested sub-objects (features, costTags, modifiers,
 * expansion) in the same richness as the per-type list endpoints use
 * `expand=expansion,features,costTags,modifiers`. This has NOT been verified against
 * a live backend from this implementation session. If the Codex tiles render with empty
 * feature lists (regression vs. the current reference page), see the hydration fallback
 * described in docs/plans/2026-04-10-references-search-redesign.md §8 and tracked in
 * beads issue dawn-3ny (filed alongside phase 1).
 */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/search`;

  /**
   * Performs a full-text search. Never call with a blank `params.q` — the
   * backend returns 400 for blank queries.
   */
  search(params: SearchParams): Observable<SearchResponse> {
    let httpParams = new HttpParams()
      .set('q', params.q)
      .set('expand', 'all')
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 20));

    if (params.types?.length) {
      httpParams = httpParams.set('types', params.types.join(','));
    }
    if (params.tier != null) {
      httpParams = httpParams.set('tier', String(params.tier));
    }
    if (params.expansionId != null) {
      httpParams = httpParams.set('expansionId', String(params.expansionId));
    }
    if (params.isOfficial != null) {
      httpParams = httpParams.set('isOfficial', String(params.isOfficial));
    }
    if (params.cardType) {
      httpParams = httpParams.set('cardType', params.cardType);
    }
    if (params.featureType) {
      httpParams = httpParams.set('featureType', params.featureType);
    }
    if (params.adversaryType) {
      httpParams = httpParams.set('adversaryType', params.adversaryType);
    }
    if (params.domainCardType) {
      httpParams = httpParams.set('domainCardType', params.domainCardType);
    }
    if (params.associatedDomainId != null) {
      httpParams = httpParams.set('associatedDomainId', String(params.associatedDomainId));
    }
    if (params.trait) {
      httpParams = httpParams.set('trait', params.trait);
    }
    if (params.range) {
      httpParams = httpParams.set('range', params.range);
    }
    if (params.burden) {
      httpParams = httpParams.set('burden', params.burden);
    }
    if (params.isConsumable != null) {
      httpParams = httpParams.set('isConsumable', String(params.isConsumable));
    }

    return this.http.get<SearchResponse>(this.baseUrl, {
      params: httpParams,
      withCredentials: true,
    });
  }
}
