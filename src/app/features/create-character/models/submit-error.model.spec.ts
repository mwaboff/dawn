import { describe, it, expect } from 'vitest';
import { parseSubmitError } from './submit-error.model';

describe('parseSubmitError', () => {
  it('should parse field errors from validation response', () => {
    const err = {
      error: {
        status: 400,
        error: 'Validation Failed',
        fieldErrors: { name: 'Character name is required' },
      },
    };
    const result = parseSubmitError(err);
    expect(result.message).toBe('Validation Failed');
    expect(result.fieldErrors).toEqual({ name: 'Character name is required' });
  });

  it('should parse multiple field errors', () => {
    const err = {
      error: {
        status: 400,
        error: 'Validation Failed',
        fieldErrors: {
          name: 'Character name is required',
          level: 'Level must be at least 1',
        },
      },
    };
    const result = parseSubmitError(err);
    expect(result.fieldErrors).toEqual({
      name: 'Character name is required',
      level: 'Level must be at least 1',
    });
  });

  it('should parse message-based error response', () => {
    const err = { error: { message: 'Unauthorized access' } };
    const result = parseSubmitError(err);
    expect(result.message).toBe('Unauthorized access');
    expect(result.fieldErrors).toBeUndefined();
  });

  it('should parse error string from response', () => {
    const err = { error: { error: 'Internal Server Error' } };
    const result = parseSubmitError(err);
    expect(result.message).toBe('Internal Server Error');
  });

  it('should return fallback for null error body', () => {
    const result = parseSubmitError({ error: null });
    expect(result.message).toBe('Failed to create character. Please try again.');
  });

  it('should return fallback for non-object error', () => {
    const result = parseSubmitError(null);
    expect(result.message).toBe('Failed to create character. Please try again.');
  });

  it('should return fallback for empty error body', () => {
    const result = parseSubmitError({ error: {} });
    expect(result.message).toBe('Failed to create character. Please try again.');
  });

  it('should ignore empty fieldErrors object', () => {
    const err = { error: { error: 'Validation Failed', fieldErrors: {} } };
    const result = parseSubmitError(err);
    expect(result.message).toBe('Validation Failed');
    expect(result.fieldErrors).toBeUndefined();
  });
});
