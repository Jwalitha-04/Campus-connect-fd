# Campus Connect — "The Print Room" Riso-Flyer Design Spec

A bold, ink-and-paper visual system inspired by student-union risograph printing rather than pinboards. Every post is a **two-color flyer**, screen-printed with visible ink grain and a signature slight color-channel misregistration — the imperfect, slightly-off-register look of a real riso press. Where a corkboard is nostalgic and static, this direction is **loud, graphic, and alive with print texture** — closer to a zine table than a bulletin board.

*Concept name: "The Print Room" — imagine the campus print shop that runs off flyers for every lost item, skill trade, and club post. Each one comes off the press slightly imperfect, gets stapled up, and — uniquely — gets *torn* by whoever acts on it, exactly like tearing a phone-number tab off a real flyer.*

---

## 1. Spatial Metaphor: The Flyer Wall

Instead of biomes or cork zones, the three sections are three **ink runs on the same press** — same paper stock, same grain, different two-color riso combinations.

```text
   Riso Orange + Black       Riso Marine + Black       Riso Purple + Black
+-------------------+-------------------+-------------------+
|                   |                   |                   |
|   Lost & Found    |    Skill Swap     |     Community     |
|  (Flyer + tabs)   |  (Trade chits)    |  (Zine pages)     |
|                   |                   |                   |
+-------------------+-------------------+-------------------+
      <--- same uncoated paper stock & grain run through all three --->
```

### Layout Rules
* **Uncoated paper base:** the page background is a warm, slightly grey-white paper tone (`--paper-stock`) with a fine visible grain/fiber texture — never pure white, never a cork or gradient.
* **Flyers, not cards:** every content item is printed in exactly **two ink colors + black**, riso-style, on top of the paper stock. Photos and illustrations render as halftone dot patterns, never full-color raster.
* **Misregistration as signature detail:** each flyer's second ink layer sits offset by 1–2px from the black key layer, exactly like a real riso print run — this single detail carries most of the "handmade print shop" identity.
* **Layering (Z-index hierarchy):**
  1. *Background:* static paper-stock texture (fiber grain, no animation).
  2. *Ink layer:* the flat two-color riso print (headline, illustration, borders).
  3. *Misregistration ghost:* a faint offset duplicate of the ink layer in the second color, sitting 1–2px off, at low opacity — the "print imperfection."
  4. *Fastener layer:* a single visible staple (two short parallel lines + a bent leg) at the top edge, rendered in flat grey.
  5. *Tab layer:* a perforated strip of tear-off tabs along the bottom edge — this is the primary action surface (see §4B).
  6. *Overlay:* toast notifications styled as small torn corner scraps.
* **Density & grid:** flyers overlap slightly at the corners in a loose masonry grid, at consistent slight rotation per column (not per card) — like a real wall where rows were pinned up at once, not randomly scattered.

---

## 2. Color System: Riso Ink Palette on Paper Stock

| Token | Value (Light) | Value (Dark) | Purpose |
| :--- | :--- | :--- | :--- |
| `--paper-stock` | `#F2EEE4` | `#1C1A16` | Page background, uncoated paper tone |
| `--paper-grain` | `rgba(30,25,15,0.05)` | `rgba(255,255,255,0.04)` | Fiber/grain texture overlay |
| `--ink-black` | `#201D1A` | `#EDEAE2` | Key line, headlines, staples |
| `--riso-orange` | `#FF6B35` | `#D9552A` | Lost & Found primary ink |
| `--riso-marine` | `#0074B3` | `#3E93C9` | Skill Swap primary ink |
| `--riso-violet` | `#7B4FE0` | `#9974EA` | Community primary ink |
| `--riso-yellow` | `#FFD23F` | `#E0B92E` | Shared accent ink (tags, stamps) |
| `--tab-perforation` | `rgba(32,29,26,0.25)` | `rgba(237,234,226,0.25)` | Dashed tear line between tabs |
| `--misreg-ghost` | *category ink at 55% opacity, offset 1.5px* | same | Print-misregistration ghost layer |
| `--success-ink` | `#1E8A5C` | `#2FA873` | Confirmed / matched stamp ink |

Each section uses **only its ink color + black** on the paper stock — never a gradient, never more than two inks — which is what makes each flyer read as "printed" rather than "designed in Figma."

---

## 3. Typography Hierarchy

