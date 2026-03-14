# Character Sheet Accessibility & Quality Audit

**Date**: 2026-03-13
**Files audited**: `character-sheet.html`, `character-sheet.css`, `character-sheet-layout.css`, `character-sheet.ts`

---

## Anti-Patterns Verdict: PASS (with caveats)

This does **not** look AI-generated. The warm tavern aesthetic — dark background (`#0d0806`), gold accents, Cinzel/Lora fonts, translucent panels — is deliberate and thematic. No gradient text, no glassmorphism hero cards, no generic blue palette. The TTRPG character sheet metaphor is well-executed.

**Caveat**: The overuse of `rgba()` opacity layering for color instead of concrete design tokens is a systemic anti-pattern that makes the design harder to maintain and audit for contrast.

---

## Executive Summary

| Severity | Count |
|---|---|
| Critical | 6 |
| High | 8 |
| Medium | 5 |
| Low | 4 |

**Top 3 Critical Issues:**
1. Epidemic of sub-9px font sizes — the direct cause of the user's "text is too small" complaint
2. Modifier tooltip completely inaccessible to keyboard users
3. Interactive resource boxes at 28×28px — 36% below minimum touch target size

**Overall Quality Score: 51/100** — Strong aesthetic foundation undermined by systematic readability and accessibility failures.

---

## Critical Issues

### CRIT-1: Epidemic of Illegible Font Sizes

- **Location**: `character-sheet.css` — throughout (18+ class definitions)
- **Severity**: Critical
- **Category**: Accessibility / Readability
- **Description**: Massive swaths of the UI use font sizes below the WCAG minimum. Specific violations:

| Class | Size | Approx px |
|---|---|---|
| `.trait-badge__marked-dot` | `0.45rem` | **7.2px** |
| `.trait-badge__subskill` | `0.5rem` | **8px** |
| `.shield__label` | `0.55rem` | **8.8px** |
| `.trait-badge__abbr` | `0.55rem` | **8.8px** |
| `.level-badge__label` | `0.55rem` | **8.8px** |
| `.equipment-card__badge` | `0.55rem` | **8.8px** |
| `.expandable-card__meta-badge` | `0.55rem` | **8.8px** |
| `.damage-zone__label` | `0.58rem` | **9.3px** |
| `.resource-row__label` | `0.65rem` | **10.4px** |
| `.feature-tag` | `0.65rem` | **10.4px** |
| `.gold-display__label` | `0.65rem` | **10.4px** |
| `.card-group__heading` | `0.7rem` | **11.2px** |
| `.expandable-card__chevron` | `0.7rem` | **11.2px** |
| `.feature-row__name` | `0.7rem` | **11.2px** |
| `.modifier-tooltip` | `0.7rem` | **11.2px** |
| `.panel__title` | `0.75rem` | **12px** |

- **Impact**: This is the root cause of the user's complaint. Text below 12px is physically difficult to read for most users; below 9px it is functionally invisible for anyone with less than perfect vision. The character sheet is reference material that players actively read during play.
- **WCAG**: 1.4.4 Resize Text (AA), 1.4.12 Text Spacing (AA)
- **Recommendation**: Establish a type scale floor of `0.75rem` (12px) as the absolute minimum. Most body/label text should be `0.875rem`–`1rem`. Abbreviations and meta badges should be `0.75rem` minimum with generous letter-spacing.
- **Suggested command**: `/normalize` then `/harden`

---

### CRIT-2: Modifier Tooltip Keyboard-Inaccessible

- **Location**: `character-sheet.css:168`, `character-sheet.html:31-35`, `character-sheet.html:61-65`
- **Severity**: Critical
- **Category**: Accessibility
- **Description**: The modifier breakdown tooltip on Evasion and Armor shields is triggered exclusively by CSS `:hover`. The `.shield` element is a non-interactive `<div>` with no focusable children.

```css
.shield:hover .modifier-tooltip {
  display: flex;   /* hover-only — keyboard users locked out */
}
```

- **Impact**: Players using keyboard navigation, switch access, or screen readers cannot see what modifiers are affecting their Evasion/Armor scores. This is critical game information.
- **WCAG**: 1.3.1 Info and Relationships (A), 2.1.1 Keyboard (A), 4.1.3 Status Messages (AA)
- **Recommendation**: Convert `.shield` to a `<button>` or add `tabindex="0"` + `:focus-within` CSS rule. Alternatively, expand modifier sources inline when modifiers exist (no tooltip needed).
- **Suggested command**: `/harden`

