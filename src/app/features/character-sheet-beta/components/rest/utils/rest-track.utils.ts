/**
 * The two pieces of track math every rest resolver shares.
 *
 * They live here rather than beside the character resolvers because the companion rules
 * (`rest-companion.utils.ts`) need them too, and the character resolvers already import the
 * companion rules -- one shared leaf module is what keeps that from becoming a cycle.
 */

/**
 * Clears up to `amount` from a damage track. Never clears more than is marked and never goes below
 * zero -- the backend deliberately does not enforce `marked <= max`, so this is the only guard.
 *
 * `Infinity` is a legitimate `amount`: it is how "clear all" is expressed without a second function.
 */
export function clearMarked(
  marked: number,
  amount: number,
): { readonly next: number; readonly cleared: number } {
  const cleared = Math.max(0, Math.min(marked, Math.trunc(amount)));
  return { next: marked - cleared, cleared };
}

/** Gains up to `amount`, never past the cap. A value already over the cap is left alone. */
export function gainCapped(
  held: number,
  amount: number,
  cap: number,
): { readonly next: number; readonly gained: number } {
  const next = Math.min(Math.max(cap, held), held + Math.max(0, Math.trunc(amount)));
  return { next, gained: next - held };
}
