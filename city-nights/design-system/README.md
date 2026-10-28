City Nights is the look of a set of browser games in Barney's arcade, Twisted Retro Fit: a real Hong Kong street at night, after his photo series *Hong Kong City Nights*. Warm amber streets, a wall of lightbox and neon signs overhead, HDR grain and halos, ghosted people, traffic in places. Gritty and real, not cyberpunk. Games look into the screen; the first is Grunge City Rider, a taxi game.

## The one rule: two layers

Every screen has two layers.

- **World**: the street, drawn with WebGL into a 540-line picture (`picture-height`) that fills the window: sky, buildings, shop fronts, signs, people, traffic, the player's taxi, power-ups, the crash pop, glow, fog, vignette and grain. Everything is drawn in code; there are no image files.
- **Interface**: everything a player reads or presses, made as lit signs. **Lightbox** panels (a cream lit face in a dark case, lettered in red) for everything during and after play. **Neon** (tube lettering on a dark board) for the title screen only, where the menu joins the street's wall of signs.

The two meet in three places, all part of the picture rather than over it: the taxi meter (bottom left), the district caption above it, and the title screen's logo. The meter and caption are drawn on their own small canvas over the picture and scale with it; panels are HTML at fixed CSS sizes.

Neon is kept to the title screen on purpose. Pause, settings, game over, initials, high scores and the rotate notice are lightboxes, because in play the lightbox matches the meter. One neon screen also keeps City Nights clear of the arcade's paused puzzle kit, whose ground is glowing lines on black. Neon in the World is the street's own (its signs and the crash pop); the title-screen rule is about panels.

## Content fundamentals

- **Interface copy is sentence case**: "Start game", "High scores", "Reduce motion", "Quit to menu". Buttons are verbs; never "OK".
- **Sign headers are bilingual**, like the street's signs: the Chinese word left in `header-zh`, the English right in `header-en`, uppercase by `text-transform` (write "Paused" in source, it shows PAUSED). One header per panel: 暫停 PAUSED, 設定 SETTINGS, 遊戲結束 GAME OVER, 新紀錄 NEW BEST, 高分榜 HIGH SCORES, 橫放手機 ROTATE.
- **Chinese**: traditional characters as Hong Kong uses them; real, everyday words; every business name invented. Chinese appears on signs, in headers, on the meter, the caption, the badge, the power-ups and the crash pop's tag. Menu items, settings and body text are English only. Every Chinese word is on the word list (the Word list section) for a Cantonese reader to check before the kit is final.
- **English on signs** is uppercase and plain, with some quirky names in the spirit of "Cyber Sauna" (原子桑拿 ATOMIC SAUNA). Nothing rude, nothing that mocks, no nightclub signs: players include teens.
- **The score is the fare.** In text it is `HK$412.80`: no space, two decimals, comma thousands from HK$1,000.00. On the meter and in every dark inset it is red seven-segment digits padded to fixed places with unlit 8s (` 23.40`), never text.
- **Controls are named, not described**: a keycap ("Enter", "Esc", "↑") then the action in `hint` ("Select"). Phones get the touch hint instead.
- **Tone**: plain and brief. No exclamation marks, no emoji, no jokes in the interface. "Game over", not "Oops". The crash pop is World copy and the one place an exclamation mark appears (CRASH!, SMASH!, BANG!).
- **Names**: the game, places' businesses and every sign are invented. The districts are real (尖沙咀 Tsim Sha Tsui, 佐敦 Jordan, 油麻地 Yau Ma Tei, 旺角 Mong Kok, in order up Nathan Road). The taxi is a generic saloon in Hong Kong taxi red (`taxi-red`), no badges, not any real model.

## Visual foundations

### Colour

