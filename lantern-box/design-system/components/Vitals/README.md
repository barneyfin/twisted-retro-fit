# Vitals

Health and mana in one HUD plaque, top left: a heart and the red health bar, a flame and the teal mana bar.

## When to use
- Always during play, top left of the HUD. In a game with no mana, the mana row is left out and the plaque is one row.

## Markup
```html
<div class="lb-ui lb-plaque is-hud lb-vitals" role="group" aria-label="Health 80 per cent, mana 75 per cent">
  <div class="lb-face">
    <div class="lb-bar-row">{heart 14 x 13}<div class="lb-bar" style="--v:80%"><i></i></div></div>
    <div class="lb-bar-row">{flame 14 x 14}<div class="lb-bar is-mana" style="--v:75%"><i></i></div></div>
  </div>
</div>
```
Add `is-phone` for 206px wide.

## The game provides
- Health and mana as fractions, by setting `--v` on each bar, and the group's label in words.

## Rules
- 232px wide (206 on a phone), `hud-face`, `chamfer-hud`, padded 9px 12px, rows 6px apart.
- Health 10px tall, `health-top` to `health-low`; mana 7px, `mana-top` to `mana-low`; both in a `track` with a `track-line` edge, so the empty part shows. Icons `brass`.
- Bars change in steps as the game sets them; no flashing when low. Hits are shown on the wanderer in the World.

## Version 8
- Grown into three rows (`lb-vitals is-full`): health with three armour slots continuing its line, mana, a lantern per life, and the spell's socket at the right. See HUD for the whole plaque, its moments and its rules.

## Version 11
- The two potion sockets sit 8px under the plaque's left end, each potion under its own bar (the heart above the health potion, the flame above the mana potion). The plaque itself is unchanged. See Potions.
