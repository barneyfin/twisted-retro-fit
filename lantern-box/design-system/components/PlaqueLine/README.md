# PlaqueLine

A short line on a HUD plaque at the top middle when a spell or the sword gets better; the same plaque, larger, for the boss's name as it arrives. Agreed in step 4b round 10.

## Markup
`lb-plaque is-hud lb-line` (a picture and `lb-line-text`); `lb-line is-name` with an `lb-rule` under the name. `HUD.setLine(el, {kind, text, u})`.

## Rules
- 40 px tall like the tiles (44 on a phone); the line in IM Fell English 22 px (20); the item's picture from the loot (the scroll's spell, the sword, the rune stone).
- It drops in 8 px as it fades in, stays, fades: 2 s; play goes on; two at once take turns. The name plaque: 30 px (26 on a phone), 2.6 s.
- The lines (Barney, 4 November 2026): "Heal mastered", "Fireball mastered" (a spell's first scroll); "Heal: restores deeper", "Fireball: glows brighter" (a later one); "Sword: reaches beyond", "Sword: bites deeper"; "Again, harder" (later, no picture).
