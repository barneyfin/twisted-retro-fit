# Potions

One health potion and one mana potion can be kept and drunk when the player chooses, for the boss fights. Agreed in round 13 (design system version 11, Barney, 5 November 2026), from his second play of Gloam Hallow.

## Markup and code
`play.js`: `HUD.build(stage, phone)` writes the two sockets under the plaque (`lb-potions`, each an `lb-potion-wrap` holding the `lb-potion` button and, on a computer, its `lb-pkey`); `HUD.set(hud, {potions: {health, mana}, potFx: {k, kind, u}, hp, mp})` shows them (`HUD.setPotion` for one). The pictures are `HUD.POT` (glass, liquid clip, mark). The world's side of the moments is `pot13.js`: `potFlight`, `potDrinkFx`, `potSocketAt`, and the review loop `loopPot`. `HUD.OPTS.rm` and `HUD.OPTS.fxOff` choose the moments' Reduce motion and Effects off versions. The sound is `SND.play("drinkHealth")` or `"drinkMana"` (Sound).

## Rules
- **Where**: two sockets of their own, 8px under the plaque's left end, 8px apart: health then mana, each under its own bar. 40px on a computer (as the HUD's tiles), 44px on a phone (every target). They are in the stick's half of a phone: a tap on one drinks it and never starts the stick.
- **Looks**, each with a clue besides colour: **empty**, a faint outline of the potion and its mark in `brass-dim`, the edge `brass-deep` (as the empty armour slots); **kept**, the potion as it lies on the ground, the round flask with the heart or the tall vial with the flame, ink glass with a `heading` edge and the liquid in the bar's own colours (`health-top` to `health-low`, `mana-top` to `mana-low`), the socket's edge `brass`; **kept but its bar is full**, dimmed to 38% with a `brass-dim` edge, as the spell's picture is when mana is short: it can't be drunk then.
- **Keys on a computer**: a small keycap on each socket's lower right corner, Q on health and E on mana, Alegreya Sans bold 12px; it lights as its potion is drunk. Phones show no keys.
- **The rules of play**: a potion picked up goes into its socket if that is empty; if the socket is full, the potion is drunk if he needs it and left on the ground for later if he doesn't. A socket can't be drunk while its bar is full. Drinking is instant, with no pose, so it works mid-fight; the bar fills by as much as a potion fills it (health 35%, mana 50%).
- **Kept** (moment): the potion lifts and flies up to its socket, shrinking (0.45 s); the socket's flask grows in from 0.6 with one glint passing over it (0.4 s); the first time each kind is kept, the plaque line (PlaqueLine). Reduce motion: no flight; the potion fades where it lay as the socket fades in. Effects off: no glow round the potion, no light on the glint.
- **Drunk** (moment): the flask drains (0.35 s) and leaves the faint outline; motes in the potion's own colour rise round him with a soft glow at his chest (0.9 s); the bar fills over 0.4 s; the drink's sound. Reduce motion: the motes stay put and fade, and the flask fades out instead of draining. Effects off: the motes without the glow. Nothing flashes or bounces.

## Version 12
- **Up to three of each** (step 5b round 3, Barney, 7 November 2026: option B, pips): one more socket a purchase at the Echo Shrine, a third only after the second. The HUD keeps one socket per kind; a pip under it for each socket bought, filled while a potion is in it (`lb-potion-pips`, 6px diamonds 5px apart, `heading` when filled, a `brass-dim` outline when empty). Numbers were left out because they would be hard to read on the Pixel.
- The pips sit 9px under the socket (clear of a computer's keycap), and show only once a second socket is bought, so a new player's HUD is as before.
- The socket shows the potion while any is kept; drinking drains it, and with one left the flask shows again at once (the next potion's keep moment can play over it). A potion picked up fills an empty socket; when all bought sockets are full, it is drunk if needed and left on the ground otherwise.
- The Bare Reckoning takes one potion of each kind, whatever was bought; The Echo Infusion takes every socket bought (Modes).
- `HUD.set` takes counts: `potions: {health: 2, mana: 1}` (true still means 1) and `potCap: {health: 3, mana: 2}`.
