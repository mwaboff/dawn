# Variant Spec — Brutalist Blueprint

> **Bold departure #2.** Technical drawing on grid paper. Near-black sheet, white hairlines, monospaced callouts. The sheet does not "decorate" — every mark could appear on a mechanical engineer's drafting board. Restraint is the entire premise.

---

## 1. Aesthetic Brief

| Aspect | Decision |
|---|---|
| Surface | Near-black "blueprint paper" with a fine 8px square grid |
| Stroke | 1px white hairlines (the entire interface is line art) |
| Typography | Monospaced, ALL-CAPS for headings, lowercase for callout labels |
| Voice | Technical drawing notation — `Ø 20MM`, `// HOPE`, `[ CRITICAL ]`, `REV. A` |
| Mood | Cold, precise, slightly austere. The fun is in the rigor. |
| Decoration | Title block, sheet number, revision stamp, tolerance band — all functional. Nothing else. |

The departure is total: zero warm-tavern colors, zero gold leaf, zero rounded corners, zero shadows beyond a single sheet drop. The theme picker (which lives in warm-tavern style at all times) sits next to this variant by design — the contrast is the joke.

---

## 2. CSS Custom Properties

```css
/* Surface & ink */
--brutalist-blueprint-bg:        #0d1117;            /* sheet paper */
--brutalist-blueprint-grid:      rgba(255,255,255,0.06); /* 8px grid lines */
--brutalist-blueprint-grid-bold: rgba(255,255,255,0.12); /* every 80px */
--brutalist-blueprint-line:      #f4f4ee;            /* primary hairline */
--brutalist-blueprint-line-dim:  rgba(244,244,238,0.55); /* secondary */
--brutalist-blueprint-line-faint:rgba(244,244,238,0.25); /* tertiary / construction */
--brutalist-blueprint-fill:      rgba(244,244,238,0.04); /* die face fill */

/* Functional accents (semantic, not decorative) */
--brutalist-blueprint-hope:      #f4c542;            /* caution amber */
--brutalist-blueprint-fear:      #e0533d;            /* warning red */
--brutalist-blueprint-crit:      #6ad8a6;            /* drafting jade */
--brutalist-blueprint-stamp:     #c8392b;            /* desaturated stamp ink */

/* Variant contract bridge */
--hope-color: var(--brutalist-blueprint-hope);
--fear-color: var(--brutalist-blueprint-fear);
--crit-color: var(--brutalist-blueprint-crit);

/* Strokes */
--bp-hair:        1px;        /* default hairline */
--bp-emph:        2px;        /* emphasis (selected die, focus ring) */
--bp-dash-short:  4 4;        /* construction lines */
--bp-dash-long:   10 4;       /* duality leader lines */

/* Typography */
--bp-font: ui-monospace, "SF Mono", "JetBrains Mono", "IBM Plex Mono",
           Menlo, Consolas, "Liberation Mono", monospace;
--bp-fs-micro: 9px;     /* dimensions, callouts */
--bp-fs-meta:  10px;    /* sheet metadata */
--bp-fs-body:  11px;    /* button labels, history */
--bp-fs-head:  12px;    /* section heads, ALL CAPS */
--bp-fs-total: 28px;    /* the result number */
--bp-tracking-head: 0.18em;
--bp-tracking-body: 0.04em;

/* Layout */
--bp-sheet-w-desktop: 420px;
--bp-sheet-h-desktop: 560px;
--bp-sheet-w-tablet:  380px;
--bp-fab-size:        56px;
--bp-history-row-h:   28px;
--bp-margin:          16px;   /* sheet inner margin */
--bp-titleblock-h:    44px;
```

**Single grid background** (must fit in one declaration to honour the CSS budget):

```css
background:
  repeating-linear-gradient(
    0deg,
    var(--brutalist-blueprint-grid) 0 1px, transparent 1px 8px,
    var(--brutalist-blueprint-grid) 8px 9px, transparent 9px 16px,
    var(--brutalist-blueprint-grid) 16px 17px, transparent 17px 24px,
    var(--brutalist-blueprint-grid) 24px 25px, transparent 25px 32px,
    var(--brutalist-blueprint-grid) 32px 33px, transparent 33px 40px,
    var(--brutalist-blueprint-grid) 40px 41px, transparent 41px 48px,
    var(--brutalist-blueprint-grid) 48px 49px, transparent 49px 56px,
    var(--brutalist-blueprint-grid) 56px 57px, transparent 57px 64px,
    var(--brutalist-blueprint-grid) 64px 65px, transparent 65px 72px,
    var(--brutalist-blueprint-grid-bold) 72px 73px, transparent 73px 80px
  ),
  repeating-linear-gradient(
    90deg,
    var(--brutalist-blueprint-grid) 0 1px, transparent 1px 8px,
    var(--brutalist-blueprint-grid) 8px 9px, transparent 9px 16px,
    var(--brutalist-blueprint-grid) 16px 17px, transparent 17px 24px,
    var(--brutalist-blueprint-grid) 24px 25px, transparent 25px 32px,
    var(--brutalist-blueprint-grid) 32px 33px, transparent 33px 40px,
    var(--brutalist-blueprint-grid) 40px 41px, transparent 41px 48px,
    var(--brutalist-blueprint-grid) 48px 49px, transparent 49px 56px,
    var(--brutalist-blueprint-grid) 56px 57px, transparent 57px 64px,
    var(--brutalist-blueprint-grid) 64px 65px, transparent 65px 72px,
    var(--brutalist-blueprint-grid-bold) 72px 73px, transparent 73px 80px
  ),
  var(--brutalist-blueprint-bg);
```