---

### CRIT-3: Resource Boxes Below Minimum Touch Target

- **Location**: `character-sheet.css:331-341`
- **Severity**: Critical
- **Category**: Accessibility / Responsive
- **Description**: All interactive resource boxes (HP, Stress, Hope, Armor) are 28×28px.

```css
.resource-box {
  width: 28px;
  height: 28px;  /* 36% below 44px minimum */
}
```

- **Impact**: On mobile/touch devices these are nearly impossible to accurately tap, especially with 4px gaps between them. A character with high HP (8+ boxes) will have a row of tiny buttons — a constant source of mis-taps during gameplay.
- **WCAG**: 2.5.5 Target Size (AAA, 44×44px), 2.5.8 Target Size Minimum (AA, 24×24px per WCAG 2.2)
- **Recommendation**: Increase to minimum 36×36px. Consider 40×40px on mobile. Use `min-width`/`min-height` to preserve visual size while expanding tap area via padding.
- **Suggested command**: `/adapt`

---

### CRIT-4: No ARIA Announcements on Loading/Error States

- **Location**: `character-sheet.html:3-10`
- **Severity**: Critical
- **Category**: Accessibility
- **Description**: Loading and error states use plain `<div>` containers with no live region or role announcements.

```html
<div class="sheet-loading">           <!-- needs role="status" aria-live="polite" -->
  <p class="loading-text">Loading character sheet...</p>
</div>
<div class="sheet-error">             <!-- needs role="alert" -->
  <h2>Character Not Found</h2>
```

- **Impact**: Screen reader users receive no announcement that content is loading or that an error occurred after navigation.
- **WCAG**: 4.1.3 Status Messages (AA)
- **Recommendation**: Add `role="status" aria-live="polite"` to loading div; `role="alert"` to error div.
- **Suggested command**: `/harden`

---

### CRIT-5: No Visible Focus Indicators on Any Interactive Elements

- **Location**: `character-sheet.css` — no `:focus` or `:focus-visible` styles defined anywhere
- **Severity**: Critical
- **Category**: Accessibility
- **Description**: The `.expandable-card__header` buttons and all `.resource-box` buttons have zero custom focus styles. Browser defaults are likely suppressed or invisible on the dark background.
- **Impact**: Keyboard users cannot see which element is currently focused — a complete navigation failure.
- **WCAG**: 2.4.7 Focus Visible (AA), 2.4.11 Focus Appearance (AA in WCAG 2.2)
- **Recommendation**: Add `:focus-visible` outlines to all interactive elements. A gold (`var(--color-accent)`) 2px offset outline would match the aesthetic perfectly.
- **Suggested command**: `/harden`

---

### CRIT-6: Missing `<main>` Landmark

- **Location**: `character-sheet.html:1`
- **Severity**: Critical
- **Category**: Accessibility / Semantic HTML
- **Description**: The entire page content is wrapped in `<div class="sheet-page">` with no `<main>` landmark element.
- **Impact**: Screen reader users cannot jump to main content via landmark navigation — a primary navigation strategy.
- **WCAG**: 1.3.6 Identify Purpose (AA), 2.4.1 Bypass Blocks (A)
- **Recommendation**: Replace the outer `<div class="sheet-page">` with `<main class="sheet-page">`.
- **Suggested command**: `/harden`

---

## High-Severity Issues

### HIGH-1: Near-Zero Contrast on Subskill Text

- **Location**: `character-sheet.css:233`
- **Severity**: High
- **Category**: Accessibility
- **Description**: `.trait-badge__subskill` uses `rgba(245, 230, 211, 0.35)` on a dark background. Estimated contrast ratio: ~1.8:1 — far below the 4.5:1 AA requirement.
- **Impact**: Subskill labels (which tell players what actions a trait covers) are functionally invisible.
- **WCAG**: 1.4.3 Contrast Minimum (AA)
- **Recommendation**: Minimum `rgba(245, 230, 211, 0.65)` for small text.
- **Suggested command**: `/normalize`

---

### HIGH-2: Empty State Text Near-Invisible

