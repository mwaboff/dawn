# Oh Sheet Frontend — Feature Inventory

Source: `dawn/src/app`. Purpose: a route-by-route, feature-by-feature catalog detailed enough to
compare against the Daggerheart rulebooks without reading the code. For every feature: name,
route/component, what it does, and visible limitations (including things it explicitly does NOT
do).

Router source of truth: `dawn/src/app/app.routes.ts`, `dawn/src/app/features/admin/admin.routes.ts`.

---

## 0. Global mechanics that apply everywhere

### Dice Roller (floating widget)
- **Component**: `shared/components/dice-roller/dice-roller.ts`, backed by
  `core/services/dice-roller.service.ts`. Appears on: the classic and beta character sheet, the
  standalone GM Screen, and the campaign GM Screen.
- **What it does**: A floating-action-button-triggered tray. Player picks a count (+/-) for each of
  d4/d6/d8/d10/d12/d20/d100, and independently can toggle "Duality" (2d12, Hope die vs Fear die).
  Rolling animates for 250ms then shows the result. Duality results resolve to `crit` (equal
  values), `hope` (hope > fear), or `fear` (fear > hope), with the outcome labeled "Critical
  Success!", "with Hope", or "with Fear". A roll history list is kept in-session.
  Random numbers use `crypto.getRandomValues` in-browser (falls back to `Math.random` off-browser).
  Other features (Refresh Focus on the character sheet) call the dice service directly rather than
  going through this UI, and can pre-load the tray with a specific request via
  `externalTrigger`/`pendingRequest`.
- **Limitations**: Purely client-side; nothing about a roll is sent to or validated by the
  backend except the caller-supplied final numbers on things like Focus. No advantage/disadvantage
  d6 modifier control, no "roll against threshold" evaluation, no critical-hit-on-doubles logic
  for regular (non-Duality) dice, no integration with a specific move/card ("roll for X") beyond
  the manual Focus refresh flow. Persisted only as an in-memory theme preference
  (`oh-sheet:dice-roller-theme` in localStorage) — roll history does not survive a reload.

### Preferences (site-wide)
- **Route/Component**: `/preferences` → `features/preferences/preferences.ts`, backed by
  `core/services/preferences.service.ts`.
- **Settings**: Density (`comfortable` default / `condensed`), Motion (`system` default /
  `reduced` / `full`), Sheet Layout (`classic` default / `beta`), Card Theme (`default` /
  `light` beta-badged / `dark`). All persisted to `localStorage` only — not synced to the account
  server-side, so they are per-browser, not per-user.
- **Sheet Layout** is the switch that decides which of the two character-sheet route
  implementations serves `/character/:id` (see §2). It is read by a router `canMatch` guard
  (`sheet-layout.guard.ts`) synchronously from localStorage before any HTTP call, so navigation
  never even downloads the code chunk for the layout the player isn't using.

---

## 1. Routing map

