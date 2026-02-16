import { describe, it, expect } from 'vitest';
import { mapClassResponseToCardData } from './class.mapper';
import { ClassResponse } from '../models/class-api.model';

function buildClassResponse(overrides: Partial<ClassResponse> = {}): ClassResponse {
  return {
    id: 1,
    name: 'Warrior',
    description: 'A mighty fighter',
    startingEvasion: 8,
    startingHitPoints: 6,
    hopeFeatures: [],
    classFeatures: [],
    isOfficial: true,
    isPublic: true,
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapClassResponseToCardData', () => {
  it('should map class name, description, and id correctly', () => {
    const response = buildClassResponse({ id: 42, name: 'Ranger', description: 'A skilled tracker' });
    const result = mapClassResponseToCardData(response);

    expect(result.id).toBe(42);
    expect(result.name).toBe('Ranger');
    expect(result.description).toBe('A skilled tracker');
    expect(result.cardType).toBe('class');
  });

  it('should map startingEvasion and startingHitPoints to tags', () => {
    const response = buildClassResponse({ startingEvasion: 10, startingHitPoints: 8 });
    const result = mapClassResponseToCardData(response);

    expect(result.tags).toEqual(['Evasion: 10', 'Hit Points: 8']);
  });

  it('should map hopeFeatures with correct subtitle', () => {
    const response = buildClassResponse({
      hopeFeatures: [
        { id: 1, name: 'Inspiring Strike', description: 'Gain hope on crit', featureType: 'HOPE' },
      ],
    });
    const result = mapClassResponseToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Inspiring Strike');
    expect(result.features![0].description).toBe('Gain hope on crit');
    expect(result.features![0].subtitle).toBe('Hope Feature');
  });

  it('should map classFeatures with correct subtitle', () => {
    const response = buildClassResponse({
      classFeatures: [
        { id: 2, name: 'Heavy Armor', description: 'Can wear heavy armor', featureType: 'CLASS' },
      ],
    });
    const result = mapClassResponseToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].subtitle).toBe('Class Feature');
  });

  it('should map costTag labels to uppercase', () => {
    const response = buildClassResponse({
      classFeatures: [
        {
          id: 3,
          name: 'Shield Bash',
          description: 'Bash with shield',
          featureType: 'CLASS',
          costTags: [
            { label: 'action', value: 1 },
            { label: 'stress', value: 2 },
          ],
        },
      ],
    });
    const result = mapClassResponseToCardData(response);

    expect(result.features![0].tags).toEqual(['ACTION', 'STRESS']);
  });

  it('should handle features with no costTags', () => {
    const response = buildClassResponse({
      classFeatures: [
        { id: 4, name: 'Passive Ability', description: 'Always active', featureType: 'CLASS' },
      ],
    });
    const result = mapClassResponseToCardData(response);

    expect(result.features![0].tags).toBeUndefined();
  });

  it('should handle class with no features', () => {
    const response = buildClassResponse({ hopeFeatures: [], classFeatures: [] });
    const result = mapClassResponseToCardData(response);

    expect(result.features).toBeUndefined();
  });
});
