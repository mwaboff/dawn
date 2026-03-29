---
name: class-card-parser
description: This skill should be used when the user asks to "parse classes", "convert class cards", "extract classes from HTML", "import classes", mentions class-raw.html, or wants to convert Daggerheart class HTML into structured JSON for API import.
version: 1.0.0
---

# Class Card Parser Skill

Parses Daggerheart classes from HTML reference pages and converts them into structured JSON for API import via the bulk class endpoint.

## When to Use

**Use for:** Converting HTML class references into structured JSON, bulk importing classes, updating class data from HTML sources.

**Skip for:** Editing individual class JSON by hand, working with non-class HTML, subclass or domain card parsing.

## Workflow

### Step 1: Extract Raw Class Data

Run the HTML parser script to extract raw class data:

```bash
node scripts/parse-class-cards.js [path-to-html]
```

If no path is given, defaults to `data/class-raw.html` in the project root.

The script outputs an array of raw class objects with: `name`, `description`, `domains` (array of `{name, id}`), `startingEvasion`, `startingHitPoints`, `startingClassItems`, `hopeFeature` (`{name, description}`), `subclasses` (array of names).

Use `--count` flag for a summary instead of full JSON output.

### Step 2: Spawn Agent Team (in parallel)

Spawn 2 agents in parallel to process the hope features:

1. **cost-tagger** (`.claude/agents/cost-tagger.md`) -- Identifies cost tags (Hope, Stress, timing, limitations) in each hope feature description
2. **modifier-detector** (`.claude/agents/modifier-detector.md`) -- Identifies stat modifiers (+X to stat) in each hope feature description

Each agent processes ALL classes' hope features independently. Their results are merged in Step 3.

### Step 3: Assemble Final JSON

Merge the agent outputs into the final JSON structure. The output is an array suitable for `POST /api/dh/classes/bulk`:

```json
[
  {
    "name": "Bard",
    "description": "Class description text...",
    "expansionId": 1,
    "startingEvasion": 10,
    "startingHitPoints": 5,
    "startingClassItems": "A romance novel or a letter never opened",
    "associatedDomainIds": [4, 5],
    "hopeFeatures": [
      {
        "name": "Make a Scene",
        "description": "Spend 3 Hope to temporarily Distract a target within Close range, giving them a -2 penalty to their Difficulty.",
        "featureType": "HOPE",
        "expansionId": 1,
        "costTags": [{ "label": "3 Hope", "category": "COST" }]
      }
    ]
  }
]
```

**Assembly rules:**

- Card `name` = the class name (e.g., "Bard", "Guardian")
- Use `associatedDomainIds` from the parsed domain IDs
- Hope features use `"featureType": "HOPE"`
- Omit `costTags` array on hope features if no costs detected
- Omit `modifiers` array on hope features if no modifiers detected
- All classes use `"expansionId": 1`
- Omit `startingClassItems` if null

### Step 4: Write Output

Write the final JSON array to `data/class-cards.json`.

## Reference Tables

### Domain ID Mapping

| Domain | ID |
|---|---|
| Arcana | 1 |
| Blade | 2 |
| Bone | 3 |
| Codex | 4 |
| Grace | 5 |
| Midnight | 6 |
| Sage | 7 |
| Splendor | 8 |
| Valor | 9 |

**Important:** These IDs depend on the order domains were created in the backend. Verify by calling `GET /api/dh/domains` before using. If IDs differ, update this table.

### Cost Tag Patterns

Look for these phrases in hope feature descriptions:

- "Spend a Hope" -> `{ "label": "1 Hope", "category": "COST" }`
- "Spend X Hope" -> `{ "label": "X Hope", "category": "COST" }`
- "spend a Hope" (lowercase) -> same
- "Mark a Stress" -> `{ "label": "1 Stress", "category": "COST" }`
- "Mark X Stress" -> `{ "label": "X Stress", "category": "COST" }`
- "mark a Stress" (lowercase) -> same
- "Once per long rest" -> `{ "label": "1/long rest", "category": "TIMING" }`
- "Once per rest" -> `{ "label": "1/rest", "category": "TIMING" }`
- "Once per session" -> `{ "label": "1/session", "category": "TIMING" }`
- A feature may have multiple costs or no cost at all

### Modifier Targets

```
AGILITY, STRENGTH, FINESSE, INSTINCT, PRESENCE, KNOWLEDGE,
EVASION, MAJOR_DAMAGE_THRESHOLD, SEVERE_DAMAGE_THRESHOLD,
HIT_POINT_MAX, STRESS_MAX, HOPE_MAX, ARMOR_MAX, GOLD,
ATTACK_ROLL, DAMAGE_ROLL, PRIMARY_DAMAGE_ROLL, ARMOR_SCORE
```

### Modifier Operations

- `ADD` -- Adds the value to the target attribute
- `SET` -- Sets the target attribute to the specified value
- `MULTIPLY` -- Multiplies the target attribute by the specified value

### Modifier Detection Rules

- Look for: "+X bonus to [stat]", "gain +X to [stat]", "increase [stat] by X", "Gain a permanent +X bonus to [stat]"
- "damage thresholds" (plural) -> BOTH `MAJOR_DAMAGE_THRESHOLD` and `SEVERE_DAMAGE_THRESHOLD`
- Most hope features do NOT have modifiers -- only tag when there's an explicit numeric bonus
- Default operation is `ADD`

## API Endpoint

The output JSON is designed for bulk import via:

```
POST /api/dh/classes/bulk
```

This endpoint accepts an array of `CreateClassRequest` objects and supports inline find-or-create for features, cost tags, and modifiers. See the `core-api-blueprint` skill's `references/classes-api.md` for full endpoint documentation.

## Refinement Notes

When updating this skill:
- Add new cost patterns to the Cost Tag Patterns section
- Add new modifier mappings to the Modifier Detection Rules
- Update domain IDs if new domains are added or IDs change
- Verify domain IDs against the live API before bulk import
