import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { ArmorResponse } from '../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../shared/models/loot-api.model';
import { WeaponResponse } from '../../../shared/models/weapon-api.model';
import { ArmorService } from '../../../shared/services/armor.service';
import { LootService } from '../../../shared/services/loot.service';
import { WeaponService } from '../../../shared/services/weapon.service';
import { InventoryItemType } from '../utils/inventory-card.mapper';

/** What the finder is asking for: some text, some kinds of gear, official content in or out. */
export interface CatalogQuery {
  /** Already trimmed. Empty means "everything", which is the finder's opening state. */
  readonly term: string;
  readonly types: readonly InventoryItemType[];
  /** Narrows to homebrew -- the viewer's own, their campaigns', and the public catalogue. */
  readonly customOnly: boolean;
}

/**
 * Discriminated on `type` rather than carrying a widened `CatalogItem`, so the mapper that turns a
 * hit into a card narrows to the right response shape without a cast.
 */
export type CatalogHit =
  | { readonly type: 'weapon'; readonly item: WeaponResponse }
  | { readonly type: 'armor'; readonly item: ArmorResponse }
  | { readonly type: 'loot'; readonly item: LootApiResponse };

export interface CatalogResult {
  readonly hits: readonly CatalogHit[];
  /**
   * How many matches each type actually has, which can exceed how many came back -- the finder
   * states the difference rather than letting a capped list read as the whole answer.
   */
  readonly totals: ReadonlyMap<InventoryItemType, number>;
}

interface CatalogPage {
  readonly type: InventoryItemType;
  readonly hits: CatalogHit[];
  readonly total: number;
}

/**
 * Per type, so a three-type search returns at most 75 rows. Deep results are what filters are for.
 * Exported because the finder has to say when a group hit the cap -- a silently truncated list reads
 * as "that is everything" when it is not.
 */
export const CATALOG_PAGE_SIZE = 25;

/**
 * The one place the beta item finder talks to the catalogue.
 *
 * Deliberately the three per-type list endpoints rather than `GET /api/search`, even though search
 * is the one endpoint that already returns all three types at once. Search runs
 * `plainto_tsquery`, which matches whole words: a player typing "broad" gets nothing until they
 * finish "broadsword". The list endpoints match `name` as a case-insensitive substring, which is
 * what an as-you-type field needs. They also accept a blank filter -- search rejects a blank `q`
 * with a 400 -- so browsing and searching are one code path here instead of two.
 *
 * Visibility is the server's call either way: all three endpoints return official content, public
 * homebrew, the caller's own homebrew, and anything shared with a campaign the caller is in.
 */
@Injectable({ providedIn: 'root' })
export class ItemCatalogService {
  private readonly weaponService = inject(WeaponService);
  private readonly armorService = inject(ArmorService);
  private readonly lootService = inject(LootService);

  /**
   * Results arrive grouped in `query.types` order, alphabetical within each group. `forkJoin` never
   * emits for an empty source array, so an empty type list short-circuits rather than hanging the
   * finder on a request that will not complete.
   */
  find(query: CatalogQuery): Observable<CatalogResult> {
    if (query.types.length === 0) return of({ hits: [], totals: new Map() });
    return forkJoin(query.types.map(type => this.fetch(type, query))).pipe(
      map(pages => ({
        hits: pages.flatMap(page => page.hits),
        totals: new Map(pages.map(page => [page.type, page.total])),
      })),
    );
  }

  private fetch(type: InventoryItemType, query: CatalogQuery): Observable<CatalogPage> {
    // `sort: 'NAME'` matters more here than anywhere: the API's default is insertion order, which
    // puts every piece of official content first and buries the player's own gear at the very end.
    const filters = {
      size: CATALOG_PAGE_SIZE,
      sort: 'NAME' as const,
      name: query.term || undefined,
      isOfficial: query.customOnly ? false : undefined,
    };

    if (type === 'weapon') {
      return this.weaponService.getWeaponsRaw(filters).pipe(
        map(page => ({
          type,
          hits: page.items.map((item): CatalogHit => ({ type: 'weapon', item })),
          total: page.totalElements,
        })),
      );
    }
    if (type === 'armor') {
      return this.armorService.getArmorsRaw(filters).pipe(
        map(page => ({
          type,
          hits: page.items.map((item): CatalogHit => ({ type: 'armor', item })),
          total: page.totalElements,
        })),
      );
    }
    return this.lootService.getLootRaw(filters).pipe(
      map(page => ({
        type,
        hits: page.items.map((item): CatalogHit => ({ type: 'loot', item })),
        total: page.totalElements,
      })),
    );
  }
}
