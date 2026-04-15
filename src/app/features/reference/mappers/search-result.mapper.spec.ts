import { describe, it, expect } from 'vitest';
import { mapSearchResult } from './search-result.mapper';
import { SearchResultResponse } from '../models/search.model';
import { WeaponResponse } from '../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../shared/models/loot-api.model';
import { AdversaryApiResponse } from '../../../shared/models/adversary-api.model';
import { ClassResponse } from '../../../shared/models/class-api.model';
import { AncestryCardResponse } from '../../../shared/models/ancestry-api.model';
import { CommunityCardResponse } from '../../../shared/models/community-api.model';
import { DomainCardResponse } from '../../../shared/models/domain-card-api.model';
import { SubclassCardResponse } from '../../../shared/models/subclass-api.model';

function buildBase(overrides: Partial<SearchResultResponse> = {}): SearchResultResponse {
  return {
    type: 'WEAPON',
    id: 1,
    name: 'Test Entity',
    relevanceScore: 0.5,
    expandedEntity: null,
    ...overrides,
  };
}

const weaponEntity: WeaponResponse = {
  id: 1,
  name: 'Flame Sword',
  expansionId: 1,
  tier: 1,
  isOfficial: true,
  isPrimary: true,
  trait: 'AGILITY',
  range: 'MELEE',
  burden: 'ONE_HANDED',
  damage: { diceCount: 1, diceType: 'D8', modifier: 0, damageType: 'PHYSICAL', notation: '1d8' },
  createdAt: '2025-01-01T00:00:00Z',
  lastModifiedAt: '2025-01-01T00:00:00Z',
};

const armorEntity: ArmorResponse = {
  id: 2,
  name: 'Iron Shield',
  expansionId: 1,
  tier: 1,
  isOfficial: true,
  baseScore: 5,
  baseMajorThreshold: 10,
  baseSevereThreshold: 15,
  createdAt: '2025-01-01T00:00:00Z',
  lastModifiedAt: '2025-01-01T00:00:00Z',
};

const lootEntity: LootApiResponse = {
  id: 3,
  name: 'Health Potion',
  description: 'Restores health',
  tier: 1,
  isConsumable: true,
};

const adversaryEntity: AdversaryApiResponse = {
  id: 4,
  name: 'Fire Drake',
  tier: 2,
  adversaryType: 'STANDARD',
};

const classEntity: ClassResponse = {
  id: 5,
  name: 'Warrior',
  description: 'A warrior class',
  startingEvasion: 12,
  startingHitPoints: 20,
  hopeFeatures: [],
  classFeatures: [],
  isOfficial: true,
  isPublic: true,
  createdAt: '2025-01-01T00:00:00Z',
  lastModifiedAt: '2025-01-01T00:00:00Z',
};

const ancestryEntity: AncestryCardResponse = {
  id: 6,
  name: 'Elven Ancestry',
  description: 'Elven heritage',
  cardType: 'ANCESTRY',
  expansionId: 1,
  isOfficial: true,
  featureIds: [],
  features: [],
  costTagIds: [],
  costTags: [],
  createdAt: '2025-01-01T00:00:00Z',
  lastModifiedAt: '2025-01-01T00:00:00Z',
};

const communityEntity: CommunityCardResponse = {
  id: 7,
  name: 'Wanderer Community',
  description: 'Wanderers from afar',
  cardType: 'COMMUNITY',
  expansionId: 1,
  isOfficial: true,
  featureIds: [],
  features: [],
  costTagIds: [],
  costTags: [],
  createdAt: '2025-01-01T00:00:00Z',
  lastModifiedAt: '2025-01-01T00:00:00Z',
};

const domainCardEntity: DomainCardResponse = {
  id: 8,
  name: 'Fireball',
  description: 'A fireball spell',
  cardType: 'DOMAIN',
  expansionId: 1,
  isOfficial: true,
  featureIds: [],
  features: [],
  costTagIds: [],
  costTags: [],
  associatedDomainId: 1,
  level: 1,
  recallCost: 0,
  type: 'SPELL',
  createdAt: '2025-01-01T00:00:00Z',
  lastModifiedAt: '2025-01-01T00:00:00Z',
};

const subclassEntity: SubclassCardResponse = {
  id: 9,
  name: 'Berserker',
  cardType: 'SUBCLASS',
  expansionId: 1,
  isOfficial: true,
  featureIds: [],
  features: [],
  costTagIds: [],
  costTags: [],
  subclassPathId: 1,
  level: 'FOUNDATION',
  createdAt: '2025-01-01T00:00:00Z',
  lastModifiedAt: '2025-01-01T00:00:00Z',
};

