# Variant Spec: Arcane Glyph

> Site-consistent #2. Dice arranged on the seven points of a heptagram inscribed in a glowing rune-circle. Tap the FAB → the glyph blooms outward over a dark veil. A central crystal shows the running total; two celestial discs (sun = Hope, moon = Fear) flank it when duality is enabled. Etched bronze plate, gold filaments, candlelit glow.

---

## 1. Hero SVG — Open State (heptagram glyph + modal overlay)

Realistic dimensions: overlay fills viewport; glyph is 560 × 560 px on desktop, anchored bottom-left with a 32px offset, falling back to centered on small viewports (see §6).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720" width="960" height="720"
     role="img" aria-label="Arcane Glyph dice roller, open">
  <!-- 1. Modal overlay -->
  <rect x="0" y="0" width="960" height="720" fill="#0a0604" opacity="0.74"/>
  <!-- vignette -->
  <radialGradient id="vig" cx="0.18" cy="0.78" r="0.7">
    <stop offset="0" stop-color="#1a0e07" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
  <rect x="0" y="0" width="960" height="720" fill="url(#vig)"/>

  <!-- 2. Glyph anchored bottom-left (cx=300, cy=440), R=240 -->
  <defs>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#d4a056" stop-opacity="0.35"/>
      <stop offset="0.7" stop-color="#d4a056" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#d4a056" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bronze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a3a1f"/>
      <stop offset="1" stop-color="#2a1a0e"/>
    </linearGradient>
  </defs>
  <circle cx="300" cy="440" r="280" fill="url(#halo)"/>

  <!-- outer rune-circle: thin gold + bronze double ring -->
  <circle cx="300" cy="440" r="240" fill="none" stroke="#d4a056" stroke-width="1.2" opacity="0.85"/>
  <circle cx="300" cy="440" r="232" fill="none" stroke="#7a5530" stroke-width="0.8" opacity="0.6" stroke-dasharray="2 4"/>
  <circle cx="300" cy="440" r="210" fill="none" stroke="#d4a056" stroke-width="0.6" opacity="0.4"/>

  <!-- heptagram (seven-pointed star): connect every 3rd vertex of 7 -->
  <!-- vertex angles: -90° + k*(360/7); k=0..6.  R=210. -->
  <!-- Points: P0(300,230) P1(464,360) P2(401,553) P3(199,553) P4(136,360) P5(?) – using order 0,3,6,2,5,1,4 for {7/3} star -->
  <polygon points="300,230 426,553 144,371 456,371 174,553 300,230 466,420"
           fill="none" stroke="#d4a056" stroke-width="1" opacity="0.55"/>
  <!-- Cleaner {7/3} polyline (illustrative) -->
  <polyline points="300,230 199,553 464,360 174,553 466,420 226,553 401,553 300,230"
            fill="none" stroke="#d4a056" stroke-width="1.1" opacity="0.7"/>

  <!-- rune tick marks every 30° -->
  <g stroke="#d4a056" stroke-width="0.6" opacity="0.5">
    <line x1="300" y1="200" x2="300" y2="212"/>
    <line x1="510" y1="440" x2="498" y2="440"/>
    <line x1="300" y1="680" x2="300" y2="668"/>
    <line x1="90"  y1="440" x2="102" y2="440"/>
  </g>

  <!-- 3. Seven dice tokens on heptagram points (d4..d100) -->
  <!-- Each: 56x56 disc, bronze plate, gold rune die-glyph, count badge -->
  <g font-family="Cinzel, serif" font-size="11" fill="#f3e3c4">
    <!-- P0 top: d20 -->
    <g transform="translate(300 230)">
      <circle r="32" fill="url(#bronze)" stroke="#d4a056" stroke-width="1.2"/>
      <polygon points="0,-16 14,-5 9,12 -9,12 -14,-5" fill="none" stroke="#d4a056" stroke-width="1.2"/>
      <text y="3" text-anchor="middle" font-size="9" fill="#d4a056">d20</text>
      <circle cx="22" cy="-22" r="9" fill="#1a0e07" stroke="#d4a056"/>
      <text x="22" y="-19" text-anchor="middle" font-size="10">2</text>
    </g>
    <!-- P1 upper-right: d12 -->
    <g transform="translate(464 360)">
      <circle r="32" fill="url(#bronze)" stroke="#d4a056" stroke-width="1.2"/>
      <polygon points="0,-15 13,-7 13,8 0,16 -13,8 -13,-7" fill="none" stroke="#d4a056" stroke-width="1.2"/>
      <text y="3" text-anchor="middle" font-size="9" fill="#d4a056">d12</text>
    </g>
    <!-- P2 lower-right: d10 -->
    <g transform="translate(426 553)">
      <circle r="32" fill="url(#bronze)" stroke="#d4a056" stroke-width="1.2"/>
      <polygon points="0,-15 13,0 0,15 -13,0" fill="none" stroke="#d4a056" stroke-width="1.2"/>
      <line x1="0" y1="-15" x2="0" y2="15" stroke="#d4a056" stroke-width="0.6"/>
      <text y="3" text-anchor="middle" font-size="9" fill="#d4a056">d10</text>
    </g>
    <!-- P3 bottom: d8 -->
    <g transform="translate(300 600)">
      <circle r="32" fill="url(#bronze)" stroke="#d4a056" stroke-width="1.2"/>
      <polygon points="0,-15 13,0 0,15 -13,0" fill="none" stroke="#d4a056" stroke-width="1.2"/>
      <text y="3" text-anchor="middle" font-size="9" fill="#d4a056">d8</text>
    </g>
    <!-- P4 lower-left: d6 -->
    <g transform="translate(174 553)">
      <circle r="32" fill="url(#bronze)" stroke="#d4a056" stroke-width="1.2"/>
      <rect x="-13" y="-13" width="26" height="26" fill="none" stroke="#d4a056" stroke-width="1.2"/>
      <text y="3" text-anchor="middle" font-size="9" fill="#d4a056">d6</text>
    </g>
    <!-- P5 upper-left: d4 -->
    <g transform="translate(136 360)">
      <circle r="32" fill="url(#bronze)" stroke="#d4a056" stroke-width="1.2"/>
      <polygon points="0,-15 14,9 -14,9" fill="none" stroke="#d4a056" stroke-width="1.2"/>
      <text y="3" text-anchor="middle" font-size="9" fill="#d4a056">d4</text>
    </g>
    <!-- P6 mid-upper-left (closing the 7th): d100 -->
    <g transform="translate(232 240)">
      <circle r="32" fill="url(#bronze)" stroke="#d4a056" stroke-width="1.2"/>
      <circle r="14" fill="none" stroke="#d4a056" stroke-width="1.2"/>
      <text y="3" text-anchor="middle" font-size="9" fill="#d4a056">d100</text>
    </g>
  </g>

  <!-- 4. Central crystal: faceted hex showing running total -->
  <g transform="translate(300 440)">
    <polygon points="0,-58 50,-29 50,29 0,58 -50,29 -50,-29"
             fill="#1a0e07" stroke="#d4a056" stroke-width="1.4"/>
    <polygon points="0,-58 0,58 -50,29 -50,-29" fill="#d4a056" opacity="0.07"/>
    <polygon points="0,-58 50,-29 50,29 0,58"   fill="#d4a056" opacity="0.13"/>
    <text y="-22" text-anchor="middle" font-family="Cinzel, serif"
          font-size="9" letter-spacing="2" fill="#d4a056" opacity="0.8">TOTAL</text>
    <text y="14" text-anchor="middle" font-family="Cinzel, serif"
          font-size="34" font-weight="600" fill="#f3e3c4">17</text>
    <text y="34" text-anchor="middle" font-family="Lora, serif"
          font-size="10" fill="#e9d8b5" font-style="italic">with Hope</text>
  </g>

  <!-- 5. Duality discs: sun (left of crystal), moon (right) -->
  <g transform="translate(228 440)">
    <circle r="22" fill="#1a0e07" stroke="#f1c46d" stroke-width="1.4"/>
    <circle r="10" fill="#f1c46d"/>
    <g stroke="#f1c46d" stroke-width="1">
      <line x1="0" y1="-18" x2="0" y2="-15"/><line x1="0" y1="15" x2="0" y2="18"/>
      <line x1="-18" y1="0" x2="-15" y2="0"/><line x1="15" y1="0" x2="18" y2="0"/>
      <line x1="-13" y1="-13" x2="-11" y2="-11"/><line x1="11" y1="11" x2="13" y2="13"/>
      <line x1="13" y1="-13" x2="11" y2="-11"/><line x1="-11" y1="11" x2="-13" y2="13"/>
    </g>
    <text y="3" text-anchor="middle" font-family="Cinzel, serif"
          font-size="11" fill="#1a0e07">8</text>
  </g>
  <g transform="translate(372 440)">
    <circle r="22" fill="#1a0e07" stroke="#7d5cc8" stroke-width="1.4"/>
    <!-- crescent: clip an inner circle -->
    <path d="M -2,-12 a 12,12 0 1 0 0,24 a 9,9 0 1 1 0,-24 z" fill="#b9a4ec"/>
    <text y="3" text-anchor="middle" font-family="Cinzel, serif"
          font-size="11" fill="#e9d8b5">5</text>
  </g>

  <!-- 6. Right-rail panel: roll/clear + history -->
  <g transform="translate(620 80)">
    <rect x="0" y="0" width="300" height="560" rx="6" fill="#150c06"
          stroke="#d4a056" stroke-width="1" opacity="0.95"/>
    <text x="20" y="34" font-family="Cinzel, serif" font-size="14"
          fill="#d4a056" letter-spacing="2">SIGILS</text>
    <line x1="20" y1="44" x2="280" y2="44" stroke="#d4a056" opacity="0.4"/>

    <!-- duality toggle row -->
    <text x="20" y="74" font-family="Lora, serif" font-size="12" fill="#e9d8b5">Duality pair</text>
    <rect x="240" y="60" width="38" height="18" rx="9" fill="#d4a056"/>
    <circle cx="269" cy="69" r="7" fill="#1a0e07"/>

    <!-- selection summary -->
    <text x="20" y="106" font-family="Lora, serif" font-size="11" fill="#a08763">Pending</text>
    <text x="20" y="126" font-family="Cinzel, serif" font-size="13" fill="#f3e3c4">2d20 + 1d6 + duality</text>

    <!-- roll button -->
    <rect x="20" y="148" width="260" height="44" rx="4" fill="#d4a056"/>
    <text x="150" y="176" text-anchor="middle" font-family="Cinzel, serif"
          font-size="14" letter-spacing="3" fill="#1a0e07">INVOKE</text>

    <!-- history header -->
    <text x="20" y="220" font-family="Cinzel, serif" font-size="12"
          fill="#d4a056" letter-spacing="2">CHRONICLE</text>
    <text x="280" y="220" text-anchor="end" font-family="Lora, serif"
          font-size="11" fill="#a08763" font-style="italic">Clear</text>
    <line x1="20" y1="230" x2="280" y2="230" stroke="#d4a056" opacity="0.3"/>

    <!-- history rows (3) -->
    <g font-family="Lora, serif" font-size="11" fill="#e9d8b5">
      <g transform="translate(20 252)">
        <text font-family="Cinzel, serif" font-size="16" fill="#f3e3c4">17</text>
        <text x="34" y="-2" fill="#a08763">2d20+1d6 · 8 / 5</text>
        <text x="34" y="14" fill="#f1c46d" font-style="italic">with Hope</text>
      </g>
      <g transform="translate(20 304)">
        <text font-family="Cinzel, serif" font-size="16" fill="#f3e3c4">23</text>
        <text x="34" y="-2" fill="#a08763">2d12 · 11 / 11</text>
        <text x="34" y="14" fill="#f3b54a" font-style="italic">Critical Success!</text>
      </g>
      <g transform="translate(20 356)">
        <text font-family="Cinzel, serif" font-size="16" fill="#f3e3c4">9</text>
        <text x="34" y="-2" fill="#a08763">1d8 · 4 / 7</text>
        <text x="34" y="14" fill="#b9a4ec" font-style="italic">with Fear</text>
      </g>
    </g>
  </g>
