City Nights is the look of a set of browser games in Barney's arcade, Twisted Retro Fit: a real Hong Kong street at night, after his photo series *Hong Kong City Nights*. Warm amber streets, a wall of lightbox and neon signs overhead, HDR grain and halos, ghosted people, traffic in places. Gritty and real, not cyberpunk. Games look into the screen; the first is Grunge City Rider, a taxi game.

## The one rule: two layers

Every screen has two layers.

- **World**: the street, drawn with WebGL into a 540-line picture (`picture-height`) that fills the window: sky, buildings, shop fronts, signs, people, traffic, the player's taxi, power-ups, obstacles, animals, passengers and the stop bay, the crash pop, glow, fog, vignette and grain. Marks that belong to a place in the street are World too, drawn in its perspective: the pin over where the taxi is heading, the bay's ring, 保's ring and the power-up badges under the taxi, the SAFE! sign. Everything is drawn in code; there are no image files.
- **Interface**: everything a player reads or presses, made as lit signs. **Lightbox** panels (a cream lit face in a dark case, lettered in red) for everything during and after play. **Neon** (tube lettering on a dark board) for the title screen only, where the menu joins the street's wall of signs.

The two meet in a few places, all part of the picture rather than over it: the taxi meter (bottom left), the district caption above it, the receipt slip the meter prints, the zone-change title, and the title screen's logo. They are drawn on their own canvases over the picture and scale with it; panels are HTML at fixed CSS sizes.

**During play nothing else goes over the street** (Barney, 30 October 2026: "where it happens"). Each piece of information sits where it belongs: lives and the tip on the meter; the round and the zone's fares in the caption; where the passenger is going on a pin in the street; the power-ups on the taxi. The only message is the receipt slip.

Neon is kept to the title screen on purpose. Pause, settings, game over, initials, high scores and the rotate notice are lightboxes, because in play the lightbox matches the meter. One neon screen also keeps City Nights clear of the arcade's paused puzzle kit, whose ground is glowing lines on black. Neon in the World is the street's own (its signs, the crash pop, the pin and the SAFE! sign); the title-screen rule is about panels.

## Content fundamentals

- **Interface copy is sentence case**: "Start game", "High scores", "Reduce motion", "Quit to menu". Buttons are verbs; never "OK".
- **Sign headers are bilingual**, like the street's signs: the Chinese word left in `header-zh`, the English right in `header-en`, uppercase by `text-transform` (write "Paused" in source, it shows PAUSED). One header per panel: 暫停 PAUSED, 設定 SETTINGS, 遊戲結束 GAME OVER, 新紀錄 NEW BEST, 高分榜 HIGH SCORES, 橫放手機 ROTATE.
- **Chinese**: traditional characters as Hong Kong uses them; real, everyday words; every business name invented. Chinese appears on signs, in headers, on the meter, the caption, the badge, the power-ups, the crash pop's tag, the roadworks sign, the cargo boxes, the stop bay, the pin, the receipt slip, the SAFE! sign and the zone-change title. Menu items, settings and body text are English only. Every Chinese word is on the word list (the Word list section) for a Cantonese reader to check before the kit is final.
- **English on signs** is uppercase and plain, with some quirky names in the spirit of "Cyber Sauna" (原子桑拿 ATOMIC SAUNA). Nothing rude, nothing that mocks, no nightclub signs: players include teens.
- **The score is the fare.** In text it is `HK$412.80`: no space, two decimals, comma thousands from HK$1,000.00. On the meter and in every dark inset it is red seven-segment digits padded to fixed places with unlit 8s (` 23.40`), never text.
- **Controls are named, not described**: a keycap ("Enter", "Esc", "↑") then the action in `hint` ("Select"). Phones get the touch hint instead.
- **Tone**: plain and brief. No exclamation marks, no emoji, no jokes in the interface. "Game over", not "Oops". The crash pop and the SAFE! sign are World copy and the only places an exclamation mark appears (CRASH!, SMASH!, BANG!, SAFE!).
- **Names**: the game, places' businesses and every sign are invented. The districts are real (尖沙咀 Tsim Sha Tsui, 佐敦 Jordan, 油麻地 Yau Ma Tei, 旺角 Mong Kok, in order up Nathan Road). The taxi is a generic saloon in Hong Kong taxi red (`taxi-red`), no badges, not any real model.

