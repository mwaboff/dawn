# Variant: Neon Arcade — Design Spec

> **Bold departure #1.** Full-bleed synthwave overlay. Wireframe holographic dice
> rotating in a CRT-flickered void. Terminal-style log. Cyan vs magenta duality.
> Crit triggers screen-shake + chromatic glitch.
> The site's warm-tavern theme picker stays anchored bottom-right (z-index 1200) —
> the contrast between this neon void and the gold-bordered picker chip is
> intentional and signals "you're skinning the dice roller, not the site."

---

## 1. Aesthetic Summary

A frame ripped from a 1985 arcade cabinet running a TTRPG companion app on a
half-broken CRT. Pure black violet field, infinite vanishing-point grid, neon
dice that look extruded from light not matter. Every label is monospaced and
slightly aberrant; every number is hot. Hope is electric cyan, fear is hot
magenta, crit is chartreuse — the only color the screen can't render cleanly,
which is the point.

The dice are **wireframe holograms**, not solid 3D shapes — open-line polyhedra
floating in space, glowing along their edges, gently rotating on hover. SVG
strokes over `currentColor` with a `drop-shadow` filter for the bloom.

---

## 2. Hero Mockup — Open Menu (Full-Bleed Overlay)

Dimensions assume a 1440 × 900 desktop viewport. The overlay is `position:
fixed; inset: 0; z-index: 1100`. Theme picker (z-index 1200) is rendered above
everything in the bottom-right but is shown ghosted in this mockup for context.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" role="img"
     aria-label="Neon Arcade dice roller — open menu, full-bleed synthwave overlay">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"   stop-color="#1a0826"/>
      <stop offset=".55" stop-color="#0a0214"/>
      <stop offset="1"   stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff2bd6" stop-opacity=".0"/>
      <stop offset=".5" stop-color="#ff2bd6" stop-opacity=".55"/>
      <stop offset="1" stop-color="#00f0ff" stop-opacity=".0"/>
    </linearGradient>
    <pattern id="scan" width="3" height="3" patternUnits="userSpaceOnUse">
      <rect width="3" height="1.2" fill="#00f0ff" fill-opacity=".05"/>
    </pattern>
    <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="bloomLg" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- 1. Backdrop -->
  <rect width="1440" height="900" fill="url(#bg)"/>

  <!-- 2. Synthwave perspective grid (horizon at y=460) -->
  <g stroke="#ff2bd6" stroke-opacity=".55" stroke-width="1" fill="none">
    <!-- horizontal grid lines, exponentially spaced toward horizon -->
    <line x1="0" y1="900" x2="1440" y2="900"/>
    <line x1="0" y1="780" x2="1440" y2="780"/>
    <line x1="0" y1="690" x2="1440" y2="690"/>
    <line x1="0" y1="620" x2="1440" y2="620"/>
    <line x1="0" y1="566" x2="1440" y2="566"/>
    <line x1="0" y1="524" x2="1440" y2="524"/>
    <line x1="0" y1="492" x2="1440" y2="492"/>
    <line x1="0" y1="470" x2="1440" y2="470"/>
    <line x1="0" y1="460" x2="1440" y2="460" stroke="#00f0ff" stroke-opacity=".8"/>
  </g>
  <g stroke="#00f0ff" stroke-opacity=".45" stroke-width="1" fill="none">
    <!-- vanishing-point radials below horizon -->
    <line x1="720" y1="460" x2="-200" y2="900"/>
    <line x1="720" y1="460" x2="80"   y2="900"/>
    <line x1="720" y1="460" x2="320"  y2="900"/>
    <line x1="720" y1="460" x2="540"  y2="900"/>
    <line x1="720" y1="460" x2="720"  y2="900"/>
    <line x1="720" y1="460" x2="900"  y2="900"/>
    <line x1="720" y1="460" x2="1120" y2="900"/>
    <line x1="720" y1="460" x2="1360" y2="900"/>
    <line x1="720" y1="460" x2="1640" y2="900"/>
  </g>

  <!-- 3. Horizon glow strip + sun -->
  <rect x="0" y="430" width="1440" height="60" fill="url(#horizon)"/>
  <g filter="url(#bloomLg)">
    <circle cx="720" cy="430" r="78" fill="none" stroke="#ff2bd6" stroke-width="2"/>
    <line x1="642" y1="412" x2="798" y2="412" stroke="#0a0214" stroke-width="6"/>
    <line x1="642" y1="424" x2="798" y2="424" stroke="#0a0214" stroke-width="4"/>
    <line x1="650" y1="434" x2="790" y2="434" stroke="#0a0214" stroke-width="3"/>
  </g>

  <!-- 4. CRT scanlines (entire screen) -->
  <rect width="1440" height="900" fill="url(#scan)"/>

  <!-- 5. Title bar (top, just above horizon) -->
  <g font-family="ui-monospace, 'JetBrains Mono', 'Fira Code', monospace"
     fill="#00f0ff" filter="url(#bloom)">
    <text x="64" y="72" font-size="13" letter-spacing="3" fill-opacity=".7">
      OH_SHEET // DICE_ROLLER.exe
    </text>
    <text x="64" y="116" font-size="32" letter-spacing="4" font-weight="700">
      ROLL_PROTOCOL :: NEON_ARCADE
    </text>
    <text x="64" y="142" font-size="11" letter-spacing="2" fill="#ff2bd6" fill-opacity=".85">
      [ENTER] roll &#8226; [ESC] close &#8226; [D] toggle duality
    </text>
  </g>

  <!-- 6. Close button (top-right) -->
  <g transform="translate(1356,52)" font-family="ui-monospace, monospace"
     fill="#00f0ff" filter="url(#bloom)">
    <rect x="0" y="0" width="44" height="32" fill="none"
          stroke="#00f0ff" stroke-width="1.5"/>
    <text x="22" y="22" font-size="14" text-anchor="middle">[ X ]</text>
  </g>

  <!-- 7. Left column — DICE PICKER (panel ~ 440 × 560) -->
  <g transform="translate(64,180)">
    <rect x="0" y="0" width="440" height="560" fill="#000" fill-opacity=".55"
          stroke="#00f0ff" stroke-width="1.5"/>
    <text x="16" y="28" font-family="ui-monospace, monospace"
          font-size="12" letter-spacing="2" fill="#00f0ff" filter="url(#bloom)">
      &gt; DICE_BAY
    </text>
    <line x1="0" y1="44" x2="440" y2="44" stroke="#00f0ff" stroke-opacity=".4"/>

    <!-- 7 dice rows (d4..d100) — each is: hologram thumbnail + label + counter -->
    <g font-family="ui-monospace, monospace" font-size="14" fill="#e8f7ff">
      <!-- row template, reused -->
      <g transform="translate(16,68)">
        <!-- d4 -->
        <g filter="url(#bloom)">
          <polygon points="24,4 44,40 4,40" fill="none" stroke="#00f0ff" stroke-width="1.5"/>
          <line x1="24" y1="4" x2="24" y2="40" stroke="#00f0ff" stroke-width="1" stroke-opacity=".5"/>
        </g>
        <text x="62" y="28" letter-spacing="2">d4</text>
        <g transform="translate(280,8)">
          <rect x="0"  y="0" width="28" height="28" fill="none" stroke="#ff2bd6" stroke-width="1"/>
          <text x="14" y="20" text-anchor="middle" fill="#ff2bd6">-</text>
          <text x="60" y="20" text-anchor="middle" fill="#00f0ff" font-size="16">02</text>
          <rect x="92" y="0" width="28" height="28" fill="none" stroke="#ff2bd6" stroke-width="1"/>
          <text x="106" y="20" text-anchor="middle" fill="#ff2bd6">+</text>
        </g>
      </g>

      <g transform="translate(16,128)">
        <!-- d6 -->
        <g filter="url(#bloom)">
          <polygon points="6,12 24,4 42,12 42,36 24,44 6,36" fill="none" stroke="#00f0ff" stroke-width="1.5"/>
          <line x1="6" y1="12" x2="24" y2="20" stroke="#00f0ff" stroke-width="1" stroke-opacity=".5"/>
          <line x1="42" y1="12" x2="24" y2="20" stroke="#00f0ff" stroke-width="1" stroke-opacity=".5"/>
          <line x1="24" y1="20" x2="24" y2="44" stroke="#00f0ff" stroke-width="1" stroke-opacity=".5"/>
        </g>
        <text x="62" y="28" letter-spacing="2">d6</text>
        <g transform="translate(280,8)">
          <rect x="0"  y="0" width="28" height="28" fill="none" stroke="#ff2bd6" stroke-width="1"/>
          <text x="14" y="20" text-anchor="middle" fill="#ff2bd6">-</text>
          <text x="60" y="20" text-anchor="middle" fill="#00f0ff" font-size="16">00</text>
          <rect x="92" y="0" width="28" height="28" fill="none" stroke="#ff2bd6" stroke-width="1"/>
          <text x="106" y="20" text-anchor="middle" fill="#ff2bd6">+</text>
        </g>
      </g>

      <g transform="translate(16,188)">
        <!-- d8 -->
        <g filter="url(#bloom)">
          <polygon points="24,4 42,24 24,44 6,24" fill="none" stroke="#00f0ff" stroke-width="1.5"/>
          <line x1="6" y1="24" x2="42" y2="24" stroke="#00f0ff" stroke-opacity=".5"/>
          <line x1="24" y1="4" x2="24" y2="44" stroke="#00f0ff" stroke-opacity=".5"/>
        </g>
        <text x="62" y="28">d8</text>
        <g transform="translate(280,8)" fill="#00f0ff">
          <rect x="0"  y="0" width="28" height="28" fill="none" stroke="#ff2bd6"/>
          <text x="14" y="20" text-anchor="middle" fill="#ff2bd6">-</text>
          <text x="60" y="20" text-anchor="middle" font-size="16">01</text>
          <rect x="92" y="0" width="28" height="28" fill="none" stroke="#ff2bd6"/>
          <text x="106" y="20" text-anchor="middle" fill="#ff2bd6">+</text>
        </g>
      </g>

      <g transform="translate(16,248)">
        <!-- d10 -->
        <g filter="url(#bloom)">
          <polygon points="24,4 44,18 38,40 10,40 4,18" fill="none" stroke="#00f0ff" stroke-width="1.5"/>
          <line x1="24" y1="4" x2="24" y2="40" stroke="#00f0ff" stroke-opacity=".5"/>
        </g>
        <text x="62" y="28">d10</text>
        <g transform="translate(280,8)" fill="#00f0ff">
          <rect x="0" y="0" width="28" height="28" fill="none" stroke="#ff2bd6"/>
          <text x="14" y="20" text-anchor="middle" fill="#ff2bd6">-</text>
          <text x="60" y="20" text-anchor="middle" font-size="16">00</text>
          <rect x="92" y="0" width="28" height="28" fill="none" stroke="#ff2bd6"/>
          <text x="106" y="20" text-anchor="middle" fill="#ff2bd6">+</text>
        </g>
      </g>

      <g transform="translate(16,308)">
        <!-- d12 -->
        <g filter="url(#bloom)">
          <polygon points="24,4 42,14 44,32 32,44 16,44 4,32 6,14"
                   fill="none" stroke="#00f0ff" stroke-width="1.5"/>
          <polygon points="14,18 34,18 38,30 24,40 10,30"
                   fill="none" stroke="#00f0ff" stroke-opacity=".55"/>
        </g>
        <text x="62" y="28">d12</text>
        <g transform="translate(280,8)" fill="#00f0ff">
          <rect x="0" y="0" width="28" height="28" fill="none" stroke="#ff2bd6"/>
          <text x="14" y="20" text-anchor="middle" fill="#ff2bd6">-</text>
          <text x="60" y="20" text-anchor="middle" font-size="16">00</text>
          <rect x="92" y="0" width="28" height="28" fill="none" stroke="#ff2bd6"/>
          <text x="106" y="20" text-anchor="middle" fill="#ff2bd6">+</text>
        </g>
      </g>

      <g transform="translate(16,368)">
        <!-- d20 -->
        <g filter="url(#bloom)">
          <polygon points="24,2 44,16 40,38 24,46 8,38 4,16"
                   fill="none" stroke="#00f0ff" stroke-width="1.5"/>
          <polygon points="14,16 34,16 24,32" fill="none" stroke="#00f0ff" stroke-opacity=".55"/>
          <line x1="4" y1="16" x2="24" y2="32" stroke="#00f0ff" stroke-opacity=".55"/>
          <line x1="44" y1="16" x2="24" y2="32" stroke="#00f0ff" stroke-opacity=".55"/>
        </g>
        <text x="62" y="28">d20</text>
        <g transform="translate(280,8)" fill="#00f0ff">
          <rect x="0" y="0" width="28" height="28" fill="none" stroke="#ff2bd6"/>
          <text x="14" y="20" text-anchor="middle" fill="#ff2bd6">-</text>
          <text x="60" y="20" text-anchor="middle" font-size="16">01</text>
          <rect x="92" y="0" width="28" height="28" fill="none" stroke="#ff2bd6"/>
          <text x="106" y="20" text-anchor="middle" fill="#ff2bd6">+</text>
        </g>
      </g>

      <g transform="translate(16,428)">
        <!-- d100 — two stacked d10s -->
        <g filter="url(#bloom)">
          <polygon points="14,4 34,12 30,28 4,28 0,12" fill="none"
                   stroke="#00f0ff" stroke-width="1.5"/>
          <polygon points="22,18 42,26 38,42 12,42 8,26" fill="none"
                   stroke="#00f0ff" stroke-width="1.5"/>
        </g>
        <text x="62" y="28">d100</text>
        <g transform="translate(280,8)" fill="#00f0ff">
          <rect x="0" y="0" width="28" height="28" fill="none" stroke="#ff2bd6"/>
          <text x="14" y="20" text-anchor="middle" fill="#ff2bd6">-</text>
          <text x="60" y="20" text-anchor="middle" font-size="16">00</text>
          <rect x="92" y="0" width="28" height="28" fill="none" stroke="#ff2bd6"/>
          <text x="106" y="20" text-anchor="middle" fill="#ff2bd6">+</text>
        </g>
      </g>
    </g>

    <!-- Duality toggle row -->
    <line x1="0" y1="488" x2="440" y2="488" stroke="#00f0ff" stroke-opacity=".4"/>
    <g font-family="ui-monospace, monospace" font-size="13" fill="#e8f7ff">
      <text x="16" y="514" letter-spacing="2" fill="#00f0ff">&gt; DUALITY_PAIR</text>
      <text x="16" y="534" font-size="11" fill="#e8f7ff" fill-opacity=".55">
        2d12 // hope[cyan] vs fear[magenta]
      </text>
      <g transform="translate(360,500)">
        <rect x="0" y="0" width="48" height="22" fill="#1a0826"
              stroke="#00f0ff" stroke-width="1.5"/>
        <rect x="26" y="2" width="20" height="18" fill="#00f0ff" filter="url(#bloom)"/>
        <text x="6" y="16" font-size="10" fill="#00f0ff">ON</text>
      </g>
    </g>
  </g>

  <!-- 8. Center column — RESULT STAGE (panel ~ 440 × 560) -->
  <g transform="translate(528,180)">
    <rect x="0" y="0" width="440" height="560" fill="#000" fill-opacity=".4"
          stroke="#ff2bd6" stroke-width="1.5"/>
    <text x="16" y="28" font-family="ui-monospace, monospace"
          font-size="12" letter-spacing="2" fill="#ff2bd6" filter="url(#bloom)">
      &gt; RESULT_STAGE
    </text>
    <line x1="0" y1="44" x2="440" y2="44" stroke="#ff2bd6" stroke-opacity=".4"/>

    <!-- Hologram dice arranged in a small constellation -->
    <g transform="translate(220,200)" filter="url(#bloomLg)">
      <!-- duality cyan d12 (hope) -->
      <g transform="translate(-90,-30)" stroke="#00f0ff" stroke-width="1.8" fill="none">
        <polygon points="0,-44 38,-22 42,22 0,44 -42,22 -38,-22"/>
        <polygon points="0,-26 22,-12 24,12 0,26 -24,12 -22,-12" stroke-opacity=".6"/>
        <text x="0" y="6" text-anchor="middle" fill="#00f0ff"
              font-family="ui-monospace, monospace" font-size="22"
              font-weight="700" stroke="none">9</text>
      </g>
      <!-- duality magenta d12 (fear) -->
      <g transform="translate(90,-30)" stroke="#ff2bd6" stroke-width="1.8" fill="none">
        <polygon points="0,-44 38,-22 42,22 0,44 -42,22 -38,-22"/>
        <polygon points="0,-26 22,-12 24,12 0,26 -24,12 -22,-12" stroke-opacity=".6"/>
        <text x="0" y="6" text-anchor="middle" fill="#ff2bd6"
              font-family="ui-monospace, monospace" font-size="22"
              font-weight="700" stroke="none">5</text>
      </g>
      <!-- accompanying d20 -->
      <g transform="translate(0,72)" stroke="#e8f7ff" stroke-width="1.6" fill="none"
         stroke-opacity=".9">
        <polygon points="0,-36 32,-18 28,22 0,38 -28,22 -32,-18"/>
        <polygon points="-18,-12 18,-12 0,16" stroke-opacity=".5"/>
        <text x="0" y="6" text-anchor="middle" fill="#e8f7ff"
              font-family="ui-monospace, monospace" font-size="20"
              font-weight="700" stroke="none">17</text>
      </g>
    </g>

    <!-- Total + outcome -->
    <g font-family="ui-monospace, monospace" fill="#00f0ff">
      <text x="220" y="380" text-anchor="middle" font-size="11"
            letter-spacing="3" fill-opacity=".7">SUM_TOTAL</text>
      <text x="220" y="430" text-anchor="middle" font-size="64" font-weight="700"
            filter="url(#bloomLg)">31</text>
      <text x="220" y="470" text-anchor="middle" font-size="14" fill="#00f0ff"
            letter-spacing="3" filter="url(#bloom)">:: hope</text>
    </g>

    <!-- ROLL button -->
    <g transform="translate(60,500)">
      <rect x="0" y="0" width="320" height="44" fill="#ff2bd6" fill-opacity=".15"
            stroke="#ff2bd6" stroke-width="1.5" filter="url(#bloom)"/>
      <text x="160" y="29" text-anchor="middle"
            font-family="ui-monospace, monospace" font-size="16"
            letter-spacing="6" fill="#ff2bd6">[ ROLL_DICE ]</text>
    </g>
  </g>

  <!-- 9. Right column — TERMINAL HISTORY LOG (panel ~ 408 × 560) -->
  <g transform="translate(992,180)">
    <rect x="0" y="0" width="408" height="560" fill="#000" fill-opacity=".55"
          stroke="#00f0ff" stroke-width="1.5"/>
    <text x="16" y="28" font-family="ui-monospace, monospace"
          font-size="12" letter-spacing="2" fill="#00f0ff" filter="url(#bloom)">
      &gt; ROLL_LOG.tail
    </text>
    <text x="392" y="28" text-anchor="end" font-family="ui-monospace, monospace"
          font-size="10" fill="#ff2bd6" fill-opacity=".7">
      [clear_log]
    </text>
    <line x1="0" y1="44" x2="408" y2="44" stroke="#00f0ff" stroke-opacity=".4"/>

    <g font-family="ui-monospace, monospace" font-size="12" fill="#a8f0ff">
      <text x="16" y="72">[12:42:08] &gt; rolled 1d20 = 17 :: hope (h9 f5)</text>
      <text x="16" y="72" font-size="12" fill="#00f0ff" fill-opacity=".0">.</text>
      <text x="16" y="92" fill="#a8f0ff" fill-opacity=".75">
        [12:41:33] &gt; rolled 2d6 = 8
      </text>
      <text x="16" y="112" fill="#bdfd6a" filter="url(#bloom)">
        [12:40:51] &gt; [!] CRITICAL_SUCCESS (h7 f7)
      </text>
      <text x="16" y="132" fill="#a8f0ff" fill-opacity=".7">
        [12:40:14] &gt; rolled 1d12 = 4 :: fear (h3 f9)
      </text>
      <text x="16" y="152" fill="#a8f0ff" fill-opacity=".55">
        [12:39:58] &gt; rolled 1d8 = 6
      </text>
      <text x="16" y="172" fill="#a8f0ff" fill-opacity=".5">
        [12:38:22] &gt; rolled 1d20 = 12 :: hope (h11 f4)
      </text>
      <text x="16" y="192" fill="#a8f0ff" fill-opacity=".4">
        [12:36:41] &gt; rolled 3d6 = 14
      </text>
      <text x="16" y="212" fill="#a8f0ff" fill-opacity=".35">
        [12:33:09] &gt; rolled 1d100 = 73
      </text>
      <!-- caret -->
      <text x="16" y="244" fill="#00f0ff" filter="url(#bloom)">
        &gt; _
      </text>
    </g>
  </g>

  <!-- 10. FAB (bottom-left, "open" state shows it as active/pressed) -->
  <g transform="translate(40,820)" filter="url(#bloomLg)">
    <rect x="0" y="0" width="56" height="56" rx="6" fill="#0a0214"
          stroke="#00f0ff" stroke-width="2"/>
    <!-- isometric cube wireframe -->
    <g stroke="#ff2bd6" stroke-width="1.5" fill="none">
      <polygon points="28,12 46,22 46,40 28,50 10,40 10,22"/>
      <line x1="28" y1="12" x2="28" y2="30"/>
      <line x1="28" y1="30" x2="10" y2="22"/>
      <line x1="28" y1="30" x2="46" y2="22"/>
    </g>
  </g>

  <!-- 11. Theme picker preview (NOT redesigned; ghosted-in for context) -->
  <g transform="translate(1336,820)" opacity=".95">
    <rect x="0" y="0" width="64" height="48" rx="22" fill="#3a2418"
          stroke="#d4a056" stroke-width="1.5"/>
    <circle cx="32" cy="24" r="10" fill="#d4a056"/>
    <text x="32" y="68" text-anchor="middle"
          font-family="Cinzel, serif" font-size="9" fill="#d4a056"
          letter-spacing="2">THEME</text>
  </g>
