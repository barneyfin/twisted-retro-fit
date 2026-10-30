# City Nights: 夜光隧道 Nightglow Tunnel at every district line (a kit change for Claude Code)

Written 30 October 2026 in Barney's Claude app project, where the design system lives. The design system is now **version 12**, and `city-nights/design-system/` is a fresh copy of it. This note answers item 16 of the gameplay note's list ("a sign or tunnel that hides a district's loop") and says what the kit and the test page gain.

Design decisions are made in the design system, not here. If something below looks wrong, stop and tell Barney rather than changing the drawings.

## What Barney decided (30 October 2026)

- **A tunnel, at every district line**, in every mode. It is not a sign.
- **Look B, under a tower.** The portal is the face of a tower block that spans the road, with its own lightbox and neon signs. The tunnel's name sits on a lightbox over the mouth: **夜光隧道 NIGHTGLOW TUNNEL**.
- **B's inside**: 12 m wall to wall and 4.8 m to the ceiling. Tiled lower walls, two continuous warm light strips, the far end lost in haze. About half the street's brightness.
- **The clear stretch.** For 40 m before each tunnel there are no hanging signs, and no bay, power-up, obstacle, animal or passenger. There are none of these inside a tunnel either. Traffic drives through.
- **Where a zone starts**: just inside the next tunnel's exit. The zone change jumps there, so every zone opens with the drive out into the new district.
- **The loop** (Competitive, a zone that reaches the end of its district). The taxi drives into the tunnel at that end and comes out of the tunnel at the start of the same district. The zone carries on unchanged.
- **The pin shows inside the tunnel**, over the far end of the drawn road, as it does on the street.
- **A new word**: 夜光隧道. 隧 is the only new character; the fonts are re-cut and now hold 123 characters.

## Read first

1. `design-system/components/Tunnel`: the README for the rules, the preview for the look. The preview has four stills and the face drawn by its own code.
2. `design-system/README.md`:
   - the new section "The tunnel at every district line";
   - "Where a zone starts", in the section before it;
   - the tunnel's colour line, and the Practice music line under Sound.
3. The lines added in `ZoneTitle`, `TargetPin`, `Signs`, `StopZone`, `PowerUp`, `Obstacle`, `Animal`, `Passenger` and `DistrictCaption`.
4. `design-system/components/bundle.js`: `CityNights.street.tunnelFace(ppm)`. **Port it as it is.** Barney approved renders made with it on the real street (the canvas row "Design system version 12").
5. `design-system/tokens.json` and `tokens.css`:
   - 17 new colours: `tunnel-face`, `tunnel-face-top`, `tunnel-fascia`, `aircon`, `signal-green`, `signal-glow`, `tunnel-tile`, `tunnel-tile-top`, `tunnel-wall`, `tunnel-wall-top`, `tunnel-ceiling`, `tunnel-road`, `tunnel-walk`, `tunnel-line`, `tunnel-strip`, `tunnel-glow` and `tunnel-haze`;
   - picture tokens `tunnel-size`, `tunnel-length`, `tunnel-face-size` and `clear-stretch`.

## How it fits the kit

**Where the tunnels go**
- There is one tunnel at each of the four district lines. That includes Mong Kok into Tsim Sha Tsui, at the lap's join.
- Each is `tunnel-length` long (180 m, a starting figure), with the district line in its middle: 90 m in each district.
- Plan them with the rest of the street when it opens. Make each tunnel in the same 25 m pieces as the rest of the street, but with walls, ceiling, walkways, road and light strips instead of buildings and signs.

**The face**
- Draw `tunnelFace(ppm)` once into the atlas. The preview's 48 pixels per metre makes a picture 648 × 1728, about 4.5 MB on the graphics chip. Choose the size the nearest view needs, from about 12 m.
- Stand it at the portal, square to the road and centred on it, like a sign. `ax`, `ay` is the middle of the mouth's foot.
- It takes colours through `popCol`, like `street`, so add the 17 names to the kit's colour table.
- It uses Noto Serif TC 900, Noto Sans TC 700 and Antonio 700, all of which the kit already loads.
- Grain: the face takes the buildings' level. The Tunnel README asks for no grain on its signs and lane signals, but they are in the same picture. That is the same difference the kit already accepts for eyeshine and the roadworks lamps (HANDOVER.md, "Known differences"). Tell Barney if it shows.

**The inside**
- Draw it in the street's perspective, with the sizes and colours in the Tunnel README:
  - tiled lower walls 2.2 m high, upper walls, the ceiling;
  - the road with its markings carried through;
  - 1 m walkways, and no people on them.