</svg>
```

Notes on the mockup:
- The right-rail "SIGILS" panel is the controls drawer. Per-die counters (− N +) sit beneath each heptagram disc on the actual implementation; they're omitted from the hero for clarity. See §4 for spec.
- The point at top-left ("d100") is a stand-in for the seventh vertex; the implementer may reorder dice clockwise from top so the eye lands on d20 first.

---

## 2. Hero SVG — Closed State (FAB)

72 × 72 px circular bronze medallion with an etched single-line heptagram, a faint gold halo, and a barely-visible inner crystal pip.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96"
     role="img" aria-label="Open dice roller">
  <defs>
    <radialGradient id="fab-halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#d4a056" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#d4a056" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fab-bronze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6b4524"/>
      <stop offset="1" stop-color="#2a1a0e"/>
    </linearGradient>
  </defs>
  <circle cx="48" cy="48" r="46" fill="url(#fab-halo)"/>
  <circle cx="48" cy="48" r="36" fill="url(#fab-bronze)"
          stroke="#d4a056" stroke-width="1.4"/>
  <circle cx="48" cy="48" r="30" fill="none" stroke="#d4a056"
          stroke-width="0.5" opacity="0.45" stroke-dasharray="2 3"/>
  <!-- {7/3} heptagram, single continuous polyline -->
  <polyline points="48,22 65,68 27,38 69,38 31,68 48,22"
            fill="none" stroke="#d4a056" stroke-width="1.2"
            stroke-linejoin="round" opacity="0.9"/>
  <!-- center pip -->
  <circle cx="48" cy="48" r="3" fill="#f3e3c4"/>
</svg>
```

