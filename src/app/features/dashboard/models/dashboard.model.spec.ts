import { describe, it, expect } from 'vitest';
import { DASHBOARD_PREVIEW_LIMIT } from './dashboard.model';

describe('dashboard.model constants', () => {
  it('DASHBOARD_PREVIEW_LIMIT is 5', () => {
    expect(DASHBOARD_PREVIEW_LIMIT).toBe(5);
  });
});
