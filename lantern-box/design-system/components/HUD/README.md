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

## Version 11
- **The potion sockets** (round 13): one health potion and one mana potion can be kept and drunk when the player chooses. Two sockets of their own, 8px under the plaque's left end (`lb-potions` of `lb-potion`, in `lb-hud-left`), 40px on a computer as the tiles, 44px on a phone. See Potions.
- `HUD.build(stage, phone, {pot: "under"})` writes them ("beside" puts them inside the plaque, the option not chosen); `HUD.set` takes `potions: {health, mana}` and `potFx: {k, kind: "keep"|"drink", u}`; `HUD.OPTS.rm` and `HUD.OPTS.fxOff` give the moments' Reduce motion and Effects off versions.
- **The plaque line moves** under the HUD's top row, centred: 99px down on a computer, 89 on a phone (see PlaqueLine).

## Version 12
- **The counter counts echo** (WispCounter): the label ECHO; the HUD builder writes it (`HUD.build`), and the state keeps its key, `wisps`.
- **Up to three potions of each**: pips under each socket once a second is bought (Potions); `HUD.set` takes `potions` as counts and `potCap`.
- **Teaching in play** on a first run sits over play beside the HUD, never over it (Teaching).