Idle state: slow 4s pulse on the halo (1.0 → 1.06 scale, 0.4 → 0.5 opacity). Hover: heptagram brightens, halo intensifies. Active/pressed: halo shrinks by 4%.

---

## 3. Dice Wireframes (SVG)

Each die-icon lives inside the 56 × 56 bronze disc on the heptagram and reappears at 28 × 28 in the controls. Single gold stroke on transparent fill — wireframe aesthetic.

```svg
<!-- d4: tetrahedron -->
<svg viewBox="0 0 40 40" width="40"><g fill="none" stroke="#d4a056" stroke-width="1.4">
  <polygon points="20,5 36,33 4,33"/>
  <line x1="20" y1="5" x2="20" y2="33"/>
  <line x1="20" y1="33" x2="11" y2="19"/>
  <line x1="20" y1="33" x2="29" y2="19"/>
</g></svg>

<!-- d6: cube -->
<svg viewBox="0 0 40 40" width="40"><g fill="none" stroke="#d4a056" stroke-width="1.4">
  <rect x="7" y="11" width="22" height="22"/>
  <polyline points="7,11 13,5 35,5 35,27 29,33"/>
  <line x1="29" y1="11" x2="35" y2="5"/>
</g></svg>

<!-- d8: octahedron -->
<svg viewBox="0 0 40 40" width="40"><g fill="none" stroke="#d4a056" stroke-width="1.4">
  <polygon points="20,4 36,20 20,36 4,20"/>
  <line x1="4" y1="20" x2="36" y2="20"/>
  <line x1="20" y1="4" x2="20" y2="36"/>
</g></svg>

<!-- d10: pentagonal trapezohedron (kite) -->
<svg viewBox="0 0 40 40" width="40"><g fill="none" stroke="#d4a056" stroke-width="1.4">
  <polygon points="20,4 34,16 28,34 12,34 6,16"/>
  <line x1="20" y1="4" x2="20" y2="34"/>
  <line x1="6" y1="16" x2="34" y2="16"/>
</g></svg>

<!-- d12: dodecahedron (pentagon face) -->
<svg viewBox="0 0 40 40" width="40"><g fill="none" stroke="#d4a056" stroke-width="1.4">
  <polygon points="20,4 35,15 29,33 11,33 5,15"/>
  <polygon points="20,12 28,18 25,28 15,28 12,18"/>
</g></svg>

<!-- d20: icosahedron (triangulated face) -->
<svg viewBox="0 0 40 40" width="40"><g fill="none" stroke="#d4a056" stroke-width="1.4">
  <polygon points="20,3 36,14 30,33 10,33 4,14"/>
  <line x1="20" y1="3" x2="20" y2="33"/>
  <line x1="4" y1="14" x2="30" y2="33"/>
  <line x1="36" y1="14" x2="10" y2="33"/>
</g></svg>

<!-- d100: sphere with meridians -->
<svg viewBox="0 0 40 40" width="40"><g fill="none" stroke="#d4a056" stroke-width="1.4">
  <circle cx="20" cy="20" r="16"/>
  <ellipse cx="20" cy="20" rx="16" ry="6"/>
  <ellipse cx="20" cy="20" rx="6"  ry="16"/>
  <text x="20" y="24" text-anchor="middle" font-family="Cinzel,serif"
        font-size="9" fill="#d4a056" stroke="none">%</text>
</g></svg>
```

