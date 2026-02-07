# Character Builder Design

## Overview

A multi-tab form for creating Daggerheart characters, accessible via a new navbar dropdown menu.

## Navigation & Routing

### Navbar Dropdown

- New `+` icon button in navbar, positioned before auth buttons
- Click opens dropdown with "Create Character" option
- Dropdown closes on click outside or option selection
- Styled with warm tavern palette: `--color-bg-dark` background, `--color-parchment` text, `--color-accent` hover

### Route

- Path: `/create-character`
- Lazy-loaded standalone component
- Protected by `authSessionGuard`

### Component Structure

```
src/app/
├── navbar/
│   └── (modified to add dropdown)
├── create-character/
│   ├── create-character.ts
│   ├── create-character.html
│   ├── create-character.css
│   └── create-character.spec.ts
```

## Page Layout

### Desktop (>1024px)

```
┌──────────────────────────────────────────────────────┐
│  [Name field]              [Pronouns field]          │
├─────────────────────────────────────────────┬────────┤
│                                             │ Class  │
│                                             ├────────┤
│         Active Tab Content                  │Heritage│
│                                             ├────────┤
│                                             │ Traits │
│                                             ├────────┤
│                                             │  ...   │
├─────────────────────────────────────────────┴────────┤
│              [ Create Character Button ]             │
└──────────────────────────────────────────────────────┘
```

- Brown background (`--color-bg-dark`) with centered parchment container (`--color-parchment`)
- Max width ~900px
- Folder divider tabs on right edge, staggered vertically
- Tabs extend ~40px beyond form edge with 3D shadow effect
- Active tab appears raised with connecting background to content

### Tablet (768-1024px)

- Side tabs, narrower layout
- Tabs stack tighter

### Mobile (<768px)

- Hamburger icon in sticky header showing current section name
- Slide-out drawer from right for tab navigation
- Semi-transparent backdrop overlay
- Full-width form with padding

## Form Fields

### Header (Always Visible)

| Field | Type | Required |
|-------|------|----------|
| Name | Text input | Yes |
| Pronouns | Text input | Yes |

### Tab 1: Class

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Class | Dropdown/cards | Yes | Bard, Guardian, Ranger, etc. |
| Subclass | Dropdown | Yes | Populates based on class selection |

### Tab 2: Heritage

| Field | Type | Required |
|-------|------|----------|
| Heritage | Dropdown/cards | Yes |
| Community | Dropdown/cards | Yes |

### Tab 3: Traits

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Trait Array | Radio buttons | Yes | Predefined stat spreads |
| Trait Customization | Number inputs | No | Agility, Strength, Finesse, Instinct, Presence, Knowledge |

Shows point total for balance tracking.

### Tab 4: Additional Info

| Field | Type | Required |
|-------|------|----------|
| Age | Text input | No |
| Physical Description | Textarea | No |

At least one field required.

### Tab 5: Starting Equipment

| Field | Type | Required |
|-------|------|----------|
| Equipment | Multi-select checklist | Yes (at least one) |

### Tab 6: Background

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Background | Textarea | Yes | Min 20 characters |

### Tab 7: Experiences

| Field | Type | Required |
|-------|------|----------|
| Experiences | List builder | Yes (at least one) |

Add/remove buttons for entries. Each experience is a short text entry.

### Tab 8: Domain Cards

| Field | Type | Required |
|-------|------|----------|
| Domain Cards | Multi-select cards | Yes (at least one) |

### Tab 9: Connections

| Field | Type | Required |
|-------|------|----------|
| Connections | List builder | Yes (at least one) |

Each connection has: Name (text), Relationship (dropdown: Ally, Rival, Family, Mentor, etc.)

## Validation

### Per-Field

- Required fields show error on blur when touched and empty
- Error styling: red border, error message below field
- Matches existing auth form patterns

### Tab-Level Indicators

- Tabs with errors show warning indicator (red dot)
- Appears after submit attempt with errors
- Clears when tab becomes valid

### Submit Validation

1. Validate all tabs on "Create Character" click
2. If errors:
   - Show error summary box above submit button
   - List which tabs have issues with specific messages
   - Mark tabs visually
   - Do NOT auto-navigate
3. If valid:
   - Submit to API
   - Show loading state
   - Navigate on success

### Error Summary Box

- Parchment background with red/brown border
- "Please fix the following:" heading
- Bulleted list of clickable tab names with issues

### API Errors

- Network errors: Toast/banner, preserve form data
- Server validation: Map to relevant fields

## Accessibility

### Keyboard Navigation

- Tab key: Move through form fields
- Arrow keys: Navigate between tabs
- Enter/Space: Activate buttons, select options
- Escape: Close dropdown/drawer

### ARIA

- `role="tablist"`, `role="tab"`, `role="tabpanel"`
- `aria-selected` on active tab
- `aria-controls` linking tabs to panels
- `aria-labelledby` on panels
- `aria-describedby` for error messages
- Live region for error announcements

### Focus Management

- Focus moves to first field when switching tabs
- Focus trapped in mobile drawer
- Focus returns to hamburger on drawer close

## Technical Notes

### State Management

- Single reactive form spans all tabs
- Tab switching preserves data
- No localStorage persistence (v1)

### Form Behavior

- One section visible at a time
- Single "Create Character" submit at end
- All tabs must have at least one valid selection

### Styling

- Use existing CSS custom properties
- Folder tab 3D effect via box-shadow and transforms
- Animations for tab transitions and drawer slide
