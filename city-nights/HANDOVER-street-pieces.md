# City Nights: obstacles, animals, passengers and the stop bay (a kit change for Claude Code)

Written 29 October 2026 in Barney's Claude app project, where the design system lives. The design system is now **version 8**, and `city-nights/design-system/` is a fresh copy of it. This note says what the kit and the test page gain. Design decisions are made there, not here: if something below looks wrong, stop and tell Barney rather than changing the drawings.

If `HANDOVER-crash-pop.md` (CM17) is not done yet, do that first; this change builds on the same way of drawing.

## What Barney decided (29 October 2026)

- **Obstacles**: an oil slick, a flooded pothole, roadworks closing a lane, spilt cargo.
- **Animals**: a wild boar, a stray dog, a street cat, market chickens. **They always escape unhurt**: they bolt for the kerb as the taxi reaches them, and there is never a crash pop for an animal.
- **Passengers**: the game is about picking up and dropping off passengers. A passenger is the one person in the street drawn sharp and in colour, at the kerb with an arm up, standing in a warm pool of light. Three kinds: plain, with a suitcase, with shopping.
- **The stop bay**: a painted bay in the kerbside lane on the left, teal for pick-up (上客 PICK-UP), pink for drop-off (落客 DROP-OFF).
- **True size** for all of them.
- Four new words, so the Chinese fonts are re-cut: 道路工程, 易碎, 上客, 落客.
- **Not decided, so not for the kit:** what each obstacle does to the taxi, the penalty for a near miss, how stopping in a bay is judged, how the bay shows the taxi is inside it, and the passenger getting in. All of that is Grunge City Rider's gameplay (PRD question 4).

## Read first

1. `design-system/README.md`, the new section "Obstacles, animals and passengers", and the colour, motion and safety lines that mention them.
2. `design-system/components/Obstacle`, `Animal`, `Passenger` and `StopZone`: README for the rules, preview for how they look.
3. `design-system/components/bundle.js`: `CityNights.street`, the Canvas 2D code that draws them all. **Port it as it is.** The previews draw with this code, and Barney approved renders made with it on the real street.
4. `design-system/tokens.json` / `tokens.css`: 28 new colours (`figure-rim` to `bag-paper`), and `bay-size`, `lamp-time`, `wave-time`.

## How the drawing code fits the kit

- Everything takes colours by token name. The drawer looks them up through the same function as the crash pop's; feed it from the kit's `colours` table (add the new names) rather than reading CSS during play.
- **Pictures made once** (like the people and the traffic): `boar(run)`, `dog(run)`, `cat(run)`, `chicken(run, face)`, `crate()`, `passenger(kind, pose)`, and the road pictures `oil(seed)`, `pothole()`, `pool()`, `bay('pickup' | 'dropoff')`. Each upright picture carries its scale (`ppm`, pixels per metre) and the point it stands on (`ax`, `ay`). Make them at load, put them in the atlas, and place them like the people: stood at a distance and lane, scaled by the projection, far to near.
- **Things with depth**: `roadworks`, `cone`, `cargo` draw boxes in perspective through a projection `pt(d, x, y)` -> `{ x, y, s }` (d metres ahead of the taxi's rear bumper, x metres across from the road's centre, y metres up; s is pixels per metre). The kit's `projectZ2` gives what `pt` needs. Draw them each frame on the overlay, or bake them from a few angles the way the traffic is baked, whichever keeps the speed check's numbers.
- **Flat on the road**: `decal(g, pt, picture, d0, d1, x0, x1, alpha, blend)` lays a road picture in true perspective, row by row. Oil and potholes belong in the road's drawing (so they take the road's grain and sit under the cars); the bay and the pool of light are light (`drawBay` adds the bay's glow on top).
- Use these from the game through the kit, the same way `crash(z, x)` asks for the crash pop: the game says which piece, where, and when (an animal bolts, a bay changes kind); the kit draws it.

## Rules to keep (from the design system)

- True size. In this camera anything in the taxi's own lane closer than about 20 m is behind the taxi, so pieces are first seen further up the road.
- Roadworks lamps take turns, each pair lit for `lamp-time` (0.5 s). Eyeshine and the stop bay are steady. A waiting passenger swaps between the two arm poses every `wave-time` (0.4 s) and holds still under Reduce motion.
- Grain: obstacles, animals and the passenger at the traffic's level (`grain-vehicles`), not the people's, so the passenger stays sharp; the lamps, eyeshine, the sign's light and the bay's light are lights (`grain-signs`, none).
- Animals are never hit or hurt, and never trigger the crash pop.

## Fonts

- Copy `design-system/fonts/NotoSansTC-Bold-CityNights.woff2` and `NotoSerifTC-Black-CityNights.woff2` over the kit's (`kit/fonts/`), then run `python city-nights/kit/build.py --characters` to remake `characters.txt`. The fonts now hold 119 characters; the old ones are unchanged.

## The test page

- In `games/cn-sampler`, a way to place each obstacle, each animal (standing, then bolting), a passenger of each kind with the pick-up bay, and the drop-off bay, on the street, so Barney can see them in play on his PC and his Pixel.
- Include them in the speed check's scene, or add a scene with several at once, and report whether frame times hold.

## Checks before handing back

- Side by side with the design system's previews (and the canvas boards), each piece looks the same.
- Frame times hold with pieces on screen.
- An animal bolts and never triggers the crash pop.
- Reduce motion: the passenger holds the hailing pose.
- The build's font and character checks pass with the new fonts.

## Working rules (as before)

- Don't edit `city-nights/design-system/`. Changes go to the design system first.
- Git is Barney's: hand him the commands. The commit message for this change is **CM19.txt** in the repo root (CM17 is the crash pop; CM18 is the design system refresh that brought this note).
