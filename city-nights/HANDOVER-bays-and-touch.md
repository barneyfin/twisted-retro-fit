# City Nights: the bays made to stand out, and the side rule for touch (a kit and game change for Claude Code)

Written 31 October 2026 in Barney's Claude app project, where the design system lives. The design system is now **version 13**, and `city-nights/design-system/` is a fresh copy of it. Both changes come from Barney play-testing Grunge City Rider on his Pixel (kit 0.11.4).

Design decisions are made in the design system, not here. If something below looks wrong, stop and tell Barney rather than changing the drawings.

## What Barney decided (31 October 2026)

**The stop bay must stand out, especially on a phone.** He found it hard to see at 70 km/h:
- the low camera squashes it;
- the taxi hides it from about 20 m;
- the wash is faint, and a street lamp turns the middle and the lettering pale;
- the stretched road lettering can't be read.

He chose, from a round of four on the real street at 915 × 412 (the canvas's "Bays round 1" row):
- **Bold paint.** A deep fill of the bay's colour, darkened towards the road so a lamp can't turn it pale. Bold diagonal bars, and solid 0.3 m edges all round. The glow comes from the edges only. **No words on the road.**
- **A low lit sign at the bay's start**, reading 上客 PICK-UP or 落客 DROP-OFF. It stands 1.1–2.1 m up so the pin's tag never sits on it.
- **Three lit posts along the far half**, at 5, 7.5 and 10 m. They are 1.2 m tall, each with a steady band of the bay's colour.
- **Unchanged:**
  - teal for pick-up, pink for drop-off;
  - the kerbside place;
  - the size, 3 m by 10 m;
  - the bay's ring;
  - the pin;
  - nothing flashes or pulses.
- **The sign stays at the start.** Once the taxi is all the way in, the sign stands beside the meter and the caption for a moment. Barney kept it there rather than moving it to the far end, where it was hard to read on the way in.

**Touch: the side decides** (thumbs skid on his Pixel). This is what the game already does. The design system now records it as **Grunge City Rider's choice**, and other games stay free to choose:
- **Left of the taxi: drag to steer.** Held still, it does nothing.
- **Right of the taxi: hold to brake**, after 0.18 s. It brakes on its own and never steers.
- **A quick tap on either side: the horn.** Braking waits 0.18 s so that a tap doesn't also brake.
- A thumb's side is fixed when it lands and stays until it lifts, wherever it skids.
- The zones' shape and place don't change.
- **The touch hint's new line: "Left: drag to steer · Right: hold to brake".** The horn's tap is still left for players to find.

## Read first

1. `design-system/components/StopZone`:
   - the README for the rules;
   - the preview for the look: live drawings, the redrawn desktop stills, and two phone stills.
2. `design-system/components/bundle.js` (version 0.6.0). **Port these as they are:**
   - `CityNights.street.bay(kind)`: now makes `paint`, `glow`, `spill`, `sign` and `post`;
   - `drawBay`;
   - the new `bayStands(b, d0, x0)`.
   
   Barney approved renders made with this code (the canvas's "Design system version 13" row).
3. `design-system/components/TouchZones` and `TouchHint`, README and preview each.
4. `design-system/README.md`: the stop bay's lines (the colour section, "The stop bay", the camera note) and the touch zones line.
5. `design-system/tokens.json` and `tokens.css`:
   - `bay-sign-size` (1.6m 1m);
   - `bay-post-size` (0.2m 1.2m);
   - the teal and pink usage lines.
6. The lines added in `Passenger` (the waiting passenger stands just behind the first post) and `TargetPin` (the sign stands under the tag).

## The bay in the kit

**Pictures.** Where the kit adds the bay to the atlas (`atlasAdd('pc:bay:' + kind, …)` and its glow and spill), also add `b.sign` and `b.post` for each kind. Both are upright pictures with `ppm`, `ax` and `ay`, like the passengers:
- the sign is 100 pixels per metre;
- the post is 200 pixels per metre.

**The paint.** Draw it as now through `decalGL`, with the design system's new strengths:
- spill 0.45 (was 0.55);
- paint 0.95 (was 0.88);
- glow 0.75 (was 0.6).

**The sign and posts.** Stand them with the street's other upright things, sorted by distance, as the passenger is (`stand(…)` and `standGL`). `bayStands(b, d0, x0)` gives the places, with `x0 = BAY_X[0]` (-4.85), the bay's kerb edge:
- the sign 0.4 m before the bay's start, at `x0 - 0.85`;
- a post at 5, 7.5 and 10 m along, at `x0 - 0.3`.

**Grain.** Their light is a light (`grain-signs`, none), but the sign's legs and the posts' dark bodies sit in the same pictures. That is the same accepted difference as the tunnel's face (HANDOVER-tunnel.md, "Grain"). Use the signs' level, and tell Barney if it shows.

**Through a stop**, the sign and posts stay where they are:
- the pick-up passenger fades as now and stands just behind the first post;
- the bay's ring and the pin's tag-less state are unchanged.

**`decal()`.** The design system's `decal()` now shears each row along the road's edge (640 rows), so the bold edges don't step close to the camera in its own previews. The kit's `decalGL` already draws road pictures on the graphics chip, so there's nothing to port. Do check that the bold edges look clean in the kit when the taxi is in the bay.

**Clear stretches and tunnels.** These are unchanged: no bay, and so no sign or posts.

## Touch and steering in the game

**What changes.** The game already steers and brakes by side: `touchStep()`, `braking()` and `HOLD_S = 0.18` in `games/grunge-city-rider/index.html`. What changes is the words around it:

1. **The touch hint.** In the game's `CityNights.game({ … })` set:
   ```js
   touch: 'Left: drag to steer · Right: hold to brake',
   ```
2. **The gameplay note** (`GAMEPLAY-grunge-city-rider.md`, "Driving and controls", the Phone line):
   - say the design system now records the side rule (version 13, TouchZones) and give the new hint line;
   - take out "if it plays well … Until then the touch hint stays …".
3. **The kit's comment** over the touch zones (`city-nights.js`, about line 4096) still says "either thumb, in either zone". Change it to the design system's new comment: the zones say where touches count, and what a touch does is the game's choice.
4. **The test page** (`games/cn-sampler`). Its touch note says "Drag in either to steer, hold to brake". Make it say what the sampler actually does. Other games may choose either way, so the sampler can keep "either thumb" if that's what it does.
5. **`HANDOVER-play-screen.md`** (its touch line, "Either thumb, in either zone…") is replaced for Grunge City Rider by this note.

**Where the left/right split falls.** The game splits left from right at the screen's middle (`p.x < cn.W / 2`); the design system says "left/right of the taxi". These are the same while the camera keeps the taxi centred (it does in every lane), because touches between the taxi's sides fall outside both zones. If the camera ever moves off the taxi's middle, split at the taxi instead.

## The test page

- Add a way to see a bay at about 35, 20 and 12 m ahead:
  - in teal and in pink;
  - under a street lamp and away from one;
  - with the taxi in the middle lane and in the bay's lane.
- Add a way to see it with the taxi three-quarters in and all the way in.
- Show the touch hint with its new line on a phone.

## The speed check on Barney's Pixel

- Each bay adds four small upright pictures.
- Run the usual drive with bays coming and going, and put the slowest frame in `city-nights/README.md`, as before.

## Checks before handing back

- **The bay's look.** Side by side with the StopZone preview and the canvas's version 13 boards, the bay looks the same:
  - the paint, deep under a lamp;
  - the sign, low at the start and readable by about 12 m;
  - the posts, three along the far half.

  Barney has the canvas, so ask him to look.
- **Over the roof.** From the bay's lane, the sign and posts show over the taxi's roof from about 20 m.
- **No words on the road.** Nothing in or near the bay flashes or pulses.
- **The pin's tag** never sits on the sign.
- **On a phone:**
  - the hint reads "Left: drag to steer · Right: hold to brake";
  - left steers, right brakes after 0.18 s, and a tap on either side is the horn.
- **The build passes** its font and character checks. No new characters.

## Working rules (as before)

- Don't edit `city-nights/design-system/`. Changes go to the design system first.
- Git is Barney's: hand him the commands.
- The commit message for this change is **CM49.txt** in the repo root. CM48 is the design-system refresh that brought this note.
