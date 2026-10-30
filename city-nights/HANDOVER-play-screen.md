# City Nights: Grunge City Rider's play screen (a kit change for Claude Code)

Written 30 October 2026 in Barney's Claude app project, where the design system lives. The design system is now **version 10**, and `city-nights/design-system/` is a fresh copy of it. This note is for the kit change, step 1 of "Then, back in Claude Code" in `GAMEPLAY-grunge-city-rider.md`. It covers the long street, the play screen's new parts, the two soundtracks and the sound bed, and what the test page gains. The game itself (step 2) is a separate job that comes after this one.

Design decisions are made in the design system, not here. If something below looks wrong, stop and tell Barney rather than changing the drawings.

## What Barney decided (29 and 30 October 2026)

These follow the gameplay note's list "For the design system", item by item.

1. **The crash pop for roadworks**: a crash into a barrier or a cone gets the same three words and the same debris. The debris is the taxi's own parts and glass, so it tells either crash. Under the pop, the vehicle hit is cleared away. After a roadworks crash, the taxi is moved into the open lane in the pop's first second.
2. **Longer districts**: each district is `district-length`, 3.7 km, so the street is about 15 km. Competitive jumps to the next district after five fares; Practice drives on through.
3. **The zone change**: a film title, `zone-time` (3.4 s) in all.
   - The street dims to `zone-shade` (never to black, never a flash).
   - The caption grows into a big title in the middle: first the district just finished, with five lit lamps and its takings; then the next district and its round. Meanwhile the street fades across from the old place to the new.
   - The taxi's jump and, when it is due, the music's switch happen under it.
   - **The game holds still while it shows**: the clock and the fare do not run.
4. **Lives**: three small taxis in the meter's heading. A lost one stays as a faint shape.
5. **Zone progress**: a third line in the caption, 輪 ROUND n, with five fare lamps, one lit for each fare done in this zone.
6. **The tip**: 小費 TIP on the meter, sharing the time's row.
   - Unlit when no passenger is aboard.
   - Counts up during a ride.
   - Shows dashes for the rest of a ride once the tip is lost.
7. **The bay**: once three-quarters of the taxi is inside it, the bay's colour gathers in a ring of light on the road round the taxi, close to it.
   - The ring fades in over `ring-fade` (0.3 s) and fades out once the stop counts.
   - There is only that one ring. 保's ring steps aside while the taxi is in a bay.
8. **The passenger getting in** (this works even while the taxi is still rolling): the passenger fades out where they stand, over 0.4 s. The taxi's TAXI roof sign goes out while they are aboard, as a hired Hong Kong taxi's does, and lights again when the fare is paid.
9. **Where the passenger is going**: a neon pin standing 3.2 m over the bay.
   - A drop-off gets a pink 落, the destination's name and the metres to go.
   - A pick-up gets a teal 上 and the metres to go.
   - Until the bay is in view, the pin stands over the far end of the drawn road (about 80 m away) in the bay's lane.
   - **Destinations are named after the street's own signs.**
10. **Active power-ups**: badges just under the taxi's rear bumper.
    - 快 has a ring round it that empties over its 10 s.
    - 保 shows as a badge, and also lights a blue ring on the road round the taxi.
    - The fare boost shows as 錢 or 雙.
    - The five power-ups' final names and effects are in the PowerUp table.
11. **A shielded hit**: a small blue neon sign of the crash pop's family, without the smoke: a shield with 保 and SAFE!.
    - The car or barrier hit is cleared away underneath it.
    - There is no freeze, and no life or tip is lost. 保's badge and ring go.
12. **Messages during play**: only the receipt slip, printed out of the top of the meter while the caption steps aside. It takes `receipt-time`: 0.25 s up, 2 s held, 0.25 s back in. It prints in three cases:
    - a fare paid: fare, tip, any boost and the total;
    - the tip halved: the tip before and after;
    - the tip lost: the tip struck through.
13. **Sound**: the sound bed and the game's sounds as the gameplay note lists them; the two soundtracks; and the switching rules in the Sound section. In short:
    - a track starts from its beginning when the music switches to it, and carries on through zone changes that keep the same track;
    - Competitive fades the old track during the zone change; Practice fades it over about 2 s at the district line;
    - pause keeps the place, a new game starts the first track from the top, and game over fades the music out.
14. **Words**: 小費 TIP and 輪 ROUND are on the word list, both flagged for the Cantonese reader. The fonts are re-cut and hold 122 characters.
15. **Phase 3's leftovers**, now in the design system:
    - Automatic's step is 17.5 ms (`auto-smoothing-off`);
    - the animals' bolting speeds, the contact shadows and the chickens' places are recorded as the kit has them;
    - where settings and scores are saved;
    - the meter holds at HK$999.99, which is enough for this game.

