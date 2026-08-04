import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { EntityFormSchema } from '../../../../shared/components/entity-form/entity-form.types';
import { RawCardResponse } from '../../models/admin-api.model';

export function buildPreviewCard(
  schema: EntityFormSchema,
  formValue: Record<string, unknown>,
  raw: RawCardResponse,
  features: unknown[],
): CardData {
  const cardFeatures = (features as Record<string, unknown>[]).map(f => ({
    id: f['id'] as number | undefined,
    name: (f['name'] as string) ?? '',
    description: (f['description'] as string) ?? '',
    subtitle: (f['subtitle'] as string | undefined),
    tags: (f['tags'] as string[] | undefined),
  }));

  return {
    id: raw.id,
    name: (formValue['name'] as string) ?? '',
    description: (formValue['description'] as string) ?? '',
    cardType: raw['cardType'] as CardData['cardType'] ?? 'domain',
    subtitle: schema.previewSubtitle?.(formValue),
    tags: schema.previewTags?.(formValue) ?? [],
    features: cardFeatures.length > 0 ? cardFeatures : undefined,
    metadata: {},
  };
}