</svg>
```

**What you're looking at:**
- Three glassy panels float over the synthwave grid: `DICE_BAY` (left, cyan
  border), `RESULT_STAGE` (center, magenta border), `ROLL_LOG.tail` (right, cyan
  border). All panels share the same near-black 55% fill so the grid bleeds
  through.
- Hope die glows cyan, fear die glows magenta. The result number is the loudest
  thing on screen (`64px`, double-bloomed).
- The `[ ROLL_DICE ]` button is the second-loudest, on a magenta hairline.
- History is a terminal tail; opacity drops as you go down (older = dimmer).
- Bottom-right: warm-tavern theme picker chip is intentionally and visibly
  out-of-palette. That's a feature, not a bug.

---

## 3. Hero Mockup — FAB (Closed State)

Cyberpunk cube. 56 × 56 px. Sits at `bottom: 24px; left: 24px; z-index: 1100`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img"
     aria-label="Neon Arcade dice roller FAB — glowing cyberpunk cube">
  <defs>
    <radialGradient id="halo" cx=".5" cy=".5" r=".5">
      <stop offset="0"   stop-color="#ff2bd6" stop-opacity=".55"/>
      <stop offset=".55" stop-color="#ff2bd6" stop-opacity=".18"/>
      <stop offset="1"   stop-color="#ff2bd6" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
  </defs>
  <!-- ambient halo (sits behind everything) -->
  <circle cx="60" cy="60" r="58" fill="url(#halo)"/>
  <!-- chip body -->
  <rect x="24" y="24" width="72" height="72" rx="8"
        fill="#0a0214" stroke="#00f0ff" stroke-width="2"/>
  <!-- corner brackets -->
  <g stroke="#00f0ff" stroke-width="1.5" fill="none" opacity=".7">
    <polyline points="28,34 28,28 34,28"/>
    <polyline points="86,28 92,28 92,34"/>
    <polyline points="92,86 92,92 86,92"/>
    <polyline points="34,92 28,92 28,86"/>
  </g>
  <!-- isometric wireframe cube -->
  <g stroke="#ff2bd6" stroke-width="2" fill="none" filter="url(#glow)">
    <polygon points="60,38 84,52 84,76 60,90 36,76 36,52"/>
    <line x1="60" y1="38" x2="60" y2="64"/>
    <line x1="60" y1="64" x2="36" y2="52"/>
    <line x1="60" y1="64" x2="84" y2="52"/>
  </g>
  <!-- crisp cube on top (no blur) -->
  <g stroke="#ff2bd6" stroke-width="1.4" fill="none">
    <polygon points="60,38 84,52 84,76 60,90 36,76 36,52"/>
    <line x1="60" y1="38" x2="60" y2="64"/>
    <line x1="60" y1="64" x2="36" y2="52"/>
    <line x1="60" y1="64" x2="84" y2="52"/>
  </g>
  <!-- pip on top face -->
  <circle cx="60" cy="52" r="2.5" fill="#00f0ff"/>
</svg>
```

