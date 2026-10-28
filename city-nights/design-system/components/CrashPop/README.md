# CrashPop

A comic-book word lit as a neon sign right over a crash: CRASH!, SMASH! or BANG!, each in its own burst, tubes and colours, with its Chinese sound-word on a small round tag.

## When to use
- When the player's taxi hits another vehicle. One pop per crash; the next crash replaces it.
- Not for anything else: not for near misses, pick-ups or points. Power-ups have their own pick-up.

## Markup
The game draws it on the meter's overlay canvas, over the picture. As HTML (previews, mock-ups), with the burst's outline as the shape of the board:
```html
<div class="cn-pop is-playing" aria-hidden="true">
  <svg viewBox="0 0 480 300"><polygon class="board" points="…"></polygon><polygon class="core" points="…"></polygon></svg>
  <span class="word">Crash!</span><span class="tag">轟</span>
</div>
```
`.is-smash` and `.is-bang` switch the colours and tilt; SMASH! adds four `crack` lines from its corners. `.is-playing` runs the pop once.

## The game provides
- Where the two vehicles meet, in screen position, and the moment they hit.
- Nothing else: the kit picks the word and draws, times and removes the pop.

## Rules
- **Over the crash** (Barney, 28 October 2026): the pop is centred on the point where the taxi and the other vehicle meet and drawn right over both of them, at 480 × 300 on a 720-line window (scale with the picture; about 0.54 of the picture's height wide on a phone).
- **Three words, each with its own shape and pair of tubes:**
  - CRASH!: a jagged burst of 22 spikes, `tube-red` edge with a `tube-core-red` core, letters `tube-core-yellow` edged `tube-yellow`, tilted -5°, tag 轟.
  - SMASH!: a shattered pane of 13 sharp sides and four cracks, `tube-yellow` edge, letters in red tube (`tube-core-red`, `tube-red`), tilted 4°, tag 啪.
  - BANG!: a cloud of 13 puffs, `tube-teal` edge, letters in pink tube (`tube-core-pink`, `tube-pink`), tilted -3°, tag 砰.
  - The kit picks one at random, never the same word twice in a row.
- The board inside the outline is `neon-board`, so the word reads over anything. Letters are `display` (Antonio) at 108px, skewed 8°, uppercase by `text-transform`, with the tube's glow and a 6px hard drop in `case` underneath: the comic part. The burst has no grain (`grain-signs`).
- **The one exclamation mark.** The pop is World copy, so it alone ends with "!"; the interface still never uses one.
- **Timing** (`pop-time`, 1 s): it springs in from 55% to 108% and settles at full size within the first fifth of a second, holds, dips once to half brightness like a neon tube catching, and fades out by the end. It is gone within `pop-time` so the player can see the road again.
- **Safety:** it never flashes; its one dip is well under the 3-a-second limit; it lights no more than about a quarter of the screen. **Reduce motion**: no spring, no dip, a fade in and out only.
- Chinese: 轟, 啪 and 砰 are on the word list for the Cantonese reader.
