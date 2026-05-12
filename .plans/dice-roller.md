# Plan: Dice Roller (5 Themed Variants + Theme Picker)

**Scope:** Frontend-only. Add a floating dice roller to the Character Sheet with 5 visually distinct themes, and a theme picker in the bottom-right to switch between them. Pure dice (no modifiers for now), but architected so future card/trait triggers can programmatically roll via a shared service.

**Dice supported:** d4, d6, d8, d10, d12, d20, d100, plus a "duality" pair (2d12, one hope-colored, one fear-colored). Duality can be mixed with other dice, but only ONE duality pair per roll. Hope/fear/crit outcome is determined solely by the duality pair.

**Confirmed decisions (from Q&A):**
- Pure dice roller now; plan for future trait/card integration via service API.
- Session-scrollable roll history (in-memory, cleared on refresh).
- Duality mixable with other dice; single duality pair per throw.
- 5 designs: 2–3 site-consistent (warm tavern) + 2–3 bolder departures.
- SVG wireframe aesthetic for menu + dice across all variants.
- Floating trigger (FAB) bottom-left; theme picker bottom-right.

**Agent model requirements (non-negotiable):**
- Design subagents: **Opus, medium effort**.
- Implementation subagents: **Sonnet, medium effort**.

---

## 1. File Structure

```
src/app/
├── core/services/
│   └── dice-roller.service.ts          # State, rolling logic, theme persistence
│   └── dice-roller.service.spec.ts
├── shared/
│   ├── models/
│   │   └── dice-roller.model.ts        # DiceType, RollRequest, RollResult, etc.
│   └── components/
│       └── dice-roller/
│           ├── dice-roller.ts          # Host: picks active variant + renders theme picker
│           ├── dice-roller.html
│           ├── dice-roller.css
│           ├── dice-roller.spec.ts
│           ├── theme-picker/
│           │   ├── theme-picker.ts
│           │   ├── theme-picker.html
│           │   ├── theme-picker.css
│           │   └── theme-picker.spec.ts
│           └── variants/
│               ├── tavern-scroll/          # Site-consistent #1
│               ├── arcane-glyph/           # Site-consistent #2
│               ├── manuscript-folio/       # Site-consistent #3
│               ├── neon-arcade/            # Bold departure #1
│               └── brutalist-blueprint/    # Bold departure #2
│                   ├── {name}.ts
│                   ├── {name}.html
│                   ├── {name}.css
│                   └── {name}.spec.ts
└── features/character-sheet/
    └── character-sheet.html               # Add `<app-dice-roller />`
    └── character-sheet.ts                 # Import DiceRoller
```

---

## 2. Data Model (`shared/models/dice-roller.model.ts`)

```ts
export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export const DICE_TYPES: readonly DiceType[] =
  ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;

export const DICE_SIDES: Readonly<Record<DiceType, number>> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
};

/** One entry in the "pending roll" tray: N dice of one type. */
export interface DiceSelection {
  type: DiceType;
  count: number;
}

/** What the caller asks the service to roll. */
export interface RollRequest {
  dice: DiceSelection[];       // any non-duality dice
  includeDuality: boolean;     // when true, append a hope d12 + fear d12
  label?: string;              // future: 'Agility check', 'Longsword damage', etc.
}

/** Result of a single rolled die that isn't part of the duality pair. */
export interface DieResult {
  type: DiceType;
  value: number;
}

/** Result of the duality pair (if rolled). */
export interface DualityResult {
  hope: number;                // 1..12
  fear: number;                // 1..12
  outcome: 'hope' | 'fear' | 'crit';  // crit when hope === fear
}

/** Full roll output stored in history. */
export interface RollResult {
  id: string;                  // uuid-ish, for trackBy
  timestamp: number;
  diceResults: DieResult[];
  duality: DualityResult | null;
  total: number;               // sum of all dice + duality (if present)
  label?: string;
}

/** The 5 available themes — used by theme picker + variant selector. */
export const DICE_ROLLER_THEMES = [
  'tavern-scroll',
  'arcane-glyph',
  'manuscript-folio',
  'neon-arcade',
  'brutalist-blueprint',
] as const;
export type DiceRollerTheme = typeof DICE_ROLLER_THEMES[number];

export interface ThemeDescriptor {
  id: DiceRollerTheme;
  label: string;               // "Tavern Scroll"
  tagline: string;             // short one-line vibe
}
```