describe('mapSearchResult', () => {
  it('should preserve base fields (type, id, name, relevanceScore) for all results', () => {
    const result = mapSearchResult(buildBase({ type: 'WEAPON', id: 42, name: 'Test', relevanceScore: 0.9 }));

    expect(result.type).toBe('WEAPON');
    expect(result.id).toBe(42);
    expect(result.name).toBe('Test');
    expect(result.relevanceScore).toBe(0.9);
  });

  it('should return a fallback card when expandedEntity is null for WEAPON', () => {
    const result = mapSearchResult(buildBase({ type: 'WEAPON', expandedEntity: null }));

    expect(result.card).toBeDefined();
    expect(result.card!.name).toBe('Test Entity');
    expect(result.adversary).toBeUndefined();
  });

  it('should map WEAPON with expandedEntity to a card via weapon mapper', () => {
    const result = mapSearchResult(buildBase({ type: 'WEAPON', expandedEntity: weaponEntity }));

    expect(result.card).toBeDefined();
    expect(result.card!.cardType).toBe('weapon');
    expect(result.card!.name).toBe('Flame Sword');
    expect(result.adversary).toBeUndefined();
  });

  it('should map ARMOR with expandedEntity to a card via armor mapper', () => {
    const result = mapSearchResult(buildBase({ type: 'ARMOR', id: 2, name: 'Iron Shield', expandedEntity: armorEntity }));

    expect(result.card).toBeDefined();
    expect(result.card!.cardType).toBe('armor');
    expect(result.card!.name).toBe('Iron Shield');
  });

  it('should map LOOT with expandedEntity to a card via loot mapper', () => {
    const result = mapSearchResult(buildBase({ type: 'LOOT', id: 3, name: 'Health Potion', expandedEntity: lootEntity }));

    expect(result.card).toBeDefined();
    expect(result.card!.name).toBe('Health Potion');
  });

  it('should map ADVERSARY with expandedEntity to an adversary (not card)', () => {
    const result = mapSearchResult(buildBase({ type: 'ADVERSARY', id: 4, name: 'Fire Drake', expandedEntity: adversaryEntity }));

    expect(result.adversary).toBeDefined();
    expect(result.adversary!.name).toBe('Fire Drake');
    expect(result.adversary!.adversaryType).toBe('STANDARD');
    expect(result.card).toBeUndefined();
  });

  it('should use fallback card for ADVERSARY when expandedEntity is null', () => {
    const result = mapSearchResult(buildBase({ type: 'ADVERSARY', expandedEntity: null }));

    expect(result.card).toBeDefined();
    expect(result.card!.cardType).toBe('class');
    expect(result.adversary).toBeUndefined();
  });

  it('should map CLASS with expandedEntity to a card via class mapper', () => {
    const result = mapSearchResult(buildBase({ type: 'CLASS', id: 5, name: 'Warrior', expandedEntity: classEntity }));

    expect(result.card).toBeDefined();
    expect(result.card!.cardType).toBe('class');
    expect(result.card!.name).toBe('Warrior');
  });

  it('should map ANCESTRY_CARD with expandedEntity to a card via ancestry mapper', () => {
    const result = mapSearchResult(buildBase({ type: 'ANCESTRY_CARD', id: 6, name: 'Elven Ancestry', expandedEntity: ancestryEntity }));

    expect(result.card).toBeDefined();
    expect(result.card!.cardType).toBe('ancestry');
  });

  it('should map COMMUNITY_CARD with expandedEntity to a card via community mapper', () => {
    const result = mapSearchResult(buildBase({ type: 'COMMUNITY_CARD', id: 7, name: 'Wanderer Community', expandedEntity: communityEntity }));

    expect(result.card).toBeDefined();
    expect(result.card!.cardType).toBe('community');
  });

  it('should map DOMAIN_CARD with expandedEntity to a card via domain-card mapper', () => {
    const result = mapSearchResult(buildBase({ type: 'DOMAIN_CARD', id: 8, name: 'Fireball', expandedEntity: domainCardEntity }));

    expect(result.card).toBeDefined();
    expect(result.card!.cardType).toBe('domainCard');
  });

  it('should map DOMAIN with expandedEntity to a card via domain mapper', () => {
    const domainEntity = { id: 10, name: 'Blade', description: 'The Blade domain' };
    const result = mapSearchResult(buildBase({ type: 'DOMAIN', id: 10, name: 'Blade', expandedEntity: domainEntity }));

    expect(result.card).toBeDefined();
    expect(result.card!.cardType).toBe('domain');
    expect(result.card!.name).toBe('Blade');
  });

  it('should map SUBCLASS_CARD with expandedEntity to a card via subclass mapper', () => {
    const result = mapSearchResult(buildBase({ type: 'SUBCLASS_CARD', id: 9, name: 'Berserker', expandedEntity: subclassEntity }));

    expect(result.card).toBeDefined();
    expect(result.card!.cardType).toBe('subclass');
  });

  it('should return a fallback card for FEATURE (no dedicated mapper)', () => {
    const result = mapSearchResult(buildBase({ type: 'FEATURE', id: 20, name: 'Rage', expandedEntity: null }));

    expect(result.card).toBeDefined();
    expect(result.card!.name).toBe('Rage');
    expect(result.card!.id).toBe(20);
  });

  it('should return a fallback card for BEASTFORM (unsupported expand)', () => {
    const result = mapSearchResult(buildBase({ type: 'BEASTFORM', id: 30, name: 'Wolf Form', expandedEntity: null }));

    expect(result.card).toBeDefined();
    expect(result.card!.name).toBe('Wolf Form');
  });

  it('should return a fallback card for EXPANSION type', () => {
    const result = mapSearchResult(buildBase({ type: 'EXPANSION', id: 1, name: 'Core Set', expandedEntity: null }));

    expect(result.card).toBeDefined();
    expect(result.card!.name).toBe('Core Set');
  });

  it('should handle null relevanceScore', () => {
    const result = mapSearchResult(buildBase({ relevanceScore: null }));

    expect(result.relevanceScore).toBeNull();
  });
});
