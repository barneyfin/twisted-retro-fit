# Retro Kit API reference (kit 2.1)

A game is one call: `RetroKit.game(config)`. The kit calls your hooks and hands every hook `rk`, the toolbox.

## Coordinates and time

- The world is **320 × 180 world pixels** (`rk.W`, `rk.H`), origin top-left. All game logic, positions and sizes use this grid. The kit draws it at the screen's real resolution (smooth, no pixel grid), fitted to the space at 16:9. Positions may be fractional and are drawn where they are: movement is smooth, not in whole-pixel steps.
- `update` runs **exactly 60 times a second** during play, so move things in pixels per update (a speed of 1.5 is 90 pixels a second). It stops while paused, on the game-over card and in menus.
- `draw` runs every screen frame, including while paused (the world stays visible, frozen).

## Config

```js
RetroKit.game({
  id: 'my-game',                // the folder name, lowercase-with-hyphens; high scores are stored under it
  title: 'MY GAME',             // ALL CAPS, invented; '\n' for a second line. Also becomes the browser tab title
  tagline: 'A RETRO KIT GAME',  // optional line under the logo
  lives: 3,                     // starting lives (default 3)
  hud: ['score', 'best', 'lives', 'level'],   // HUD slots in order, see HUD
  keys: [['←', '→', 'Move'], ['Space', 'Launch'], ['P', 'Pause']],  // title-screen hints: keycaps..., then the action
  touch: 'Drag to move · Tap to launch',      // phone hint shown at the start of each life
  sprites: { name: spriteDefinition },         // see Sprites
  phoneMid: 'level',            // optional: which HUD slot the phone top bar shows in its middle
  livesIcon: 'dart',            // optional: 'dart' (a ship, default) or 'dot' (a ball, for paddle games)
  modes: [{ id: 'classic', label: 'Classic' }, { id: 'advanced', label: 'Advanced' }],   // optional, see Game modes
  music: { data: window.MY_GAME_MUSIC, level: 0.35 },                                    // optional, see Music

  init(rk) {},                  // optional: once, after loading (build extra sprites here)
  start(rk) { return {}; },     // required: a new game. Return this game's state object (it becomes `g`).
                                //   May call rk.hud.set, rk.banner and rk.after. With modes, read rk.mode here.
  update(g, rk) {},             // required: the rules, 60 times a second during play
  draw(ctx, g, rk) {},          // required: the picture, every frame. Draw the backdrop first.
  drawTitle(ctx, rk) {},        // optional: the title-screen world (default: rk.backdrop.dusk()). See Title screen.
  onPause(g, rk) {},            // optional
});
```

`ctx` is the canvas context, already scaled so that you draw in world pixels. Prefer the `rk` drawing functions; if you use `ctx` directly, take colours from `rk.C`, and never `fillText`.

## Flow

| Call | What it does |
|---|---|
| `rk.addScore(n, x, y, colour)` | Adds `n` points. With `x, y` it also shows a pop-up of the points at that world position (`colour` token, default `'aqua'`). |
| `rk.loseLife()` | Takes a life, plays the life-lost sound, updates the HUD. At 0 lives it starts the game-over sequence by itself. Returns lives left. Ignored once the game is ending. |
| `rk.addLife(n = 1)` | Extra life, with the pick-up sound. |
| `rk.gameOver(delay = 1)` | Ends the game after `delay` seconds (for games that end without lives, such as a timer). |
| `rk.ending` | `true` from the moment the game is ending until the card shows. Stop player control while it is true; keep animating. |
| `rk.after(seconds, fn)` | Runs `fn` after game time passes (pauses with the game). Use for respawn delays, level transitions. A new game clears every waiting `after`; but they still run while the game is ending, so start a callback that changes play with `if (rk.ending) return;`. |
| `rk.score`, `rk.lives`, `rk.best` | Read-only current values. In a game with modes, `rk.best` is the best for the mode being played. |
| `rk.mode` | The `id` of the mode the player chose (see Game modes); `null` in a game without modes. |
| `rk.time` | Seconds of play this game (pauses with the game). `rk.t` is wall-clock seconds since load. |
| `rk.screen` | Where the player is: `'title'`, `'modes'`, `'play'`, `'paused'`, `'over'`, `'initials'`, `'scores'` or `'settings'`. Rarely needed. |

After `start()`, the kit owns everything outside play: when the card appears, Play again calls `start()` again for a fresh state.

## Game modes

For a game with more than one way to play (Classic and Advanced, Easy and Hard, Marathon and Sprint), list them in `modes`. The kit does the rest; a game never draws its own mode picker.

