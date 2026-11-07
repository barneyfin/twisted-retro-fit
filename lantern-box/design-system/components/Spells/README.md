# Spells

Heal and fireball, each stronger with every scroll after the first, and the fizzle when mana is short. Agreed in step 4b round 3.

## When to use
- When the wanderer casts (K, or the cast button on a phone).

## Code
`play.js`: `loopHeal(…, "B")`, `loopFire`, `loopFizzle`, `loopPlay3`; the effects `fxFire`, `fxBurstL` and the heal glow in `mvspells.js`.

## Rules
- Gold, never ember: ember is for danger only. The fireball flies straight at chest height (over crawlers) until it hits a monster or leaves the screen.
- Not enough mana casts nothing: the light sputters out, so the player knows the button worked.
- The plaque lines: "Heal mastered" or "Fireball mastered" for a spell's first scroll; "Heal: restores deeper", "Fireball: glows brighter" for a later one (PlaqueLine).

## Version 12 (7 November 2026, design round 3 of step 5b; approved with design system 12)
Two spells bought in the Echo Shrine and chosen there before a run, in place of the fireball; that run's scrolls then teach the chosen one. A different effect, not more power; each costs the fireball's mana. Starting figures, tuned by Claude Code.
- **Lightning bolt** (`fxBolt`, `loopBolt`): strikes the nearest monster ahead at once (about 5 body-lengths), then forks to one more within about 2; each hit about two-thirds of a fireball. A jagged gold line for 0.2 s: one flash, on the bolt only, never the screen.
- **Acid spray** (`fxAcid`, `fxAcidPatch`, `loopAcid`): a stream of droplets from the hand into a short cone (about 2 body-lengths) that hits everything in it, crawlers too, then a patch on the ground that hisses for 1.5 s and hurts whatever walks through; about a fireball's damage in all, spread over time.
- **The acid is gold**, as every spell (Barney, 7 November 2026, after seeing gold and green side by side in this card). Green (#46c06e) was the alternative; `ACID_LOOK` in `play.js` would switch it.
- **The bolt's fork zigzags as sharply as its strike** (Barney, 7 November 2026): the corners alternate side to side on both parts; the fork's line is only thinner.
- Barney, 7 November 2026: the concept is agreed; the execution has to be good, so both are judged in play before they're tuned.

## Version 13
- **Their own sounds** (play.js `SND.play("bolt")`, `"acid"`, `"acidHiss"`), instead of the fireball's throw and burst:
  - the lightning bolt: a sharp crack, a buzzing zap as it strikes, and a smaller crack as it forks, 0.06 s later;
  - the acid spray: a wet hissing spray; then, while its patch lies, a quiet bubbling hiss (`acidHiss`, the patch's 1.5 s).
  Both are measured as loud as the fireball (about −28 dB over their loudest 0.4 s); the patch's hiss sits well under them. Starting levels, to tune by ear.
- **Their scrolls** are drawn for the scroll, not shrunk from the Echo Shrine's pictures: the bolt as a solid zigzag, the acid as a spray of three lines with three drops (Loot).
- **The acid's patch follows the ground**: `fxAcidPatch(c, x0, x1, y, k, u, look, gy)` takes the ground's height at each x (`gy`), so on a slope it lies along it; its bubbles and motes rise from the slope too.
- **An early scroll**: once a run, a scroll for the run's attack spell lies on the path in Night (Loot). Scrolls otherwise come only from walkers, who join at Dawn, and bosses.
