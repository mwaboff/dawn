---
name: community-parser
description: This skill should be used when the user asks to "parse communities", "convert community cards", "extract communities from HTML", "import communities", mentions communities.html, or wants to convert Daggerheart community HTML into structured JSON for API import.
version: 1.0.0
---

# Community Parser Skill

Parses Daggerheart communities from HTML reference pages and converts them into structured JSON for API import via the bulk community card endpoint.

## When to Use

**Use for:** Converting HTML community references into structured JSON, bulk importing communities, updating community data from HTML sources.

**Skip for:** Editing individual community JSON by hand, working with non-community HTML.

## Workflow

### Step 1: Extract Raw Community Data

Run the HTML parser script to extract raw community data:

```bash
node scripts/parse-communities.js [path-to-html]
```

If no path is given, defaults to `data/communities.html` in the project root.

The script outputs an array of raw community objects with: `name`, `description`, `featureName`, `featureDescription`.

Use `--count` flag for a summary instead of full JSON output.

### Step 2: Spawn Agent Team (in parallel)

Spawn 2 agents in parallel to process the raw communities:

1. **cost-tagger** (`.claude/agents/cost-tagger.md`) -- Identifies cost tags (Hope, Stress, timing, limitations) in each feature description
2. **modifier-detector** (`.claude/agents/modifier-detector.md`) -- Identifies stat modifiers (+X to stat) in each feature description

Each agent processes ALL communities independently. Their results are merged in Step 3.

### Step 3: Assemble Final JSON

Merge the agent outputs into the final JSON structure. The output is an array suitable for `POST /api/dh/cards/community/bulk`:

```json
[
  {
    "name": "Highborne",
    "description": "Being part of a highborne community means...",
    "expansionId": 1,
    "isOfficial": true,
    "features": [
      {
        "name": "Privilege",
        "description": "You have advantage on rolls to consort with nobles...",
        "featureType": "COMMUNITY",
        "expansionId": 1
      }
    ]
  }
]
```

**Assembly rules:**

- `expansionId: 1` and `isOfficial: true` on all entities
- Features use `featureType: "COMMUNITY"`
- Each community has exactly 1 feature
- Omit empty `costTags`/`modifiers` arrays

### Step 4: Write Output

Write the final JSON array to `data/communities.json`.

## Reference Tables

### Cost Tag Patterns

Look for these phrases in feature descriptions:

- "Spend a Hope" -> `{ "label": "1 Hope", "category": "COST" }`
- "Spend X Hope" -> `{ "label": "X Hope", "category": "COST" }`
- "spend a Hope" (lowercase) -> same
- "Mark a Stress" -> `{ "label": "1 Stress", "category": "COST" }`
- "Mark X Stress" -> `{ "label": "X Stress", "category": "COST" }`
- "mark a Stress" (lowercase) -> same
- "Once per long rest" -> `{ "label": "1/long rest", "category": "TIMING" }`
- "Once per rest" -> `{ "label": "1/rest", "category": "TIMING" }`
- "Once per session" -> `{ "label": "1/session", "category": "TIMING" }`
- "Close range" (as a limitation) -> `{ "label": "Close range", "category": "LIMITATION" }`
- "Melee range" (as a limitation) -> `{ "label": "Melee range", "category": "LIMITATION" }`
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
- "additional Hit Point slot" -> `HIT_POINT_MAX` ADD 1
- "additional Stress slot" -> `STRESS_MAX` ADD 1
- Most communities do NOT have modifiers -- only tag when there's an explicit numeric bonus
- Default operation is `ADD`

## API Endpoint

The output JSON is designed for bulk import via:

```
POST /api/dh/cards/community/bulk
```

This endpoint accepts an array of community card objects and supports inline find-or-create for features, cost tags, and modifiers. See the `core-api-blueprint` skill for full endpoint documentation.

## Refinement Notes

When updating this skill:
- Add new cost patterns to the Cost Tag Patterns section
- Add new modifier mappings to the Modifier Detection Rules
- Verify the bulk endpoint schema against the live API before import
