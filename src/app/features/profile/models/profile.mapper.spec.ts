import { describe, it, expect } from 'vitest';
import { extractClassEntries, mapToSummary } from './profile.mapper';

describe('extractClassEntries', () => {
  it('returns class entries from subclass cards', () => {
    const result = extractClassEntries([
      { associatedClassName: 'Wizard', subclassPathName: 'Arcane' },
    ]);
    expect(result).toEqual([{ className: 'Wizard', subclassName: 'Arcane' }]);
  });

  it('deduplicates by class name and keeps the first occurrence subclassName', () => {
    const result = extractClassEntries([
      { associatedClassName: 'Bard', subclassPathName: 'Troubadour' },
      { associatedClassName: 'Bard', subclassPathName: 'Road' },
    ]);
    expect(result).toEqual([{ className: 'Bard', subclassName: 'Troubadour' }]);
  });

  it('substitutes Unknown when associatedClassName is missing', () => {
    const result = extractClassEntries([{ subclassPathName: 'Shadow' }]);
    expect(result).toEqual([{ className: 'Unknown', subclassName: 'Shadow' }]);
  });

  it('returns empty array for empty input', () => {
    expect(extractClassEntries([])).toEqual([]);
  });
});

describe('mapToSummary', () => {
  it('produces a CharacterSummary with all fields populated including lastModifiedAt', () => {
    const sheet = {
      id: 42,
      name: 'Arannis',
      pronouns: 'he/him',
      level: 3,
      createdAt: '2024-01-01T00:00:00Z',
      lastModifiedAt: '2024-06-15T12:00:00Z',
      subclassCards: [{ associatedClassName: 'Ranger', subclassPathName: 'Beastbound' }],
    };
    const result = mapToSummary(sheet);
    expect(result).toEqual({
      id: 42,
      name: 'Arannis',
      pronouns: 'he/him',
      level: 3,
      classEntries: [{ className: 'Ranger', subclassName: 'Beastbound' }],
      createdAt: '2024-01-01T00:00:00Z',
      lastModifiedAt: '2024-06-15T12:00:00Z',
    });
  });

  it('passes through pronouns when present', () => {
    const sheet = {
      id: 1,
      name: 'Lyra',
      pronouns: 'they/them',
      level: 1,
      createdAt: '2024-01-01T00:00:00Z',
      lastModifiedAt: '2024-01-02T00:00:00Z',
    };
    expect(mapToSummary(sheet).pronouns).toBe('they/them');
  });

  it('leaves pronouns undefined when absent', () => {
    const sheet = {
      id: 2,
      name: 'Kazimir',
      level: 5,
      createdAt: '2024-01-01T00:00:00Z',
      lastModifiedAt: '2024-01-02T00:00:00Z',
    };
    expect(mapToSummary(sheet).pronouns).toBeUndefined();
  });

  it('handles missing subclassCards by returning empty classEntries', () => {
    const sheet = {
      id: 3,
      name: 'Mira',
      level: 2,
      createdAt: '2024-01-01T00:00:00Z',
      lastModifiedAt: '2024-01-02T00:00:00Z',
    };
    expect(mapToSummary(sheet).classEntries).toEqual([]);
  });
});