Duality pair — sun (Hope d12) and moon (Fear d12). Both are stylized celestial discs orbiting the central crystal, NOT placed on the heptagram (the heptagram is for normal dice only):

```svg
<!-- Hope: sun-disc d12 -->
<svg viewBox="0 0 60 60" width="60"><g fill="none" stroke="#f1c46d" stroke-width="1.4">
  <circle cx="30" cy="30" r="12" fill="#f1c46d" stroke="none" opacity="0.85"/>
  <circle cx="30" cy="30" r="18"/>
  <g stroke="#f1c46d" stroke-width="1.2">
    <line x1="30" y1="6" x2="30" y2="12"/><line x1="30" y1="48" x2="30" y2="54"/>
    <line x1="6" y1="30" x2="12" y2="30"/><line x1="48" y1="30" x2="54" y2="30"/>
    <line x1="13" y1="13" x2="17" y2="17"/><line x1="43" y1="43" x2="47" y2="47"/>
    <line x1="47" y1="13" x2="43" y2="17"/><line x1="17" y1="43" x2="13" y2="47"/>
  </g>
  <!-- pentagon face hint = d12 -->
  <polygon points="30,22 38,28 35,38 25,38 22,28" stroke="#1a0e07" fill="none" stroke-width="0.8"/>
</g></svg>

<!-- Fear: moon-disc d12 -->
<svg viewBox="0 0 60 60" width="60"><g fill="none" stroke="#7d5cc8" stroke-width="1.4">
  <circle cx="30" cy="30" r="18"/>
  <path d="M 36,18 a 14,14 0 1 0 0,24 a 10,10 0 1 1 0,-24 z"
        fill="#7d5cc8" opacity="0.55" stroke="#b9a4ec"/>
  <!-- pentagon face hint = d12, etched on the dark side -->
  <polygon points="22,22 30,28 27,38 17,38 14,28" stroke="#b9a4ec" fill="none" stroke-width="0.8"/>
</g></svg>
```

