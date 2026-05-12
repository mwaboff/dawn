# CSS Consolidation Plan — Reduce Per-Component Stylesheet Redundancy

**Path**: `.plans/css-consolidation.md`
**Goal**: Reduce per-component CSS sizes (≥22 component CSS files currently exceed the 4kB `anyComponentStyle` warning; 2 exceed the 8kB error) by **structurally extracting** duplicated rules to globally-loaded shared stylesheets. **Zero intentional visible changes anywhere.**

---

## Context

`angular.json` sets `anyComponentStyle: { maximumWarning: 4kB, maximumError: 8kB }`. Current state, sorted by component CSS file size:

| Bytes | File | Notes |
| ----- | ---- | ----- |
| 9752 | `admin/card-edit/components/card-edit-features/card-edit-features.css` | **OVER 8kB ERROR** |
| 9312 | `character-sheet/character-sheet-layout.css` | **OVER 8kB ERROR** |
| 6566 | `admin/subclass-path-edit/subclass-path-edit.css` | over 4kB warning |
| 6487 | `layout/navbar/navbar.css` | over 4kB warning |
| 6055 | `profile/components/roster-list/roster-list.css` | over 4kB warning |
| 5746 | `shared/components/dice-roller/dice-roller.css` | over 4kB warning |
| 5683 | `profile/components/campaign-roster/campaign-roster.css` | over 4kB warning |
| 5635 | `features/home/home.css` | over 4kB warning |
| 5580 | `features/character-sheet/character-sheet.css` | over 4kB warning |
| 5489 | `features/campaigns/campaigns.css` | over 4kB warning |
| ... | (12 more over 4kB) |  |

Already present global infrastructure (`src/styles.css`, loaded via `angular.json > styles`):
- Tokens: `--color-bg-dark`, `--color-accent`, `--color-parchment`, `--font-display`, `--font-body`, etc.
- Classes: `.panel`, `.panel__title`, `.resource-row*`, `.resource-box*`, `.empty-state`, `.grain-overlay`, `.vignette-overlay`, `.decorative-ornament`, `.form-group`, `.form-label`, `.form-input`, `.form-error`, `.field-error`, `.input-error`.
- Keyframes: `fadeIn`, `fadeInUp`, `shimmer`.

Already present shared stylesheet (`src/app/shared/styles/auth-page.css`, imported via `@import` from auth.css and choose-username.css — **NOT** global): `.auth-container`, `.auth-ornament-*`, `.auth-card`, `.auth-title`, `.auth-subtitle`, `.auth-submit`.

---

## Key Architectural Facts (verified, not assumed)

1. **`src/styles.css` is the only entry in `angular.json > styles`**, so anything added to it (or `@import`ed from it) is globally available, un-encapsulated, and applies to all component templates without per-component imports.

2. **Angular's emulated view encapsulation** rewrites component-scoped selectors with `[_ngcontent-xxx]` attributes. Specificity: `.btn--primary[_ngcontent-xxx]` (component scope, 0,2,0) **beats** `.btn--primary` (global, 0,1,0). **Consequence**: simply adding a global rule is not enough — the duplicate component-scoped rule *must* be deleted from the component CSS file, or the per-component version still wins.

3. **Token replacement (`#d4a056` → `var(--color-accent)`) does not shrink budgets.** It *adds* bytes (`var(--color-accent)` is 19 chars vs. 7 for `#d4a056`). It's a maintenance improvement, deferred to a later, optional phase.

4. **Roster files diff is ~30 lines.** `diff -u campaign-roster.css roster-list.css` shows them as functionally near-identical: only `.roster-level` and `.roster-pronouns` (in roster-list) vs `.roster-badge` (in campaign-roster) plus a `.campaign-roster` → `.roster` container-class rename. Everything else (entry, character-name, class, arrow, footer, skeleton, keyframes, delete button, inline confirm) is identical bytes.

5. **`.btn--primary` exists in 5 admin component CSS files** (`user-edit-toolbar`, `card-edit-toolbar`, `card-edit`, `subclass-path-edit`, `bulk-upload`) — same intent, near-identical code, single template idiom across the app.

6. **`.form-input` is component-redefined in 7+ files** (`character-form`, `card-edit`, `add-expansion-dialog`, `create-campaign`, `user-edit-identity-panel`, `card-edit-features` (twice, including `.form-input-sm`)) even though styles.css already defines it. Each redefinition has *slightly* different padding/border-radius — these are the "near-identical but not" cases the advisor flagged.