```js
modes: [
  { id: 'classic', label: 'Classic', description: 'Power orbs turn the gremlins blue' },
  { id: 'advanced', label: 'Advanced', description: 'Adds capsules: laser, turbo and more' },
],

start(rk) {
  const g = { advanced: rk.mode === 'advanced', level: 1 };
  // ...build the first level for that mode...
  return g;
},
```

- Each mode has an `id` (lowercase-with-hyphens; scores are saved under it, so never rename one), a `label` (one or two words, sentence case) and an optional `description` (one short line of up to about 36 characters, no full stop). Two or three modes; four at most.
- **Start game** opens "Choose a mode" (arrow keys and Enter, or a tap). The kit remembers the last choice and offers it first next time. Restart and Play again keep the mode; to change it the player goes back to the menu.
- `rk.mode` is the chosen `id`. It is set before `start(rk)` runs and stays the same for the whole game. Read it in `start()`, keep what it means in your state, and branch on that in `update` and `draw`.
- Each mode has its own high-score table. **High scores** on the title screen shows a tab per mode (left and right arrows, or a tap); the title's Best chip, the HUD's `'best'` slot and `rk.best` all follow the current mode.
- The first mode is the default, and scores a game saved before it had modes are copied to it. So when adding modes to an existing game, put the original way to play first.
- Leave `modes` out for a game with one way to play: it starts straight from Start game and has one table.

## HUD

`hud` lists slots. Built-in names: `'score'`, `'best'`, `'lives'` (filled automatically), and `'stage'` (text), `'level'`, `'wave'`, `'round'`, `'time'` (numbers you set). Custom slots are objects:

```js
hud: ['score', { id: 'beam', label: 'Beam', type: 'meter', low: 0.2, full: 'Ready' }, 'best', 'lives', { id: 'stage', label: 'Stage', value: '1-1' }]
```

- Types: `'num'` (comma-formatted), `'text'`, `'meter'` (0 to 1; shows a bar and a percentage; at 1 it turns amber and shows `full` or "Ready"; below `low` it turns red, and `low: 0` means never), `'lives'`.
- Update with `rk.hud.set(id, value)` (cheap to call every update). Read with `rk.hud.get(id)`.
- Every new game resets each slot to its `value` (or 0 / empty), so set your own slots in `start()`.
- Desktop shows every slot in the HUD bar under the playfield. Phones show score, one middle slot (`phoneMid`, else stage/level/wave/round) and lives, so put anything essential in those.
- Five or six slots at most. Labels are one or two words, sentence case.

## Input (`rk.input`), read inside `update`

| Property | Meaning |
|---|---|
| `left`, `right`, `up`, `down`, `fire`, `alt` | Held this update. Keys: arrows or WASD; fire = Space, Z, J or Enter; alt = Shift, X or K. |
| `pressed.left` … `pressed.alt` | Went down this update (once per press). Use for firing single shots, jumping, Frogger hops. |
| `pointer.x`, `pointer.y` | Last pointer position in world pixels (touch, or mouse over the playfield). |
| `pointer.down`, `pointer.pressed`, `pointer.released` | Touch or mouse button held / went down / came up this update. |
| `pointer.dx`, `pointer.dy` | How far the pointer moved this update, in world pixels. Use for drag-anywhere steering: `ship.x += rk.input.pointer.dx`. |
| `pointer.moved` | The pointer moved this update. |
| `pointer2.x`, `pointer2.y`, `pointer2.down`, `pointer2.pressed`, `pointer2.released` | A second finger, put down while the first is still down (phones). It never moves `pointer`: the first finger keeps steering. A third finger is ignored. |
| `tap` | A quick tap (short and still) finished this update, by either finger. |
| `any` | Any key, tap or press this update. |
| `key(code)`, `keyPressed(code)` | Any other key by `KeyboardEvent.code`, e.g. `rk.input.keyPressed('KeyE')`. |
| `rk.touch` | `true` on phones and tablets. |

