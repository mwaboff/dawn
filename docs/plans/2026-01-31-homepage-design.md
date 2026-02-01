# Oh Sheet Homepage Design

## Overview

Homepage for Oh Sheet, a Daggerheart toolset that brings the table to your computer. The design uses a warm tavern aesthetic to evoke the feeling of gathering around a table at an inn.

## Visual Style: Warm Tavern

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-dark` | `#1a1412` | Page background |
| `--color-accent` | `#d4a056` | Primary accent (buttons, icons, highlights) |
| `--color-parchment` | `#f5e6d3` | Card backgrounds, light surfaces |
| `--color-text-light` | `#faf7f4` | Text on dark backgrounds |
| `--color-text-dark` | `#2d241f` | Text on light backgrounds |
| `--color-bg-footer` | `#151110` | Footer background (slightly darker) |

### Typography

- Headlines: Bold, warm serif or strong sans-serif
- Body: Clean, readable sans-serif
- Hierarchy: Clear distinction between h1, h2, body text

## Page Structure

### Navigation (Top)

- Logo/brand "Oh Sheet" on left
- "Login" and "Sign Up" links on right
- Minimal, unobtrusive design

### Hero Section

Full viewport height, centered content.

**Content:**
- Headline: "Bring Your Table Together"
- Subheadline: "Oh Sheet is the Daggerheart toolset that brings your adventures from the table to your computer"
- Primary CTA: "Get Started" (amber filled button)
- Secondary CTA: "Learn More" (ghost/outline button)

**Visual Treatment:**
- Dark background with warm gradient
- Subtle vignette effect (darker edges, lighter center like candlelight)
- Optional: faint decorative flourishes

### Feature Cards Section

**Section Header:**
- Subheading: "Your Adventure Awaits"
- Centered above cards

**Three Cards (horizontal row):**

1. **Create Characters**
   - Icon: Sword/shield or character silhouette
   - Description: "Build and manage your Daggerheart heroes. Track stats, abilities, and level up as you play."

2. **Run Campaigns**
   - Icon: Map or scroll
   - Description: "Organize your adventures. Invite players, manage sessions, and keep your story moving forward."

3. **Play Together**
   - Icon: Dice or game table
   - Description: "Run your games in real-time. Roll dice, track initiative, and share the action with your party."

**Card Styling:**
- Parchment background (`#f5e6d3`)
- Soft shadows
- Rounded corners
- Amber accent for icons
- Hover: card lifts, shadow deepens

### Footer

- Dark background
- "Oh Sheet" brand name
- Copyright: "© 2026 Oh Sheet"
- Minimal for initial release

## Responsive Behavior

### Desktop (1024px+)
- Hero text centered with max-width for readability
- Three feature cards side-by-side
- Generous padding

### Tablet (768px - 1023px)
- Hero remains centered, slightly smaller text
- Feature cards in tighter row or 2+1 layout

### Mobile (< 768px)
- Simplified navigation
- Hero headline scales down
- CTAs stack vertically, full-width
- Feature cards stack vertically
- Increased touch targets

## Accessibility Requirements

- All interactive elements have visible focus states (amber outline)
- Color contrast meets WCAG AA standards
- Semantic HTML with proper heading hierarchy (h1 > h2 > h3)
- Skip-to-content link for keyboard navigation
- Alt text for all decorative icons (or aria-hidden if purely decorative)

## Component Breakdown

1. `HomeComponent` - Main homepage container
2. Navigation (in `AppComponent` for site-wide use)
3. Hero section (part of HomeComponent)
4. Feature cards (part of HomeComponent, or extract `FeatureCardComponent` if reused)
5. Footer (in `AppComponent` for site-wide use)

## File Structure

```
src/app/
├── app.ts                    # Add nav + footer
├── app.html                  # Update with nav + router-outlet + footer
├── home/
│   ├── home.ts              # Homepage component
│   └── home.html            # Homepage template
```
