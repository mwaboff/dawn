# Accessibility & Display Preferences Overhaul — Plan (v2, post-adversarial-review)

Status: APPROVED FOR IMPLEMENTATION. v1 was adversarially reviewed (Opus, 2026-08-01);
three blockers and six needs-change findings are folded in below. Implementers: sections
marked ⚠ are review findings — do not regress them.

## Goals

1. **Fix the accessible baseline for everyone** — contrast (175 computed AA failures),
   reduced motion, focus visibility, dialog keyboard behavior, semantics — while
   preserving the warm-tavern aesthetic.
2. **Raise text size where it aids reading** (prose, labels-as-content, buttons, inputs,
   table body, hints) — NOT uniformly. ⚠ WCAG has no minimum font size; the binding
   requirements are 200% zoom without clipping (1.4.4) and text-spacing tolerance
   (1.4.12). Blanket size increases consume the headroom those need. Decorative
   tracked-uppercase Cinzel micro-labels keep `--text-xs` and get **contrast** fixes.
3. **Display preferences page** (`/preferences`), localStorage only:
   density `comfortable` (default) / `condensed`; motion `system` (default) /
   `reduced` / `full`.
4. **Consolidate duplicated CSS** where low-risk (expandable-card, feature-row,
   byte-identical copies, form-* collisions).
5. Fix the two screenshot bugs (long-name overlap; COMBO DIE overflow).

## Locked design decisions

| Decision | Why |
|---|---|
| Comfortable default; condensed changes spacing/heights only, never font sizes | Cloudscape/Primer/Material convention; halves test matrix |
| ⚠ Global shared classes (`.panel`, `.btn`, `.form-*`) condense **everywhere**, including non-migrated pages | Reviewer showed "non-migrated surfaces don't condense" was false — globals propagate. More coverage, consistent seams |
| No font-size picker; rem everywhere | W3C: browser zoom is the tool; our job is not clipping at 200% |
| `data-density`/`data-motion` attrs on `<html>`, token remap under `:root[data-…]`; inline pre-paint script in `index.html`; service reads DOM attr at startup | Pre-paint, no specificity fight, no storage/DOM divergence |
| ⚠ Overlay condensation exemption keys on **component classes** (dialog shells/backdrops), not `[role='alert']`/`[role='menu']` | `role="alert"` here is inline errors; D1 deletes `role="menu"` from navbar — role-keyed selectors are wrong or fragile |
| Motion three-state via `--motion` token; `prefers-reduced-motion` honored by default | Media query is two-state |
| Minimum-shift colors: property-scoped floors, per-usage parchment ink edits, two hue lifts, dark ink on gold fills | The soul is lost through *blanket* mechanisms, not scoped ones |
| `ExpandableCardList` deleted (verified: zero external references) | Michael 2026-08-01; HF panels set the global-CSS pattern |
| Equipment-card markup adoption stays out of scope → bd issue | Medium-risk; CSS still consolidates |
| The three `16px` input rules keep px | Real reason (⚠ fix the comments): a user with a *smaller browser default* would drop below 16px and re-trigger iOS zoom. Note `dice-roller.css:33` is a result line, not an input — migrate it normally |
| `features/dashboard/` is unrouted dead code — bd issue to delete; no migration effort | Arch recon; project rule "deleting is a feature" |

## Token design (Phase A)

### Type scale

```css
--text-xs:   0.75rem;   /* 12px HARD FLOOR — tracked-uppercase eyebrows/badges ONLY */
--text-sm:   0.875rem;  /* 14px — secondary content: hints, meta, table cells, tags */
--text-base: 1rem;      /* 16px — body, inputs, buttons */
--text-md:   1.125rem;  --text-lg: 1.25rem;  --text-xl: 1.5rem;  --text-2xl: 2rem;
```