P and Esc pause; the kit handles them. Touch patterns:
- **Steer:** drag anywhere moves the player by `pointer.dx/dy` (relative, so the finger never covers the player).
- **Act:** `tap` for one-off actions (launch, fire, hop). For hold-to-fire, use `pointer.down`. When dragging already steers and fires, a `tap` (short and still) is the second action (a bomb, a special); keep it for things that are fine to trigger by accident now and then.
- **Directional hops (Frogger):** compare a swipe: on `pointer.released`, use the total movement since `pointer.pressed`; treat a tap as "forward".
- **Two thumbs:** the kit follows two fingers at once. While one thumb drags to steer, a quick tap with the other is a `tap`, so a game that steers with `pointer` and acts on `tap` gets two-thumb play for free. For hold-to-act with the other thumb (hold to fire), use `pointer2.down`. Lifting the first finger ends its drag; the second finger stays `pointer2` until it lifts, and the next finger down becomes `pointer`. Say so in the `touch` hint when it matters ("Drag to move · Tap with your other thumb to smash").

## Sprites

A sprite is a few **shapes** inside a box, in world pixels. The kit draws them smooth at the screen's real resolution, paints ramps as hard bands, adds an ink outline round the outside, and keeps each frame as an image, so drawing sprites every frame is cheap. (Kit 1.x sprites were rows of letters; those now stop the game with an error on screen.)

```js
sprites: {
  ship: {
    size: [20, 12],                     // the box rk.draw places at x, y: keep it the hit box
    shapes: [
      { poly: [10, 0, 13, 6, 20, 9.5, 20, 11, 12.5, 10, 10, 12, 7.5, 10, 0, 11, 0, 9.5, 7, 6], fill: 'chrome' },
      { poly: [10, 2.6, 11.7, 6.6, 10, 8.2, 8.3, 6.6], fill: 'aqua', band: [0.35, 0.75] },
    ],
  },
  foe: {                                // animation: a list of shape lists, one per frame
    size: [12, 9],
    frames: [[...legsOut, ...body], [...legsIn, ...body]],
  },
  foeLeft: { size: [12, 9], frames: [...], mirror: true },     // the same, facing the other way
  shot: { size: [2, 6], outline: false, shapes: [{ rect: [0, 0, 2, 6], r: 1, fill: ['chrome-100', 0.2, 'aqua-light', 0.55, 'aqua'] }] },
}
```

