# PlaqueLine

A short line on a HUD plaque, under the HUD's top row in the middle, when a spell or the sword gets better or a potion is first kept; the same plaque, larger, for the boss's name as it arrives. Agreed in step 4b round 10.

## Markup
`lb-plaque is-hud lb-line` (a picture and `lb-line-text`); `lb-line is-name` with an `lb-rule` under the name. `HUD.setLine(el, {kind, text, u})`.

## Rules
- 40 px tall like the tiles (44 on a phone); the line in IM Fell English 22 px (20); the item's picture from the loot (the scroll's spell, the sword, the rune stone).
- It drops in 8 px as it fades in, stays, fades: 2 s; play goes on; two at once take turns. The name plaque: 30 px (26 on a phone), 2.6 s.
- The lines (Barney, 4 November 2026): "Heal mastered", "Fireball mastered" (a spell's first scroll); "Heal: restores deeper", "Fireball: glows brighter" (a later one); "Sword: reaches beyond", "Sword: bites deeper"; "Again, harder" (later, no picture).

## Version 11
- **It moves down**, under the HUD's top row, centred: 99px from the top on a computer, 89 on a phone. It sat level with the plaque, and on a phone the longer lines overlapped it ("Fireball: glows brighter" by 9px, "Sword: reaches beyond" by 6). Now no line meets the plaque, the potion sockets or the tiles at any width. The boss's name plaque moves with it.
- **The potions' lines**, the first time each kind is kept, once each: "Kept for later. Tap to drink" on a phone; "Kept for later. Q to drink" (health) and "Kept for later. E to drink" (mana) on a computer. The picture is the potion (`potH`, `potM`).

## Version 13
- **A Grace bound**: as play resumes after the pick, the line shows the Grace's picture (GracePick's, drawn at 22px in the line's strokes; a strong Grace's in `grace-strong`) and "{name} bound", for example "Iron Skin bound" (agreed by Barney, 7 November 2026). The kit takes the picture as a `kind` like the loot's.
- **The Grave Refuses**, when it saves him: "The grave refuses you", with its picture.
- **"Again, harder" is no longer a plaque line**: the second loop's place cards carry it under each place's name (PlaceCard).
- **The scroll on the path** uses the spell's usual line ("Fireball mastered").
