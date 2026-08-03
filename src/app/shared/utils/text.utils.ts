export function escapeAndFormatHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped.replace(/\n/g, '<br>');
}

/**
 * `VERY_CLOSE` -> `Very Close`. Backend enums (weapon/attack range, adversary type, environment
 * type, ...) are `SCREAMING_SNAKE_CASE`; the rulebook prints them in title case with a space
 * (`resources/rules/chapters/core-04-adversaries-and-environments.md`), so any UI that surfaces
 * one of these enum values verbatim leaks an implementation detail instead of the printed term.
 *
 * Takes `unknown` (not just `string`) because callers often pull the value out of a loosely-typed
 * `Record<string, unknown>` metadata bag (e.g. `CardData.metadata`) rather than a typed field.
 */
export function titleCase(value: unknown): string {
  if (value == null || value === '') return '';
  return String(value)
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