---

## 3. Service (`core/services/dice-roller.service.ts`)

**Responsibilities:**
1. Hold session roll history (signal).
2. Hold "open/closed" state (signal) — variants react to this.
3. Execute `roll(request)` → returns + appends `RollResult`.
4. Hold active theme (signal) + persist to `localStorage` under `oh-sheet:dice-roller-theme`.
5. Expose `externalTrigger(request)` — future API surface for card/trait rolls. Opens the roller with a pre-populated pending selection (signal), but does NOT roll automatically (user confirms).

**Skeleton:**

```ts
@Injectable({ providedIn: 'root' })
export class DiceRollerService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'oh-sheet:dice-roller-theme';

  readonly history = signal<RollResult[]>([]);
  readonly isOpen = signal(false);
  readonly theme = signal<DiceRollerTheme>(this.loadTheme());
  readonly pendingRequest = signal<RollRequest | null>(null);

  open(): void { this.isOpen.set(true); }
  close(): void { this.isOpen.set(false); }
  toggle(): void { this.isOpen.update(v => !v); }

  setTheme(theme: DiceRollerTheme): void {
    this.theme.set(theme);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.storageKey, theme);
    }
  }

  roll(request: RollRequest): RollResult {
    const diceResults: DieResult[] = [];
    for (const sel of request.dice) {
      for (let i = 0; i < sel.count; i++) {
        diceResults.push({ type: sel.type, value: this.rollOne(DICE_SIDES[sel.type]) });
      }
    }
    let duality: DualityResult | null = null;
    if (request.includeDuality) {
      const hope = this.rollOne(12);
      const fear = this.rollOne(12);
      duality = {
        hope, fear,
        outcome: hope === fear ? 'crit' : hope > fear ? 'hope' : 'fear',
      };
    }
    const total =
      diceResults.reduce((s, d) => s + d.value, 0) +
      (duality ? duality.hope + duality.fear : 0);

    const result: RollResult = {
      id: this.nextId(),
      timestamp: Date.now(),
      diceResults,
      duality,
      total,
      label: request.label,
    };
    this.history.update(h => [result, ...h]);
    return result;
  }

  clearHistory(): void { this.history.set([]); }

  /** Future hook for card-feature / trait rolls. */
  externalTrigger(request: RollRequest): void {
    this.pendingRequest.set(request);
    this.open();
  }
  consumePendingRequest(): RollRequest | null {
    const r = this.pendingRequest();
    this.pendingRequest.set(null);
    return r;
  }

  private idCounter = 0;
  private nextId(): string {
    this.idCounter += 1;
    return `${Date.now()}-${this.idCounter}`;
  }

  private rollOne(sides: number): number {
    // crypto.getRandomValues for fairness; fallback to Math.random
    if (isPlatformBrowser(this.platformId) && typeof crypto !== 'undefined') {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return (buf[0] % sides) + 1;
    }
    return Math.floor(Math.random() * sides) + 1;
  }

  private loadTheme(): DiceRollerTheme {
    if (!isPlatformBrowser(this.platformId)) return 'tavern-scroll';
    const raw = localStorage.getItem(this.storageKey);
    return (DICE_ROLLER_THEMES as readonly string[]).includes(raw as string)
      ? (raw as DiceRollerTheme)
      : 'tavern-scroll';
  }
}
```

**Tests required:**
- `roll()` sums all dice correctly.
- Duality outcome: hope > fear → 'hope'; fear > hope → 'fear'; equal → 'crit'.
- Duality hope+fear counts toward total.
- `externalTrigger` sets pending and opens.
- `setTheme` persists to localStorage.
- History is prepended (newest first).

---

## 4. Host Component (`shared/components/dice-roller/dice-roller.ts`)

Very thin shell:

