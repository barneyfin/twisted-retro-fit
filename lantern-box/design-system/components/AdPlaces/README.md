# AdPlaces

The Full Launch ad places: drawn in step 5b so the screens leave room for them, built only if CrazyGames invites Gloam Hallow to Full Launch (with its own PRD). Basic Launch has no ads, no SDK and no CrazyGames username. Version 12, step 5b round 2 (Barney, 7 November 2026).

## Markup
In these previews each place is wrapped in `lb-fl` (a dashed `brass-dim` outline) with an `lb-fl-tag` saying FULL LAUNCH, so nobody mistakes it for Basic Launch work. A built game shows the button or banner alone. A rewarded-ad button is an `lb-btn lb-ad` with the small screen-and-play picture before its words; the banner is `lb-fl-banner`; the revive's countdown is `lb-countdown`.

## Rules
- **Revive**: "Rise again?", "Once each night, the lantern can be lit again.", "Watch an ad and rise" with a 5-second countdown, "No, end the run". Once a session, in The Echo Infusion only, never in The Bare Reckoning (so the high scores stay fair). If he rises: one more life where he fell, with 2 to 3 seconds of safety. If the countdown runs out or no ad is available, the run's end follows as usual.
- **Double this run's echo**: on the run's end, between the next unlock and Play again (RunEnd).
- **Try a spell for one run**: in the Echo Shrine, under the spells, for one not yet bought (EchoShrine).
- **Bind a second Grace**: under the three Graces, a second pick at the same moment, so nothing comes only from an ad (GracePick).
- **Banner**: 320 × 50 under the Echo Shrine's plaque, at least 15 px from any button (EchoShrine).
- Nothing in play is ever interrupted by an ad, and an ad never stands between a new player and their first run.
