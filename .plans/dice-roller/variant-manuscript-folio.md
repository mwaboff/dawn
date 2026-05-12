# Variant — Manuscript Folio

> A side drawer that slides in from the left, styled like an illuminated manuscript page with decorated marginalia. Dice are small woodcut illustrations. Results are typeset as calligraphic lines: "III · VII · XII … with Hope". History is stacked vellum cards. Warm parchment, ink-black, and gold initial caps.

This is a site-consistent (warm-tavern) variant. It is the "scholar's" sibling of Tavern Scroll (a wide unfurling parchment) and Arcane Glyph (a circular rune). Where Scroll feels like a hand-written note and Glyph feels like a ritual, **Folio feels like a bound book** — calm, archival, ledger-like. The whole drawer reads top-to-bottom like a manuscript page: rubricated heading, illuminated initial, marginalia commentary, body text of die results, then a stack of historical entries beneath.

---

## 1. Hero SVG mockup — open drawer

Realistic dimensions: drawer is **380 px wide × full viewport height**, anchored to the left edge. (Mockup is rendered at 760 px wide for readability — implementer should map 1:0.5.)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 1280" width="760" height="1280" role="img" aria-label="Manuscript Folio drawer mockup">
  <!-- Page backdrop (parchment) -->
  <defs>
    <linearGradient id="parch" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f3e6c8"/>
      <stop offset="1" stop-color="#e6d2a4"/>
    </linearGradient>
    <pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.4" fill="#3a2a18" opacity="0.05"/>
      <circle cx="4" cy="3" r="0.3" fill="#3a2a18" opacity="0.04"/>
    </pattern>
  </defs>

  <!-- Drawer (left-anchored, full height) -->
  <rect x="0" y="0" width="760" height="1280" fill="url(#parch)"/>
  <rect x="0" y="0" width="760" height="1280" fill="url(#grain)"/>

  <!-- Right edge — gilded inner border + drop shadow toward viewport -->
  <rect x="744" y="0" width="16" height="1280" fill="#d4a056" opacity="0.55"/>
  <rect x="730" y="0" width="14" height="1280" fill="#3a2a18" opacity="0.10"/>

  <!-- Outer gold rule (4 sides, inset 28) -->
  <rect x="28" y="28" width="704" height="1224" fill="none" stroke="#d4a056" stroke-width="3"/>
  <rect x="36" y="36" width="688" height="1208" fill="none" stroke="#3a2a18" stroke-width="0.8"/>

  <!-- Marginalia: vine corner (top-left) -->
  <g stroke="#7a4a1a" stroke-width="2.2" fill="none" stroke-linecap="round">
    <path d="M44 44 C 80 64, 110 60, 134 96 S 168 156, 144 196"/>
    <circle cx="80" cy="58" r="5" fill="#a72a2a" stroke="none"/>
    <circle cx="118" cy="86" r="5" fill="#a72a2a" stroke="none"/>
    <circle cx="146" cy="138" r="5" fill="#a72a2a" stroke="none"/>
    <path d="M82 56 q 14 -10 22 0 q -10 14 -22 0" fill="#5b8a3a" stroke="none"/>
    <path d="M120 84 q 14 -10 22 0 q -10 14 -22 0" fill="#5b8a3a" stroke="none"/>
  </g>

  <!-- Header: rubricated title -->
  <text x="80" y="120" font-family="Cinzel, serif" font-size="36" fill="#7a1f1f" letter-spacing="4">FOLIO  OF  ROLLS</text>
  <line x1="80" y1="138" x2="664" y2="138" stroke="#d4a056" stroke-width="1.4"/>
  <text x="80" y="166" font-family="Lora, serif" font-style="italic" font-size="16" fill="#3a2a18" opacity="0.78">A keeper of fortunes &amp; fates, bound this 22nd of April</text>

  <!-- Close X -->
  <g transform="translate(700,108)">
    <circle r="18" fill="#3a2a18" opacity="0.08"/>
    <path d="M-7 -7 L7 7 M-7 7 L7 -7" stroke="#3a2a18" stroke-width="2" stroke-linecap="round"/>
  </g>

  <!-- Section: SELECT THY DICE -->
  <text x="80" y="220" font-family="Cinzel, serif" font-size="14" fill="#3a2a18" letter-spacing="6" opacity="0.85">SELECT  THY  DICE</text>
  <line x1="80" y1="232" x2="240" y2="232" stroke="#3a2a18" stroke-width="0.8" opacity="0.4"/>

  <!-- Dice picker: 7 woodcut tiles in a 4x2 grid -->
  <g transform="translate(80,256)">
    <!-- Each tile: 140x84 with woodcut die + label + count stepper -->
    <g transform="translate(0,0)">
      <rect width="140" height="84" fill="#efe1bd" stroke="#7a4a1a" stroke-width="1"/>
      <!-- d4 woodcut: triangle -->
      <polygon points="34,62 60,18 86,62" fill="none" stroke="#1f1610" stroke-width="2"/>
      <line x1="60" y1="18" x2="60" y2="62" stroke="#1f1610" stroke-width="1" opacity="0.55"/>
      <text x="60" y="50" text-anchor="middle" font-family="Cinzel, serif" font-size="14" fill="#1f1610">IV</text>
      <text x="106" y="32" font-family="Cinzel, serif" font-size="11" fill="#3a2a18" letter-spacing="2">d4</text>
      <text x="106" y="64" font-family="Lora, serif" font-size="20" fill="#7a1f1f">2</text>
      <text x="124" y="50" font-family="Cinzel, serif" font-size="14" fill="#3a2a18" opacity="0.6">+</text>
      <text x="124" y="74" font-family="Cinzel, serif" font-size="14" fill="#3a2a18" opacity="0.6">−</text>
    </g>
    <g transform="translate(152,0)">
      <rect width="140" height="84" fill="#efe1bd" stroke="#7a4a1a" stroke-width="1"/>
      <polygon points="34,22 86,22 86,62 34,62" fill="none" stroke="#1f1610" stroke-width="2"/>
      <text x="60" y="50" text-anchor="middle" font-family="Cinzel, serif" font-size="14" fill="#1f1610">VI</text>
      <text x="106" y="32" font-family="Cinzel, serif" font-size="11" fill="#3a2a18" letter-spacing="2">d6</text>
      <text x="106" y="64" font-family="Lora, serif" font-size="20" fill="#3a2a18">0</text>
    </g>
    <g transform="translate(304,0)">
      <rect width="140" height="84" fill="#efe1bd" stroke="#7a4a1a" stroke-width="1"/>
      <polygon points="60,16 86,42 60,68 34,42" fill="none" stroke="#1f1610" stroke-width="2"/>
      <text x="60" y="48" text-anchor="middle" font-family="Cinzel, serif" font-size="13" fill="#1f1610">VIII</text>
      <text x="106" y="32" font-family="Cinzel, serif" font-size="11" fill="#3a2a18" letter-spacing="2">d8</text>
      <text x="106" y="64" font-family="Lora, serif" font-size="20" fill="#3a2a18">0</text>
    </g>
    <g transform="translate(456,0)">
      <rect width="140" height="84" fill="#efe1bd" stroke="#7a4a1a" stroke-width="1"/>
      <polygon points="60,16 88,30 84,60 60,72 36,60 32,30" fill="none" stroke="#1f1610" stroke-width="2"/>
      <text x="60" y="48" text-anchor="middle" font-family="Cinzel, serif" font-size="13" fill="#1f1610">X</text>
      <text x="106" y="32" font-family="Cinzel, serif" font-size="11" fill="#3a2a18" letter-spacing="2">d10</text>
      <text x="106" y="64" font-family="Lora, serif" font-size="20" fill="#3a2a18">0</text>
    </g>

    <!-- second row -->
    <g transform="translate(0,100)">
      <rect width="140" height="84" fill="#efe1bd" stroke="#7a4a1a" stroke-width="1"/>
      <polygon points="60,14 88,32 88,60 60,76 32,60 32,32" fill="none" stroke="#1f1610" stroke-width="2"/>
      <text x="60" y="50" text-anchor="middle" font-family="Cinzel, serif" font-size="13" fill="#1f1610">XII</text>
      <text x="106" y="32" font-family="Cinzel, serif" font-size="11" fill="#3a2a18" letter-spacing="2">d12</text>
      <text x="106" y="64" font-family="Lora, serif" font-size="20" fill="#3a2a18">0</text>
    </g>
    <g transform="translate(152,100)">
      <rect width="140" height="84" fill="#efe1bd" stroke="#7a4a1a" stroke-width="1"/>
      <circle cx="60" cy="44" r="26" fill="none" stroke="#1f1610" stroke-width="2"/>
      <line x1="60" y1="18" x2="60" y2="70" stroke="#1f1610" opacity="0.4"/>
      <line x1="34" y1="44" x2="86" y2="44" stroke="#1f1610" opacity="0.4"/>
      <text x="60" y="49" text-anchor="middle" font-family="Cinzel, serif" font-size="13" fill="#1f1610">XX</text>
      <text x="106" y="32" font-family="Cinzel, serif" font-size="11" fill="#3a2a18" letter-spacing="2">d20</text>
      <text x="106" y="64" font-family="Lora, serif" font-size="20" fill="#7a1f1f">1</text>
    </g>
    <g transform="translate(304,100)">
      <rect width="140" height="84" fill="#efe1bd" stroke="#7a4a1a" stroke-width="1"/>
      <circle cx="50" cy="44" r="22" fill="none" stroke="#1f1610" stroke-width="2"/>
      <circle cx="74" cy="44" r="22" fill="none" stroke="#1f1610" stroke-width="2"/>
      <text x="62" y="50" text-anchor="middle" font-family="Cinzel, serif" font-size="11" fill="#1f1610">C</text>
      <text x="106" y="32" font-family="Cinzel, serif" font-size="11" fill="#3a2a18" letter-spacing="2">d100</text>
      <text x="106" y="64" font-family="Lora, serif" font-size="20" fill="#3a2a18">0</text>
    </g>
    <g transform="translate(456,100)">
      <!-- Duality tile, slightly emphasized -->
      <rect width="140" height="84" fill="#f6ead0" stroke="#d4a056" stroke-width="1.6"/>
      <polygon points="36,14 60,30 60,58 36,72 12,58 12,30" fill="none" stroke="#d4a056" stroke-width="2"/>
      <polygon points="92,14 116,30 116,58 92,72 68,58 68,30" fill="none" stroke="#7a1f1f" stroke-width="2"/>
      <!-- sun & moon glyphs inside -->
      <circle cx="36" cy="44" r="6" fill="#d4a056" opacity="0.85"/>
      <path d="M96 38 a8 8 0 1 0 0 12 a6 6 0 1 1 0 -12 z" fill="#7a1f1f"/>
      <text x="70" y="80" text-anchor="middle" font-family="Cinzel, serif" font-size="10" fill="#3a2a18" letter-spacing="3">DUALITY</text>
    </g>
  </g>

  <!-- Section: INVOKE THE FATES (CTA) -->
  <text x="80" y="496" font-family="Cinzel, serif" font-size="14" fill="#3a2a18" letter-spacing="6" opacity="0.85">INVOKE  THE  FATES</text>
  <line x1="80" y1="508" x2="240" y2="508" stroke="#3a2a18" stroke-width="0.8" opacity="0.4"/>

  <!-- Roll button -->
  <g transform="translate(80,524)">
    <rect width="516" height="56" fill="#3a2a18" stroke="#d4a056" stroke-width="1.5"/>
    <text x="258" y="36" text-anchor="middle" font-family="Cinzel, serif" font-size="20" fill="#f3e6c8" letter-spacing="6">CAST  THE  DICE</text>
  </g>

  <!-- Section: LATEST RESULT -->
  <text x="80" y="624" font-family="Cinzel, serif" font-size="14" fill="#3a2a18" letter-spacing="6" opacity="0.85">LATEST  RESULT</text>
  <line x1="80" y1="636" x2="240" y2="636" stroke="#3a2a18" stroke-width="0.8" opacity="0.4"/>

  <!-- Featured result card with illuminated initial -->
  <g transform="translate(80,656)">
    <rect width="600" height="180" fill="#fbf1d4" stroke="#7a4a1a" stroke-width="1"/>
    <!-- Initial cap "R" (rubricated, square) -->
    <rect x="20" y="20" width="64" height="64" fill="#7a1f1f"/>
    <rect x="22" y="22" width="60" height="60" fill="none" stroke="#d4a056" stroke-width="1"/>
    <text x="52" y="72" text-anchor="middle" font-family="Cinzel, serif" font-size="46" fill="#f3e6c8">R</text>
    <text x="100" y="46" font-family="Cinzel, serif" font-size="13" fill="#3a2a18" letter-spacing="4">olled · 2d4 · 1d20 · duality</text>
    <text x="100" y="78" font-family="Lora, serif" font-style="italic" font-size="22" fill="#1f1610">III · IV  ·  XVII  ·  ◑ V (hope) · ☾ III (fear)</text>
    <line x1="20" y1="104" x2="580" y2="104" stroke="#d4a056" stroke-width="0.8"/>
    <text x="20" y="138" font-family="Cinzel, serif" font-size="12" fill="#3a2a18" letter-spacing="3">TOTAL</text>
    <text x="20" y="166" font-family="Cinzel, serif" font-size="34" fill="#1f1610">XXXII</text>
    <text x="580" y="138" text-anchor="end" font-family="Cinzel, serif" font-size="12" fill="#3a2a18" letter-spacing="3">OUTCOME</text>
    <text x="580" y="166" text-anchor="end" font-family="Cinzel, serif" font-style="italic" font-size="22" fill="#d4a056">with Hope</text>
  </g>

  <!-- Page-flip ornament between latest result & history -->
  <g transform="translate(380,860)">
    <line x1="-180" y1="0" x2="-30" y2="0" stroke="#3a2a18" stroke-width="0.6" opacity="0.4"/>
    <line x1="30" y1="0" x2="180" y2="0" stroke="#3a2a18" stroke-width="0.6" opacity="0.4"/>
    <text x="0" y="6" text-anchor="middle" font-family="Cinzel, serif" font-size="16" fill="#d4a056">❦</text>
  </g>

  <!-- Section: PRIOR ENTRIES (vellum cards) -->
  <text x="80" y="900" font-family="Cinzel, serif" font-size="14" fill="#3a2a18" letter-spacing="6" opacity="0.85">PRIOR  ENTRIES</text>
  <text x="680" y="900" text-anchor="end" font-family="Lora, serif" font-style="italic" font-size="12" fill="#7a1f1f">clear the folio</text>

  <g transform="translate(80,920)">
    <rect width="600" height="80" fill="#f0e1bb" stroke="#7a4a1a" stroke-width="0.8"/>
    <text x="20" y="32" font-family="Cinzel, serif" font-size="11" letter-spacing="3" fill="#3a2a18" opacity="0.7">10:42 · 1d12 + duality</text>
    <text x="20" y="60" font-family="Lora, serif" font-style="italic" font-size="18" fill="#1f1610">IX  ·  ◑ XI  ·  ☾ XI  →  XXXI</text>
    <text x="580" y="60" text-anchor="end" font-family="Cinzel, serif" font-style="italic" font-size="14" fill="#7a1f1f">Critical Success!</text>
  </g>
  <g transform="translate(80,1010)">
    <rect width="600" height="80" fill="#f0e1bb" stroke="#7a4a1a" stroke-width="0.8"/>
    <text x="20" y="32" font-family="Cinzel, serif" font-size="11" letter-spacing="3" fill="#3a2a18" opacity="0.7">10:39 · 3d6</text>
    <text x="20" y="60" font-family="Lora, serif" font-style="italic" font-size="18" fill="#1f1610">II  ·  V  ·  III  →  X</text>
  </g>
  <g transform="translate(80,1100)">
    <rect width="600" height="80" fill="#f0e1bb" stroke="#7a4a1a" stroke-width="0.8"/>
    <text x="20" y="32" font-family="Cinzel, serif" font-size="11" letter-spacing="3" fill="#3a2a18" opacity="0.7">10:37 · 1d20 + duality</text>
    <text x="20" y="60" font-family="Lora, serif" font-style="italic" font-size="18" fill="#1f1610">XIV  ·  ◑ III  ·  ☾ VIII  →  XXV</text>
    <text x="580" y="60" text-anchor="end" font-family="Cinzel, serif" font-style="italic" font-size="14" fill="#5a1212">with Fear</text>
  </g>

  <!-- Bottom marginalia -->
  <g stroke="#7a4a1a" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.85">
    <path d="M716 1216 C 690 1190, 680 1158, 700 1124 S 730 1080, 712 1040"/>
    <circle cx="708" cy="1192" r="4" fill="#a72a2a" stroke="none"/>
    <circle cx="704" cy="1140" r="4" fill="#a72a2a" stroke="none"/>
  </g>
