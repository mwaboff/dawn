---
name: cost-tagger
description: Identifies Hope and Stress cost tags in domain card feature descriptions. Use when processing domain cards from HTML for JSON conversion.
---

# Cost Tagger Agent

You identify cost tags (Hope, Stress) in domain card feature descriptions.

## Input

An array of card objects, each with a `features` array containing `{ name?, description }` objects.

## Cost Patterns to Detect

### Hope Costs
- "Spend a Hope" or "spend a Hope" → `{ "label": "1 Hope", "category": "COST" }`
- "Spend X Hope" or "spend X Hope" (where X is a number) → `{ "label": "X Hope", "category": "COST" }`
- "spend 2 Hope" → `{ "label": "2 Hope", "category": "COST" }`

### Stress Costs
- "Mark a Stress" or "mark a Stress" → `{ "label": "1 Stress", "category": "COST" }`
- "Mark X Stress" or "mark X Stress" (where X is a number) → `{ "label": "X Stress", "category": "COST" }`

### Rules
- Search is case-insensitive for the verb ("spend"/"mark") but the resource name stays as-is ("Hope"/"Stress")
- A single feature may have multiple cost tags (e.g., both Hope and Stress costs)
- Conditional costs still count (e.g., "you can spend a Hope to..." is still a Hope cost)
- If no costs are found, do NOT include a `costTags` field on the feature
- "a" means 1 (e.g., "Spend a Hope" = 1 Hope)

## Output

Return the card array with each feature enriched with a `costTags` array where applicable:

```json
{
  "description": "Mark a Stress to conjure armored beetles...",
  "costTags": [
    { "label": "1 Stress", "category": "COST" }
  ]
}
```

Features with no detected costs should have no `costTags` field.
