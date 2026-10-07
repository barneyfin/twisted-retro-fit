# Retro Kit look and feel

The full design system (tokens, components, previews) is Barney's "Retro Kit" design system page (link in the README). This file is the part a game needs. The kit already draws the whole interface; everything below is about the World: what you draw inside the playfield.

## The idea

A 16-bit arcade world of around 1990 (banded dusk skies, chrome, pixel sprites with ink outlines) shown inside a modern glass interface. The world should look hand-made and crisp, never smooth or vector-like.

## Colour roles (World)

| Role | Tokens | Use |
|---|---|---|
| Player and anything the player owns | chrome ramp (`chrome-100` … `chrome-400`) with `aqua` details | ship, paddle, frog, ball, player shots (`aqua`), score pop-ups |
| Enemies and danger | `red` ramp (`red-light`, `red`, `red-dark`) | enemies, enemy fire edges, hazards |
| Targets to clear | `red`, `heat`, `amber` ramps; `chrome` for armoured ones | bricks, tiles, blocks. Never `aqua`: that colour means "yours" |
| Reward | `amber` ramp | pick-ups, bonus items, the sun, explosion rings |
| Fire and heat | `heat` ramp, `amber`, `sun-100` core | flames, explosions, engine exhaust |
| Sky and distance | `sky-0` … `sky-6`, `hill-far`, `hill-near` | backgrounds only, never for things the player must react to |
| Outline and deepest ground | `ink` | the kit's sprite outline, ground, letterbox |

- Every gameplay object must stand out from what is behind it. Chrome and aqua read on every sky band; red reads on `ink` to `sky-4` but not on `sky-5`/`sky-6`. Keep enemies away from the bright horizon bands or draw them over darker scenery.
- Skies are bands, never gradients. Draw custom skies with `rk.rect` strips of `sky-*` tokens, darkest at the top.

## Sprites

- Shade on a three-tone ramp with light from the top left: light tone on the top and left edge, base in the middle, dark tone on the bottom and right edge. One or two `W` (chrome-100) glint pixels on metal.
- Never draw an outline; the kit adds it. Use `outline: false` only for shots, sparks, explosions and particles.
- Scale on the 320×180 world: player 16–24 pixels wide; enemies 9–16; bullets 2–6 long; pick-ups 8–10. Paddle games: ball 4–6, paddle 32–40 × 6, bricks 28 × 8.
- Animate in whole frames: 2–4 frames per loop at 6–12 fps via `rk.frame()`. Explosions: 3–4 frames, growing then scattering, `outline: false`.
- Keep silhouettes simple and symmetrical where it helps reading; detail goes in the shading, not in extra pixels.

## Genre notes

- **Paddle and bricks (Breakout-style).** Chrome rails 6 pixels thick down both sides and across the top (`rk.rect` in the chrome ramp, light edge inside). Ten bricks of 28 × 8 with 2-pixel gaps fill the width between the rails; start the wall about 20 pixels below the top rail. Paddle at y 156 or so, above the dusk ground (which starts at y 166). Backdrop: `rk.backdrop.dusk()`, or `space({ planet: false, terrain: false })` so the bricks own the colour. Use `livesIcon: 'dot'`.
- **Crossing (Frogger-style).** A 16-pixel grid: 20 columns, 11 rows (plus a 4-pixel margin). Safe rows in `hill-near` and `ink`, road lanes in `sky-1`/`sky-0` with chrome lane marks, water lanes in `sky-2`/`sky-3` bands. One hop per press (`rk.input.pressed.up` etc.); on touch, a swipe hops that way and a tap hops forward.
- **Shooter (horizontal).** `rk.backdrop.space({ scroll })` with `scroll` rising 0.5–1 pixel per update. Player on the left third, enemies in waves from the right, a boss to end each stage. Player shots `aqua`, enemy shots small and red-edged so they read against everything.

## Title screen

The kit draws the logo, tagline and menu over the middle of your title world, and buttons over the top corners. Use a backdrop (default dusk) and at most a prop or two along the bottom band (y 150–180), outside the middle third.

## Effects

- `rk.glow` for things that emit light: shots, engines, explosions, the ball, power-ups. Not for scenery or enemies at rest. A halo radius of 1–3× the object's size, alpha 0.3–0.6.
- `rk.shake` only for big moments: the player dying, a boss hit, a large explosion. Not for every bullet.
- Never flash the whole screen or alternate bright colours faster than 3 times a second. A hit flash is the sprite drawn with `{ flash: true }` for about 4 updates; for blocks, a `chrome-100` rectangle inside the block for the same time.
- Trails: up to two fading copies behind fast objects (ball, shots) at alpha 0.4 then 0.2. Keep the last two positions in state.

## Words

- In the world, only `rk.banner()` (ALL CAPS, two words at most: STAGE 2, GET READY, BOSS) and `rk.popup()` (numbers and very short words: 100, x2, 1UP).
- Pop-ups are for points worth noticing: bonuses, combos, big targets. Routine small scores (30 or under) can skip them, and with many things scoring at once, show at most about four.
- Interface text is set in the config and is sentence case: HUD labels ("Score", "Beam"), `keys` actions ("Move", "Fire", "Charge beam"), the `touch` hint ("Drag to move · Tap to fire"), mode labels ("Classic", "Advanced") and their one-line descriptions ("Power orbs turn the gremlins blue"). No exclamation marks, no emoji.
- Game and enemy names are invented. Never use the name, characters, logo, music or art of a real game.

## Sound

| Event | Cue |
|---|---|
| Player fires or launches | `shot` |
| Ball off a paddle or wall | `bounce` |
| Small target cleared (brick, coin, hop) | `blip` |
| Something damaged but not destroyed | `hit` |
| Enemy or ship destroyed | `explosion` |
| Power-up, extra life, level clear | `pickup` |

The kit plays menu, pause, life-lost, game-over and new-best sounds itself. Keep custom tones under 0.2 s. Rate-limit rapid repeats (at most one of the same cue every 6 updates).

Music is optional and only ever a track Barney supplies, played by the kit (reference.md, Music). Keep its `level` near 0.35 so the sound effects stay on top.

## Pacing

- The first 30 seconds are easy enough for a newcomer to learn the controls.
- Each level or wave adds one thing: speed, numbers, a new enemy type, a new pattern. Raise speed by 5–10% per level, capped.
- After a death: about a 1-second pause, then a safe restart. Shooters and crossing games respawn with 1.5 s of blinking invulnerability; paddle games put a new ball on the paddle, waiting for launch.
- Arcade games do not end on a win: after the last designed level, repeat the set, faster. The run ends only when the lives run out.
- A run should last 3–10 minutes for an average player.
