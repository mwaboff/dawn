import { describe, it, expect } from 'vitest';
import { isAtLeast, Role } from './role.model';

describe('isAtLeast', () => {
  const roles: Role[] = ['USER', 'MODERATOR', 'ADMIN', 'OWNER'];

  it('should return true when roles are equal', () => {
    for (const role of roles) {
      expect(isAtLeast(role, role)).toBe(true);
    }
  });

  it('should return true when user role is higher', () => {
    expect(isAtLeast('OWNER', 'ADMIN')).toBe(true);
    expect(isAtLeast('OWNER', 'MODERATOR')).toBe(true);
    expect(isAtLeast('OWNER', 'USER')).toBe(true);
    expect(isAtLeast('ADMIN', 'MODERATOR')).toBe(true);
    expect(isAtLeast('ADMIN', 'USER')).toBe(true);
    expect(isAtLeast('MODERATOR', 'USER')).toBe(true);
  });

  it('should return false when user role is lower', () => {
    expect(isAtLeast('USER', 'MODERATOR')).toBe(false);
    expect(isAtLeast('USER', 'ADMIN')).toBe(false);
    expect(isAtLeast('USER', 'OWNER')).toBe(false);
    expect(isAtLeast('MODERATOR', 'ADMIN')).toBe(false);
    expect(isAtLeast('MODERATOR', 'OWNER')).toBe(false);
    expect(isAtLeast('ADMIN', 'OWNER')).toBe(false);
  });
});