- **Location**: `character-sheet.css:530`
- **Severity**: High
- **Category**: Accessibility
- **Description**: `.empty-state` uses `rgba(245, 230, 211, 0.35)` — same ~1.8:1 contrast as HIGH-1. "No weapons equipped." and "No armor equipped." are nearly unreadable.
- **WCAG**: 1.4.3 Contrast Minimum (AA)
- **Recommendation**: Raise to `rgba(245, 230, 211, 0.65)` minimum.
- **Suggested command**: `/normalize`

---

### HIGH-3: Pronouns Text at 50% Opacity — Contrast Fail

- **Location**: `character-sheet.css:69`
- **Severity**: High
- **Category**: Accessibility
- **Description**: `.sheet-pronouns` is `rgba(245, 230, 211, 0.5)` — estimated ratio ~2.5:1. Character pronouns — identity-critical information — are hard to read.
- **WCAG**: 1.4.3 Contrast Minimum (AA) — 4.5:1 required for small text
- **Recommendation**: Raise opacity to `0.75` minimum.
- **Suggested command**: `/normalize`

---

### HIGH-4: Hard-Coded Color Values Throughout

- **Location**: `character-sheet-layout.css:22-25`, `character-sheet-layout.css:47-50`, `character-sheet.css:289-291` and more
- **Severity**: High
- **Category**: Theming
- **Description**: 10+ hard-coded hex colors not using CSS custom properties:

```css
.card-group__heading--subclass { color: #b87fd4; }
.card-group__heading--ancestry { color: #d4c256; }
.card-group__heading--community { color: #56d478; }
.card-group__heading--domain { color: #d48056; }
:host { background: #0d0806; }
.damage-zone--minor .label { color: #6aad7a; }
.damage-zone--major .label { color: #c8943c; }
.damage-zone--severe .label { color: #c05050; }
```

- **Impact**: No single source of truth for card-type or damage-severity colors. Theming changes require hunting all scattered literals.
- **Recommendation**: Define `--color-card-subclass`, `--color-card-ancestry`, `--color-card-community`, `--color-card-domain`, `--color-damage-minor`, `--color-damage-major`, `--color-damage-severe` as CSS custom properties.
- **Suggested command**: `/normalize`

---

### HIGH-5: Label Text All-Caps at Sub-11px — Readability Failure

- **Location**: `character-sheet.css` — multiple classes
- **Severity**: High
- **Category**: Accessibility / Readability
- **Description**: Many tiny labels combine `text-transform: uppercase` + large `letter-spacing` with already-tiny font sizes:

```css
.shield__label    { font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.1em; }
.panel__title     { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; }
.resource-row__label { font-size: 0.65rem; text-transform: uppercase; }
```

- **Impact**: Uppercase letters at 8-10px are significantly harder to read than mixed-case. This compounds CRIT-1.
- **WCAG**: 1.4.8 Visual Presentation (AAA)
- **Recommendation**: If uppercase is kept for aesthetics, font sizes must be increased. Heuristic: uppercase labels need at least 2px larger than their mixed-case equivalent.
- **Suggested command**: `/normalize`

---

### HIGH-6: `:host` Defaults to Display Font Instead of Body Font

- **Location**: `character-sheet.css:5`
- **Severity**: High
- **Category**: Readability
- **Description**: `font-family: var(--font-display)` on `:host` means any element that doesn't explicitly declare `var(--font-body)` inherits Cinzel — a decorative serif unsuitable for dense readable text.
- **Impact**: Many elements (shield values, modifier tooltips, trait modifiers) render in Cinzel by default, reducing readability for reference text read during play.
- **Recommendation**: Default `:host` to `var(--font-body)`. Explicitly apply `var(--font-display)` only to headings.
- **Suggested command**: `/normalize`

---

### HIGH-7: 480px Breakpoint Regression — Traits Force Back to 6 Columns

- **Location**: `character-sheet-layout.css:148-150`
- **Severity**: High
- **Category**: Responsive
- **Description**: At 768px, `.traits-row` correctly collapses to `repeat(3, 1fr)`. But the 480px breakpoint forces it back to `repeat(6, 1fr)`:

```css
@media (max-width: 480px) {
  .traits-row {
    grid-template-columns: repeat(6, 1fr); /* undoes the 768px 3-column fix */
  }
}
```

- **Impact**: On small phones, 6 trait badges will be ~50px wide each with 0.55rem text — essentially unreadable.
- **Recommendation**: Remove the 480px override or change to `repeat(3, 1fr)`.
- **Suggested command**: `/adapt`

