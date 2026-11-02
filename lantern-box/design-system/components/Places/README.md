# Places

The four places, one per level, each a whole paper theatre drawn by `LanternBox.world.drawPlace`: sky and light, clouds, four backdrop layers, flyers, the play strip, the fore layer and the vignette.

## When to use
- Every level is one place. Night, the graveyard at the edge of the village; Blood-red rain, the old town; Dawn, the open moor; Mist, the wind-bent forest. No others.

## Code
```js
const W = LanternBox.world;
W.drawPlace(canvas, { level: "storm", t: seconds, camX: 600, walking: true, facing: 1, rm: reduceMotion });
// the picture is 540 lines tall (W.LH); its width follows the canvas. W.places[level] has name, place and desc.
```
Lower down: `W.scene(scale)` returns the shared `Scene` (version 5, the approved look), whose `render(ctx, off, s, W, t, camX, W.options(level, extra))` is what `drawPlace` calls.

## The game provides
- The level, the time, the camera, whether the wanderer walks and which way they face, and Reduce motion. The kit draws the place the kit's way (layers painted once in tiles and slid); this mock-up way is the reference for how it must look.

## Rules
- Back to front: the sky blend (`night-sky-1` … at 0, 45%, 80% and 470 lines); the light (Night and Blood-red rain a detailed moon with a halo; Dawn stars, daybreak on the left and a pale moon setting on the right; Mist a pale sun with rays); ragged cut-card clouds in two depths (none in Mist, which has long mist bands instead); backdrop layers 1 to 4, each `ink` mixed towards the place's air by its tint; flyers between layers 2 and 3 and between 3 and 4; the play strip; the fore layer (plants at the bottom, overhanging branches at the top); a vignette.
- Each place has a lift (`night-lift` …): it is drawn as if the camera stood that much higher, with the path kept at its height, so each layer sits higher by the lift times (1 - its parallax). The path, the rain, the fore layer and the vignette do not move.
- Layers slide at their `parallax` rates. Blood-red rain adds rain in two depths (behind layer 2 and in front of the strip) and distant lightning: a bolt and a slow swell on the sky only.
- In Night and Mist the nearest backdrop layer is a step lighter, with a haze rising behind the path, so the black monsters stand out.
- The canvas HUD the directions page drew was a sketch; the HUD is HTML (PlayScreen).