</svg>
```

---

## 2. Hero SVG mockup — FAB (closed state)

The FAB is a **wax-stamped pressed-leather book cover**. Round, 64 px, bottom-left, with a gold quill icon over a small dot indicating unread roll history (only when `history().length > 0`). The button reads as "open the folio."

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Open dice folio FAB">
  <!-- Drop shadow under the disk -->
  <ellipse cx="80" cy="138" rx="44" ry="6" fill="#1f1610" opacity="0.30"/>

  <!-- Leather disk -->
  <circle cx="80" cy="78" r="56" fill="#3a2a18" stroke="#1f1610" stroke-width="1.5"/>
  <!-- Inner gold tooled border -->
  <circle cx="80" cy="78" r="48" fill="none" stroke="#d4a056" stroke-width="1.5"/>
  <circle cx="80" cy="78" r="44" fill="none" stroke="#d4a056" stroke-width="0.6" opacity="0.6"/>

  <!-- Decorative corner fleurons (4) -->
  <g fill="#d4a056" opacity="0.85">
    <path d="M80 36 q 4 6 0 10 q -4 -4 0 -10z"/>
    <path d="M80 120 q 4 -6 0 -10 q -4 4 0 10z"/>
    <path d="M38 78 q 6 4 10 0 q -4 -4 -10 0z"/>
    <path d="M122 78 q -6 4 -10 0 q 4 -4 10 0z"/>
  </g>

  <!-- Quill icon -->
  <g stroke="#d4a056" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M58 96 C 70 80, 92 64, 104 60"/>
    <path d="M104 60 L 100 70 L 92 66 Z" fill="#d4a056"/>
    <path d="M58 96 L 64 98 L 62 92 Z" fill="#d4a056"/>
  </g>

  <!-- Unread indicator: small wax bead -->
  <circle cx="116" cy="40" r="9" fill="#7a1f1f" stroke="#d4a056" stroke-width="1.4"/>
</svg>
```