## Visual foundations

### Colour

- The World's colours are fixed roles: `night-black` letterbox, the sky from `sky-top` to `sky-low`, the wet road `road-near` to `road-far`, `kerb-brown` pavements, `sodium` lamps and their pools, `fog` at 55%. Lit windows are `window-warm` mostly, `window-white` and `window-blue` sometimes.
- **Signs** pair a face with an ink: `face-cream` or `face-white` with `ink-red`; `face-yellow` with `ink-black`; `face-red` with `ink-yellow`; `face-green` with `ink-cream`; `face-teal` and `face-blue` with `ink-white`. **Neon** uses one or two tubes from `tube-teal`, `tube-red`, `tube-pink`, `tube-violet`, `tube-green`, `tube-yellow`, `tube-blue`; the Chinese in the first tube, the English in the second.
- **Lightbox panels**: case `case`; face a vertical blend `lightbox-top` 0%, `lightbox-mid` 35%, `lightbox-low` 100%, with a 1px `lightbox-line` 3px inside; glow `lightbox-glow`. Text on the face: `panel-ink` for items and values, `panel-ink-2` for descriptions and labels, `heading-red` for headers. The selected item and the primary button are the lit red band, `band-red` with `on-band` text and `shadow-band`.
- **Numbers** sit in dark insets of `meter-face`: lit segments `digit-on` with `digit-glow`, unlit `digit-off`, labels `meter-label`, ranks and empty slots `meter-dim`.
- **Neon title**: boards `neon-board`; lit lettering in a tube's core colour (`tube-core-teal`, `tube-core-pink`, `tube-core-yellow`) with the tube's colour as its edge and glow; unselected items `neon-unlit`.
- **Reward** is the yellow sign: the New best badge is a small `face-yellow` lightbox lettered in `ink-black`.
- **Power-ups** are small lightbox signs, each a face with its ink: 時 `face-green`, 錢 `face-yellow`, 快 `face-red`, 保 `face-blue`, 雙 `face-cream`. The **crash pop** is a smoke cloud on `neon-board` in a `face-cream` tube over a `sodium` halo; each word has its own lit face and edge tube: CRASH! yellow (`pop-crash-light`, `tube-yellow`, `pop-crash-deep`) edged `tube-red`; SMASH! red (`pop-smash-light`, `tube-red`, `pop-smash-deep`) edged `tube-yellow`; BANG! pink (`pop-bang-light`, `tube-pink`, `pop-bang-deep`) edged `tube-teal`.
- **The stop bay** is `tube-teal` for pick-up (上客 PICK-UP) and `tube-pink` for drop-off (落客 DROP-OFF), lettered in the tube's core colour. The same pair runs through a fare: the pin is teal 上 over a pick-up and pink 落 over a drop-off (tube lettering on `neon-board`), and the bay's ring is its tube's colour.
- **In play**: lives are small taxis in `taxi-red`, a lost one `life-lost`; fare lamps are lit `face-yellow` or unlit `lamp-unlit` with `lamp-unlit-ring`; the power-up badges are the tokens' own faces and inks in a `case` rim; 保's ring is `tube-blue`. The receipt slip is `receipt-paper` printed in `receipt-ink`, a halved or lost tip in `receipt-red`. The SAFE! sign is a `tube-blue` shield with `tube-core-blue` lettering, its word white with a `face-blue` edge. The zone-change title is `caption` with `caption-outline` over `zone-shade`. **Obstacles** use the sign faces where they can (`face-red` and `face-white` barriers, a `face-yellow` sign) and their own tokens otherwise (`cone-orange`, `lamp-amber`, `cardboard`, `oil-dark`, `pothole-lip`). **Animals** are `animal-dark` with `figure-rim`, and eyeshine in `eyeshine-amber`, `eyeshine-gold` or `eyeshine-green`. **Passengers** are the only people in colour (`coat-red`, `coat-blue`, `coat-olive`).
- Over the street, dialogs sit on `scrim`; the title's logo and menu sit on `title-shade`, fading to 12% three quarters across. Light text over the street sits on `plaque` or carries the `caption-outline`.
- No hex values in games: games name these tokens.