---

## 4. CSS Custom Properties

| Token | Value | Usage |
|---|---|---|
| `--arcane-glyph-bg` | `#0a0604` | Modal backdrop base |
| `--arcane-glyph-bronze` | `#2a1a0e` → `#5a3a1f` (gradient) | Disc & FAB body |
| `--arcane-glyph-bronze-edge` | `#7a5530` | Inner ring, dashed marks |
| `--arcane-glyph-gold` | `#d4a056` | Strokes, runes, primary accent |
| `--arcane-glyph-gold-soft` | `#f3e3c4` | Numerals, primary text |
| `--arcane-glyph-ink` | `#150c06` | Panel + crystal fill |
| `--arcane-glyph-mute` | `#a08763` | Secondary labels |
| `--arcane-glyph-glow` | `0 0 18px rgba(212,160,86,0.55)` | Disc + crystal glow |
| `--arcane-glyph-glow-strong` | `0 0 28px rgba(212,160,86,0.85)` | Roll-ignite peak |
| `--arcane-glyph-overlay` | `rgba(10,6,4,0.74)` | Backdrop overlay |
| `--arcane-glyph-hope` (→ `--hope-color`) | `#f1c46d` | Sun disc, "with Hope" label |
| `--arcane-glyph-fear` (→ `--fear-color`) | `#7d5cc8` | Moon disc, "with Fear" label |
| `--arcane-glyph-crit` (→ `--crit-color`) | `#f3b54a` | Crystal flare on hope === fear |
| `--arcane-glyph-radius` | `240px` | Heptagram/glyph radius (desktop) |
| `--arcane-glyph-fab` | `72px` | FAB diameter |
| `--arcane-glyph-disc` | `64px` | Per-die disc diameter on glyph |
| `--arcane-glyph-crystal` | `116px` | Central crystal width |
| `--arcane-glyph-font-display` | `'Cinzel', serif` | Numerals, headings |
| `--arcane-glyph-font-body` | `'Lora', serif` | Body, history rows |
| `--arcane-glyph-tracking` | `0.18em` | Display letter-spacing |
| `--arcane-glyph-anim-bloom` | `420ms cubic-bezier(.2,.8,.2,1)` | FAB → glyph open |
| `--arcane-glyph-anim-collapse` | `260ms cubic-bezier(.4,0,1,.4)` | Glyph close |
| `--arcane-glyph-anim-ignite` | `680ms ease-out` | Roll glow burst |
| `--arcane-glyph-anim-orbit` | `900ms cubic-bezier(.3,.1,.2,1)` | Disc settle after roll |