If the implementer finds two stacked gradients still over budget, fall back to a single 8px gradient and drop the bold-every-80px detail — accept the compromise, do not invent decoration to compensate.

---

## 3. Hero Mockup — Open Sheet (Menu)

`viewBox="0 0 420 560"`. The sheet drops in from above the FAB.

```svg
<svg width="420" height="560" viewBox="0 0 420 560" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-labelledby="bp-sheet-title">
  <title id="bp-sheet-title">Brutalist Blueprint dice roller — open</title>

  <!-- Sheet paper: near-black with grid pattern -->
  <defs>
    <pattern id="bpGrid" width="8" height="8" patternUnits="userSpaceOnUse">
      <path d="M8 0H0V8" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    </pattern>
    <pattern id="bpGridBold" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M80 0H0V80" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="420" height="560" fill="#0d1117"/>
  <rect width="420" height="560" fill="url(#bpGrid)"/>
  <rect width="420" height="560" fill="url(#bpGridBold)"/>

  <!-- Sheet border (1px hairline, inset 16px) -->
  <rect x="16" y="16" width="388" height="528" fill="none"
        stroke="#f4f4ee" stroke-width="1"/>
  <!-- Inner margin line -->
  <rect x="24" y="24" width="372" height="512" fill="none"
        stroke="rgba(244,244,238,0.25)" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- TITLE BLOCK (top strip) -->
  <line x1="16" y1="60" x2="404" y2="60" stroke="#f4f4ee" stroke-width="1"/>
  <text x="28" y="40" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="12" letter-spacing="3.2">DICE ROLLER · SHEET 01</text>
  <text x="28" y="54" fill="rgba(244,244,238,0.55)" font-family="ui-monospace,monospace"
        font-size="9" letter-spacing="1">ASSY: PC-DH-001    REV. A    SCALE 1:1</text>
  <!-- Sheet number tab, top-right -->
  <rect x="346" y="24" width="50" height="28" fill="none" stroke="#f4f4ee" stroke-width="1"/>
  <text x="371" y="42" text-anchor="middle" fill="#f4f4ee"
        font-family="ui-monospace,monospace" font-size="11" letter-spacing="2">01/01</text>

  <!-- SECTION: SELECT DICE -->
  <text x="28" y="84" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="10" letter-spacing="2.2">§ 01  SELECT DICE</text>
  <line x1="28" y1="90" x2="396" y2="90" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>

  <!-- Dice picker row: 7 cells, each is a tiny axonometric icon + count stepper -->
  <!-- Each cell: 50w x 60h, inset gutters 2px, hairline border -->
  <g font-family="ui-monospace,monospace" font-size="9" fill="#f4f4ee" letter-spacing="0.5">
    <!-- d4 -->
    <rect x="28" y="98" width="50" height="60" fill="none" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>
    <text x="53" y="110" text-anchor="middle">d4</text>
    <polygon points="53,118 41,140 65,140" fill="none" stroke="#f4f4ee" stroke-width="1"/>
    <line x1="53" y1="118" x2="53" y2="140" stroke="rgba(244,244,238,0.25)" stroke-width="1" stroke-dasharray="2 2"/>
    <text x="53" y="153" text-anchor="middle" fill="rgba(244,244,238,0.55)">[ 0 ]</text>

    <!-- d6 (selected — emphasized 2px stroke) -->
    <rect x="80" y="98" width="50" height="60" fill="rgba(244,244,238,0.04)" stroke="#f4f4ee" stroke-width="2"/>
    <text x="105" y="110" text-anchor="middle">d6</text>
    <g stroke="#f4f4ee" stroke-width="1" fill="none">
      <polygon points="95,124 105,119 115,124 115,138 105,143 95,138"/>
      <line x1="95" y1="124" x2="105" y2="129"/>
      <line x1="115" y1="124" x2="105" y2="129"/>
      <line x1="105" y1="129" x2="105" y2="143"/>
    </g>
    <text x="105" y="153" text-anchor="middle">[ 2 ]</text>

    <!-- d8 -->
    <rect x="132" y="98" width="50" height="60" fill="none" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>
    <text x="157" y="110" text-anchor="middle">d8</text>
    <g stroke="#f4f4ee" stroke-width="1" fill="none">
      <polygon points="157,119 145,131 157,143 169,131"/>
      <line x1="145" y1="131" x2="169" y2="131" stroke-dasharray="2 2" stroke="rgba(244,244,238,0.25)"/>
    </g>
    <text x="157" y="153" text-anchor="middle" fill="rgba(244,244,238,0.55)">[ 0 ]</text>

    <!-- d10 -->
    <rect x="184" y="98" width="50" height="60" fill="none" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>
    <text x="209" y="110" text-anchor="middle">d10</text>
    <g stroke="#f4f4ee" stroke-width="1" fill="none">
      <polygon points="209,119 197,128 197,134 209,143 221,134 221,128"/>
      <line x1="197" y1="128" x2="221" y2="128"/>
    </g>
    <text x="209" y="153" text-anchor="middle" fill="rgba(244,244,238,0.55)">[ 0 ]</text>

    <!-- d12 -->
    <rect x="236" y="98" width="50" height="60" fill="none" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>
    <text x="261" y="110" text-anchor="middle">d12</text>
    <g stroke="#f4f4ee" stroke-width="1" fill="none">
      <polygon points="261,118 250,124 247,135 254,143 268,143 275,135 272,124"/>
      <polygon points="255,128 267,128 269,136 261,141 253,136"/>
    </g>
    <text x="261" y="153" text-anchor="middle" fill="rgba(244,244,238,0.55)">[ 0 ]</text>

    <!-- d20 (selected) -->
    <rect x="288" y="98" width="50" height="60" fill="rgba(244,244,238,0.04)" stroke="#f4f4ee" stroke-width="2"/>
    <text x="313" y="110" text-anchor="middle">d20</text>
    <g stroke="#f4f4ee" stroke-width="1" fill="none">
      <polygon points="313,118 301,126 301,138 313,143 325,138 325,126"/>
      <line x1="313" y1="118" x2="313" y2="143"/>
      <line x1="301" y1="126" x2="325" y2="138"/>
      <line x1="325" y1="126" x2="301" y2="138"/>
    </g>
    <text x="313" y="153" text-anchor="middle">[ 1 ]</text>

    <!-- d100 -->
    <rect x="340" y="98" width="50" height="60" fill="none" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>
    <text x="365" y="110" text-anchor="middle">d100</text>
    <g stroke="#f4f4ee" stroke-width="1" fill="none">
      <polygon points="365,118 354,124 354,137 365,143 376,137 376,124"/>
      <polygon points="365,124 358,128 358,135 365,139 372,135 372,128"/>
    </g>
    <text x="365" y="153" text-anchor="middle" fill="rgba(244,244,238,0.55)">[ 0 ]</text>
  </g>

  <!-- SECTION: DUALITY -->
  <text x="28" y="184" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="10" letter-spacing="2.2">§ 02  DUALITY PAIR  ☐ INCLUDE</text>
  <line x1="28" y1="190" x2="396" y2="190" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>

  <!-- duality pair: HOPE die LEFT, FEAR die RIGHT, leader lines -->
  <!-- HOPE -->
  <g stroke="#f4c542" stroke-width="1" fill="none">
    <polygon points="80,210 60,222 60,246 80,258 100,246 100,222"/>
    <line x1="80" y1="210" x2="80" y2="258"/>
    <line x1="60" y1="222" x2="100" y2="246"/>
    <line x1="100" y1="222" x2="60" y2="246"/>
  </g>
  <line x1="100" y1="216" x2="142" y2="204" stroke="#f4c542" stroke-width="1" stroke-dasharray="10 4"/>
  <text x="146" y="208" fill="#f4c542" font-family="ui-monospace,monospace"
        font-size="10" letter-spacing="2.5">// HOPE   d12</text>

  <!-- FEAR -->
  <g stroke="#e0533d" stroke-width="1" fill="none">
    <polygon points="320,210 300,222 300,246 320,258 340,246 340,222"/>
    <line x1="320" y1="210" x2="320" y2="258"/>
    <line x1="300" y1="222" x2="340" y2="246"/>
    <line x1="340" y1="222" x2="300" y2="246"/>
  </g>
  <line x1="300" y1="216" x2="258" y2="204" stroke="#e0533d" stroke-width="1" stroke-dasharray="10 4"/>
  <text x="254" y="208" text-anchor="end" fill="#e0533d" font-family="ui-monospace,monospace"
        font-size="10" letter-spacing="2.5">d12   FEAR //</text>

  <!-- ROLL button -->
  <rect x="28" y="280" width="368" height="40" fill="none" stroke="#f4f4ee" stroke-width="2"/>
  <text x="212" y="305" text-anchor="middle" fill="#f4f4ee"
        font-family="ui-monospace,monospace" font-size="13" letter-spacing="6">▶  EXECUTE ROLL</text>

  <!-- SECTION: RESULT (last roll) -->
  <text x="28" y="346" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="10" letter-spacing="2.2">§ 03  LAST RESULT  · TS 14:22:07</text>
  <line x1="28" y1="352" x2="396" y2="352" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>

  <text x="28" y="392" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="9" letter-spacing="1.5">Σ TOTAL</text>
  <text x="28" y="420" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="28" letter-spacing="2">23</text>
  <text x="120" y="392" fill="rgba(244,244,238,0.55)" font-family="ui-monospace,monospace" font-size="9" letter-spacing="1.5">DETAIL</text>
  <text x="120" y="408" fill="#f4f4ee" font-family="ui-monospace,monospace" font-size="11">2d6 = 4,3   d20 = 8</text>
  <text x="120" y="422" fill="#f4c542" font-family="ui-monospace,monospace" font-size="11">HOPE d12 = 7</text>
  <text x="120" y="436" fill="#e0533d" font-family="ui-monospace,monospace" font-size="11">FEAR d12 = 1</text>
  <!-- callout: with Hope -->
  <rect x="280" y="384" width="116" height="36" fill="none" stroke="#f4c542" stroke-width="1"/>
  <text x="338" y="408" text-anchor="middle" fill="#f4c542"
        font-family="ui-monospace,monospace" font-size="11" letter-spacing="2.5">// HOPE</text>

  <!-- SECTION: HISTORY (schedule table) -->
  <text x="28" y="464" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="10" letter-spacing="2.2">§ 04  ROLL SCHEDULE</text>
  <line x1="28" y1="470" x2="396" y2="470" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>
  <!-- column headers -->
  <text x="32" y="484" fill="rgba(244,244,238,0.55)" font-family="ui-monospace,monospace" font-size="9" letter-spacing="1">#</text>
  <text x="56" y="484" fill="rgba(244,244,238,0.55)" font-family="ui-monospace,monospace" font-size="9" letter-spacing="1">TIME</text>
  <text x="118" y="484" fill="rgba(244,244,238,0.55)" font-family="ui-monospace,monospace" font-size="9" letter-spacing="1">DICE</text>
  <text x="240" y="484" fill="rgba(244,244,238,0.55)" font-family="ui-monospace,monospace" font-size="9" letter-spacing="1">RESULT</text>
  <text x="320" y="484" fill="rgba(244,244,238,0.55)" font-family="ui-monospace,monospace" font-size="9" letter-spacing="1">FLAG</text>
  <line x1="28" y1="490" x2="396" y2="490" stroke="rgba(244,244,238,0.25)" stroke-width="1"/>
  <!-- rows (28px each) -->
  <g font-family="ui-monospace,monospace" font-size="10" fill="#f4f4ee" letter-spacing="0.4">
    <text x="32" y="506">04</text>
    <text x="56" y="506">14:22:07</text>
    <text x="118" y="506">2d6+d20+2d12</text>
    <text x="240" y="506">Σ 23</text>
    <text x="320" y="506" fill="#f4c542">// HOPE</text>
    <line x1="28" y1="512" x2="396" y2="512" stroke="rgba(244,244,238,0.12)" stroke-width="1"/>

    <text x="32" y="528">03</text>
    <text x="56" y="528">14:21:40</text>
    <text x="118" y="528">d20+2d12</text>
    <text x="240" y="528">Σ 31</text>
    <!-- stamp on crit row -->
    <g>
      <rect x="316" y="518" width="76" height="14" fill="none" stroke="#c8392b" stroke-width="1"/>
      <text x="354" y="528" text-anchor="middle" fill="#c8392b"
            font-family="ui-monospace,monospace" font-size="9" letter-spacing="1.5">[ CRITICAL ]</text>
    </g>
  </g>
</svg>
```

