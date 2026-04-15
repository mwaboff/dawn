# Plan: Add Subclasses & Adversaries to Admin Card Manager

## Overview
Add subclass and adversary browsing/editing to the admin portal, matching reference page order.

## Changes

### 1. Update ADMIN_CATEGORIES order (card-search.ts)
Match reference page: Domain > Class > **Subclass** > Ancestry > Community > Domain Cards > Weapon > Armor > Loot > **Adversary** > Companion

```ts
const ADMIN_CATEGORIES = [
  { id: 'domain', label: 'Domains' },
  { id: 'class', label: 'Classes' },
  { id: 'subclass', label: 'Subclasses' },     // NEW
  { id: 'ancestry', label: 'Ancestries' },
  { id: 'community', label: 'Communities' },
  { id: 'domainCard', label: 'Domain Cards' },
  { id: 'weapon', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'loot', label: 'Loot' },
  { id: 'adversary', label: 'Adversaries' },    // NEW
  { id: 'companion', label: 'Companions' },
];
```

### 2. Card Search - Subclass Browse (card-search.ts + .html)
- Import `SubclassService` and `SubclassPathSelector`
- When `subclass` category selected, fetch ALL subclass cards via `getSubclassesPaginated()`
- Display using `SubclassPathSelector` component (same tabbed UI as character create)
- On card click, navigate to `/admin/cards/subclass/:cardId` to edit that individual level card
- **BUT** also provide a way to see all levels: when selecting a path card, navigate to a new subclass-path-edit page

### 3. Card Search - Adversary Browse (card-search.ts + .html)  
- Import `AdversaryService` and `AdversaryCard`
- Add `allAdversaries` signal for adversary data (separate from `allCards`)
- When `adversary` category selected, fetch via `getAdversaries()`
- Render adversary cards in template using `AdversaryCard` component in a grid
- On click, navigate to `/admin/cards/adversary/:id`

### 4. New Component: Subclass Path Edit (admin/subclass-path-edit/)
Route: `/admin/cards/subclass-path/:pathId`

When a user clicks a subclass path in the browse, navigate here. This page:
- Loads ALL subclass cards for the given subclass path
- Groups by level (Foundation, Specialization, Mastery)
- Shows 3 stacked sections, Foundation at top
- Each section embeds the existing card-edit form fields via the `subclass` schema
- Each section has its own save button
- Live preview card for the active section

Files: `subclass-path-edit.ts`, `.html`, `.css`, `.spec.ts`

### 5. Add Adversary Schema (card-edit-schema.ts)
```ts
adversary: {
  cardType: 'adversary',
  sections: [
    { title: 'Basics', fields: [name, description, expansion, isOfficial] },
    { title: 'Stats', fields: [tier, adversaryType, difficulty, hitPointMax, stressMax, evasion] },
    { title: 'Thresholds', fields: [majorThreshold, severeThreshold] },
    { title: 'Attack', fields: [weaponName, attackRange, attackModifier, damageNotation, damageType] },
    { title: 'Details', fields: [motivesAndTactics] },
  ],
}
```

### 6. Update Routing (admin.routes.ts)
Add route for subclass-path-edit:
```ts
{ path: 'cards/subclass-path/:pathId', loadComponent: () => import('./subclass-path-edit/subclass-path-edit').then(m => m.SubclassPathEdit) },
```

### 7. Tests
- Card search: test new categories appear, subclass/adversary fetch logic
- Subclass path edit: test level sections render, save logic
- Adversary schema: covered by existing card-edit tests

## Execution Order
1. Add adversary schema to card-edit-schema.ts
2. Update card-search (categories, services, fetch, template)
3. Create subclass-path-edit component
4. Update routing
5. Run tests, lint, build