* **Headlines (Display):** `Archivo Black` — a heavy, condensed-adjacent grotesk built for screen-printing at small sizes; reads as bold classifieds/zine typography rather than an editorial serif.
* **Body & UI Controls (Sans):** `Space Grotesk` — a modern grotesk with slightly quirky proportions, used for body copy and controls, distinct enough to feel intentional without ever competing with the headline weight.
* **Handwritten Annotations:** `Permanent Marker` — used *sparingly*, only for one-off annotations that look scrawled directly onto a flyer post-print ("still available!", "SWAPPED"), never for structural UI text.
* **Tab / Stub Numbers:** `Space Mono` — small printed reference numbers on each tear-tab, styled like a raffle-ticket stub.

---

## 4. Component Design Language

### A. The Riso Flyer (Post Card)
* **Shape:** a clean rectangle — no torn edges, no rounded corners, no pins. The visual interest comes entirely from print texture, not silhouette.
* **Ink layer:** headline + border rules in `--ink-black`; category accents, chips, and any illustration in the section's riso ink.
* **Misregistration ghost:** the border/headline is duplicated in the ink color at low opacity, offset by 1.5px down-right — a CSS `text-shadow`/duplicated-element trick, not a texture image.
* **Photo treatment:** any image content renders through a halftone-dot filter in the section's ink color, never as a full-color photo — keeps every flyer feeling like it came off the same press.
* **Shadow:** minimal — a single flat 2px offset "print shadow" in `--ink-black` at 8% opacity, not a soft blurred drop shadow. Flyers look stapled flat to a wall, not floating.

### B. The Tear-Off Tab Strip (Action) — *the signature interaction*
* Along the bottom edge of every flyer runs a perforated strip of 3–5 small tabs (dashed line between each), exactly like a lost-cat flyer's phone-number fringe.
* Each tab carries a short label instead of a phone number: **"CLAIM"**, **"SWAP"**, **"JOIN"** depending on section.
* **Tapping/clicking a tab visually tears it away** from the flyer (a short clip-path animation peels the tab down and off, revealing the jagged perforation edge left behind) — this *is* the claim/swap/join action, not a separate button below the card.
* Once torn, the tab is gone from that flyer for that user — a small "torn" indicator remains, so the flyer visually shows how many tabs have been taken.

### C. Perforated Forms (Inputs)
* Form fields are boxed with a **dashed perforation border** rather than a solid outline or dotted underline — reinforcing "this is part of a printed sheet, not a floating UI box."
* Focus state: the dashed border solidifies to solid `--ink-black` and the section's ink color fills in as a thin top rule above the field, like a freshly-inked line.

---

## 5. Tailwind / CSS Configuration Extension

```css
:root {
  --paper-stock: #F2EEE4;
  --ink-black: #201D1A;
  --riso-orange: #FF6B35;
  --riso-marine: #0074B3;
  --riso-violet: #7B4FE0;
  --riso-yellow: #FFD23F;
  --success-ink: #1E8A5C;
}

@keyframes press-print-in {
  0%   { clip-path: inset(0 0 100% 0); opacity: 0; }
  60%  { clip-path: inset(0 0 0% 0); opacity: 1; }
  100% { clip-path: inset(0 0 0% 0); opacity: 1; }
}

@keyframes misreg-settle {
  0%   { transform: translate(4px, -3px); opacity: 0; }
  100% { transform: translate(1.5px, 1.5px); opacity: 0.55; }
}

@keyframes tab-tear {
  0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
  40%  { transform: translateY(6px) rotate(-6deg); opacity: 1; }
  100% { transform: translateY(28px) rotate(-14deg); opacity: 0; }
}

@keyframes staple-snap {
  0%   { transform: scaleY(0.4); opacity: 0; }
  100% { transform: scaleY(1); opacity: 1; }
}

@keyframes stamp-thud {
  0%   { transform: scale(1.8) rotate(-6deg); opacity: 0; }
  55%  { transform: scale(0.92) rotate(-6deg); opacity: 1; }
  100% { transform: scale(1) rotate(-6deg); opacity: 1; }
}
```

---

## 6. Icons & SVGs (Custom Assets)

### A. Halftone Category Badge
Rather than a solid color chip, category badges render as a small halftone dot cluster in the section ink, with a white label reversed out of the center:

```xml
<svg width="72" height="24" viewBox="0 0 72 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="halftone" width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="#FF6B35" />
    </pattern>
  </defs>
  <rect width="72" height="24" fill="url(#halftone)" />
  <rect width="72" height="24" fill="#FF6B35" opacity="0.15" />
</svg>
```

