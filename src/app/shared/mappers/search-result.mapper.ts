import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../components/adversary-card/adversary-card.model';
import { mapWeaponResponseToCardData } from './weapon.mapper';
import { mapArmorResponseToCardData } from './armor.mapper';
import { mapLootToCardData } from './loot.mapper';
import { mapAdversaryToAdversaryData } from './adversary.mapper';
import { mapClassResponseToCardData } from './class.mapper';
import { mapAncestryResponseToCardData } from './ancestry.mapper';
import { mapCommunityResponseToCardData } from './community.mapper';
import { mapDomainCardResponseToCardData } from './domain-card.mapper';
import { mapDomainToCardData } from './domain.mapper';
import { mapSubclassResponseToCardData } from './subclass.mapper';
import { mapEnvironmentToCardData } from './environment.mapper';
import { mapBeastformToCardData } from './beastform.mapper';
import { WeaponResponse } from '../models/weapon-api.model';
import { ArmorResponse } from '../models/armor-api.model';
import { LootApiResponse } from '../models/loot-api.model';
import { AdversaryApiResponse } from '../models/adversary-api.model';
import { ClassResponse } from '../models/class-api.model';
import { AncestryCardResponse } from '../models/ancestry-api.model';
import { CommunityCardResponse } from '../models/community-api.model';
import { DomainCardResponse, DomainResponse } from '../models/domain-card-api.model';
import { SubclassCardResponse } from '../models/subclass-api.model';
import { EnvironmentResponse } from '../models/environment-api.model';
import { BeastformResponse } from '../models/beastform-api.model';
import { SearchResultResponse, SearchableEntityType } from '../models/search.model';

export interface MappedSearchResult {
  type: SearchableEntityType;
  id: number;
  name: string;
  relevanceScore: number | null;
  card?: CardData;
  adversary?: AdversaryData;
}

/**
 * Dispatches a `SearchResultResponse` to the appropriate per-type mapper and
 * returns a unified `MappedSearchResult`. Results without a dedicated mapper
 * (e.g. FEATURE, EXPANSION, QUESTION) fall back to a minimal card shape so the
 * caller can still render them without crashing.
 *
 * The fallback is deliberately hard to notice in the UI -- it renders the right
 * name with an empty body under a `cardType: 'class'` label, which reads as a
 * styling bug rather than a missing case. ENVIRONMENT and BEASTFORM sat in it
 * for exactly that reason: both are registered in `SearchableEntityType`,
 * indexed by the backend, and returned with a fully-populated `expandedEntity`,
 * but had no arm here. **Any type added to `BROWSABLE_TYPES` or the backend
 * search registry needs a case below, not just a browse arm.**
 *
 * Note: FEATURE (class/subclass features) has no standalone card mapper —
 * it falls through to the fallback. A feature-specific renderer may be added
 * in a later phase when a dedicated card design is available.
 */
export function mapSearchResult(result: SearchResultResponse): MappedSearchResult {
  const base = {
    type: result.type,
    id: result.id,
    name: result.name,
    relevanceScore: result.relevanceScore,
  };

  const entity = result.expandedEntity;

  switch (result.type) {
    case 'WEAPON':
      if (entity) {
        return { ...base, card: mapWeaponResponseToCardData(entity as WeaponResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    case 'ARMOR':
      if (entity) {
        return { ...base, card: mapArmorResponseToCardData(entity as ArmorResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    case 'LOOT':
      if (entity) {
        return { ...base, card: mapLootToCardData(entity as LootApiResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    case 'ADVERSARY':
      if (entity) {
        return { ...base, adversary: mapAdversaryToAdversaryData(entity as AdversaryApiResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    case 'CLASS':
      if (entity) {
        return { ...base, card: mapClassResponseToCardData(entity as ClassResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    case 'ANCESTRY_CARD':
      if (entity) {
        return { ...base, card: mapAncestryResponseToCardData(entity as AncestryCardResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    case 'COMMUNITY_CARD':
      if (entity) {
        return { ...base, card: mapCommunityResponseToCardData(entity as CommunityCardResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    case 'DOMAIN_CARD':
      if (entity) {
        return { ...base, card: mapDomainCardResponseToCardData(entity as DomainCardResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    case 'DOMAIN':
      if (entity) {
        return { ...base, card: mapDomainToCardData(entity as DomainResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    case 'SUBCLASS_CARD':
      if (entity) {
        return { ...base, card: mapSubclassResponseToCardData(entity as SubclassCardResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    case 'ENVIRONMENT':
      if (entity) {
        return { ...base, card: mapEnvironmentToCardData(entity as EnvironmentResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    case 'BEASTFORM':
      if (entity) {
        return { ...base, card: mapBeastformToCardData(entity as BeastformResponse) };
      }
      return { ...base, card: buildFallbackCard(result) };

    default:
      return { ...base, card: buildFallbackCard(result) };
  }
}

function buildFallbackCard(result: SearchResultResponse): CardData {
  return {
    id: result.id,
    name: result.name,
    description: '',
    cardType: 'class',
  };
}