**Reading order** (top → bottom): Title block → §01 dice picker → §02 duality → execute → §03 last result → §04 schedule. Every section is a numbered drawing reference. The user reads it like a parts list.

---

## 4. Hero Mockup — FAB (Closed)

A 56px stamped block. Reads as a corner stamp / drawing-revision badge.

```svg
<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"
     role="button" aria-label="Open dice roller">
  <!-- Black panel with grid hint -->
  <rect width="56" height="56" fill="#0d1117"/>
  <g stroke="rgba(255,255,255,0.10)" stroke-width="1">
    <line x1="0" y1="14" x2="56" y2="14"/>
    <line x1="0" y1="28" x2="56" y2="28"/>
    <line x1="0" y1="42" x2="56" y2="42"/>
    <line x1="14" y1="0" x2="14" y2="56"/>
    <line x1="28" y1="0" x2="28" y2="56"/>
    <line x1="42" y1="0" x2="42" y2="56"/>
  </g>
  <!-- Hairline border -->
  <rect x="0.5" y="0.5" width="55" height="55" fill="none" stroke="#f4f4ee" stroke-width="1"/>
  <!-- Tiny axonometric d20 centered, with leader stub -->
  <g stroke="#f4f4ee" stroke-width="1" fill="none">
    <polygon points="28,14 16,21 16,35 28,42 40,35 40,21"/>
    <line x1="28" y1="14" x2="28" y2="42"/>
    <line x1="16" y1="21" x2="40" y2="35"/>
    <line x1="40" y1="21" x2="16" y2="35"/>
  </g>
  <!-- corner ID stamp -->
  <text x="4" y="52" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="7" letter-spacing="1">D20</text>
  <text x="52" y="10" text-anchor="end" fill="rgba(244,244,238,0.55)"
        font-family="ui-monospace,monospace" font-size="6" letter-spacing="0.8">REV.A</text>
</svg>
```