- The World's colours are fixed roles: `night-black` letterbox, the sky from `sky-top` to `sky-low`, the wet road `road-near` to `road-far`, `kerb-brown` pavements, `sodium` lamps and their pools, `fog` at 55%. Lit windows are `window-warm` mostly, `window-white` and `window-blue` sometimes.
- **Signs** pair a face with an ink: `face-cream` or `face-white` with `ink-red`; `face-yellow` with `ink-black`; `face-red` with `ink-yellow`; `face-green` with `ink-cream`; `face-teal` and `face-blue` with `ink-white`. **Neon** uses one or two tubes from `tube-teal`, `tube-red`, `tube-pink`, `tube-violet`, `tube-green`, `tube-yellow`, `tube-blue`; the Chinese in the first tube, the English in the second.
- **Lightbox panels**: case `case`; face a vertical blend `lightbox-top` 0%, `lightbox-mid` 35%, `lightbox-low` 100%, with a 1px `lightbox-line` 3px inside; glow `lightbox-glow`. Text on the face: `panel-ink` for items and values, `panel-ink-2` for descriptions and labels, `heading-red` for headers. The selected item and the primary button are the lit red band, `band-red` with `on-band` text and `shadow-band`.
- **Numbers** sit in dark insets of `meter-face`: lit segments `digit-on` with `digit-glow`, unlit `digit-off`, labels `meter-label`, ranks and empty slots `meter-dim`.
- **Neon title**: boards `neon-board`; lit lettering in a tube's core colour (`tube-core-teal`, `tube-core-pink`, `tube-core-yellow`) with the tube's colour as its edge and glow; unselected items `neon-unlit`.
- **Reward** is the yellow sign: the New best badge is a small `face-yellow` lightbox lettered in `ink-black`.
- **Power-ups** are small lightbox signs, each a face with its ink: 時 `face-green`, 錢 `face-yellow`, 快 `face-red`, 保 `face-blue`, 雙 `face-cream`. The **crash pop** pairs two tubes: CRASH! `tube-red` and `tube-yellow`, SMASH! `tube-yellow` and `tube-red`, BANG! `tube-teal` and `tube-pink`.
- Over the street, dialogs sit on `scrim`; the title's logo and menu sit on `title-shade`, fading to 12% three quarters across. Light text over the street sits on `plaque` or carries the `caption-outline`.
- No hex values in games: games name these tokens.

### Type

- **Antonio** (`display`) is the sign face: the logo (`logo-xl`, `logo-top`), English on signs (`sign-en`), header English (`header-en`), initials (`slot`, `initials`), the meter's TAXI METER.
- **Noto Serif TC Black** (`zh-serif`) is the lightbox signs' Chinese and the headers' Chinese (`header-zh`, `badge-zh`, `meter-title-zh`). **Noto Sans TC Bold** (`zh-sans`) is neon tube Chinese (`sign-zh-neon`), the meter's row labels and the district caption.
- **IBM Plex Sans Condensed** (`ui`) is everything a player reads in a panel: `menu`, `setting`, `body`, `note`, `hint`, `kbd`, `label`, `value`.
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

- The meter is the HUD: a lightbox sign headed 的士 TAXI METER, bottom left, `meter-inset` 14 picture pixels from both edges, drawn at `meter-scale` (82.5%) of its round 9 size and shrunk towards its bottom-left corner. Three rows on its dark face: 車資 FARE HK$ (six places), 時間 TIME (two), 速度 KM/H (three).
- It is redrawn only when a number changes. Digits are red seven-segment, slanted, with unlit segments showing.
- **On phones** it keeps its place and size; only the row labels grow, to no less than `phone-label-min` (10 CSS px). Touch controls must never need a thumb parked on it; a game's own controls are settled with its gameplay.
- The district caption sits above it, Chinese over English like a film subtitle, in `caption` with its outline (`caption-zh`, `caption-en`), fading in over 0.6 s when the taxi enters a district.

### Crash pop

- When the taxi hits another vehicle, a comic-book word lights up as a neon sign right over both of them (CrashPop): CRASH! in a jagged burst, SMASH! in a shattered pane, BANG! in a cloud, each with its Chinese sound-word (轟, 啪, 砰) on a small round tag. The kit picks one at random, never the same twice running.
- The burst is a `neon-board` inside a tube outline; the word is `display` at 108px (on a 720-line window), skewed, glowing, with a hard comic drop beneath. It springs in, holds, dips once like a tube catching and is gone within `pop-time` (1 s). Under Reduce motion it only fades.

### Power-ups