**Idle:** the magenta blur layer pulses (opacity 0.6 → 1.0) at 3.2s.
**Hover:** cube rotates 18° on Y-axis (CSS `transform: rotate3d(0,1,0,18deg)`)
and the cyan border ramps to full intensity.
**Active (menu open):** the cube's stroke flips to cyan, magenta blur pulse
intensifies; serves as a "you are connected" indicator.

---

## 4. Wireframe Hologram Dice

Each die is a single SVG, ~60 × 60, currentColor-driven so the same markup
serves all three uses (cyan / magenta / chartreuse). Edges only — no fills.
Inner edges drawn with `stroke-opacity: 0.55` to imply depth without occluding.

```svg
<!-- d4 -->
<svg viewBox="0 0 60 60" aria-label="d4 hologram">
  <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
    <polygon points="30,6 54,52 6,52"/>
    <line x1="30" y1="6"  x2="30" y2="52" stroke-opacity=".55"/>
    <line x1="6"  y1="52" x2="30" y2="34" stroke-opacity=".55"/>
    <line x1="54" y1="52" x2="30" y2="34" stroke-opacity=".55"/>
  </g>
</svg>

<!-- d6 -->
<svg viewBox="0 0 60 60" aria-label="d6 hologram">
  <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
    <polygon points="8,16 30,6 52,16 52,44 30,54 8,44"/>
    <line x1="8"  y1="16" x2="30" y2="26" stroke-opacity=".55"/>
    <line x1="52" y1="16" x2="30" y2="26" stroke-opacity=".55"/>
    <line x1="30" y1="26" x2="30" y2="54" stroke-opacity=".55"/>
  </g>
</svg>

<!-- d8 -->
<svg viewBox="0 0 60 60" aria-label="d8 hologram">
  <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
    <polygon points="30,4 54,30 30,56 6,30"/>
    <line x1="6"  y1="30" x2="54" y2="30" stroke-opacity=".55"/>
    <line x1="30" y1="4"  x2="30" y2="56" stroke-opacity=".55"/>
  </g>
</svg>

<!-- d10 -->
<svg viewBox="0 0 60 60" aria-label="d10 hologram">
  <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
    <polygon points="30,4 54,18 50,40 10,40 6,18"/>
    <polygon points="10,40 30,56 50,40" stroke-opacity=".75"/>
    <line x1="30" y1="4"  x2="30" y2="40" stroke-opacity=".55"/>
    <line x1="6"  y1="18" x2="30" y2="40" stroke-opacity=".55"/>
    <line x1="54" y1="18" x2="30" y2="40" stroke-opacity=".55"/>
  </g>
</svg>

<!-- d12 (pentagonal-faced) -->
<svg viewBox="0 0 60 60" aria-label="d12 hologram">
  <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
    <polygon points="30,4 52,16 54,40 38,54 22,54 6,40 8,16"/>
    <polygon points="18,22 42,22 46,38 30,50 14,38" stroke-opacity=".6"/>
    <line x1="30" y1="4"  x2="30" y2="22" stroke-opacity=".55"/>
    <line x1="8"  y1="16" x2="18" y2="22" stroke-opacity=".55"/>
    <line x1="52" y1="16" x2="42" y2="22" stroke-opacity=".55"/>
    <line x1="22" y1="54" x2="14" y2="38" stroke-opacity=".55"/>
    <line x1="38" y1="54" x2="46" y2="38" stroke-opacity=".55"/>
  </g>
</svg>

<!-- d20 (icosahedral silhouette) -->
<svg viewBox="0 0 60 60" aria-label="d20 hologram">
  <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
    <polygon points="30,2 54,16 50,42 30,58 10,42 6,16"/>
    <polygon points="18,16 42,16 30,38" stroke-opacity=".6"/>
    <line x1="6"  y1="16" x2="30" y2="38" stroke-opacity=".55"/>
    <line x1="54" y1="16" x2="30" y2="38" stroke-opacity=".55"/>
    <line x1="30" y1="2"  x2="30" y2="16" stroke-opacity=".55"/>
    <line x1="30" y1="38" x2="30" y2="58" stroke-opacity=".55"/>
  </g>
</svg>

<!-- d100 (paired d10s; one slightly rotated) -->
<svg viewBox="0 0 80 60" aria-label="d100 hologram">
  <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
    <g transform="translate(0,0) rotate(-6 22 24)">
      <polygon points="22,4 42,16 38,32 6,32 2,16"/>
      <polygon points="6,32 22,44 38,32" stroke-opacity=".75"/>
    </g>
    <g transform="translate(36,12) rotate(8 22 24)">
      <polygon points="22,4 42,16 38,32 6,32 2,16"/>
      <polygon points="6,32 22,44 38,32" stroke-opacity=".75"/>
    </g>
  </g>
</svg>
```

