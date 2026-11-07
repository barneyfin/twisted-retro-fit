# WispCounter

The score in play: a small HUD plaque, top right, counting echo (wisps until version 12).

## When to use
- Always during play, the rightmost thing in the HUD. Each defeated monster's pale wisp rises towards it, and the number goes up when it arrives.

## Markup
```html
<div class="lb-ui lb-plaque is-hud lb-counter" role="status" aria-label="450 echo">
  <div class="lb-face"><span class="lb-counter-label" aria-hidden="true">Echo</span><span class="lb-counter-num" aria-hidden="true">0450</span></div>
</div>
```
Add `is-phone` for 96px wide.

## The game provides
- The score.

## Rules
- 104px wide (96 on a phone), `hud-face`, `chamfer-hud`. ECHO in `counter-label`, `wisp-label`; the number in `counter`, padded to four places with zeros, tabular, `heading`.
- Past 9999 it shows all the digits; the plaque does not grow, so a game expecting more than five digits widens it.
- It does not flash or bounce. Screen readers hear the score only when asked, not at every wisp.

## Version 8
- On a phone the WISPS label is 12px (no text in play under 12px on a phone). In Hysteria (later) the same plaque shows the clock: TIME over minutes and seconds.

## Version 12
- **The rename** (PRD question 12, Barney, 7 November 2026): the label reads ECHO, and screen readers hear "450 echo". Echo has no plural. Only the word changes: each defeated monster's pale wisp still rises towards the counter, and the plaque, sizes and figures are as before. The component keeps its name.