Hover/focus: gold border thickens (1.5 → 2.2 px) and a faint parchment glow (4 px outer-shadow `--manuscript-folio-gold` at 35%) appears. Active (pressed): disk depresses 1 px and the wax bead `transform: scale(0.92)`.

---

## 3. Woodcut die illustrations

Each die is hand-carved-looking lineart sized to fit a **40 × 40 px** tile (drawn here at 80 × 80 for clarity). Stroke is 1.6 px ink-black `--manuscript-folio-ink`; interior receives a single hatched shadow line for woodcut depth. Roman numerals are baked into each face.

### d4
```svg
<svg viewBox="0 0 80 80" width="80" height="80"><polygon points="14,64 40,12 66,64" fill="none" stroke="#1f1610" stroke-width="1.8"/><line x1="40" y1="12" x2="40" y2="64" stroke="#1f1610" stroke-width="1" opacity="0.55"/><text x="40" y="52" text-anchor="middle" font-family="Cinzel, serif" font-size="14" fill="#1f1610">IV</text></svg>
```

### d6
```svg
<svg viewBox="0 0 80 80" width="80" height="80"><rect x="14" y="14" width="52" height="52" fill="none" stroke="#1f1610" stroke-width="1.8"/><line x1="14" y1="14" x2="22" y2="6" stroke="#1f1610" stroke-width="1.2"/><line x1="66" y1="14" x2="74" y2="6" stroke="#1f1610" stroke-width="1.2"/><line x1="22" y1="6" x2="74" y2="6" stroke="#1f1610" stroke-width="1.2"/><line x1="74" y1="6" x2="74" y2="58" stroke="#1f1610" stroke-width="1.2" opacity="0.7"/><line x1="66" y1="14" x2="74" y2="6" stroke="#1f1610" stroke-width="1.2" opacity="0.7"/><text x="40" y="48" text-anchor="middle" font-family="Cinzel, serif" font-size="14" fill="#1f1610">VI</text></svg>
```