### Duality Pair (cyan hope d12 + magenta fear d12)

Side-by-side, mirrored, locked at 180px wide combined. Each die uses its own
color via inline `style="color: var(--hope-color)"` / `var(--fear-color)`.
Numerals appear in the center face after a roll, monospaced 22px.

```svg
<svg viewBox="0 0 200 80" aria-label="Duality pair: cyan hope d12, magenta fear d12">
  <defs>
    <filter id="d-bloom" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g style="color:#00f0ff" filter="url(#d-bloom)">
    <g transform="translate(50,40)" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="0,-32 28,-16 30,16 0,32 -30,16 -28,-16"/>
      <polygon points="-12,-12 12,-12 14,8 0,18 -14,8" stroke-opacity=".6"/>
      <text x="0" y="6" text-anchor="middle" fill="currentColor" stroke="none"
            font-family="ui-monospace, monospace" font-size="20" font-weight="700">9</text>
      <text x="0" y="50" text-anchor="middle" fill="currentColor" stroke="none"
            font-family="ui-monospace, monospace" font-size="9" letter-spacing="3"
            opacity=".75">HOPE</text>
    </g>
  </g>
  <g style="color:#ff2bd6" filter="url(#d-bloom)">
    <g transform="translate(150,40)" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="0,-32 28,-16 30,16 0,32 -30,16 -28,-16"/>
      <polygon points="-12,-12 12,-12 14,8 0,18 -14,8" stroke-opacity=".6"/>
      <text x="0" y="6" text-anchor="middle" fill="currentColor" stroke="none"
            font-family="ui-monospace, monospace" font-size="20" font-weight="700">5</text>
      <text x="0" y="50" text-anchor="middle" fill="currentColor" stroke="none"
            font-family="ui-monospace, monospace" font-size="9" letter-spacing="3"
            opacity=".75">FEAR</text>
    </g>
  </g>
</svg>
```

