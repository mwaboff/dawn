# Dawn Quality Refactor Plan

**Date:** 2026-08-01. Produced from a six-agent audit (CSS, component reuse, TS architecture, character features, admin/GM/campaign features, hygiene). All file:line references verified against the tree on this date.

## The diagnosis in one paragraph

The codebase is far healthier than "AI slop" implies on most axes — lint clean, zero `any` in production code, 3,137 real passing tests, strict tsconfig, modern Angular throughout (standalone + OnPush + signals + `inject()`), and several exemplary subsystems (gm-screen panel architecture, admin card-search, the reference feature's decomposition). The genuine problems are concentrated: (1) **finished, tested components that were never wired in** while their markup is hand-inlined up to six times; (2) **copy-rename-diverge forks** (tab-nav, the four campaign lists, subclass-path-edit vs card-edit) several of which have *already* drifted into visible inconsistencies and one real math bug; (3) **no HTTP interceptors**, so `withCredentials` is typed 92 times and error handling is ad-hoc everywhere; (4) ~1,700–2,000 lines of duplicated/dead CSS bypassing an existing token/shared-style system; (5) ~2.6 MB of superseded parse artifacts shipped into every Docker build.

## Ground rules for every work package (WP)

These are binding on every implementing agent:

1. **Quality gate:** `npm run lint && npm run test:run && npm run build` must be green before a WP is complete. Run tests via the npm scripts only — bare `npx vitest` picks up orphaned worktree copies and reports thousands of phantom failures (until WP2.1 lands).
2. **No visual or behavioral change** unless the WP explicitly says otherwise. WPs that DO change behavior are tagged **[BEHAVIOR]** and say exactly what changes; that delta must be called out in the commit message.
3. **CSS specificity rule:** Angular emulated encapsulation means a component-level rule (`.btn[_ngcontent]`, specificity 0,2,0) beats a global rule (0,1,0). Migrating a component onto a global/shared class **must delete the component's copy in the same commit** — leaving both means the global rule silently loses.
4. **Pragmatic DRY:** consolidate only what this plan lists. The "Leave alone" section at the bottom is binding — those repetitions were audited and deliberately kept. Do not DRY beyond the plan.
5. **Tests move, they don't duplicate:** when merging components, fold the specs together (per `.agents/rules/testing.md`); when extracting, move the relevant assertions to the new unit.
6. **Task tracking:** file each WP as a `bd` issue before starting (per `AGENTS.md`); use the WP id (e.g. `WP3.1`) in the issue title. Follow the AGENTS.md session-completion workflow.
7. **Sizing:** each WP below is scoped for one Sonnet subagent in one session. Dependencies are listed; anything not listed as a dependency can run in parallel.

---

## Phase 1 — Bugs (do first; small, user-visible, no sign-off needed)

### WP1.1 [BEHAVIOR] Campaign sheet picker double-submit
`campaign-sheet-picker.ts:27` — the `submitting` signal is never set to `true`; its only reader is the button `[disabled]` (`campaign-sheet-picker.html:53`). Two fast clicks fire two POSTs. Set it around the request; reset on complete/error. Add a spec.

### WP1.2 [BEHAVIOR] Campaign mutation errors are swallowed
`campaign.ts` lines 97, 115, 131, 139, 160, 172, 183: `error: () => this.reloadCampaign()` — a failed kick/approve/reject shows nothing. Surface an error signal + template banner consistent with the feature's existing error styling. While there, note (do NOT change yet) that `campaign.ts:212-217` refetches the full 7-expand payload after every mutation instead of using the returned `CampaignResponse` — file a bd issue for that as a follow-up optimization.

### WP1.3 [BEHAVIOR] `:global()` is not Angular CSS — mobile refine sheet doesn't lock scroll
`reference.css:179` and `refine-sheet.css:76` use CSS-Modules `:global()` syntax, which browsers drop. Effect: `body-scroll-lock` (added by `refine-sheet.ts:54`) matches nothing, so the page scrolls behind the mobile sheet, and FilterRail keeps desktop `width:260px; position:sticky` inside the 280px sheet. Convert to the repo's established `::ng-deep` pattern. Also remove the duplicated "Refine" header (`refine-sheet.html:12` duplicates `filter-rail.html:2-7`).

### WP1.4 [BEHAVIOR] entity-select/-multi-select subscription bugs
- `entity-multi-select.ts:36-45`: `effect()` re-subscribes to `valueChanges` on every run — subscriptions stack, N parallel `loadOptions()` calls. Move to the `ngOnInit` pattern `entity-select` uses.
- `entity-select.ts:61`: subscribe without `takeUntilDestroyed` (line 48 in the same file does it right). Add it.
- `navbar.ts:42`: scroll listener with no teardown. Fix (host listener or explicit removal).

### WP1.5 [BEHAVIOR] Reference double debounce
`codex-search-bar.ts:53` debounces 250 ms and `reference.ts:155` debounces the result another 250 ms; because the effect at `reference.ts:157-181` also re-reads `filters()`/`currentPage()`, filter clicks and paging are delayed 250 ms with no typing involved. Keep exactly one debounce (in the search bar); make filter/page changes take effect immediately.

### WP1.6 [BEHAVIOR — needs decision D4 first] Unify the modifier engines
Three incompatible implementations of the ADD/SET/MULTIPLY fold:
- `character-sheet/utils/modifier-calculator.utils.ts:11-54` — SET → MULTIPLY (with `Math.floor`) → ADD
- `create-character/utils/stat-calculator.utils.ts:29-46` — sequential array order, no floor
- `shared/utils/feature-modifier.utils.ts:11-24` — ADD-only variant

Same character can show Evasion 12.5 in the creation wizard and 12 on the sheet. After D4 confirms the authoritative semantics (recommendation: the sheet's, matching the rulebook's stated ordering), pin the chosen behavior with tests FIRST, then collapse all three into `shared/utils/modifier.utils.ts` and delete the others.

### WP1.7 [BEHAVIOR] Mapper divergences + level-up loader divergence
- `class.mapper.ts:9` dropped the `?.length` guard the other six `mapFeature` copies have (emits `tags: []` vs `undefined`), and its `ClassCostTag` (`class-api.model.ts:1`) has a `{label, value}` shape whose `value` is never read — verify against the backend DTO and fix.
- `companion.mapper.ts:27` omits `metadata.expansionId`, so companion cards can never render an expansion column (`card-table.utils.ts:64`). Add it.
- `advancement-config.ts:223-236` is a third copy of the domain-card fetch that omits the `targetLevel` clamp and the owned-card filter that `domain-card-step.ts:127-145` and `domain-trade-step.ts:140-158` both apply — it can offer cards above the cap or already owned. Confirm intended behavior (almost certainly a bug), fix, and add specs. (Extraction of the shared loader is WP4.4; this WP only fixes the divergence.)

### WP1.8 Session-fetch on every navigation
`auth-session.guard.ts:10` (root `canActivateChild`, fires every navigation) and `admin.guard.ts:10` both call `checkSession()` (HTTP GET) even though `auth.service.ts:12` already holds the session in a signal. Entering `/admin` issues two identical requests. Add `AuthService.ensureSession()` with `shareReplay(1)` (copy the pattern from `expansion.service.ts:15-26`); both guards use it. Wire behavior identical except fewer duplicate requests.

### WP1.9 Type the RxJS error callbacks
14 `error: (err) =>` callbacks silently infer `any`. Type them `err: unknown` following `create-character.ts:490`, adding narrowing where they access `err.error` (e.g. `card-edit.ts:169-171`). Also delete the two casting-to-`never` artifacts (`loot.mapper.ts:29`, `subclass-path.mapper.ts:19` — both literals are valid `CardType` members) and the no-op `AuthService.handleError` (`auth.service.ts:111-113` plus its three `catchError` call sites at :70, :81, :88).

---

## Phase 2 — Deletion & repo hygiene (zero-risk, parallel-safe)

### WP2.1 Orphaned worktrees + vitest entrypoint
Delete `.claude/worktrees/agent-a4450aaa`, `agent-a86e6a91`, `agent-ae518a3c`, and `.worktrees/feature` (17 MB, gitignored, not registered worktrees — verify with `git worktree list` first). Add a `vitest.config.ts` excluding those paths so bare `npx vitest` stops reporting 2,073 phantom failures.

### WP2.2 Dead files
Delete (each verified as zero non-spec references):
- `create-character/components/equipment-selector/equipment-selector.{ts,html,css,spec.ts}` — the 4 top-level files ONLY; the children under `equipment-selector/components/` are live (`create-character.ts:20-21` imports them directly). Note its CSS contains a 75-line duplicate of `create-character.css:77-151`.
- `shared/components/daggerheart-card/daggerheart-card.mock-data.ts`
- `ohsheet.ico` at dawn root (byte-identical to `public/favicon.ico`, unreachable)
- Uncalled methods: `character-sheet.ts:148` `canEquipWeaponInSlot()` (⚠ only after WP3.3 lands), `character-sheet.ts:281` `isWeaponEquipped()` (test-only callers — delete method + those two assertions), `domain-trade-step.ts:101` `isCardTradedOut()`, `GmScreenContext.refreshCampaign()` (`gm-screen-context.service.ts:57-63`), `PanelLayoutStore.orderIds` (`panel-layout.store.ts:15,124`), `MasonryGridDirective.rowHeight`/`gap` inputs (`masonry-grid.directive.ts:24-25`).
- Drop `export` from the twelve internal-only symbols listed in the char-features audit (`beastform-section.ts:11,17`, `character-sheet-assembler.utils.ts:6`, `experience.model.ts:6-12`, `character-sheet-api.model.ts:112-128`, `level-up-request-assembler.utils.ts:3`).
- `character-sheet-api.model.ts:277-282`: delete `@deprecated` `classId`/`className` (no readers); KEEP `class` (read at `character-sheet-view.mapper.ts:117`).

Do **NOT** delete `gold-tracker/` or `expandable-card-list/` — they get wired in (WP3.1/3.2).

### WP2.3 Dead CSS
- `admin/card-edit/card-edit.css`: 201 of 238 lines reference classes absent from its template (they moved to child components). Deleting them also clears the one file breaching the 8 kB `anyComponentStyle` **error** budget. Verify each class against `card-edit.html` before deleting.
- `character-sheet-layout.css:67-82` (dead inventory block — that UI lives in `InventorySection` with byte-identical rules at `inventory-section.css:9-17`). Keep line 66.
- `inventory-section.css:18` (byte-identical copy of the global `.empty-state`).
- The four redundant `@keyframes fadeInUp` redeclarations that are identical to a local 12px variant (`campaigns.css:91`, `campaign.css:128`, `campaign-summary.css:197`, `create-campaign.css:194`) — see D7 before touching the 12px-vs-20px question; if D7 is undecided, dedupe only the byte-identical copies into `roster.css`'s.
- `result-section.css:1-4` (`:root` block inside a component stylesheet — can never match).

### WP2.4 Docker/docs hygiene
- Add to `.dockerignore`: `data/`, `scripts/`, `docs/`, `DOMAINCRDS.html`, root `*.md` — ~2.6 MB out of every image and layer-cache invalidation fixed. Do this regardless of D1.
- `git rm --cached` the four `data/` files still tracked despite `.gitignore:62`.
- Move `2026-03-22-inventory-frontend-transition-guide.md` and `frontend-bonus-domain-card-selections.md` from dawn root into `docs/`; archive `docs/PLAN-*.md` for shipped features (verify shipped via git log first).
- Fix `README.md`: remove the link to nonexistent `docs/BACKEND_API_REFERENCE.md` and the pre-`features/` example paths.

### WP2.5 [needs D1] Superseded parse tooling
If D1 approves: delete `DOMAINCRDS.html` (231 KB), `scripts/` (64 KB), `data/` (1.9 MB incl. `data-backup/`). `core-import/` at the monorepo root is the authoritative replacement (verified record-for-record on communities/ancestries/armor; 546 vs 373 adversaries). Git history recovers them if ever needed.

---

## Phase 3 — Adopt the components that already exist (biggest wins; tests already written)

### WP3.1 Wire `ExpandableCardList` into character-sheet
`character-sheet/components/expandable-card-list/` (360 lines incl. a 200-line spec with 21 real tests) is imported by nothing, while `character-sheet.html` hand-inlines its exact markup **six times**: Class 379-417, Subclass 419-468, Ancestry 470-508, Community 510-548, Equipped-domain 554-616, Vault 641-707 (~240 template lines; `feature-row__name` appears 9×).

Pre-work on the component: (a) accept expansion state as an input — the parent shares one `expandedIds` set across all groups (`character-sheet.ts:53`) while the component owns it privately (`expandable-card-list.ts:23`); (b) add optional `<ng-content>` for the vault/equip swap button (`character-sheet.html:603-609`) and a `count` input for the header (`:556-559`). Then replace all six blocks. DOM classes/ids/aria must come out identical — diff rendered output in the spec. Fold relevant `character-sheet.spec.ts` assertions down.

### WP3.2 Wire `GoldTracker` and `EquipmentCard`
- `gold-tracker.html` (22 lines) is byte-identical to `character-sheet.html:350-374` — swap in `<app-gold-tracker>`; delete `gold-tracker.css`'s duplicate of `character-sheet-layout.css:49-64` (specificity rule!).
- `EquipmentCard` is used only by `inventory-item-row.html:11` while `character-sheet.html:192, :260, :307` hand-roll the same markup (~150 lines incl. two identical inline burden-icon SVGs) for equipped primary/secondary/armor. Replace with three `<app-equipment-card>` tags. First deepen `equipment-card.spec.ts` (currently 11 existence-only tests — add interaction/output coverage), since this makes it load-bearing in four places.

### WP3.3 Consolidate the weapon-equip rules
Two parallel implementations of slot-occupancy + two-handed exclusivity: `character-sheet.ts:125-156` (whose `canEquipWeaponInSlot()` is already template-dead) and `inventory-section.ts:80-98` (the one actually driving the UI). Diff both against their specs; consolidate onto one implementation in a util next to `beastform-access.utils.ts`, used by both components. Then WP2.2's deletion of the dead method proceeds.

---

## Phase 4 — Kill the copy-rename-diverge forks

### WP4.1 One step-trail component (tab-nav merge)
`create-character/components/tab-nav/` and `level-up/components/level-up-tab-nav/`: CSS byte-identical (241 lines; the 11 diff hunks are all deleted comments), computeds and effects identical, HTML differs in `aria-label`, id prefix, and one escape hatch (`level-up-tab-nav.ts:60`: `domain-trades` always enabled). Promote to `shared/components/step-trail/`, generic over the tab-id type, with `idPrefix`, `ariaLabel`, `alwaysEnabledTabIds` inputs. Merge the 662-line and 431-line specs. Rendered DOM (ids, aria attributes) must match what each flow renders today.

### WP4.2 Campaign roster consolidation (~1,000 lines)
`campaign-character-list`, `campaign-npc-list`, `campaign-player-list` are one component three times (npc vs character CSS: one diff hunk; handler bodies identical; npc-list is a strict subset of character-list). `campaign-pending-list` shares the row shell but has a different action model (always-visible Approve/Reject, no confirm) — do NOT force it into a mode flag; share via projected actions.

Build one roster-row/list component with `<ng-content>`-projected actions; delete `campaign-npc-list` outright (character-list + `emptyText` input covers it); migrate all onto the already-global `shared/styles/roster.css` (delete the local duplicates same-commit); also migrate `campaigns.css:48-89`'s `campaigns-*` re-derivation. **Keep the current text-based "Remove?/Yes/Cancel" confirm exactly as rendered today** — adopting `InlineDeleteConfirm`'s icon style is decision D6, not part of this WP.

### WP4.3 `LevelDownAction` extraction
`level-up.ts:63-64,227-247` + `level-up.html:117-127` duplicate `level-down.ts:24-25,40-60` + `level-down.html:45-55` verbatim, including the user-facing confirmation copy and the same undo-level-up call. Extract a small `LevelDownAction` component used by both. (~45 lines.) **Scope guard (per Michael):** level-up and level-down are different features hitting different endpoints — level-up is a full wizard, level-down is essentially a confirmation page. This shared confirm action is the ONLY overlap; do not attempt any broader merge, shared wizard machinery, or direction-parameterized component.

### WP4.4 Level-up domain-card loader
Extract `loadSelectableDomainCards(...)` into `level-up/utils/` from the two identical copies (`domain-card-step.ts:127-145`, `domain-trade-step.ts:140-158`); after WP1.7 fixed `advancement-config.ts`'s divergence, migrate it onto the same util.

### WP4.5 Reference template collapse
`reference.html:77-148` (`focusedSearch`) and `:150-220` (`focusedBrowse`) are the same 70-line block twice, differing only in the empty-state variant string and error copy; the surrounding `@switch` also restates the refine-button/rail/error trio in all three non-landing cases. Merge to one parameterized branch (~120 lines). Extract the `typeLabels[t] ?? t` / `typeGlyphs[t] ?? '◆'` pair (copied at `type-facet-tabs.ts:38-39`, `landing-type-grid.ts:38-39`, `result-section.ts:24-25`) into a 2-function util. Also hoist reference's magic `3` (`reference.ts:127,:294`, `reference.html:14`) to share admin's `MIN_QUERY_LENGTH` (`card-search.params.ts:4`) via a shared constant.

### WP4.6 Admin consolidation
- **One `<app-edit-toolbar>`:** `card-edit-toolbar` and `user-edit-toolbar` have identical templates (`*.html:1-9`) and same inputs/outputs/two-stage confirm signals. Merge into `admin/components/`. (~70 lines)
- **`useCardEditForm()` factory:** the four blocks `subclass-path-edit.ts` reproduces from `card-edit.ts` character-for-character — preview-card builder (81-98 vs 106-125), backend-error handling (169-180 vs 198-210), `getDependsOnControl` (115-122 vs 153-160), `bumpFormVersion` (75,128-130 vs 79,162-164), save orchestration (132-182 vs 166-213). Factory returns `{previewCard, hasPendingChanges, getControl, getDependsOnControl, handleSaveError}`. (~120 lines; the backend `fieldErrors` contract handling is the lockstep hazard motivating this.)
- **Service layer:** `subclass-path-edit.ts:245,292-299` injects raw `HttpClient` and builds URLs inline while `AdminCardService` is injected in the same file (:65). Move those calls into the service.
- **One `.panel` definition:** `card-edit.css:1-24` and `subclass-path-edit.css:248-270` define `.panel`/`.panel__title`/`.panel__grid` with *different values* for the same markup — pick the intended rendering (they've already diverged; screenshot both first), move to `shared/styles/`, delete both local copies.
- **Typed forms:** delete the widening `: FormGroup` annotations that discard inference (`user-edit.ts:59`, `card-edit.ts:77`, `subclass-path-edit.ts:46`, `card-edit-features.ts:39,47,48`, `user-edit-identity-panel.ts:22`) and remove the downstream re-assertion casts they necessitated (`card-edit.ts:119`, `subclass-path-edit.ts:157`, `card-edit-field.ts:83,87`).

### WP4.7 Campaign/GM permission-shell share
`campaign-gm-screen.html:4-28` reproduces `campaign.html:4-24` (prefix-renamed, same user-facing strings) plus one extra branch, with separately maintained skeleton/error CSS. Extract a small shared shell or shared stylesheet — strings must stay in lockstep. Also promote `canManage` (duplicated at `campaign.ts:47-56`, `campaign-gm-screen.ts:37-42`, and effectively `dashboard.ts:59-62` — the code comment at the first site says to promote at the third consumer, which now exists) into a shared `isCampaignGameMaster` util.

---

## Phase 5 — Cross-cutting TS infrastructure

### WP5.1 HTTP interceptors
Create `core/interceptors/`:
- `credentials.interceptor.ts` — `next(req.clone({withCredentials: true}))`; delete all 92 `withCredentials: true` literals across 26 service files.
- `api-url.interceptor.ts` — rewrite relative `/dh/...` requests onto `environment.apiUrl`; delete the 37 per-service `baseUrl` interpolations.
- `error.interceptor.ts` — normalize `HttpErrorResponse` into a typed app error (collapsing the 10 repeated `err?.error?.message ?? 'Failed to…'` chains) and centralize 401 handling (currently only `auth.service.ts:102-107` reacts to 401).
Register in `app.config.ts` (currently bare `provideHttpClient(withFetch())`). Also add a global `ErrorHandler` provider so unhandled failures surface. Wire-format must be byte-identical — verify with the existing `HttpTestingController` specs (48 specs assert `withCredentials` etc.; update them to assert the interceptor chain instead).

### WP5.2 [BEHAVIOR in 7 components] `requestState()` helper
21 components hand-roll the `loading/error/data` triple across 28 fetch sites (canonical copy: `armor-section.ts:23-66`); 61 of 107 subscriptions have no teardown. Add `shared/utils/request-state.ts`: `requestState<T>()` returning `{data, loading, error, run(obs)}` with `takeUntilDestroyed` baked in. Adopt at the read-and-display sites; use `rxResource` for the two level-up steps (`domain-card-step`, `domain-trade-step` — gains cancel-on-param-change). **[BEHAVIOR]**: the 7 components that declare `loading` only and swallow errors (`domain-card-step.ts:34`, `domain-trade-step.ts:40`, `advancement-config.ts:39,44,48`, `countdowns-panel.ts:43`, `campaign-gm-screen.ts:33`, `campaign.ts:39`, `entity-multi-select.ts:33`) gain an error state — error UI appears where previously nothing did. **Do NOT convert** the optimistic-write paths (`character-sheet.ts`, `create-character.ts`, `card-edit.ts`, `user-edit.ts`) — they have rollback semantics this doesn't model.

### WP5.3 One API contract
- Delete the duplicate DTO block `create-character/models/character-sheet-api.model.ts:132-233` (second copies of `WeaponResponse`, `ArmorResponse`, etc. with drifted field shapes); re-export from `shared/models/`, marking sheet-absent fields optional.
- Create `shared/models/common-api.model.ts` for the leaf types currently declared 8-12× (`CostTagResponse`, `ModifierResponse`, `FeatureResponse`, `DamageRollResponse`, `Trait`, `Range`, `DamageType`). Fix the inverted dependency (shared models importing `ModifierResponse` from `features/create-character/models/`).
- `UpdateCharacterSheetRequest = Partial<CreateCharacterSheetRequest>` (deletes 38 mirrored lines).
- Replace the four bespoke pagination envelopes (`PaginatedWeapons` etc.) with the existing generic `PaginatedResponse<T>` (`shared/models/api.model.ts:3`).
- Rename one of the two colliding `DiceType` exports (`weapon-api.model.ts:10` vs `dice-roller.model.ts:1`).
- Investigate `admin-api.model.ts:19`'s `[key: string]: unknown` index signature (defeats excess-property checking for the admin editor) — narrow if feasible.

### WP5.4 Catalog cache
Generalize the `AdminLookupService` pattern (`admin-lookup.service.ts:25-53`, `Map<string, Observable>` of `shareReplay`s — the best of the four coexisting cache idioms) into a `CatalogCache` used by the seven uncached catalog fetches (`getDomainCards`, `getAncestries`, `getCommunities`, `getClasses`, `getSubclassPaths`, `getAllBeastforms`); then delete the six component-local memo guards (`create-character.ts:255-257,276,296,320-322`, `inventory-add-panel.ts:32`, `beastform-section.ts:126`). Immutable reference data → behavior-preserving.

### WP5.5 `optimisticSave()` / debounced-saver factory
The `debounceTime(800) → switchMap → markSaving → tap(commit+clear) → catchError(rollback+clear) → EMPTY` pipeline is written 4× in `character-sheet.ts:586-707` and 6× across gm-screen (`fear-counter-panel.ts:47-69`, `gm-notes-panel.ts:57-83`, `countdowns-panel.ts:86-161`), with the saving-key registry independently reinvented twice (`gm-screen-context.service.ts:31,66-79` vs `character-sheet.ts:70,700-706`). Extract one `createDebouncedSaver(...)` + shared saving-registry helper. The rollback pairing (markSaving/clearSaving/rollback must fire together) is the hazard motivating this. Character-sheet adoption can be folded into WP7.1 if the same agent does both.

### WP5.6 The three `getX`/`getXRaw` twins only
`weapon.service.ts:34-75` vs `:77-118` (41 identical lines differing in final projection), same twin in `armor.service.ts:30-90` and `loot.service.ts:21-79`. Collapse each pair into one method + projection argument. **Stop there** — the other 14 pagination-unwrap blocks stay (see Leave-alone list).

### WP5.7 Formatter utils
- `formatModifier` (`value >= 0 ? '+'+v : v`) exists 7× under 5 names, and `trait-selector.ts:62` uses `v > 0` — so zero renders `0` there and `+0` everywhere else. Consolidate into `shared/utils/number-format.utils.ts`; **decision D5a** picks the zero rendering.
- `formatTitleCase` × 8 (locations in arch audit) → `shared/utils/text.utils.ts`.
- `formatDate`: `user-list.ts:124-129` (`toLocaleDateString`) vs `user-edit-identity-panel.ts:53-57` (`toLocaleString`) vs `profile.ts:66-74` — two admin screens already disagree on showing the time. **Decision D5b** picks the canonical format(s); then one util.

### WP5.8 Subscription hygiene sweep
After WP5.2, sweep the remaining ~21 bare command-style `.subscribe()` calls with `takeUntilDestroyed` — priority on the four that `router.navigate` after teardown (`create-character.ts:485`, `level-up.ts:213`, `campaign-join.ts:24`, `navbar.ts:105`) and the concentrations in `character-sheet.ts`, `campaign.ts:95-204`, `profile.ts:133-200`. Also modernize `codex-search-bar.ts:47-64`'s hand-rolled `destroy$` and, opportunistically, its 4 `@ViewChild`s to signal queries (the last in the app, all in `features/reference/`).

---

## Phase 6 — CSS consolidation

### WP6.1 Shared page-shell stylesheet
Model on the existing `shared/styles/gm-screen-shell.css`. Move the byte-identical page chrome — the 2-layer radial+linear background (5 files), divider pair (4), eyebrow (4), `clamp()` page title (4) — into `shared/styles/page-shell.css`; migrate `campaigns.css`, `create-campaign.css`, `campaign.css`, `campaign-join.css`, `profile.css`, `campaign-summary.css`, `home.css`, `error-page.css`, deleting local copies same-commit. Exact selectors/values in the CSS audit. Optionally add `parchment-page.css` for the create-character/level-up/level-down triple (`create-character.css:6-39`, `level-up.css:6-36`, `level-down.css:3-24`).

### WP6.2 Form controls onto the global `.form-*` system
`styles.css:143-210` already defines the full form system. Migrate the seven admin re-implementations (`card-edit.css:107`, `card-edit-field.css:21`, `card-edit-features.css:224`, `bulk-upload.css:17`, `card-search.css:40`, `user-list.css` filter-input, `user-edit-identity-panel.css:38`) onto it, deleting local copies. **Careful case:** `create-campaign.css:85-142` shadows the global `.form-label`/`.form-input`/`.form-error` names *with different values* — that page currently renders the local version; preserve its current look (either keep the override or rename its classes), don't silently restyle it.

### WP6.3 Buttons onto global `.btn`
`home.css:37-48,134-155` (single-dash `.btn-primary` variant — a global button change won't reach home today), `subclass-path-edit.css:273-311` (redeclares the exact global names with different values — screenshot first, preserve current rendering), `bulk-upload.css:59`. Migrate to `shared/styles/buttons.css` BEM classes where rendering is identical; where the local values differ, preserve the current look explicitly.

### WP6.4 Tokens
- Add alpha-variant tokens (`--color-accent-a12/-a20/-a35`, parchment equivalents) targeting the single most-repeated string in the codebase (`rgba(212,160,86,…)` on 289 lines / 74 files). Migrate mechanically; do NOT do a blanket literal→var sweep beyond the alpha variants (byte-size inflation, no gain).
- Hoist the `--gm-*` tokens from `.gm-panel` to `.gm-screen-shell` (unblocks the fear panel; 13 files currently hardcode `rgba(245,230,211,.68)` as a workaround), then dedupe the counter-widget CSS (`fear-counter-panel.css:45-72` vs `countdown-row.css:40-74`).
- Add the "light parchment" palette (`#d4a056` 90×, `#7a5c46` 32×, `#c9a87c` 24× in the character features) as tokens; migrate opportunistically.
- Replace hard-coded `top: 96px` with `var(--nav-height)` (`reference.css:42`, `filter-rail.css:1`).
- Fill the empty `shared/styles/inline-confirm.css` placeholder or delete it.

### WP6.5 [BEHAVIOR — pixels already inconsistent] Same-state visual unification
These duplications already produced visibly different renderings of the same semantic state; unifying them changes pixels somewhere by definition (pick per D7):
- Three "Ended" badge treatments (`campaigns.css:64-68` fill, `campaign-summary.css:35-46` fill/larger, `campaign-roster.css:3-14` border) + dashboard omits the badge entirely (`dashboard.html:72`).
- `.preview-live-pill` defined differently in `card-edit-preview.css:13` (gold) vs `user-edit-preview.css:13` (green); also `user-edit-preview` lacks card-edit-preview's `@media (max-width:900px)` unsticking rule — add it.
- `home.css:59-90` re-implements `.grain-overlay`/`.vignette-overlay`/`.decorative-ornament` from `styles.css:105-125` incl. a byte-identical inline SVG data-URI — migrate home to compose the globals like `auth.html:2-8` does.
- Navbar link set enumerated twice (desktop `navbar.html:6-67`, mobile `:81-100`) — extract the link list to a constant/`@for` so items can't drift.
- `campaign-invite.ts:32` join-URL string vs `app.routes.ts:64` — derive from one route constant.

### WP6.6 Small exact-duplicate cleanups
`.card-swap-btn` (`character-sheet-panels.css:24` ≡ `inventory-item-row.css:20`), `.expandable-card` triplication (resolves mostly via WP3.1), `.class-pill`/`.level-pill` (`advancement-config.css:33-42` ≡ `domain-card-step.css:38-47`), `.step-instruction` ×3-4, remaining exact dupes from the CSS audit's cluster 7. Shared class or one canonical location each; delete copies same-commit.

---

## Phase 7 — God-component decomposition (largest effort, most spec churn — do after the above has shrunk them)

### WP7.1 `character-sheet.ts` (707 lines / 758-line template; spec is 1,837 lines)
By this point WP3.1/3.2 (cards, gold, equipment) and WP5.5 (save-pipeline factory) have already removed big chunks. Remaining seams, in order of independence:
1. **Notes editor** → child component (own permission gate + save pipeline; `:94-105, 255-266, 668-697` / template `:709-755`).
2. **Resource trackers** → one `ResourceTracker` child used 4× (hp/armor/hope/stress; `:56-79, 206-220` / template `:100-173` — four identical `resource-box` blocks).
3. **Inventory mutations** (`:295-547`, six methods, identical optimistic-update→PATCH→rollback shape) → `InventoryMutationService` or utils.
4. **Domain-card vault/equip swap** (`:226-240, 268-279, 549-584`) → lives with the cards section.
5. **Weapon equip rules** — already extracted in WP3.3.
Move spec blocks with each extraction; total `it()` count must not drop.

### WP7.2 `create-character.ts` (570 lines)
- The four load-once-and-cache triples (class `:519-533`, subclass `:249-273`, community `:295-313`, domain `:315-341`) collapse via WP5.2's `requestState()`/WP5.4's catalog cache (~70 lines). Note `.agents/rules/component-design.md` already mandates this pattern — the file has drifted from its own documented rule.
- Extract the step-completion state machine (`invalidateSteps`/`isTabReachable`/`markStepComplete`, `:172-197, 535-569`) and the submission pipeline (`:447-517`) into utils/child state.
- `weapon-section.ts` + `armor-section.ts`: strongest near-duplicate pair (same signal quadruple, seed-then-load, pagination). Extract a `PaginatedCardSection` base or shared helper absorbing all three call sites (weapon runs it twice internally). Also bring `armor-section.spec.ts` (7 tests) up to weapon-section's coverage (27) as part of the move.

---

## Phase 8 — Guardrails (prevent recurrence)

### WP8.1 Lint & test hardening
- Enable `tseslint.configs.recommendedTypeChecked` (expect an initial backlog; burn down in the same WP or file bd issues per rule).
- Add the missing spec for `shared/components/confirm-dialog` (Escape-key + backdrop-vs-content click discrimination — a11y-critical, currently unverified). Optionally the three admin user-edit subcomponents and `masonry-item.directive`.
- Add a keyboard path for `refine-sheet.html:1`'s backdrop dismiss (or verify Escape is handled on the sheet).
### WP8.2 Docs
`dawn/CLAUDE.md` conventions update (done alongside this plan); ensure `.agents/rules/component-design.md`'s size thresholds and data-loading pattern reflect the new shared helpers (`requestState`, `createDebouncedSaver`, `CatalogCache`, `step-trail`).

---

## Decision gates (user input needed; blocking only the WPs that cite them)

| ID | Decision | Recommendation |
|---|---|---|
| D1 | Delete `dawn/data/` + `scripts/` + `DOMAINCRDS.html` (superseded by `core-import/`)? | Yes — git history retains them |
| D2 | `encounter-builder-panel` ("Coming soon" in prod) and the unused `steps` block kind: planned work or cut? | Cut until scheduled |
| D3 | `codex-search-bar` filter-chip UI (~80 dead lines, half-built): finish or cut? | Cut; re-add when designed |
| D4 | Authoritative modifier semantics (WP1.6) | Sheet version (SET→MULTIPLY(floor)→ADD) per rulebook ordering |
| D5a | `formatModifier(0)` → `"+0"` or `"0"`? | `+0` (majority behavior today) |
| D5b | Canonical date format(s) for admin/profile | date-only for lists, date+time for identity panel — but your call |
| D6 | Adopt `InlineDeleteConfirm` (icon style) in campaign lists, or keep text "Remove?" style? | Keep text style for now (no visual change) |
| D7 | "Ended" badge canonical treatment; `fadeInUp` 12px vs 20px | Fill style + 12px (majority) |
| D8 | Admin pagination onto shared `pagination-controls` (adds arrows, drops `showingRange`)? | Defer — cosmetic change, low value |
| D9 | `ConfirmDialog` → `ModalShell` with `<ng-content>` so `add-expansion-dialog` can adopt it (API change, 7 consumers)? | Yes, worth it |
| D10 | `RosterList` click-`<li>` vs dashboard's real `<a routerLink>`: converge on anchors (better a11y, middle-click)? | Yes — move RosterList toward anchors; visible focus behavior may change slightly |
| D11 | Route params: adopt `withComponentInputBinding` inputs so `/character/1`→`/character/2` refetches (currently doesn't)? | Yes but as its own explicitly-tested change; it's provided-but-unused today |

## Leave alone — audited and deliberately kept (binding)

- The 14 non-twin pagination-unwrap blocks and the 96 `if (x !== undefined) params.set(...)` guards — per-service readability beats a clever generic.
- `review-section` vs `level-up-review`; the two review sections differ in substance.
- `equipment-pagination` vs shared `pagination-controls` (windowed numbered pages vs prev/next — different components).
- `entity-select` vs `entity-multi-select` templates (only the loading wiring is shared — WP1.4 fixes the bugs).
- `type-facet-tabs` vs `landing-type-grid`; `refine-sheet`'s composition of `filter-rail`; `codex-skeleton` adapter.
- The gm-screen panel architecture, the nine `content/*.content.ts` data files, `card-search.ts`/`card-table.utils.ts`.
- **level-up vs level-down as features** — different endpoints, different shapes (wizard vs confirmation page). They stay fully separate; the only sanctioned sharing is WP4.3's confirm action.
- `user-list`'s hand-rolled list vs `card-table` (different shapes; correct as-is). `card-table` vs `user-edit-history-list`: merge-and-extend only if/when someone needs the union.
- `card-edit-schema.ts`'s repeated field groups (declarative data, reads as a table).
- The 15+ empty-state vocabularies (2-4 trivial lines each; a shared component would be indirection for nothing).
- `auth.html`/`choose-username.html` shell markup (CSS already shared via `auth-page.css`).
- The `effect()`-input-seeding idiom in trait/experience selectors; misc 3-10-line pill/focus-ring repetitions not listed in Phase 6.
- The two documented store idioms (`panel-layout.store.ts` factory vs route-scoped `GmScreenContext`) — both deliberate.
- **No Tailwind migration of layout primitives** (~750 occurrences) — template-touching, unverifiable by CSS diff, real visual-regression risk. Separate initiative if ever.

## Suggested execution order & parallel lanes

Phases 1 and 2 first (parallel-safe across WPs, except WP2.2's dead-method deletion waits on WP3.3). Then:
- **Lane A (components):** WP3.1 → WP3.2 → WP3.3 → WP4.1 → WP4.2 → WP4.3/4.4
- **Lane B (TS infra):** WP5.1 → WP5.2 → WP5.3 → WP5.4/5.5/5.6/5.7 → WP5.8
- **Lane C (CSS):** WP6.1 → WP6.2/6.3 → WP6.4 → WP6.6 (WP6.5 after D7)
- **Lane D (admin/reference):** WP4.5 → WP4.6 → WP4.7
Phase 7 after lanes A+B land; Phase 8 last. Lanes touch mostly disjoint files; where they collide (character-sheet is touched by A, B, and 7), sequence within the lane ordering above.

Estimated removal: ~1,700–2,000 CSS lines, ~1,500+ TS/template lines, 17 MB repo weight, 2.6 MB Docker context — with net-new shared infrastructure of roughly 6 small components, 3 interceptors, and 5 utility modules.