### d8
```svg
<svg viewBox="0 0 80 80" width="80" height="80"><polygon points="40,10 70,40 40,70 10,40" fill="none" stroke="#1f1610" stroke-width="1.8"/><line x1="10" y1="40" x2="70" y2="40" stroke="#1f1610" stroke-width="1" opacity="0.55"/><text x="40" y="46" text-anchor="middle" font-family="Cinzel, serif" font-size="13" fill="#1f1610">VIII</text></svg>
```

### d10
```svg
<svg viewBox="0 0 80 80" width="80" height="80"><polygon points="40,8 68,24 62,56 40,72 18,56 12,24" fill="none" stroke="#1f1610" stroke-width="1.8"/><line x1="40" y1="8" x2="40" y2="72" stroke="#1f1610" stroke-width="1" opacity="0.45"/><text x="40" y="46" text-anchor="middle" font-family="Cinzel, serif" font-size="13" fill="#1f1610">X</text></svg>
```

### d12
```svg
<svg viewBox="0 0 80 80" width="80" height="80"><polygon points="40,8 64,22 70,48 56,68 24,68 10,48 16,22" fill="none" stroke="#1f1610" stroke-width="1.8"/><line x1="40" y1="8" x2="40" y2="68" stroke="#1f1610" stroke-width="0.8" opacity="0.45"/><text x="40" y="46" text-anchor="middle" font-family="Cinzel, serif" font-size="13" fill="#1f1610">XII</text></svg>
```