From the full play screen, also decided:
- **Touch zones**: two zones, each running from the top of the meter's case to the bottom of the screen. The left zone runs from the left edge to the taxi, the right zone from the taxi to the right edge.
  - Either thumb, in either zone, can drag to steer, hold to brake, or tap quickly for the horn.
  - A touch that starts in a zone keeps counting wherever it moves. A touch that starts anywhere else does nothing.
  - The touch hint's line stays as it is.

## Read first

1. `design-system/README.md`:
   - the new section "In play: where the passenger is going, the receipt, the zone change";
   - the lines dated 29 or 30 October 2026 in the two layers, colour, type, the taxi meter, the crash pop, power-ups, the street's pieces, motion and safety, layout, sound, the Picture setting and saving.
2. The six new components: `TargetPin`, `TaxiMarks`, `ReceiptSlip`, `ShieldSign`, `ZoneTitle` and `TouchZones`. Then the updated ones: `Meter`, `DistrictCaption`, `PlayScreen`, `StopZone`, `Passenger`, `PowerUp`, `CrashPop`, `Animal` and `TouchHint`.
3. `design-system/components/bundle.js`: `CityNights.hud`, which is new, and `digits()`, where a comma is now an unlit decimal point. **Port `hud` as it is.** Barney compared the canvas boards "Design system version 10 · drawn by its own code" with the mock-ups he picked, and those boards were drawn by this code.
4. `design-system/tokens.json` and `tokens.css`:
   - 8 new colours: `tube-core-blue`, `lamp-unlit`, `lamp-unlit-ring`, `life-lost`, `receipt-paper`, `receipt-ink`, `receipt-red` and `zone-shade`;
   - new picture tokens: `district-length`, `pin-size`, `badge-size`, `ring-fade`, `receipt-time`, `shield-box` and `zone-time`;
   - `auto-smoothing-off` is now 17.5ms;
   - a new type group, "Play: the information and the moments".
5. `design-system/words.md`.

## How the drawing code fits the kit

**Copying it in**
- `hud` follows `street` in bundle.js. Copy it in beside the kit's `street`, unchanged.
- It takes colours by token name through `popCol` and `popAlpha`, as `street` does, so add the 8 new colour names to the kit's colour table in `city-nights.css`.
- It uses Noto Sans TC 700, Noto Serif TC 900, IBM Plex Sans Condensed 500 and 600, Antonio 700 and Bangers. The kit already loads all of these before the street is built.

**Units**
- **Screen pieces** (`caption`, `pin`, `badges`, `receipt`, `shieldSign`, `zoneTitle`) take positions in canvas pixels, with no transform set. They also take two scales:
  - `k`: canvas pixels per pixel of a 720-line window. The kit's picture is 540 lines, so k is 0.75 × the canvas pixels per picture pixel.
  - `m`: canvas pixels per CSS pixel. It sets the smallest sizes on phones.
- **Road pieces**:
  - `bayRing(g, pt, laneX, tube, a)` takes the street's `pt(d, x, y)`, like `CityNights.street`, and draws in picture units. Its blur widths follow the canvas's transform.
  - `shieldRing(g, x, y, s)` takes the taxi's rear on the road and the pixels per metre there.
  - `lives(g, x, y, h, n)` draws in the caller's units.

