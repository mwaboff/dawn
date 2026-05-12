# Variant Spec — Tavern Scroll

> Site-consistent #1. A weathered parchment scroll that unfurls upward from the bottom-left, revealing hand-inked dice. Wax-seal FAB. Ink-splatter roll animation. Hope = amber gold (#d4a056); Fear = deep crimson.

---

## 1. Aesthetic North Star

- **Mood:** "an alchemist's roll-table tucked inside the tavern's back room."
- **Surface:** mottled parchment with a faint vertical fiber grain, two warm shadows along the rolled edges (top and bottom), and a brass dowel cap top + bottom.
- **Ink:** 1.25px brown-black outlines (#2b1a0c) for dice; 1px outlines for chrome. SVG wireframe is the dominant rendering, but each die carries a single touch of "illuminated" shading — a watercolor wash inside the silhouette — to honor the scroll/manuscript heritage. This is the justified deviation from pure wireframe called out in the brief.
- **Type:** Cinzel for headings, numerals, and totals; Lora for body, history rows, and microcopy.
- **Texture:** subtle SVG `<filter>` (turbulence + displacement) is acceptable but **optional** — implementer may substitute a 2-stop `repeating-linear-gradient` overlay at 6% opacity to stay inside the 4 kB CSS budget.

---

## 2. Hero Mockup — Menu (open state)

Realistic dimensions: **360 × 540**, anchored bottom-left at `bottom: 24px; left: 24px`. The scroll appears unfurled — top dowel sits at y≈12, bottom dowel at y≈528, with the parchment body filling the middle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 540" width="360" height="540" role="img" aria-label="Tavern Scroll dice roller, open">
  <defs>
    <linearGradient id="parchment" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3e3c0"/>
      <stop offset="0.5" stop-color="#e9d2a3"/>
      <stop offset="1" stop-color="#d8bd86"/>
    </linearGradient>
    <linearGradient id="dowel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7a5320"/>
      <stop offset="0.5" stop-color="#d4a056"/>
      <stop offset="1" stop-color="#5a3a14"/>
    </linearGradient>
    <radialGradient id="seal" cx="0.4" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#c0392b"/>
      <stop offset="1" stop-color="#5a1208"/>
    </radialGradient>
    <filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence baseFrequency="0.9" numOctaves="2" seed="3"/>
      <feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.28  0 0 0 0 0.13  0 0 0 0.06 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>

  <!-- Drop shadow under the scroll -->
  <ellipse cx="180" cy="535" rx="160" ry="6" fill="#000" opacity="0.35"/>

  <!-- Top dowel -->
  <rect x="14" y="6" width="332" height="18" rx="9" fill="url(#dowel)"/>
  <circle cx="14" cy="15" r="11" fill="#7a5320" stroke="#3a2410" stroke-width="1.5"/>
  <circle cx="346" cy="15" r="11" fill="#7a5320" stroke="#3a2410" stroke-width="1.5"/>

  <!-- Parchment body -->
  <rect x="20" y="22" width="320" height="500" fill="url(#parchment)" stroke="#8a6a30" stroke-width="1"/>
  <rect x="20" y="22" width="320" height="500" fill="#000" opacity="0.04" filter="url(#paper)"/>
  <!-- inner ruling -->
  <rect x="32" y="34" width="296" height="476" fill="none" stroke="#8a6a30" stroke-width="0.6" stroke-dasharray="2 3" opacity="0.55"/>

  <!-- Header -->
  <text x="180" y="58" font-family="Cinzel, serif" font-size="16" font-weight="700" fill="#2b1a0c" text-anchor="middle" letter-spacing="2">TAVERN SCROLL</text>
  <line x1="60" y1="68" x2="300" y2="68" stroke="#8a6a30" stroke-width="0.8"/>
  <text x="180" y="84" font-family="Lora, serif" font-style="italic" font-size="10" fill="#5a3a14" text-anchor="middle">— select thy dice —</text>

  <!-- Dice tray (4 cols x 2 rows) -->
  <g font-family="Cinzel, serif" font-size="10" fill="#2b1a0c" text-anchor="middle">
    <!-- d4 -->
    <g transform="translate(54,108)">
      <polygon points="0,22 22,-12 -22,-12" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
      <text y="6" font-size="11">4</text>
      <text y="36" font-size="9" fill="#5a3a14">d4 · 0</text>
    </g>
    <!-- d6 -->
    <g transform="translate(132,108)">
      <rect x="-20" y="-20" width="40" height="40" rx="3" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
      <text y="4" font-size="11">6</text>
      <text y="36" font-size="9" fill="#5a3a14">d6 · 1</text>
    </g>
    <!-- d8 -->
    <g transform="translate(210,108)">
      <polygon points="0,-22 20,0 0,22 -20,0" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
      <line x1="-20" y1="0" x2="20" y2="0" stroke="#2b1a0c" stroke-width="0.6" opacity="0.5"/>
      <text y="4" font-size="11">8</text>
      <text y="36" font-size="9" fill="#5a3a14">d8 · 0</text>
    </g>
    <!-- d10 -->
    <g transform="translate(288,108)">
      <polygon points="0,-22 18,-4 12,20 -12,20 -18,-4" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
      <text y="6" font-size="11">10</text>
      <text y="36" font-size="9" fill="#5a3a14">d10 · 0</text>
    </g>
    <!-- d12 -->
    <g transform="translate(54,184)">
      <polygon points="0,-22 19,-12 19,12 0,22 -19,12 -19,-12" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
      <text y="5" font-size="10">12</text>
      <text y="36" font-size="9" fill="#5a3a14">d12 · 0</text>
    </g>
    <!-- d20 -->
    <g transform="translate(132,184)">
      <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
      <line x1="-19" y1="-11" x2="0" y2="0" stroke="#2b1a0c" stroke-width="0.5" opacity="0.5"/>
      <line x1="19" y1="-11" x2="0" y2="0" stroke="#2b1a0c" stroke-width="0.5" opacity="0.5"/>
      <line x1="0" y1="0" x2="0" y2="22" stroke="#2b1a0c" stroke-width="0.5" opacity="0.5"/>
      <text y="5" font-size="10">20</text>
      <text y="36" font-size="9" fill="#5a3a14">d20 · 1</text>
    </g>
    <!-- d100 -->
    <g transform="translate(210,184)">
      <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
      <text y="5" font-size="9">100</text>
      <text y="36" font-size="9" fill="#5a3a14">d100 · 0</text>
    </g>
    <!-- Duality toggle (occupies 8th slot) -->
    <g transform="translate(288,184)">
      <circle r="22" fill="#fff5dd" stroke="#d4a056" stroke-width="1.5"/>
      <circle cx="-7" cy="0" r="9" fill="#d4a056" opacity="0.85"/>
      <circle cx="7" cy="0" r="9" fill="#7a1818" opacity="0.85"/>
      <text y="36" font-size="9" fill="#5a3a14">Duality ✓</text>
    </g>
  </g>

  <!-- Counter chips (small +/- under each die) - represented via stroke indicators above -->

  <!-- Last result panel -->
  <g transform="translate(40,250)">
    <rect width="280" height="96" rx="6" fill="#fff5dd" stroke="#8a6a30" stroke-width="0.8"/>
    <text x="140" y="22" font-family="Cinzel, serif" font-size="10" letter-spacing="2" fill="#5a3a14" text-anchor="middle">LAST ROLL</text>
    <text x="140" y="58" font-family="Cinzel, serif" font-size="34" font-weight="700" fill="#2b1a0c" text-anchor="middle">17</text>
    <text x="140" y="80" font-family="Lora, serif" font-style="italic" font-size="12" fill="#7a1818" text-anchor="middle">with Hope</text>
    <!-- inline mini duality -->
    <circle cx="36" cy="58" r="11" fill="#d4a056" stroke="#2b1a0c" stroke-width="1"/>
    <text x="36" y="62" font-family="Cinzel, serif" font-size="11" fill="#2b1a0c" text-anchor="middle">9</text>
    <circle cx="244" cy="58" r="11" fill="#7a1818" stroke="#2b1a0c" stroke-width="1"/>
    <text x="244" y="62" font-family="Cinzel, serif" font-size="11" fill="#fff5dd" text-anchor="middle">5</text>
  </g>

  <!-- Roll button -->
  <g transform="translate(40,358)">
    <rect width="280" height="40" rx="20" fill="#7a1818" stroke="#3a0a0a" stroke-width="1"/>
    <rect x="2" y="2" width="276" height="14" rx="18" fill="#fff" opacity="0.12"/>
    <text x="140" y="26" font-family="Cinzel, serif" font-size="14" font-weight="700" letter-spacing="3" fill="#f3e3c0" text-anchor="middle">ROLL</text>
  </g>

  <!-- History scroll -->
  <g transform="translate(40,410)">
    <text x="0" y="0" font-family="Cinzel, serif" font-size="10" letter-spacing="2" fill="#5a3a14">CHRONICLE</text>
    <text x="280" y="0" font-family="Lora, serif" font-style="italic" font-size="9" fill="#7a1818" text-anchor="end">clear</text>
    <line x1="0" y1="6" x2="280" y2="6" stroke="#8a6a30" stroke-width="0.6"/>
    <g font-family="Lora, serif" font-size="11" fill="#2b1a0c">
      <text x="0" y="22">d20:14 + ✦9 / ✦5 = <tspan font-weight="700">28</tspan></text>
      <text x="280" y="22" text-anchor="end" fill="#7a1818" font-style="italic">Hope</text>
      <text x="0" y="42">2d6: 4,3 = <tspan font-weight="700">7</tspan></text>
      <text x="280" y="42" text-anchor="end" font-style="italic" fill="#5a3a14">—</text>
      <text x="0" y="62">✦12 / ✦12 = <tspan font-weight="700">24</tspan></text>
      <text x="280" y="62" text-anchor="end" fill="#d4a056" font-weight="700">CRIT!</text>
      <text x="0" y="82">d12:7 = <tspan font-weight="700">7</tspan></text>
      <text x="280" y="82" text-anchor="end" font-style="italic" fill="#5a3a14">—</text>
    </g>
  </g>

  <!-- Bottom dowel -->
  <rect x="14" y="516" width="332" height="18" rx="9" fill="url(#dowel)"/>
  <circle cx="14" cy="525" r="11" fill="#7a5320" stroke="#3a2410" stroke-width="1.5"/>
  <circle cx="346" cy="525" r="11" fill="#7a5320" stroke="#3a2410" stroke-width="1.5"/>
</svg>
```

Layout zones:

| Zone           | y-range  | Notes                                                     |
| -------------- | -------- | --------------------------------------------------------- |
| Top dowel      | 6–24     | brass, fixed                                              |
| Title block    | 32–94    | Cinzel display + italic Lora subtitle, ruled underline    |
| Dice tray      | 96–230   | 4×2 grid (7 dice + duality toggle in slot 8)              |
| Last roll card | 240–350  | Inset cream panel, total 34px Cinzel, microcopy beneath   |
| Roll button    | 354–402  | Wax-red pill, gold inner highlight                        |
| Chronicle      | 408–510  | Scrollable; 4 rows visible, `overflow-y: auto`            |
| Bottom dowel   | 514–534  | brass, fixed                                              |

---

## 3. Hero Mockup — FAB (closed state)

A wax-seal medallion, **64 × 64**, anchored bottom-left at `bottom: 24px; left: 24px`. The seal sits on a small parchment fold so the FAB "feels like" the rolled-up scroll peeking out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Open dice roller">
  <defs>
    <radialGradient id="wax" cx="0.35" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#d24a3a"/>
      <stop offset="0.65" stop-color="#8a1414"/>
      <stop offset="1" stop-color="#3a0808"/>
    </radialGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0c878"/>
      <stop offset="1" stop-color="#8a5a1c"/>
    </linearGradient>
  </defs>
  <!-- Parchment fold peeking behind -->
  <path d="M6 50 Q32 38 58 50 L58 60 Q32 56 6 60 Z" fill="#e9d2a3" stroke="#8a6a30" stroke-width="0.8"/>
  <!-- Outer drop shadow -->
  <circle cx="32" cy="30" r="26" fill="#000" opacity="0.32"/>
  <!-- Gold rim -->
  <circle cx="32" cy="30" r="25" fill="url(#rim)"/>
  <!-- Wax body -->
  <circle cx="32" cy="30" r="22" fill="url(#wax)"/>
  <!-- Wax drip irregularity -->
  <path d="M14 36 Q12 44 18 46 Q22 44 22 38 Z" fill="url(#wax)" opacity="0.95"/>
  <!-- Sigil: stylized d20 silhouette -->
  <polygon points="32,16 46,24 46,38 32,46 18,38 18,24" fill="none" stroke="#f3e3c0" stroke-width="1.6"/>
  <line x1="18" y1="24" x2="32" y2="31" stroke="#f3e3c0" stroke-width="1"/>
  <line x1="46" y1="24" x2="32" y2="31" stroke="#f3e3c0" stroke-width="1"/>
  <line x1="32" y1="31" x2="32" y2="46" stroke="#f3e3c0" stroke-width="1"/>
  <text x="32" y="36" font-family="Cinzel, serif" font-size="9" font-weight="700" fill="#f3e3c0" text-anchor="middle">XX</text>
</svg>
```

Hover: medallion lifts 2px (`translateY(-2px)`), gold rim brightens to `#f0c878`. Active: depresses 1px and `box-shadow` collapses by 50%. Open state: small "wax crack" line appears across the seal (subtle 1px white-ink hairline at 30deg).

---

## 4. Dice Wireframe Sketches

All dice render at **44 × 44** in the tray; in the result panel the duality dice render at **32 × 32**. Stroke `#2b1a0c`, 1.25px. Watercolor wash optional (2% fill of the corresponding accent).

### d4
```svg
<svg viewBox="-24 -24 48 48" width="44" height="44" aria-label="d4">
  <polygon points="0,-22 22,14 -22,14" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
  <line x1="0" y1="-22" x2="0" y2="14" stroke="#2b1a0c" stroke-width="0.5" opacity="0.45"/>
  <text x="0" y="6" font-family="Cinzel, serif" font-size="11" text-anchor="middle" fill="#2b1a0c">4</text>
</svg>
```

### d6
```svg
<svg viewBox="-24 -24 48 48" width="44" height="44" aria-label="d6">
  <rect x="-20" y="-20" width="40" height="40" rx="3" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
  <line x1="-20" y1="-8" x2="20" y2="-8" stroke="#2b1a0c" stroke-width="0.4" opacity="0.35"/>
  <line x1="-8" y1="-20" x2="-8" y2="20" stroke="#2b1a0c" stroke-width="0.4" opacity="0.35"/>
  <text x="0" y="4" font-family="Cinzel, serif" font-size="11" text-anchor="middle" fill="#2b1a0c">6</text>
</svg>
```

### d8
```svg
<svg viewBox="-24 -24 48 48" width="44" height="44" aria-label="d8">
  <polygon points="0,-22 20,0 0,22 -20,0" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
  <line x1="-20" y1="0" x2="20" y2="0" stroke="#2b1a0c" stroke-width="0.55" opacity="0.5"/>
  <line x1="0" y1="-22" x2="0" y2="22" stroke="#2b1a0c" stroke-width="0.4" opacity="0.35"/>
  <text x="0" y="4" font-family="Cinzel, serif" font-size="11" text-anchor="middle" fill="#2b1a0c">8</text>
</svg>
```

### d10
```svg
<svg viewBox="-24 -24 48 48" width="44" height="44" aria-label="d10">
  <polygon points="0,-22 19,-6 12,22 -12,22 -19,-6" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
  <line x1="-19" y1="-6" x2="19" y2="-6" stroke="#2b1a0c" stroke-width="0.4" opacity="0.4"/>
  <line x1="0" y1="-22" x2="0" y2="22" stroke="#2b1a0c" stroke-width="0.4" opacity="0.3"/>
  <text x="0" y="6" font-family="Cinzel, serif" font-size="11" text-anchor="middle" fill="#2b1a0c">10</text>
</svg>
```

### d12
```svg
<svg viewBox="-24 -24 48 48" width="44" height="44" aria-label="d12">
  <polygon points="0,-22 19,-12 19,12 0,22 -19,12 -19,-12" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
  <polygon points="0,-12 11,-6 11,6 0,12 -11,6 -11,-6" fill="none" stroke="#2b1a0c" stroke-width="0.5" opacity="0.45"/>
  <text x="0" y="4" font-family="Cinzel, serif" font-size="10" text-anchor="middle" fill="#2b1a0c">12</text>
</svg>
```

### d20
```svg
<svg viewBox="-24 -24 48 48" width="44" height="44" aria-label="d20">
  <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
  <line x1="-19" y1="-11" x2="0" y2="0" stroke="#2b1a0c" stroke-width="0.5" opacity="0.45"/>
  <line x1="19" y1="-11" x2="0" y2="0" stroke="#2b1a0c" stroke-width="0.5" opacity="0.45"/>
  <line x1="-19" y1="11" x2="0" y2="0" stroke="#2b1a0c" stroke-width="0.5" opacity="0.35"/>
  <line x1="19" y1="11" x2="0" y2="0" stroke="#2b1a0c" stroke-width="0.5" opacity="0.35"/>
  <line x1="0" y1="-22" x2="0" y2="0" stroke="#2b1a0c" stroke-width="0.5" opacity="0.45"/>
  <line x1="0" y1="0" x2="0" y2="22" stroke="#2b1a0c" stroke-width="0.5" opacity="0.45"/>
  <text x="0" y="4" font-family="Cinzel, serif" font-size="10" text-anchor="middle" fill="#2b1a0c">20</text>
</svg>
```

### d100
```svg
<svg viewBox="-24 -24 48 48" width="44" height="44" aria-label="d100">
  <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="#f7eccd" stroke="#2b1a0c" stroke-width="1.25"/>
  <polygon points="0,-22 19,-11 0,0" fill="#2b1a0c" opacity="0.05"/>
  <polygon points="0,22 19,11 0,0" fill="#2b1a0c" opacity="0.08"/>
  <text x="0" y="4" font-family="Cinzel, serif" font-size="9" text-anchor="middle" fill="#2b1a0c">100</text>
</svg>
```

### Duality pair (Hope d12 + Fear d12)
```svg
<svg viewBox="-50 -24 100 48" width="92" height="44" aria-label="Duality dice — Hope and Fear">
  <!-- Hope d12 -->
  <g transform="translate(-26,0)">
    <polygon points="0,-22 19,-12 19,12 0,22 -19,12 -19,-12"
             fill="#fff5dd" stroke="#2b1a0c" stroke-width="1.25"/>
    <polygon points="0,-22 19,-12 19,12 0,22 -19,12 -19,-12"
             fill="#d4a056" opacity="0.22"/>
    <polygon points="0,-12 11,-6 11,6 0,12 -11,6 -11,-6"
             fill="none" stroke="#d4a056" stroke-width="0.6" opacity="0.7"/>
    <text x="0" y="4" font-family="Cinzel, serif" font-size="10" text-anchor="middle" fill="#7a5320">12</text>
    <text x="0" y="-26" font-family="Cinzel, serif" font-size="6" letter-spacing="2" text-anchor="middle" fill="#7a5320">HOPE</text>
  </g>
  <!-- Fear d12 -->
  <g transform="translate(26,0)">
    <polygon points="0,-22 19,-12 19,12 0,22 -19,12 -19,-12"
             fill="#1a0a0a" stroke="#2b1a0c" stroke-width="1.25"/>
    <polygon points="0,-12 11,-6 11,6 0,12 -11,6 -11,-6"
             fill="none" stroke="#7a1818" stroke-width="0.6" opacity="0.85"/>
    <text x="0" y="4" font-family="Cinzel, serif" font-size="10" text-anchor="middle" fill="#f3e3c0">12</text>
    <text x="0" y="-26" font-family="Cinzel, serif" font-size="6" letter-spacing="2" text-anchor="middle" fill="#7a1818">FEAR</text>
  </g>
</svg>
```

---

## 5. CSS Custom Properties

Defined on the variant root (`.dice-variant--tavern-scroll`).

| Property                       | Value                                              | Purpose                                      |
| ------------------------------ | -------------------------------------------------- | -------------------------------------------- |
| `--tavern-scroll-bg`           | `#e9d2a3`                                          | Parchment base                               |
| `--tavern-scroll-bg-soft`      | `#f3e3c0`                                          | Parchment highlight (top of scroll)          |
| `--tavern-scroll-bg-deep`      | `#d8bd86`                                          | Parchment shadow (bottom of scroll)          |
| `--tavern-scroll-ink`          | `#2b1a0c`                                          | Primary ink for outlines and numerals        |
| `--tavern-scroll-ink-soft`     | `#5a3a14`                                          | Secondary ink (italic captions)              |
| `--tavern-scroll-rule`         | `#8a6a30`                                          | Hairlines, decorative borders                |
| `--tavern-scroll-gold`         | `#d4a056`                                          | Gold accent (matches site)                   |
| `--tavern-scroll-gold-bright`  | `#f0c878`                                          | Gold hover/highlight                         |
| `--tavern-scroll-wax`          | `#7a1818`                                          | Wax red — Roll button + Fear                 |
| `--tavern-scroll-wax-deep`     | `#3a0808`                                          | Wax shadow                                   |
| `--tavern-scroll-shadow`       | `0 8px 24px rgba(40,20,8,0.45)`                    | Scroll lift                                  |
| `--tavern-scroll-shadow-fab`   | `0 6px 14px rgba(40,20,8,0.55)`                    | FAB lift                                     |
| `--hope-color`                 | `#d4a056`                                          | Required by contract                         |
| `--fear-color`                 | `#7a1818`                                          | Required by contract                         |
| `--crit-color`                 | `#f0c878`                                          | Required by contract — bright gold flare     |
| `--tavern-scroll-radius-sm`    | `6px`                                              | Inner cards (last-roll panel)                |
| `--tavern-scroll-radius-md`    | `9px`                                              | Dowel ends                                   |
| `--tavern-scroll-radius-pill`  | `20px`                                             | Roll button                                  |
| `--tavern-scroll-font-display` | `'Cinzel', 'Times New Roman', serif`               | Headings + numerals                          |
| `--tavern-scroll-font-body`    | `'Lora', Georgia, serif`                           | Body, history, microcopy                    |
| `--tavern-scroll-fs-title`     | `16px / 1.1, letter-spacing: 2px`                  | "TAVERN SCROLL"                              |
| `--tavern-scroll-fs-total`     | `34px / 1, weight 700`                             | Last roll total                              |
| `--tavern-scroll-fs-history`   | `11px / 1.4`                                       | Chronicle rows                               |
| `--tavern-scroll-anim-open`    | `380ms cubic-bezier(0.22, 1, 0.36, 1)`             | Unfurl                                       |
| `--tavern-scroll-anim-close`   | `260ms cubic-bezier(0.55, 0, 0.7, 0.2)`            | Roll-up                                      |
| `--tavern-scroll-anim-shake`   | `420ms cubic-bezier(0.36, 0.07, 0.19, 0.97)`       | Roll shake                                   |
| `--tavern-scroll-anim-splash`  | `560ms ease-out`                                   | Ink splatter overlay                         |

---

## 6. Layout Dimensions

| Element                       | Size                                                |
| ----------------------------- | --------------------------------------------------- |
| FAB                           | 64 × 64 px (hit target padded to 56 min)            |
| FAB anchor                    | `position: fixed; bottom: 24px; left: 24px`         |
| FAB z-index                   | `1100`                                              |
| Menu (open)                   | 360 × 540 px desktop                                |
| Menu anchor                   | `position: fixed; bottom: 24px; left: 24px`         |
| Menu z-index                  | `1100`                                              |
| Tray cell                     | 70 × 76 px (icon 44 + label 16 + counter pad)       |
| Last-roll panel               | 280 × 96 px, inset 40px from menu sides             |
| Roll button                   | 280 × 40 px, pill                                   |
| Chronicle viewport            | 280 × 100 px, `overflow-y: auto`                    |
| Chronicle row height          | 20 px                                               |
| Inner gutter                  | 16 px between sections                              |
| Internal padding              | 20 px                                               |

---

## 7. Interaction Notes

### Open / Close — "Unfurl"
- Closed → Open: scroll grows from a 64 × 24 strip (the wax-seal footprint) to its full 360 × 540. Use a `transform: scaleY(0.04) translateY(258px)` start state, animating to `scaleY(1) translateY(0)` over `--tavern-scroll-anim-open`. `transform-origin: bottom center` (so it appears to spool out the FAB).
- Inner contents fade in 120 ms after the unfurl starts (`opacity 0 → 1`, `delay 120ms`).
- Close: reverses with `--tavern-scroll-anim-close`. Inner contents fade out first (80 ms), then the scroll rolls down.
- The FAB seal "cracks open" on open (a 1px gold hairline appears at 30°) and reseals on close.
- `prefers-reduced-motion: reduce` → swap to `opacity 0 → 1` only (no scaleY), 160 ms.

### Roll — "Ink Splatter + Scroll Shake"
On Roll click:
1. **Shake (0–420 ms):** the entire menu translates with `keyframes`: `translate(0,0) → translate(-3px,1px) → translate(2px,-2px) → translate(-2px,2px) → translate(1px,0) → translate(0,0)`. Subtle, never more than 3px to avoid motion sickness.
2. **Ink splatter (40–600 ms):** an absolutely-positioned SVG overlay inside the last-roll card draws 3–5 ink dots and a single curved spatter using `stroke-dasharray` reveal (path-length based; `stroke-dashoffset: L → 0` over 320 ms). Splatter fades to 35% opacity at end and remains as decorative wash on the result.
3. **Numeral roll-in (140–520 ms):** the new total counts up from `floor(total * 0.6) → total` over 380 ms (linear), then a 120 ms `scale(1.06) → scale(1)` settle.
4. **Outcome microcopy** types in (`opacity 0 → 1`, slight `translateY(4px → 0)`).
5. **Crit:** the entire last-roll panel pulses border `--crit-color` for 700 ms (`box-shadow 0 0 0 0 → 0 0 0 6px transparent`), and "Critical Success!" replaces the regular outcome line in `--tavern-scroll-fs-total * 0.6`, gold.

### Hover states
- **FAB:** `translateY(-2px)`; rim shifts to `--tavern-scroll-gold-bright`; shadow deepens 30%. 160 ms ease-out.
- **Dice tile:** parchment lightens to `--tavern-scroll-bg-soft`; ink stroke thickens 1.25 → 1.5px; tile gains 1px gold dashed underline.
- **Counter +/-:** ink dot enlarges 1px; cursor pointer.
- **Roll button:** wax brightens (`#7a1818 → #9a2020`); inner highlight grows; subtle 1px lift.
- **History row:** background `#fff5dd` tint at 60%; italic outcome label brightens.

### Focus states
- Visible 2px outline ring in `--tavern-scroll-gold` with `outline-offset: 2px`. Never remove default focus ring without replacement.
- Focus moves into the menu on open (first focusable = first dice +/− or close button).

### Empty / Idle
- "LAST ROLL" panel reads `—` with italic Lora caption "*roll some dice, friend*" until first roll.
- Chronicle reads "*the page is blank*" centered, italic, `--tavern-scroll-ink-soft`.

---

## 8. Mobile / Tablet Responsive

| Breakpoint         | Behavior                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| ≥ 900px            | Default 360 × 540, anchored bottom-left.                                                       |
| 600 – 899px        | Menu 340 × 520. FAB and menu remain bottom-left.                                               |
| 360 – 599px        | Menu becomes `width: calc(100vw - 32px); max-width: 360px; height: min(560px, 80vh);` anchored 16px from left, 16px from bottom. Dice tray collapses to 4 × 2 still, but cells shrink to 64 × 70. |
| < 360px            | Menu is `width: calc(100vw - 16px); left: 8px;` and clips to viewport. Chronicle viewport drops to 80px to keep Roll button above the fold. |

**Theme-picker collision check:** Picker lives bottom-right (separate component). The Tavern Scroll menu's right edge at smallest viewport (360px) sits at `left: 8px + width = 352px`. Theme picker's collapsed FAB occupies ~56 × 56 at `bottom: 24px; right: 16px`, leaving a corridor of `viewport - 352 - 56 - 16 ≈ -8px` on a 320px device — but on the smallest realistic phones (375px iPhone SE), the corridor is ~31px which is acceptable. To eliminate any risk:
- Variant menu's bottom-right corner is rounded (radius-sm) so it doesn't visually hard-collide with the picker corner.
- When `window.innerWidth < 380px` and the menu is open, the menu reserves a `padding-right: 56px` zone in its **chronicle row** so long history strings don't run under the picker (CSS-only, no JS).

The picker stays in **always-tavern** style (per spec §6) so it harmonizes with this variant — no theme-of-theme conflict.

---

## 9. Accessibility

- **FAB:** `<button type="button" aria-label="Open dice roller" aria-expanded="false" aria-controls="tavern-scroll-menu">`. `aria-expanded` flips on toggle.
- **Menu:** `<section id="tavern-scroll-menu" role="dialog" aria-modal="false" aria-labelledby="tavern-scroll-title">`. Non-modal — character sheet remains operable behind it.
- **Title:** `<h2 id="tavern-scroll-title">Tavern Scroll</h2>` (visually rendered as the Cinzel banner).
- **Dice counters:** each is a labeled group: `<div role="group" aria-label="d6 count">` with `<button aria-label="Decrease d6">−</button> <span aria-live="polite">1</span> <button aria-label="Increase d6">+</button>`.
- **Duality toggle:** `<input type="checkbox" id="duality"> <label for="duality">Include duality dice</label>`.
- **Roll:** `<button type="button">Roll</button>`.
- **Last roll:** `<output aria-live="polite" aria-atomic="true">` so totals + outcome announce. Crit uses `<span class="sr-only">Critical Success!</span>` in addition to the visible label.
- **Chronicle:** `<ul aria-label="Roll history">`. Each `<li>` is a flat string; the visual ✦ glyphs are decorative (`aria-hidden="true"`), with a screen-reader-only "hope die" / "fear die" prefix.
- **Keyboard:**
  - `Esc` closes the menu (returns focus to the FAB).
  - `Tab` order: dice +/− pairs (left-to-right, top-to-bottom) → duality checkbox → Roll → Chronicle (each row is focusable for read-out) → Clear chronicle → close affordance.
  - Numeric keys 4/6/8/0/2 increment respective dice (4→d4, 6→d6, 8→d8, 0→d10, 2→d12). `Enter` rolls.
- **Color contrast:** `--tavern-scroll-ink (#2b1a0c)` on `--tavern-scroll-bg (#e9d2a3)` ≈ 11.4:1. Wax-red `--tavern-scroll-wax (#7a1818)` text on parchment ≈ 6.8:1. All AA+.
- **Reduced motion:** unfurl simplified to fade; ink splatter renders instantly (no draw); shake suppressed; counter total just snaps.
- **Reduced transparency:** parchment turbulence filter is feature-detected; if unsupported, fall back to flat `--tavern-scroll-bg`.

---

## 10. Layout Constraints That Affect the Shared Variant Contract

- **Anchor only bottom-left.** Variant must not reposition based on scroll; the FAB/menu live in the viewport corner.
- **Menu must NOT exceed `min(360px, calc(100vw - 16px))` width** so the bottom-right theme picker is never overlapped.
- **`output[aria-live="polite"]`** is the contract surface for the result panel — the implementer must keep total + outcome inside this element so other variants and a11y testers can rely on a consistent landmark.
- **The FAB seal sigil** uses the d20 silhouette by intent — when implementing, reuse the d20 SVG so we ship one SVG asset, not two.
- **Wax red `--tavern-scroll-wax` is the same channel as `--fear-color`** by design (the wax seal language ties the brand color to the fear die). Implementer should not de-duplicate — the duplication is intentional semantic separation.
- **CSS budget plan (≤4 kB):** ~600 B custom-property block, ~700 B layout (fixed positioning, grid, sizes), ~900 B chrome (parchment gradient, dowels, shadows), ~700 B animations (open, close, shake, splatter), ~600 B states (hover/focus/disabled/reduced-motion), ~400 B responsive media queries. Inline SVGs live in the template, not the CSS.
- **No external font load** required — Cinzel + Lora are already global on the site. Variant only references them via the custom properties above.

---

## 11. Microcopy (final strings)

| Context                         | String                          |
| ------------------------------- | ------------------------------- |
| Title                           | `TAVERN SCROLL`                 |
| Subtitle                        | `— select thy dice —`           |
| Last-roll empty                 | `roll some dice, friend`        |
| History empty                   | `the page is blank`             |
| Outcome — hope wins             | `with Hope`                     |
| Outcome — fear wins             | `with Fear`                     |
| Outcome — tie                   | `Critical Success!`             |
| Roll button                     | `ROLL`                          |
| Clear history                   | `clear`                         |
| Duality toggle label            | `Include duality dice`          |
| FAB aria-label                  | `Open dice roller`              |
| Close button aria-label         | `Close dice roller`             |

---

End of spec.