### d20
```svg
<svg viewBox="0 0 80 80" width="80" height="80"><polygon points="40,8 70,28 60,64 20,64 10,28" fill="none" stroke="#1f1610" stroke-width="1.8"/><line x1="40" y1="8" x2="20" y2="64" stroke="#1f1610" stroke-width="0.8" opacity="0.55"/><line x1="40" y1="8" x2="60" y2="64" stroke="#1f1610" stroke-width="0.8" opacity="0.55"/><line x1="10" y1="28" x2="70" y2="28" stroke="#1f1610" stroke-width="0.8" opacity="0.55"/><text x="40" y="50" text-anchor="middle" font-family="Cinzel, serif" font-size="13" fill="#1f1610">XX</text></svg>
```

### d100
Two overlapping decahedrons inscribed with a "C" (Roman 100):
```svg
<svg viewBox="0 0 80 80" width="80" height="80"><polygon points="32,10 54,18 50,46 32,58 14,46 10,18" fill="none" stroke="#1f1610" stroke-width="1.6"/><polygon points="58,22 78,30 74,58 58,68 42,58 38,30" fill="none" stroke="#1f1610" stroke-width="1.6"/><text x="36" y="40" text-anchor="middle" font-family="Cinzel, serif" font-size="11" fill="#1f1610">C</text></svg>
```

### Duality pair (Hope d12 + Fear d12)
Twin d12s side-by-side, ringed in their respective colors. Hope carries a sun glyph; Fear carries a crescent moon.

```svg
<svg viewBox="0 0 160 80" width="160" height="80">
  <!-- Hope d12 -->
  <polygon points="40,8 64,22 70,48 56,68 24,68 10,48 16,22" fill="none" stroke="#d4a056" stroke-width="2"/>
  <circle cx="40" cy="40" r="10" fill="none" stroke="#d4a056" stroke-width="1.5"/>
  <circle cx="40" cy="40" r="3" fill="#d4a056"/>
  <g stroke="#d4a056" stroke-width="1.2"><line x1="40" y1="22" x2="40" y2="28"/><line x1="40" y1="52" x2="40" y2="58"/><line x1="22" y1="40" x2="28" y2="40"/><line x1="52" y1="40" x2="58" y2="40"/></g>
  <text x="40" y="76" text-anchor="middle" font-family="Cinzel, serif" font-size="9" fill="#3a2a18" letter-spacing="3">HOPE</text>

  <!-- Fear d12 -->
  <polygon points="120,8 144,22 150,48 136,68 104,68 90,48 96,22" fill="none" stroke="#7a1f1f" stroke-width="2"/>
  <path d="M126 32 a10 10 0 1 0 0 16 a8 8 0 1 1 0 -16 z" fill="#7a1f1f"/>
  <text x="120" y="76" text-anchor="middle" font-family="Cinzel, serif" font-size="9" fill="#3a2a18" letter-spacing="3">FEAR</text>
</svg>
```

When the duality crit fires (hope === fear), both rings render with the `--crit-color` (illuminated gold) plus a thin red rubric outer ring; see §6 animation.

---

## 4. CSS Custom Properties

All variables are scoped under `[data-roller-variant="manuscript-folio"]` (or the root of the variant component). Site-level `--hope-color`, `--fear-color`, `--crit-color` are mapped from these so the variant contract is satisfied.