**Behavior:** square (no border-radius). On hover, the inner d20 stroke goes 1px → 2px and the corner stamp text brightens. On focus, a 2px white outline-offset:2px ring appears outside the square.

---

## 5. Axonometric Die Specifications

Each die appears in the dice picker as a small (24×24) axonometric line drawing. When a die is **selected** or shown in the result panel, an enlarged version (~96×96) carries dimension callouts.

All dice rendered with:
- 1px white hairlines for visible edges
- 1px dimmed (`--brutalist-blueprint-line-faint`) dashed lines for hidden edges (`stroke-dasharray: 2 2`)
- Dimension callouts using leader lines + arrow ticks + monospaced label

### 5.1 d4 — tetrahedron (axonometric, apex-up)

```svg
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#f4f4ee" stroke-width="1" fill="none">
    <!-- visible front edges -->
    <polygon points="60,28 30,92 90,92"/>
    <line x1="60" y1="28" x2="60" y2="92"/>
    <!-- hidden rear edge -->
    <line x1="30" y1="92" x2="90" y2="92"
          stroke="rgba(244,244,238,0.25)" stroke-dasharray="2 2"/>
  </g>
  <!-- Dimension: edge length, bottom -->
  <line x1="30" y1="104" x2="90" y2="104" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>
  <line x1="30" y1="100" x2="30" y2="108" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>
  <line x1="90" y1="100" x2="90" y2="108" stroke="rgba(244,244,238,0.55)" stroke-width="1"/>
  <text x="60" y="116" text-anchor="middle" fill="#f4f4ee"
        font-family="ui-monospace,monospace" font-size="9" letter-spacing="1">L = 22.0</text>
  <!-- Type tag, top-left -->
  <text x="6" y="14" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="9" letter-spacing="1.5">d4 / 4-FACE</text>
</svg>
```