7. **Local `@keyframes fadeIn` / `fadeInUp` redeclarations** in 6 files (`campaigns.css`, `campaign.css`, `home.css`, `campaign-join.css`, `campaign-summary.css`, `create-campaign.css`) shadow the global versions. Deleting them is byte-identical visual outcome (component-scoped `@keyframes` are namespaced, but the rule definitions are dead-duplicate of the global one).

8. **Skeleton pulse keyframes** (`rosterPulse`, `campaignPulse`, `campaignsPulse`, `skeletonPulse`, `pickerPulse`) are all `0%,100% { opacity: 0.4 } 50% { opacity: 0.7 }`. One global definition replaces five.

---

## Strategy: Structural Extraction in Slices

Each slice is **independently shippable**. After each slice: `npm run build`, `npm run test:run`, `npm run lint`, then eyeball-test affected routes in the dev server.

### Slice 1 — Shared style scaffold (foundation, no visual change)

Create a `src/app/shared/styles/` directory of namespaced shared stylesheets, and `@import` them from `src/styles.css` so they ship globally (un-encapsulated).

**Add to `src/styles.css` (at the top of file, after the font/tailwind imports):**
```css
@import "./app/shared/styles/buttons.css";
@import "./app/shared/styles/forms.css";
@import "./app/shared/styles/roster.css";
@import "./app/shared/styles/inline-confirm.css";
@import "./app/shared/styles/skeleton.css";
```

Create each empty file as a placeholder; subsequent slices fill them. This first commit only adds the imports + empty files — pure setup, zero behavioral change. Allows the rest of the slices to be reviewed independently.

**Verification**: `npm run build` succeeds. No new CSS rules are active yet.

**Fallback path**: Tailwind v4 (`@tailwindcss/postcss`) may treat `@import` of project-local files differently than standard CSS imports. If the build fails to resolve them, switch to registering the shared stylesheets directly in `angular.json > projects.dawn.architect.build.options.styles`:
```json
"styles": [
  "src/styles.css",
  "src/app/shared/styles/buttons.css",
  "src/app/shared/styles/forms.css",
  "src/app/shared/styles/roster.css",
  "src/app/shared/styles/inline-confirm.css",
  "src/app/shared/styles/skeleton.css"
]
```
Either approach lands the rules in the global, un-encapsulated bundle — pick whichever the build accepts.

---

### Slice 2 — Roster pattern extraction (highest-confidence win)

**What**: `campaign-roster.css` (5683 B) and `roster-list.css` (6055 B) share ~180 lines of byte-identical code (entry layout, character name, class label, arrow, footer, empty state, create button, message, loading, skeleton, keyframes, delete button, inline confirm pattern). Extract these to `src/app/shared/styles/roster.css`. Keep only the **truly different parts** as component-scoped:
- `campaign-roster.css` keeps: `.campaign-roster` (animation container — rename to use shared `.roster-animated`) + `.roster-badge` (campaign-specific) + that file's `@media` block delta.
- `roster-list.css` keeps: `.roster` (animation container, same shared name) + `.roster-level` + `.roster-pronouns` + that file's `@media` block delta.

**Concrete extraction list (rules with byte-identical bodies in both files, move to shared/styles/roster.css):**
- `.roster-list`
- `.roster-entry` and all its `:first-child` / `:last-child` / `:hover` / `:focus-visible` / `:hover .roster-arrow` rules
- `.roster-info`, `.roster-name-row`
- `.roster-character-name`
- `.roster-class`, `.roster-class-subclass`, `.roster-class-sep`
- `.roster-arrow`
- `.roster-footer`
- `.roster-add-link` + `:hover` + `:focus-visible`
- `.roster-empty`, `.roster-empty-text`
- `.roster-create-btn` + `:hover` + `:focus-visible`
- `.roster-message`, `.roster-message p`
- `.roster-loading`, `.roster-skeleton`, `.roster-skeleton:nth-child(2)`
- `.roster-delete-btn` + all states
- `.roster-inline-confirm`, `.roster-inline-confirm-text`
- `.roster-inline-confirm-btn`, `.roster-inline-cancel-btn` + all states *(also overlaps with Slice 5 — keep here, since these are roster-specific labelled red-themed inline buttons)*
- `@keyframes rosterFade`, `@keyframes rosterPulse`
- The `@media (max-width: 640px)` rules whose bodies are identical (`.roster-entry`, `.roster-empty`)

**Container animation harmonization**: Both files use the `rosterFade` animation but apply it via different selectors (`.campaign-roster` vs `.roster`). Two options:

