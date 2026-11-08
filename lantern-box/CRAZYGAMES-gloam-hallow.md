# Gloam Hallow: CrazyGames checklist

Written 6 November 2026, from the repo as it stands (kit 0.9.1, the first playable version, 4d-5) and CrazyGames' developer docs as read that day. Updated later the same day with:
- the SDK game module (the mute setting, focus loss, loading events);
- the FAQ on AI tools;
- the kit's own code, which already has three of the build items;
- the PRD's answer on the soundtracks and its twelve questions;
- corrections after checking against CrazyGames' pages: local testing shows no ads, the SDK environment check, the loading events required.

Updated 7 November 2026: PRD questions 1 to 6 answered and the PRD approved, question 13 (the studio credit) added, and the arcade-wide decisions now in ARCADE.md. Later that night, after the vault note *CrazyGames Research* and CrazyGames' quality guidelines: teaching in play, the restricted Escape key, key labels by keyboard layout, the soundtracks last in the file, a daily bonus, and the Full Launch ad places drawn now. Later on 7 November: step 5b's design rounds done and design system 12 drawn (step 5c) and approved. Also added: lead with the light in the covers and the first screen (section 6), from the marketplace research.

This is the repo copy. Barney's own copy, in his Claude app project, also has his personal admin; this one leaves it out because the repo is public.

The first part is everything before the first test submission (Basic Launch, where CrazyGames shows the game to a small audience with ads off and measures it). The second is the work if CrazyGames invites it to Full Launch.

Who does what: **B** Barney · **D** design, in the Claude app project · **C** code, in Claude Code.

## Part 1: before the first test submission