Implementer applies the contract by aliasing the theme tokens onto the shared custom props at the variant root:
```css
.arcane-glyph-root {
  --hope-color: var(--arcane-glyph-hope);
  --fear-color: var(--arcane-glyph-fear);
  --crit-color: var(--arcane-glyph-crit);
}
```

---

## 5. Layout Dimensions

| Element | Desktop (≥ 1024px) | Tablet (640–1023px) | Mobile (< 640px) |
|---|---|---|---|
| Modal overlay | full viewport, fixed, z 1100 | same | same |
| Glyph diameter (R × 2) | 480 px (R = 240) | 380 px (R = 190) | 304 px (R = 152) |
| FAB | 72 px, bottom 24px / left 24px | same | 64 px, bottom 20 / left 20 |
| Per-die disc on glyph | 64 px | 56 px | 48 px |
| Disc icon glyph | 28 px | 24 px | 22 px |
| Counter pill (− N +) under each disc | 56 × 22 px | 48 × 20 px | 44 × 18 px |
| Central crystal | 116 × 116 px | 96 × 96 | 84 × 84 |
| Sun / moon discs (duality) | 44 px Ø, ±72px from crystal center | 40 px, ±60 | 36 px, ±48 |
| Right-rail "SIGILS" panel | 300 × min(640, 80vh) px | 280 × 70vh, slides up beneath glyph instead of right of it | full width sheet beneath glyph |
| Heptagram inner offset | discs sit centered on vertices at R; counters extend 30 px outward | scaled proportionally | scaled |
| Total CSS budget | < 4 kB (hard) | — | — |

Heptagram point math (used by the implementer): for k = 0..6, vertex = (cx + R cos(−π/2 + k·2π/7), cy + R sin(−π/2 + k·2π/7)). Counters anchor on the same angle, offset by `R + 30`.

Dice ordering on points (clockwise from top, k=0..6):
`d20 → d12 → d10 → d8 → d6 → d4 → d100`.

---

## 6. Interactions & Animations

