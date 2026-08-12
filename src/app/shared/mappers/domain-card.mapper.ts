import { buildRestrictedCardData, CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { DomainCardFeatureResponse, DomainCardResponse } from '../models/domain-card-api.model';

export const DOMAIN_THEME_COLORS: Record<string, string> = {
  'Arcana': '#7c3aed',
  'Blade': '#dc2626',
  'Bone': '#9ca3af',
  'Codex': '#2563eb',
  'Grace': '#ec4899',
  'Midnight': '#374151',
  'Sage': '#16a34a',
  'Splendor': '#eab308',
  'Valor': '#ea580c',
};

function formatTitleCase(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function mapFeature(feature: DomainCardFeatureResponse, cardType: string): CardFeature {
  return {
    name: feature.name,
    description: feature.description,
    subtitle: `${formatTitleCase(cardType)} Feature`,
    tags: feature.costTags?.length
      ? feature.costTags.map(tag => tag.label.toUpperCase())
      : undefined,
  };
}

function buildTags(response: DomainCardResponse): string[] {
  const tags: string[] = [];
  tags.push(`Level ${response.level}`);
  tags.push(formatTitleCase(response.type));
  if (response.recallCost > 0) {
    tags.push(`Recall: ${response.recallCost}`);
  }
  return tags;
}

function extractModifiers(response: DomainCardResponse): { target: string; operation: string; value: number }[] {
  return (response.features ?? []).flatMap(f =>
    (f.modifiers ?? []).map(m => ({ target: m.target, operation: m.operation, value: m.value })),
  );
}

function buildDescription(response: DomainCardResponse): string {
  return response.description ?? '';
}

export function mapDomainCardResponseToCardData(response: DomainCardResponse): CardData {
  if (response.restricted) {
    return buildRestrictedCardData(response.id, 'domainCard', response.expansionName);
  }

  const features: CardFeature[] = (response.features ?? []).map(f => mapFeature(f, response.type));
  const domainName = response.associatedDomain?.name ?? '';
  const accentColor = domainName ? (DOMAIN_THEME_COLORS[domainName] ?? undefined) : undefined;

  return {
    id: response.id,
    name: response.name,
    description: buildDescription(response),
    cardType: 'domainCard',
    subtitle: domainName || undefined,
    tags: buildTags(response),
    // The printed header's three facts split by kind rather than by position: domain and card type
    // are what qualifies this card within domain cards, level is the power-level scalar, and recall
    // cost is a number. Recall is shown even at 0 (the classic tags omit it) so the ledger matches
    // the sheet's `domainCardToEntity`, where a 0-recall card still reads "RECALL 0".
    entityDisplay: {
      subtitle: [domainName, formatTitleCase(response.type)].filter(Boolean).join(' · ') || undefined,
      scalar: { label: 'Level', value: String(response.level) },
      stats: [{ label: 'Recall', value: String(response.recallCost) }],
    },
    features: features.length > 0 ? features : undefined,
    metadata: {
      expansionId: response.expansionId,
      srd: response.srd,
      domainName,
      domainId: response.associatedDomainId,
      type: response.type,
      level: response.level,
      recallCost: response.recallCost,
      modifiers: extractModifiers(response),
      features: response.features ?? [],
      accentColor,
    },
  };
}
