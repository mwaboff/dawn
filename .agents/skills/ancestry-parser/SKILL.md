---
name: ancestry-parser
description: This skill should be used when the user asks to "parse ancestries", "convert ancestry cards", "extract ancestries from HTML", "import ancestries", mentions ancestries.html, or wants to convert Daggerheart ancestry HTML into structured JSON for API import.
version: 1.0.0
---

# Ancestry Parser Skill

Parses Daggerheart ancestries from HTML reference pages and converts them into structured JSON for API import via the bulk ancestry card endpoint.

## When to Use

**Use for:** Converting HTML ancestry references into structured JSON, bulk importing ancestries, updating ancestry data from HTML sources.

**Skip for:** Editing individual ancestry JSON by hand, working with non-ancestry HTML.

## Workflow

### Step 1: Extract Raw Ancestry Data

Run the HTML parser script to extract raw ancestry data:

```bash
node scripts/parse-ancestries.js [path-to-html]
```

If no path is given, defaults to `data/ancestries.html` in the project root.

The script outputs an array of raw ancestry objects with: `name`, `description` (first sentence only), `features` (array of `{name, description}`).

Use `--count` flag for a summary instead of full JSON output.

### Step 2: Spawn Agent Team (in parallel)

Spawn 2 agents in parallel to process the raw ancestries:

1. **cost-tagger** (`.claude/agents/cost-tagger.md`) — Identifies cost tags (Hope, Stress, timing, limitations) in each feature description
2. **modifier-detector** (`.claude/agents/modifier-detector.md`) — Identifies stat modifiers (+X to stat) in each feature description

Each agent processes ALL ancestries and ALL features independently. Their results are merged in Step 3.

### Step 3: Assemble Final JSON

Merge the agent outputs into the final JSON structure. The output is an array suitable for `POST /api/dh/cards/ancestry/bulk`:

```json
[
  {
    "name": "Elf",
    "description": "Elves are typically tall humanoids with pointed ears and acutely attuned senses.",
    "expansionId": 1,
    "isOfficial": true,
    "features": [
      {
        "name": "Quick Reactions",
        "description": "Mark a Stress to gain advantage on a reaction roll.",
        "featureType": "ANCESTRY",
        "expansionId": 1,
        "costTags": [{ "label": "1 Stress", "category": "COST" }]
      },
      {
        "name": "Celestial Trance",
        "description": "During a rest, you can drop into a trance to choose an additional downtime move.",
        "featureType": "ANCESTRY",
        "expansionId": 1
      }
    ]
  }
]
```

**Assembly rules:**

- `expansionId: 1` and `isOfficial: true` on all entities
- Features use `featureType: "ANCESTRY"`
- Each ancestry has exactly 2 features
- Omit `costTags` array on a feature if no costs were detected
- Omit `modifiers` array on a feature if no modifiers were detected

### Step 4: Write Output

Write the final JSON array to `data/ancestries.json`.

## Reference Tables

### Cost Tag Patterns

Feature descriptions have `**` markers stripped before output, so match plain text:

- `"mark a Stress"` or `"Mark a Stress"` → `{ "label": "1 Stress", "category": "COST" }`
- `"mark 2 Stress"` → `{ "label": "2 Stress", "category": "COST" }`
- `"mark X Stress"` → `{ "label": "X Stress", "category": "COST" }`
- `"spend a Hope"` or `"Spend a Hope"` → `{ "label": "1 Hope", "category": "COST" }`
- `"spend X Hope"` or `"Spend X Hope"` → `{ "label": "X Hope", "category": "COST" }`
- `"Once per long rest"` → `{ "label": "1/long rest", "category": "TIMING" }`
- `"Once per rest"` → `{ "label": "1/rest", "category": "TIMING" }`
- `"Once per session"` → `{ "label": "1/session", "category": "TIMING" }`
- A feature may have multiple cost tags or none at all

**Ignore damage quantities** — phrases like "dealing an extra 2d6 damage" or "deals d12 physical damage" are dice rolls, not costs.

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

- `"permanent +1 bonus to your Evasion"` → `{ "target": "EVASION", "operation": "ADD", "value": 1 }`
- `"Gain an additional Hit Point slot"` → `{ "target": "HIT_POINT_MAX", "operation": "ADD", "value": 1 }`
- `"Gain an additional Stress slot"` → `{ "target": "STRESS_MAX", "operation": "ADD", "value": 1 }`
- `"bonus to your damage thresholds equal to your Proficiency"` — skip (dynamic/non-numeric, not a static modifier)
- `"permanent +1 bonus to it"` referring to an Experience — skip (Experiences are not a modifier target)
- Most ancestry features do NOT have modifiers — only tag when there's an explicit numeric bonus to a recognized target
- Default operation is `ADD`

## API Endpoint

The output JSON is designed for bulk import via:

```
POST /api/dh/cards/ancestry/bulk
```

This endpoint accepts an array of ancestry card objects and supports inline find-or-create for features, cost tags, and modifiers. See the `core-api-blueprint` skill for full endpoint documentation.

## Refinement Notes

When updating this skill:
- Add new cost patterns to the Cost Tag Patterns section
- Add new modifier mappings to the Modifier Detection Rules
- Verify the bulk endpoint schema against the live API before import
