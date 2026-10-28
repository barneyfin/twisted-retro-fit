# Signs

The World's signs, the wall overhead that City Nights is remembered by: lightboxes, neon, vertical signs and a few special ones, each a face or tube colour with its ink.

## When to use
- The kit hangs them over the street from its own sign list; a game uses the kit's street and does not make its own signs.
- The preview draws them in HTML for reference. The game draws them once with the 2D canvas into its texture, sized to each sign, then on the graphics chip.

## Markup
Reference only:
```html
<div class="cn-sign is-box" style="--face-c:var(--face-green);--glow-c:var(--face-green);--ink-c:var(--ink-cream)">
  <span class="face"></span><span class="zh">星光冰室</span><span class="en">STARLIGHT ICE CAFE</span></div>
<div class="cn-sign is-neon" style="--tube-c:var(--tube-yellow);--tube2-c:var(--tube-red)">
  <span class="tube"></span><span class="zh">好味麵家</span><span class="en">HO MEI NOODLE</span></div>
```

## The game provides
- Nothing. New signs are a change to the kit: invented names, everyday Chinese on the word list first.

## Rules
- **Lightbox** (`box`): a dark case, a lit face from the face colours with a light band through its middle, a 1px light line inside, a glow of its own face colour. Chinese in `sign-zh` filling about 84% of the width and half the height; English in `sign-en` under it at about 17% of the height. Pairs: `face-cream`/`face-white` + `ink-red` (or `ink-blue`), `face-yellow` + `ink-black`, `face-red` + `ink-yellow`, `face-green` + `ink-cream`, `face-teal`/`face-blue` + `ink-white`.
- **Neon** (`neon`): a near-black board with an edge tube 7% in; Chinese in `sign-zh-neon` in the first tube colour, English in the second; each letter a white-hot core with the tube's edge and glow.
- **Vertical** (`vert`): a lightbox or neon sign one character to a line, hung from the buildings' fronts.
- **Special**: the pawnbroker's 押 in a ring on dark red, the car park's blue P with a red neon FULL, the shop-front signs over doors (便利店, 街市, 商場) and the police station's blue 警署.
- Signs carry no grain (`grain-signs`) and a dark halo behind them so they read against the buildings. One sign, 原子桑拿 ATOMIC SAUNA, flickers, well under the 3-a-second limit.
