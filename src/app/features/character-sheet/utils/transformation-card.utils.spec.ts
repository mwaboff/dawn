import { describe, it, expect } from 'vitest';
import { isVampireTransformation, isWerewolfTransformation } from './transformation-card.utils';

describe('isVampireTransformation', () => {
  it('should return true for "Vampire"', () => {
    expect(isVampireTransformation('Vampire')).toBe(true);
  });

  it('should match case-insensitively', () => {
    expect(isVampireTransformation('VAMPIRE')).toBe(true);
  });

  it('should ignore surrounding whitespace', () => {
    expect(isVampireTransformation('  Vampire  ')).toBe(true);
  });

  it('should return false for other card names', () => {
    expect(isVampireTransformation('Werewolf')).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isVampireTransformation(undefined)).toBe(false);
  });

  it('should not match a name that merely contains "vampire"', () => {
    expect(isVampireTransformation('Vampire Lord')).toBe(false);
  });
});

describe('isWerewolfTransformation', () => {
  it('should return true for "Werewolf"', () => {
    expect(isWerewolfTransformation('Werewolf')).toBe(true);
  });

  it('should match case-insensitively', () => {
    expect(isWerewolfTransformation('WEREWOLF')).toBe(true);
  });

  it('should ignore surrounding whitespace', () => {
    expect(isWerewolfTransformation('  Werewolf  ')).toBe(true);
  });

  it('should return false for other card names', () => {
    expect(isWerewolfTransformation('Vampire')).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isWerewolfTransformation(undefined)).toBe(false);
  });
});