| Token | Value | Notes |
|---|---|---|
| `--manuscript-folio-bg` | `#f3e6c8` | Aged parchment base |
| `--manuscript-folio-bg-deep` | `#e6d2a4` | Bottom of parchment gradient |
| `--manuscript-folio-vellum` | `#fbf1d4` | Featured-result card background |
| `--manuscript-folio-vellum-alt` | `#f0e1bb` | History card background |
| `--manuscript-folio-ink` | `#1f1610` | Text + die strokes |
| `--manuscript-folio-ink-soft` | `#3a2a18` | Borders, secondary text |
| `--manuscript-folio-gold` | `#d4a056` | Rules, gilded borders, hope |
| `--manuscript-folio-gold-soft` | `rgba(212,160,86,0.55)` | Inner edge glow |
| `--manuscript-folio-rubric` | `#7a1f1f` | Initial caps, headings, fear |
| `--manuscript-folio-rubric-deep` | `#5a1212` | "with Fear" microcopy |
| `--manuscript-folio-vine` | `#7a4a1a` | Marginalia stems |
| `--manuscript-folio-leaf` | `#5b8a3a` | Marginalia leaves |
| `--manuscript-folio-berry` | `#a72a2a` | Marginalia berries |
| `--manuscript-folio-hope` | `var(--manuscript-folio-gold)` | Maps to `--hope-color` |
| `--manuscript-folio-fear` | `var(--manuscript-folio-rubric)` | Maps to `--fear-color` |
| `--manuscript-folio-crit` | `#e8c060` | Brighter gold; maps to `--crit-color` |
| `--manuscript-folio-shadow` | `0 8px 24px -8px rgba(31,22,16,0.35)` | Drawer cast shadow on viewport |
| `--manuscript-folio-shadow-card` | `inset 0 0 0 1px rgba(122,74,26,0.4)` | Vellum card inner edge |
| **Type** |||
| `--font-display` | `"Cinzel", serif` | Headings, initials, Roman numerals |
| `--font-body` | `"Lora", serif` | Result lines (italic), microcopy |
| `--fs-title` | `1.875rem` (30 px) | "FOLIO OF ROLLS" |
| `--fs-section` | `0.78rem` (12.5 px) tracked +6 | "SELECT THY DICE" |
| `--fs-result` | `1.25rem` (20 px) italic | Calligraphic result line |
| `--fs-total` | `2rem` (32 px) | Total Roman numeral |
| `--fs-initial-cap` | `2.75rem` (44 px) | The rubricated R |
| **Borders** |||
| `--border-rule` | `1.4px solid var(--manuscript-folio-gold)` | Section separator |
| `--border-frame` | `3px solid var(--manuscript-folio-gold)` + `0.8px solid var(--manuscript-folio-ink-soft)` inner | Outer page frame |
| `--border-card` | `1px solid var(--manuscript-folio-vine)` | Vellum cards |
| **Animation** |||
| `--ease-page` | `cubic-bezier(0.22, 1, 0.36, 1)` | Drawer slide |
| `--dur-drawer` | `360ms` | Slide in/out |
| `--dur-ink` | `520ms` | Result ink-fill |
| `--dur-flip` | `220ms` | Page-flip ornament |
| `--dur-hover` | `140ms` | Tile hover |

---

## 5. Layout dimensions

| Element | Dimension | Notes |
|---|---|---|
| Drawer width (desktop ≥ 768 px) | **380 px** | Fixed; full viewport height |
| Drawer width (1280 px+) | 420 px | Optional break-up |
| Drawer height | `100dvh` | Avoid `100vh` to handle mobile chrome |
| Drawer offset | `top: 0; left: 0` | Slides from `translateX(-100%)` to `0` |
| Drawer z-index | **1100** | Per contract |
| FAB diameter | **64 px** | 56 px on screens < 360 px |
| FAB position | `bottom: 24px; left: 24px` | Per contract |
| FAB z-index | **1100** | Sibling of drawer |
| Theme picker | Untouched at bottom-right z-1200 | Variant must NOT render anywhere right of viewport center on narrow screens (see §7) |
| Outer page frame inset | 28 px from drawer edge | Gold + ink double rule |
| Section gutter | 24 px vertical between sections | |
| Dice picker tile | **70 × 42 px** (rendered) | 4 columns × 2 rows in 308 × 92 area; the 8th tile is duality, full-width across cols 1-4 of row 3, **88 px tall** with gilded border |
| Featured result card | 100% drawer width minus 32 px padding × **180 px tall** | Vellum |
| History card | full inner width × **80 px** each | Stacked, 12 px vertical gap |
| History scroll region | starts after page-flip ornament; flex-grows to fill remaining `100dvh` | `overflow-y: auto`, custom scrollbar gold-on-parchment |

---

## 6. Interactions & animations

### Drawer open/close
- Closed state: `transform: translateX(-100%); opacity: 0;`. FAB visible at `bottom-left`.
- Open transition: `transform var(--dur-drawer) var(--ease-page), opacity var(--dur-drawer) var(--ease-page);`
- Underneath the drawer, a subtle `box-shadow: var(--manuscript-folio-shadow)` extends 24 px to the right onto the viewport (no full-screen scrim — this is a side drawer, not a modal).
- Close triggers: X button, `Escape`, click outside the drawer (excluding the theme picker), or FAB toggle.
- `prefers-reduced-motion: reduce` → drop transform animation; just opacity 0→1 in 120 ms.

### Roll animation — quill-stroke / ink-fill
When the user clicks **Cast the Dice**:
1. The featured result card's existing content fades to 0 in 100 ms.
2. New result inserts with text initially rendered in `color: transparent` and a `background: linear-gradient(90deg, var(--manuscript-folio-ink) 0 0) no-repeat; background-size: 0 100%; -webkit-background-clip: text; background-clip: text;`
3. Animate `background-size` from `0% 100%` → `100% 100%` over `var(--dur-ink)` (520 ms) — looks like ink flowing left-to-right through each Roman numeral.
4. Initial cap "R" pops in with `transform: scale(0.7) → 1` and `opacity 0 → 1` over 280 ms with a small `transform-origin: bottom left`.
5. Outcome label ("with Hope" / "with Fear" / "Critical Success!") fades in last (200 ms delay), tinted by `--manuscript-folio-hope/fear/crit`.
6. **Crit override:** the entire featured-card border briefly pulses gold→rubric→gold over 600 ms, and the duality dice in the card render with the gold + red double ring described in §3.