Declared in `app.routes.ts` (all children of a root `authSessionGuard`, which redirects any
signed-in user who hasn't chosen a username yet to `/choose-username`):

| Path | Component | Notes |
|---|---|---|
| `/` | `Home` (embeds `Dashboard`) | Landing/marketing copy for signed-out users; a personal dashboard for signed-in ones |
| `/reference` | `Reference` | The Codex — search/browse all game content |
| `/gm-screen` | `GmScreen` | Static rules-reference board + dice roller (campaign-free) |
| `/encounters` | `Encounters` | List of the caller's saved encounters + active runs |
| `/encounters/new`, `/encounters/:id/edit` | `EncounterBuilder` | Create/edit an encounter |
| `/encounters/:id/run` | `EncounterRunPage` | Live HP/Stress/token tracking for a fight |
| `/items/new`, `/items/:type/:id/edit` | `ItemBuilder` | Homebrew weapon/armor/loot editor |
| `/auth` | `Auth` | Sign-in (Google OAuth + dev email login in non-prod) |
| `/auth/callback` | `AuthCallback` | OAuth redirect handler |
| `/choose-username` | `ChooseUsername` | First-login username claim |
| `/create-character` | `CreateCharacter` | Character-creation wizard |
| `/character/:id/level-up` | `LevelUp` | Level-up wizard |
| `/character/:id/level-down` | `LevelDown` | Undo the most recent level-up |
| `/character/:id` | `CharacterSheet` (classic) or `CharacterSheetBeta` | Which one serves depends on the `sheetLayout` preference; both routes share the same path, resolved by a `canMatch` guard |
| `/profile`, `/profile/:id` | `Profile` | Own or another user's public roster (characters/campaigns/encounters/homebrew) |
| `/preferences` | `Preferences` | Display/UX settings |
| `/campaigns` | `Campaigns` | List of the caller's campaigns |
| `/campaigns/create` | `CreateCampaign` | New campaign form |
| `/campaigns/join/:token` | `CampaignJoin` | Redeem an invite link |
| `/campaign/:id` | `Campaign` | Campaign home (roster, invites, NPCs, submissions) |
| `/campaign/:id/gm-screen` | `CampaignGmScreen` | Campaign-scoped, interactive GM dashboard |
| `/player/:id` | redirect → `/profile/:id` | Legacy alias |
| `/admin` (+ children) | `Admin` shell | ADMIN/OWNER-only tools, gated by `adminGuard` |
| `/403`, `**` | `ErrorPage` | Access-denied / not-found |

Route guards:
- `authSessionGuard` — calls `/auth/me`; forces `/choose-username` if the account has no username
  yet. Does not block anonymous browsing (most routes are readable while signed out, individual
  services 401 as needed).
- `adminGuard` — requires role ADMIN or OWNER; redirects to `/403` otherwise.
- `classicSheetGuard` (`canMatch`) — synchronous localStorage read of the sheet-layout preference.

---

## 2. Character Builder (`/create-character`)

Component: `features/create-character/create-character.ts` (+ `models/create-character.model.ts`
for the tab list). A single-page tabbed wizard; tabs are gated so a step is only reachable once
every prior step is complete. Tabs are dynamically added/removed based on class choice:

| Tab id | Always shown? | Shown when |
|---|---|---|
| Class | always | — |
| Subclass | always | class chosen |
| Companion | conditional | subclass grants the Beastbound Ranger's "Companion" foundation feature |
| Martial Stances | conditional | subclass grants the Martial Artist's "Stance Fighter" foundation feature |
| Ancestry | always | — |
| Community | always | — |
| Traits | always | — |
| Starting Weapon | always | — |
| Starting Armor | always | — |
| Experiences | always | — |
| Domain Cards | always | subclass chosen (domains + level-1 cap of 1 derived from subclass) |
| Bonuses | conditional | a chosen subclass/ancestry/community/domain-card feature grants `BONUS_EXPERIENCE_MODIFIER` points |
| Review | always | last step; submits the character |

Per-step detail:

- **Class**: Card grid of all classes (`ClassService`). Selecting one unlocks Subclass.
- **Subclass**: Card grid scoped to the chosen class (`SubclassService.getSubclasses(classId)`).
  Changing subclass after a prior selection clears anything downstream of it (domain cards,
  martial stances, companion draft).
- **Companion** (Beastbound Ranger only): `CompanionCreator` — a toggle ("I want to start with a
  companion") that reveals a form: name, description, Evasion, attack name/range/damage dice,
  Stress max, and exactly 2 starting Experiences (name only, fixed +2 modifier — no point-buy at
  creation). Always skippable ("at the GM's discretion" per the rules); a Beastbound player who
  skips can still add a companion later from the character sheet.
- **Martial Stances** (Martial Artist only): `MartialStanceSelector` — must choose exactly 2 Tier-1
  stances (higher tiers shown but disabled with a "locked" treatment).
- **Ancestry**: `AncestrySelector` supports two modes:
  - **Single**: pick one ancestry card outright.
  - **Mixed heritage**: pick two ancestries, then pick exactly one feature from each to combine
    into a single homebrew-flavored mixed ancestry (submitted via
    `AncestryService.createMixedAncestry`, which persists a new ancestry row server-side tagged
    with both source features).
- **Community**: Card grid, single pick (`CommunityService`).
- **Traits**: `TraitSelector` — the six traits (Agility, Strength, Finesse, Instinct, Presence,
  Knowledge) each get one value from the fixed pool `{+2, +1, +1, 0, 0, -1}`; each pool value can
  only be assigned once. A "Clear All" resets. Sub-skill labels are shown per trait for flavor
  (read-only hints, not selectable).
- **Starting Weapon**: `WeaponSection` (inside `EquipmentSelector`) — choose a primary weapon, and
  optionally a secondary (blocked if the primary is two-handed).
- **Starting Armor**: `ArmorSection` — choose one starting armor piece.
- **Experiences**: `ExperienceSelector` (shared component) — free-text Experience names with a
  fixed starting modifier (`DEFAULT_EXPERIENCE_MODIFIER`, +2); a step is "complete" once at least
  one Experience has both name and modifier filled in.
- **Domain Cards**: Card grid scoped to the subclass's domains, capped to level-1 cards. Base pick
  count is 2, plus any `BONUS_DOMAIN_CARD_SELECTIONS` modifier granted by the subclass's features
  (extra slots beyond the base 2 are treated as "bonus" picks and go straight to the vault, not
  equipped, at creation — see `assembleCharacterSheet`).
- **Bonuses** (conditional): `ExperienceBonusAllocator` — spends `BONUS_EXPERIENCE_MODIFIER` points
  (summed across chosen subclass/ancestry/community/domain-card features) as +1 increments onto
  the player's own Experiences.
- **Review**: `ReviewSection` — read-only summary (class/subclass, domains, ancestry, community,
  traits, weapon, armor, domain cards) plus Name and Pronouns fields, then Submit.

**Submission**: A two-phase process — (1) POST the character (creates ancestry first if mixed,
then the sheet, then Experiences, then a companion from the draft if any); (2) PUT the character
again to attach the 2 chosen martial stances (a separate call because the create endpoint has no
field for them). If phase 2 fails after phase 1 succeeds, the UI does not re-create the character
on retry — it resumes from the stance PUT (`createdSheet` guard).

**Limitations**: No point-buy/custom trait arrays outside the fixed pool. No "roll for traits"
option. No multiclass option at creation (multiclass is level-up only, tier 3+). No choice of
starting gold or specific starting items beyond the two equipment steps + the class's fixed kit
(handled server-side). Companion creation at this stage has no Training picks (Training only
becomes available via level-up/character-sheet flows).

---

## 3. Character Sheet — Classic (`/character/:id`, default layout)

Component: `features/character-sheet/character-sheet.ts` / `.html` (~1200 lines TS, ~880 lines
HTML). Loads the sheet with a wide `?expand=` list (experiences, community/ancestry/subclass
cards, class, domain cards, inventory weapons/armors/items, features, questions, cost tags,
modifiers, transformation card, known/active martial stances).

### 3.1 Identity header
- Name, pronouns, "by {owner}" link to the owner's profile, class/subclass line (supports
  multiclass: multiple `class · subclass` entries separated by `/`).
- Level badge, with "Level+" link to `/character/:id/level-up` (shown while level < 10) or
  "Level-" link to `/character/:id/level-down` (shown while level ≥ 10 — i.e. only at max level).
- Evasion, Armor Score, Proficiency shown as shield badges, each with a modifier indicator showing
  base vs. total when feature/item modifiers apply.
- Combo Die badge (Brawler class only, gated on the "Combo Strike" feature) — shows the player's
  stored die (defaults `d4`, upgraded via level-up advancement).
- Patron Die badge (Warlock class only, gated on "Patron's Pact") — derived purely from level
  (`patronDieForLevel`), not stored/editable.

### 3.2 Traits row
Six trait badges (Agility/Strength/Finesse/Instinct/Presence/Knowledge) each showing modifier,
whether it's currently "marked" (used this session — a visual dot, no interactive toggle on the
classic sheet itself, it reflects level-up-cleared trait marks), and static sub-skill labels.

