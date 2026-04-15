# Frontend Implementation: Bonus Domain Card Selections

**Audience:** Frontend agent implementing the client-side flow.
**Backend PR:** Adds `AdvancementType.FEATURE_DOMAIN_CARD` + `ModifierTarget.BONUS_DOMAIN_CARD_SELECTIONS`.
**Backend branch:** `apr14_tweaks_3` (see `.api-blueprint/references/character-sheets-api.md` for the authoritative API spec).

---

## 1. Context

Some Daggerheart subclass foundation features grant a **bonus domain card** at the moment the character takes the feature. The backend now has first-class support for this through two additions:

1. A new **modifier target** — `BONUS_DOMAIN_CARD_SELECTIONS` — that lives on a subclass feature's `modifiers` list.
   - Declarative only: the server does not consult its value for count enforcement.
   - Shape: `{ target: "BONUS_DOMAIN_CARD_SELECTIONS", operation: "ADD", value: N }`.
   - The client is the authority on "how many extra picker slots to show."

2. A new **advancement type** — `FEATURE_DOMAIN_CARD` — that the client injects into level-up requests for each bonus card the player picks.
   - Not returned by `getLevelUpOptions`.
   - Not selectable by the player directly.
   - Does not count toward the "exactly 2 player advancements" rule, nor toward `GAIN_DOMAIN_CARD`'s 1-per-tier cap.
   - Cards added via `FEATURE_DOMAIN_CARD` are always stored **unequipped** on the server.

No database migration or endpoint signature change. The `advancements` array's `@Size(min=2, max=2)` constraint has been relaxed to `@Size(min=2)`, and the server now enforces the two-player-entries invariant in service code.

---

## 2. Where bonus selections can trigger

A subclass foundation feature with a `BONUS_DOMAIN_CARD_SELECTIONS` modifier grants its bonus cards in **two distinct UX flows**:

### 2.a Character creation

- Endpoint: `POST /api/dh/character-sheets`
- Request fields already in place: `equippedDomainCardIds: Long[]`, `vaultDomainCardIds: Long[]`.
- The backend does **not** cap the total count here (it only rejects duplicates).
- **Client responsibility:** when the player selects a foundation subclass card whose feature has this modifier, render `N` additional picker slots and append the chosen card IDs to `vaultDomainCardIds` (or `equippedDomainCardIds` if the UX allows equipping bonus cards at creation).

### 2.b Level-up

- Endpoint: `POST /api/dh/character-sheets/{id}/level-up`
- Triggers when the player picks an advancement whose application *grants* a new subclass foundation card carrying the modifier. Today that's:
  - `UPGRADE_SUBCLASS` — when the upgraded card or its path's foundation has the modifier and it becomes active at this level.
  - `MULTICLASS` — when taking a foundation card that carries the modifier.
- **Client responsibility:** when a chosen advancement adds such a card, render `N` extra picker slots alongside the normal Step 4 domain-card picker, and inject one `FEATURE_DOMAIN_CARD` entry into the `advancements` array per selection.

> **Scope note:** `BONUS_DOMAIN_CARD_SELECTIONS` is *declarative*. If a player already owns the feature (e.g. from a previous level) and you're not adding it during this level-up, do **not** inject additional `FEATURE_DOMAIN_CARD` entries — the bonus is granted once, at the time the feature is taken, and persists in the vault. Use the advancement-log (or simply the character's existing cards) as the record of prior grants.

---

## 3. Reading the modifier

Feature modifiers are serialized in existing feature-response payloads. Example foundation subclass card response snippet:

```json
{
  "id": 73,
  "name": "Warden of the Elements Foundation",
  "level": "FOUNDATION",
  "features": [
    {
      "id": 412,
      "name": "Elemental Affinity",
      "modifiers": [
        { "target": "BONUS_DOMAIN_CARD_SELECTIONS", "operation": "ADD", "value": 1 }
      ]
    }
  ]
}
```

### Helper

```ts
function bonusDomainCardSlots(feature: FeatureResponse): number {
  return feature.modifiers
    ?.filter(m => m.target === 'BONUS_DOMAIN_CARD_SELECTIONS' && m.operation === 'ADD')
    .reduce((sum, m) => sum + m.value, 0) ?? 0;
}

function totalBonusSlotsForCard(card: SubclassCardResponse): number {
  return (card.features ?? []).reduce(
    (acc, f) => acc + bonusDomainCardSlots(f), 0
  );
}
```

Other operations (`SET`, `MULTIPLY`) on this target are not used by current seed data — safe to treat as "additive slot count" and ignore non-`ADD` rows unless/until that changes.

---

## 4. Level-up request shape

### Existing shape (unchanged fields)

```ts
interface LevelUpRequest {
  advancements: AdvancementChoice[];       // was min=max=2, now min=2
  newExperienceDescription?: string;
  newDomainCardId?: number;                 // Step 4 card (unchanged)
  equipNewDomainCard?: boolean;
  unequipDomainCardId?: number;
  trades?: DomainCardTradeRequest[];
}

interface AdvancementChoice {
  type: AdvancementType;
  traits?: Trait[];
  experienceIds?: number[];
  boostNewExperience?: boolean;
  domainCardId?: number;                    // used by GAIN_DOMAIN_CARD AND FEATURE_DOMAIN_CARD
  equipDomainCard?: boolean;                // ignored for FEATURE_DOMAIN_CARD (always unequipped)
  subclassCardId?: number;
}
```

### New enum values

