# PlayScreen

Play on a computer: the street fills the window; the meter bottom left with the district above it; full-screen and pause tiles top right. Nothing else.

## When to use
- Throughout play. On a phone held sideways the layout is the same at the phone's scale (Meter shows both).

## Markup
```html
<canvas class="cn-world"></canvas>                  <!-- the street, WebGL -->
<canvas class="cn-hud"></canvas>                    <!-- the meter and the caption, redrawn when a number changes -->
<div class="cn-ui cn-tiles" style="position:absolute;right:24px;top:24px">{IconTile: full screen, pause}</div>
```

## The game provides
- The fare, time and speed for the meter, and the taxi's district for the caption.

## Rules
- No panels, chips or bars over the picture during play: the meter is the HUD.
- Tiles `space-6` from the edges on a computer, `edge-phone` plus the safe area on a phone; pause last, at the edge.
- The touch hint shows on phones until the first move.
