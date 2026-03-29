export interface SubmitError {
  message: string;
  fieldErrors?: Record<string, string>;
}

export function parseSubmitError(err: unknown): SubmitError {
  const httpError = err as { error?: Record<string, unknown> };
  const body = httpError?.error;

  if (!body || typeof body !== 'object') {
    return { message: 'Failed to create character. Please try again.' };
  }

  const fieldErrors = body['fieldErrors'] as Record<string, string> | undefined;
  if (fieldErrors && typeof fieldErrors === 'object' && Object.keys(fieldErrors).length > 0) {
    return {
      message: (body['error'] as string) ?? 'Validation Failed',
      fieldErrors,
    };
  }

  if (typeof body['message'] === 'string') {
    return { message: body['message'] };
  }

  if (typeof body['error'] === 'string') {
    return { message: body['error'] };
  }

  return { message: 'Failed to create character. Please try again.' };
}