### 3.3 Health panel
- **Damage thresholds bar**: Minor/Major/Severe zone labels with the Major and Severe threshold
  numeric markers (with modifier indicators) inline — a visual reference, not interactive.
- **HP tracker**: box-and-pip `ResourceTracker`, click a box to mark up to it, click the topmost
  marked box to unmark. Saved via 800ms-debounced PUT.
- **Armor tracker**: same box UI, tracks marked Armor Slots (spent, not "current armor").

### 3.4 Hope & Stress panel
Side-by-side `ResourceTracker`s for Hope and Stress. Hope's tracker can render extra "bonus" boxes
(styled distinctly, "from companion") when a companion carries the `LIGHT_IN_THE_DARK` Training —
these are additional markable Hope slots layered on top of the character's own Hope max, clamped so
a stale marked-Hope value can never exceed the (possibly-shrunk) total if the companion/Training
is later removed.

### 3.5 Focus panel (Martial Artist only, gated on "Stance Fighter")
- `ResourceTracker` for Focus.
- **Refresh Focus** button (owner-only): rolls Instinct-many d6 (min 1) through the shared dice
  service and sets Focus to the *highest single die* (clamped to Focus max) — not a sum, not a
  refill to max. Shows "Rolled highest of N — Focus set to M."

### 3.6 Favor panel (Warlock only, gated on "Patron's Pact")
Plain +/- counter (no max shown/enforced client-side beyond being a signed integer), debounce-saved.

### 3.7 Experiences panel
Read-only list of the character's Experiences with their modifiers — this is where creation-time
and level-up-granted Experiences surface; no inline edit/delete here (managed only through
creation/level-up flows).

### 3.8 Equipped Weapons / Equipped Armor panels
- Shows the currently-equipped primary/secondary weapon (damage, trait, range, one/two-handed icon,
  features with tags and modifier badges) and equipped armor (score, major/severe thresholds,
  features).
- "No weapons equipped." / "No armor equipped." empty states.
- Equip/unequip is driven from the Inventory section below, not from here directly.

### 3.9 Gold panel
- Total shown with a star icon; goes red/negative-styled if it dips below 0 (no floor enforced
  client-side).
- Three denomination adjusters: Handful (±1), Bag (±10), Chest (±100) — matching the rulebook's
  gold-denomination convention. Debounce-saved.

### 3.10 Cards section (Class / Subclass / Ancestry / Community / Domain — expandable)
Each owned class/subclass/ancestry/community card renders as an expandable row (chevron toggle)
showing description, features (name, description, tags, modifier badges). No interaction beyond
expand/collapse for these four groups on the classic layout.

### 3.11 Beastform Options (Druid or any class granting the Beastform feature)
Component: `beastform-section.ts`. Lazily loads the full beastform catalog only when the section is
first expanded. Filters to forms at or below the character's tier (`tierForLevel`), sorted
tier-then-name. Each form shows a collapsed stat line (trait modifiers, Evasion, damage) and an
expandable attack line + features. **Purely informational reference** — there is no "become this
beastform" action, no active-transformation tracking, no HP/trait override applied to the sheet.
The rules text ("gain access to every beastform of your tier or lower") is treated as reference
data the player consults, not a mechanic the app enacts.

### 3.12 Martial Stance panel (Martial Artist)
Component: `martial-stance-panel.ts`. Lists known stances (sorted tier-then-name), one can be
"active" at a time. Activating a stance costs 1 Focus (blocked if Focus is 0) and is a live
PUT (`activeMartialStanceId` + decremented `focusMarked`) with optimistic update/rollback.
Clearing the active stance is free. The four drop conditions ("You take Severe damage", "You mark
your last Hit Point", "You shift to another stance", "The scene ends") are shown as **static
rules-reminder text only** — the app does not detect or auto-clear on any of these triggers.

### 3.13 Transformation panel (Hope & Fear content; GM-gated)
Component: `transformation-panel.ts`. Only rendered at all once a GM has set
`transformationEnabled` on the character (from the Campaign page — no player-facing path to
enabling it). Shows an empty-state picker ("Choose a transformation") from the fixed 6-card
transformation catalog, or the attached card's features + mechanics with Change/Remove actions (a
PC can only ever have one transformation — selecting always replaces, never adds). Two
card-specific mini-mechanics are name-string-matched (not structured fields) and rendered when
applicable:
  - **Vampire**: a Feed-token counter (0–6, +/- buttons).
  - **Werewolf**: a Wolf Form on/off toggle.
All writes are optimistic PUTs against the character-sheet endpoint with rollback on error.

### 3.14 Companions panel (Beastbound Ranger, gated + GM/owner-toggleable)
Component: `companion-panel.ts` (+ `companion-card.ts`, `companion-form-modal.ts`,
`companion-training-list.ts`). Visible when the character has the Beastbound "Companion" feature
AND (companions are GM-enabled for this character OR the character already has one — an existing
companion is never hidden just because a GM later disables the flag). Per companion:
- Expandable card: name, description, attack line (dice × count, damage type, range — from
  `Proficiency` read live off the *character* sheet, not a stale cached value on the companion),
  Stress tracker, Experiences list, Training list.
- Owner/admin can create (`+ Add Companion`, gated on the feature+enabled flag), edit (name,
  description, Evasion, attack name/range/damage dice, Stress max), or delete a companion.
- **Training** (8 fixed options from the printed Companion sheet — Intelligent, Light in the Dark,
  Creature Comfort, Armored, Vicious, Resilient, Bonded, Aware): shown with their verbatim rules
  text; `Bonded` and `Creature Comfort` are pure reminder text (not automated — e.g. "Bonded"'s
  d6-and-mark procedure is not rolled for the player). Training itself is picked only through the
  level-up flow (§4), not directly from this panel.
- **Armored** training interaction: when a companion takes Stress damage and the character has
  `Armored`, the panel offers "mark Armor instead" — routes through the *character's* own Armor
  tracker (`onCompanionMarkArmorInstead`), not a companion-local field.
