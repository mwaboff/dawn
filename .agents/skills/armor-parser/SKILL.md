---
name: armor-parser
description: This skill should be used when the user asks to "parse armor", "convert armor data", "extract armor from HTML", "import armor", mentions armor.html, or wants to convert Daggerheart armor HTML into structured JSON for API import.
version: 1.0.0
---

# Armor Parser Skill

Parses Daggerheart armor from HTML reference pages and converts them into structured JSON for API import via the bulk armor endpoint.

## When to Use

**Use for:** Converting HTML armor references into structured JSON, bulk importing armor, updating armor data from HTML sources.

**Skip for:** Editing individual armor JSON by hand, working with non-armor HTML.

## Workflow

### Step 1: Extract Raw Armor Data

Run the HTML parser script:

```bash
node scripts/parse-armor.js [path-to-html]
```

Defaults to `data/armor.html`. Outputs array of raw armor objects. Use `--count` for summary.

### Step 2: Spawn Agent Team (in parallel)

Spawn 1 agent:

1. **modifier-detector** (`.claude/agents/modifier-detector.md`) -- Identifies stat modifiers (+/- to Evasion, Agility, etc.) in feature descriptions

### Step 3: Assemble Final JSON

Merge agent output into final structure for `POST /api/dh/armors/bulk`:

```json
[
  {
    "name": "Gambeson Armor",
    "expansionId": 1,
    "isOfficial": true,
    "tier": 1,
    "baseMajorThreshold": 5,
    "baseSevereThreshold": 11,
    "baseScore": 3,
    "features": [
      {
        "name": "Flexible",
        "description": "+1 to Evasion",
        "featureType": "ITEM",
        "expansionId": 1,
        "modifiers": [{ "target": "EVASION", "operation": "ADD", "value": 1 }]
      }
    ]
  }
]
```

Assembly rules:
- `expansionId: 1` and `isOfficial: true` on all entities
- Features use `featureType: "ITEM"`
- Omit `features` array entirely if armor has no feature
- Omit `modifiers` array on features if no modifiers detected

### Step 4: Write Output

Write to `data/armor.json`.

## Reference Tables

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

- Look for: "+X bonus to [stat]", "gain +X to [stat]", "increase [stat] by X", "+X to [stat]"
- "damage thresholds" (plural) → BOTH `MAJOR_DAMAGE_THRESHOLD` and `SEVERE_DAMAGE_THRESHOLD`
- Most armors do NOT have modifiers — only tag when there's an explicit numeric bonus
- Default operation is `ADD`

### API Endpoint

`POST /api/dh/armors/bulk`

Accepts an array of armor objects as the request body. Each armor object follows the structure shown in Step 3.
