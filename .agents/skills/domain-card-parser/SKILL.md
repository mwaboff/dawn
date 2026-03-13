---
name: domain-card-parser
description: Use when the user asks to "parse domain cards", "convert domain cards", "extract domain cards from HTML", "import domain cards", mentions DOMAINCRDS.html, or wants to convert Daggerheart domain card HTML into JSON.
version: 1.0.0
---

# Domain Card Parser Skill

Parses Daggerheart domain cards from HTML reference pages and converts them into structured JSON for API import.

## When to Use

**Use for:** Converting HTML domain card references into structured JSON, bulk importing domain cards, updating domain card data from HTML sources.

**Skip for:** Editing individual card JSON by hand, working with non-domain-card HTML.

## Workflow

### Step 1: Extract Raw Card Data

Run the HTML parser script to extract raw card data:

```bash
node scripts/parse-domain-cards.js <path-to-html-file>
```

If no path is given, defaults to `DOMAINCRDS.html` in the project root.

The script outputs an array of raw card objects with: `name`, `level`, `domain`, `type`, `recallCost`, `rawText`.

### Step 2: Spawn Agent Team (in parallel)

Spawn 3 agents in parallel to process the raw cards:

1. **feature-splitter** (`agents/feature-splitter.md`) — Splits `rawText` into individual features
2. **cost-tagger** (`agents/cost-tagger.md`) — Identifies cost tags (Hope, Stress) in each feature
3. **modifier-detector** (`agents/modifier-detector.md`) — Identifies stat modifiers (+X to stat) in each feature

Each agent processes ALL cards independently. Their results are merged in Step 3.

### Step 3: Assemble Final JSON

Merge the agent outputs into the final JSON structure for each card:

```json
{
  "name": "string",
  "expansionId": 1,
  "isOfficial": true,
  "associatedDomainId": "number",
  "level": "number",
  "recallCost": "number",
  "type": "SPELL | ABILITY | GRIMOIRE | TRANSFORMATION | WILD",
  "features": [
    {
      "name": "string (only for multi-feature cards)",
      "description": "string",
      "featureType": "DOMAIN",
      "expansionId": 1,
      "costTags": [{ "label": "string", "category": "COST" }],
      "modifiers": [{ "target": "string", "operation": "string", "value": "number" }]
    }
  ]
}
```

- Omit `costTags` array if no costs detected
- Omit `modifiers` array if no modifiers detected
- Omit `name` on features for single-feature cards

### Step 4: Write Output

Write the final JSON array to `data/domain-cards.json`.

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

### Card Type Mapping

HTML value → JSON value (uppercase):
- `Spell` → `SPELL`
- `Ability` → `ABILITY`
- `Grimoire` → `GRIMOIRE`
- `Transformation` → `TRANSFORMATION`
- `Wild` → `WILD`

### Feature Splitting Rules

1. **Grimoire cards** use `**FeatureName:**` pattern (bold markdown). Split on each `**Name:**` occurrence.
2. **Non-Grimoire multi-feature cards** use `FeatureName:` pattern at the start of a paragraph (after a blank line). The name is the text before the first colon.
3. **Single-feature cards** have no named sub-features — the entire text is one feature with no `name` field.
4. Features are separated by blank lines (`\n\n`).

### Cost Tag Patterns

Look for these phrases in feature descriptions:
- "Spend a Hope" → `{ "label": "1 Hope", "category": "COST" }`
- "Spend X Hope" → `{ "label": "X Hope", "category": "COST" }`
- "spend a Hope" (lowercase) → same
- "Mark a Stress" → `{ "label": "1 Stress", "category": "COST" }`
- "Mark X Stress" → `{ "label": "X Stress", "category": "COST" }`
- "mark a Stress" (lowercase) → same
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

- Look for: "+X bonus to [stat]", "gain +X to [stat]", "increase [stat] by X"
- "damage thresholds" (plural) → BOTH `MAJOR_DAMAGE_THRESHOLD` and `SEVERE_DAMAGE_THRESHOLD`
- Most cards do NOT have modifiers — only tag when there's an explicit numeric bonus
- Default operation is `ADD`

## Refinement Notes

When updating this skill:
- Add new cost patterns to the Cost Tag Patterns section
- Add new modifier mappings to the Modifier Detection Rules
- Update domain IDs if new domains are added
- Update card types if new types are introduced
