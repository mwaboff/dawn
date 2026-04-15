---
name: consumable-parser
description: This skill should be used when the user asks to "parse consumables", "convert consumable data", "extract consumables from HTML", "import consumables", mentions consumables.html, or wants to convert Daggerheart consumable HTML into structured JSON for API import.
version: 1.0.0
---

# Consumable Parser Skill

Parses Daggerheart consumables from HTML reference pages and converts them into structured JSON for API import via the loot bulk endpoint.

## When to Use

**Use for:** Converting HTML consumable references into structured JSON, bulk importing consumables, updating consumable data from HTML sources.

**Skip for:** Editing individual consumable JSON by hand, working with non-consumable HTML, non-consumable loot items.

## Workflow

### Step 1: Extract Raw Consumable Data

```bash
node scripts/parse-consumables.js [path-to-html]
```

Defaults to `data/consumables.html`. Outputs array of raw consumable objects. Use `--count` for summary.

### Step 2: Assemble Final JSON

No agent processing needed - consumables are simple name + description entries.

For `POST /api/dh/loot/bulk`:

```json
[
  {
    "name": "Stride Potion",
    "description": "You gain a +1 bonus to your next Agility Roll.",
    "expansionId": 1,
    "isOfficial": true,
    "isConsumable": true,
    "tier": 1
  }
]
```

Assembly rules:
- ALL items use `isConsumable: true`
- ALL items use `tier: 1`
- `expansionId: 1` and `isOfficial: true` on all entries
- No features array needed

### Step 3: Write Output

Write to `data/consumables.json`.

## API Endpoint

```
POST /api/dh/loot/bulk
```

Accepts array of `CreateLootRequest` objects.
