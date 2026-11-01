# WispCounter

The score in play: a small HUD plaque, top right, counting wisps.

## When to use
- Always during play, the rightmost thing in the HUD. Each defeated monster's pale wisp rises towards it, and the number goes up when it arrives.

## Markup
```html
<div class="lb-ui lb-plaque is-hud lb-counter" role="status" aria-label="450 wisps">
  <div class="lb-face"><span class="lb-counter-label" aria-hidden="true">Wisps</span><span class="lb-counter-num" aria-hidden="true">0450</span></div>
</div>
```
Add `is-phone` for 96px wide.

## The game provides
- The score.

## Rules
- 104px wide (96 on a phone), `hud-face`, `chamfer-hud`. WISPS in `counter-label`, `wisp-label`; the number in `counter`, padded to four places with zeros, tabular, `heading`.
- Past 9999 it shows all the digits; the plaque does not grow, so a game expecting more than five digits widens it.
- It does not flash or bounce. Screen readers hear the score only when asked, not at every wisp.
