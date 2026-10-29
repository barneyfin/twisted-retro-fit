# CrashPop

A comic-book word lit as a neon sign right over a crash: a cloud of smoke in a cream tube, CRASH!, SMASH! or BANG! in big comic letters on a rising curve, neon debris that tells what happened, and the word's Chinese sound-word on a small round tag.

## When to use
- When the player's taxi hits another vehicle. One pop per crash; the next crash replaces it.
- Not for anything else: not for near misses, pick-ups or points. Power-ups have their own pick-up.

## How it is drawn
The drawings are data, `CityNights.crashPop`, and `CityNights.drawCrashPop` draws them with Canvas 2D: paths, gradients, glows and text in the kit's fonts. There are no image files.

```js
// once the fonts are loaded (Bangers 400 and Noto Sans TC 700):
CityNights.drawCrashPop(ctx, 'crash', x, y, scale);   // 'crash', 'smash' or 'bang'
```
- `x, y` is the pop's centre in canvas pixels; `scale` is canvas pixels per pixel of a 720-line window (window height in device pixels / 720). The box is `crashPop.box`, 1080 × 700 around the centre (`pop-box`).
- **Draw each word once, not every frame.** Draw it into its own canvas at the size the window needs, when the game starts and whenever the window is resized; the pop's life is then that canvas drawn with a scale and an opacity. Each drawing has 13 to 18 layers and up to 15 glows: in a test browser with no graphics chip one word took about 0.2 s at 720 lines, most of it the glows. So draw all three while the title screen shows, never at the moment of a crash.
- Each layer is one of: `halo` (a soft `sodium` ellipse), `smoke` (a path filled `neon-board`, then lit from `face-cream` 30% at its centre to `sodium` 10% at its edge), `fill` (paths in a colour at an opacity: BANG!'s flames), `tube` (paths stroked in a tube colour with its glow, then its white-hot core), `tag` (the round tag and its character) and `letters`.
- **The glow**: a tube's strokes are drawn sharp, then copied back with two soft blurs, standard deviation 13 and 4 pixels (`crashPop.glow`), and then sharp. In Canvas 2D a shadow blur of twice the standard deviation, times `scale`.
- **The letters**: `pop-word` (Bangers), one letter at a time, each placed, turned and sized as `letters` lists. For each: the dark extrusion (`case`, filled and stroked 18px, moved 9, 11 along the letter), the black comic outline (`case`, stroked 18px), the lit face (a gradient from the top of the letter's box, the font's ascent, to its foot, the descent) and a 3px edge tube with its 1px core.

The preview above draws with this same code, so what it shows is what the game shows.

## The game provides
- Where the two vehicles meet, in screen position, and the moment they hit.
- Nothing else: the kit picks the word and draws, times and removes the pop.

## Rules
- **The smoke cloud** (Barney, 29 October 2026, round 2 direction B: "fits the overall game theme better"). It replaces the first round's bursts.
- **Over the crash** (Barney, 28 October 2026): centred on the point where the taxi and the other vehicle meet, drawn right over both of them, and moved only as far as it needs to stay inside the picture. At this size it covers about four-fifths of a 16:9 window's width, so the vehicles are hidden while it is lit.
- **Three words, each telling its own crash:**
  - **CRASH!**, parts fly off: a `tube-yellow` wheel, a `tube-teal` spring and bolt, `tube-pink` nuts, yellow stars, cream motion trails. Letters lit yellow (`pop-crash-light`, `tube-yellow`, `pop-crash-deep`), edged `tube-red`. Tag 轟 in a `tube-red` ring.
  - **SMASH!**, glass breaks: `tube-teal` shards with cream trails, cream cracks bursting out of the cloud, a broken `tube-yellow` headlamp, white glints. Letters lit red (`pop-smash-light`, `tube-red`, `pop-smash-deep`), edged `tube-yellow`. Tag 啪 in a `tube-yellow` ring.
  - **BANG!**, something bursts: `tube-red` flame tongues with `tube-yellow` inner flames behind the cloud, dashed `tube-yellow` shock rings, a `tube-teal` hubcap, `tube-pink` sparks and nuts, white glints. Letters lit pink (`pop-bang-light`, `tube-pink`, `pop-bang-deep`), edged `tube-teal`. Tag 砰 in a `tube-teal` ring.
  - The kit picks one at random, never the same word twice in a row.
- **The one exclamation mark.** The pop is World copy, so it alone ends with "!"; the interface still never uses one. **Bangers** is used here and nowhere else.
- **Timing** (`pop-time`, 1 s): it springs in from 55% to 108% and settles at full size within the first fifth of a second, holds, dips once to half brightness like a neon tube catching, and fades out by the end. A game may freeze its street for longer after a crash; the pop does not wait for it, so for the rest of the freeze the player sees the frozen taxi and the vehicle it hit (Barney, 29 October 2026).
- **No grain** on the pop (`grain-signs`).
- **Safety:** it never flashes; its one dip is well under the 3-a-second limit. It is big, but most of it is dark smoke: what is lit is tubes, letters and debris. **Reduce motion**: no spring, no dip, a fade in and out only.
- Chinese: 轟, 啪 and 砰 are on the word list for the Cantonese reader.

## Changing a drawing
The drawings were made as SVG and converted to `crashPop` (coordinates moved so the centre is 0, 0; colours turned into token names). To change one, change the drawing and convert it again; don't edit the numbers by hand.
