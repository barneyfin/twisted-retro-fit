# Modes

The choice of run, once anything has been bought at the Echo Shrine: The Bare Reckoning (scored) or The Echo Infusion (everything bought, not scored), with Hysteria shown locked until it is built. Version 12, step 5b round 1 (Barney, 7 November 2026), replacing step 4b round 11's Modes.

## Markup
A dialog plaque headed "Choose a run" (560 wide): `lb-modes` (`role="radiogroup"`) of `lb-mode` buttons, each a `name`, a `note` (Barney's words) and `terms` (what the run takes); `is-selected` the brass band; `is-locked` greyed with a padlock, its words in `lock-note`. Then Start (primary) and Back, and the hint. On a phone held sideways (804 wide): an `lb-header` with the heading, Start and Back, and the three runs side by side (`lb-modes is-row`).

## Rules
- **The Bare Reckoning**: "Stripped of all favour, face the dark with naked steel alone. Your agony is etched into history." Terms: "On the high scores · your spell and belt, one potion of each". The fixed loadout keeps the one table fair (arcade decision B).
- **The Echo Infusion**: "Gorged on stolen power. Unleash your full arsenal, but expect no immortalisation." Terms: "Everything you've bought · not on the high scores". Its first run each day earns double echo (RunEnd).
- **Hysteria**: "No breath wasted. No blood spared. Time will not wait for your terror." Locked, "Coming soon · 500 echo at the Echo Shrine", until it is built after submission; then it is bought at the Echo Shrine for 500 and opens here (HysteriaFinish). The old lock line, "Fell The Wandering Rot to begin anew…", moved to the win's second-loop offer (WinCard).
- **When**: only once something has been bought. A new player's Start game goes straight into The Bare Reckoning, so nothing comes before a first run. Play again repeats the run just played; Menu then Start game comes back here.
- **Keys** (computers): up and down choose, Enter starts, Backspace goes back. Never Esc.