- **The light strips** run 0.45 m under the ceiling along both walls. They are lights: no grain, and they glow in the glow pass. Add a soft smear of them on the wet road.
- **The far end** fades into `tunnel-haze` by about 80 m (the kit's fog, coloured `tunnel-haze` inside), so no exit is in view deep inside.
- **Coming out**, the exit's light spills warm over the last 16 m.

**The jumps**
- **Zone change**: jump to just inside the next tunnel's exit, rather than to the district's start. It happens under the title, as now.
- **The loop**: jump from the district line, in the middle of the tunnel at the end of the zone's district, to the same point in the tunnel at its start. The rules for the jump:
  - move the taxi with `street.place` (no sway or roll);
  - carry the traffic near the taxi across by the same distance;
  - make the new pieces there and then.
- All four tunnels are the same inside, so the picture is all tunnel before and after the loop jump, and nothing in view changes. That is what lets the kit make new street during that quarter of a second.

**The caption** changes at the line, mid-tunnel, as at any line. On a loop it must not change or announce anything, because the district is the same. Make sure the line-crossing code doesn't fire on the jump.

**Music**: Practice's switch at the Yau Ma Tei line, and back at Tsim Sha Tsui, now falls inside a tunnel. No change should be needed.

**The clear stretch**: the kit's sign planner leaves the last 40 m before each portal, and the tunnel itself, without hanging signs. The game keeps its bays, power-ups, obstacles, animals and passengers out of both.

**The pin** works as on the street: over the far end of the drawn road in the bay's lane, which is inside the tunnel while the taxi is in it.

## Rules to keep (from the design system)

- **The jump is invisible**: all four tunnels are the same inside and at the exit, and the loop's jump happens deep inside.
- **No lamps.** The light comes only from continuous strips; lamps 4 m apart would pass over the taxi about five times a second, over the 3-a-second limit. The lane signals are steady. Nothing flashes.
- **Brightness**: about half the street's inside, never below `zone-shade`'s dim. It changes as each mouth fills the view, over about a second; nothing switches at once.
- **The clear stretch** is free of everything but traffic, and so is the tunnel.
- **Words and colours**:
  - Chinese only from `words.md`, so the tunnel's name and the five sign names on the face;
  - colours only by token name.

## Fonts

- Copy `design-system/fonts/NotoSansTC-Bold-CityNights.woff2` and `NotoSerifTC-Black-CityNights.woff2` over the kit's, in `kit/fonts/`.
- Then run `python city-nights/kit/build.py --characters` to remake `characters.txt`.
- The fonts now hold 123 characters: 隧 is new, and the old ones are unchanged.

## The test page

- **Drive** (scene 1) shows each tunnel. Add a way to start just before a portal.
- **A loop on demand**: put the taxi near a district's end and loop. The plaque should name the jump. Check that nothing in view changes, the caption stays, and the traffic is carried across.
- **The zone change** opens just inside the next tunnel's exit.
- **The clear stretch**: no hanging signs in the last 40 m before each portal.

## Still left to the game

- Calling the loop when a zone reaches its district's end.
- Keeping bays, power-ups, obstacles, animals and passengers out of the clear stretches and the tunnels.
- **The gameplay note**, which is yours to update:
  - item 16 is now designed (Tunnel);
  - the zone change puts the taxi just inside the next tunnel's exit;
  - Practice drives through four tunnels a lap.

## The speed check, again on Barney's computer and Pixel

As before, Chrome, with the same targets, plus:
- a run through a tunnel (the approach, inside, coming out) and the loop's jump, with its slowest frame;
- graphics memory with the tunnel's pieces and the face picture;
- the opening time, with the tunnels planned.

Put the results in `city-nights/README.md`.

## Checks before handing back

- Side by side with the Tunnel preview and the canvas's version 12 boards, the portal, the inside and the exit look the same. Barney has the canvas, so ask him to look.
- **A loop** can't be seen: the caption stays, and the traffic is carried across.
- **A zone change** opens just inside the next tunnel's exit.
- Nothing flashes, the lane signals are steady, and the strips are continuous.
- The build's font and character checks pass with the new fonts.

## Working rules (as before)

- Don't edit `city-nights/design-system/`. Changes go to the design system first.
- Git is Barney's: hand him the commands. The commit message for this change is **CM36.txt** in the repo root. CM35 is the design system refresh that brought this note.