```ts
// Union type additions
type AdvancementType =
  | 'BOOST_TRAITS'
  | 'GAIN_HP'
  | 'GAIN_STRESS'
  | 'BOOST_EXPERIENCES'
  | 'GAIN_DOMAIN_CARD'
  | 'BOOST_EVASION'
  | 'UPGRADE_SUBCLASS'
  | 'BOOST_PROFICIENCY'
  | 'MULTICLASS'
  | 'FEATURE_DOMAIN_CARD';   // NEW — client-injected only

type ModifierTarget =
  | /* ...existing 18 values... */
  | 'BONUS_DOMAIN_CARD_SELECTIONS';   // NEW
```

### Example: level-up with one bonus domain card

Player picks `UPGRADE_SUBCLASS` to a specialization card whose feature carries `BONUS_DOMAIN_CARD_SELECTIONS` (value 1). Second advancement is `GAIN_HP`. Step 4 is the normal single card. The UI renders one extra picker and the request becomes:

```json
POST /api/dh/character-sheets/42/level-up
{
  "advancements": [
    { "type": "UPGRADE_SUBCLASS", "subclassCardId": 73 },
    { "type": "GAIN_HP" },
    { "type": "FEATURE_DOMAIN_CARD", "domainCardId": 508 }
  ],
  "newDomainCardId": 512,
  "equipNewDomainCard": false
}
```

Server behavior:
- Counts player entries (types ≠ `FEATURE_DOMAIN_CARD`) → 2 ✓
- Validates `domainCardId=508` against the character's accessible domains + next-tier level cap.
- Persists the card unequipped. `equipDomainCard` is ignored on `FEATURE_DOMAIN_CARD`.
- Logs all three entries in the advancement log so undo removes the bonus card too.

### Example: two bonus cards from a single feature (`value: 2`)

```json
{
  "advancements": [
    { "type": "MULTICLASS", "subclassCardId": 91 },
    { "type": "BOOST_EVASION" },
    { "type": "FEATURE_DOMAIN_CARD", "domainCardId": 601 },
    { "type": "FEATURE_DOMAIN_CARD", "domainCardId": 602 }
  ]
}
```

---

## 5. Character-creation request shape

Nothing changed on the backend. The client is entirely responsible for the picker UX. Append the player's bonus picks to the existing lists:

```json
POST /api/dh/character-sheets
{
  "...": "...",
  "subclassCardIds": [73],
  "equippedDomainCardIds": [301, 302],
  "vaultDomainCardIds": [303, 508]   // 508 is the bonus pick granted by subclass 73's feature
}
```

The client's subclass-selection step should:
1. On subclass card pick, compute `totalBonusSlotsForCard(card)`.
2. Render that many additional picker slots in the domain-card selection step.
3. Filter candidates to the character's accessible domains (derived from all picked subclass paths' `associatedDomains`).
4. Enforce the domain-card level cap for starting characters (level-1 cards only for initial creation).

---

## 6. Validation the client should mirror

To fail fast before hitting the server, replicate these rules client-side:

| Rule                                                         | Level-up | Creation |
|--------------------------------------------------------------|:--------:|:--------:|
| Exactly 2 player-chosen advancements (type ≠ FEATURE_DOMAIN_CARD) | ✓ | — |
| Bonus card domain must be in `accessibleDomainIds`            | ✓ | ✓ |
| Bonus card level ≤ tier cap (tier 2→4, tier 3→7, tier 4→none) | ✓ | ✓ (level 1 at creation) |
| No duplicate card IDs across vault + equipped lists (creation) | — | ✓ |
| Bonus card slot count matches feature modifier sum            | ✓ | ✓ |

Accessible domains come from `GET /api/dh/character-sheets/{id}/level-up-options` (`accessibleDomainIds` field) for level-up flows, and are computed client-side from selected subclass paths during creation.

---

## 7. UI notes

- **Label**: Treat bonus picker slots visually distinct from Step 4's "normal" level-up card — e.g. a subtitle like *"Bonus card from [Feature Name]"* so players understand it doesn't consume their per-tier GAIN_DOMAIN_CARD allotment.
- **No equip toggle** on bonus cards at level-up — the server stores them unequipped. (Players can equip them later through the normal domain card management UI.)
- **Undo**: No client changes; `POST /api/dh/character-sheets/{id}/undo-level-up` already reverses bonus-card grants logged via `FEATURE_DOMAIN_CARD`.
- **Optimistic UI**: when computing the post-level-up card count, remember bonus cards are *never* auto-equipped, so they don't change the "equipped / 5" badge.

---

## 8. Testing checklist

- [ ] Subclass card picker → bonus slot count reflects modifier sum.
- [ ] Creation flow submits bonus card IDs in `vaultDomainCardIds`, never double-counting.
- [ ] Level-up flow produces exactly one `FEATURE_DOMAIN_CARD` entry per chosen bonus card.
- [ ] Level-up succeeds with 2 player entries + N feature entries (verify 200 response).
- [ ] Attempting to submit 3+ non-feature player entries is caught client-side (server would return 400).
- [ ] Picking a bonus card from a non-accessible domain is prevented pre-submit.
- [ ] Undo reverses the added bonus card (no orphan row in vault).
- [ ] A character who took a bonus-granting feature at a previous level does NOT get extra pickers on subsequent level-ups.

---

## 9. Reference

- Backend source: `com.aboff.core.service.dh.LevelUpService`
- Enum: `com.aboff.core.model.enums.AdvancementType.FEATURE_DOMAIN_CARD`
- Enum: `com.aboff.core.model.enums.ModifierTarget.BONUS_DOMAIN_CARD_SELECTIONS`
- Authoritative API docs: `.api-blueprint/references/character-sheets-api.md` (level-up section), `.api-blueprint/references/shared-models.md` (AdvancementType, ModifierTarget), `.api-blueprint/references/feature-modifiers-api.md`
- Tests demonstrating accepted/rejected shapes: `LevelUpServiceTest#levelUp_featureDomainCard*`