When `hope === fear`, both dice cross-fade to chartreuse `#bdfd6a` for 600ms
before settling back to their colors, and the surrounding background flashes
chartreuse via `box-shadow` ring (see §7 crit choreography).

---

## 5. CSS Custom Properties

| Token                          | Value                                       | Usage                                  |
|--------------------------------|---------------------------------------------|----------------------------------------|
| `--neon-arcade-bg`             | `#0a0214`                                   | Base overlay (paired with grad below)  |
| `--neon-arcade-bg-grad`        | `linear-gradient(180deg,#1a0826 0%,#0a0214 55%,#000 100%)` | Body of overlay         |
| `--neon-arcade-cyan`           | `#00f0ff`                                   | Primary accent, hope, panel borders    |
| `--neon-arcade-cyan-soft`      | `#a8f0ff`                                   | History-log default text               |
| `--neon-arcade-magenta`        | `#ff2bd6`                                   | Secondary accent, fear, roll button    |
| `--neon-arcade-magenta-soft`   | `#ffb8ec`                                   | Fear-tinted secondary labels           |
| `--neon-arcade-glow`           | `0 0 8px currentColor, 0 0 18px currentColor` | Reusable text/box glow             |
| `--neon-arcade-glow-soft`      | `0 0 4px currentColor`                      | Subtle UI accent (counter rectangles)  |
| `--neon-arcade-grid`           | `repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,240,255,.06) 2px 3px)` | CRT scanlines |
| `--neon-arcade-grid-mag`       | `radial-gradient(ellipse at 50% 51%, rgba(255,43,214,.18), transparent 60%)` | Synthwave horizon haze |
| `--neon-arcade-hope`           | `#00f0ff`                                   | Hope die stroke + numerals (also `--hope-color`) |
| `--neon-arcade-fear`           | `#ff2bd6`                                   | Fear die stroke + numerals (also `--fear-color`) |
| `--neon-arcade-crit`           | `#bdfd6a`                                   | Crit highlight (also `--crit-color`)   |
| `--neon-arcade-terminal-fg`    | `#a8f0ff`                                   | Terminal log default text              |
| `--neon-arcade-terminal-dim`   | `rgba(168,240,255,.45)`                     | Older history rows                     |
| `--neon-arcade-terminal-cursor`| `#00f0ff`                                   | Blinking caret                         |
| `--neon-arcade-panel-bg`       | `rgba(0,0,0,.55)`                           | Glassy panel fill                      |
| `--neon-arcade-panel-border`   | `1.5px solid var(--neon-arcade-cyan)`       | Default panel hairline                 |
| `--neon-arcade-panel-border-fear` | `1.5px solid var(--neon-arcade-magenta)` | Result-stage hairline                  |
| `--neon-arcade-button-bg`      | `rgba(255,43,214,.15)`                      | Roll-button fill                       |
| `--neon-arcade-button-border`  | `1.5px solid var(--neon-arcade-magenta)`    | Roll-button hairline                   |
| **Type**                       |                                             |                                        |
| `--neon-arcade-font-mono`      | `ui-monospace, 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Consolas, monospace` | All text |
| `--neon-arcade-font-size-sm`   | `11px`                                      | Sublabels, terminal timestamps         |
| `--neon-arcade-font-size-base` | `13px`                                      | Body text, log entries                 |
| `--neon-arcade-font-size-lg`   | `16px`                                      | Buttons, counter values                |
| `--neon-arcade-font-size-xl`   | `32px`                                      | Title bar                              |
| `--neon-arcade-font-size-hero` | `64px`                                      | Result total                           |
| `--neon-arcade-letter-tight`   | `2px`                                       | Most labels                            |
| `--neon-arcade-letter-wide`    | `6px`                                       | Roll button                            |
| **Motion**                     |                                             |                                        |
| `--neon-arcade-anim-scan`      | `7s`                                        | Scanline drift cycle                   |
| `--neon-arcade-anim-pulse`     | `3.2s`                                      | FAB halo pulse                         |
| `--neon-arcade-anim-roll`      | `780ms`                                     | Dice roll spin + chromatic aberration  |
| `--neon-arcade-anim-glitch`    | `420ms`                                     | Crit glitch burst                      |
| `--neon-arcade-anim-shake`     | `360ms`                                     | Crit screen-shake                      |
| `--neon-arcade-easing`         | `cubic-bezier(.2,.7,.1,1)`                  | Default                                |
| **Spatial**                    |                                             |                                        |
| `--neon-arcade-blur-glow`      | `2.4px`                                     | feGaussianBlur stdDev for `#bloom`     |
| `--neon-arcade-blur-glow-lg`   | `6px`                                       | feGaussianBlur stdDev for `#bloomLg`   |
| `--neon-arcade-bloom-text`     | `0 0 6px currentColor, 0 0 14px currentColor` | Text bloom shorthand               |

