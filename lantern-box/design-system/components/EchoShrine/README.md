# EchoShrine

The Echo Shrine (the wisp shop until the rename): stolen echo buys a spell, more potion sockets and belts, kept for good. From the title menu and the run's end. Agreed in step 5b, rounds 1 to 3 (Barney, 7 November 2026).

## Markup
A dialog plaque (780 wide; 804 on a phone held sideways, `is-phone`): an `lb-header` with the heading and the bank (`lb-bank`: STOLEN ECHO over the number), then `lb-shrine-cols` of three `lb-shrine-col`, then the Hysteria row (`lb-shrine-row is-soon`; on a phone in the footer, `lb-shrine-soon`), then `lb-shrine-foot` (the hint and Back).
- A spell is an `lb-shrine-row` (its picture, `lb-shrine-name`, `lb-shrine-note`, then `lb-shrine-state` "Chosen" or an `lb-buy`): the chosen one `is-chosen` (a brass edge on `brass-wash`).
- `lb-buy`: outlined; `is-ready` (the brass band) when it can be bought now; `disabled` (`text-dim`, `brass-deep` edge) when the bank is short; "Choose" once bought.
- Potions: a row of three sockets per kind (`lb-socks` of `lb-potion`, `has-potion` for each bought), "2 of 3 sockets", and the next socket's `lb-buy`.
- Belts: a two-by-two grid of `lb-belt` (a band in the belt's colour, its name, then WORN, WEAR or the price); `is-worn` on the one worn.

## Rules
- **The words**: "Echo Shrine"; the bank "Stolen echo"; columns "Spell for the next run", "Potions you can keep", "Belt"; the foot "Bought for good. The spell and belt can be changed here before any run." Echo has no plural.
- **The spells**: the fireball to start; the lightning bolt and the acid spray bought. One is chosen for the next run, and that run's scrolls teach it (Spells). Notes, one line each: "Flies, bursts"; "Strikes, forks"; "Sprays, hisses". On a phone the notes are left out.
- **Potions**: up to three of each, one more socket a purchase, a third only after the second (Potions).
- **Belts**: red to start; night blue, mulberry and ash (`belt-night-blue`, `belt-mulberry`, `belt-ash`; Wanderer). A bought belt is worn with one press.
- **Starting prices** (agreed in round 1, tuned at step 5f): second health potion 25 (the first unlock), lightning bolt 75, night blue belt 100, second mana potion 175, mulberry 250, ash 250, acid spray 300, third health potion 350, third mana potion 400; 1,925 for all nine. Hysteria 500, shown as "Coming soon · 500" until it is built, after submission, as an update.
- **What a run takes** (Modes): The Bare Reckoning takes the chosen spell and belt and one potion of each; The Echo Infusion takes everything bought.
- **Keys** (computers): arrows move through the rows, Enter buys, chooses or wears, Backspace goes back. Never Esc.
- A new player is never sent here before their first run; only the very first run's end makes it the primary button (RunEnd).
- **Full Launch** (drawn, not built): "Try acid spray for one run" under the spells, a rewarded ad for a spell not yet bought; a 320 × 50 banner under the plaque, at least 15 px from any button (AdPlaces).