### B. Perforation Tear-Line Utility (CSS)
```css
.perf-line {
  background-image: linear-gradient(to right, var(--tab-perforation) 50%, transparent 0%);
  background-size: 6px 1px;
  background-repeat: repeat-x;
}
```

### C. Staple SVG
```xml
<svg width="20" height="10" viewBox="0 0 20 10" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 1 L2 5 M18 1 L18 5 M2 5 L18 5" stroke="#6B6862" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>
```

### D. Misregistration Ghost Utility (CSS)
```css
.riso-ghost {
  position: relative;
}
.riso-ghost::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  color: var(--section-ink, var(--riso-orange));
  opacity: 0.55;
  transform: translate(1.5px, 1.5px);
  z-index: -1;
}
```

---

## 7. Micro-Interactions & Animations

1. **Press Print-In:** new flyers reveal top-to-bottom like paper feeding through a press (`animate-press-print-in`) — a wipe reveal, not a fade or drop.
2. **Misregistration Settle:** the ghost ink layer drifts in from a slightly larger offset and settles to its resting 1.5px position (`animate-misreg-settle`) on first render — a quick, subtle one-time effect.
3. **Staple Snap:** the staple graphic scales in vertically on card mount (`animate-staple-snap`), a tiny mechanical "fastening" beat.
4. **Tab Tear (core interaction):** tapping a tab plays `animate-tab-tear` — the tab rotates and falls away, the perforation edge left behind redraws as jagged, and the flyer's remaining-tabs count updates.
5. **Stamp Confirmation:** on success (item recovered, swap completed), a rotated rubber-stamp graphic thuds onto the flyer (`animate-stamp-thud`) in `--success-ink`.
6. **Ink Hover:** on hover, the misregistration ghost briefly nudges 1px further off-axis and back — a subtle "press vibration" wink, replacing a generic lift/shadow hover.

---

## 8. Sound Design (optional, off by default)

Print-shop mechanical palette, distinct from generic UI chimes:

| Action | Sound |
| :--- | :--- |
| New flyer prints in | Soft riso-drum roll (short paper-feed whir) |
| Tab tear | Sharp paper-perforation *rrrip* |
| Staple snap | Quick metallic click |
| Stamp confirmation | Rubber-stamp thud |
| Tab hover | Barely-audible paper-tension creak |

Off by default, togglable, respects a persisted `soundEnabled` preference, all clips under 300ms.

---

## 9. Time-of-Day / Print-Run Ambient Theming

Rather than lighting simulation, the paper stock and ink saturation can shift like different **print runs**:

* **Morning run:** inks slightly desaturated, paper reads paler — "first run of the day."
* **Midday run:** full ink saturation, sharpest misregistration contrast.
* **Evening run:** inks shift warmer, paper stock deepens toward cream.
* **Night run (dark mode):** paper stock inverts to a deep charcoal "newsprint at night" tone; inks brighten slightly so flyers still pop against the dark stock.

Manual light/dark toggle always overrides ambient mode; ambient mode is opt-in.

---

## 10. Micro-Personalization ("Your Ink")

* Each user is assigned a unique secondary ink tint (deterministic hash of their name → hue), used as a thin corner triangle on flyers they post — like a small printer's mark identifying who ran that sheet.
* A user's own tab-tear history is tracked as a small "stub collection" on their profile — visually a fanned stack of the tabs they've torn off over time.
* Optional "ink weight" picker: users can nudge their own flyers' line weight slightly bolder/lighter — small, purely cosmetic personalization.

---

## 11. Theme States (In-Theme UI States)

* **Empty State (Lost & Found):** a single blank flyer template sits centered, unprinted — just the black key-line border, no ink yet.
  > "Press is idle. Nothing's run yet."
* **Loading State:** three flyer outlines fill in top-to-bottom in sequence, like sheets feeding through a press one at a time.
  > "Running the press…"
* **Error State:** a flyer's ink layer misregisters badly (ghost offset jumps to 6px, jittering) before settling to a flat grey "misprint" look.
  > "That one jammed the press. Try again." (Retry rendered as a small tab.)
* **Success/Celebration State:** the stamp-thud animation (§7.5) plays, ink briefly shifts to `--success-ink`, then settles back to the section's category ink after a couple seconds.

---

## 12. Accessibility & Contrast