### 1. Decisions (B)
These come first because the design and code depend on them. Each is a numbered question in the PRD. Questions 1 to 3 blocked the design rounds and were answered on 7 November 2026; the rest can be answered during the rounds.
- [x] 1. Saved progress between runs: answered 7 November 2026. Banked wisps and unlocks replace the gameplay note's "Never: saved progress beyond the Hysteria unlock", and ARCADE.md now allows saved progress and shops in any game.
- [x] 2. Scoreboard fairness with permanent upgrades: answered 7 November 2026. A fixed loadout for scored runs, the arcade default. (CrazyGames' own leaderboard allows one per game, for invited games only.)
- [x] 3. The first set of unlocks and their prices: answered 7 November 2026. Potion capacity up to 3, the lightning bolt and acid spray in place of the fireball, and other belt colours; the first about 25 wisps, then one about every two or three runs.
- [x] 4. Potion capacity: answered 7 November 2026. Health and mana, up to 3 each, one more a purchase. Since scored runs use a fixed loadout, the game gets two ways to start once anything is bought: a scored run with the fixed loadout and an unscored run with everything bought. A new player still sees only one start.
- [x] 5. Choosing a spell: answered 7 November 2026. Chosen in the wisp shop before a run; that run's scrolls teach it.
- [x] 6. Cosmetics and the one red: answered 7 November 2026. Belt colours only for now, kept off the colours that already mean something (design system 12 relaxes the one-red rule). Night blue, mulberry and ash, lightened to match the red's contrast and checked on the Pixel. A later release looks at a glow on the belt, the lantern's glass colour and the cloak's edge.
- [x] 7. Between-place Graces: answered 7 November 2026, in this phase. A free pick of 1 card from 3, drawn from a deck of more than 3, after each boss as the next level's card comes up: three picks a run, none before the first level, each for that run only. At Full Launch an ad offers a second pick at the same moments.
- [x] 8. The second loop ("Go round again"): answered 7 November 2026, before submission.
- [x] 9. The run's end: answered 7 November 2026. "The rot overcomes you, but your echo remains.", and High scores moves into Menu.
- [x] 10. The two soundtracks: answered 6 November 2026 (made in Google Gemini; the to-dos are under section 5).
- [x] 11. A target date: answered 7 November 2026, three weeks at most, so by 28 November 2026.
- [x] 12. The bank's name: answered 7 November 2026. The wisps are renamed echo, and the bank is called "Stolen echo". Echo has no plural ("118 echo"), the wisp shop becomes the Echo Shrine, and only the word changes. This checklist keeps the old word: read wisps as echo and the wisp shop as the Echo Shrine.
- [x] 13. The studio credit in the game: answered 7 November 2026. One exception to the arcade rules lets every game carry the same outlined credit from `brand/`.
- [x] The PRD signed off (7 November 2026).

### 2. Design (D, design system version 12)
- [x] The run's-end screen as a component, from the *Gloam Hallow Run's End* mockup, replacing GameOverCard's flow for this game.
- [x] The wisp shop screen, on a computer and a phone held sideways.
- [x] Nothing new comes before a first-time player's first run. At Full Launch CrazyGames wants new players in play at once, or within one click if that isn't feasible (Part 2, Gameplay).
- [x] Each new unlock designed, as the spells round did:
    - the lightning bolt's and acid spray's effects;
    - a third potion in the sockets;
    - the cosmetics.
- [x] The rename on every screen (echo, the Echo Shrine, Stolen echo) and the echo sound: a short echo as a defeated monster's wisp rises, louder the more echo it gives (1, 2, 5, a boss's 25).
- [x] The Grace pick ("Bind a twisted Grace") after each boss: three cards, choose one, each lasting one run. The first deck of eight, agreed 7 November 2026: Keen Edge, Long Reach, Deep Well, Iron Skin, Fleet Foot, Kindled Heal, Spell Surge, Lantern Ward.
- [x] Teaching in play on a first run: the controls shown during Night (keycaps on a computer, the touch controls lit on a phone), each hint fading once that control is used; skippable, mostly pictures. CrazyGames' quality guidelines ask for onboarding inside play, with the controls on screen; the "?" page alone doesn't do that.
- [x] The daily bonus: the first Echo Infusion run of each day earns double echo, shown on the run's end. It doubles only that run's echo, never the stored total, and never applies to The Bare Reckoning. No streak: missing a day loses nothing (arcade rule).
- [x] Key hints: P to pause and Backspace to go back. Escape still works but isn't shown, since on CrazyGames it closes full screen.
- [x] The Full Launch ad places, drawn now and built only at Full Launch: a revive once per session; double this run's wisps; try a locked spell for one run; a second Grace pick at each level's card; banners on the wisp shop.
- [x] Settings: "Clear saved progress", with a confirmation.
- [x] Carry in the kit's rule from 5 November: no pit within 120 before or 320 after a checkpoint.
- [x] The gameplay note updated, and a handover to Claude Code (`HANDOVER-design-12.md`).
- [x] All of the above drawn in design system 12 (7 November 2026): RunEnd, EchoShrine, Modes, GracePick, Teaching, Credits, AdPlaces, WinCard, Potions, SettingsPanel, Spells, Wanderer, Sound.
- [ ] Not yet designed: how the title menu reaches the Echo Shrine (the arch holds four items). Your choice, before step 5e.
- [x] Design system 12 approved by you (7 November 2026, after two preview fixes: current backdrops and the game's wanderer); Claude Code starts step 5d.

### 3. Build (C)
- [ ] Progress save: banked wisps, owned unlocks and the chosen loadout, in one versioned record.
    - Every read and write goes through the kit's one storage function (`store` in `lantern-box/kit/lantern-box.js`). It is already wrapped, so a blocked storage call can't crash the game (private browsing), and Gloam Hallow never touches storage any other way.
    - That one function makes the later switch to CrazyGames' cloud save a small change.
- [ ] The run's end, the wisp shop, the unlocks and the Graces, and the second loop.
- [ ] Balance pass against real scores. A full run is about 275 to 305 wisps on the scripted player, so the first unlock should cost less than a poor first run earns.
- [ ] A CrazyGames build of the file, with these removed:
    - the full-screen tile on the title and in play (CrazyGames forbids custom full-screen buttons and gives its own);
    - the Testing panel (delete its config line);
    - any Back to arcade button or link to the arcade website (no cross-promotion).
- [ ] The soundtracks at the end of the file, and the game playable before they arrive (the music fades in once it has). First check whether the game waits for them now. Re-encoding them at a lower bitrate stays the fallback.
- [ ] Key labels that follow the player's keyboard layout where the browser can tell (Chrome and Edge can), so a French keyboard shows Z, Q, A and E; otherwise WASD as now.
- [ ] Escape never needed for the game's own actions on CrazyGames: P pauses, Backspace goes back (CrazyGames' restricted keys).
- [ ] The daily bonus (section 2), on the device's own date.
- [ ] The rename in every word on screen, and the echo sound replacing the rising wisp note.
- [ ] The studio credit from `brand/` in the credits, with the music credit on its own line.
- [ ] The file at or under 20 MB, for CrazyGames' mobile homepage. Their hard limit is 50 MB, and without the SDK the whole file counts. It is 11.3 MB now.
- [ ] Already in the kit, so these are checked on devices (section 4) rather than built:
    - sound comes back on an iPhone after a call or app switch: the kit resumes it on the next tap or finger-lift (`pointerdown` and `touchend`), and CrazyGames asks for a touchend or click (8 November 2026 on the iPhone: an app switch was fine, but after a call the sound never came back and play went on; kit 0.17.2 pauses play and starts a fresh audio context at the next tap, to check again);
    - `user-select: none` on the game's full-screen box (`.lb-root` in `lantern-box/kit/lantern-box.css`), so a double tap or long press on a tablet doesn't select the game or open the magnifier (**not enough on an iPhone**: on Barney's wife's iPhone, 8 November 2026, a double tap still opened the magnifier while play went on; kit 0.17.2 cancels the touches' own handling, to check again);
    - storage that can't crash (above).
- [ ] The same jumps, timings and hits at 60, 120, 144 and 165 Hz screens. CrazyGames requires physics consistent across refresh rates and names 144 and 165 Hz (now an arcade rule for portal builds too). The kit's fixed 1/60-second step should already do this.
- [ ] Builds with no warnings and a clean console (arcade rule).

### 4. Test on devices (B and C)
- [ ] Chrome and Edge on the computer (required). Firefox. Safari if possible: CrazyGames turns a game off in Safari if it doesn't work well there.
- [ ] The Pixel and the Doogee tablet. An iPhone if you can borrow one: the cloud blur's fallback runs there, and so does the sound coming back after a call. (Barney's wife's iPhone, 8 November 2026: the clouds at Night and in Blood Red Rain look as Chrome draws them, blur or fallback; the double tap opened the magnifier and the sound didn't come back after a call, above, both changed in kit 0.17.2 and to check again.)
- [ ] A 4 GB Chromebook if you can find one: CrazyGames turns games off on Chromebooks that don't run smoothly on 4 GB.
- [ ] Text readable at a devicePixelRatio of 1, at 800 × 450 (CrazyGames' mobile size) up to 1920 × 1080.
- [ ] A private window: the game plays and saves without errors.
- [ ] A French (AZERTY) keyboard layout. The controls already use key positions, so they work; the labels should show Z, Q, A and E there (section 3).
- [ ] In full screen, Escape leaves full screen without breaking anything, and P pauses.
- [ ] On an iPhone, hide the full-screen tile in the CrazyGames build: kit 0.17.1's tip (add the game to the Home Screen) doesn't apply inside CrazyGames' page.
- [ ] Time from tap to play on the Pixel over mobile data (top titles load in under 10 s). The file is 11.3 MB, 10.4 MB of it the two soundtracks.
- [ ] CrazyGames' preview and QA tool in the developer portal, before every submission: developers who repeatedly submit games that break the rules may be restricted.
- [ ] Three to five people who've never seen the game play it cold while you watch, and note where they stop. This is not a CrazyGames requirement, but it is the cheapest objective test there is.

### 5. Rights, content and originality (B)
- [ ] **The two soundtracks** (*The Long Vigil*, *Lantern in the Moor*) were made in Google Gemini (answered 6 November 2026, PRD question 10). Google's terms set no limit on commercial use, so you can confirm the distribution rights to CrazyGames. Before submitting:
    - credit "Music made with Google Gemini" in the game and on CrazyGames, never yourself as composer (Google's terms forbid passing AI content off as made by a person);
    - keep each track's creation date, prompts and the account used, plus a saved copy of Google's terms as of that day;
    - regenerate any track whose prompt named a real artist, song or film score;
    - optionally, play each to Shazam to check it matches no known recording.
- [ ] **AI tools.** CrazyGames' FAQ describes using AI tools for code, art, sound and music as normal practice, and sets no conditions on it there; the developer terms are the place to check (section 7). The tests are the same as for any game: originality and distribution rights (below and above).
- [ ] The two Pixabay sound effects: the licence allows use in a game (checked 4 November 2026). Keep the source notes beside the kit.
- [ ] Fonts: IM Fell English and Alegreya Sans are SIL Open Font Licence, fine for commercial use, with licences in the kit.
- [ ] PEGI 12: fantasy combat with no blood (an arcade rule since 7 November 2026); text only for anything grim.
- [ ] Not aimed at children: CrazyGames rejects games targeted at children (it has a separate kids' site).
- [ ] Original: "clearly distinguishable from existing games", with no clones or asset flips.
- [ ] Name: search CrazyGames, Poki, Steam and itch.io for "Gloam Hallow" and close matches. CrazyGames screens for names easily confused with another game's.
- [ ] English throughout.

### 6. Submission assets (D and B)
- [ ] **Lead with the light** (a note from Barney's marketplace and genre research, 7 November 2026). On CrazyGames, Lantern Box's silhouettes look like nothing else; on mobile, dark-fantasy silhouette games are a crowded convention (*Shadow Fight* and its imitators). Those games use flat black figures; what sets Gloam Hallow apart is the backlit warm haze and the layered cut-outs. So the covers, the preview videos' first frames and the first screen a player sees (the title over Night, then Night's opening) put that light first: the glowing air between the layers, the lantern and the lit windows, the depth of the cut-out layers, never a flat black figure on a plain ground. Otherwise it reads as another *Shadow Fight* imitation.
- [ ] **Three covers**, consistent with each other:
    - sizes: 1920 × 1080 (16:9), 800 × 1200 (2:3) and 800 × 800 (1:1);
    - the game's name in a fitting typeface, and no other text ("New", "Play" and similar are not allowed);
    - no borders, icons or logos (so no Lantern Box Games logo); not blurry.
- [ ] **Two preview videos**, each 15 to 20 seconds (longer is cut to 20):
    - one 1080p landscape 16:9, one 1080p portrait 2:3, each up to 50 MB;
    - no sound and no fast-forwarding;
    - the first frame is the static cover;
    - no black screens or bars, no mouse cursor, no promotional text.
- [ ] Description, how to play, controls for keyboard and touch, tags. Orientation: landscape (CrazyGames requires a desktop game to play in landscape; the orientation is set in the submission).

### 7. Account and admin (B)
- [ ] A developer account at developer.crazygames.com. Payout details come first, through Tipalti, which pays monthly by bank transfer or PayPal once €100 is owed.
- [ ] Read the developer terms (the August 2025 version is current). You keep full ownership; no exclusivity. Look in particular for the revenue share, which CrazyGames' docs and FAQ don't state, and anything on AI-made content. (One data point: its 2026 GameMaker web jam terms gave developers 60% of ad revenue and 70% of in-game purchases. That isn't a standard rate.)
- [ ] Personal admin: in Barney's own copy of this checklist, not here.

### 8. Submit and Basic Launch (B, with D and C for fixes)
- [ ] Submit. QA feedback usually comes in one to two days; fix and resubmit.
- [ ] Basic Launch runs at least 7 days and 500 plays, at most 21 days. Read the dashboard daily: average play time, Day 1 retention, conversion, and feedback from negative ratings.
- [ ] Updates during Basic Launch are approved automatically. Change one thing at a time, so you know what moved a number.
- [ ] The outcome:
    - every metric at or above the benchmark: invited to Full Launch;
    - some: you may be invited to improve and run Basic Launch again;
    - most below: it can only come back as a new submission with significant improvements.

## Part 2: after acceptance (the Full Launch invitation)

A separate PRD when it happens, since the ad placements change the run's end. The list as CrazyGames' requirements stand:

### The SDK and its events (C)
- [ ] The CrazyGames SDK (HTML5 v3, one script tag) in the CrazyGames build only. The arcade build stays offline and ad-free. The game must still run if the script is blocked.
- [ ] The game checks where it is running (`window.CrazyGames.SDK.environment`) and calls the SDK only when that is `local` or `crazygames`. Anywhere else every SDK call throws an error, for example the CrazyGames copy opened as a file on your PC or from the arcade website.
- [ ] `gameplayStart` whenever play begins or carries on: a new run, a resume, after a lost life, each new place.
- [ ] `gameplayStop` at every break: the player's pause, menus, place cards, the run's end.
- [ ] Never `gameplayStop` when the window loses focus or the tab is hidden: CrazyGames handles that itself. The kit pauses play by itself at those moments (`lantern-box/kit/lantern-box.js`, the `blur` and `visibilitychange` listeners), so that automatic pause must not send it.
- [ ] CrazyGames' mute setting (`muteAudio`), required for an HTML5 game:
    - the game is silent while it is on;
    - it notices if the setting changes during play (optional in CrazyGames' docs, but worth doing);
    - it comes before the game's own sound settings, so Volume can't turn the sound back on.
- [ ] The loading events: `loadingStart` when the game starts loading and `loadingStop` when it has finished. CrazyGames' SDK page says they have to be called (Unity and Godot games excepted).
- [ ] Optional: `happytime` for a rare celebration, such as a boss defeated or the win. CrazyGames asks for it to be used sparingly, and not for every level or item.
- [ ] The initial download is then measured up to the first `gameplayStart`; keep it at or under 20 MB for the mobile homepage.
- [ ] Tested here before any upload: on `localhost` (or another address with `?useLocalSdk=true` added) the SDK runs in a local mode. No ads are shown: an overlay text stands in for each, and the other events are logged to the browser console, so the pausing, muting and ad breaks can be checked there. `?muteAudio=true` forces the mute setting on.

### Gameplay (D and C)
- [ ] New players land in gameplay. CrazyGames' wording is "immediately", with at most one click "if this is not feasible". The title's Start game would be that one click, and QA decides whether it is accepted. Either way, nothing else may come before play for a first-time player.

### Ads (D then C)
- [ ] A midgame ad at the run's end, after the death beat, never during play, never on a menu, settings or shop button. CrazyGames allows at most one every 3 minutes and ignores early requests.
- [ ] A rewarded "Double this run's wisps" on the run's end:
    - optional, marked with a video icon;
    - its skip or continue button the same size, font and colour;
    - the reward only on `adFinished`, nothing on `adError`;
    - hidden when no ad is available.
- [ ] If there's ever an ad revive, it must not be offered every time a life is lost. Between two places, offer a midgame ad or a rewarded ad, never both.
- [ ] The game pauses and blocks input while an ad is requested or playing. Mute when the ad actually starts, unmute when it ends.
- [ ] With an ad blocker the game plays normally: no popups, no punishment, no rewarded buttons that do nothing.
- [ ] Banners: none, or only on the wisp shop (a screen open for 5 seconds or more), never in play, never covering any of the interface.
- [ ] The other places drawn in phase 5: a revive once per session, in The Echo Infusion only (with a short countdown and 2 to 3 seconds of safety on rising); try a locked spell for one run; a second Grace pick. To decide in the Full Launch PRD: whether ad rewards that add power (the revive, a Grace) are offered in scored runs, where they would clash with the fixed loadout.

### Saving and accounts (C)
- [ ] Progress saved to the player's CrazyGames account, with the Progress Save option set in the submission. Either:
    - the Data module (CrazyGames' preferred way; it works like browser storage), or
    - Automatic Progress Save (it backs up the browser storage; allowed here because there are no real-money purchases).
- [ ] Use the CrazyGames username where the game asks for a name (for example, fill the initials from it); confirm with QA whether it applies.
- [ ] No privacy notice is needed while the game collects no personal data beyond CrazyGames' own SDK events. The initials stay on the player's device. If that ever changes, CrazyGames requires a Terms and Conditions or privacy notice for new players.

### After launch (B)
- [ ] Full QA review.
- [ ] Optional: one CrazyGames leaderboard (the SDK supports one per game, for invited games only), for the fixed-loadout scored runs.
- [ ] Watch revenue on the dashboard. Payouts arrive monthly once €100 is owed.
- [ ] Keep updating. Planned updates: the second loop and Hysteria if not already in, then a daily challenge.
- [ ] Hands-on SDK and ad-placement advice from CrazyGames starts at 50,000 combined plays.

## Sources
- CrazyGames docs, read 6 November 2026: [Introduction](https://docs.crazygames.com) · [Requirements](https://docs.crazygames.com/requirements/intro/) · [Technical](https://docs.crazygames.com/requirements/technical/) · [Gameplay](https://docs.crazygames.com/requirements/gameplay/) · [Advertisement](https://docs.crazygames.com/requirements/ads/) · [Account integration](https://docs.crazygames.com/requirements/account-integration/) · [Game covers](https://docs.crazygames.com/requirements/game-covers/) · [Quality guidelines](https://docs.crazygames.com/requirements/quality/) · [Basic Launch guide](https://docs.crazygames.com/resources/basic-launch-metrics/) · [FAQ](https://docs.crazygames.com/faq/) · [HTML5 v3 SDK](https://docs.crazygames.com/sdk/intro/)
- Added later the same day: [SDK game module](https://docs.crazygames.com/sdk/game/) (the gameplay events, the mute setting, loading events, happytime) · [FAQ: Do I need to learn to code to make web games?](https://docs.crazygames.com/faq/#do-i-need-to-learn-to-code-to-make-web-games) (AI tools) · [HTML5 v3 SDK intro](https://docs.crazygames.com/sdk/intro/) (local testing and the environment check; the old /sdk/html5-v3/intro address now returns page not found)
- 7 November 2026: [Leaderboards](https://docs.crazygames.com/sdk/leaderboards/) (one per game, invited games only) · [Quality guidelines](https://docs.crazygames.com/requirements/quality/) again (restricted keys, onboarding, keyboard layout) · your vault note *CrazyGames Research* (Browser Arcade).
- The repo: `lantern-box/HANDOVER.md` (4d to kit 0.9.1), `lantern-box/GAMEPLAY-gloam-hallow.md`, `ARCADE.md`, `dist/gloam-hallow.html` (11.3 MB), `lantern-box/kit/lantern-box.js` and `lantern-box.css` (storage, iPhone sound, text selection, the automatic pause).
- Alongside it: *Gloam Hallow: portal readiness PRD* and *Twisted Retro Fit: changes for portals and the wisp shop* (both updated the same evening to match, and again on 7 November).