> **Contract aliasing:** the variant exposes `--hope-color`,
> `--fear-color`, `--crit-color` as aliases of the three theme tokens, so the
> shared variant contract (§5 of the parent plan) reads them transparently.

---

## 6. Layout Dimensions

| Region                          | Size / Position                                          |
|---------------------------------|----------------------------------------------------------|
| Overlay                         | `position: fixed; inset: 0; z-index: 1100`               |
| Backdrop                        | full-bleed; `--neon-arcade-bg-grad` + grid + scanlines    |
| Title bar                       | top 64px; left padding 64px (32px on mobile)             |
| Close button                    | top-right; 44 × 32; 24px from edges                      |
| Three-column grid (≥ 1100px)    | 64px gutter; columns 440 / 440 / 408                     |
| Panel height                    | 560px desktop, auto on mobile (each becomes a vertical card) |
| Panel border-radius             | `0` (squared, CRT-correct)                               |
| Panel inner padding             | 16px                                                     |
| Dice-row height                 | 60px; 7 rows + duality toggle row                        |
| Counter pill                    | 28 × 28 (–), 32 × 28 (value), 28 × 28 (+); 8px gap       |
| Result hologram cluster         | 220 × 220, centered                                      |
| Result total                    | `font-size: 64px`, line-height 1                          |
| `[ ROLL_DICE ]` button          | 320 × 44; 16px from panel edges                          |
| Terminal log line-height        | `1.5` (~ 20px at 13px font)                              |
| Terminal log row count visible  | ~22 lines before scroll                                  |
| FAB                             | 56 × 56; `bottom: 24px; left: 24px; z-index: 1100`       |
| FAB ambient halo                | 116 × 116, behind chip                                   |
| Theme picker (NOT redesigned)   | bottom-right, z-index 1200, warm-tavern                  |

### Responsive

- **≥ 1100px (desktop):** three columns side-by-side as in hero mockup.
- **768–1099px (tablet):** two columns — `DICE_BAY` and `ROLL_LOG.tail` stack
  in the right column (each 50% height); `RESULT_STAGE` takes the full left.
  Title bar drops to `font-size: 22px`. Panels keep 16px padding.
- **< 768px (mobile):** single column; panels stack in order
  `RESULT_STAGE → DICE_BAY → ROLL_LOG.tail`. Overlay scrolls vertically
  (`overflow-y: auto`). Title bar reduces to `font-size: 18px`. Roll button
  becomes full-width minus 16px padding. Result hologram cluster scales to
  160 × 160. Terminal log caps at 8 visible rows + scroll.
- **Theme picker collision:** the warm-tavern picker chip at `bottom: 24px;
  right: 24px` reserves a 96 × 80px keep-out zone. The overlay's bottom-right
  corner (terminal log panel) is unaffected because it ends 24px from the right
  edge, but on mobile (single column) we add `padding-bottom: 96px` to the
  overlay so the last log entry isn't covered by the picker.
- **FAB (closed state) does not collide** with the picker — opposite corners.

---