### 5.2 d6 — cube (true axonometric, 30° projection)

```svg
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#f4f4ee" stroke-width="1" fill="none">
    <!-- visible faces -->
    <polygon points="36,40 60,28 84,40 84,84 60,96 36,84"/>
    <line x1="36" y1="40" x2="60" y2="52"/>
    <line x1="84" y1="40" x2="60" y2="52"/>
    <line x1="60" y1="52" x2="60" y2="96"/>
  </g>
  <!-- Diameter callout -->
  <line x1="36" y1="106" x2="84" y2="106" stroke="rgba(244,244,238,0.55)"/>
  <line x1="36" y1="102" x2="36" y2="110" stroke="rgba(244,244,238,0.55)"/>
  <line x1="84" y1="102" x2="84" y2="110" stroke="rgba(244,244,238,0.55)"/>
  <text x="60" y="118" text-anchor="middle" fill="#f4f4ee"
        font-family="ui-monospace,monospace" font-size="9" letter-spacing="1">Ø 16.0</text>
  <text x="6" y="14" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="9" letter-spacing="1.5">d6 / 6-FACE</text>
</svg>
```

### 5.3 d8 — octahedron (two-pyramid join)

```svg
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#f4f4ee" stroke-width="1" fill="none">
    <polygon points="60,20 30,60 60,100 90,60"/>
    <line x1="60" y1="20" x2="60" y2="100"/>
    <line x1="30" y1="60" x2="90" y2="60"
          stroke="rgba(244,244,238,0.55)"/>
  </g>
  <text x="60" y="116" text-anchor="middle" fill="#f4f4ee"
        font-family="ui-monospace,monospace" font-size="9" letter-spacing="1">H = 80.0</text>
  <text x="6" y="14" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="9" letter-spacing="1.5">d8 / 8-FACE</text>
</svg>
```

### 5.4 d10 — pentagonal trapezohedron

```svg
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#f4f4ee" stroke-width="1" fill="none">
    <polygon points="60,22 32,46 32,58 60,98 88,58 88,46"/>
    <line x1="32" y1="46" x2="88" y2="46"/>
    <line x1="60" y1="22" x2="32" y2="58"/>
    <line x1="60" y1="22" x2="88" y2="58"/>
    <line x1="60" y1="22" x2="60" y2="46" stroke-dasharray="2 2"
          stroke="rgba(244,244,238,0.25)"/>
  </g>
  <text x="60" y="116" text-anchor="middle" fill="#f4f4ee"
        font-family="ui-monospace,monospace" font-size="9" letter-spacing="1">Ø 18.0</text>
  <text x="6" y="14" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="9" letter-spacing="1.5">d10 / 10-FACE</text>
</svg>
```

### 5.5 d12 — dodecahedron (axonometric)

```svg
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#f4f4ee" stroke-width="1" fill="none">
    <polygon points="60,18 32,32 24,62 40,92 80,92 96,62 88,32"/>
    <polygon points="44,42 76,42 84,62 60,80 36,62"/>
    <line x1="44" y1="42" x2="32" y2="32"/>
    <line x1="76" y1="42" x2="88" y2="32"/>
    <line x1="36" y1="62" x2="24" y2="62"/>
    <line x1="84" y1="62" x2="96" y2="62"/>
    <line x1="60" y1="80" x2="60" y2="92"/>
  </g>
  <text x="60" y="116" text-anchor="middle" fill="#f4f4ee"
        font-family="ui-monospace,monospace" font-size="9" letter-spacing="1">Ø 19.0</text>
  <text x="6" y="14" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="9" letter-spacing="1.5">d12 / 12-FACE</text>
</svg>
```

### 5.6 d20 — icosahedron (axonometric, the canonical RPG die)

```svg
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#f4f4ee" stroke-width="1" fill="none">
    <!-- silhouette -->
    <polygon points="60,18 32,34 32,72 60,98 88,72 88,34"/>
    <!-- internal triangulation -->
    <line x1="60" y1="18" x2="60" y2="98"/>
    <line x1="32" y1="34" x2="88" y2="72"/>
    <line x1="88" y1="34" x2="32" y2="72"/>
    <line x1="32" y1="34" x2="60" y2="98"/>
    <line x1="88" y1="34" x2="60" y2="98"/>
    <line x1="60" y1="18" x2="32" y2="72"/>
    <line x1="60" y1="18" x2="88" y2="72"/>
  </g>
  <!-- diameter callout left side -->
  <line x1="20" y1="34" x2="20" y2="72" stroke="rgba(244,244,238,0.55)"/>
  <line x1="16" y1="34" x2="24" y2="34" stroke="rgba(244,244,238,0.55)"/>
  <line x1="16" y1="72" x2="24" y2="72" stroke="rgba(244,244,238,0.55)"/>
  <text x="14" y="56" text-anchor="end" fill="#f4f4ee"
        font-family="ui-monospace,monospace" font-size="9" letter-spacing="1"
        transform="rotate(-90 14 56)">Ø 20.0</text>
  <text x="6" y="14" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="9" letter-spacing="1.5">d20 / 20-FACE</text>
</svg>
```