**Canvases** (PlayScreen)
- `cn-world` is the street.
- `cn-marks` is new and covers the whole window. It holds the pin, the badges, 保's ring and the SAFE! sign.
- `cn-hud` holds the meter, the caption and the receipt slip.
- The zone title and its shade go on a canvas above the meter's (ZoneTitle).
- **Changed 30 October 2026 (design system version 11):** 保's ring is drawn on the road before the taxi, as the bay's ring is, not on `cn-marks`. The taxi hides what is under it, so its rear bumper and number plate stay clear (Barney's choice from the test page). `cn-marks` keeps the pin, the badges and the SAFE! sign. `hud.shieldRing` is unchanged, and the ring still steps aside while the bay's ring shows and goes with its badge when the shield is used. This replaces what this note says about 保's ring in the `cn-marks` line above and under "The other pieces". The commit message for this change is CM31.txt (CM29 is kit 0.9; CM30 is the design system refresh that brought this line).

**The meter**
- This is the one piece the kit draws with its own code; the design system's meter is HTML and CSS.
- Grunge City Rider's version follows the Meter README's geometry and `.cn-meter.has-lives` in bundle.css:
  - the face is 16 wider;
  - the lives sit in the heading, drawn with `hud.lives(g, x, y, 15.5, n)` in the meter's units;
  - the middle row is shared: TIP on the left and TIME on the right, each label over its digits, 21.8 high.
- Make it a choice a game makes, so other City Nights games keep today's meter.
- The canvas digits need the comma: `' ,  '` for an unlit tip row, and `'-.--'` for a lost tip. The HTML `digits()` is the design system's, so copy its change too.

**The caption**
- `hud.caption` draws the kit's two lines at the kit's sizes and places, plus the round line when it is given a round.
- Use it in place of the kit's own caption code, so the two can't drift apart. A game without rounds leaves `round` out.

**The receipt**
- It goes on the meter's canvas, standing on the meter's case, and the caption fades while it shows.
- Check that the receipt and the caption's round line both fit inside the meter's canvas, which today starts 200 picture pixels down. Check on phones too, where the minimum sizes make them larger.

**The bay's ring**
- It must be drawn on the road before the taxi, so that the taxi hides what is under it. The kit draws the taxi with WebGL, so the ring cannot simply go on a canvas over the picture.
- How to do it is your call. One way: the ring is always at the taxi, so it can be laid on the road in the street's own pass, like the bay's light.
- Its three blurs are slow to draw every frame. Draw it once per colour (and again after a resize) and reuse it, changing only its opacity, as the kit does with the crash pop's words.
- For `laneX`, pass the taxi's own x. The code's comment says "lane centre" only because the taxi sat in the middle of its lane in every approved picture. StopZone's rule is that the ring is round the taxi's middle.

**The other pieces**
- **The SAFE! sign**: draw it once into its own canvas at the window's size, like the crash pop's words. Then each frame draws that canvas with the spring scale and opacity, over the crash pop's life (`pop-time`).
- **The pin, the badges and 保's ring** are cheap, so draw them each frame. The badges and the ring follow the taxi's sway.
- **The roof sign**: bake the hired look into the taxi's pictures beside the lit one. Hired means the face is about 86% of the way to `case`, TAXI only just shows, and there is no glow.
- **The passenger** fades over 0.4 s, where they stand.

**The zone change**
- The game holds still during it, so the old place can be kept as a still picture while the new one draws.
- `zoneTitle` draws the title at its final place and size. The grow from the caption's place, and the shrink back into it, come from moving and scaling what it draws. Under Reduce motion the title only fades.

**Touch**
- `hud.touchZones` gives the two rectangles, in CSS pixels. Count only touches that start inside them.
- Today the first finger moves `pointer`, and a second finger can only tap or hold (`pointer2`). Now either thumb must be able to drag, hold or tap, so `pointer2` needs its movement too. The tiles stay outside the zones.

**The long street**
- Today the street is 560 m: 1,120 segments of 0.5 m. At 3.7 km a district it is 14.8 km, about 29,600 segments, 26 times as many. Keep the look of each district as it is.
- Traffic, obstacles and animals per zone are the game's (the gameplay note's table).

**Moving things at once**
- The game must be able to:
  - clear a vehicle or a barrier away, under the crash pop or the SAFE! sign;
  - move the taxi across into another lane at once, under the pop;
  - jump the taxi to a district's start, under the zone title.
- None of these should set off the kit's sway, roll or suspension.
- `street.crash(z, x)` must also light the pop where the taxi meets a barrier or a cone.

**Names for the pin**
- The game needs the names of the signs beside a bay. The kit knows its signs, so give the game a way to ask for them.

**Sound**
- The build takes one soundtrack today; a City Nights game may now have two (ARCADE.md). Switch between them as the Sound section says.
- The gameplay note puts the engine note and the sound bed in this kit change.
- The design system doesn't set the sound bed's loudness against the music. Make it adjustable on the test page and let Barney choose it by ear.

Add everything new to the "Public API" comment in `kit/city-nights.js`.

## Rules to keep (from the design system)

- **During play nothing else goes over the street.** Each piece of information belongs to a place. The receipt slip is the only message, and the zone title the only interruption.
- **Nothing over the lane ahead**: what the taxi meets first appears 20 to 80 m up its own lane, just above its roof. The SAFE! sign's one second is the only exception.
- **One at a time**: one pin, and one receipt (a new one replaces the one showing).
- **The pin is steady**: no bob and no pulse.
- **Lights take no grain**: the pin, the rings, the badges and the SAFE! sign.
- **Safety**:
  - nothing flashes, and the zone shade never goes black;
  - the bay's ring fades in and out and never pulses;
  - 快's ring empties smoothly.
