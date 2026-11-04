# HUD

The play screen's HUD as agreed in step 4b round 9: Vitals grown (health with its armour slots, mana, a lantern per life, the spell's socket), the "?" tile beside pause, the wisps counter, the boss bar in a fight, and the phone's touch controls.

## Markup
`play.js`'s `HUD.build(stage, phone)` writes it (Vitals `lb-vitals is-full`, `lb-pips`, `lb-lives`, `lb-spell`, the tiles, `lb-counter`, `lb-bossbar`, `lb-line`, `lb-card`, `lb-touch`); `HUD.set(hud, state)` shows a state.

## Rules
- Top left, one plaque in three rows (rows 240 px, 214 on a phone): health with its heart, then three armour slots continuing the health line (a shield pip fills each one held; empty slots are faint outlines; a hit cracks the last in two and it falls, 0.4 s); mana with its flame; a small gold lantern per life (a spent life's lantern stays, dark; it gutters out with a puff of smoke).
- The spell socket at the right end, 44 px (a thumb's target on a phone): the chosen spell's picture; empty and dim until a spell is learnt; two diamonds when two are known, the lit one chosen; switching turns it over like a card; dimmed while mana is short of its cost. A tap switches on a phone, L on a computer.
- Top right: full screen (computers only), "?", pause, the wisps (in Hysteria, the clock: TIME over minutes and seconds).
- A clue besides colour for everything: the heart and the thicker bar, the flame and the thinner bar, a shield solid or an outline, a lantern lit or dark, the spell's picture, the boss's name.
- On a phone: no text in play under 12 px (the WISPS label is 12 px), nothing read mid-fight under 16 px, no icon under 12 px tall, no target under 44 px. The HUD sits 12 px in and 10 px down, plus the phone's safe margin.
- Nothing flashes or bounces.
