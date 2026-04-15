---
name: weapon-parser
description: This skill should be used when the user asks to "parse weapons", "convert weapon data", "extract weapons from HTML", "import weapons", mentions weapons.html, or wants to convert Daggerheart weapon HTML into structured JSON for API import.
version: 1.0.0
---

# Weapon Parser Skill

Parses Daggerheart weapons from HTML reference pages and converts them into structured JSON for API import via the bulk weapon endpoint.

## When to Use

**Use for:** Converting HTML weapon references into structured JSON, bulk importing weapons, updating weapon data from HTML sources.

**Skip for:** Editing individual weapon JSON by hand, working with non-weapon HTML.

## Workflow

### Step 1: Extract Raw Weapon Data

```bash
node scripts/parse-weapons.js [path-to-html]
```

Defaults to `data/weapons.html`. Outputs array of raw weapon objects. Use `--count` for summary.

### Step 2: Spawn Agent Team (in parallel)

Spawn 1 agent:

1. **modifier-detector** (`.claude/agents/modifier-detector.md`) -- Identifies stat modifiers (+/- to attack rolls, Evasion, etc.) in feature descriptions

### Step 3: Assemble Final JSON

For `POST /api/dh/weapons/bulk`:

```json
[
  {
    "name": "Broadsword",
    "expansionId": 1,
    "isOfficial": true,
    "tier": 1,
    "isPrimary": true,
    "trait": "AGILITY",
    "range": "MELEE",
    "burden": "ONE_HANDED",
    "damage": { "diceCount": 1, "diceType": "D8", "damageType": "PHYSICAL" },
    "features": [
      {
        "name": "Reliable",
        "description": "+1 to attack rolls",
        "featureType": "ITEM",
        "expansionId": 1,
        "modifiers": [{ "target": "ATTACK_ROLL", "operation": "ADD", "value": 1 }]
      }
    ]
  }
]
```

Assembly rules:
- `expansionId: 1` and `isOfficial: true` on all entities
- Features use `featureType: "ITEM"`
- Omit `features` array if weapon has no feature
- Omit `modifiers` array on features if no modifiers
- Omit `modifier` from damage object if 0

### Step 4: Write Output

Write to `data/weapons.json`.

## Reference Tables

### Category Mapping

| HTML Value   | JSON Field  | JSON Value |
|-------------|-------------|------------|
| Primary     | isPrimary   | true       |
| Secondary   | isPrimary   | false      |

### Damage Type Mapping

| HTML Value | JSON Value |
|-----------|------------|
| Physical  | PHYSICAL   |
| Magical   | MAGIC      |

### Trait Mapping

| HTML Value | JSON Value  |
|-----------|-------------|
| Agility   | AGILITY     |
| Strength  | STRENGTH    |
| Finesse   | FINESSE     |
| Instinct  | INSTINCT    |
| Presence  | PRESENCE    |
| Knowledge | KNOWLEDGE   |

### Range Mapping

| HTML Value | JSON Value |
|-----------|------------|
| Melee     | MELEE      |
| Very Close| VERY_CLOSE |
| Close     | CLOSE      |
| Far       | FAR        |
| Very Far  | VERY_FAR   |

### Burden Mapping

| HTML Value  | JSON Value  |
|------------|-------------|
| One-Handed | ONE_HANDED  |
| Two-Handed | TWO_HANDED  |

### Dice Type Mapping

| HTML Value | JSON Value |
|-----------|------------|
| d4        | D4         |
| d6        | D6         |
| d8        | D8         |
| d10       | D10        |
| d12       | D12        |
| d20       | D20        |

### Modifier Targets

```
AGILITY, STRENGTH, FINESSE, INSTINCT, PRESENCE, KNOWLEDGE,
EVASION, MAJOR_DAMAGE_THRESHOLD, SEVERE_DAMAGE_THRESHOLD,
HIT_POINT_MAX, STRESS_MAX, HOPE_MAX, ARMOR_MAX, GOLD,
ATTACK_ROLL, DAMAGE_ROLL, PRIMARY_DAMAGE_ROLL, ARMOR_SCORE
```

### Modifier Operations

- `ADD` — Adds the value to the target attribute (use negative values for penalties)
- `SET` — Sets the target attribute to the specified value
- `MULTIPLY` — Multiplies the target attribute by the specified value

### Modifier Detection Rules

- `+N to attack rolls` -> target: ATTACK_ROLL, operation: ADD, value: N
- `-N to attack rolls` -> target: ATTACK_ROLL, operation: ADD, value: -N
- `+N damage` -> target: DAMAGE_ROLL, operation: ADD, value: N
- `+N to Evasion` -> target: EVASION, operation: ADD, value: N
- `-N to Evasion` -> target: EVASION, operation: ADD, value: -N
- `+N to Armor Score` -> target: ARMOR_SCORE, operation: ADD, value: N
- "damage thresholds" (plural) -> BOTH `MAJOR_DAMAGE_THRESHOLD` and `SEVERE_DAMAGE_THRESHOLD`
- Most weapon features do NOT have modifiers — only tag when there's an explicit numeric bonus
- Default operation is `ADD`

### API Endpoint

`POST /api/dh/weapons/bulk`

Accepts an array of weapon objects as the request body. Returns created weapons with assigned IDs.
