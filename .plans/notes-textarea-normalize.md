# Notes Textarea Normalization Plan

## Verdict

**Not OK as-is — normalize recommended.**

The notes textarea at `src/app/features/character-sheet/character-sheet-notes.css:76-108` is the only writable text surface in the app that uses pure `#ffffff` against the warm-tavern palette. Every other textarea in the codebase (admin card-edit, create-campaign) uses a tinted dark surface with parchment text. The white panel breaks the established design system and is jarring inside the dark `.panel` container that wraps it.

## Design system reference

Two existing precedents for `<textarea>` styling in this codebase:

| Pattern | File | Background | Border | Text |
|---|---|---|---|---|
| **A — create-campaign** | `src/app/features/campaigns/create-campaign/create-campaign.css:105-127` | `rgba(245, 230, 211, 0.04)` (near-transparent parchment) | `rgba(245, 230, 211, 0.12)` | `var(--color-parchment)` |
| **B — admin card-edit** | `src/app/features/admin/card-edit/components/card-edit-field/card-edit-field.css:23-41` | `rgba(26, 20, 18, 0.8)` (solid-ish dark) | `rgba(212, 160, 86, 0.3)` (gold-tinted) | `var(--color-parchment)` |

**Use Pattern B** for the notes textarea. Rationale:
- The notes panel is the only feature where users compose *long-form* prose — readability over many lines matters more than for short admin fields. A more solid dark surface reduces eye strain vs. the very-low-contrast Pattern A.
- Pattern B's gold-tinted border echoes the panel's `rgba(212,160,86,.12)` border, reinforcing the wrapping panel rather than fighting it.
- Pattern B already lives in a panel-like container (the admin card-edit modal), so the visual idiom is proven.

## Accessibility note

Parchment `#f5e6d3` on `rgba(26, 20, 18, 0.8)` (composed over the panel's `rgba(26,20,15,.5)` on the page bg `#1a1412`) yields ~12:1 contrast — well above WCAG AA 4.5:1 for body text. Placeholder at `rgba(245, 230, 211, 0.55)` clears ~7:1, AA-safe for placeholder text.

## Proposed diff

**File:** `src/app/features/character-sheet/character-sheet-notes.css`

```diff
 .notes-textarea {
   display: block;
   width: 100%;
   height: 240px;
   resize: none;
   overflow-y: auto;
   padding: 0.9rem 1rem;
-  background: #ffffff;
-  color: #1a1412;
-  border: 1px solid rgba(212, 160, 86, 0.45);
+  background: rgba(26, 20, 18, 0.8);
+  color: var(--color-parchment);
+  border: 1px solid rgba(212, 160, 86, 0.3);
   border-radius: 4px;
-  box-shadow:
-    inset 0 1px 3px rgba(0, 0, 0, 0.15),
-    0 0 0 1px rgba(0, 0, 0, 0.05);
   font-family: var(--font-body);
   font-size: 0.95rem;
   line-height: 1.55;
   caret-color: var(--color-accent);
   transition: border-color 150ms ease, box-shadow 150ms ease;
 }

 .notes-textarea:focus {
   outline: none;
   border-color: var(--color-accent);
-  box-shadow:
-    inset 0 1px 3px rgba(0, 0, 0, 0.15),
-    0 0 0 3px rgba(212, 160, 86, 0.25);
+  box-shadow: 0 0 0 3px rgba(212, 160, 86, 0.25);
 }

 .notes-textarea::placeholder {
-  color: rgba(45, 36, 31, 0.55);
+  color: rgba(245, 230, 211, 0.55);
   font-style: italic;
 }
```

### What changed and why

1. **Background `#ffffff` → `rgba(26, 20, 18, 0.8)`** — matches Pattern B. The 0.8 alpha lets the panel tone bleed through subtly for cohesion.
2. **Text `#1a1412` → `var(--color-parchment)`** — flips for legibility on dark and uses the canonical token rather than inline hex.
3. **Border `rgba(212, 160, 86, 0.45)` → `rgba(212, 160, 86, 0.3)`** — matches Pattern B; the previous 0.45 was tuned to read against white and is too loud on dark.
4. **Inset shadow removed** — the dark `rgba(0,0,0,0.15)` inset was a "paper depression" effect that only works on a light surface. On a dark surface it vanishes. Pattern B has no inset; dropping it is the normalize-faithful choice.
5. **Placeholder `rgba(45, 36, 31, 0.55)` → `rgba(245, 230, 211, 0.55)`** — the old value was dark text picked for the white bg; it would be invisible on dark. New value is parchment-tinted, mirrors Pattern A.
6. **Focus ring kept at `0 0 0 3px rgba(212, 160, 86, 0.25)`** — slightly chunkier than Pattern B's `0 0 0 2px`, but for a long-form textarea a more prominent focus state is justified. The inset shadow is dropped from the focus state too (consequence of #4).

## Choice points to confirm with user

1. **Focus ring width.** Plan keeps the current 3px gold glow (nicer for a writing surface). Strict-normalize would drop it to 2px to match Pattern B's `box-shadow: 0 0 0 2px rgba(212, 160, 86, 0.2)`. Recommendation: keep 3px.
2. **Background expression.** Plan uses inline `rgba(26, 20, 18, 0.8)` to match Pattern B verbatim. Alternative: introduce a new `--color-surface-input` token in `styles.css:6` and use it here and in card-edit. Recommendation: keep inline rgba — adding a token is a broader refactor and out of scope for "fix the white box."

## Out of scope (intentionally)

- Touching `create-campaign` or `card-edit` textareas — they're already on-system.
- Introducing new design tokens. The current change is purely a values swap.
- Animation/motion changes; existing 150ms ease transitions are fine.

## Validation

After applying:
- `npm run lint:only -- 'src/app/features/character-sheet/**'`
- `npm run test:only -- 'src/app/features/character-sheet/**'`
- `npm run build` (verify the `anyComponentStyle` budget — net change is ~0 bytes; we drop two box-shadow lines and a `box-shadow` property)
- Visual: open notes panel, type, verify focus ring, verify placeholder readable.
