---
name: subclass-card-parser
description: This skill should be used when the user asks to "parse subclass cards", "convert subclass cards", "extract subclass cards from HTML", "import subclass cards", mentions subclass-raw.html, or wants to convert Daggerheart subclass card HTML into structured JSON for API import.
version: 1.0.0
---

# Subclass Card Parser Skill

Parses Daggerheart subclass cards from HTML reference pages and converts them into structured JSON for API import via the bulk subclass card endpoint.

## When to Use

**Use for:** Converting HTML subclass card references into structured JSON, bulk importing subclass cards, updating subclass card data from HTML sources.

**Skip for:** Editing individual card JSON by hand, working with non-subclass-card HTML.

## Workflow

### Step 1: Extract Raw Card Data

Run the HTML parser script to extract raw card data:

```bash
node scripts/parse-subclass-cards.js [path-to-html]
```

If no path is given, defaults to `data/subclass-raw.html` in the project root.

The script outputs an array of raw card objects with: `className`, `subclassPathName`, `spellcastingTrait`, `level`, `features` (array of `{name, description}`), `rawHtml`.

Use `--count` flag for a summary instead of full JSON output.

### Step 2: Spawn Agent Team (in parallel)

Spawn 2 agents in parallel to process the raw cards:

1. **cost-tagger** (`.claude/agents/cost-tagger.md`) — Identifies cost tags (Hope, Stress, timing, limitations) in each feature description
2. **modifier-detector** (`.claude/agents/modifier-detector.md`) — Identifies stat modifiers (+X to stat) in each feature description

Each agent processes ALL cards independently. Their results are merged in Step 3.

Note: Feature splitting is NOT needed here — the parser script already extracts individual named features from the HTML structure.

### Step 3: Assemble Final JSON

Merge the agent outputs into the final JSON structure. The output is an array suitable for `POST /api/dh/cards/subclass/bulk`:

```json
[
  {
    "name": "Subclass Path Name",
    "expansionId": 1,
    "isOfficial": true,
    "associatedClassId": 1,
    "subclassPath": {
      "name": "Subclass Path Name",
      "spellcastingTrait": "PRESENCE"
    },
    "level": "FOUNDATION",
    "features": [
      {
        "name": "Feature Name",
        "description": "Feature description text",
        "featureType": "SUBCLASS",
        "expansionId": 1,
        "costTags": [{ "label": "1 Hope", "category": "COST" }],
        "modifiers": [{ "target": "MAJOR_DAMAGE_THRESHOLD", "operation": "ADD", "value": 1 }]
      }
    ]
  }
]
```

**Assembly rules:**

- Card `name` = the subclass path name (e.g., "Troubadour", "Stalwart")
- Use `associatedClassId` + inline `subclassPath` (find-or-create pattern) — do NOT use `subclassPathId`
- Omit `spellcastingTrait` from `subclassPath` if it was `null` in the parsed data
- Omit `costTags` array on features if no costs detected
- Omit `modifiers` array on features if no modifiers detected
- All features use `"featureType": "SUBCLASS"`
- All cards use `"expansionId": 1` and `"isOfficial": true`

### Step 4: Write Output

Write the final JSON array to `data/subclass-cards.json`.

## Reference Tables

### Class ID Mapping

| Class | ID |
|---|---|
| Bard | 1 |
| Druid | 2 |
| Guardian | 3 |
| Ranger | 4 |
| Rogue | 5 |
| Seraph | 6 |
| Sorcerer | 7 |
| Warrior | 8 |
| Wizard | 9 |

**Important:** These IDs depend on the order classes were created in the backend. Verify by calling `GET /api/dh/classes` before using. If IDs differ, update this table.

### Subclass Level Mapping

HTML heading → JSON value:
- `Foundation features` → `FOUNDATION`
- `Specializations features` → `SPECIALIZATION`
- `Masteries features` → `MASTERY`

### Spellcasting Trait Mapping

HTML value → JSON value (uppercase):
- `Agility` → `AGILITY`
- `Strength` → `STRENGTH`
- `Finesse` → `FINESSE`
- `Instinct` → `INSTINCT`
- `Presence` → `PRESENCE`
- `Knowledge` → `KNOWLEDGE`
- Empty/missing → omit `spellcastingTrait` from `subclassPath`

### Cost Tag Patterns

Look for these phrases in feature descriptions:

- "Spend a Hope" → `{ "label": "1 Hope", "category": "COST" }`
- "Spend X Hope" → `{ "label": "X Hope", "category": "COST" }`
- "spend a Hope" (lowercase) → same
- "Mark a Stress" → `{ "label": "1 Stress", "category": "COST" }`
- "Mark X Stress" → `{ "label": "X Stress", "category": "COST" }`
- "mark a Stress" (lowercase) → same
- "Once per long rest" → `{ "label": "1/long rest", "category": "TIMING" }`
- "Once per rest" → `{ "label": "1/rest", "category": "TIMING" }`
- "Once per session" → `{ "label": "1/session", "category": "TIMING" }`
- "Close range" (as a limitation) → `{ "label": "Close range", "category": "LIMITATION" }`
- "Melee range" (as a limitation) → `{ "label": "Melee range", "category": "LIMITATION" }`
- A feature may have multiple costs or no cost at all

### Modifier Targets

```
AGILITY, STRENGTH, FINESSE, INSTINCT, PRESENCE, KNOWLEDGE,
EVASION, MAJOR_DAMAGE_THRESHOLD, SEVERE_DAMAGE_THRESHOLD,
HIT_POINT_MAX, STRESS_MAX, HOPE_MAX, ARMOR_MAX, GOLD,
ATTACK_ROLL, DAMAGE_ROLL, PRIMARY_DAMAGE_ROLL, ARMOR_SCORE
```

### Modifier Operations

- `ADD` — Adds the value to the target attribute
- `SET` — Sets the target attribute to the specified value
- `MULTIPLY` — Multiplies the target attribute by the specified value

### Modifier Detection Rules

- Look for: "+X bonus to [stat]", "gain +X to [stat]", "increase [stat] by X", "Gain a permanent +X bonus to [stat]"
- "damage thresholds" (plural) → BOTH `MAJOR_DAMAGE_THRESHOLD` and `SEVERE_DAMAGE_THRESHOLD`
- "additional Hit Point slot" → `HIT_POINT_MAX` ADD 1
- "additional Stress slot" → `STRESS_MAX` ADD 1
- Most cards do NOT have modifiers — only tag when there's an explicit numeric bonus
- Default operation is `ADD`

## API Endpoint

The output JSON is designed for bulk import via:

```
POST /api/dh/cards/subclass/bulk
```

This endpoint accepts an array of `CreateSubclassCardRequest` objects and supports inline find-or-create for subclass paths, features, cost tags, and modifiers. See the `core-api-blueprint` skill's `references/subclass-cards-api.md` for full endpoint documentation.

## Refinement Notes

When updating this skill:
- Add new cost patterns to the Cost Tag Patterns section
- Add new modifier mappings to the Modifier Detection Rules
- Update class IDs if new classes are added or IDs change
- Update spellcasting trait mappings if new traits are introduced
- Verify class IDs against the live API before bulk import