```ts
@Component({
  selector: 'app-dice-roller',
  imports: [
    ThemePicker,
    TavernScrollVariant,
    ArcaneGlyphVariant,
    ManuscriptFolioVariant,
    NeonArcadeVariant,
    BrutalistBlueprintVariant,
  ],
  templateUrl: './dice-roller.html',
  styleUrl: './dice-roller.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiceRoller {
  readonly rollerService = inject(DiceRollerService);
}
```

```html
<!-- dice-roller.html -->
@switch (rollerService.theme()) {
  @case ('tavern-scroll')        { <app-dice-variant-tavern-scroll /> }
  @case ('arcane-glyph')         { <app-dice-variant-arcane-glyph /> }
  @case ('manuscript-folio')     { <app-dice-variant-manuscript-folio /> }
  @case ('neon-arcade')          { <app-dice-variant-neon-arcade /> }
  @case ('brutalist-blueprint')  { <app-dice-variant-brutalist-blueprint /> }
}
<app-dice-theme-picker />
```

No other logic. Each variant injects `DiceRollerService` directly.

---

## 5. Variant Contract (what every variant must implement)

Each variant is a **standalone component** with `selector: app-dice-variant-{name}`. Each variant:

1. Injects `DiceRollerService`.
2. Renders its own floating trigger button (FAB) in the bottom-left corner (`position: fixed; bottom: X; left: X; z-index:...`).
3. On FAB click → `service.toggle()`.
4. When `service.isOpen()` is true, renders its themed menu.
5. Menu shows:
   - A selector for picking dice (per-type count, 0..N).
   - A toggle/checkbox for "include duality".
   - A "Roll" button that calls `service.roll(request)`.
   - The most recent result prominently (total + hope/fear/crit flag if duality).
   - A scrollable history log (`service.history()`), each entry shows per-die results + total + hope/fear outcome.
   - A "Clear history" action.
6. On init, reads `service.consumePendingRequest()` and pre-fills the selection if present (future-ready; not required to be exercised now).
7. Uses SVG dice for each dice-type icon. Wireframe is the **preferred** default aesthetic (it was the brief), but each variant's designer may deviate when the theme specifically demands it (e.g., a painterly illuminated variant). The two bold-departure variants still carry a wireframe treatment where it serves the theme (Neon = neon hologram wireframes; Blueprint = engineering lineart).
8. `z-index` band for the dice roller (existing app uses navbar-drawer=1000, confirm-dialog=1000, refine-sheet=200–201):
   - FAB: `1100`
   - Variant menu / overlay: `1100` (siblings — menu appears attached to FAB)
   - Theme picker (collapsed + expanded panel): `1200` (always above the menu so users can switch themes without closing the roller).

**Color contract for duality dice:**
- Hope die uses theme-specific hope color (e.g., gold/amber/cyan depending on variant).
- Fear die uses theme-specific fear color (e.g., deep red/magenta/ink-black).
- Each theme defines these via CSS custom properties: `--hope-color`, `--fear-color`, `--crit-color`.

**Ubiquitous microcopy:**
- When duality outcome is `crit`, show "Critical Success!" near the total.
- When `hope`, show "with Hope".
- When `fear`, show "with Fear".

---

## 6. Theme Picker (`shared/components/dice-roller/theme-picker/theme-picker.ts`)

Small floating panel in bottom-right:

- Collapsed: single circular button showing an icon (palette / swatches).
- Expanded: a vertical stack of 5 swatches labeled with the theme name + tagline.
- Clicking a swatch → `rollerService.setTheme(theme.id)`.
- The currently active theme swatch is highlighted.
- Tests: renders 5 swatches; clicking one updates service; active swatch reflects service state.

Visual style: **always-tavern** — the picker stays in the site's native warm-tavern styling (slim dark chip, Cinzel micro-label, gold border `#d4a056`, parchment accents) regardless of the currently-active theme. This is an intentional choice: the picker is the site's chrome for switching roller skins, and anchors the user to the site identity even when the active variant departs boldly.

---

## 7. Integration with Character Sheet

**File:** `src/app/features/character-sheet/character-sheet.ts`