### 5.7 d100 — twin nested pentagonal trapezohedra ("tens × ones")

```svg
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#f4f4ee" stroke-width="1" fill="none">
    <polygon points="60,18 28,42 28,58 60,102 92,58 92,42"/>
    <polygon points="60,34 42,46 42,54 60,80 78,54 78,46"/>
    <line x1="28" y1="42" x2="92" y2="42"/>
    <line x1="42" y1="46" x2="78" y2="46"/>
  </g>
  <text x="60" y="116" text-anchor="middle" fill="#f4f4ee"
        font-family="ui-monospace,monospace" font-size="9" letter-spacing="1">Ø 21.0  ×2</text>
  <text x="6" y="14" fill="#f4f4ee" font-family="ui-monospace,monospace"
        font-size="9" letter-spacing="1.5">d100 / 10×10</text>
</svg>
```

### 5.8 Duality Pair — HOPE d12 + FEAR d12 with labeled leader arrows

```svg
<svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg">
  <!-- HOPE die (left), amber strokes -->
  <g stroke="#f4c542" stroke-width="1" fill="none">
    <polygon points="60,30 32,44 24,74 40,104 80,104 96,74 88,44"/>
    <polygon points="44,54 76,54 84,74 60,92 36,74"/>
    <line x1="44" y1="54" x2="32" y2="44"/>
    <line x1="76" y1="54" x2="88" y2="44"/>
    <line x1="60" y1="92" x2="60" y2="104"/>
  </g>
  <!-- HOPE leader -->
  <line x1="96" y1="48" x2="138" y2="32" stroke="#f4c542" stroke-width="1" stroke-dasharray="10 4"/>
  <polygon points="138,32 132,30 134,36" fill="#f4c542"/>
  <text x="142" y="36" fill="#f4c542" font-family="ui-monospace,monospace"
        font-size="11" letter-spacing="2.5">// HOPE   d12</text>
  <text x="142" y="50" fill="rgba(244,197,66,0.6)" font-family="ui-monospace,monospace"
        font-size="9" letter-spacing="1">12-FACE / Ø 19.0</text>

  <!-- FEAR die (right), red strokes -->
  <g stroke="#e0533d" stroke-width="1" fill="none" transform="translate(140 0)">
    <polygon points="60,30 32,44 24,74 40,104 80,104 96,74 88,44"/>
    <polygon points="44,54 76,54 84,74 60,92 36,74"/>
    <line x1="44" y1="54" x2="32" y2="44"/>
    <line x1="76" y1="54" x2="88" y2="44"/>
    <line x1="60" y1="92" x2="60" y2="104"/>
  </g>
  <!-- FEAR leader -->
  <line x1="172" y1="48" x2="138" y2="118" stroke="#e0533d" stroke-width="1" stroke-dasharray="10 4"/>
  <polygon points="138,118 134,114 132,120" fill="#e0533d"/>
  <text x="134" y="128" text-anchor="end" fill="#e0533d" font-family="ui-monospace,monospace"
        font-size="11" letter-spacing="2.5">d12   FEAR //</text>
</svg>
```

**Crit treatment:** when `hope === fear`, both leader labels are joined by a horizontal hairline labeled `[ CRITICAL ]` in `--brutalist-blueprint-stamp` (red), with a 1px stamp box around it tilted 3° (slightly off-axis to read as a hand-applied stamp).

---

## 6. Layout & Dimensions

### Sheet (open menu)
| Token | Desktop | Tablet | Mobile |
|---|---|---|---|
| Width | 420px | 380px | calc(100vw - 32px), max 380px |
| Height | 560px | 560px | min(80vh, 640px), vertical scroll |
| Position | `position: fixed; bottom: 88px; left: 16px;` | same | bottom: 80px; left: 16px |
| Background | grid gradient (see §2) | same | same |
| Border | 1px hairline `--brutalist-blueprint-line` | same | same |
| Drop shadow | one only: `0 18px 40px rgba(0,0,0,0.6)` | same | same |
| Inner margin | 16px (the dashed inner rule sits at 24px) | same | 12px |

### Title block (top of sheet)
| Element | Value |
|---|---|
| Height | 44px |
| Bottom rule | 1px solid `--brutalist-blueprint-line` |
| Sheet-number tab | 50×28, top-right, 1px border |
| Text | `font-size: 12px; letter-spacing: 0.27em; text-transform: uppercase;` |

### Dice picker grid
- 7 cells in a single row at desktop (52px each, 8px gutters via flex `gap: 8px`).
- Tablet: same 7-up grid, cells shrink to 48px.
- Mobile: 4-column grid (52×60), wraps to 2 rows.
- Each cell: 1px hairline border; selected = 2px border + `rgba(244,244,238,0.04)` fill.
- Stepper is `[ N ]` text. `−` and `+` are 16×16 hairline squares to the side, revealed on hover/focus only (progressive disclosure).

### Duality block
- 2 dice side-by-side, leader lines pointing outward to labels.
- Toggle is a 14×14 hairline checkbox in the section heading: `☐ INCLUDE` → `☒ INCLUDE`.

