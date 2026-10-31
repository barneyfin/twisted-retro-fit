# Grunge City Rider: the gameplay (PRD question 4)

Written 29 October 2026 in Claude Code, from Barney's answers in the phase 4 session. It answers PRD question 4 (the gameplay) and question 7 (yes, a city sound bed), and lists what the design system needs before the kit can be changed and the game built. Take it to Barney's Claude app project: the design work is done there first (the last section but one), and the PRD's open questions can be marked answered.

Every number marked *starting figure* is Barney's first guess, to be tuned once he has played the game on his computer and Pixel.

## The game in a few lines

You drive a night-shift taxi up Nathan Road. It speeds up to 70 km/h by itself; you steer, brake and sound the horn. Pick up a passenger at the teal bay, drop them at the pink bay further on, and the meter counts the fare. Five fares clear a district; the four districts make a round, then the run goes round again, harder. The clock runs down all the while and each fare buys time back. The run ends when the time runs out or on the third crash. The score is the fare.

## Modes

Two, in this order, each with its own high-score table. The website's card shows Competitive's best.

| Mode | Note in the modes menu | What it is |
|---|---|---|
| Competitive | Five fares a district, each one busier | Everything below |
| Practice | The same easy traffic all the way | Drives on through all four districts and their four tunnels without jumping, with Tsim Sha Tsui's traffic and time figures all the way (start 50 s, +35 s a fare, never restarted). Three crashes still end it |

## Driving and controls