### Page-flip ornament
After the new result lands, the `❦` ornament between latest-result and history briefly rotates `0deg → 18deg → 0deg` over `var(--dur-flip)` (220 ms). Suggests a page being turned to log the entry.

### History entry insert
When a new roll is committed, the new vellum card slides down from `translateY(-8px); opacity: 0;` into place over 200 ms, while the previous topmost history card receives a 1-frame `box-shadow` flash to indicate it has been "stamped in."

### Hover / focus
- **Dice tile hover:** background `--manuscript-folio-vellum`, border thickens to 1.5 px `--manuscript-folio-gold`. Cursor `pointer`.
- **Dice tile focus-visible:** 2 px outer outline `--manuscript-folio-gold` with 2 px offset; underline the dice label.
- **Cast button hover:** background lightens to `#4a3624`, text letter-spacing eases from 6 → 7 px.
- **Cast button focus-visible:** add 2 px gold ring + 2 px offset.
- **History card hover:** subtle `transform: translateX(2px)` and `box-shadow: var(--manuscript-folio-shadow-card)`.

### Stepper (count) interactions
Clicking + or − on a dice tile updates the count signal. Long-press (≥ 400 ms) auto-increments at 8 fps. Mouse wheel over a tile also adjusts the count when the tile has focus.

---

## 7. Responsive behavior

### Tablet (≥ 600 px, < 1024 px)
- Drawer remains a **left side drawer** at 380 px.
- Dice picker collapses to **3 cols × 3 rows** (last row leaves duality full-width).
- Headline shrinks to 26 px.

### Mobile (< 600 px) — **bottom sheet mode**
- The drawer detaches from the left and becomes a **bottom sheet** anchored to `bottom: 0; left: 0; right: 0;` with `border-radius: 16px 16px 0 0;` and `max-height: 88dvh`.
- Slide-in transform changes to `translateY(100%) → 0`.
- Outer gold frame inset reduces to 16 px.
- A drag handle (`32 × 4 px` rounded gold pill) sits at the top.
- **Crucially:** the bottom sheet must NOT extend below `bottom: 96px` if visible on the right edge — the theme picker reserves `bottom-right: 24px` with a roughly 64 × 64 px footprint and an additional 200 px expanded panel height. Solution: the bottom sheet anchors `right: 96px` on its **handle bar only** when expanded on a viewport narrower than 480 px and the picker is detected as expanded; the sheet itself stays full-width but adds a transparent right-edge gutter of 96 px on its top 56 px (header zone) so the picker FAB is never visually overlapped. This is purely cosmetic guard against the picker FAB; the picker itself stays z-1200 and remains tappable on top of any roller content.
- Dice picker becomes **2 cols × 4 rows** (duality occupies its own row).
- History uses native momentum scroll; first 2 entries are visible without scrolling.

### Reduced-motion (`prefers-reduced-motion: reduce`)
- All translate-in animations drop to opacity-only fades, 120 ms.
- Ink-fill becomes an instant text color set.
- Page-flip ornament rotation is suppressed; opacity flicker (0.4→1) over 120 ms substitutes.

---

## 8. Roman numeral mapping (display-only)

The underlying numeric `value: number` in `DieResult` and `DualityResult.hope/fear` stays arabic. Roman numerals are a **presentation transform** applied only in the variant's templates / pipe.

**Recommended approach (small, no-budget pipe):**
A single pure function `toRoman(n: number): string`. Implementation choice is up to the implementer; below is a 12-entry lookup that fits everything we actually display from d4–d12 and duality (1..12) plus the Roman covers d20 (XX) easily.

| Value | Roman |
|---|---|
| 1 | I | 2 II | 3 III | 4 IV | 5 V | 6 VI |
| 7 | VII | 8 VIII | 9 IX | 10 X | 11 XI | 12 XII |

For d20 results (1..20) and the rare d100 (1..100), we have two options. **Recommended:** keep a small extension that handles 1..39 cheaply with the `IVXL` ladder (still well under 30 lines) so d20 always renders Roman. **Fallback for d100 (>12):** if the implementer's CSS/TS budget is tight, **fall back to arabic for any value > 12** and tag the result with class `is-arabic` for slight font-weight reduction. The microcopy and outcome lines remain Roman. This is acceptable because:
- d100 is rare in Daggerheart play.
- Roman numerals above 39 (`XL`) get visually heavy and hurt scannability.

**Recommendation in this spec:** support **1..39 Roman**, fall back to arabic above. The total line is also Roman 1..39 then arabic. (39 covers the realistic max of 1d12 + 1d12 duality + a small grouping; if a user rolls 10d20 they are already in arabic territory and that is fine.)

---

## 9. Accessibility

