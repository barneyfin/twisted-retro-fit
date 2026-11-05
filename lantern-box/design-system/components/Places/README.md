# Places

The four places, one per level, each a whole paper theatre drawn by `LanternBox.world.drawPlace`: sky and light, clouds, four backdrop layers, flyers, the play strip, the fore layer and the vignette.

## When to use
- Every level is one place. Night, The Graveyard (at the edge of the village); Blood Red Rain, The Old Town; Dawn, The Open Moor; Mist, The Wind Bent Forest. No others.

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
- Back to front: the sky blend (`night-sky-1` … at 0, 45%, 80% and 470 lines); the light (Night and Blood Red Rain a detailed moon with a halo; Dawn stars, daybreak on the left and a pale moon setting on the right; Mist a pale sun with rays); ragged cut-card clouds in two depths (none in Mist, which has long mist bands instead); backdrop layers 1 to 4, each `ink` mixed towards the place's air by its tint; flyers between layers 2 and 3 and between 3 and 4; the play strip; the fore layer (plants at the bottom, overhanging branches at the top); a vignette.
- Layers slide at their `parallax` rates. Blood Red Rain adds rain in two depths (behind layer 2 and in front of the strip) and distant lightning: a bolt and a slow swell on the sky only.
- In front of a cloud, a far part is lit through a cloud (version 10): where a cloud is behind them, backdrop layers 1 and 2 and the far bat swarm are `ink` mixed towards the cloud's own colour, by `thru-cloud` (0.75) of their tint, instead of towards the air, so they read a step darker than the cloud and never lighter, with a soft edge (the clouds' band drawn from blurred copies of the clouds, `thru-cloud-soft`), and the far layers only `thru-cloud-far` (0.55) of the way to that colour (version 11). Nearer layers are already darker than the clouds and are unchanged.
- In Night and Mist the nearest backdrop layer is a step lighter, with a haze rising behind the path, so the black monsters stand out.
- The canvas HUD the directions page drew was a sketch; the HUD is HTML (PlayScreen).

## Version 8
- The play strip's floor now rolls in hills, banks and pits, with each place's pieces (Ground, play.js). The moor's sky has crow flocks and the Mist leaves on the wind (Flyers). Blood Red Rain is the place's name, capitalised, with no hyphen (Barney, 4 November 2026).

## Version 9
- The place list (`W.places`, bundle.js's `LV`) uses the agreed names, proper names capitalised: `name` Night, Blood Red Rain, Dawn, Mist; `place` The Graveyard, The Old Town, The Open Moor, The Wind Bent Forest; the descriptions name them the same way. Nothing a player sees uses it (the place card's words are in play.js). The moor's crow flocks are darker (Flyers).

## Version 10
- Lit through a cloud. Night's violet clouds and Blood Red Rain's dark red ones are darker than the far backdrop layers and the bat swarm, so wherever a distant tower, spire, hill or bat crossed in front of a cloud it showed lighter than the cloud, as if lit from the front or cut out of it (Barney, on his Pixel, 4 November 2026). Now those parts take the cloud's own colour, a step darker, where a cloud is behind them, and keep their usual colour everywhere else, as a paper theatre lit from behind would show them. Only the clouds' band, from the top of the picture down to the lowest cloud (`cloudFoot`), is composited (Barney chose this over hazing the clouds or keeping clouds and far parts apart).

## Version 11
- **The two tones softened** (Barney, round 13): a far tower only partly in front of a cloud was two-toned, dark above the cloud's edge and pale below, and read as one tower showing through another. Now the change has a soft edge (blurred copies of the clouds, made once, drawn twice into the clouds' band so a thin tail still darkens) and layers 1 and 2 go only 0.55 of the way to version 10's darker colour, so the tower reads as one, a little darker where the cloud is behind it. The bat swarm goes all the way, with the same soft edge. The speed is version 10's. Where the browser has no canvas filter, the copies are softened by shrinking and growing them instead.