### Execute Roll button
- Full width (368px), 40px tall, 2px hairline border, no fill.
- Label: `▶  EXECUTE ROLL`, 13px, letter-spacing 0.46em.
- Pressed state: invert fill to `--brutalist-blueprint-line` and label to `--brutalist-blueprint-bg`.

### Result panel
- 80px tall.
- Left column: `Σ TOTAL` micro-label + 28px monospaced number.
- Center column: per-die breakdown in 11px mono.
- Right column: 116×36 hairline callout box with `// HOPE`, `// FEAR`, or `[ CRITICAL ]` stamp.

### History (schedule table)
- Column widths: `#` 24px · `TIME` 62px · `DICE` 122px · `RESULT` 80px · `FLAG` 76px.
- Row height: 28px.
- Hairline divider every row at `rgba(244,244,238,0.12)`.
- Header row at `rgba(244,244,238,0.55)`, 9px ALL CAPS.
- Crit rows carry a tilted (-3°) stamp box around the FLAG cell.
- Scroll: vertical, fades at top/bottom via inset shadow only.

### FAB
- 56×56 square, no border-radius, 1px hairline border.
- `position: fixed; bottom: 16px; left: 16px; z-index: 1100;`.
- Inner d20 axonometric, centered.

---

## 7. Interaction & Motion

