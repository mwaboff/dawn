export interface BulkFieldError {
  /** 0-based index of the record within the uploaded array, or null for an object-level error. */
  recordIndex: number | null;
  field: string;
  message: string;
}

/**
 * Parses the backend's bulk validation error response into a flat, ordered list of
 * per-record field errors.
 *
 * The backend (`GlobalExceptionHandler`) returns a `ValidationErrorResponse` with a
 * `fieldErrors: Record<string, string>` map for a failed `@Valid @RequestBody List<T>` bulk
 * request. Depending on which Spring validation path fires, the map keys come in one of two
 * shapes, both confirmed by reading `GlobalExceptionHandler.java`:
 *   - `"list[2].name"` -- `MethodArgumentNotValidException` (Bean Validation container cascade)
 *   - `"[2].name"`      -- `HandlerMethodValidationException` (Spring 6.1+ method validation)
 * Both encode the same information: a 0-based record index and a field name. This parser
 * accepts either shape via one regex rather than assuming a single format, since the two
 * handlers are both live code paths in this codebase and there is no existing backend test
 * pinning down which one actually fires for a given bulk endpoint.
 *
 * Keys that don't match either shape (e.g. an object-level error not tied to one record) are
 * preserved with `recordIndex: null` rather than dropped, so no backend-reported error is ever
 * silently discarded.
 */
export function parseBulkFieldErrors(fieldErrors: Record<string, string>): BulkFieldError[] {
  const entries: BulkFieldError[] = Object.entries(fieldErrors).map(([key, message]) => {
    const match = key.match(/^\w*\[(\d+)]\.(.+)$/);
    return match
      ? { recordIndex: Number(match[1]), field: match[2], message }
      : { recordIndex: null, field: key, message };
  });

  return entries.sort((a, b) => {
    if (a.recordIndex === null && b.recordIndex === null) return 0;
    if (a.recordIndex === null) return 1;
    if (b.recordIndex === null) return -1;
    return a.recordIndex - b.recordIndex;
  });
}