> **DECISION POINT (zero visual change requirement)**: Choose ONE:
> - **Option A**: rename both container selectors to a shared `.roster-animated` class, applied in both templates. Templates touch 1 line each. Cleanest.
> - **Option B**: keep both container class names and emit two selectors in the shared rule: `.campaign-roster, .roster { ... }`. No template change.
>
> *Recommended: Option B (zero template churn for slice-2 ship; cosmetic cleanup later).*

**Expected outcome**:
- `roster.css` shared file: ~165 lines / ~4500 B (global, contributes to initial bundle budget, NOT anyComponentStyle).
- `campaign-roster.css`: shrinks from 5683 → ~700 B (only `.roster-badge` + container class + media delta).
- `roster-list.css`: shrinks from 6055 → ~900 B (only `.roster-level`, `.roster-pronouns`, container class, media delta).
- **Both files clear the 4kB warning.**

**Template diff (Option B)**: Zero changes to `.html` or `.ts`. Both class names continue to exist; `:host` declarations stay.

**Risk**: Selector specificity. Currently `.roster-entry` in `campaign-roster.css` is rewritten to `.roster-entry[_ngcontent-XYZ]`. After moving to global, the un-encapsulated `.roster-entry` selector wins because there is no longer a component-scoped competing rule. Verify no other component defines a colliding `.roster-entry` class (grep before shipping: `grep -rn "\.roster-entry" src --include=*.css`).

**Tests**: Run `npm run test:only -- 'src/app/features/profile/'` and `npm run test:run`. Visually inspect: `/profile`, `/campaigns`, `/campaign/<id>` if applicable.

---

### Slice 2b — Extract `<app-inline-delete-confirm>` and `<app-roster-entry>` components

**Why this slice exists**: The roster duplication is not just visual — `roster-list.ts` and `campaign-roster.ts` are 62 lines each, structurally identical: same `pendingDeleteId` / `confirmingDeleteId` / `deletingId` signals and six handler methods (`onDeleteClick`, `onInlineConfirm`, `onInlineCancel`, `onConfirmDelete`, `onCancelDelete`, `resetDeleteState`). Slice 2 alone fixes the CSS symptom; this slice fixes the cause by extracting the duplicated stateful UX as a shared component, per the project's `component-design.md` rule: "Extract a child component when the same markup block appears in 2+ places."

**Two components to extract**:

1. **`<app-inline-delete-confirm>`** at `src/app/shared/components/inline-delete-confirm/`
   - Owns the pending/confirming/deleting state machine.
   - Inputs: `confirmLabel` (default "Delete?"), `disabled`.
   - Outputs: `confirmed: EventEmitter<void>` (fires only after user clicks the final confirm).
   - Renders: the trash-icon button (idle), the "Delete? Yes/No" inline confirm pair (pending), and a disabled "Deleting…" state (confirming). Markup matches current roster-inline-confirm-*.
   - Styles: scoped, ~50 lines (move the red-themed inline pair from `shared/styles/roster.css` into this component; Slice 2 should leave the inline-confirm rules OUT of `roster.css` if Slice 2b ships in the same release. If Slice 2 ships first, Slice 2b deletes those rules from `roster.css` when extracting.)
   - Tests: idle→pending state, pending→confirmed emission, cancel resets, disabled prevents interaction (Vitest + TestBed per project rules).

2. **`<app-roster-entry>`** at `src/app/shared/components/roster-entry/`
   - Pure presentational component. Inputs: a discriminated union shape that covers both Character and Campaign rows. Concrete approach: two named inputs `leadingSlot` (`{ kind: 'level', value: number } | { kind: 'badge', text: string }`) + standard fields (`name`, `pronouns?`, `primaryLabel`, `secondaryLabel?`, `arrowVisible`).
   - Outputs: `viewClicked: EventEmitter<void>`, plus `deleteRequested: EventEmitter<void>` (or just delegate to embedded `<app-inline-delete-confirm>`).
   - Renders the full `<li class="roster-entry">` body (level/badge, info column, arrow, delete confirm).
   - Styles: minimal — the `.roster-entry` body lives in shared `roster.css` from Slice 2; this component's CSS is just glue.
   - Tests: input rendering for both kind variants, click emission, integration with inline-delete-confirm.

**Resulting `RosterList` and `CampaignRoster`**:
After Slice 2b, both files drop from 62 lines to ~25 lines each: a `@for` over their entity array, mapping each to an `<app-roster-entry>` with the appropriate leadingSlot, name, etc. The duplicated state machine vanishes. Their `.html` files shrink correspondingly (the entry markup moves into the new component template). Their `.css` files become ~0 lines (everything is either in `shared/styles/roster.css` or in the extracted components).

