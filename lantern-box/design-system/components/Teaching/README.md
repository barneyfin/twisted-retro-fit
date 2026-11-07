# Teaching

Teaching in play on a first run: the controls shown on screen during Night, keycaps on a computer and the touch controls lit on a phone, each hint going once that control is used. Version 12, step 5b round 2 (Barney, 7 November 2026). CrazyGames' quality guidelines ask for onboarding inside play: skippable, mostly pictures, the controls on screen.

## Markup
Over the play screen, under nothing but the HUD: `lb-teach-row` of `lb-teach-hint` (keycaps, then one word; `is-done` dimmed, `is-next` edged in `heading`), and `lb-teach-skip` ("Hide hints", with the H keycap on a computer; `is-phone` 44px on a phone). On a phone: `lb-teach-zone` (a dashed outline of the stick's half), `lb-teach-ring` round a touch button (`is-later` fainter) and `lb-teach-label` beside it (`is-later` in `text-3`).

## Rules
- **When**: on a first run, and again after Clear saved progress. Never in a later run, and never in a menu.
- **Computer**: at the start of Night, three hints in a row above the path: A D walk, Space jump, J attack. Later, the first time each matters: K cast (once a spell is learnt), Shift roll, Q E drink (with the potion's plaque line).
- **Phone**: the stick's half outlined, "Touch and drag here to move", "Flick to roll"; Jump and Attack ringed and named; "Cast, once a spell is learnt" fainter until then.
- **Going**: a hint dims to 35% as soon as its control is used, then goes after a second; the next to learn is edged in `heading`. H, or Hide hints, hides them all for good (the hints come back only after Clear saved progress).
- **Keys**: the letters as the player's own keyboard has them, where the browser can tell (an AZERTY player sees Q for walk left); otherwise as printed above. Never Esc.
- Hints never cover the HUD, the boss bar or the plaque line, never flash, and never stop play.

## Version 13
Confirmed by Barney as Claude Code built them (7 November 2026):
- **When the later hints appear**: roll when a monster first starts an attack within 400 of him; drink when the first potion is kept (with the potion's plaque line); cast once a spell is learnt (on most first runs that is now the scroll on the path in Night: Loot).
- **No drink hint on a phone**: the potion's plaque line already says "Tap to drink".
- **The computer's row** sits 120/540 of the window's height above the bottom, so it scales with the window.
