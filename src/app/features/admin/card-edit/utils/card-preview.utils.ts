import { CardData, CardFeature } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../../../../shared/components/adversary-card/adversary-card.model';
import { EntityCardData } from '../../../../shared/components/entity-card/entity-card.model';
import { EntityFormSchema } from '../../../../shared/components/entity-form/entity-form.types';
import { cardDataToEntityCard } from '../../../../shared/mappers/card-data-to-entity-card.mapper';
import { adversaryToEntityCard } from '../../../../shared/mappers/adversary-data-to-entity-card.mapper';
import { RawCardResponse } from '../../models/admin-api.model';

export function buildPreviewCard(
  schema: EntityFormSchema,
  formValue: Record<string, unknown>,
  raw: RawCardResponse,
  features: unknown[],
): CardData {
  return {
    id: raw.id,
    name: (formValue['name'] as string) ?? '',
    description: (formValue['description'] as string) ?? '',
    // The schema, not the API response: `RawCardResponse` carries no `cardType` field (the type is
    // the route segment, not card data), so reading it off `raw` fell through to the `'domain'`
    // default on every card and previewed a weapon, an adversary and an environment all in the
    // domain accent. `EntityFormSchema.cardType` is the same string the route resolved the schema
    // by, so it is right for all 18 types by construction.
    cardType: schema.cardType as CardData['cardType'],
    subtitle: schema.previewSubtitle?.(formValue),
    tags: schema.previewTags?.(formValue) ?? [],
    features: toCardFeatures(features),
    metadata: {},
  };
}

/**
 * The preview as the shared `EntityCard` renders it.
 *
 * Adversaries take their own branch through `adversaryToEntityCard` -- the same mapper the reference
 * browser uses -- rather than the generic `CardData` path. `CardData` has no slot for a stat block,
 * so the generic path could only forward the schema's `previewTags`, which turned Difficulty, HP and
 * the rest into flat header chips: an admin editing an adversary saw a row of pills where the site
 * shows a stat ledger. The form already holds every field `AdversaryData` needs, so the honest fix
 * is to hand the real shape to the real mapper and get the real card face back.
 *
 * Every other type still goes through `cardDataToEntityCard`'s no-`entityDisplay` branch, which is
 * faithful to what those forms actually hold: name, subtitle, tags and features, no numbers.
 */
export function buildPreviewEntityCard(
  schema: EntityFormSchema,
  formValue: Record<string, unknown>,
  raw: RawCardResponse,
  features: unknown[],
): EntityCardData {
  if (schema.cardType === 'adversary') {
    return adversaryToEntityCard(toAdversaryData(formValue, raw, features));
  }
  return cardDataToEntityCard(buildPreviewCard(schema, formValue, raw, features));
}

function toCardFeatures(features: unknown[]): CardFeature[] | undefined {
  const mapped = (features as Record<string, unknown>[]).map(f => ({
    id: f['id'] as number | undefined,
    name: (f['name'] as string) ?? '',
    description: (f['description'] as string) ?? '',
    subtitle: f['subtitle'] as string | undefined,
    tags: f['tags'] as string[] | undefined,
  }));
  return mapped.length > 0 ? mapped : undefined;
}

/** `undefined` rather than 0 for a blank number field, so the mapper omits the stat instead of
 *  printing a zero the admin never typed. */
function num(value: unknown): number | undefined {
  return value === null || value === undefined || value === '' ? undefined : Number(value);
}

function toAdversaryData(
  formValue: Record<string, unknown>,
  raw: RawCardResponse,
  features: unknown[],
): AdversaryData {
  const notation = formValue['damageNotation'] as string | undefined;
  const damageType = (formValue['damageDamageType'] as string | undefined) ?? '';
  return {
    id: raw.id,
    name: (formValue['name'] as string) ?? '',
    description: (formValue['description'] as string) ?? '',
    // `tier` is required by the schema, but the form is previewed while it is still being filled in.
    tier: num(formValue['tier']) ?? 1,
    adversaryType: (formValue['adversaryType'] as string) ?? '',
    difficulty: num(formValue['difficulty']),
    hitPointMax: num(formValue['hitPointMax']),
    stressMax: num(formValue['stressMax']),
    evasion: num(formValue['evasion']),
    majorThreshold: num(formValue['majorThreshold']),
    severeThreshold: num(formValue['severeThreshold']),
    attackModifier: num(formValue['attackModifier']),
    weaponName: formValue['weaponName'] as string | undefined,
    attackRange: formValue['attackRange'] as string | undefined,
    damage: notation ? { notation, damageType } : undefined,
    motivesAndTactics: formValue['motivesAndTactics'] as string | undefined,
    features: toCardFeatures(features),
  };
}