| Concern | Approach |
|---|---|
| Drawer role | `<aside role="dialog" aria-modal="false" aria-labelledby="folio-title">` — non-modal because the page beneath is still readable on tablet/desktop. On mobile (bottom-sheet), upgrade to `aria-modal="true"` and add a transparent backdrop that captures clicks (closes the sheet). |
| Title id | `#folio-title` on "FOLIO OF ROLLS" |
| Focus trap | When `aria-modal="true"` (mobile), trap focus in the drawer using a focus-trap utility. Restore focus to the FAB on close. On desktop (non-modal), do **not** trap, but the FAB still receives focus on close. |
| Escape | `keydown` listener on the drawer element closes via `service.close()`. |
| Tab order | Close (X) → Section heading skip-link "Skip to roll button" → 7 dice tiles + duality tile → Cast button → Latest result region (`role="status" aria-live="polite"`) → Clear history → history list. |
| Live region | The featured result card has `role="status" aria-live="polite" aria-atomic="true"`. Screen reader announces e.g. "Rolled 2d4, 1d20, with hope. Total 32." (arabic in the SR text — the visible Roman is decorative). |
| ARIA labels | FAB: `aria-label="Open dice folio"`, includes `aria-expanded` and `aria-controls="dice-folio-drawer"`. Tiles: `aria-label="d6, count 0. Use plus and minus to change."` Steppers are real `<button>` elements with `aria-label="Increase d6 count"`. |
| Roman numeral SR | Each Roman-numeral text node is wrapped in `<span aria-hidden="true">XII</span><span class="visually-hidden">12</span>` — assistive tech reads numerals; sighted users see calligraphy. |
| Outcome contrast | `--manuscript-folio-rubric (#7a1f1f)` on `--manuscript-folio-vellum (#fbf1d4)`: contrast ratio ≈ 8.7:1. Gold `#d4a056` on vellum: ≈ 3.4:1 — used only for non-text decoration or 18 px+ italic accents (passes AA Large). |
| Outcome text color compliance | "with Hope" line uses `--manuscript-folio-gold` at 22 px italic weight 500 (passes AA Large). "with Fear" uses the deeper `--manuscript-folio-rubric-deep #5a1212` (≈ 11.2:1). "Critical Success!" uses `--manuscript-folio-rubric` over a brief gold halo background. |
| Reduced motion | Honored as described in §6. |
| Keyboard navigation | Arrow keys within the dice picker grid move focus tile-to-tile (←/→/↑/↓), wrapping at edges. Space/Enter on a focused tile increments count by 1 (with a visible affordance). Steppers are still focusable individually for accessibility. |
| Screen-reader heading hierarchy | h2 for "Folio of Rolls"; h3 for each section ("Select Thy Dice", "Latest Result", "Prior Entries"). |

---

## 10. Variant contract impact / constraints

The Manuscript Folio variant introduces **no breaking changes** to the shared variant contract in plan §5. Specifically:

- **z-index:** FAB and drawer both at `1100` as required. The drawer is fixed-position siblings of the FAB. Theme picker remains untouched at `1200`.
- **FAB position:** bottom-left (`24, 24`).
- **Hope/fear/crit colors:** mapped to site-wide `--hope-color`, `--fear-color`, `--crit-color` via the variant root's CSS.
- **Microcopy:** "with Hope" / "with Fear" / "Critical Success!" exactly as specified, applied to the outcome text node.
- **Service usage:** standard `service.toggle()` from FAB; `service.roll(request)` from Cast button; renders `service.history()`; calls `service.consumePendingRequest()` on init.

**One layout consideration to flag for the orchestrator:** because the drawer covers `left: 0` for 380 px on desktop, the **Character Sheet's left rail** (if any) is visually obscured while the drawer is open. This is acceptable — the drawer is dismissible and non-modal — but it differs from variants like Tavern Scroll that unfurl from the bottom-left corner. No code coordination required; just a UX note for QA.

**CSS budget plan to stay under 4 kB:**
- Reuse Tailwind / global tokens where possible (Cinzel/Lora are already loaded).
- Inline the woodcut die SVGs in the template (`*.html`), not in CSS.
- Page-frame double border via a single element using `outline` + `box-shadow` instead of multiple wrapper divs.
- Marginalia vines drawn as inline SVGs in template, not CSS background images.
- Pseudo-elements `::before` / `::after` for the gold rule under section titles (no extra DOM).
- `rem` and CSS custom properties only; no per-tile classes — use a single `.tile` class with data attributes for the die kind.

Estimated final CSS size: **≈ 3.4 kB** (well within budget).

---

## 11. Microcopy reference

| Slot | Text |
|---|---|
| FAB aria-label | "Open dice folio" |
| Drawer title | "Folio of Rolls" |
| Drawer subtitle (italic) | "A keeper of fortunes & fates, bound this {date}" — `{date}` from `Intl.DateTimeFormat`, format `d MMMM` |
| Section: dice picker | "Select Thy Dice" |
| Section: action | "Invoke the Fates" |
| Section: latest | "Latest Result" |
| Section: history | "Prior Entries" |
| Cast button | "Cast the Dice" |
| Empty state (no rolls yet) | featured card shows "*Awaiting your first cast.*" in italic, no initial cap |
| Empty history | "*The folio is unmarked.*" italic, centered |
| Clear history link | "clear the folio" (lowercase, italic) |
| Outcome — hope | "with Hope" |
| Outcome — fear | "with Fear" |
| Outcome — crit | "Critical Success!" |

---

## 12. Open questions left to implementer

1. **Date format in subtitle**: `d MMMM` ("22 April") vs. `MMMM d` — implementer's call. Localized via `Intl.DateTimeFormat(navigator.language)`.
2. **Sound**: out of scope for v1.
3. **Roman pipe location**: a `RomanPipe` in `shared/utils/roman.utils.ts` would be reusable; otherwise inline as a private method on the variant component. Either is fine.
4. **Theme picker collision on bottom-sheet**: if the picker is observed to overlap the drag-handle on very narrow viewports (< 360 px), implementer may shift the drag-handle 8 px left of center. Documented in §7.