---

### HIGH-8: Accordion Buttons Missing `aria-controls`

- **Location**: `character-sheet.html:274`, `309`, `337`, `365`
- **Severity**: High
- **Category**: Accessibility
- **Description**: Accordion buttons have `aria-expanded` but no `aria-controls` pointing to the expanded panel. The expanded body has no `id` attribute.
- **Impact**: Screen readers can announce "expanded/collapsed" but cannot associate the button with its controlled content — breaking the standard accordion pattern.
- **WCAG**: 4.1.2 Name, Role, Value (A)
- **Recommendation**: Add `[id]="'card-body-' + card.id"` to `.expandable-card__body` and `[attr.aria-controls]="'card-body-' + card.id"` to the button.
- **Suggested command**: `/harden`

---

## Medium-Severity Issues

### MED-1: Modifier Tooltip Font Size Too Small

- **Location**: `character-sheet.css:163-165`
- **Severity**: Medium
- **Category**: Readability
- **Description**: `.modifier-tooltip` is `0.7rem` (11.2px). This tooltip shows important modifier breakdowns that players need to read quickly.
- **Recommendation**: Increase to `0.85rem` minimum.

---

### MED-2: Damage Zones Use Color as Sole Differentiator

- **Location**: `character-sheet.css:289-291`, `character-sheet.html:76-91`
- **Severity**: Medium
- **Category**: Accessibility
- **Description**: Minor/Major/Severe zones are distinguished primarily by color. The label text is present, but contrast of the labels against their zone backgrounds (`rgba(74,124,89,0.14)`, etc.) is very low.
- **WCAG**: 1.4.1 Use of Color (A)
- **Recommendation**: Increase zone background opacity or add a subtle icon/border to each zone so color is not the only differentiator.

---

### MED-3: Unspecified `transition` Property

- **Location**: `character-sheet.css:340-341`, `character-sheet-layout.css:73`
- **Severity**: Medium
- **Category**: Performance
- **Description**: `transition: .12s` with no property name applies transitions to all CSS properties, which can trigger expensive repaints.
- **Recommendation**: Be explicit: `transition: background-color 0.12s, border-color 0.12s;`

---

### MED-4: Marked-Dot Span ARIA Could Be Improved

- **Location**: `character-sheet.html:45`
- **Severity**: Medium
- **Category**: Accessibility
- **Description**: `<span class="trait-badge__marked-dot" aria-label="marked">&#9679;</span>` — some screen readers announce the character before the aria-label. The marked state is not conveyed on the parent element.
- **Recommendation**: Add a full `aria-label` to the parent `.trait-badge` div (e.g., `"Agility: +2, marked"`) and add `aria-hidden="true"` to the dot span.

---

### MED-5: Gold Panel Missing Semantic Heading

- **Location**: `character-sheet.html:147-151`
- **Severity**: Medium
- **Category**: Semantic HTML
- **Description**: The gold panel has no `<h2>` — only a label span inside `.gold-display`. All other panels have `<h2 class="panel__title">`, creating an inconsistent heading hierarchy.
- **Recommendation**: Add `<h2 class="panel__title">Gold</h2>` before `.gold-display`.

---

## Low-Severity Issues

### LOW-1: `.expandable-card__domain` Hard-Codes `#d48056`

- **Location**: `character-sheet-layout.css:111`
- **Severity**: Low
- **Category**: Theming
- **Description**: Uses a literal hex value instead of a domain color custom property.

---

### LOW-2: Tooltip Has No `pointer-events: none`

- **Location**: `character-sheet.css:149-170`
- **Severity**: Low
- **Category**: UX Polish
- **Description**: The modifier tooltip may flicker if the cursor briefly exits the shield hitbox on the way toward the tooltip. Adding `pointer-events: none` prevents this.

---

### LOW-3: No `prefers-reduced-motion` Support

- **Location**: `character-sheet.css:341`, `character-sheet-layout.css:73`
- **Severity**: Low
- **Category**: Accessibility
- **Description**: No `@media (prefers-reduced-motion: reduce)` override defined for any animations or transitions.
- **WCAG**: 2.3.3 Animation from Interactions (AAA)

---

### LOW-4: Default Browser Focus Outline Invisible on Dark Background