| State | Behavior |
|---|---|
| **FAB hover** | Inner stroke 1px → 2px (transition 120ms ease-out). Corner-stamp text brightens to full white. No transform. |
| **FAB focus** | 2px white ring at outline-offset: 2px (square, not rounded). |
| **FAB press** | Inverts: white fill, black inner d20. |
| **Sheet open** | Sheet drops in from `translateY(8px) opacity:0` to rest, 220ms cubic-bezier(0.22, 1, 0.36, 1). The grid background does NOT fade — it cuts in instantly so the paper feels physical. |
| **Dice cell hover** | Border 1px → 2px on hover. Stepper +/− buttons fade in. Tooltip on long-hover shows `dN / N-FACE`. |
| **Dice cell selected** | 2px border + faint fill; the small icon's hidden edges hide (drop the dashed lines). |
| **Roll initiated** | "Calculation in progress" cursor sweep: a 1px vertical hairline travels left-to-right across the result panel over 480ms (a draftsman's compass arc). The result number renders digit-by-digit (mono numerals snap into place every 60ms). When the sweep completes, a stamp drops onto the new history row — `transform: scale(1.4) rotate(-3deg) → scale(1) rotate(-3deg)` over 140ms with `opacity: 0 → 1`. |
| **Crit roll** | Both duality dice strokes pulse (1px → 2px → 1px) twice. The `[ CRITICAL ]` stamp lands in the result callout AND on the new schedule row. No screen shake — this is engineering, not an arcade. |
| **Hover on history row** | Background goes to `rgba(244,244,238,0.04)`; row's left edge shows a 2px hairline indent (selected-row gesture). |
| **Clear history** | Tiny `[ CLEAR ]` text-button at the top-right of §04 header, hairline-bordered. Confirms inline ("HOLD TO CLEAR" → press 600ms). |

**`prefers-reduced-motion: reduce`:**
- Disable cursor sweep entirely; result fills instantly.
- Disable stamp scale animation; stamp appears with opacity 0→1, 80ms.
- Sheet open uses opacity-only transition (no translate).
- Crit stroke pulse becomes a static 2px stroke.

---

## 8. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| ≥ 720px (desktop) | Sheet 420×560 anchored bottom-left, 88px above FAB. Picker = 7-up. |
| 480–719px (tablet) | Sheet 380×560. Picker still 7-up (48px cells). |
| < 480px (mobile) | Sheet width = `calc(100vw - 32px)` (max 380), height = `min(80vh, 640px)`, vertical scroll inside the sheet. Picker becomes 4-up grid. Sheet sits at `bottom: 80px` to clear FAB and not collide with bottom-right theme picker. |
| Theme picker collision | At all sizes the sheet is anchored bottom-LEFT and never extends past `calc(100vw - 88px)` so the bottom-right theme picker (96px wide collapsed) stays touchable. On screens narrower than 360px, the sheet width caps at `calc(100vw - 96px)` to keep a 16px gutter from the picker. |
| Landscape phone | Cap sheet height at `calc(100vh - 96px)` so the title block remains visible. |

Z-index discipline (per contract):
- FAB: `1100`
- Sheet: `1100` (sibling, attached visually to the FAB stack)
- Theme picker (warm-tavern, NOT this variant): `1200` — always above. The contrast between this stark blueprint and the warm-tavern picker chip is the deliberate point.

---

## 9. Accessibility

- **Roles & labels:**
  - FAB: `<button aria-label="Open dice roller" aria-expanded="{isOpen}" aria-controls="bp-sheet">`.
  - Sheet root: `<section id="bp-sheet" role="dialog" aria-modal="false" aria-label="Dice roller blueprint">`. Not modal — character sheet stays usable behind it.
  - Each section heading is a real `<h3>` with `aria-level` honoured; the visual `§ 0N` is decorative and `aria-hidden`.
  - Dice cells: `<button role="spinbutton" aria-valuemin="0" aria-valuemax="9" aria-valuenow="{n}" aria-label="d6 count, 2 selected">`.
  - Duality toggle: native `<input type="checkbox">` visually replaced with `☐` / `☒` glyph.
  - Execute button: `<button>` with `aria-keyshortcuts="Enter"`.
  - History rows: `<table>` with proper `<thead>` / `<tbody>` / `scope="col"` headers — it IS a schedule table.
  - Stamps: `[ CRITICAL ]` carries `aria-label="Critical Success"`, `// HOPE` carries `aria-label="rolled with Hope"`, `// FEAR` `"rolled with Fear"`. The visual notation is supplementary.

- **Keyboard:**
  - `Esc` closes the sheet.
  - `Tab` order: FAB → first dice cell → … → last dice cell → +/− steppers (when revealed) → duality toggle → Execute → Clear → first history row.
  - Arrow keys within the dice picker move between cells (left/right wrap); `+`/`-` increment/decrement count.
  - `Enter` on Execute rolls.
  - Focus is trapped within the sheet ONLY while a dice cell stepper is open; otherwise tabbing past Execute returns focus to the page.

- **Contrast:**
  - Primary line `#f4f4ee` on `#0d1117` ≈ 14.4:1 (AAA for normal text).
  - Dimmed line at 0.55 opacity ≈ 7.9:1 (AAA).
  - Faint construction lines at 0.25 are decorative only — never carry essential meaning.
  - Hope amber `#f4c542` on `#0d1117` ≈ 11.5:1, Fear red `#e0533d` ≈ 4.9:1 (AA — paired with text labels and never used as sole signal).
  - Crit jade `#6ad8a6` ≈ 9.8:1.

- **Reduced motion:** see §7.

- **High contrast / forced-colors mode:** map `--brutalist-blueprint-line` to `CanvasText`, `--brutalist-blueprint-bg` to `Canvas`, dimmed lines to `GrayText`, hope/fear/crit to `Mark` / `LinkText` accordingly. Hairlines remain visible because they're already 1px solid colors.

---

## 10. Microcopy Reference

| Event | Render |
|---|---|
| Roll with hope | Result panel right callout: `// HOPE` (amber, 1px box). Schedule row FLAG: `// HOPE`. |
| Roll with fear | Result panel right callout: `// FEAR` (red, 1px box). Schedule row FLAG: `// FEAR`. |
| Crit | Result panel right callout: `[ CRITICAL ]` (stamp red, slight rotation -3°). Schedule row FLAG cell: same stamp. Total label changes from `Σ TOTAL` to `Σ TOTAL · CRIT`. |
| Empty history | Schedule body shows a single dim row: `--  --:--:--   no rolls executed   --   --` |
| Empty selection (Execute disabled) | Button border drops to `--brutalist-blueprint-line-faint`, label reads `▶  EXECUTE ROLL  ·  Ø` (null symbol). On hover, leader-line tooltip points to picker: `// SELECT ≥ 1 DIE OR ENABLE DUALITY` |
| Clear confirm | Inline: `[ CLEAR ]` becomes `[ HOLD TO CLEAR ]`, fills left-to-right over 600ms, then schedule body resets. |

All section headings use the form `§ 0N  TITLE`. All callouts use the form `// LABEL` or `[ STAMP ]`. Dimensions use `Ø`, `L =`, `H =`. Total uses `Σ`. These tokens are the entire visual vocabulary — the implementer must not introduce new ones.

---

## 11. Implementation Constraints That Affect the Shared Variant Contract

1. **Single sheet shadow only.** No glow, no inset highlights, no per-element shadows. The sheet is the only object that casts.
2. **No border-radius anywhere.** Including the FAB. If the implementer feels the urge to soften a corner, the answer is no.
3. **No gradient fills** except the grid background (which is a single repeating-linear-gradient, possibly two stacked for the bold-every-80px detail).
4. **Monospaced font everywhere.** No exceptions for "headings deserve a serif" — that breaks the conceit.
5. **All-caps headings, lowercase die names** (`d4`, `d20` — the lowercase `d` is the convention; respect it).
6. **History MUST be a `<table>`.** The schedule semantics are load-bearing.
7. **Hope/fear leader-line arrows** require the duality dice to render at minimum 60px so the leader has somewhere to go. On mobile, when a duality result is displayed in the result panel, the leaders shorten but never disappear.
8. **Stamp rotation is fixed at -3°** for crit stamps. Don't randomize per row — that would feel "playful" and break the engineering register.
9. **Theme picker contrast is intentional.** The shared theme picker remains warm-tavern even when this variant is active. Do not attempt to harmonize.
10. **CSS budget:** all variant CSS must fit in < 4kB. Use the custom-property table; do not duplicate values. The grid background is the most expensive declaration — keep it as one property and don't duplicate it on inner elements.

---

## 12. Aesthetic Summary

A near-black drafting sheet on a fine grid. White hairlines describe every die as an axonometric mechanical drawing with dimension callouts. The roll history is literally a scheduled drawings table with stamped timestamps. Hope and fear are amber and red leader-line callouts (`// HOPE`, `// FEAR`). Critical successes get a slightly-tilted red stamp reading `[ CRITICAL ]`. Monospaced typography, ALL-CAPS section heads, no rounded corners, no shadows beyond a single sheet drop, no decoration that an engineer wouldn't put on a real blueprint. The contrast against the site's warm-tavern theme picker (which stays warm even here) is the entire point.
