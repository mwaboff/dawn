---
name: feature-splitter
description: Splits raw domain card text into individual named features. Use when processing domain cards from HTML for JSON conversion.
---

# Feature Splitter Agent

You split raw domain card text into individual features.

## Input

An array of raw card objects, each with a `rawText` field containing the card's full description text.

## Rules

### Grimoire Cards (type = "Grimoire")

Grimoire cards always have multiple features using the `**FeatureName:**` bold markdown pattern.

1. Split on each `**Name:**` occurrence
2. The feature name is the text between `**` markers (without the trailing colon)
3. The description is everything after the colon until the next `**Name:**` or end of text
4. Trim whitespace from both name and description

Example input:
```
**Power Push:** Make a Spellcast Roll against a target within Melee range.
On a success, they're knocked back to Far range and take d10+2 magic damage.

**Tova's Armor:** Spend a Hope to give a target you can touch a +1 bonus to their Armor Score.
```

Example output:
```json
[
  { "name": "Power Push", "description": "Make a Spellcast Roll against a target within Melee range. On a success, they're knocked back to Far range and take d10+2 magic damage." },
  { "name": "Tova's Armor", "description": "Spend a Hope to give a target you can touch a +1 bonus to their Armor Score." }
]
```

### Non-Grimoire Multi-Feature Cards

Some non-Grimoire cards have multiple features using the `FeatureName:` pattern (no bold) at the start of paragraphs.

1. Split on blank lines (`\n\n`)
2. If a paragraph starts with a capitalized word/phrase followed by a colon, that's a feature name
3. The feature name is the text before the first colon
4. The description is everything after the colon (trimmed)

Example input:
```
Tekaira Armored Beetles: Mark a Stress to conjure armored beetles that encircle you.

Fire Flies: Make a Spellcast Roll against all adversaries within Close range.
```

Example output:
```json
[
  { "name": "Tekaira Armored Beetles", "description": "Mark a Stress to conjure armored beetles that encircle you." },
  { "name": "Fire Flies", "description": "Make a Spellcast Roll against all adversaries within Close range." }
]
```

### Single-Feature Cards

If the text doesn't match either multi-feature pattern, treat the entire text as a single feature with NO `name` field.

Example output:
```json
[
  { "description": "Spend a Hope to allow a creature you can touch to climb on walls and ceilings." }
]
```

### Edge Cases

- Some cards have multiple paragraphs but are still a single feature (no name pattern). Keep these as one feature with the full text.
- Preserve the full description text including any conditional clauses or additional paragraphs that belong to the same feature.
- When a card's text has paragraphs separated by blank lines but none start with a `Name:` pattern, it's a single feature with the full text (newlines preserved).

## Output

Return the original card array with `rawText` replaced by a `features` array of `{ name?, description }` objects.
