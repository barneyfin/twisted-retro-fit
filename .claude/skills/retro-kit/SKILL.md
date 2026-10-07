---
name: retro-kit
description: Make, change or fix a browser arcade game in the Retro Games folder using Retro Kit, the shared look (a smooth retro world drawn as shapes, modern glass interface), game shell, sound and single-file build. Use for every game request here, e.g. "make a Frogger-style game", "add a boss", "the ball is too fast".
---

# Retro Kit

Every game in this folder is built on Retro Kit (`kit/`). The kit already provides everything games share: the title screen, menus, a choice of game modes, HUD, pause, game over, initials entry, high scores, settings, the phone layout and rotate prompt, keyboard and touch input, sound, music, sprites, backdrops and the build. A game supplies only its rules and its art. Never rebuild what the kit does.

Before writing any code, read both files beside this one:
- [reference.md](reference.md): the full API: config, hooks, `rk` functions, game modes, input, sprites, sound, music.
- [design.md](design.md): the look: colours, sprite rules, effects limits, copy rules.

For a finished example of the patterns, read `games/dusk-shatter/index.html` (a Breakout-style game built with the kit); `games/orbit-siege/index.html` shows a full cast of shape sprites and backdrops made in code. Learn from their structure; do not copy their names, levels or art into a new game.

## Folder

```
Retro Games/
  kit/                  shared: retro-kit.css, retro-kit.js, fonts, build.py, template.html. Never edit for one game.
  games/<name>/index.html   one game's source: all its code in one <script> in this file
  games/<name>/music.js     optional: the game's soundtrack, an MP3 written out as text (reference.md, Music)
  dist/<name>.html      the built, self-contained game that gets played. Generated: never edit by hand, and not kept in git.
  games/kit-sampler/    the kit's own test page (every drawing part, a frame-rate readout). Not a game: never copy it.
```

## Making a new game

1. **Name it.** Invent an original name: never a real game's title, characters or logo (mechanics may be borrowed, names and art may not), and not a name already in `games/`. Folder name: the title in lowercase-with-hyphens. Title: ALL CAPS, at most 12 characters per line (use `\n` for a second line).
2. **Create** the folder `games/<name>/` (and `games/` itself if it is missing) and copy `kit/template.html` into it as `index.html`. Keep the two `data-rk-inline` tags exactly as they are. Set `id` to the folder name.
3. **Write the game** inside `RetroKit.game({...})`: config, `sprites`, `start`, `update`, `draw`. Keep all the game's code in that one file.
4. **Build:** from the Retro Games folder run `python kit/build.py <name>`. If `python` is not found, try `py kit/build.py <name>`, then (in Bash) `"$LOCALAPPDATA/Programs/Python/Python312/python.exe" kit/build.py <name>`.
5. **Check** before handing over (see Checklist), then tell Barney the game is at `dist/<name>.html` (double-click to play) and give the controls in one line.

## Changing an existing game

Read its `games/<name>/index.html` first, change only what was asked, rebuild with `python kit/build.py <name>`. Never edit `dist/` files.

## Rules that are not optional

- **Two layers.** The World (inside the playfield) is shape art: flat colour in hard bands with ink outlines, which the kit draws smooth at the screen's real resolution while the game works in a 320×180 world. Never pixel art, never a pixelated look. The Interface (menus, HUD, buttons, dialogs) is the kit's glass UI. A game never draws interface on the canvas and never builds its own HTML UI. A choice of ways to play (Classic and Advanced, Easy and Hard) is the kit's `modes` option, never a picker drawn in the world.
- **No text on the canvas.** Numbers and words in the world use `rk.popup()` (score pop-ups) and `rk.banner()` (STAGE 2, GET READY). Stats go in the HUD via `rk.hud.set()`.
- **Colour tokens only.** Every colour is a token name (`'aqua'`, `'chrome-300'`, `'sky-2'`) or a ramp name (`'red'`, `'chrome'`), never a hex value or CSS colour name.
- **Kit owns score, lives and the flow.** Use `rk.addScore()`, `rk.loseLife()`, `rk.gameOver()`. Do not keep your own score or lives, and do not make your own game-over screen.
- **Both controls, always.** Every game must be fully playable with the keyboard alone and with touch alone (phone in landscape). P and Esc are reserved for pause.
- **Offline, one file.** No images, audio files, fonts, libraries or network requests. Art is shapes (sprites and `rk.shape`); sound is `rk.sfx()`. One exception, and only when Barney supplies an MP3: a soundtrack. It lives beside the game as `games/<name>/music.js`, which holds the MP3 as base64 text and nothing else (one line: `window.MY_GAME_MUSIC = "...";`), is pulled in by `<script src="music.js" data-rk-inline></script>` after the kit's two tags, and is played by the kit through the `music` option (reference.md, Music). The build copies it into the one built file. A game never plays audio itself (no `AudioContext`, no `<audio>`), and no other extra file is allowed.
- **Safe effects.** Nothing flashes more than 3 times a second; no full-screen colour flashes. Shake only through `rk.shake()` (the kit caps it and respects Reduce motion). Halos only through `rk.glow()` (respects Effects).
- **Do not change `kit/`** to make one game work. If the kit lacks something a game needs, finish the game without it and tell Barney what the kit should gain.
- **Players are adults and teens:** standard arcade difficulty. Start gentle, ramp with each level or wave, keep every death readable (a clear cause, a short pause, then respawn).

## Checklist before saying a game is done

- [ ] `python kit/build.py <name>` printed "Built dist/<name>.html" with no warnings. (It checks for hex colours, canvas text, image or audio files, a game's own audio code, internet addresses, extra files and the old pixel-map way of drawing, and that a `music.js` follows the pattern above; fix every warning.)
- [ ] Every sprite is shapes (design.md, Characters and objects): nothing drawn as rows of letters or pixel by pixel, and no character that looks like a famous one.
- [ ] Title is invented and ALL CAPS; HUD labels and `keys` actions are sentence case.
- [ ] `keys` lists the real controls; `touch` describes the real gestures.
- [ ] Touch works: movement via `rk.input.pointer`, actions via `rk.input.tap` or `pointer.pressed`.
- [ ] Score, lives and game over go through `rk`; the game reaches the kit's game-over card.
- [ ] Every level can be finished, and the next one is harder.
- [ ] If you can run a browser, open `dist/<name>.html` and check the console has no errors and no red error chip shows on the playfield (reference.md, Testing). If you cannot, say so and ask Barney to play it.

## Telling Barney

Barney is learning to build software. Say what you made and why in plain words, in a few lines: the game in one sentence, the controls, where the file is, and anything you could not test. No jargon without a short explanation.
