/**
 * Orderings the item list endpoints accept, mirroring the backend `ItemSort` enum.
 *
 * The API defaults to `ID`, which is insertion order. That is rarely useful to a person:
 * official content occupies the low ids, so anything a user creates sorts to the very end.
 * Lists people read — pickers, the codex — should ask for `NAME`.
 */
export type ItemSort = 'ID' | 'NAME' | 'TIER' | 'NEWEST';