- Small lightbox signs hovering over the road on their own pool of light, one Chinese character each (PowerUp): 時 More time, 錢 Fare bonus, 快 Speed boost, 保 Shield, 雙 Double fare. What each does is settled with the gameplay; the names are placeholders until then.
- They are told apart by colour first and the character close up, scale with distance like the cars, bob slowly and never flash.

### Grain, glow and fog

- Grain is part of the look and fades in and out across the picture (the Grain section has every level): strongest on buildings and pavements, light on the road round the taxi, none on signs and lights. Levels are the same in every district.
- Signs and lights glow (a soft bloom); signs carry a dark halo behind them so they pop. Vignette 55%.
- The **Effects** setting turns the glow off; grain, fog and the halos stay, and the game must read perfectly without it.

### Layout

- **Desktop**: the picture fills the window. Icon tiles sit top right, `space-6` from the edges: full screen, then pause at the edge. On the title screen: sound, full screen. Keyboard hints sit bottom left on a `plaque`.
- **Phone, held sideways**: the same picture, wider (2.17:1), with the meter bottom left and the tiles top right, `edge-phone` from the edges plus the safe-area insets. The touch hint shows bottom centre, 12px up, until the first move.
- **Phone, held upright**: the rotate notice, a lightbox on `scrim` over the street; the game is paused.
- Everything tappable is at least `tap-min`.

### States and focus

- Selected: the red band on a lightbox; the lit teal tube on the title. Selection moves instantly.
- Keyboard focus: a 2px ring offset 2px, `focus-light` on the lightbox face, `focus-dark` on dark grounds and the street.
- Hover on a lightbox item: `segment-ground`. Disabled: 45% opacity.

### Motion and safety

- Panels fade and rise 8px over 160 ms; under Reduce motion they only fade. Reduce motion also cuts the taxi's sway and roll on corners.
- The whole screen never flashes, and nothing bigger than a character flashes more than 3 times a second. The crash pop dips once in its second of life, and power-ups never flash. A flickering neon sign (原子桑拿 ATOMIC SAUNA) dips to half brightness for 0.07–0.13 s, at least 0.45 s apart: under twice a second.
- Interface text is at least 4.5:1 on its ground; the pairs are in each colour's note.

## Iconography

- Interface icons are inline SVG on a 24 viewBox: 2px stroke, round caps and joins, `currentColor`, drawn at 22–24px. The set: play, trophy (high scores), sliders (settings), speaker (sound), full screen, pause, restart, quit (door and arrow), drag arrows (touch hint), and the rotate-phone picture (48 viewBox, 84px).
- On lightbox tiles icons are `ink-red`; on neon tiles and the title menu they are the tube colour with its glow.
- The World has no icons, only drawn things. No emoji anywhere.

## Sound

- The shell's sound effects come from Retro Kit's set (select, confirm, back, game over, new best), synthesised in the browser. Audio starts on the first key press or tap.
- Whether City Nights adds a city sound bed (rain, traffic, horns) is open; a soundtrack only if Barney supplies an MP3.

## Settings

The arcade's shared settings, in this order, then City Nights' own:

1. **Volume**, a slider with its percentage (0 mutes).
2. **Effects**: "Glow around lights and signs."
3. **Reduce motion**: "Less sway and roll from the taxi on corners."
4. **Picture**: Automatic, Best, Faster, Fastest. "Automatic picks the most detail your device can run smoothly." Automatic times the first seconds of play, turns edge smoothing off if frames take longer than `auto-smoothing-off`, then drops to ordinary sharpness if they still take longer than `auto-sharpness-down`. Best is 4x smoothing at full sharpness, Faster has no smoothing, Fastest also draws at ordinary sharpness.

The arcade's Solid panels setting is not shown: lightbox panels are already solid. Its saved value is left alone for the other kits' games. Changes apply at once; Done (Esc) only closes the panel.

## Screens every game has

Title (logo, neon title menu: Start game, High scores, Settings; best fare; sound and full-screen tiles; keyboard hints) → Play (meter, caption, full-screen and pause tiles) → Pause (Resume, Restart, Settings, Quit to menu) → Game over → Initials, when the fare makes the top ten → High scores → Play again or Menu. Settings opens from Title and Pause; High scores also from Title. A choice of modes, if a game has them, is a lightbox menu with a one-line note per mode. On phones held upright: the rotate notice.
