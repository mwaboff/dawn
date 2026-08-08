import { EntityCardBadge, EntityCardData, EntityCardFeature } from '../../../shared/components/entity-card/entity-card.model';
import { CardSummary, DomainCardSummary, FeatureDisplay, SubclassCardSummary } from '../../character-sheet/models/character-sheet-view.model';

/**
 * View-model mapping only -- `character-sheet-beta` inherits every save pipeline, equip
 * constraint and handler from `CharacterSheet` unchanged. This is the one piece of new "logic"
 * the beta page adds: turning the inherited `CharacterSheetView` card summaries into
 * `EntityCardData`, the shape the shared `EntityCard` component renders.
 */

function mapFeatures(features: readonly FeatureDisplay[]): EntityCardFeature[] {
  return features.map(feature => ({
    // A blank name (see character-sheet-view.mapper.ts's `mapFeature`) means "no rules name",
    // not "named ''" -- entity-card.html's `@if (feature.name)` needs it absent, not empty.
    name: feature.name || undefined,
    description: feature.description,
    tags: feature.tags,
    modifiers: feature.modifiers.map(modifier => ({ label: modifier.label, value: modifier.value })),
  }));
}

export function classCardToEntity(card: CardSummary): EntityCardData {
  return {
    id: card.id,
    name: card.name,
    cardType: 'class',
    description: card.description,
    features: mapFeatures(card.features),
  };
}

export function ancestryCardToEntity(card: CardSummary): EntityCardData {
  return {
    id: card.id,
    name: card.name,
    cardType: 'ancestry',
    description: card.description,
    features: mapFeatures(card.features),
  };
}

export function communityCardToEntity(card: CardSummary): EntityCardData {
  return {
    id: card.id,
    name: card.name,
    cardType: 'community',
    description: card.description,
    features: mapFeatures(card.features),
  };
}

export function subclassCardToEntity(card: SubclassCardSummary): EntityCardData {
  const meta: EntityCardBadge[] = [];
  if (card.domainNames?.length) meta.push({ label: 'Domains', value: card.domainNames.join(', ') });
  if (card.associatedClassName) meta.push({ label: 'Class', value: card.associatedClassName });

  return {
    id: card.id,
    name: card.name,
    cardType: 'subclass',
    // card.level is "Foundation"/"Specialization"/"Mastery" -- exactly the italic subtitle line
    // EntityCardData documents, not a numeric badge.
    subtitle: card.level,
    meta: meta.length ? meta : undefined,
    description: card.description,
    features: mapFeatures(card.features),
  };
}

export function domainCardToEntity(card: DomainCardSummary): EntityCardData {
  const badges: EntityCardBadge[] = [];
  if (card.level !== undefined) badges.push({ label: `Lvl ${card.level}` });
  if (card.type) badges.push({ label: card.type });
  if (card.recallCost !== undefined) badges.push({ label: `Recall ${card.recallCost}` });

  return {
    id: card.id,
    name: card.name,
    cardType: 'domainCard',
    // Domain cards show their domain ("Valor") in the type tab instead of "Domain Card".
    eyebrow: card.domainName,
    badges: badges.length ? badges : undefined,
    description: card.description,
    features: mapFeatures(card.features),
  };
}