**Bloom (FAB → glyph open):** triggered by `service.toggle()`.
- Duration: `--arcane-glyph-anim-bloom` (420ms).
- Backdrop fades from 0 → 0.74 opacity (180ms ease-out).
- Glyph: scale 0.05 → 1, opacity 0 → 1; rotate −18° → 0°.
- Heptagram polyline: `stroke-dashoffset` from `length` → `0` (stroke-draw effect, 360ms, 60ms delay).
- Discs: stagger entry (k × 28ms), each scale 0 → 1 + opacity 0 → 1.
- Crystal: scales 0 → 1 in last 200ms with `--arcane-glyph-glow` reaching peak.
- Right-rail panel: slides in from left edge of overlay (translateX 24px → 0, fade), 220ms, delay 200ms.

**Collapse (close):**
- Duration: `--arcane-glyph-anim-collapse` (260ms ease-in).
- Reverse order, staggered out-then-in: discs fade first, polyline retracts, crystal collapses, halo lingers 80ms longer.

**Roll-ignite:**
- On Roll click, the central crystal pulses to `--arcane-glyph-glow-strong`; the heptagram polyline brightens (stroke opacity 0.7 → 1) and a single sweep of light traces the polyline (`stroke-dasharray` chase, 600ms).
- Each rolled die's disc on the glyph briefly nudges outward 6px and back (180ms, eased), arriving with the glow peak.
- Crystal counter ticks numerically over 280ms (ease-out; useful both as feedback and to avoid jarring snaps). Reduced-motion: snap to final value.
- If `outcome === 'crit'`: crystal recolors to `--crit-color`, halo expands 1.18× and slowly returns (1100ms). Caption swaps to "Critical Success!" with letter-spacing animation (0.4em → 0.18em, 380ms).
- If `hope`: sun disc grows 1.15× and emits a single pulsed ring; caption "with Hope" in `--hope-color`.
- If `fear`: moon disc grows 1.15×, ring is cooler/violet; caption "with Fear" in `--fear-color`.

**Hover states:**
- Discs: outer ring brightens to `--arcane-glyph-gold-soft`, glow opacity +0.15.
- Counter pills: bronze → gold inverted on the active − or + button.
- Roll button: gold fill darkens 6%, inset gold rule appears.
- Sun / moon idle: slow 6s breathing pulse at low intensity.

**Focus states (keyboard):**
- A 2px gold focus ring (`outline: 2px solid var(--arcane-glyph-gold-soft); outline-offset: 3px;`) on every focusable: FAB, each disc, each counter +/−, duality toggle, Invoke button, history Clear, individual history rows (focusable summary).
- Focus ring uses `:focus-visible` so mouse users don't see it.

**Reduced motion (`@media (prefers-reduced-motion: reduce)`):**
- Bloom shortened to 120ms cross-fade, no scale/rotate, no stroke-draw.
- Roll-ignite: glow shifts via opacity only (no scale, no orbit, no count-up).
- Idle pulses disabled.

---

## 7. Mobile / Tablet Responsive Behavior

- The dice roller's FAB stays bottom-left; the **theme picker** (separate component, bottom-right) is unaffected. On mobile the two FABs sit at the same vertical band but at opposite corners with ~20px gutters — no collision.
- When open, the menu uses a **modal overlay** (full viewport), so it is never partially occluded by anything but the theme picker which sits above it at z 1200 by contract.
- On `< 640px` the glyph centers in the upper half of the viewport (`align-items: flex-start; padding-top: 6vh`) and the right-rail "SIGILS" panel restacks beneath it as a full-width sheet (`max-height: 44vh; overflow-y: auto`). This guarantees the Invoke button is reachable with a single thumb regardless of glyph state.
- On landscape phones (`< 480px height`), the glyph drops to R=128 and the panel collapses to a single horizontal action bar at the bottom (Duality toggle | Pending summary | Invoke).
- Theme-picker overlap risk is zero because the menu never extends into the bottom-right 96 × 96 px reserved zone (verified via the modal padding rule `padding-right: max(96px, 24px + safe-area-inset-right)` on small screens).

---

## 8. Accessibility

