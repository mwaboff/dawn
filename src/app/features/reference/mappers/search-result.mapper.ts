import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../../../shared/components/adversary-card/adversary-card.model';
import { mapWeaponResponseToCardData } from '../../../shared/mappers/weapon.mapper';
import { mapArmorResponseToCardData } from '../../../shared/mappers/armor.mapper';
import { mapLootToCardData } from '../../../shared/mappers/loot.mapper';
import { mapAdversaryToAdversaryData } from '../../../shared/mappers/adversary.mapper';
import { mapClassResponseToCardData } from '../../../shared/mappers/class.mapper';
import { mapAncestryResponseToCardData } from '../../../shared/mappers/ancestry.mapper';
import { mapCommunityResponseToCardData } from '../../../shared/mappers/community.mapper';
import { mapDomainCardResponseToCardData } from '../../../shared/mappers/domain-card.mapper';
import { mapDomainToCardData } from '../../../shared/mappers/domain.mapper';
import { mapSubclassResponseToCardData } from '../../../shared/mappers/subclass.mapper';
import { WeaponResponse } from '../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../shared/models/loot-api.model';
import { AdversaryApiResponse } from '../../../shared/models/adversary-api.model';
import { ClassResponse } from '../../../shared/models/class-api.model';
import { AncestryCardResponse } from '../../../shared/models/ancestry-api.model';
import { CommunityCardResponse } from '../../../shared/models/community-api.model';
import { DomainCardResponse, DomainResponse } from '../../../shared/models/domain-card-api.model';
import { SubclassCardResponse } from '../../../shared/models/subclass-api.model';
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
 * (e.g. FEATURE, BEASTFORM, EXPANSION, QUESTION) fall back to a minimal card
 * shape so the caller can still render them without crashing.
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
