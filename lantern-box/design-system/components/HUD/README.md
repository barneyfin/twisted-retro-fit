# HUD

The play screen's HUD as agreed in step 4b round 9: Vitals grown (health with its armour slots, mana, a lantern per life, the spell's socket), the "?" tile beside pause, the wisps counter, the boss bar in a fight, and the phone's touch controls.

## Markup
`play.js`'s `HUD.build(stage, phone)` writes it (Vitals `lb-vitals is-full`, `lb-pips`, `lb-lives`, `lb-spell`, the tiles, `lb-counter`, `lb-bossbar`, `lb-line`, `lb-card`, `lb-touch`); `HUD.set(hud, state)` shows a state.

## Rules
- Top left, one plaque in three rows (rows 240 px, 214 on a phone): health with its heart, then three armour slots continuing the health line (a shield pip fills each one held; empty slots are faint outlines; a pip is never lost to a hit or a lost life: a hit passes a brass glint across them, and only as the last life goes do they crack in two in turn, the last first, 0.12 s apart, 0.4 s each; version 13); mana with its flame; a small gold lantern per life (a spent life's lantern stays, dark; it gutters out with a puff of smoke).
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

## Version 13
- **Armour is kept all run** (Barney, from building step 5e). Each pip held takes 10% off every hit (a starting figure: three pips, 30%). A pip is never lost to a hit or a lost life; it goes only at the run's end, when, as the last life goes, the pips crack in turn, the last first, 0.12 s apart, with his card pieces (`armEnd`; the close-up "Armour at the run's end").
- A hit with armour shows the usual ember sparks, plus one brass glint passing across the pips held, 0.06 s apart (`HUD.set`'s `armGlint`, 0.3 s each). No crack and no card shards for a hit: those are version 8's and 11's, now gone.
- An armour pick-up with all three pips full stays on the ground, as a potion does when its sockets are full.
- Iron Skin, "Start every place with full armour", now fills the armour at each place's start (GracePick).
- The second loop shows nothing on the HUD; its place cards say "Again, harder" (PlaceCard).
- A hit Lantern Ward ignores: the lantern flares gold with a ring of gold motes and the ward chime; health, armour and the HUD don't change (GracePick, `fxWard`).