```diff
 import { ModifierIndicator } from './components/modifier-indicator/modifier-indicator';
+import { DiceRoller } from '../../shared/components/dice-roller/dice-roller';
...
-  imports: [SavingSpinner, RouterLink, FormatTextPipe, InventorySection, ModifierIndicator],
+  imports: [SavingSpinner, RouterLink, FormatTextPipe, InventorySection, ModifierIndicator, DiceRoller],
```

**File:** `src/app/features/character-sheet/character-sheet.html`

Add at the very bottom of the `<main>`:

```diff
       </section>
     }
+    <app-dice-roller />
   }
 </main>
```

Make sure it sits outside the `@if` data-loaded block ONLY if we want it to show even on loading/error — but since the feature is "on the Character Sheet", show only when the sheet is loaded.

---

## 8. Five Design Briefs

Each design subagent will use the `impeccable:frontend-design` skill and return **design specs only** (SVG mockups / CSS tokens / interaction notes / dice SVG ideas). Actual implementation happens in Phase 3 by Sonnet agents.

### 8.1 Tavern Scroll (site-consistent)
A parchment scroll that unfurls up from the bottom-left, revealing weathered paper with hand-inked dice. Gold accents, Cinzel headings. FAB is a wax-seal medallion. Roll animation: ink splatter + scroll shake. Hope = amber gold (#d4a056); Fear = deep crimson.

### 8.2 Arcane Glyph (site-consistent)
Dice arranged in a circular rune/glyph, centered on the FAB. Tap FAB → glyph expands outward revealing dice icons on the points of a heptagram. Central crystal displays the total. Dark bronze + gold. Duality shown as two moons in the center (sun/moon for hope/fear). Modal-style with dark overlay.

### 8.3 Manuscript Folio (site-consistent)
A side drawer that slides in from the left, styled like an illuminated manuscript page with decorated marginalia. Dice as small woodcut illustrations. Results are typeset as calligraphic lines: "III, VII, XII … hope". History is stacked vellum cards. Warm parchment + ink-black + gold initial caps.

### 8.4 Neon Arcade (bold departure)
Full-bleed synthwave overlay. Dice are neon wireframe holograms that rotate on hover. CRT scanlines + magenta/cyan palette. Terminal-style history log with "> rolled 2d6 = 8". FAB is a glowing cyberpunk cube. Duality: cyan hope vs magenta fear. Crit triggers a screen-shake + glitch.

### 8.5 Brutalist Blueprint (bold departure)
Technical-drawing aesthetic. White hairlines on near-black grid paper. Dice as exploded axonometric diagrams with measurement callouts ("Ø 20mm"). History as a schedule table with stamped timestamps. Monospaced. Duality: HOPE / FEAR labeled callouts with arrows. Zero decoration beyond what a blueprint would carry.

Each subagent receives its brief + the shared variant contract + the design tokens (site palette for tavern themes, free palette for departures). Each returns a single design spec file in `.plans/dice-roller/variant-{name}.md`.

---

## 9. Agent Orchestration

### Phase 1 — Core infrastructure (single Sonnet agent)
Create model, service, host component, theme picker, and wire into Character Sheet. Include tests for the service. Do NOT create variant components yet (they'll be placeholders so the host compiles).

Placeholder variants: 5 trivial components that render `<p>{theme name}</p>` just so the `@switch` compiles. Each placeholder lives at its final path.

### Phase 2 — Parallel design exploration (5 Opus subagents, medium effort)
All 5 run simultaneously. Each uses `impeccable:frontend-design` skill. Each produces `.plans/dice-roller/variant-{name}.md` with:
- Hero SVG mockup (ASCII or SVG) of the menu
- Hero SVG mockup of the FAB
- SVG wireframe sketches of each die type (d4–d100 + duality pair)
- CSS custom properties table (colors, fonts, shadows)
- Interaction / animation notes
- Any layout constraints that affect the variant contract

**Agent brief template (shared intro):**
> You are one of 5 design agents creating a dice roller variant for a Daggerheart character sheet tool. Read `.plans/dice-roller.md` for full context. Your theme is **{name}**: {tagline}. Produce design specs only (no implementation). Save as `.plans/dice-roller/variant-{name}.md`. The other 4 designs target other themes — do not coordinate; independent voices are desired.

### Phase 3 — Parallel implementation (5 Sonnet subagents, medium effort)
All 5 run simultaneously once design specs are complete. Each implements one variant:
- Inputs: the variant contract (§5), the design spec from Phase 2, a link to the service API.
- Outputs: the 4 files under `shared/components/dice-roller/variants/{name}/`.
- Must pass lint + tests + build for its own folder.

### Phase 4 — QA integration (single Sonnet agent, medium effort)
- Swap placeholders for real variants in host imports.
- Run full `npm run test:run`, `npm run lint`, `npm run build`.
- Fix any cross-cutting issues.
- Add a Character Sheet spec assertion that `<app-dice-roller>` renders.

Sequential because Phase 3's output must be proven to compile together before Phase 4 can safely claim completion.

---

## 10. Testing Plan

### Service (`dice-roller.service.spec.ts`)
- `roll()` with single d6 → value in 1..6.
- `roll()` with 2d6 → two dice, total matches sum.
- Duality outcomes cover hope / fear / crit.
- Duality total adds hope + fear.
- `externalTrigger` sets pending + opens.
- `consumePendingRequest` returns then clears.
- `setTheme` persists, survives re-init (mocked localStorage).
- `clearHistory` empties log.

### Host (`dice-roller.spec.ts`)
- Renders the correct variant per theme signal.
- Always renders theme picker.

### Theme picker (`theme-picker.spec.ts`)
- Renders 5 swatches.
- Clicking a swatch calls `service.setTheme`.
- Active swatch reflects `service.theme()`.

### Each variant (`{name}.spec.ts`)
- Component creates.
- FAB click toggles `service.isOpen`.
- Menu renders when `isOpen` is true.
- Selecting dice + clicking Roll calls `service.roll` with correct request.
- Duality toggle drives `includeDuality`.
- History renders from `service.history()`.
- Hope/fear/crit label reflects duality result.

### Character Sheet (`character-sheet.spec.ts`)
- Assert `<app-dice-roller>` exists when data is loaded.

Coverage target: service ≥ 90%, variants ≥ 80% (per project convention).

---

## 11. Risks / Open Questions

- **Theme-picker vs FAB overlap on small viewports:** FAB is bottom-left, picker is bottom-right — they shouldn't collide unless a variant's menu extends full-width. Each design spec must confirm mobile/tablet behavior (stack vertically or dock picker at top-right instead).
- **`anyComponentStyle` budget (8kB hard error):** 5 visually rich variants risk budget breaches. Each variant's CSS must stay under 4kB; use CSS custom properties + shared utility classes. If any variant exceeds, split into additional CSS files.
- **Pre-existing lint/test errors noted in memory:** `auth.service.ts`, `auth.ts`, `auth-session.guard.spec.ts`, `home.spec.ts` — do NOT "fix" these as part of this work. Only ensure new files pass.
- **Crit tie behavior is 1/12 odds** — extra-prominent visual when it happens (acknowledged in each design brief).
- **Future card-feature trigger:** `externalTrigger(request)` is the single hook. Documented but no callers yet.

---

## 12. Exit Criteria

1. `npm run lint` → no new errors.
2. `npm run test:run` → all passing (including new specs).
3. `npm run build` → succeeds within budgets.
4. Character Sheet shows FAB + theme picker; clicking FAB opens the active variant's menu; rolling dice produces results; switching theme swaps the variant; `localStorage` remembers the last theme across reloads.
5. All 5 variants implement the shared contract.

---

## 13. Beads Issues to File (after plan approval)

- **Parent (feature)**: "Dice roller with 5 themed variants for Character Sheet."
- **Child (task)**: "Phase 1 — core infrastructure (service, model, host, picker, placeholders)." Blocks parent.
- **Child (task)**: "Phase 2 — design specs for 5 variants (parallel)." Depends on Phase 1.
- **Child (task)**: "Phase 3 — implement 5 variants (parallel)." Depends on Phase 2.
- **Child (task)**: "Phase 4 — integrate, test, build, polish." Depends on Phase 3.
- **Future (feature, not started)**: "Wire trait / card-feature rolls into DiceRollerService.externalTrigger."