- **Reduce motion**:
  - the receipt fades in and out where it stands;
  - the SAFE! sign and the zone title only fade;
  - a waiting passenger holds the hailing pose.
- **On phones**: the meter keeps its place and size, and so do the life icons (about 9 CSS pixels tall). The minimum sizes in the code stand.
- **Words and colours**:
  - Chinese only from `words.md`, and a destination is always a sign's name;
  - colours only by token name.
- **Animals** always escape and never get a crash pop. A shielded animal hit shows the SAFE! sign, and the animal bolts as usual.

## Fonts

- Copy `design-system/fonts/NotoSansTC-Bold-CityNights.woff2` and `NotoSerifTC-Black-CityNights.woff2` over the kit's in `kit/fonts/`.
- Then run `python city-nights/kit/build.py --characters` to remake `characters.txt`.
- The fonts now hold 122 characters: 小, 費 and 輪 are new, and the old ones are unchanged.

## The test page

Keep the six scenes. `games/cn-sampler` gains:

**A play-screen scene**: everything at once on the street, as in the canvas board of the busiest ride, plus a way to step through each state:
- the meter: the tip row unlit, counting, then dashes; lives from 3 down to 0;
- the caption's round line, with 0 to 5 lamps lit;
- the pin: a pick-up, a drop-off far off, near, inside the bay, then gone;
- the badges: 快's ring emptying, 保, then 錢 or 雙;
- 保's ring stepping aside in a bay;
- the bay's ring fading in and out;
- the passenger fading and the roof sign going out, then lighting again;
- the receipt in all three cases;
- the SAFE! sign, over a car and over a barrier;
- the crash pop at roadworks, with the move into the open lane;
- a zone change in Competitive, and the Practice crossing, each with its music switch;
- the touch zones outlined (for the test page only; nothing marks them in play);
- the sound bed and the engine note, with the sound bed's loudness adjustable.

**The long street**: a way to start in any district, and to drive through all four.

## Still left to the game (step 2, not this job)

- **Every rule in the gameplay note**:
  - the clock, lives and the freeze;
  - the fare and tip sums;
  - when each piece shows and what it says: the pin's distance, the receipt's lines, the round and the fares done;
  - where power-ups, passengers and bays appear;
  - which sound plays when;
  - the two modes.
- **Which sign names a destination.**
- **To raise with Barney before the game is built**: a zone can run past the end of its district. Five fares take about 2.9 km of driving on average and 3.9 km at the most, before any missed bay, and each miss adds 100 to 300 m. It should be rare, but the rules don't say what happens then. This is Barney's call.
- **The starting figures**, to be tuned once Barney has played.
- **PRD question 8**: a Cantonese reader checks `words.md`, including 小費 and 輪.

## The speed check, again on Barney's computer and Pixel

Run it as before: Chrome, every other copy of the page closed, scene 2, and the same targets (phone at least 30 frames a second with each frame drawn in 25 ms or less; computer 60 frames a second). It gains:

- **A fourth run**: the play screen with everything at once (pin, badges, 保's ring, the caption's round line, a receipt showing, street pieces and traffic). Also time the zone change's cross-fade.
- **How long it takes to open**, with the long street:
  - from opening the file to the title's street showing, and to Start game working;
  - the street's build on its own.
  - Compare both with today's.
- **Graphics memory**:
  - the kit's own count of what it puts on the graphics chip (buffers and textures, in MB), shown on the plaque;
  - on the computer, Chrome's Task Manager (Shift+Esc) GPU memory column as well.
- **The music**:
  - the page's memory with both tracks decoded, expected to be about 120 MB (Task Manager's Memory footprint on the computer);
  - on the Pixel, whether Chrome reloads the tab or the music stutters at a switch;
  - the built file's size with two tracks (about 10.8 MB more) and its opening time.

Put the results in `city-nights/README.md` beside the earlier ones.

## Checks before handing back

- Side by side with the design system's previews, and with the canvas row Barney approved, each piece looks the same on a computer and a phone. Barney has the canvas, so ask him to look.
- Frame times hold with everything on screen.
- **Reduce motion** behaves as above.
- **A shielded hit** gives no crash pop, no freeze, and no life or tip lost.
- **Touch**: a touch outside the zones does nothing, and the tiles still work.
- **The music** follows the switching rules in both modes. Pause keeps the place, a new game starts from the top, and game over fades out.
- The build's font and character checks pass with the new fonts.

## Working rules (as before)

- Don't edit `city-nights/design-system/`. Changes go to the design system first.
- Git is Barney's: hand him the commands. The commit message for this change is **CM27.txt** in the repo root. CM26 is the design system refresh that brought this note.