### Type

- **Antonio** (`display`) is the sign face: the logo (`logo-xl`, `logo-top`), English on signs (`sign-en`), header English (`header-en`), initials (`slot`, `initials`), the meter's TAXI METER.
- **Noto Serif TC Black** (`zh-serif`) is the lightbox signs' Chinese and the headers' Chinese (`header-zh`, `badge-zh`, `meter-title-zh`), the power-up badges and the SAFE! sign's 保. **Noto Sans TC Bold** (`zh-sans`) is neon tube Chinese (`sign-zh-neon`), the meter's row labels, the district caption and its round line, the pin, the receipt slip and the zone-change title.
- **IBM Plex Sans Condensed** (`ui`) is everything a player reads in a panel: `menu`, `setting`, `body`, `note`, `hint`, `kbd`, `label`, `value`.
- **Bangers** (`comic`) is the crash pop's letters (`pop-word`) and the SAFE! sign's word (`shield-word`), nothing else: the comic face, kept to the two comic moments.
- No pixel or dot-matrix faces. Numbers are seven-segment digits (`CityNights.digits`), not a font.
- The fonts are files in this system (`fonts/`). The two Chinese fonts are cut down to the characters on the word list; a new Chinese word means cutting them again from the full Noto fonts. Games embed the fonts; never link a font service from a game.

### Lightbox panels

- A panel is a `case` rim 5px wide, `radius-case`, `shadow-lightbox`, round a lit face at `radius-face`, padded 6px top and `space-5` elsewhere, parts `space-4` apart (`.cn-lightbox` + `.cn-face`).
- The header comes first: 54px tall, Chinese left, English right, a `rule-red` hairline under it (`.cn-header`).
- Menu items are `item-height` tall, `menu` type, a 22px icon left, `space-3` apart from the label, `space-1` between items. The selected item is the red band and carries the confirm keycap; others are plain ink.
- Widths: `menu-width` 380px for pause; `dialog-width` 420px for game over and high scores; 400px for initials; 480px for settings; 326px for the rotate notice.

### Neon (title screen only)

- The logo is a neon board at `radius-board` with a `tube-pink` tube 9px inside (`shadow-tube-pink`), the name in two lines, `logo-top` then `logo-xl`, in `tube-core-pink`. Beside it, a vertical `tube-teal` sign carries the game's Chinese name, one character to a line in `sign-zh-neon` at 40px. Grunge City Rider's is 夜更的士, night-shift taxi.
- The title menu is a `neon-board` with a `tube-yellow` edge tube 7px inside. Items are unlit (`neon-unlit`, no glow); the selected item lights `tube-teal`: its outline, its lettering in `tube-core-teal`, its glow. The title's icon tiles are neon too.

### The taxi meter