⚠ **Migration rule (inverted from v1):** migrate *up* only text read as prose or content —
body copy, descriptions, hints, empty states, table **body** cells, inputs, buttons,
links, card descriptions, step instructions. Tracked-uppercase display-font micro-labels
(`.shield__label`, `.panel__title`, eyebrows, trait names, table headers, badge/type
labels) map to `--text-xs`/existing size **unchanged** — their fix is contrast.
Sub-12px content text (the typography audit's worst-offender list) still rises to
`--text-sm`: ancestry banner copy, adversary stat labels, wizard `marker-label`s,
subclass tab badges, inventory confirm buttons, party vitals, 0.6rem chips.

⚠ **Per-agent hard gate:** no font-size increase on any rule whose container has a px
`width`, a px grid track, `table-layout: fixed`, or `white-space: nowrap` — unless the
same commit removes that constraint. Known constraint fixes (do these, they're 1.4.4/
1.4.12 wins regardless):
- `user-edit-identity-panel.css:73-88` — `grid-template-columns: 130px 1fr auto` →
  `minmax(130px, auto) 1fr auto`.
- `card-table.css:10,34-50` — keep header labels at current size (they're
  tracked-uppercase); body cells may rise; widen the 4rem/4.5rem tracks only if needed.
- `tab-nav.css:180` — `overflow-x: visible` → `auto` at the ≥900px media query
  (mirror check `level-up-tab-nav.css:125-130`).
- Remove `white-space: nowrap` from flex children lacking `min-width: 0` where labels
  are content (not the shields — see below).

### Screenshot bug fixes

⚠ **Shields** (`character-sheet.css:37-40`): labels stay `--text-xs` + `nowrap`; add
`min-width: 72px` (keep `width: 72px` → change to min-width so all five stay uniform);
**rename the two long labels in `character-sheet.html:74,82`: "Combo Die" → "Combo",
"Patron Die" → "Patron"** (the d4/d6 value beneath conveys die-ness). No two-line
badges, no per-badge widths.

⚠ **Long names** (`character-sheet.css:20-24`, `character-sheet-layout.css:92`) — three
pure-CSS changes, no template logic:
1. `.sheet-header { flex-wrap: wrap; }` and `.sheet-header__stats { flex-wrap: wrap; }`
   so stats drop below a long name instead of being painted over.
2. Column-stack breakpoint moves 480px → 768px.
3. `.sheet-header__identity { container-type: inline-size; }` and
   `.sheet-name { font-size: clamp(1.75rem, 11cqi, 3.5rem); }` — sizes to actual
   available width. Keep `overflow-wrap: anywhere` as backstop only.

### Spacing & density tokens

As v1 (`--space-*`, `--control-min-h` 2.25rem→1.75rem condensed, `--panel-pad`,
`--row-gap`), plus: Phase A migrates the shared global styles onto them (so density
reaches every page through `.panel`/`.btn`/`.form-*`), C agents migrate the dense
feature surfaces (character sheet, GM screen, reference, campaign). Overlay exemption
resets tokens inside the dialog-shell classes of `confirm-dialog`, `add-expansion-dialog`,
`refine-sheet` (note: `dice-roller` popover intentionally NOT exempted — it may condense).

### Color & contrast (property-scoped, from computed ratios)

⚠ **Alpha floors apply to `color:` declarations ONLY — never a colour-literal
search-and-replace** (697 literal occurrences; 473 are borders/backgrounds/gradients/
shadows that must not change; shimmer stops at 0.06 would become a strobe). Within the
107 `color:` rules, split:
- **Informational text** → floors: gold ≥ 0.75, parchment ≥ 0.55 (≥ 0.82 gold on
  gold-tinted chips). Includes empty states, hints, counts, placeholders
  (`styles.css:191` opacity 0.35 → 0.55), disabled buttons that remain readable.
- **Decorative glyphs stay put**: `aria-hidden` separators (` · `, ` / ` at
  `roster.css:59`, `campaigns.css:71`, `character-sheet.css:28`, `campaign-character-list.css:78`),
  chevrons, drag grips (`gm-panel-card.css:15`), ★/◆ ornaments. They carry no
  information; brightening them inverts visual hierarchy.
- ⚠ `--tab-*` ramp (`reference.css:218-227`): re-space to 0.85 / 0.70 / 0.55 —
  do NOT floor all three to the same value (state distinction is itself a11y).
- ⚠ `.card__type-badge` (`daggerheart-card.css:53`): stays a watermark — do NOT delete
  `opacity: .75`. Instead darken the card gradient's light stop so the composited badge
  and `.card__subtitle`/`.card__tag` text pass on it.
- Hue lifts: `--color-card-weapon #c75050 → #d17070`,
  `--color-card-environment #7a6fd4 → #8b82da`; active meta-badge ink → opaque `#1a1412`.
- One-off worst offenders (1.5–2.6:1 list from the contrast audit): each set to its
  computed minimum passing value.

⚠ **Parchment flows (per-usage edits, NOT a token swap** — `--color-gold` etc. are
undefined; every `var(--color-gold, #d4a056)` resolves to its fallback):
- Gold **text** on parchment → `#8b5e34` (`--color-accent-ink`, added as a real token),
  edited rule-by-rule (54 rules, 20 files).
- Gold **borders, edges, fills stay gold**: the `.parchment-container` 2px gold
  border-top, substep-tab fills, hint left-rules are the pages' signature.
- ⚠ Split combined declarations first: six rules set text+border in one block
  (`review-section.css:192-193`, `advancement-config.css:25`, `advancements-step.css:33-37`,
  hover rules in `equipment-selector.css:37`, `experience-selector.css:125-127`,
  `trait-selector.css:95-97`) — text goes ink, border stays gold.
- Solid-gold buttons with light text (`ancestry-selector.css:83-96`,
  `review-section.css:161-174`, `martial-stance-step.css:33-37`) → **converge on
  `.btn--primary`** (already dark-ink-on-gold-gradient, already passing).
- ⚠ Dropped from v1: `.selection-badge.complete` is green and passes — leave it.
  (Its color-scheme unification with martial-stance-step's gold variant still happens —
  pick the **green** scheme or restyle both, C2's call, just keep contrast passing.)

### Motion & focus (Phase A globals)

⚠ **Corrected reduced-motion block** (v1's `opacity:1; transform:none !important` was a
blocker: it broke static transforms — Hope-pip diamonds, nav underline scaleX(0) off-state,
CDK drag inline transforms, nine chevron rotations — and opacity:1 would put the fixed
`.grain-overlay` at full opacity over the whole UI and erase disabled/locked dimming):

```css
@media (prefers-reduced-motion: reduce) { :root { --motion: 0; } }
:root[data-motion='reduced'] { --motion: 0; }
:root[data-motion='full']    { --motion: 1; }

/* entrance animations end on `forwards` frames, so near-zero duration + zero delay
   lands them instantly; no opacity/transform overrides — they'd break static styles */
@media (prefers-reduced-motion: reduce) {
  :root:not([data-motion='full']) *, :root:not([data-motion='full']) *::before,
  :root:not([data-motion='full']) *::after {
    animation-duration: .01ms !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
:root[data-motion='reduced'] *, :root[data-motion='reduced'] *::before,
:root[data-motion='reduced'] *::after { /* same block, for explicit user choice */
  animation-duration: .01ms !important; animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: .01ms !important; transition-delay: 0s !important;
}
```

- ⚠ JS smooth-scroll needs a guard: `tab-nav.ts:108` and `level-up-tab-nav.ts:100` pass
  `{behavior:'smooth'}` which beats CSS. Use a shared `prefersReducedMotion()` util (or
  the preferences service's effective-motion signal) → `'auto'`; update the specs that
  assert the literal argument (`tab-nav.spec.ts:573,598,623`).
- `.sr-only` global + skip link to `<main id="main-content">`; delete the two local copies.
- ⚠ **Focus rings — one indicator per element.** There are 23 `outline: none` sites, most
  paired with a compensating box-shadow ring. Do NOT blanket-extend the global ring to
  inputs while those exist (triple-ring). Per-site: if a box-shadow ring exists, keep
  `outline:none` and raise the ring's alpha to ≥3:1 (1.4.11); if nothing exists (navbar
  items `navbar.css:151-157,220-226`, codex search bar, campaign-summary), remove
  `outline:none` so the global `:where()` ring applies. `styles.css:184`
  (`.form-input:focus { outline:none }`) must be resolved in Phase A — it beats the
  `:where()` ring at normal specificity and would silently no-op the whole effort.
- `prefers-contrast: more`: raise informational muted-text alphas to ≥0.85.

## Phases, ownership, sequencing

Branch `a11y-preferences` off `main`. Implementers on **Sonnet**. Quality gate per phase:
`npm run lint && npm run test:run && npm run build` all green. bd: epic + issue per phase.

⚠ **Sequencing fix from review: D1/D2 run AFTER C1–C5** (v1's "parallel" had 23 file
collisions — D2 touches templates in every C directory).

```
A (foundation) ──► B (preferences feature) ─┐
              └──► C1..C5 (parallel, disjoint dirs) ──► D1 + D2 (parallel) ──► E (review/QA)
```

**Exclusive ownership map** (an agent may not touch files outside its set):
- **A**: `src/styles.css`, ALL of `src/app/shared/styles/*` (incl. the `.form-*`
  consolidation — pick the canonical label/input/error sizes here), `src/index.html`,
  `src/app/app.html`/`app.css` (skip link, main id).
- **B**: `core/services/preferences.service.*`, `shared/models/preferences.model.ts`,
  `features/preferences/**`, `app.routes.ts` (+spec) route entry, `layout/navbar/*`
  (links in desktop user menu, mobile drawer, logged-out branches).
- **C1**: `features/character-sheet/**` (incl. deleting `expandable-card-list/`;
  shield rename; header wrap/container-query; feature-row block moves INTO the global
  file — coordinate: A leaves a `/* C1 appends here */` marker; C1 is the only C agent
  allowed to append to `shared/styles/expandable-card.css`).
- **C2**: `features/create-character/**`, `features/level-up/**`, `features/level-down/**`,
  `features/choose-username/**`.
- **C3**: `features/gm-screen/**`, `features/reference/**` (incl. `result-section.css`
  `:root` bug), `features/campaign/**`, `features/campaign-join/**`, `features/campaigns/**`.
- **C4**: `features/admin/**` (delete redundant local `.form-*` copies against A's
  canonical globals — A finishes first, so the diff is visible), `features/auth/**`,
  `features/home/**`, `features/profile/**` (screenshot-first rule for
  `subclass-path-edit` / `home.css` global-classname redeclarations).
- **C5**: `shared/components/**` (daggerheart-card gradient darkening, adversary-card,
  card-selection-grid, card-skeleton, confirm-dialog CSS, error-page, pagination-controls,
  subclass-path-selector incl. the 1.51:1 "Owned" badge, dice-roller px-island rewrite
  incl. its `.sr-only` deletion), `layout/footer/**`.
- **D1** (after C): focus-trap directive extracted from `refine-sheet` →
  `shared/directives/`; apply to `confirm-dialog`, `add-expansion-dialog`; dice-roller
  Escape; navbar focus-return + drop `role="menu"`; arrow-key tabs for `tab-nav`,
  `level-up-tab-nav`, `inventory-section` (pattern from `type-facet-tabs`); the
  scroll-behavior JS guard + spec updates.
- **D2** (after C): nested `<main>` removal (5 templates); `<h1>` fixes; heading-skip;
  route `title`s + `TitleStrategy` (`app.routes.ts` — B is long done); form
  `required`/`aria-invalid`/`aria-describedby`/`role=alert` standardization (~12 files);
  unlabeled inputs; burden-icon sr-only text; `role` misuse fixes; `aria-hidden`
  stragglers; table captions.
- **E**: fresh code-review agents over the full diff (findings verified before fixes);
  gates green; QA checklist handed to Michael (he runs the server); bd close/file
  (equipment-card adoption, dashboard deletion, remaining spacing migration); push; PR.

## Risk register (residual, post-amendment)

1. Prose-size increases can still wrap in untested spots — C agents apply the hard gate
   above; E review greps the diff for size increases adjacent to fixed dimensions.
2. Alpha floors brighten ~13 empty-state/hint rules noticeably — accepted; they are
   informational. Decorative set excluded.
3. Parchment ink swap changes emphasis color on creation flows — accepted (screenshots
   for Michael in QA); borders/fills keep gold so the signature remains.
4. Global-class condensation reaches unmigrated pages — accepted deliberately; seams are
   *between* token and non-token spacing within a page; E review spot-checks dashboardless
   top pages in condensed mode.
5. Focus-ring per-site audit is judgment work — D1 owns final pass; acceptance: every
   interactive element has exactly one visible ≥3:1 indicator.
6. Container queries (`cqi`) — supported in all evergreen browsers since 2023; no
   fallback needed beyond the clamp bounds.