- "Battle-Bonded"/"Loyal Friend" Beastbound Specialization/Mastery reminders are shown verbatim
  when the character's subclass grants them (computed once from subclass cards, not per-companion
  data).

### 3.15 Equipped Domain Cards / Domain Card Vault
- **Equipped**: shown as an expandable grid (up to `maxEquippedDomainCards`, tracked as an X/Y
  counter), each card has a "↓ Vault" action (owner only) to send it to the vault.
- **Vault**: shown as a list below the inventory section, each card has a "↑ Equip" action, disabled
  with a "Equipped slots full" hint once the equipped cap is reached.
- Swapping is an optimistic PUT (`equippedDomainCardIds`/`vaultDomainCardIds`) with rollback.
- **No "loadout swap only during a rest" gate** — the UI allows equip/vault swaps at any time; the
  rulebook's short/long-rest restriction on loadout changes is not enforced.

### 3.16 Inventory (`InventorySection` shared component)
- Lists owned (not-necessarily-equipped) weapons, armor, and loot/consumables, each with an
  equip/unequip toggle (weapons/armor) or just a remove action (loot).
- **Weapon equip rules enforced client-side**: only one PRIMARY and one SECONDARY slot; a
  two-handed weapon claims both and blocks equipping anything else; specific inline rule-violation
  messages surface ("Two-handed weapons need both slots free…", "Unequip your current primary
  weapon before equipping a new one.", etc.).
- **Armor**: only one armor piece can be equipped at a time.
- **Add item** flow: either browse/pick from the game's catalog (`inventory-add-panel`) or open
  `ItemFormModal` to write a fully custom homebrew weapon/armor/loot inline (same schema as the
  standalone Item Builder, see §9) — the created item is immediately added to inventory.
- **Edit** on an inventory row navigates *away* to the routed Item Builder
  (`/items/:type/:id/edit?returnTo=...`) rather than editing in a modal, since an edit there
  affects every sheet the item is equipped on, not just this one.
- Errors (equip/unequip/add/remove failures) show an inline dismissible banner and roll back the
  optimistic UI change.

### 3.17 Notes (owner or MODERATOR+ only — server decides visibility by field presence)
Collapsible free-text textarea, 10,000-character cap with a live counter that turns
warning/danger-colored near the limit, 800ms-debounced autosave with a "Saved" checkmark
indicator. Hidden entirely (not just disabled) for viewers who aren't authorized, since the
backend omits the `notes` field for them rather than sending an empty string.

### 3.18 What the classic sheet does NOT have
- **No Death Move tracker or prompt.** Marking the last HP box does nothing special — no forced
  Blaze of Glory / Risk It All / Avoid Death choice, no consequence application. (Death Moves exist
  only as *static reference text* on the GM Screen, §5.)
- **No Short Rest / Long Rest button or move-selection flow.** Rests, and the rest-move menu
  ("Tend to Wounds", "Clear Stress", "Repair Armor", etc.), exist only as GM-Screen reference
  content — nothing on the character sheet advances a rest, grants its moves, or ticks anything
  tied to a rest.
- **No status-condition tracker** (Restrained, Vulnerable, Hidden, etc.) — conditions exist only
  as GM-Screen reference text and as an admin-only "Conditions" bulk-upload card type (for
  homebrew adversary-facing condition cards), never as something toggled on a PC's sheet.
- **No scars/permanent-injury tracker.**
- **No in-app narrative/backstory fields beyond the free-text Notes box** (no structured
  background, connections, or "who are you" question answers rendered on the sheet itself, though
  Ancestry/Community/Class "Questions" text exists in the data model for admin card content).
- Trait "marked" state is display-only here (set by level-up spending them, cleared at tier
  transition) — there's no click-to-mark-a-trait interaction on the sheet.

---

## 4. Character Sheet — Beta (`character-sheet-beta`, opt-in via Preferences)

Component: `features/character-sheet-beta/character-sheet-beta.ts`, which **inherits from and
extends `CharacterSheet`** (classic) — same data loading, save pipelines, equip-constraint logic,
and every handler. Only the template/stylesheet differ, plus:
- Class+Subclass and Ancestry+Community are grouped into two `CollapsibleCardGroup`s (`EntityCard`
  grid) instead of four separate hand-inlined expandable-card blocks.
- Beastform, Martial Stance, Transformation, and Companion panels each have `-Beta` sibling
  components with the same behavior in the new visual language (`EntityCard`-based).
- **Inventory adds a searchable Item Finder** (`item-finder.ts`): a modal with a text search +
  type filter (All/Weapon/Armor/Loot) over `ItemCatalogService`, debounced, showing grouped result
  counts per type with a "show more" affordance, plus the same three "write your own"
  (weapon/armor/loot) create shortcuts classic has via `ItemFormModal`.
- Equipment display and the inventory manager itself are explicitly **not yet reworked** ("deferred
  to a later rework" per the code comment) — same underlying `InventorySection` as classic.
- Everything else (notes, gold, Focus/Favor, Companion feature gate, domain-card vault swap,
  Death-Move/Rest/Condition absence) is identical to §3, since the beta sheet literally subclasses
  the classic component.

---

## 5. Level-Up (`/character/:id/level-up`, owner-only)

Component: `features/level-up/level-up.ts` — a tabbed wizard similar in shape to character
creation. Loads `LevelUpOptionsResponse` from the backend (which advancements are available/used
this tier, domain-card level cap, accessible domains, companion training eligibility, restorable
companions).

### Tabs (dynamically composed — `computeVisibleTabs`)
1. **Tier Achievements** (tier-transition level-ups only, i.e. entering tier 2/3/4): free-text
   field for a new permanent Experience description (fixed +2, same as creation), plus one field
   per eligible companion for "your companion also gains an Experience" (companions rules §3.2).
2. **Advancements**: pick exactly 2 advancement choices (a type can be picked twice if
   `remaining` allows and it isn't mutually exclusive with itself/another chosen type). Available
   types:
   - `BOOST_TRAITS` — pick 2 unmarked traits (or any traits if this is a mark-clearing tier
     transition) each +1; marks them "used" for the tier.
   - `GAIN_HP` — +1 HP max per pick, shown as a live "12 → 13" preview.
   - `GAIN_STRESS` — +1 Stress max per pick.
   - `BOOST_EXPERIENCES` — +1 to up to 2 existing Experiences and/or the new tier-achievement
     Experience (capped combined at 2).
   - `GAIN_DOMAIN_CARD` — pick 1 extra domain card (from accessible domains, up to the level cap),
     optionally equip it immediately.
   - `BOOST_EVASION` — +1 Evasion per pick.
   - `UPGRADE_SUBCLASS` — pick a higher-tier card within an already-owned subclass path.
   - `BOOST_PROFICIENCY` — +1 Proficiency per pick.
   - `MULTICLASS` (tier 3+ only) — pick a subclass card from a class not yet owned, filterable by
     class name; adds full multiclassing.
   - `FEATURE_DOMAIN_CARD` — a bonus domain card slot granted by another chosen feature (no
     separate UI beyond counting into the domain-card step's max).
   - `UPGRADE_COMBO_DIE` (Brawler) — steps the stored Combo Die up one size per pick, shown as a
     live "d6 → d8" preview.
   - Each type enforces `limitPerTier`/`remaining` and any declared `mutuallyExclusiveWith`.
3. **Companion** (only on the level-up that newly grants the Beastbound "Companion" feature, e.g.
   via `MULTICLASS`/`UPGRADE_SUBCLASS`, and only if the character has no active companion yet):
   create a brand-new companion (same form as creation) **or** restore a previously soft-deleted
   one from `restorableCompanions`.
4. **Martial Stance** (shown whenever the character has, or this level-up newly grants, "Stance
   Fighter"): choose 2 Tier-1 stances on the acquiring level-up, or 1 additional stance (of the
   character's new tier or lower) on every subsequent level-up.
5. **Training — one tab per eligible companion** (`training-${companionId}`): pick from the 8
   fixed Training options (see §3.14), capped by both the companion's all-time per-option
   remaining count and this level-up's available picks (baseline 1, +bonus from Expert/Advanced
   Training-granting advancements). `Vicious` needs a damage-die-or-range sub-choice;
   `Intelligent` needs an existing companion Experience to target (disabled if the companion has
   none).
6. **Domain Card**: pick the new domain card(s) — 1 normally, 2 if `GAIN_DOMAIN_CARD` was also
   chosen this level-up (base count) plus any bonus slots from `BONUS_DOMAIN_CARD_SELECTIONS`
   features acquired this level-up.
7. **Card Trades**: optionally trade out N owned domain cards for N new ones from accessible
   domains (1:1 count match required to be valid), each traded-in card optionally equipped
   immediately; can be explicitly skipped.
8. **Review**: summary of every selection (advancements with before/after stat previews,
   companion actions, training picks, domain card gains/trades) before submitting.

**Submission** is multi-phase, each phase guarded against double-submission on retry: (0) create a
brand-new companion if one was drafted (its id must be embedded in the level-up request), (1) POST
the level-up itself, (2) PUT to attach newly chosen martial stance(s) (full-collection replacement,
not additive). A partial failure surfaces a specific "leveled up, but the new stance couldn't be
saved — submit again" message rather than restarting the whole flow.

**Level-down access from within Level-Up**: a "Level-" action opens a `ConfirmDialog`; confirming
calls the same `undoLevelUp` endpoint as the standalone Level-Down page and navigates back to the
sheet.

**Limitations**: No manual point allocation outside the fixed advancement types (no free-form
"add 3 to any stat"). No UI to review/rewind an *older* level (only the immediately-preceding one,
via level-down). No batch "apply the same advancement config to N future levels."

---

## 6. Level-Down (`/character/:id/level-down`)

Component: `features/level-down/level-down.ts`. Extremely small — shows the character's name and
current level, a single "Level Down" button behind a `ConfirmDialog`, and calls
`CharacterSheetService.undoLevelUp`. This is a **full undo of the most recent level-up** (all its
advancement effects), not a selective rollback of individual choices. Owner-only (redirects/errors
otherwise). No history list of past level-ups is shown here or anywhere else in the app.

---

## 7. GM Screen — Standalone (`/gm-screen`)

Component: `features/gm-screen/gm-screen.ts`. **Entirely static reference content** plus the
global dice roller — there is no campaign, no fear tracker, no state at all. Content is authored
per-topic in `content/*.content.ts` and merged/sorted by `panel-registry.ts` into a fixed board:

- Action Rolls
- Combat
- Conditions & Traits
- Rests (Short Rest / Long Rest text, including the GM's Fear gain on each)
- GM Moves
- Adversaries (reference tables, not the campaign's live adversary roster)
- Hazards & Death (includes the Death Move rules **as text only** — no interactive trigger)
- Inspiration
- Transformations & Stances (rules text for the Hope & Fear mechanics)
- Tables (miscellaneous roll tables)

Any authenticated user can view this page — it requires no GM role and is not tied to a campaign.

---

## 8. GM Screen — Campaign (`/campaign/:id/gm-screen`)

Component: `features/gm-screen/campaign/campaign-gm-screen.ts`. Same static reference panels as
§7, **plus** live, persisted, campaign-scoped panels (`CAMPAIGN_GM_PANELS`) shown first. Requires
being the campaign's GM (creator/game-master) or an admin to manage the interactive panels (`canManage`);
non-GMs viewing the URL still see the static reference content.

### Interactive panels
- **Fear Counter** (`fear-counter-panel.ts`): a 0–12 pip track (Daggerheart's hard Fear cap) with
  +/- buttons; each tap is an immediate `switchMap`-cancelled PATCH (no debounce — a tap is a
  discrete decision), optimistic with rollback.
- **Countdowns** (`countdowns-panel.ts` + `countdown-row`/`countdown-help` children): full CRUD
  list of named countdowns. Each has a type and loop behavior (from `COUNTDOWN_TYPE_OPTIONS` /
  `COUNTDOWN_LOOP_OPTIONS` — includes a "Long-term: tick down 1 on a long rest" type) and a
  starting value (1–99). Ticking up/down is optimistic; the server may return a looped value on
  hitting 0, which replaces the row. Deletion is confirm-gated.
- **GM Notes** (`gm-notes-panel.ts`): a private, GM-only free-text field, 50,000-char cap,
  responsive row count (6 rows narrow / 12 wide), 800ms-debounced autosave. The panel does not
  itself gate visibility — absence of `gmNotes` in the API payload (rather than an empty string)
  is what signals "not authorized," consumed one level up.
- **Sheet Viewer** (`sheet-viewer-panel.ts` + `party-member-detail`): a vitals-first roster of
  every campaign PC and NPC (grouped "Player characters" / "NPCs"), lazily fetched 4-at-a-time,
  one row expandable at a time into a full read-only stat block (same view model as the character
  sheet). Includes a manual "refresh" to drop the cache and refetch (vitals go stale mid-scene).
- **Encounter Builder panel** (`encounter-builder-panel.ts`): an embedded encounter-authoring
  surface scoped to the campaign, functionally overlapping the standalone Encounter Builder (§9)
  but hosted inline in the GM dashboard.

**Limitations**: No live multi-GM sync indicator beyond optimistic-UI-plus-refetch (no
websocket-pushed updates to a second GM's open tab). No "advance the scene" or turn-order tracker
beyond the encounter-run adversary panel (§9). No player-facing view of Fear/Countdowns — these
are GM-only.

---

## 9. Encounters

### 9.1 Encounters list (`/encounters`)
Component: `features/encounters/encounters.ts`. Two sections:
- **Saved encounters** (owned by the caller — the list endpoint returns official/public/own
  together, narrowed client-side to `creatorId`): name, tier-range label, Battle Point
  spent/suggested (flagged "over budget" if spent > suggested), Copy / Edit / Delete-with-confirm
  actions, "+ New Encounter" entry point.
- **Active runs**: any in-progress `EncounterRun`s, each resumable ("Continue") or discardable
  (delete-with-confirm), paired with their source encounter's name.

### 9.2 Encounter Builder (`/encounters/new`, `/encounters/:id/edit`)
Component: `features/encounters/encounter-builder/encounter-builder.ts`. Sections (Roster and
Adversaries collapsible; Environment starts collapsed; Battle Points meter always visible):
- **Battle Point Meter**: live-computed as the roster changes, against party-size-derived
  suggested points, before any save round-trips (server value wins once saved).
- **Roster**: add adversaries from a searchable/browsable `AdversaryBrowser`; each roster entry can
  have a custom display label and a tier override (re-tiering an adversary up/down for budget
  purposes), can be removed. Newly added entries get a brief highlight + a screen-reader
  announcement.
- **Environment**: optional single environment pick (`EnvironmentPicker`) — environments cost no
  Battle Points.
- **Name/Description** fields, **party size** selector (default 4) driving the suggested budget.
- Save creates or updates the encounter; a fresh create redirects the URL to the new edit route.

### 9.3 Encounter Run (`/encounters/:id/run`, and embedded in the campaign GM screen)
Shared component: `shared/components/encounter-run/encounter-run-view.ts`, hosted by
`features/encounters/encounter-run-page/encounter-run-page.ts` standalone (resolves/starts an
`ACTIVE` run for the encounter) or by the GM-screen encounter-builder panel.
- Per-adversary row: live HP/Stress marking (marking to HP max auto-sets Defeated), a token
  counter (generic per-adversary counter for whatever the GM is tracking — conditions, charges,
  etc., no fixed semantics), a Defeat/Revive toggle, and a free-text note. Every change is an
  optimistic PATCH with rollback and a polite screen-reader announcement of the result
  ("Goblin marked 4 of 6 HP. Defeated.").
- **Environment stat block** shown read-only alongside the fight.
- **Lifecycle actions**: Complete (ends the run), Reset (restarts the encounter to its starting
  state, replacing the whole run in place), Discard/Delete Encounter, and an Edit shortcut back to
  the builder.
- A "N of M standing" summary line.
- **Campaign-free by construction** — any signed-in user can run their own saved encounter with no
  GM role required on the standalone page; the campaign GM screen hosts the identical component.

**Limitations across Encounters**: No initiative/turn-order tracker (adversaries are a flat list,
not a sequenced round). No player-visible encounter state — running an encounter is entirely a
GM/owner-side tool. No automatic Fear award tied to encounter events (Fear is a separate manual
counter on the campaign GM screen).

---

## 10. Homebrew / Item Builder (`/items/new`, `/items/:type/:id/edit`)

Component: `features/items/item-builder/item-builder.ts` + `components/item-form/item-form.ts`.
Create or edit a custom **weapon, armor, or loot/consumable** item.
- In create mode, the player picks the kind (weapon/armor/loot) via `ItemKindRack`; in edit mode
  the kind is locked by the URL.
- Form fields vary by kind (`weapon-fields`, `armor-fields`, `loot-fields` sub-components) —
  weapon trait/range/damage/burden/features; armor score/thresholds/features; loot
  name/description/consumable flag.
- **Visibility**: only MODERATOR+ can mark an item Public (`canSetPublic`); regular players'
  homebrew is private to them (and to campaigns they explicitly share it with, via
  `shareableCampaignOptions`).
- **Duplicate**: server-side fork of a saved item into a new one, then navigates the editor onto
  the copy (unsaved edits on the original are not carried over — only what's persisted is copied).
- **Return-to**: if opened from a character sheet's inventory ("Edit" on an inventory row), Cancel
  and the back link return to that sheet instead of the Codex; the return URL is validated to be
  same-origin only.
- A saved custom item immediately becomes usable everywhere items are picked from (sheet
  inventory, encounter/adversary loot, etc.) since it's a normal row in the same tables as
  official content.

---

## 11. Reference / Codex (`/reference`)

Component: `features/reference/reference.ts` (~330 lines) + a cluster of presentational
sub-components (`codex-search-bar`, `type-facet-tabs`, `filter-rail`, `refine-sheet`,
`landing-type-grid`, `result-section`, `result-card`, `codex-skeleton`, `codex-empty-state`).

- **Landing view** (no query, no type selected): a grid of content-type tiles to browse into
  (Classes, Subclasses, Ancestries, Communities, Domains, Domain Cards, Weapons, Armor, Loot,
  Adversaries, Environments, Martial Stances, Beastforms, Transformations…).
- **Mixed search** (a query typed, no type focused): top results across every searchable type at
  once, capped to a handful per type (`MIXED_VIEW_CAP`), each section showing its total count and
  top relevance score.
- **Focused search / focused browse**: a single type selected (via the facet tabs), either
  filtered by the current query (search) or paginated straight through the catalog (browse, no
  query). Type-specific filter chips appear in a rail (desktop) / bottom sheet (mobile) —
  e.g. adversary type, weapon trait/range/burden, "is consumable" for loot, domain-card
  type/domain/level, subclass-card's associated class, environment type.
- Results render as `ResultCard`s (or, for subclasses, via the shared `SubclassPathSelector` to
  show path/tier grouping) and support the `sheetLayout` preference's beta card styling.
- Pagination controls at the bottom of focused views.
- Cross-type ("all types") search has no browse endpoint — it can only ever show text-search hits,
  never an unfiltered "browse everything" list.

**Limitations**: Read-only — the Codex has no "add to my character" or "save to favorites" action;
getting a card onto a sheet happens through the builder/level-up/inventory flows, not from here.
No saved-search or search-history feature.

---

## 12. Campaigns

### 12.1 Campaigns list (`/campaigns`)
`features/campaigns/campaigns.ts` — every campaign the caller belongs to (creator or player), with
player/character counts, ended-state flag, GM name, and a "+ Create Campaign" entry point.

### 12.2 Create Campaign (`/campaigns/create`)
`features/campaigns/create-campaign/create-campaign.ts` — Name (required, ≤200 chars) + optional
Description (≤2000 chars) form; on success navigates to the new campaign's page.

### 12.3 Join Campaign (`/campaigns/join/:token`)
`features/campaign-join/campaign-join.ts` — pure redemption screen for an invite link/token; shows
success or a specific error (expired/not-found/unauthorized/unknown) with no further input.

### 12.4 Campaign home (`/campaign/:id`)
`features/campaign/campaign.ts` — the richest campaign-management page. Sections/components:
- **Summary** (`CampaignSummary`): name/description/GM.
- **Player list** (`CampaignPlayerList`): kick-with-confirm (GM/admin only).
- **Character list** (`CampaignCharacterList`): the campaign's approved PCs; view or
  remove-with-confirm.
- **Pending submissions** (`CampaignPendingList`): characters submitted by players awaiting GM
  approval/rejection.
- **NPC list** (`CampaignNpcList`): GM-added non-player characters (any character sheet can be
  attached as an NPC via `CampaignSheetPicker`), remove-with-confirm.
- **Invite** (`CampaignInvite`): generates/shows the shareable join link.
- **Submit-a-character** flow (players): pick one of their own sheets via `CampaignSheetPicker` to
  submit for GM approval.
- **Per-character Transformation drawer** (GM/admin only): toggle `transformationEnabled` and
  assign/clear which of the 6 transformation cards a specific PC has access to — this is the *only*
  place in the app that turns on the Transformation panel seen in §3.13. Lazily loads the
  transformation catalog on first open.
- **Per-character Companions-enabled drawer** (GM/admin only): toggles whether a Beastbound
  Ranger's companion feature is "on" for that character in this campaign (companions plan — an
  existing companion is never hidden even if later toggled off).

**Limitations**: No campaign session-log/history feature, no in-app chat, no scheduling/calendar.

---

## 13. Profile & Dashboard

### 13.1 Home / Dashboard (`/`)
`features/home/home.ts` embeds `features/dashboard/dashboard.ts` for signed-in users (signed-out
users see marketing copy + feature blurbs + sign-in prompt). Dashboard shows three preview panels
(latest few, by last-modified): **Characters**, **Campaigns** (GM badge shown if the caller GMs
it), **Encounters** — each with a "View All" link (Characters routes to `/profile`, no dedicated
character-list route exists) and a create shortcut. 403s on any panel (no access) are treated as
"nothing to show," not an error state; other failures show an error state per-panel.

### 13.2 Profile (`/profile`, `/profile/:id`)
`features/profile/profile.ts` — own or another user's public page. Sections, each a
`RosterPanel`/`RosterList`:
- **Characters**: always visible to anyone who can view the profile (owner sees delete actions).
- **Campaigns**: visible to the profile owner, or to an ADMIN+ viewing someone else (uses a true
  per-user backend endpoint, so this is accurate even for another user).
- **Encounters**: visible **only to the profile's own owner**, even for admins — there is no
  per-user encounters endpoint, so showing another user's would silently under-report (miss their
  private ones); a note explains this asymmetry when an admin can see Campaigns but not
  Encounters for someone else.
- **Homebrew items** (weapons/armor/loot merged): visible to the owner or ADMIN+ (server-side
  moderator+ bypass on visibility filtering); delete gated to owner or ADMIN+ specifically (a
  plain MODERATOR can view but not delete another user's items).
- Avatar, username, join date; each section has its own create shortcut and delete-with-confirm
  flow (rolled back to the panel's own "resetDeleteState" on failure).

**Limitations**: No character count limits shown/enforced client-side, no "favorite" or "follow
this user" social feature.

---

## 14. Account / Auth

- **Sign in** (`/auth`): Google OAuth button; in non-production builds, an additional "dev login"
  path lets a tester sign in with a bare email address (no password) for local/staging use.
  First-time sign-in without a chosen username is redirected to `/choose-username`.
- **Auth callback** (`/auth/callback`): OAuth redirect landing page.
- **Choose username** (`/choose-username`): one-time required step; 3–30 chars, alnum + `_`/`-`
  only; 409 (taken) and 400 (invalid) surfaced as distinct inline errors.
- **Preferences** (`/preferences`): see §0.
- No password-based account, no email/notification settings, no account deletion flow exposed in
  the frontend, no 2FA.

---

## 15. Admin (`/admin/**`, ADMIN/OWNER role only)

Shell: `features/admin/admin.ts`, defaulting its index redirect to `/admin/cards`.

### 15.1 Card Search (`/admin/cards`)
`card-search/card-search.ts` — a data-table browser/search over every content category
(`ADMIN_CATEGORIES`): classes, subclasses, ancestries, communities, domains, domain cards,
weapons, armor, loot, subclass paths, adversaries, environments, martial stances, beastforms,
transformations, conditions, features, questions. URL-driven state (category/query/page/size/sort
all live in query params, so the URL fully reproduces a view). Below the search-length threshold
it falls back to a plain paginated browse of the category. Cross-category search has no browse
mode (query required). Column sort toggles asc/desc on repeat click. Expansion names are joined in
client-side from a cached lookup.

### 15.2 Card Edit (`/admin/cards/:cardType/:id`, `/admin/cards/subclass-path/:pathId`)
`card-edit/card-edit.ts` (+ `subclass-path-edit/subclass-path-edit.ts` for the subclass-path
special case) — a schema-driven form (`CARD_EDIT_SCHEMAS` per card type) with a live side-by-side
preview of how the card will render (`CardEditPreview`), an inline **Feature editor**
(`FeatureEditor`) for adding/editing/deleting the card's feature list (classes split
Hope-features vs. class-features specially), an "Add Expansion" inline-create dialog for
assigning a not-yet-existing expansion, Save (diff-aware — only PATCHes what's dirty across the
form and any touched features) and Delete (with its own error surface).

### 15.3 Bulk Upload (`/admin/bulk-upload`)
`bulk-upload/bulk-upload.ts` — paste a raw JSON array for one content type (17 supported types;
"expansion" intentionally excluded since it has no bulk endpoint) and validate-then-upload. Two
explicit phases: **Validate** (client-side JSON.parse + "is it a non-empty array" check only — no
schema validation against the target type) then **Upload** (POST to
`/{type}/bulk`), surfacing either a success count or field-level validation errors returned by the
backend (`parseBulkFieldErrors`). This is the primary mechanism the content-import skills
(class/subclass/ancestry/etc. parsers) target.

### 15.4 User List (`/admin/users`)
`user-list/user-list.ts` — paginated (50/page), filterable by username (debounced), role, and
ban-status, sortable (last seen / join date / username / id, either direction). Row actions: Edit
(routes to detail), "View profile" (opens `/profile/:id` in a new tab).

### 15.5 User Edit (`/admin/users/:userId`)
`user-edit/user-edit.ts` — identity panel (username, avatar URL, role dropdown
USER/MODERATOR/ADMIN/OWNER) with a live preview, Save (diff-aware PATCH), Ban (with a reason
field)/Unban actions, and three read-only history tables: login events (provider/IP/device),
username-change history, and admin-action audit log. Copy-to-clipboard affordances on identifying
fields show a toast confirmation.

**Limitations across Admin**: No draft/preview-before-publish workflow beyond the card edit's
inline preview — saves are immediate/live. No bulk edit or bulk delete (only bulk *create*). No
admin-side character-sheet editing (admins manage catalog content and user accounts, not
individual players' characters directly, beyond what the campaign GM tools already allow their own
campaigns).

---

## 16. Beta vs. Classic — summary of every mode gate found in the code

| Preference | Values | What it changes |
|---|---|---|
| `sheetLayout` | `classic` (default) / `beta` | Which character-sheet **route implementation** loads (`canMatch` guard, zero-download of the unused chunk); also swaps card-rendering components (`CardSelectionGrid` → `EntitySelectionGrid`, plain cards → `EntityCard`) throughout Character Creation, Level-Up, and Reference wherever `sheetLayout` is read, so those flows get the new visual card treatment even though their *logic* is unchanged. |
| `cardTheme` | `default` (dark cards on dark bg / light elsewhere) / `light` (**Beta-badged**) / `dark` | Purely visual palette for card rendering; `dark` explicitly warns Character Creation/Level-Up pages don't have a matching dark page background yet. |
| `density` | `comfortable` (default) / `condensed` | Global spacing/type scale. |
| `motion` | `system` (default) / `reduced` / `full` | Animation/transition amount. |

No feature is present in Beta but absent in Classic, or vice versa, for the character sheet — beta
literally subclasses classic's TypeScript and only re-templates it (§4). "Beta" elsewhere in the
codebase (light card theme) is purely cosmetic.

---

## 17. Cross-cutting things confirmed NOT to exist anywhere in the frontend

Recorded explicitly since the task calls for noting absences a rules-comparison pass would
otherwise have to rediscover by grepping the whole app itself:

- **Death Moves** are reference text only (GM Screen); no character-sheet trigger, no choice UI,
  no consequence application when HP is fully marked.
- **Short Rest / Long Rest** have no interactive flow anywhere — no "take a rest" button, no rest
  move picker, no automatic Fear-gain-on-rest, no countdown auto-tick tied to a rest (countdowns
  are ticked manually by the GM even for a "Long-term: tick down 1 on a long rest" type).
- **Status conditions** (Restrained, Vulnerable, Hidden, Hidden, etc.) have no per-character
  tracker; they exist only as GM-Screen reference text and an admin content type for
  homebrew card authoring.
- **Beastform** grants *reference access* to forms, never an "I am now this beastform" transformed
  state with derived stat overrides.
- **Initiative/turn order** is not tracked in the Encounter Run view (adversaries are an
  unordered list of trackers, not a sequenced round).
- **Advantage/Disadvantage** has no dedicated die-of-6 modifier in the Dice Roller — a player must
  manually add/subtract a d6 by adjusting counts themselves; the roller has no "adv/disadv" toggle.
- No in-app chat, session log, or scheduling for campaigns.
- No password-based auth, 2FA, or account deletion UI.