* **Font Legibility:** `Archivo Black` is reserved for short headlines only; all body copy and controls use `Space Grotesk` at weights ≥400 for legibility; `Permanent Marker` never appears in body text or controls.
* **Contrast Safeguards:** `--ink-black` (#201D1A) against `--paper-stock` (#F2EEE4) clears WCAG AAA; dark-mode pairing maintains equivalent contrast. The misregistration ghost is decorative and always kept below body-text contrast thresholds so it never doubles as required text.
* **Touch Targets:** each tear-off tab has a minimum 48×48px hit area even though its visible perforated shape is smaller — the tear animation plays from a tap anywhere in that zone.
* **Screen Reader Focus:** halftone badges, staple, and misregistration ghost SVGs are `aria-hidden="true"`; the tear-tab action is exposed as a real, labeled button ("Claim this item") to assistive tech, independent of the visual tear animation.
* **Motion Safety:** `press-print-in`, `misreg-settle`, and `tab-tear` all respect `@media (prefers-reduced-motion: reduce)` — reduced-motion users get an instant state change with no wipe/tear animation.
* **Sound Safety:** sound defaults to off, requires explicit opt-in, never autoplays.
* **Color independence:** every flyer carries a text category label regardless of ink color, so colorblind users never rely on orange/marine/violet alone.

---

## 13. Reference Components (React + CSS)

### Component 1: The Riso Flyer Card
```jsx
import React from 'react';

const INK = {
  lost: '#FF6B35',
  found: '#0074B3',
  skill: '#0074B3',
  community: '#7B4FE0',
};

export function RisoFlyerCard({ item, category = 'lost' }) {
  const ink = INK[category];
  return (
    <div
      className="relative bg-paper-stock border-2 border-ink-black px-5 pt-5 pb-2 animate-press-print-in"
      style={{ '--section-ink': ink }}
    >
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-staple-snap">
        <svg width="20" height="10" viewBox="0 0 20 10">
          <path d="M2 1 L2 5 M18 1 L18 5 M2 5 L18 5" stroke="#6B6862" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      <span
        className="inline-block text-[11px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 text-white mb-3"
        style={{ background: ink }}
      >
        {item.categoryLabel}
      </span>

      <h3
        className="riso-ghost font-display text-2xl uppercase leading-none mb-2 text-ink-black"
        data-text={item.title}
      >
        {item.title}
      </h3>

      <p className="font-sans text-sm text-ink-black/70 leading-relaxed mb-4">
        {item.description}
      </p>

      <div className="flex justify-between items-center text-xs font-sans text-ink-black/60 mb-2">
        <span>{item.location}</span>
        <span className="font-mono text-[10px]">Stub #{item.id}</span>
      </div>

      <TabStrip item={item} category={category} />
    </div>
  );
}

function TabStrip({ item, category }) {
  const [tornTabs, setTornTabs] = React.useState([]);
  const tabs = category === 'skill' ? ['SWAP'] : category === 'community' ? ['JOIN'] : ['CLAIM'];

  return (
    <div className="perf-line pt-2 flex gap-2">
      {tabs.map((label) => {
        const torn = tornTabs.includes(label);
        return (
          <button
            key={label}
            disabled={torn}
            onClick={() => setTornTabs((t) => [...t, label])}
            className={`min-h-[48px] px-4 font-mono text-xs font-bold border border-dashed border-ink-black/40 transition-all ${
              torn ? 'animate-tab-tear pointer-events-none' : 'hover:bg-ink-black/5'
            }`}
            aria-label={`${label} this item`}
          >
            {torn ? '· · ·' : label}
          </button>
        );
      })}
    </div>
  );
}
```

### Component 2: Stamp Confirmation Overlay
```jsx
import React from 'react';

export function StampConfirmation({ label = 'CLAIMED' }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
      aria-hidden="true"
    >
      <span
        className="font-display text-3xl uppercase border-4 px-4 py-1 animate-stamp-thud"
        style={{ color: 'var(--success-ink)', borderColor: 'var(--success-ink)', transform: 'rotate(-6deg)' }}
      >
        {label}
      </span>
    </div>
  );
}
```

### Component 3: Print-Run Halftone Photo Wrapper
```jsx
import React from 'react';

// Wraps any image in a CSS-only halftone/duotone filter matching the section ink,
// so all photo content reads as "printed" rather than full-color.
export function HalftonePhoto({ src, alt, ink = '#FF6B35' }) {
  return (
    <div className="relative overflow-hidden border border-ink-black/20" style={{ filter: 'grayscale(1) contrast(1.4)' }}>
      <img src={src} alt={alt} className="w-full h-full object-cover mix-blend-multiply" />
      <div
        className="absolute inset-0 mix-blend-color"
        style={{ background: ink }}
      />
    </div>
  );
}
```