- The taxi speeds up to its top speed by itself: **70 km/h** (*starting figure*), the same in every zone. It gets back to 70 km/h in **about 4 s** after a stop (*starting figure*).
- The player steers, brakes and sounds the horn.
- **Keyboard**: the kit's keys. ← → (or A, D) steer, ↓ (or S) brakes, Space is the horn, Esc pauses.
- **Phone**: the side a thumb lands on says what it does, for as long as it stays down, wherever it skids (Barney's choice, 31 October 2026: thumbs skid on his Pixel). Left of the taxi drags to steer; right of the taxi held for 0.18 s brakes, on its own too. A quick tap with either thumb is the horn, which is why braking waits 0.18 s. The touch zones themselves don't change. This differs from the design system's TouchZones ("either thumb, in either zone"): if it plays well, Barney will have his Claude app project update the design system. Until then the touch hint stays "Drag to steer · Hold with your other thumb to brake" (two actions at most).
- The horn is for fun, and it makes animals bolt.

## Zones, rounds and the clock (Competitive)

- **A zone is a district**: Tsim Sha Tsui, Jordan, Yau Ma Tei, Mong Kok. Five fares complete it. The taxi then jumps just inside the exit of the tunnel at the start of the next district, 20 m before the exit (*starting figure*), behind the zone-change moment, so each zone opens with the drive out. After Mong Kok, round 2 starts again in Tsim Sha Tsui, harder, and so on.
- **Longer districts**: each is long enough for a whole zone, about 3.7 km (190 s of clock at 70 km/h), so the street is about 15 km. Today's is 560 m.
- **A zone that reaches the end of its district** (rare: it takes a 時 power-up, since four fares buy only enough clock to drive the district flat out): the taxi jumps back to the start of the same district and the zone carries on, with its fares, tip, passenger and music unchanged (Barney, 30 October 2026). The jump is hidden by the 夜光隧道 Nightglow Tunnel at every district line: it happens at the line, in the tunnel's middle, where all four are the same (design system v12, Tunnel).
- **The clock** restarts at **50 s** in every zone. Each fare finished adds time: **35 s** in round 1's Tsim Sha Tsui, then 1 s less in each zone after (34, 33, 32; round 2: 31, 30, 29, 28; and on down) (*starting figures*). The meter's clock shows 99 at most.
- **The run ends** when the clock reaches 00 or on the third crash. **Three lives** for the whole run.
- **Harder each zone**: more traffic, obstacles and animals (the table below) and less time per fare. Top speed stays the same.

## Fares

- **A passenger** appears 5–15 s of driving ahead, beside a pick-up bay: at the start of each zone, after each drop-off, and again if the taxi drives past the bay. Their kind (plain, suitcase, shopping) makes no difference.
- **Stopping**: holding the brake with at least 75% of the taxi inside the bay counts, for a pick-up or a drop-off. No full stop is needed.
- **The drop-off bay** is a random 15–25 s of driving after the pick-up.
- **The meter** counts up during the ride, **HK$2 per 100 m** (*starting figure*). Driving with no passenger earns nothing.
- **The tip** is 10% of the trip's fare (before any power-up), added at the drop-off. Each incident during the ride halves it: a crash (a vehicle, a roadworks barrier or a cone) or an animal hit or near miss.
- **Missing the drop-off**: once the taxi is past the bay the meter stops counting and the whole tip is lost; a new drop-off bay appears 5–15 s ahead.
- **Expected scores**: about HK$48 a zone and HK$190 a round, with tips and power-ups. A run should end in round 2 or 3, at roughly HK$400–600, so the meter's six places (up to HK$999.99) are enough.

## Crashes and the street's hazards

| What | Effect |
|---|---|
| Another vehicle | The game freezes for 3 s: the fare stops counting, the clock keeps running. A life is lost and the tip halves (with no passenger aboard, the life and the freeze still apply). The crash pop shows. The vehicle hit is cleared away during the freeze, and the taxi carries on from where it is, from a stop |
| Roadworks (barriers and cones) | The same as a vehicle, crash pop included. After the freeze the taxi is moved into the nearest open lane |
| Oil | Steering and braking twice as strong, on the oil and for 1 s after (*starting figure*) |
| Flooded pothole | Speed drops by a third, to about 47 km/h, then builds back up as usual (*starting figure*) |
| Spilt cargo | The taxi veers about one lane (3 m) away from the nearest kerb, over half a second; the player can steer against it (*starting figure*) |
| An animal | It always escapes unhurt, with no crash pop. A hit, or a near miss (the taxi passing within 1 m before it is off the road, *starting figure*): the game and fare freeze for 1 s, the clock keeps running, the tip halves. With no passenger aboard, the freeze still applies |

Oil, potholes and cargo never touch the tip. Other traffic drives the same way as the taxi at 30–55 km/h, keeps to its lane, and honks when the taxi passes too close.

## How much is on the street (*starting figures*)

| Zone | Vehicles per km | Obstacles a minute | Animals a minute | Time per fare |
|---|---|---|---|---|
| Tsim Sha Tsui | 15 | 3 | 1 | +35 s |
| Jordan | 20 | 4 | 2 | +34 s |
| Yau Ma Tei | 25 | 5 | 3 | +33 s |
| Mong Kok | 30 | 6 | 4 | +32 s |
| Each zone after | 5 more, up to 40 | 1 more, up to 10 | stays at 4 | 1 s less |

Obstacles are an even mix of oil, potholes, roadworks and cargo. Practice uses the Tsim Sha Tsui row all the way.

## Power-ups

One every 20–40 s of driving, the same in every zone. 雙 is 1 in 12; the other four share the rest equally.

| Power-up | Effect |
|---|---|
| 時 More time | +20 s on the clock (99 at most) |
| 錢 Fare bonus | +20% of the trip's fare at the drop-off |
| 快 Speed boost | 20% faster (84 km/h) for 10 s; another one restarts the 10 s |
| 保 Shield | One free crash: covers vehicles, roadworks and animals. The taxi carries on, with no crash pop, no freeze, and no life or tip lost. Only one is held at a time |
| 雙 Double fare | +100% of the trip's fare at the drop-off. Rare |

- 快, 保 and one fare boost can be on together.
- The fare boosts (錢, 雙) don't stack: the newest replaces the older. One picked up with no passenger aboard is wasted.

## Sound

- **Game sounds**, made in code: a power-up picked up, a crash, the passenger getting in, a fare paid, a tip lost, a steady engine note that rises with speed, the player's horn, other vehicles honking.
- **A city sound bed** (rain, traffic, horns): yes.
- **Soundtrack**: two MP3s from Barney, chosen 30 October 2026: *Midnight Fare Dash* (2 min 45 s) for Tsim Sha Tsui and Jordan, *Meter Running High* (2 min 53 s) for Yau Ma Tei and Mong Kok. ARCADE.md now allows two in a City Nights game. Both are 192 kbps stereo, at the same loudness as each other and as the Retro Kit games' tracks. Together they add about 10.8 MB to the game's file, and about 120 MB of memory if both are decoded at once. Barney keeps the two files until the kit change turns them into the game's music files.
- Both tracks start quietly (building for 20–30 s) and end with a fade-out, so each loop brings 30–40 s of quieter music, as in the Retro Kit games. A zone lasts a little longer than a track, so each track loops once in most zones.
- In Competitive the switch falls in the zone-change moment; in Practice it comes as the taxi crosses into Yau Ma Tei, and back into Tsim Sha Tsui. Whether the new track starts from its beginning or where it last stopped is for the design system.

## Screens

Title, pause, settings, game over, initials and high scores as the kit has them; game over shows what the kit shows. The modes menu is the kit's, with the notes above.

## For the design system (the Claude app project)

The design system is the spec, so each of these is designed there first, then copied here for the kit:

1. **The crash pop for roadworks**, barriers and cones. The design system now keeps it to vehicles, and each word's debris was drawn for car crashes.
2. **Longer districts**: about 3.7 km each, the street about 15 km. Competitive jumps to the next district after five fares; Practice drives on through.
3. **The zone-change moment**: what it looks like. It also hides the jump and the music switch.
4. **Lives left**: how they show.
5. **Zone progress**: fares done out of five, the zone and the round.
6. **The tip**: building during a ride, halving after an incident, added at the drop-off, lost on a missed drop-off.
7. **The bay** showing the taxi braking with 75% inside it (the StopZone part says this is not designed yet).
8. **The passenger getting in**, perhaps while the taxi is still moving fast. The kit can only show a passenger waiting, or none.
9. **Where the passenger is going**, and how far.
10. **Active power-ups**: 快's time left, 保 held, a fare boost on; and the five power-ups' final names and effects (the PowerUp part calls its names placeholders).
11. **A shielded hit**: what it looks like. Otherwise the taxi drives straight through a car or a barrier, which looks like a fault.
12. **Messages during play**, if any (a fare paid, a tip lost, a zone done). The design system says nothing else goes over the street besides the meter, caption, tiles and touch hint.
13. **Sound**: the city sound bed, the game's sounds and the two soundtracks, including whether a track starts from its beginning when the music switches to it. The Sound section still says one MP3 and calls the sound bed open.
14. **New Chinese words** any of these need: on the word list, with the fonts re-cut.
15. **Left over from phase 3** (in `HANDOVER.md`, "Where phase 3 ended"): Automatic's 17.5 ms step, the animals' bolting speeds, the shadow sizes, where settings and scores are saved, and the meter holding at HK$999.99, now confirmed as enough for this game.
16. **Done in design system v12 (Tunnel): a tunnel at every district line.** A sign or tunnel that hides a district's loop (Barney, 30 October 2026): when a zone reaches the end of its district, the taxi drives through it and comes out at the start of the same district. It must fill the whole picture for a moment, since the kit makes new street while it does, about a quarter of a second to be safe (about 5 m at 70 km/h). To decide: which it is; whether it stands at every district line or only appears for a loop (at every line, Practice drives through it each time without jumping); what it looks like from both sides; how dark it may go, with nothing flashing; its name and any new Chinese words. No bay, power-up or obstacle stands near it.

## Then, back in Claude Code

1. **The kit change**, as its own job, from the refreshed design system: the long street, the new parts above, two soundtracks (the build takes one today) and switching between them, the engine note and the sound bed. Then rebuild every City Nights game, look through the test page, and Barney runs the speed check again on his computer and Pixel. The long street needs watching: it takes longer to open and uses more graphics memory, which only his devices can measure.
2. **The game** in `city-nights/games/grunge-city-rider/`.
3. **The website**: `site/build.py` learns City Nights games and shows a score saved in cents as a fare; a card for Grunge City Rider with a 16:9 picture of it in play.

## Decided while building the game (Claude Code, 31 October 2026: for Barney to overrule)

- Practice shows no round line or lamps on the caption: it has no rounds.
- Animals bolt from 26 m, or at the horn within 60 m. One bolting for the kerb usually gets clear; the ones that cost anything run across the taxi's path.
- The roadworks' cones count as the crash from where they start, not only the barriers.
- After an animal's 1 s freeze the taxi carries on at the speed it had; after a crash, from a stop.
- A vehicle hit comes back 250 to 450 m ahead, so the road doesn't empty. Traffic moves to the middle lane before roadworks.
- A vehicle honks when the taxi passes within 0.5 m of it, and not again for 6 s.
- The fifth fare's receipt goes back in (2.5 s, still driving) before the zone change.
- Steering 1.5 of the road's half-widths a second, braking 14 m/s², bays and items laid 115 to 150 m ahead.

## Barney's first changes after playing (31 October 2026)

- The horn much louder.
- No obstacles or animals in a bay or within 10 m of it, in any lane.
- Steering 10% more responsive, on keys and on a phone.
- 3 s when nothing can hit the taxi, after a crash's freeze ends. (Vehicles, roadworks and animals; oil, potholes and cargo still act. Nothing shows it yet.)
- No crash with a vehicle out of sight: the taxi only hits one whose rear is level with it or ahead, and traffic behind slows for the taxi.
- While testing, 30 s extra on the clock at the start of a game (80 s, not the zones after).
- Bay markings: Barney asked for them to be much more visible, then found the road's light reflections were what hid them. The reflections went down by a third in the kit (0.11.4). The bays are still hard to see on his Pixel, less so on his tablet and easier on a computer, so they go back to the design system to stand out more.

## What could not be checked

The scores, times and distances above are worked out from the rules, not measured: no game exists yet. Speed, opening time, memory and the music switch can only be measured on Barney's devices.