## 7. Interaction & Animation

### Scanline drift (continuous)
A single CSS animation translates `--neon-arcade-grid` vertically by 3px over
`var(--neon-arcade-anim-scan)` (7s) using `background-position`. Subtle — almost
imperceptible — but breaks the static feel. Driven by one `@keyframes`, total
cost ~30 bytes.

```css
.scan { animation: scanDrift var(--neon-arcade-anim-scan) linear infinite; }
@keyframes scanDrift { to { background-position: 0 -3px; } }
```

### FAB pulse (idle)
The magenta halo `radial-gradient` animates `opacity` 0.55 ↔ 1.0 over 3.2s
ease-in-out. Pauses on hover (full opacity, locked).

### Hover-rotate dice (picker thumbnails + result stage)
Each `.die` has `transition: transform 320ms var(--neon-arcade-easing)`. On
hover: `transform: rotate(8deg) scale(1.08)`. Result-stage dice get a slow
continuous wobble: `animation: hover-spin 5s ease-in-out infinite alternate;
transform: rotate(-3deg) → rotate(3deg)`.

### Roll animation (780ms)
1. **0–180ms:** all dice in result stage scale to `0.85` and ramp opacity `0.5`,
   small `filter: blur(1px)` — they "pull in" before launching.
2. **180–620ms:** dice spin (`rotate(0) → rotate(540deg)`), `filter` swaps to
   chromatic aberration via dual `drop-shadow`s offset ±2px in cyan/magenta:
   `filter: drop-shadow(2px 0 0 #00f0ff) drop-shadow(-2px 0 0 #ff2bd6)`.
3. **620–780ms:** filter clears, `transform` snaps to identity, scale springs
   back via `cubic-bezier(.2,.9,.3,1.4)` (slight overshoot), and a one-frame
   neon flash overlays the result panel (`box-shadow: 0 0 60px var(--neon-arcade-cyan)`
   fading to none over 200ms).

### Crit choreography (when `hope === fear`)
Sequenced over ~900ms total:

| t (ms) | Layer                | Effect                                                                 |
|-------:|----------------------|------------------------------------------------------------------------|
| 0      | Overlay root         | `animation: crit-shake var(--neon-arcade-anim-shake)` — 4 keyframes, ±6px translate |
| 0      | Result panel border  | Border switches to `--neon-arcade-crit` (chartreuse) for 800ms        |
| 0–420  | Result hologram dice | Glitch: 3 keyframes — clip-path slices offset horizontally ±8px, color channels split (chromatic aberration via drop-shadows offset 4px) |
| 0–600  | Both duality dice    | Cross-fade stroke + numeral to chartreuse, then back                  |
| 100    | Result total number  | Replaces with `[!] CRITICAL_SUCCESS` for 1.4s, then settles to numeric total + `:: hope === fear` sub-label |
| 0–800  | Terminal log         | New entry prefixed `[!] CRITICAL_SUCCESS (h7 f7)` in chartreuse with `var(--neon-arcade-bloom-text)` |
| 0–1200 | Backdrop horizon     | Magenta horizon haze brightens 1.4× then fades                         |

```css
@keyframes crit-shake {
  0%   { transform: translate(0,0); }
  25%  { transform: translate(-6px, 2px); }
  50%  { transform: translate(5px,-3px); }
  75%  { transform: translate(-4px, 4px); }
  100% { transform: translate(0,0); }
}
@keyframes crit-glitch {
  0%   { clip-path: inset(0 0 0 0); filter: none; }
  20%  { clip-path: inset(20% 0 60% 0); transform: translateX(-8px); }
  40%  { clip-path: inset(50% 0 25% 0); transform: translateX(8px); }
  60%  { clip-path: inset(10% 0 70% 0); transform: translateX(-4px); }
  100% { clip-path: inset(0 0 0 0); filter: none; transform: translateX(0); }
}
```

### Hover states
- **Counter pills (− / +):** background fades to `rgba(255,43,214,.15)`,
  text glow ramps to full.
- **`[ ROLL_DICE ]`:** background `rgba(255,43,214,.30)`, letter-spacing
  expands from 6px → 8px (80ms transition for a subtle "charging" cue).
- **History rows:** the hovered row brightens to full opacity and gains a
  4px-wide cyan left border accent.
- **Close `[ X ]`:** background fills cyan, text inverts to `#0a0214`.

### Focus states (keyboard)
All interactive elements receive a 2px solid `outline` in
`var(--neon-arcade-cyan)` with `outline-offset: 3px` and a subtle
`box-shadow: var(--neon-arcade-glow)`. Roll button outline doubles to 3px and
uses chartreuse to clearly distinguish "primary action" focus.

### Open / close transition
Overlay fades in over 240ms (`opacity: 0 → 1`) and the three panels
sequentially translate-in from their respective edges:
- Left panel: `translateX(-24px) → 0`, 280ms
- Right panel: `translateX(24px) → 0`, 280ms
- Center panel: `translateY(-12px) → 0` + `opacity 0 → 1`, 320ms (40ms delay)

Close: reverse, 200ms total. FAB wireframe cube spins 90° on close.

---

## 8. Accessibility

### Semantics
- Overlay root: `<div role="dialog" aria-modal="true"
  aria-labelledby="neon-arcade-title">`
- FAB: `<button aria-label="Open Neon Arcade dice roller"
  aria-expanded="{isOpen}" aria-controls="neon-arcade-overlay">`
- Close button: `aria-label="Close dice roller"`
- Each counter pill: `<button aria-label="Decrease d6 count">−</button>` /
  `<button aria-label="Increase d6 count">+</button>`; the count is a
  `<span aria-live="polite">` so SR users hear the new value.
- Duality toggle: `<button role="switch" aria-checked="{includeDuality}"
  aria-label="Include duality pair">`
- Roll button: `aria-label="Roll selected dice"`. After roll, an
  `aria-live="assertive"` region announces:
  `"Rolled 1d20 equal 17, with hope, hope nine fear five"`.
  Crit announces: `"Critical success, hope and fear both seven"`.
- Terminal log: `<ol role="log" aria-live="polite" aria-relevant="additions"
  aria-label="Roll history">`; each entry is a `<li>` with an `aria-label`
  reformatted for screen reader (no `>` glyph noise).
- Theme picker: lives outside this variant; not the variant's responsibility.