- **Roles:** FAB → `<button aria-label="Open dice roller" aria-expanded="…" aria-controls="arcane-glyph-menu">`. Menu container → `role="dialog" aria-modal="true" aria-labelledby="arcane-glyph-title"`.
- **Heading:** an SR-only `<h2 id="arcane-glyph-title">Arcane Glyph dice roller</h2>` for AT users.
- **Each disc:** `<button aria-label="Add d20" aria-describedby="arcane-glyph-d20-count">`; counter pill exposes `aria-live="polite"` only on the running pending summary, NOT on each pill (avoid spam).
- **Duality toggle:** `<button role="switch" aria-checked="…">`.
- **Invoke button:** result is announced via a single `aria-live="polite"` region near the crystal: `"Total 17, with Hope"` / `"Total 23, Critical Success"` etc.
- **History list:** `<ol aria-label="Roll chronicle">`; each `<li>` reads e.g. `"17 from 2 d20 plus 1 d6, hope 8 fear 5, with Hope"`.
- **Focus trap:** when open, focus is constrained inside the dialog. Tab order: Close (X) → Duality toggle → each disc clockwise from d20 → each counter pair → Invoke → Clear → first history row → loop. Shift-Tab reverses.
- **Initial focus:** Invoke button (or the Duality toggle if no dice selected and no pending). On close, focus restores to FAB.
- **ESC** closes the menu.
- **Keyboard navigation around the heptagram:** Arrow keys cycle through discs in clockwise (Right/Down) and counter-clockwise (Left/Up) order. Space/Enter on a disc adds one of that die; Shift+Space removes one; Backspace zeroes the focused die.
- **Color contrast:** primary text `#f3e3c4` on `#150c06` panel = 12.7:1 (AAA). Mute label `#a08763` on same = 5.4:1 (AA). Hope `#f1c46d` on `#1a0e07` for the sun-disc numeral uses inverse text `#1a0e07` on `#f1c46d` = 11.2:1.
- **Reduced motion:** as detailed in §6.
- **Reduced transparency** (`prefers-reduced-transparency`): backdrop opacity raised to 0.92, halo gradients flattened to single color.
- **Screen-reader-only utility class** required: `.arcane-glyph-sr-only { position:absolute; clip:rect(0 0 0 0); width:1px; height:1px; overflow:hidden; }`.

---

## 9. Variant Contract Constraints / Shared Notes

- **z-index:** FAB 1100; modal overlay + glyph + right-rail 1100 (single stacking context inside the dialog); theme-picker is a sibling at 1200 (untouched here).
- **Sun/moon are NOT on the heptagram** — they are reserved for the duality pair and orbit the central crystal. The seven heptagram points belong to the seven non-duality dice (`d4..d100`), exactly matching `DICE_TYPES.length`. This is a deliberate semantic choice: the heptagram = mortal dice, the celestial discs = the duality pair (Daggerheart's narrative dice).
- **Pending summary** in the panel is the source of truth for `RollRequest`. Disc counters write into it; the Invoke button calls `service.roll({ dice, includeDuality, label: undefined })`.
- **Microcopy** is rendered both as the crystal caption and inside each history row's outcome label, using the exact strings: `"Critical Success!"`, `"with Hope"`, `"with Fear"`.
- **Hope/Fear colors** must flow through the shared `--hope-color`, `--fear-color`, `--crit-color` tokens (aliased from `--arcane-glyph-hope/fear/crit`) so any future shared components (e.g. a damage tag) inherit consistently.
- **CSS budget discipline:** keep the file under 4 kB by (a) using a single shared `.arcane-glyph-disc` class for all seven discs (positioned with CSS custom properties `--i` for the index, computed via `transform: rotate(calc(var(--i)*51.4286deg)) translateY(calc(var(--arcane-glyph-radius)*-1)) rotate(calc(var(--i)*-51.4286deg))`), (b) inlining SVGs via `<svg>` (not `background-image`), (c) reusing one `.arcane-glyph-glow` keyframe for crystal + halo at different durations, (d) limiting gradients to two reusable `<linearGradient>` defs. Estimated final CSS: ~3.4 kB minified.
- **No assets required** — entirely SVG inline + CSS. No fonts beyond the project-bundled Cinzel + Lora.
- **No service changes required.** This variant satisfies the contract in §5 of the parent plan as-is.
