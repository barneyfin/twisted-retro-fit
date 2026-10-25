# Retro Kit look and feel

The full design system (tokens, components, previews) is Barney's "Retro Kit" design system page (link in the README). This file is the part a game needs. The kit already draws the whole interface; everything below is about the World: what you draw inside the playfield.

## The idea

An arcade world in the spirit of around 1990 (banded dusk skies, chrome, bold characters with ink outlines) drawn as smooth shapes at the screen's real resolution, inside a modern glass interface. It is retro because of its palette and its hard colour bands, never because of a pixel grid: no stair-stepped edges, no blocky dots, no enlarged pixel art. The target look is Barney's "R4-B" mock-up, and the four games in `games/` follow it.

## Colour roles (World)

| Role | Tokens | Use |
|---|---|---|
| Player and anything the player owns | chrome ramp (`chrome-100` … `chrome-400`) with `aqua` details | ship, paddle, frog, ball, player shots (`aqua`), score pop-ups |
| Enemies and danger | `red` ramp (`red-light`, `red`, `red-dark`) | enemies, enemy fire edges, hazards |
| Targets to clear | `red`, `heat`, `amber` ramps; `chrome` for armoured ones | bricks, tiles, blocks. Never `aqua`: that colour means "yours" |
| Reward | `amber` ramp | pick-ups, bonus items, the sun, explosion rings |
| Fire and heat | `heat` ramp, `amber`, `sun-100` core | flames, explosions, enemy engines (the player's own engine flame is `aqua`) |
| Sky and distance | `sky-0` … `sky-6`, `hill-far`, `hill-near` | backgrounds only, never for things the player must react to |
| Water the player can fall into | `aqua-dark`, with `aqua` and `aqua-light` marks | rivers and canals in crossing games: the one piece of scenery that uses aqua, because players read teal as water. Never for land, roads or anything to stand on |
| Outline and deepest ground | `ink` | the kit's outline, eyes, glass, ground, letterbox |

- Every gameplay object must stand out from what is behind it. Chrome and aqua read on every sky band; red reads on `ink` to `sky-4` but not on `sky-5`/`sky-6`. Keep enemies away from the bright horizon bands or draw them over darker scenery.
- Colour changes in hard bands, never gradients. The only soft light in the world is `rk.glow`. Skies are strips of `sky-*` tokens, darkest at the top.

## Characters and objects (shape art)

A sprite is a handful of simple shapes (reference.md, Sprites): rounded boxes, circles, ellipses, polygons, lines for legs and feelers, and SVG paths for curves. The kit draws them smooth, adds the ink outline and keeps the result as an image, so drawing them every frame is cheap.

- **Bodies take a ramp, details take a token.** Fill a body with a ramp name (`'red'`, `'chrome'`, `'amber'`) and it gets three hard bands: light on top, base in the middle, dark at the bottom (`band: [0.3, 0.72]` moves the edges). Eyes are `chrome-100` or `sun-100` with `ink` pupils; glass and mouths are `ink`; lamps are `sun-100`. Round metal things (balls, orbs, rivets) look best with `dir: 'diag'`.
- **Few, bold shapes.** Three to ten shapes per character. Keep silhouettes simple and readable at game size; put character in the shapes and the eyes, not in lots of tiny parts. Nothing smaller than about half a world pixel.
- **Never draw your own outline;** the kit adds one round the outside of every sprite. Use `outline: false` only for shots, sparks, explosions, flames and glows.
- **The sprite's box matches the rules.** `size: [w, h]` is the box `rk.draw` places at `x, y`; make it the size the rules use for the object. A player's hit box may be a little smaller than its sprite (the hull, not the wingtips) so near misses feel fair; never larger. Sizes on the 320 × 180 world: player 16–24 wide; enemies 9–16; bullets 2–6 long; pick-ups 8–10. Paddle games: ball 4–6, paddle 32–40 × 6, bricks 28 × 8. Bosses and big ships: 40–64 wide, up to about a third of the screen's height.
- **Animate in whole frames:** 2–4 frames per loop at 6–12 fps via `rk.frame()`. Usually only the legs, feet, wings or jaw change: keep the body in one array and spread it into each frame. Explosions: 3–4 frames, a white-hot flash, a burst, a thinning burst, then embers, with `outline: false`.
- **Facing:** `mirror: true` gives the copy that faces the other way; `turn: 1–3` gives top-down characters their four directions. The bands stay lit from above either way.
- **Things that get shot away** (shelters, walls): draw the whole shape and pass `cut` to `rk.draw` with a round bite for each lost piece; the kit rims each bite in ink.
- **Small bits:** dots, sparks, stars, particles and pellets are `rk.circle` (radius 0.5–1), not `rk.px`, which is a hard square.
- **Invent the look.** Mechanics may be borrowed from classics; looks may not. In particular: no round character with a wedge-shaped mouth, no ghosts with a wavy hem, no copies of famous invader, frog or ship silhouettes. Give each character its own idea (a robot jaw, a horned crab, a one-eyed jelly).

## Scenery

- The kit's backdrops (`rk.backdrop.dusk()`, `rk.backdrop.space()`) are already shapes and bands.
- A game's own backdrop is a 320 × 180 sprite of shapes with `outline: false`, made once in `init` with `rk.makeSprite`: band rects for the sky, polygons for hills and skylines, discs with explicit bands for suns and planets (`fill: ['sun-100', 0.2, 'amber']`), small circles for stars. Draw it with `rk.draw(name, 0, 0)`; the kit keeps it as one picture.
- Things in the scenery that move or change every frame (twinkling stars, embers, lamps) are drawn on top with `rk.circle` or `rk.shape`.
- Flat strips and lane markings can use `rk.rect` (it snaps to whole screen pixels, so edges stay crisp); short dashes look better as `rk.shape({ rect: [...], r: 0.5 })`.

## Genre notes

- **Paddle and bricks (Breakout-style).** Chrome rails 6 pixels thick down both sides and across the top (`rk.rect` strips in the chrome ramp, light edge inside, rivets as small circles). Ten bricks of 28 × 8 with 2-pixel gaps fill the width between the rails; start the wall about 20 pixels below the top rail. Bricks are `rk.block` (a glossy rounded tile). Paddle at y 156 or so, above the dusk ground (which starts at y 166). Backdrop: `rk.backdrop.dusk()`, or `space({ planet: false, terrain: false })` so the bricks own the colour. Use `livesIcon: 'dot'`. See `games/dusk-shatter`.
- **Crossing (Frogger-style).** A 16-pixel grid: 20 columns, 11 rows (plus a 4-pixel margin). The ground must show at a glance where the player can walk, so use three surfaces that look nothing like each other, the same way on every level:
  - **Land** (safe rows): `hill-far`, with small details in `hill-near` and `sky-3`.
  - **Roads**: grey tarmac (a strip of `ink` with `chrome-400` over it at 0.4 alpha) and dashed `chrome-200` lane marks between lanes.
  - **Water**: `aqua-dark`, with `aqua` wave marks that drift the way the lane flows and `aqua-light` foam along the banks. Nothing else on the ground is teal. Do not paint water or roads in the `sky-*` purples and blues: players took a purple river for land.
  - **Things to ride** must stand out on the water: `amber` for logs, decks and shells, `aqua-light` over `aqua` for lily pads. Never `aqua-dark`.

  Vehicles seen from above, facing right, with `mirror: true` copies. One hop per press (`rk.input.pressed.up` etc.); on touch, a swipe hops that way and a tap hops forward. See `games/last-leap`.
- **Fixed shooter (invaders).** A fleet in a grid, a ship along the bottom, shelters drawn with `cut`. See `games/orbit-siege`.
- **Maze chase.** Walls as thick rounded lines from tile centre to tile centre (three passes: a dark edge, a light edge, then the body). See `games/chrome-chomp`.
- **Shooter (horizontal).** `rk.backdrop.space({ scroll })` with `scroll` rising 0.5–1 pixel per update; the planet and terrain are scenery, never solid. Red enemies read poorly on the planet's bright bands: pass `{ planet: false }` if enemies fly through that corner a lot. The ship starts on the left third and moves freely up and down, and forwards to about the middle of the screen. Enemies come in waves from the right, scripted as a timeline in the game's state (a list of `{ at: seconds, wave: … }` read in `update`); a boss ends each stage, with its health in a `meter` HUD slot. Player shots `aqua`, enemy shots small and red-edged so they read against everything.

## Title screen

The kit draws the logo, tagline and menu over the middle of your title world, and buttons over the top corners. Use a backdrop (default dusk) and at most a prop or two along the bottom band (y 150–180), outside the middle third.

## Effects

- `rk.glow` for things that emit light: shots, engines, explosions, the ball, power-ups. Not for scenery or enemies at rest. A halo radius of 1–3× the object's size, alpha 0.3–0.6.
- `rk.shake` only for big moments: the player dying, a boss hit, a large explosion. Not for every bullet.
- Never flash the whole screen, and nothing bigger than a character (a boss, a big explosion, a wall, a band of the screen) flashes or blinks faster than 3 times a second. A hit flash is the sprite drawn with `{ flash: true }` for about 4 updates, then not again for at least 16 (so a boss under rapid fire flashes at most 3 times a second); for blocks, a `chrome-100` rounded box inside the block for the same time. The one faster thing allowed is the player's own blink while protected after a respawn: one small sprite, up to 6 times a second (visible 5 updates, hidden 5: `g.inv % 10 < 5`), or 3 times a second (`g.inv % 20 < 10`).
- Trails: up to two fading copies behind fast objects (ball, shots) at alpha 0.4 then 0.2. Keep the last two positions in state.

## Words

- In the world, only `rk.banner()` (ALL CAPS, two words at most: STAGE 2, GET READY, BOSS) and `rk.popup()` (numbers and very short words: 100, x2, 1UP).
- Pop-ups are for points worth noticing: bonuses, combos, big targets. Routine small scores (30 or under) can skip them, and with many things scoring at once, show at most about four.
- Interface text is set in the config and is sentence case: HUD labels ("Score", "Beam"), `keys` actions ("Move", "Fire", "Charge beam"), the `touch` hint ("Drag to move · Tap to fire"), mode labels ("Classic", "Advanced") and their one-line descriptions ("Power orbs scare the gremlins"). No exclamation marks, no emoji.
- Game and enemy names are invented. Never use the name, characters, logo, music or art of a real game.

## Sound

| Event | Cue |
|---|---|
| Player fires or launches | `shot` |
| Ball off a paddle or wall | `bounce` |
| Small target cleared (brick, coin, hop) | `blip` |
| Something damaged but not destroyed | `hit` |
| Small enemy destroyed (many per wave) | `blip`, or a short custom `rk.sfx.noise` (keep it under 0.15 s) |
| Big enemy, boss or the player's ship destroyed | `explosion` |
| Power-up, extra life, level clear | `pickup` |

The kit plays menu, pause, life-lost, game-over and new-best sounds itself. Keep custom tones under 0.2 s. Rate-limit rapid repeats (at most one of the same cue every 6 updates).

Music is optional and only ever a track Barney supplies, played by the kit (reference.md, Music). Keep its `level` near 0.35 so the sound effects stay on top.

## Pacing

- The first 30 seconds are easy enough for a newcomer to learn the controls.
- Each level or wave adds one thing: speed, numbers, a new enemy type, a new pattern. Raise speed by 5–10% per level, capped.
- After a death: about a 1-second pause, then a safe restart. Shooters and crossing games respawn with 1.5 s of blinking invulnerability; paddle games put a new ball on the paddle, waiting for launch.
- Arcade games do not end on a win: after the last designed level, repeat the set, faster. The run ends only when the lives run out.
- A run should last 3–10 minutes for an average player.