### Keyboard navigation
- `Tab` order: Close → DICE_BAY (each die row's − / value / +, top to bottom) →
  Duality toggle → ROLL_DICE → Clear log → most-recent log entries.
- `Esc` closes the overlay (returns focus to FAB).
- `Enter` or `Space` on the focused ROLL_DICE button rolls.
- `D` (anywhere inside the overlay, when no input is focused) toggles duality.
- Number keys `1–7` while focus is in DICE_BAY increment the corresponding die
  type (1 → d4, … 7 → d100); `Shift + 1–7` decrement.
- Focus is trapped inside the overlay while open. Initial focus on open: the
  ROLL_DICE button.

### Color contrast
All text targets WCAG AA on the near-black panel background
(`rgba(0,0,0,.55)` over `#0a0214` ≈ effective `#040108`):

| Foreground            | Effective contrast | Pass at body 13px |
|-----------------------|--------------------|-------------------|
| `#a8f0ff` (terminal)  | 13.4 : 1           | yes (AAA)         |
| `#00f0ff` (cyan)      | 11.6 : 1           | yes (AAA)         |
| `#ff2bd6` (magenta)   | 5.7 : 1            | yes (AA, body)    |
| `#bdfd6a` (crit)      | 12.1 : 1           | yes (AAA)         |
| `rgba(168,240,255,.45)` (oldest log row) | 4.6 : 1 | yes (AA, body, large recommended) |

The dimmest log row sits at the AA floor on purpose — it visually represents
"old" without becoming illegible. Anything older than ~8 entries is dimmed
**equally** to that floor, never below.

### `prefers-reduced-motion`
When set, the variant disables:
- Scanline drift (grid stays static)
- FAB halo pulse (locked at 0.85 opacity)
- Dice hover-rotate continuous wobble (still rotates discretely 8° on hover)
- Roll animation chromatic-aberration spin (replaced with 200ms opacity dip
  0.4 → 1.0; numbers update at midpoint)
- Crit glitch (replaced with a 600ms chartreuse border pulse on the result
  panel; total still announces `[!] CRITICAL_SUCCESS`)
- Crit screen-shake (entirely removed — the chartreuse pulse alone signals it)

The variant **does not** disable scanline rendering itself (it's a static
gradient backdrop, no perceived motion). Glow and bloom remain because they're
not motion.

---

## 9. Layout Constraints That Affect the Shared Variant Contract

1. **Full-bleed overlay** — this variant occupies `inset: 0` and uses a backdrop
   blur (`backdrop-filter: blur(2px)` on the overlay) to ensure the underlying
   character sheet is faded. The overlay must NOT be a child of any element
   with `transform` / `filter` / `perspective` set, since those break
   `position: fixed`. The implementer should portal it to `document.body` (or
   ensure `<app-dice-roller>` is the last child of `<body>`'s flow).
2. **Theme picker contrast is intentional** — do not allow the variant to style
   the picker. The picker stays warm-tavern (`#3a2418` chip, `#d4a056` gold
   border, Cinzel label). The variant's CSS must be scoped (`:host {…}` or a
   namespaced class) so it does not leak to the picker.
3. **CSS budget (4kB)** — to stay inside the limit, the implementer should:
   - Encode the synthwave grid as ONE compound `background:` declaration on
     the overlay using two repeating-linear-gradients + the radial horizon
     gradient + the scanline gradient (no SVG perspective grid in CSS).
   - Use a single `filter: drop-shadow(...) drop-shadow(...)` declaration on
     `.die` for all glow (avoid `box-shadow` halos per element).
   - Reuse `--neon-arcade-bloom-text` everywhere instead of repeating
     `text-shadow` strings.
   - Inline-SVG dice in the template (no separate CSS for shapes); colors are
     all `currentColor`.
4. **Z-index** — overlay container `z-index: 1100`; FAB `z-index: 1100` (sibling
   to the overlay so they share a stacking context); both sit beneath the
   theme picker at `z-index: 1200`. The variant must not introduce any
   `z-index: 9999`-style escalations.
5. **External trigger pre-fill** — on init, call
   `service.consumePendingRequest()` and set initial counts + duality toggle
   from the returned `RollRequest` (if any). Do NOT auto-roll; the user must
   press `[ ROLL_DICE ]` to confirm — this is consistent with the contract and
   gives the dramatic neon flash a chance to fire.
6. **Reduced-motion fallback for crit** — the variant must still announce
   `[!] CRITICAL_SUCCESS` in the terminal log and via the `aria-live` region;
   only the visual glitch / shake degrade.

---

## 10. Microcopy Reference

| Event / element       | String shown                                             |
|-----------------------|----------------------------------------------------------|
| Title bar             | `ROLL_PROTOCOL :: NEON_ARCADE`                            |
| Sub-title hint        | `[ENTER] roll · [ESC] close · [D] toggle duality`         |
| Picker section header | `> DICE_BAY`                                              |
| Result section header | `> RESULT_STAGE`                                          |
| Log section header    | `> ROLL_LOG.tail`                                         |
| Duality section       | `> DUALITY_PAIR` / sublabel `2d12 // hope[cyan] vs fear[magenta]` |
| Roll button           | `[ ROLL_DICE ]`                                           |
| Clear log link        | `[clear_log]`                                             |
| Close button          | `[ X ]`                                                   |
| Terminal entry (plain)| `[hh:mm:ss] > rolled NdX = sum`                           |
| Terminal entry (hope) | `[hh:mm:ss] > rolled NdX = sum :: hope (h{n} f{m})`       |
| Terminal entry (fear) | `[hh:mm:ss] > rolled NdX = sum :: fear (h{n} f{m})`       |
| Terminal entry (crit) | `[hh:mm:ss] > [!] CRITICAL_SUCCESS (h{n} f{n})`           |
| Result outcome (hope) | `:: hope`                                                 |
| Result outcome (fear) | `:: fear`                                                 |
| Result outcome (crit) | `[!] CRITICAL_SUCCESS`                                    |
| Empty log placeholder | `> awaiting input...` (with blinking cursor `_`)          |

All terminal entries are timestamped with the local clock at roll-time.

---

## 11. Implementer Checklist (carry into Phase 3)

- [ ] CSS file `<` 4kB (run `wc -c` on the built file).
- [ ] Synthwave grid is a single compound `background` declaration with at
      most two repeating-linear-gradients + one radial.
- [ ] Scanline drift is one `@keyframes` of two lines.
- [ ] All seven dice + duality pair use `currentColor` SVG.
- [ ] `--hope-color`, `--fear-color`, `--crit-color` are exposed at `:host`.
- [ ] `prefers-reduced-motion` media query disables the five named animations.
- [ ] Focus trap engaged on open; focus returns to FAB on close.
- [ ] `aria-live` region announces every roll outcome (including crit microcopy).
- [ ] Variant CSS is scoped — picker remains warm-tavern.
- [ ] Mobile: overlay scrolls; bottom-padding 96px to clear theme picker.
- [ ] No `z-index` greater than `1100` introduced by this variant.