**Geometry** (one per shape, coordinates inside the sprite's box):

| Shape | Meaning |
|---|---|
| `{ poly: [x1, y1, x2, y2, …] }` | a closed polygon |
| `{ rect: [x, y, w, h], r: 1 }` | a box; `r` rounds the corners |
| `{ circle: [cx, cy, r] }` | a circle |
| `{ ellipse: [cx, cy, rx, ry, turn] }` | an ellipse, turned by `turn` degrees (optional) |
| `{ line: [x1, y1, x2, y2, …], width: 1 }` | an open line with round ends: legs, feelers, bolts |
| `{ path: 'M0 6 C0 2 3 0 6 0 C9 0 12 2 12 6 Z' }` | SVG path data, for curves (domes, shields, drops) |

**Paint** (on any shape):

- `fill`: a **ramp** name (`'aqua'`, `'red'`, `'amber'`, `'heat'`, `'chrome'`) paints light, base and dark bands, top to bottom; a **token** (`'sun-100'`, `'ink'`, `'red-dark'`) paints one flat colour; a **list** paints your own bands: `['sun-100', 0.2, 'amber', 0.6, 'heat']` (colour, where it ends as a fraction of the shape's height, colour, …).
- `band: [0.3, 0.72]` moves where a ramp's light band ends and its dark band starts; `band: false` paints the ramp's base tone only.
- `dir`: which way the bands run: `'down'` (default), `'diag'` (top-left to bottom-right: balls, orbs), `'right'`, or degrees.
- `alpha: 0.5`; `stroke: 0.8` draws only the edge of the shape, that wide (rings, arcs, a horseshoe); `outline: false` leaves the shape out of the ink outline (a flame, a glow); `erase: true` cuts the shape out of everything drawn before it in the same sprite (holes, hollow walls).
- Shapes are painted in order, so later ones sit on top: body first, then eyes, then pupils.

**Sprite options:** `size: [w, h]` (required); `shapes: [...]` or `frames: [[...], [...]]`; `outline: false` (no ink outline) or a number (its width in world pixels, default 0.6); `mirror: true` (faces the other way); `turn: 1, 2 or 3` (quarter turns clockwise, for top-down characters; a turn of 1 or 3 swaps width and height). Mirrored and turned sprites keep their light from above.

Drawing:
- `rk.draw(name, x, y, frame = 0, { flip: true, alpha: 0.5, flash: true, cut: [[x, y, r], …] })`: `x, y` is the top-left of the sprite's box (the outline sits just outside it). `flip` mirrors it for this one draw; `flash` draws the same silhouette in `chrome-100` (the hit flash: use it for about 4 updates); `cut` takes round bites out of it, each rimmed in ink, at positions inside its box (a shelter being shot away: one bite per lost piece). Never rotate or scale sprites.
- `rk.frame(name, fps = 8)`: the frame index for a looping animation at that speed.
- `rk.sprite(name)` returns `{ w, h, frames }`; use `w`, `h` for hit boxes.
- `rk.makeSprite(definition, name)` builds a sprite at runtime and registers it under `name` (call it in `init`, never every frame). Use it for sizes or layouts you work out in code: a paddle that comes in two widths, a 320 × 180 backdrop of shapes for each level, a maze's walls.
- `rk.ramps` (`{ aqua: ['aqua-light','aqua','aqua-dark'], … }`) is there to read, e.g. to pick particle colours.

## Drawing primitives (colours are token names)

- `rk.rect(x, y, w, h, colour, alpha)`: a flat box whose edges snap to whole screen pixels, so strips and bands stay crisp. `rk.px(x, y, colour)` is a 1 × 1 box: a hard square, so use `rk.circle` for dots.
- `rk.circle(cx, cy, r, colour, alpha)`: a smooth filled circle. Use it for dots, pellets, sparks, stars and particles (radius 0.5–1).
- `rk.block(x, y, w, h, ramp)`: a glossy tile with rounded corners, an ink edge and light and dark bands, for bricks, platforms and crates. Ramps: `'aqua'`, `'red'`, `'amber'`, `'heat'`, `'chrome'`. Made once per size and ramp, so a wall of them is cheap.
- `rk.shape(shape)` or `rk.shape([shape, …])`: shapes (same keys as in sprites) drawn straight onto the world, in world pixels: no outline, nothing kept. For things that change every frame (a shield's arc, a flame, a trail). For lots of shapes that do not change, make a sprite instead.
- `rk.C`: every colour by token (`rk.C['sky-2']` or `rk.C.sky2`), for direct `ctx` work only.

## Backdrops

- `rk.backdrop.dusk({ scroll, sun })`: banded sunset, sun, two mountain ridges, ink ground from y 166. For land and water games and the title screen.
- `rk.backdrop.space({ scroll, planet, terrain })`: dark bands, stars, a banded planet, stepped terrain along the bottom (to about y 150). For shooters.
- `scroll` is how far the world has moved (pixels); the layers move at different speeds (parallax). Pass `{ terrain: false }` or `{ planet: false }` to remove a layer.
- For a world of your own, make a 320 × 180 sprite of shapes with `outline: false` in `init` (bands as rects, hills as polygons, a sun as a circle with a list of bands, stars as small circles) and draw it with `rk.draw(name, 0, 0)` first in `draw`. See `paintOrbit` in `games/orbit-siege`.

## Effects

- `rk.glow(x, y, radius, colour = 'aqua', alpha = 0.45)`: a soft halo for emissive things (shots, engines, explosions, the ball). Call it inside `draw`, every frame it should show. Does nothing when Effects is off.
- `rk.popup(text, x, y, colour)`: floating text that rises and fades (score values, "x2"). Short: 1–6 characters.
- `rk.banner(text, seconds = 1.5)`: a chrome banner across the middle of the playfield (STAGE 2, GET READY). ALL CAPS, two words at most. One at a time: two banners at once sit on top of each other.
- `rk.shake(pixels = 2, seconds = 0.2)`: screen shake, capped at 4 pixels and 0.25 s. Use for big hits and explosions only.

## Sound (`rk.sfx`)

`rk.sfx(name)` with: `select`, `confirm`, `back`, `pause`, `blip`, `bounce`, `shot`, `hit`, `explosion`, `pickup`, `lifeLost`, `gameOver`, `newBest`. The kit already plays menu, pause, life-lost and game-over sounds; games play the rest.

Custom notes (use sparingly, keep them short): `rk.sfx.tone({ f: 440, to: 220, dur: 0.1, type: 'square', vol: 0.2, delay: 0 })` and `rk.sfx.noise({ dur: 0.3, from: 2400, to: 120, vol: 0.3 })`.

## Music

A game may have one soundtrack: an MP3 that Barney supplies (never a real game's music). The kit plays it; a game never touches audio itself. It takes three things:

1. **`games/<name>/music.js`**: the MP3 written out as text (base64) and nothing else. A comment saying what the track is, then one line:
   ```js
   /* MY GAME soundtrack: "Track name" (Barney's MP3), as base64 text. There is nothing here to edit by hand. */
   window.MY_GAME_MUSIC = "SUQzAwAAAAAv...";
   ```
   Make it from the MP3 with a few lines of Python (the file is several megabytes: never type or paste it):
   ```python
   import base64, pathlib
   mp3 = pathlib.Path('track.mp3').read_bytes()
   text = '/* MY GAME soundtrack: "Track name" (Barney\'s MP3), as base64 text. There is nothing here to edit by hand. */\n'
   text += 'window.MY_GAME_MUSIC = "' + base64.b64encode(mp3).decode('ascii') + '";\n'
   pathlib.Path('games/my-game/music.js').write_text(text, encoding='utf-8', newline='\n')
   ```
2. **One more tag** in the `<head>` of `index.html`, after the kit's two, so the build copies the track into the single game file:
   ```html
   <script src="music.js" data-rk-inline></script>
   ```
3. **The config option:** `music: { data: window.MY_GAME_MUSIC, level: 0.35 }`. `level` is how loud the track is against the sound effects, from 0 to 1 (1 = the file's full level). The default, 0.35, keeps the effects on top.

The kit then does everything, with nothing more from the game: it loops the track during play (trimming the silence an MP3 carries at each end, so the loop is clean), stops it for the pause menu and carries on from the same place, starts it from the top with each new game, fades it out when the game ends, keeps the title screen and menus quiet, and follows the Volume setting and the sound on/off button. The track is decoded once, behind the title screen. If it cannot be loaded, the game plays without it and the console says so.

The build allows only this pattern: a `music.js` beside `index.html`, holding only that one line, played through the `music` option. It warns about any other extra file and about audio code in a game. A track adds its size, plus a third (the cost of writing it as text), to `dist/<name>.html`.

## Helpers

`rk.rand(a, b)` (float), `rk.randInt(a, b)` (inclusive), `rk.pick(list)`, `rk.clamp(v, a, b)`, `rk.lerp(a, b, t)`, `rk.hit(a, b)` (rectangles `{x, y, w, h}` overlap). `rk.settings` is a read-only copy of the player's settings (`effects`, `reduceMotion`, …).

## Patterns

**Respawn after a hit**
```js
if (!g.dead && rk.hit(player, enemy)) {
  g.dead = true;
  rk.sfx('explosion'); rk.shake(3, 0.2);
  if (rk.loseLife() > 0) rk.after(1.2, () => { g.dead = false; g.inv = 90; /* reset position */ });
}
```
Blink while invulnerable: `if (g.inv > 0) g.inv--;` in update, and in draw `if (g.inv % 10 < 5) rk.draw('player', ...)` (6 blinks a second, the fastest allowed and only for the player's own sprite; `g.inv % 20 < 10` gives a calmer 3).

**Level clear**
```js
if (g.bricks.every(b => b.dead) && !g.clearing) {
  g.clearing = true;
  rk.sfx('pickup'); rk.banner('LEVEL ' + (g.level + 1), 1.5);
  rk.after(1.5, () => { g.level++; buildLevel(g); g.clearing = false; rk.hud.set('level', g.level); });
}
```
Keep helper functions (like `buildLevel`) as plain functions inside the same `<script>`, above `RetroKit.game(...)`.

**Smooth movement on screen** — keep positions as floats in state; drawing uses them as they are. Never round positions in state.

## Title screen

The kit lays its logo, tagline and menu over the middle of the world, and its buttons over the top corners. Treat `drawTitle` as a backdrop: a scene (default `rk.backdrop.dusk()`), plus at most a prop or two along the bottom band (y 150–180) away from the middle third. Never draw text or anything detailed behind the logo and menu.

## Testing (when a browser is available)

`RetroKit.current._debug` exists for automated checks only (never use it in a game): `state` (screen, score, lives, mode), `game` (the game's state object), `speed` (set to up to 20 to run game time faster), `view` (`k`: screen pixels per world pixel), and `start()`, `pause()`, `resume()`, `quit()`, `showGameOver()`. In a game with modes, `start('advanced')` starts that mode and `openModes()` opens the picker. In a game with music, `music` is the player: its `state` is `'ready'` once the track is decoded, `src` is set while the track is sounding, and `offset` is the place (seconds) it will carry on from. Open `dist/<name>.html` with a `file://` URL, watch the console and the screen (a game error also shows as a red chip at the top of the screen, class `rk-error`), press Enter to start, then drive the game with keys or by setting values on `_debug.game`. To check the kit itself, open `dist/kit-sampler.html`: every drawing part on four scenes, with a frame-rate readout.