- The meter is the HUD: a lightbox sign headed 的士 TAXI METER, bottom left, `meter-inset` 14 picture pixels from both edges, drawn at `meter-scale` (82.5%) of its round 9 size and shrunk towards its bottom-left corner. Three rows on its dark face: 車資 FARE HK$ (six places), 時間 TIME (two), 速度 KM/H (three). The fare holds at HK$999.99.
- **Grunge City Rider's meter** (Barney, 30 October 2026) adds two things and grows 16 picture pixels wider to fit them: **lives**, three small taxis at the right of the heading (a lost one stays as a faint shape), and **the tip**, 小費 TIP sharing the time's row, each a label over its digits. The tip row is unlit with no passenger aboard, counts up during a ride (10% of the trip's fare, halved by each incident), and shows dashes for the rest of a ride once the tip is lost. The Meter README has the geometry.
- It is redrawn only when a number changes. Digits are red seven-segment, slanted, with unlit segments showing.
- **On phones** it keeps its place and size; only the row labels grow, to no less than `phone-label-min` (10 CSS px). Touch controls never need a thumb parked on it (the Touch zones section).
- The district caption sits above it, Chinese over English like a film subtitle, in `caption` with its outline (`caption-zh`, `caption-en`), fading in over 0.6 s when the taxi enters a district. In Grunge City Rider it has a third line: 輪 ROUND n and five lamps, one lit for each fare done in this zone (DistrictCaption).

### Crash pop

- When the taxi hits another vehicle, or a roadworks barrier or cone, a comic-book word lights up as a neon sign right over both of them (CrashPop): a cloud of smoke lit in a cream tube, with the word in big comic letters on a rising curve and its Chinese sound-word on a small round tag. Each word tells its own crash in neon debris: **CRASH!** parts fly off (a wheel, a spring, nuts and a bolt), **SMASH!** glass breaks (shards, cracks, a broken headlamp), **BANG!** something bursts (flames behind the smoke, shock rings, a hubcap, sparks). Tags 轟, 啪 and 砰. The kit picks one at random, never the same twice running.
- It fills `pop-box` (1080 × 700 on a 720-line window, about four-fifths of a 16:9 window's width), centred on the crash point and kept inside the picture. The drawings are data in `CityNights.crashPop`, drawn by `CityNights.drawCrashPop` with Canvas 2D: no image files. It springs in, holds, dips once like a tube catching and is gone within `pop-time` (1 s); if the game freezes for longer after a crash, the frozen street shows for the rest. Under Reduce motion it only fades.
- **Under the pop** (Barney, 29 October 2026): the vehicle hit is cleared away, so after the pop only the taxi stands; after a roadworks crash the taxi is moved into the open lane, in the pop's first second. The debris stays as drawn for roadworks too: it is the taxi's own parts and glass that fly.

### Power-ups

- Small lightbox signs hovering over the road on their own pool of light, one Chinese character each (PowerUp), named and settled with Grunge City Rider's gameplay (29 October 2026): **時 More time** (+20 s on the clock, 99 at most), **錢 Fare bonus** (+20% of the trip's fare at the drop-off), **快 Speed boost** (20% faster, 84 km/h, for 10 s), **保 Shield** (one free crash: no pop, no freeze, no life or tip lost), **雙 Double fare** (+100% of the trip's fare at the drop-off; rare).
- They are told apart by colour first and the character close up, scale with distance like the cars, bob slowly and never flash.
- **Carried**: 快, 保 and one fare boost (錢 or 雙) ride as small badges just under the taxi's rear bumper, 快 with a ring that empties over its 10 s; 保 also lights the road round the taxi in a ring of `tube-blue` (TaxiMarks). 時 works at once, so it has no badge.
- **The shielded hit**: a small blue neon sign of the crash pop's family, without the smoke, a shield with 保 and SAFE! over the point of contact, while the car or barrier hit is cleared away underneath (ShieldSign).

### Obstacles, animals and passengers

- All true size (Barney, 29 October 2026), all drawn in code by `CityNights.street` (Canvas 2D, colours by token name), placed in the street's own perspective through the game's projection. The parts: Obstacle, Animal, Passenger, StopZone.
- **Obstacles** (Obstacle): an oil slick, a flooded pothole, roadworks closing a lane (cones, red-and-white barriers with amber lamps, a 道路工程 ROAD WORKS sign) and spilt cargo (boxes marked 易碎, oranges rolling).
- **Animals** (Animal): a wild boar, a stray dog, a street cat and market chickens by their crate; dark shapes lit warm from behind, eyes shining in the taxi's headlights. **They always escape unhurt**: they bolt for the kerb (5 m/s, the chickens 3 m/s) and are gone 1.2 m past it, and there is never a crash pop (Barney, 29 October 2026).
- **Passengers** (Passenger): the one person in the street drawn sharp and in colour, at the kerb with an arm up, in a warm pool of light; three kinds (plain, with a suitcase, with shopping). **Getting in**, even with the taxi still rolling: the passenger fades out as the stop counts, and the taxi's TAXI roof sign goes out while they are aboard, as a Hong Kong taxi's does when hired; it lights again at the drop-off (Barney, 30 October 2026).
- **The stop bay** (StopZone): a painted bay 3 m by 10 m in the kerbside lane on the left (Hong Kong drives on the left), teal for pick-up, pink for drop-off. **Inside the bay**: once three-quarters of the taxi is in it, the bay's colour gathers in a ring of light on the road round the taxi, close to it; the ring fades once the stop has counted (`ring-fade`). Only that one ring: 保's ring steps aside while the taxi is in a bay (Barney, 30 October 2026).
- In this camera anything in the taxi's own lane closer than about 20 m is behind the taxi, so these are first seen further up the road; their colour and light (eyeshine, amber lamps, sheen, the bay's glow) make them readable from there. Once the taxi is in a bay, it hides almost all of it: only the paint beside the rear wheels shows, which is why the ring and the pin do the telling.
- What each one does is in Grunge City Rider's gameplay note (`GAMEPLAY-grunge-city-rider.md`): holding the brake with at least three-quarters of the taxi in a bay counts; no full stop is needed.

### In play: where the passenger is going, the receipt, the zone change

- **The pin** (TargetPin): a neon pin standing 3.2 m over the middle of the bay the taxi is heading for: pink 落 with the destination's name and the metres to go for a drop-off, teal 上 with the metres for a pick-up. Destinations are named after the street's own signs, so the player can spot the sign on arrival (Barney, 30 October 2026). Until the bay is in view it stands over the far end of the drawn road (about 80 m) in the bay's lane. Its tag sits on the kerb side; inside the bay the pin keeps no tag, and it goes when the stop counts.
- **The receipt slip** (ReceiptSlip), the one message during play: a paper slip printed out of the top of the meter for `receipt-time`, while the caption steps aside. When a fare is paid it lists the trip's fare, the tip, any fare boost and the total; when the tip halves, the tip before and after; when the tip is lost (driving past the drop-off), the tip struck through.
- **The zone change** (ZoneTitle), when five fares finish a zone in Competitive: the street dims (`zone-shade`, faded, never to black, never a flash) and the caption grows into a big title in the middle: the district just finished with its five lamps and takings, then the next district and its round, while the street fades across from one to the other and the music switches. `zone-time` in all; under Reduce motion the title only fades. The taxi's jump to the next district happens under it. Practice drives on through and has no zone change.
- **Longer districts**: each district is `district-length` (about 3.7 km), so the street is about 15 km: long enough for a zone of five fares.

### Grain, glow and fog

- Grain is part of the look and fades in and out across the picture (the Grain section has every level): strongest on buildings and pavements, light on the road round the taxi, none on signs and lights. Levels are the same in every district.
- Signs and lights glow (a soft bloom); signs carry a dark halo behind them so they pop. Vignette 55%.
- The **Effects** setting turns the glow off; grain, fog and the halos stay, and the game must read perfectly without it.

### Layout

- **Desktop**: the picture fills the window. Icon tiles sit top right, `space-6` from the edges: full screen, then pause at the edge. On the title screen: sound, full screen. Keyboard hints sit bottom left on a `plaque`.
- **Phone, held sideways**: the same picture, wider (2.17:1), with the meter bottom left and the tiles top right, `edge-phone` from the edges plus the safe-area insets. The touch hint shows bottom centre, 12px up, until the first move.
- **Touch zones** (TouchZones; Barney, 30 October 2026): the player puts their thumbs where they like inside two zones, each from the top of the meter's case to the bottom of the screen: one from the left edge to the taxi, one from the taxi to the right edge. Either thumb, in either zone: drag to steer, hold to brake, a quick tap for the horn. A touch that starts in a zone keeps counting wherever it moves; touches anywhere else do nothing, so the tiles are safe. A thumb may rest on the meter if the player likes; it can only cover the speed row there.
- **Phone, held upright**: the rotate notice, a lightbox on `scrim` over the street; the game is paused.
- Everything tappable is at least `tap-min`.

### States and focus

- Selected: the red band on a lightbox; the lit teal tube on the title. Selection moves instantly.
- Keyboard focus: a 2px ring offset 2px, `focus-light` on the lightbox face, `focus-dark` on dark grounds and the street.
- Hover on a lightbox item: `segment-ground`. Disabled: 45% opacity.

### Motion and safety

- Panels fade and rise 8px over 160 ms; under Reduce motion they only fade. Reduce motion also cuts the taxi's sway and roll on corners.
- The whole screen never flashes, and nothing bigger than a character flashes more than 3 times a second. The crash pop dips once in its second of life, and power-ups never flash. Roadworks lamps take turns, each lit once a second (`lamp-time`); eyeshine and the stop bay are steady. A waiting passenger swaps between two arm poses every `wave-time` (0.4 s), and holds still under Reduce motion. A flickering neon sign (原子桑拿 ATOMIC SAUNA) dips to half brightness for 0.07–0.13 s, at least 0.45 s apart: under twice a second.
- The play screen's moments: the bay's ring fades in and out (`ring-fade`) and never pulses; the receipt slip prints up and goes back in, and only fades under Reduce motion; the SAFE! sign lives as the crash pop does; the zone change dims the street gently and its title only fades under Reduce motion. 快's ring empties smoothly; nothing blinks.
- Interface text is at least 4.5:1 on its ground; the pairs are in each colour's note.

## Iconography

- Interface icons are inline SVG on a 24 viewBox: 2px stroke, round caps and joins, `currentColor`, drawn at 22–24px. The set: play, trophy (high scores), sliders (settings), speaker (sound), full screen, pause, restart, quit (door and arrow), drag arrows (touch hint), and the rotate-phone picture (48 viewBox, 84px).
- On lightbox tiles icons are `ink-red`; on neon tiles and the title menu they are the tube colour with its glow.
- The World has no icons, only drawn things. No emoji anywhere.

## Sound

- The shell's sound effects come from Retro Kit's set (select, confirm, back, game over, new best), synthesised in the browser. Audio starts on the first key press or tap.
- **A city sound bed** (rain, traffic, horns) plays under every game: yes (Barney, 29 October 2026).
- **Game sounds**, made in code, are the game's: in Grunge City Rider a power-up picked up, a crash, the passenger getting in, a fare paid, a tip lost, an engine note that rises with speed, the player's horn and other vehicles honking.
- **Soundtracks**: a City Nights game may have two MP3s from Barney (ARCADE.md). Grunge City Rider's: *Midnight Fare Dash* (2 min 45 s) for Tsim Sha Tsui and Jordan, *Meter Running High* (2 min 53 s) for Yau Ma Tei and Mong Kok; matched in loudness, each building quietly for 20–30 s and ending in a fade.
- **Switching** (Barney, 30 October 2026): a track starts from its beginning when the music switches to it (into Yau Ma Tei, and back into Tsim Sha Tsui) and carries on through the zone changes that keep the same track. In Competitive the old track fades out during the zone change; in Practice it fades over about 2 s as the taxi crosses the district line. Pause keeps the track's place, a new game starts the first track from the top, and game over fades the music out. Within a stretch a track loops whole, quiet start and fade included.

## Settings

The arcade's shared settings, in this order, then City Nights' own:

1. **Volume**, a slider with its percentage (0 mutes).
2. **Effects**: "Glow around lights and signs."
3. **Reduce motion**: "Less sway and roll from the taxi on corners."
4. **Picture**: Automatic, Best, Faster, Fastest. "Automatic picks the most detail your device can run smoothly." Automatic times the first seconds of play, turns edge smoothing off if frames come more than `auto-smoothing-off` (17.5 ms) apart, then drops to ordinary sharpness if they still take longer than `auto-sharpness-down`. Best is 4x smoothing at full sharpness, Faster has no smoothing, Fastest also draws at ordinary sharpness.

The arcade's Solid panels setting is not shown: lightbox panels are already solid. Its saved value is left alone for the other kits' games. Changes apply at once; Done (Esc) only closes the panel.

**Saving** (decided in the kit, phase 3): Picture is saved under `citynights.settings`; the shared settings stay in Retro Kit's `retrokit.settings`. High scores are saved in Retro Kit's format under `retrokit.scores.<game id>.<mode>`, Grunge City Rider's as `retrokit.scores.grunge-city-rider.competitive` and `.practice`, the fare in whole cents (HK$412.80 as 41280).

## Screens every game has

Title (logo, neon title menu: Start game, High scores, Settings; best fare; sound and full-screen tiles; keyboard hints) → Play (meter, caption, full-screen and pause tiles; in Grunge City Rider also the pin and the taxi's badges) → Pause (Resume, Restart, Settings, Quit to menu) → Game over → Initials, when the fare makes the top ten → High scores → Play again or Menu. Settings opens from Title and Pause; High scores also from Title. A choice of modes, if a game has them, is a lightbox menu with a one-line note per mode. On phones held upright: the rotate notice.
