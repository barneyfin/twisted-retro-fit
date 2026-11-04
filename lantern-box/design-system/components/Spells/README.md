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