**Decision point — generic vs. two row components?**

> - **Option A**: Single `<app-roster-entry>` with a discriminated input that covers both shapes. *One component, slightly more complex inputs.* **Recommended.**
> - **Option B**: Two components, `<app-character-roster-entry>` and `<app-campaign-roster-entry>`. Slightly more code, no shared abstraction, but each is dead-simple.
>
> *Default: A.*

**Order vs. Slice 2**: Slice 2 can ship first (pure CSS, no template/TS change) and Slice 2b can follow as a separate PR. Doing them back-to-back keeps the inline-confirm CSS from briefly living in `roster.css` and then moving to the new component — but the two-PR sequence is cleaner to review. **Recommend: ship Slice 2 first, then 2b.**

**Templates touched**: `roster-list.html`, `campaign-roster.html` (full rewrite — they're small), plus 2 new component templates.

**Tests**: New `.spec.ts` for both components. Update existing `RosterList`/`CampaignRoster` specs: per project rules, they now only verify the child component is rendered with correct inputs — not feature rendering details.

**Expected outcome**:
- `roster-list.ts` 62 → ~25 lines, `roster-list.html` simplified, `roster-list.css` deleted (or `:host { display: block }` only).
- `campaign-roster.ts` 62 → ~25 lines, same for HTML/CSS.
- Two new shared components, each well under 4 KB CSS budget.
- Future reuse: any future "list of entities with optional inline delete" feature reuses these directly.

**Risk**: Visual regression on the delete confirm flow. Mitigation: keep the inline-confirm CSS bytes byte-identical when moving from `roster.css` to the component's scoped CSS — only the encapsulation context changes, not the rule bodies. Smoke-test the delete flow on `/profile` and `/campaigns`.

---

### Slice 3 — Button system promotion

**What**: A `.btn` base + `.btn--primary` / `.btn--secondary` / `.btn--sm` / `.btn--danger` / `.btn--danger-ghost` system is already cleanly written in `admin/card-edit/components/card-edit-toolbar/card-edit-toolbar.css` (lines 28-108). Promote it to `src/app/shared/styles/buttons.css` and **delete the duplicate definitions** from these files:

| File | Duplicate lines to remove |
| ---- | ------------------------- |
| `admin/card-edit/components/card-edit-toolbar/card-edit-toolbar.css` | 28-108 (the canonical) |
| `admin/user-edit/components/user-edit-toolbar/user-edit-toolbar.css` | `.btn--primary` block (~6 lines) |
| `admin/card-edit/card-edit.css` | `.btn--primary` block + `.btn--secondary` if present |
| `admin/subclass-path-edit/subclass-path-edit.css` | `.btn--primary` block |
| `admin/bulk-upload/bulk-upload.css` | `.btn--primary` block |

**Verification of "near-identical"**: Diff each of these blocks against the canonical card-edit-toolbar version. The advisor specifically flagged that different paddings exist — surface differences explicitly:

> **DECISION POINT (potential 1-2px visual shifts)**: After running `grep -A 5 -n "^\.btn--primary" src/app/features/admin/**/*.css`, list any deltas in padding/border-radius/font-size between the 5 definitions. If all five are byte-identical (likely, since they cluster in admin pages), no visible change. If any differ:
> - **Option A (strict zero-change)**: keep each file's variation as a `.btn--primary--card-edit`-style local override that only patches the differing property. Verbose but safe.
> - **Option B (consolidate to one)**: pick the canonical card-edit-toolbar definition, accept a sub-pixel shift in the others. Faster, cleaner — **recommend this if all deltas are ≤2px and there is no design system pinning these sizes**.
>
> *Action: enumerate deltas first, then ask the user before merging if any non-trivial deltas exist.*

**Also flagged** for separate handling (do NOT silently unify):
- `card-edit-features.css` `.btn-add-feature` (0.5rem 1rem, 0.8125rem) — smaller-padded ghost-accent button. **Do not merge with `.btn--secondary`** (0.625rem 1.25rem). Keep as-is for this slice; address in Slice 7 below.
- `auth-page.css` `.auth-submit` — gold gradient submit button overlapping `.btn--primary` intent. Keep separate (different transform, shadow, focus styling).
- `roster-create-btn` — already extracted to shared/styles/roster.css in Slice 2; do not also alias to `.btn--primary` (it has a different idiom).

**Expected outcome**: ~6 files shrink by 60-90 B each (~400 B total cross-component). Most impactful: `card-edit-toolbar.css` drops from 121 lines to ~30 lines (well under 4kB).

**Templates**: No HTML changes (the same class names continue to work, just from global).

**Tests**: `npm run test:only -- 'src/app/features/admin/'` plus visual smoke of `/admin/cards`, `/admin/users`, `/admin/bulk-upload`.

---

### Slice 4 — Form input cleanup

**What**: `styles.css` already has a canonical `.form-input` (lines 122-148). Currently 7+ component CSS files redefine `.form-input` with their own values, **overriding** the global via emulated-encapsulation specificity. This is the slice with the highest "different but similar" risk.

**Approach**:
1. **Audit step**: produce a diff table of the canonical `styles.css` `.form-input` vs each component redefinition. The columns are `padding`, `background`, `border`, `border-radius`, `font-family`, `font-size`, `color`, `transition`, `focus border`, `focus box-shadow`.
2. **Categorize each redefinition**:
   - **Category A — Exact duplicate**: delete component rule. Global wins.
   - **Category B — Trivial drift (≤2px or alpha ≤0.05 difference)**: delete component rule. Accept micro-shift. Verify in dev server.
   - **Category C — Intentional size/density variant**: introduce ONE new modifier in `shared/styles/forms.css`: `.form-input--sm` (currently the most common variation: 0.5-0.625rem padding, 0.8125-0.9375rem font-size). Update the component template to add the modifier class; delete the component CSS rule.
   - **Category D — Truly bespoke** (e.g., `create-campaign` has placeholder color overrides; `add-expansion-dialog` uses `#fffdf8` color): keep the component CSS but trim to only the *delta* properties. Don't redeclare unchanged ones.

3. **Targets** (in order of impact):
   - `card-edit-features.css` lines 213-244 (form-group + form-label + form-input + form-textarea + focus) — biggest single source. Likely Category B.
   - `add-expansion-dialog.css` lines 31-97 — Category D delta only.
   - `card-edit.css` lines 109-133 — Likely Category B.
   - `user-edit-identity-panel.css` lines 38-48 — Category C (smaller padding for inline edit). Add `.form-input--sm`.
   - `create-campaign.css` lines 105-128 — Category D for placeholder; B for the rest.
   - `character-form.css` lines 39-71 — Category B/C; this file's `.invalid` overlaps with global `.input-error`, consider unifying.

4. **Also**: `card-edit-features.css` has `.form-input-sm` (separately defined as `.form-input-sm` not `.form-input--sm` — note the hyphen vs double-hyphen). **Verified template usage**: `card-edit-features.html` lines 88, 99, 131, 136, 141 reference `class="form-input-sm"` (5 occurrences). Decide on BEM:
   - **Option A**: rename to `.form-input--sm` in shared/styles/forms.css AND update the 5 HTML references in one atomic commit.
   - **Option B**: register `.form-input-sm` (no double-hyphen) in shared/styles/forms.css to avoid template churn; accept the BEM inconsistency for now.

   *Recommend Option A — small template diff, gains BEM coherence with `.btn--primary` style.*

**Expected outcome**: `card-edit-features.css` drops ~30 lines (~900 B). `add-expansion-dialog.css` drops ~50 lines (~1500 B → well under 4kB). Cumulative cross-file ~3000-4000 B reduction.

**Risk**: Categorization is judgment work. Per the advisor: surface each delta to the user before deletion. **Sub-decision pattern**: present the user a single AskUserQuestion at the start of Slice 4 with the diff summary, and ask whether to:
- A. Strict zero-change: keep all per-component rules verbatim (no Slice 4 benefit; skip slice).
- B. Trim to deltas only (recommended; matches "intent preserved, no visible change at user-perceptible level").
- C. Aggressive merge (drop all redefinitions; accept sub-pixel and minor color shifts).

> *Recommend: present Option B as default. This delivers ~60% of Slice 4's value with no perceptible change.*

---

### Slice 5 — Inline confirm pattern (red danger pair)

**What**: `feature-inline-confirm-btn` / `feature-inline-cancel-btn` in `card-edit-features.css` (lines 124-150) and `roster-inline-confirm-btn` / `roster-inline-cancel-btn` in both roster files (handled in Slice 2 already for roster) overlap structurally. They're not byte-identical though — roster uses `linear-gradient(135deg, #8b2525, #a33030)` confirm; card-edit-features uses a transparent red-bordered confirm.

**Decision**: These two are different visual idioms (filled red confirm vs ghost red confirm). They don't unify cleanly. **Do not consolidate.** Move on. The roster pair is already moved to `roster.css` in Slice 2; the card-edit-features pair stays in its component file.

> **No code action in this slice**; documented here only to record the decision and avoid revisiting it.

---

### Slice 6 — Global animation keyframe deduplication

**What**:
1. **Delete redundant `@keyframes fadeIn` / `@keyframes fadeInUp` declarations** that duplicate the global versions already in `styles.css`. Files: `campaigns.css:91`, `campaign.css:126`, `home.css:241,246`, `campaign-join.css:108`, `campaign-summary.css:62`, `create-campaign.css:194`. Each redeclaration is ~3-5 lines.

2. **Unify skeleton pulse keyframes** in `shared/styles/skeleton.css`:
   ```css
   @keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
   ```
   - Replace usage of `rosterPulse` (handled in Slice 2 — keep there since roster.css already lives in shared/), `campaignPulse` (campaign.css:131), `campaignsPulse` (campaigns.css:92), `pickerPulse` (campaign-sheet-picker.css:26), `skeletonPulse` (profile.css:175 — leave as-is, already named). Each per-component animation reference (`animation: campaignPulse 1.5s …`) changes to `animation: skeletonPulse 1.5s …`. Delete the local keyframe blocks.

**Caution on component-scoped keyframes**: Angular emulated encapsulation does NOT rewrite `@keyframes` names. So a global `skeletonPulse` is reachable from any component's `animation:` property. Verified safe.

**Expected outcome**: ~50 lines deleted across 6+ files (~1500 B cumulative cross-component, mostly from `home.css` and `campaign.css` since they have both `fadeIn` and `fadeInUp` locally).

**Templates**: No changes.

**Tests**: `npm run test:run`. Visual smoke: load any page that uses fade-in animations (most pages do — auth, home, profile, campaigns, etc.) and confirm animations still play.

---

### Slice 7 — Largest-file targeted dieting (`card-edit-features.css`, `character-sheet-layout.css`)

**What**: These two files are over the 8kB *error* threshold (9752 B and 9312 B respectively). Slice 4 above already trims ~900 B from `card-edit-features.css`. Additional targeted cuts:

**`card-edit-features.css`** (targets: 7000 B after Slice 4 → goal ≤4000 B):
- The two paragraphs of button definitions (`.btn-discard`, `.btn-delete-feature`, `.feature-inline-confirm-btn`, `.feature-inline-cancel-btn`, `.btn-add-feature`, `.btn-add-sub`, `.chip-remove`, `.btn-confirm-sm`) share padding/font/transition/disabled patterns even though their hover states differ. Extract their common base to a single class in `shared/styles/buttons.css`:
  - `.btn-text-ghost` (transparent bg, gold border 0.4, gold accent text, 0.5rem 1rem default padding, Cinzel 0.8125rem, all 0.15s ease transition). Then add variants `.btn-text-ghost--sm`, `.btn-text-ghost--danger`, etc., kept terse.
  - Trade-off: this is the "near-identical but not" zone the advisor warned about. **Surface to user before action**: list the 8 button-like elements and show their padding/size/border-radius matrix. Ask whether to keep all 8 distinct (no slice benefit) or unify.
- Local repeat: `.tag-chip`, `.feature-new-chip`, `.modifier-op`, `.tag-badge` are all "small pill" patterns. Add a single shared `.pill` class in `shared/styles/buttons.css` (or a separate `pills.css`). Keep file-local color variants if any.

**`character-sheet-layout.css`** (9312 B → goal ≤4000 B):
- Has not been read in this analysis. Slice 7 begins with reading the file in full and producing a per-file diet plan analogous to the one above. **Do not commit Slice 7 changes for this file without that read.**

> **DECISION POINT**: Slice 7 is the most invasive slice. Recommend deferring it as a separate plan iteration after Slices 1-6 are merged and we can re-measure remaining over-budget files. Slices 1-6 alone may shrink most files under 4kB. Mark Slice 7 as: *"defer until budget impact of Slices 1-6 is measured."*

---

### Slice 8 — Token consolidation (OPTIONAL, MAINTENANCE-ONLY)

**Per advisor**: Token replacement *grows* component CSS, doesn't shrink it. It's a maintenance win only. Defer. If pursued later:

1. Add named rgba alpha tokens to `styles.css`:
   ```css
   :root {
     --color-accent-08: rgba(212, 160, 86, 0.08);
     --color-accent-10: rgba(212, 160, 86, 0.10);
     --color-accent-12: rgba(212, 160, 86, 0.12);
     --color-accent-15: rgba(212, 160, 86, 0.15);
     --color-accent-20: rgba(212, 160, 86, 0.20);
     --color-accent-25: rgba(212, 160, 86, 0.25);
     --color-accent-30: rgba(212, 160, 86, 0.30);
     --color-accent-40: rgba(212, 160, 86, 0.40);
     --color-accent-50: rgba(212, 160, 86, 0.50);
   }
   ```
2. Replace literal rgba in shared/styles/*.css first (lowest churn). Skip component files unless the file is over budget AFTER prior slices.

**Mark explicit**: this slice does not help budgets. Only do it for design-system consistency.

---

## Slicing Summary

| Slice | What | Files touched | Visible change risk | Budget impact |
|------:|------|--------------:|--------------------:|-------------:|
| 1 | Foundation: add 5 empty shared CSS files + global @imports | 1 (styles.css) + 5 new | None | 0 |
| 2 | Roster shared extraction | 3 (2 component + 1 shared) | None (Option B) | -9 KB across 2 files |
| 2b | Extract `<app-inline-delete-confirm>` + `<app-roster-entry>` components | 4 component files + 2 new components | None (markup moves intact) | -3-4 KB further across roster files |
| 3 | Button system promotion | 6 | Sub-pixel (audit first) | -400 B cumulative |
| 4 | Form input cleanup | 7 | Sub-pixel (audit + AskUser) | -3-4 KB cumulative |
| 5 | (No code — documents decision) | 0 | - | 0 |
| 6 | Keyframe dedup | 7 | None (byte-identical) | -1.5 KB cumulative |
| 7 | Targeted diets for >8kB files | 2 | Audit-and-ask | Variable |
| 8 | Token consolidation | many | None | +0 (maintenance) |

**Expected after Slices 1-6** (honest accounting):
- **Files Slices 1-6 directly shrink past 4 KB**: `roster-list.css`, `campaign-roster.css`, `card-edit-toolbar.css`, `add-expansion-dialog.css`. Possibly: `card-edit.css`, `subclass-path-edit.css`, `home.css`, `campaign.css`, `campaigns.css` depending on cumulative trim from Slices 3+4+6.
- **Files Slice 7 (deferred) targets**: `card-edit-features.css` (over 8 KB), `character-sheet-layout.css` (over 8 KB).
- **Files NO slice in this plan touches** (still over 4 KB after Slices 1-7): `navbar.css` (6487), `dice-roller.css` (5746), `character-sheet.css` (5580), `ancestry-selector.css` (5289), `tab-nav.css` (4969), `user-list.css` (4902), `level-up-tab-nav.css` (4662), `reference.css` (4621), `inventory-add-panel.css` (4454), `expandable-card-list.css` (4324), `review-section.css` (4282), `campaign-sheet-picker.css` (4060), `character-sheet-panels.css` (4020). These are **out of scope** of this plan and require per-file diets in follow-up work (see "Out of Scope" section).

This plan attacks the *cross-component duplication* problem holistically; it does not promise to clear every file under 4 KB. The user's stated concern ("redundantly repeating CSS, not looking at the application in a holistic view") is squarely the cross-cutting problem, and that's what Slices 1-7 solve.

---

## Execution & Verification

**Order**: 1 → 2 → 2b → 3 → 4 → 6 → 7 (5 is documentation-only; 8 deferred). After Slice 1 lands, Slices 2, 3, 4, 6 can run in parallel; 2b depends on 2.

**Per slice**:
1. Implement the changes (delegate via tech-lead role to Sonnet subagents — one slice per agent, parallel where independent).
2. Run `npm run build` — confirm budget warnings/errors **decreased** (capture before/after output for the PR description).
3. Run `npm run test:run` — all green.
4. Run `npm run lint` — all green.
5. Eyeball-test the affected routes in `npm start` (4200). Routes to hit:
   - Slice 2: `/profile` (roster-list visible), `/campaigns` (campaign-roster visible), any campaign detail page if it uses CampaignRoster.
   - Slice 3: `/admin/cards/:id`, `/admin/users/:id`, `/admin/subclass-paths/:id`, `/admin/bulk-upload`.
   - Slice 4: same admin routes + `/character/create`.
   - Slice 6: home page, login page, campaigns list (the fade-in animations on enter).

**Commit cadence**: one commit per slice. Each commit message clarifies "no visible change; structural CSS extraction; budget delta".

**Branch**: stay on `css-refactor2` (current). Push at end of session per project's mandatory workflow.

**Beads tracking**: file one `bd` issue per slice before starting; close as each ships.

---

## Decisions Required Before Implementation

Per the user's "always provide 2-3 options with tradeoffs" rule, the following must be asked via `AskUserQuestion` before each gated slice:

- **Slice 2**: Option A (rename container classes for cleanest CSS) vs Option B (selector-list — zero template change). *Default: B.*
- **Slice 3**: Aggressive merge vs preserve local deltas. *Default: aggressive merge if no >2px deltas exist; audit first.*
- **Slice 4**: Strict zero-change (skip slice) vs trim-to-deltas (default) vs aggressive merge.
- **Slice 7**: Defer until post-Slices-1-6 re-measure, or pursue now.

Slices 1, 5, 6 are unambiguous and ship without questions.

---

## Out of Scope (Documented for Future Work)

1. **Per-file diets for the 13 component CSS files no slice touches** (each over 4 KB, listed in the "Expected after Slices 1-6" section above). Each is a feature-specific diet that does not benefit from cross-cutting extraction. **Action**: file ONE umbrella `bd` issue ("Per-file CSS budget diets for over-4KB components") or 13 individual issues. Each requires its own read-and-trim pass. Out of scope for this plan because the user's concern was *holistic cross-component redundancy*, not single-file bloat.
2. **TS-level refactor of roster-list / campaign-roster**: the two `.ts` files (62 lines each) are nearly identical generics-over-entity-type. Could share a base class or generic component. File as separate `bd` issue; not part of this CSS-focused plan.
3. **Tailwind utility migration**: Tailwind is imported but largely unused. Could refactor structural utilities (flex, grid, gap) to Tailwind to shrink raw CSS. Significant rewrite; file as separate `bd` issue.
4. **`auth-page.css` globalization**: only 2 components use it; per-component `@import` is currently fine. If a 3rd page joins the auth-chrome family, reconsider.
5. **`home.css` ornament/gradient pattern**: visually overlaps `auth-page.css` ornaments but is a distinct hero layout. No consolidation planned.

---

## Results (session of 2026-05-11)

Shipped on branch `css-refactor2` as six commits:

1. `d8301d7` — Slice 1 foundation (shared CSS scaffold + global @imports).
2. `eb38ac8` — Slice 2 roster shared extraction (campaign-roster 5683 B → 330 B; roster-list 6055 B → 744 B; both cleared 4 KB warning).
3. `0836d3f` — Slice 6 keyframe dedup (deleted exact-match fadeIn/fadeInUp in home/campaign-join; unified pulse keyframes; kept 4 files' translateY(12px) variants).
4. `0e02849` — Slice 3 button system promotion (4 admin files de-duplicated, `card-edit.css` cleared its warning; subclass-path-edit preserved due to 6 perceptible deltas).
5. `9137bfd` — Slice 4 scoped (form-input-sm renamed to BEM `.form-input--sm` and moved to shared; broader form-input consolidation rejected after audit found the variants were intentional themes, not drift).
6. `a85255f` — Slice 2b-1 component extraction (`<app-inline-delete-confirm>` extracted from RosterList + CampaignRoster; 14 new tests; modal-confirm flow untouched).

**Tests**: 2548 passing (up from 2534, +14 new spec assertions). Lint clean. Build clean (0 errors).

**Budget warning count**: 12 → 10 component CSS files. Cleared: `campaign-roster.css`, `roster-list.css`, `card-edit.css`. Reduced: `card-edit-features.css` (7.53 → 7.10 kB), `home.css` (4.65 → 4.51 kB), `campaigns.css` (4.63 → 4.57 kB).

**Still warning (deferred / out-of-scope)**:
- `character-sheet-layout.css` (7.96 kB) — Slice 7.
- `card-edit-features.css` (7.10 kB) — Slice 7.
- `dice-roller.css` (5.68 kB), `navbar.css` (5.28 kB), `subclass-path-edit.css` (5.07 kB), `character-sheet.css` (4.75 kB), `auth.css` (4.57 kB), `campaigns.css` (4.57 kB), `home.css` (4.51 kB), `ancestry-selector.css` (4.44 kB) — per-file diets, not cross-cutting redundancy.

**Open follow-ups**:
- Slice 7: targeted diet for `character-sheet-layout.css` and `card-edit-features.css` (both still over 4 KB after this round).
- Slice 2b-2 (deferred): generic `<app-roster-entry>` via content projection. Body content differs significantly between rosters; lower value than 2b-1 — defer until another roster-shaped feature appears.
- Slice 8 (deferred): rgba alpha token consolidation. Maintenance-only; does not help per-file budgets.
- Generic per-file diets for the 8 untouched over-budget files (navbar, dice-roller, etc.) — each a separate targeted reduction, file as one umbrella issue or per-file issues. None benefit from cross-component extraction.
- Visual reconciliation of the four `@keyframes fadeInUp { translateY(12px) }` variants vs the global `translateY(20px)` — design decision.