- **Location**: `character-sheet.css:331`
- **Severity**: Low
- **Category**: Accessibility
- **Description**: Without custom focus styles (see CRIT-5), the browser default blue outline will be nearly invisible on `#0d0806`. This compounds CRIT-5.

---

## Patterns & Systemic Issues

1. **Sub-12px font sizes appear in 16+ class definitions** — `0.45rem`–`0.65rem` is used as a design language for labels but at these sizes they are physically inaccessible. The entire labeling system needs a type scale floor of `0.75rem`.

2. **Low-opacity text used throughout for visual hierarchy** — `rgba(245, 230, 211, 0.35)`, `0.5`, `0.6`, `0.65` all fail or borderline-fail WCAG contrast on this dark background. Hierarchy should be achieved through font-weight and size differences, not by making text nearly transparent.

3. **Hard-coded hex colors in 10+ locations** — no card-type or damage-severity color tokens exist. Every theming change requires finding and updating scattered literals.

4. **No focus styles anywhere** — systemic gap across all interactive elements, not an isolated oversight.

5. **`:host` display font inheritance** — any element that forgets to declare `var(--font-body)` inherits Cinzel, unsuitable for dense readable text.

---

## Positive Findings

- **Accordion ARIA**: `aria-expanded` on all expandable card buttons is correctly implemented.
- **Resource box ARIA**: `aria-label` + `aria-pressed` on HP/Stress/Hope/Armor boxes is exactly right.
- **Heading hierarchy**: `h1` → `h2` → `h3` → `h4` is logically correct throughout.
- **Responsive breakpoints**: Two breakpoints (768px, 480px) handle the major layout changes. The 768px single-column collapse is correct.
- **`clamp()` for character name**: `font-size: clamp(2rem, 5vw, 3.5rem)` is excellent responsive typography — the only font size in the file using fluid scaling.
- **OnPush + Signals**: Correct use of `ChangeDetectionStrategy.OnPush` with Angular signals — no performance concerns.
- **Local state overrides**: `localHpMarked` defaulting to server value via `??` is an elegant pattern.

---

## Recommendations by Priority

### Immediate (Critical — fix before shipping)
1. Raise all font sizes — establish `0.75rem` as absolute floor, `0.875rem` for body text (CRIT-1)
2. Add `:focus-visible` outline styles to all interactive elements (CRIT-5)
3. Replace outer `<div>` with `<main>` (CRIT-6)
4. Add `role="status"` to loading state, `role="alert"` to error state (CRIT-4)
5. Make modifier tooltip keyboard accessible via `:focus-within` (CRIT-2)
6. Increase `.resource-box` to minimum 36×36px (CRIT-3)

### Short-term (High — this sprint)
7. Raise all low-opacity text to minimum `0.65` opacity (HIGH-1, HIGH-2, HIGH-3)
8. Change `:host` default font to `var(--font-body)` (HIGH-6)
9. Extract all hard-coded hex colors to CSS custom properties (HIGH-4)
10. Add `aria-controls` + `id` pairing to accordion buttons (HIGH-8)
11. Fix 480px traits-row regression to `repeat(3, 1fr)` (HIGH-7)

### Medium-term (next sprint)
12. Add full `aria-label` to trait badges conveying complete state (MED-4)
13. Add `@media (prefers-reduced-motion)` to disable transitions (LOW-3)
14. Add `pointer-events: none` to modifier tooltip (LOW-2)
15. Add heading to Gold panel (MED-5)
16. Specify explicit transition properties (MED-3)

### Long-term
17. Add icon/pattern secondary encoding to damage zone colors for colorblind users (MED-2)
18. Audit actual contrast ratios with axe DevTools or Colour Contrast Analyser

---

## Suggested Commands for Fixes

- **`/normalize`**: Type scale (CRIT-1), contrast violations (HIGH-1/2/3), hard-coded colors (HIGH-4), font-family inheritance (HIGH-6), uppercase label sizes (HIGH-5) — addresses ~15 issues
- **`/harden`**: ARIA roles on loading/error states (CRIT-4), focus indicators (CRIT-5), `aria-controls` on accordions (HIGH-8), keyboard tooltip access (CRIT-2), `prefers-reduced-motion` (LOW-3) — addresses ~8 issues
- **`/adapt`**: Touch target sizes (CRIT-3), 480px traits regression (HIGH-7) — addresses ~2 issues
