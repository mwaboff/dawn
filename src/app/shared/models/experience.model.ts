export interface Experience {
  name: string;
  modifier: number | null;
}

export const DEFAULT_EXPERIENCE_COUNT = 2;
export const DEFAULT_EXPERIENCE_MODIFIER = 2;
export const MAX_EXPERIENCE_COUNT = 5;
export const MIN_EXPERIENCE_COUNT = 1;
export const MAX_EXPERIENCE_NAME_LENGTH = 50;
export const MIN_EXPERIENCE_MODIFIER = -5;
export const MAX_EXPERIENCE_MODIFIER = 5;
export const EXPERIENCE_NAME_PATTERN = /^[a-zA-Z0-9 '-]*$/;

export function createEmptyExperience(): Experience {
  return { name: '', modifier: null };
}

export function createDefaultExperiences(): Experience[] {
  return Array.from({ length: DEFAULT_EXPERIENCE_COUNT }, () => createEmptyExperience());
}

export function isExperienceComplete(exp: Experience): boolean {
  return exp.name.trim().length > 0 && exp.modifier !== null;
}

export function sanitizeExperienceName(name: string): string {
  return name.replace(/[^a-zA-Z0-9 '-]/g, '').slice(0, MAX_EXPERIENCE_NAME_LENGTH);
}

export function clampModifier(value: number): number {
  return Math.max(MIN_EXPERIENCE_MODIFIER, Math.min(MAX_EXPERIENCE_MODIFIER, value));
}
