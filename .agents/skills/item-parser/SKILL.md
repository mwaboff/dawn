---
name: item-parser
description: This skill should be used when the user asks to "parse items", "convert item data", "extract items from HTML", "import items", mentions items.html, or wants to convert Daggerheart item HTML into structured JSON for API import.
version: 1.0.0
---

# Item Parser Skill

Parses Daggerheart items from HTML reference pages and converts them into structured JSON for API import via the loot bulk endpoint.

## When to Use

**Use for:** Converting HTML item references into structured JSON, bulk importing items, updating item data from HTML sources.

**Skip for:** Editing individual item JSON by hand, working with non-item HTML, consumable items (use consumable-parser instead).

## Workflow

### Step 1: Extract Raw Item Data

```bash
node scripts/parse-items.js [path-to-html]
```

Defaults to `data/items.html`. Outputs array of raw item objects. Use `--count` for summary.

### Step 2: Assemble Final JSON

No agent processing needed - items are simple name + description entries.

For `POST /api/dh/loot/bulk`:

```json
[
  {
    "name": "Premium Bedroll",
    "description": "During downtime, you automatically clear a Stress.",
    "expansionId": 1,
    "isOfficial": true,
    "isConsumable": false,
    "tier": 1
  }
]
```

Assembly rules:
- ALL items use `isConsumable: false`
- ALL items use `tier: 1`
- `expansionId: 1` and `isOfficial: true` on all entries
- No features array needed

### Step 3: Write Output

Write to `data/items.json`.

## API Endpoint

```
POST /api/dh/loot/bulk
```

Accepts array of `CreateLootRequest` objects.
