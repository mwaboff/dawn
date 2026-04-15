---
name: adversary-parser
description: This skill should be used when the user asks to "parse adversaries", "convert adversary cards", "extract adversaries from HTML", "import adversaries", mentions adversaries.html, or wants to convert Daggerheart adversary HTML into structured JSON for API import.
version: 1.0.0
---

# Adversary Parser Skill

Parses Daggerheart adversaries from HTML reference pages and converts them into structured JSON for API import via the batch adversary endpoint.

## When to Use

**Use for:** Converting HTML adversary references into structured JSON, bulk importing adversaries, updating adversary data from HTML sources.

**Skip for:** Editing individual adversary JSON by hand, working with non-adversary HTML.

## Workflow

### Step 1: Extract Raw Adversary Data

Run the HTML parser script to extract raw adversary data:

```bash
node scripts/parse-adversaries.js [path-to-html]
```

If no path is given, defaults to `data/adversaries.html` in the project root.

The script outputs an array of raw adversary objects with: `name`, `description`, `motivesAndTactics`, `tier`, `adversaryType`, `difficulty`, `majorThreshold`, `severeThreshold`, `hitPointMax`, `stressMax`, `attackModifier`, `weaponName`, `attackRange`, `damage` (`{diceCount, diceType, modifier, damageType}`), `experience`, `features` (array of `{name, description}`).

Use `--count` flag for a summary instead of full JSON output.

### Step 2: Spawn Agent Team (in parallel)

Spawn 2 agents in parallel to process the features:

1. **cost-tagger** (`.claude/agents/cost-tagger.md`) -- Identifies cost tags (Hope, Stress, timing, limitations) in each feature description
2. **modifier-detector** (`.claude/agents/modifier-detector.md`) -- Identifies stat modifiers (+X to stat) in each feature description

Each agent processes ALL adversaries' features independently. Their results are merged in Step 3.

### Step 3: Assemble Final JSON

Merge the agent outputs into the final JSON structure. The batch endpoint requires a **wrapped request object** with an `adversaries` array:

```json
{
  "adversaries": [
    {
      "name": "Acid Burrower",
      "description": "A horse-sized insect with digging claws and acidic blood.",
      "motivesAndTactics": "Burrow, drag away, feed, reposition",
      "tier": 1,
      "adversaryType": "SOLO",
      "difficulty": 14,
      "majorThreshold": 8,
      "severeThreshold": 15,
      "hitPointMax": 8,
      "stressMax": 3,
      "attackModifier": 3,
      "weaponName": "Claws",
      "attackRange": "VERY_CLOSE",
      "damage": {
        "diceCount": 1,
        "diceType": "D12",
        "modifier": 2,
        "damageType": "PHYSICAL"
      },
      "expansionId": 1,
      "isPublic": true,
      "features": [
        {
          "name": "Relentless (3) - Passive",
          "description": "The Burrower can be spotlighted up to three times per GM turn. Spend Fear as usual to spotlight them.",
          "featureType": "OTHER",
          "expansionId": 1,
          "costTags": [{ "label": "3 Fear", "category": "COST" }]
        },
        {
          "name": "Earth Eruption - Action",
          "description": "Mark a Stress to have the Burrower burst out of the ground...",
          "featureType": "OTHER",
          "expansionId": 1,
          "costTags": [{ "label": "1 Stress", "category": "COST" }]
        }
      ]
    }
  ]
}
```

**Assembly rules:**

- Card `name` = the adversary name (e.g., "Acid Burrower", "Bear")
- All adversaries use `"expansionId": 1` and `"isPublic": true`
- Features use `"featureType": "OTHER"`
- Omit `costTags` array on features if no costs detected
- Omit `modifiers` array on features if no modifiers detected
- `majorThreshold` and `severeThreshold` may be `null` for minions (thresholds = "None")
- Flat damage (no dice, e.g. "1 phy") uses `diceCount: 0`, `diceType: null`, with the flat value as `modifier`
- Drop `experience` from the raw parse output — the API uses `experienceIds` (array of existing experience entity IDs). If experience entities haven't been created yet, omit `experienceIds` or set to `[]`
- The response uses 201 (all success), 207 (partial success), or 400 (all failed) with `created`, `errors`, `totalRequested`, `totalCreated`, `totalFailed` fields

### Step 4: Write Output

Write the final JSON array to `data/adversaries.json`.

## Reference Tables

### Adversary Type Mapping

| HTML Value | JSON Value |
|---|---|
| Solo | SOLO |
| Bruiser | BRUISER |
| Skulk | SKULK |
| Standard | STANDARD |
| Ranged | RANGED |
| Support | SUPPORT |
| Leader | LEADER |
| Minion | MINION |
| Horde | HORDE |
| Social | SOCIAL |

Note: Horde types in the HTML may include a count suffix (e.g., `Horde (5/HP)`). The script uppercases the full string from `data-type`.

### Range Mapping

| HTML Value | JSON Value |
|---|---|
| Melee | MELEE |
| Very Close | VERY_CLOSE |
| Close | CLOSE |
| Far | FAR |
| Very Far | VERY_FAR |

### Damage Type Mapping

| HTML Value | JSON Value |
|---|---|
| phy | PHYSICAL |
| mag | MAGIC |

### Cost Tag Patterns

Look for these phrases in feature descriptions:

- "Spend a Hope" -> `{ "label": "1 Hope", "category": "COST" }`
- "Spend X Hope" -> `{ "label": "X Hope", "category": "COST" }`
- "spend a Hope" (lowercase) -> same
- "Mark a Stress" -> `{ "label": "1 Stress", "category": "COST" }`
- "Mark X Stress" -> `{ "label": "X Stress", "category": "COST" }`
- "mark a Stress" (lowercase) -> same
- "Spend a Fear" -> `{ "label": "1 Fear", "category": "COST" }`
- "Spend X Fear" -> `{ "label": "X Fear", "category": "COST" }`
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
- Most adversary features do NOT have modifiers -- only tag when there's an explicit numeric bonus
- Default operation is `ADD`

## API Endpoint

The output JSON is designed for bulk import via:

```
POST /api/dh/adversaries/batch
```

This endpoint accepts a **wrapped request object** (`{ "adversaries": [...] }`) and supports inline find-or-create for features, cost tags, and modifiers. Returns 201/207/400 with `created`/`errors` arrays. See the `core-api-blueprint` skill for full endpoint documentation.

## Refinement Notes

When updating this skill:
- Add new cost patterns to the Cost Tag Patterns section
- Add new modifier mappings to the Modifier Detection Rules
- Update adversary type or range mappings if new values appear in HTML
- Handle new damage formats if they appear (e.g., multi-damage types)
