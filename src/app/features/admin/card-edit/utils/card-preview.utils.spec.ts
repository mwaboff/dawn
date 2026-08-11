import { describe, it, expect } from 'vitest';
import { buildPreviewCard, buildPreviewEntityCard } from './card-preview.utils';
import { EntityFormSchema } from '../../../../shared/components/entity-form/entity-form.types';
import { RawCardResponse } from '../../models/admin-api.model';

const domainCardSchema: EntityFormSchema = {
  cardType: 'domainCard',
  sections: [
    {
      title: 'Basics',
      fields: [
        { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 200, column: 'full' },
        { name: 'description', label: 'Description', kind: 'textarea', column: 'full' },
        { name: 'backgroundImageUrl', label: 'Background image URL', kind: 'url', maxLength: 500, column: 'full' },
      ],
    },
    {
      title: 'Domain card details',
      fields: [
        { name: 'associatedDomainId', label: 'Domain', kind: 'entity', lookup: 'domains', required: true, column: 1 },
        { name: 'level', label: 'Level', kind: 'number', required: true, positive: true, column: 2 },
        { name: 'recallCost', label: 'Recall cost', kind: 'number', required: true, min: 0, column: 1 },
        { name: 'type', label: 'Type', kind: 'enum', required: true, column: 2, options: [
          { value: 'SPELL', label: 'Spell' },
          { value: 'GRIMOIRE', label: 'Grimoire' },
        ]},
        { name: 'domainFeatureIds', label: 'Features', kind: 'entityMulti', lookup: 'domainFeatures', column: 'full' },
      ],
    },
  ],
  previewTags: (v) => [
    v['level'] ? `Level ${v['level']}` : null,
    v['type'] as string,
    Number(v['recallCost']) > 0 ? `Recall: ${v['recallCost']}` : null,
  ].filter((t): t is string => !!t),
  previewSubtitle: (v) => v['type'] ? `${v['type']} card` : undefined,
};

const rawCard: RawCardResponse = {
  id: 42,
  name: 'Test Spell',
  description: 'A powerful spell',
  expansionId: 1,
  level: 3,
  recallCost: 2,
  type: 'SPELL',
  associatedDomainId: 7,
  cardType: 'domain',
};

describe('buildPreviewCard', () => {
  it('produces expected CardData shape for domainCard', () => {
    const formValue: Record<string, unknown> = {
      name: 'Fireball',
      description: 'Deals fire damage',
      level: 3,
      recallCost: 2,
      type: 'SPELL',
    };
    const features = [
      { id: 1, name: 'Burn', description: 'Applies burning', subtitle: 'PASSIVE', tags: ['FIRE'] },
    ];
    const result = buildPreviewCard(domainCardSchema, formValue, rawCard, features);
    expect(result.id).toBe(42);
    expect(result.name).toBe('Fireball');
    expect(result.description).toBe('Deals fire damage');
    // The SCHEMA's type, not the `cardType` sitting on the raw API response above -- reading that
    // one previewed every card type in the domain accent.
    expect(result.cardType).toBe('domainCard');
    expect(result.tags).toContain('Level 3');
    expect(result.tags).toContain('SPELL');
    expect(result.tags).toContain('Recall: 2');
    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Burn');
  });

  it('uses schema.previewSubtitle when defined', () => {
    const formValue: Record<string, unknown> = { name: 'Fireball', type: 'GRIMOIRE' };
    const result = buildPreviewCard(domainCardSchema, formValue, rawCard, []);
    expect(result.subtitle).toBe('GRIMOIRE card');
  });

  it('returns undefined features when feature list is empty', () => {
    const formValue: Record<string, unknown> = { name: 'Test', type: 'SPELL', level: 1, recallCost: 0 };
    const result = buildPreviewCard(domainCardSchema, formValue, rawCard, []);
    expect(result.features).toBeUndefined();
  });

  it('uses raw.id for the card id', () => {
    const formValue: Record<string, unknown> = { name: 'Test' };
    const result = buildPreviewCard(domainCardSchema, formValue, rawCard, []);
    expect(result.id).toBe(rawCard.id);
  });

  it('returns empty tags when schema has no previewTags function', () => {
    const noPreviewTagsSchema: EntityFormSchema = {
      cardType: 'companion',
      sections: [],
    };
    const result = buildPreviewCard(noPreviewTagsSchema, { name: 'Rex' }, rawCard, []);
    expect(result.tags).toEqual([]);
  });
});

describe('buildPreviewEntityCard', () => {
  const adversarySchema: EntityFormSchema = { cardType: 'adversary', sections: [] };

  it('gives an adversary a real stat ledger rather than a row of tag chips', () => {
    const result = buildPreviewEntityCard(adversarySchema, {
      name: 'Gnarl', tier: 2, adversaryType: 'BRUISER',
      difficulty: 14, hitPointMax: 8, stressMax: 3, evasion: 12,
    }, rawCard, []);

    expect(result.cardType).toBe('adversary');
    expect(result.subtitle).toBe('Bruiser');
    expect(result.stats).toContainEqual({ label: 'Difficulty', value: '14' });
    expect(result.stats).toContainEqual({ label: 'HP', value: '8' });
    expect(result.badges).toContainEqual({ label: 'Tier', value: '2' });
  });

  it('omits a stat the admin has not filled in yet rather than printing a zero', () => {
    const result = buildPreviewEntityCard(adversarySchema, {
      name: 'Gnarl', tier: 1, adversaryType: 'MINION', difficulty: null, hitPointMax: '', evasion: 12,
    }, rawCard, []);

    expect(result.stats).toEqual([{ label: 'Evasion', value: '12' }]);
  });

  it('routes every other type through the generic CardData mapper', () => {
    const result = buildPreviewEntityCard(domainCardSchema, { name: 'Fireball', level: 3 }, rawCard, []);

    expect(result.cardType).toBe('domainCard');
    expect(result.stats).toBeUndefined();
  });
});
