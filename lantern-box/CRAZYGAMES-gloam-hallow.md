# Gloam Hallow: CrazyGames checklist

Written 6 November 2026, from the repo as it stands (kit 0.9.1, the first playable version, 4d-5) and CrazyGames' developer docs as read that day. Updated later the same day with:
- the SDK game module (the mute setting, focus loss, loading events);
- the FAQ on AI tools;
- the kit's own code, which already has three of the build items;
- the PRD's answer on the soundtracks and its twelve questions.

This is the repo copy. Barney's own copy, in his Claude app project, also has his personal admin; this one leaves it out because the repo is public.

The first part is everything before the first test submission (Basic Launch, where CrazyGames shows the game to a small audience with ads off and measures it). The second is the work if CrazyGames invites it to Full Launch.

Who does what: **B** Barney · **D** design, in the Claude app project · **C** code, in Claude Code.

## Part 1: before the first test submission

### 1. Decisions (B)
These come first because the design and code depend on them. Each is a numbered question in the PRD; questions 1 to 3 block the design rounds, and the rest can be answered during them.
- [ ] 1. Saved progress between runs (banked wisps and unlocks) replaces the gameplay note's rule "Never: saved progress beyond the Hysteria unlock".
- [ ] 2. Scoreboard fairness with permanent upgrades: a fixed loadout for scored runs and Hysteria, separate tables, or scores tagged by upgrade level.
- [ ] 3. The first set of unlocks and their prices.
- [ ] 4. Potion capacity: health only, or health and mana, and whether "up to 3" means three kept in each socket.
- [ ] 5. Choosing a spell: picked before a run (in the wisp shop, say) or swapped during play.
- [ ] 6. Cosmetics and the one red: other belt colours, kept off the colours that already mean something, or something else (the lantern's glass, the cloak's edge).
- [ ] 7. Between-place boons ("pick one of three" for this run only): in or out.
- [ ] 8. The second loop ("Go round again") before submission, or after.
- [ ] 9. The run's-end wording, and High scores moving into Menu.
- [x] 10. The two soundtracks: answered 6 November 2026 (made in Google Gemini; the to-dos are under section 5).
- [ ] 11. A target date for submission, or none.
- [ ] 12. The bank's name ("Gathered wisps" or another word).
- [ ] The PRD signed off.

### 2. Design (D, design system version 12)
- [ ] The run's-end screen as a component, from the *Gloam Hallow Run's End* mockup, replacing GameOverCard's flow for this game.
- [ ] The wisp shop screen, on a computer and a phone held sideways.
- [ ] Nothing new comes before a first-time player's first run. At Full Launch CrazyGames wants new players in play at once, or within one click if that isn't feasible (Part 2, Gameplay).
- [ ] Each new unlock designed, as the spells round did:
    - the lightning bolt's and acid spray's effects;
    - a third potion in the sockets;
    - the cosmetics.
- [ ] Settings: "Clear saved progress", with a confirmation.
- [ ] Carry in the kit's rule from 5 November: no pit within 120 before or 320 after a checkpoint.
- [ ] The gameplay note updated, and a handover to Claude Code.

### 3. Build (C)
- [ ] Progress save: banked wisps, owned unlocks and the chosen loadout, in one versioned record.
    - Every read and write goes through the kit's one storage function (`store` in `lantern-box/kit/lantern-box.js`). It is already wrapped, so a blocked storage call can't crash the game (private browsing), and Gloam Hallow never touches storage any other way.
    - That one function makes the later switch to CrazyGames' cloud save a small change.
- [ ] The run's end, the wisp shop, the unlocks; boons and the second loop if decided in.
- [ ] Balance pass against real scores. A full run is about 275 to 305 wisps on the scripted player, so the first unlock should cost less than a poor first run earns.
- [ ] A CrazyGames build of the file, with these removed:
    - the full-screen tile on the title and in play (CrazyGames forbids custom full-screen buttons and gives its own);
    - the Testing panel (delete its config line);
    - any Back to arcade button or link to the arcade website (no cross-promotion).
- [ ] The file at or under 20 MB, for CrazyGames' mobile homepage. Their hard limit is 50 MB, and without the SDK the whole file counts. It is 11.3 MB now.
- [ ] Already in the kit, so these are checked on devices (section 4) rather than built:
    - sound comes back on an iPhone after a call or app switch: the kit resumes it on the next tap or finger-lift (`pointerdown` and `touchend`), and CrazyGames asks for a touchend or click;
    - `user-select: none` on the game's full-screen box (`.lb-root` in `lantern-box/kit/lantern-box.css`), so a double tap or long press on a tablet doesn't select the game or open the magnifier;
    - storage that can't crash (above).
- [ ] The same jumps, timings and hits at 60, 120, 144 and 165 Hz screens. CrazyGames requires physics consistent across refresh rates and names 144 and 165 Hz. The kit's fixed 1/60-second step should already do this.
- [ ] Builds with no warnings and a clean console (arcade rule).

### 4. Test on devices (B and C)
- [ ] Chrome and Edge on the computer (required). Firefox. Safari if possible: CrazyGames turns a game off in Safari if it doesn't work well there.
- [ ] The Pixel and the Doogee tablet. An iPhone if you can borrow one: the cloud blur's fallback runs there, and so does the sound coming back after a call.
- [ ] A 4 GB Chromebook if you can find one: CrazyGames turns games off on Chromebooks that don't run smoothly on 4 GB.
- [ ] Text readable at a devicePixelRatio of 1, at 800 × 450 (CrazyGames' mobile size) up to 1920 × 1080.
- [ ] A private window: the game plays and saves without errors.
- [ ] A French (AZERTY) keyboard layout. The controls already use key positions, so they work; the keycaps still show W, A, Q and E.
- [ ] Time from tap to play on the Pixel over mobile data (top titles load in under 10 s). The file is 11.3 MB, 10.4 MB of it the two soundtracks.
- [ ] CrazyGames' preview and QA tool in the developer portal, before every submission: developers who repeatedly submit games that break the rules may be restricted.
- [ ] Three to five people who've never seen the game play it cold while you watch, and note where they stop. This is not a CrazyGames requirement, but it is the cheapest objective test there is.

### 5. Rights, content and originality (B)
- [ ] **The two soundtracks** (*The Long Vigil*, *Lantern in the Moor*) were made in Google Gemini (answered 6 November 2026, PRD question 10). Google's terms set no limit on commercial use, so you can confirm the distribution rights to CrazyGames. Before submitting:
    - credit "Music made with Google Gemini" in the game and on CrazyGames, never yourself as composer (Google's terms forbid passing AI content off as made by a person);
    - keep each track's creation date, prompts and the account used, plus a saved copy of Google's terms as of that day;
    - regenerate any track whose prompt named a real artist, song or film score;
    - optionally, play each to Shazam to check it matches no known recording.
- [ ] **AI tools.** CrazyGames' FAQ welcomes games made with AI tools, for code, art, sound and music, with no extra conditions. The tests are the same as for any game: originality and distribution rights (below and above).
- [ ] The two Pixabay sound effects: the licence allows use in a game (checked 4 November 2026). Keep the source notes beside the kit.
- [ ] Fonts: IM Fell English and Alegreya Sans are SIL Open Font Licence, fine for commercial use, with licences in the kit.
- [ ] PEGI 12: fantasy combat with no blood (already an arcade rule); text only for anything grim.
- [ ] Not aimed at children: CrazyGames rejects games targeted at children (it has a separate kids' site).
- [ ] Original: "clearly distinguishable from existing games", with no clones or asset flips.
- [ ] Name: search CrazyGames, Poki, Steam and itch.io for "Gloam Hallow" and close matches. CrazyGames screens for names easily confused with another game's.
- [ ] English throughout.

### 6. Submission assets (D and B)
- [ ] **Three covers**, consistent with each other:
    - sizes: 1920 × 1080 (16:9), 800 × 1200 (2:3) and 800 × 800 (1:1);
    - the game's name in a fitting typeface, and no other text ("New", "Play" and similar are not allowed);
    - no borders, icons or logos; not blurry.
- [ ] **Two preview videos**, each 15 to 20 seconds (longer is cut to 20):
    - one 1080p landscape 16:9, one 1080p portrait 2:3, each up to 50 MB;
    - no sound and no fast-forwarding;
    - the first frame is the static cover;
    - no black screens or bars, no mouse cursor, no promotional text.
- [ ] Description, how to play, controls for keyboard and touch, tags. Orientation: landscape (CrazyGames requires a desktop game to play in landscape; the orientation is set in the submission).

### 7. Account and admin (B)
- [ ] A developer account at developer.crazygames.com. Payout details come first, through Tipalti, which pays monthly by bank transfer or PayPal once €100 is owed.
- [ ] Read the developer terms (the August 2025 version is current). You keep full ownership; no exclusivity. Look in particular for the revenue share, which CrazyGames' docs and FAQ don't state, and anything on AI-made content.
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
- [ ] `gameplayStart` whenever play begins or carries on: a new run, a resume, after a lost life, each new place.
- [ ] `gameplayStop` at every break: the player's pause, menus, place cards, the run's end.
- [ ] Never `gameplayStop` when the window loses focus or the tab is hidden: CrazyGames handles that itself. The kit pauses play by itself at those moments (`lantern-box/kit/lantern-box.js`, the `blur` and `visibilitychange` listeners), so that automatic pause must not send it.
- [ ] CrazyGames' mute setting (`muteAudio`), required for an HTML5 game:
    - the game is silent while it is on;
    - it listens for changes during play;
    - it comes before the game's own sound settings, so Volume can't turn the sound back on.
- [ ] The loading events around the first load. One CrazyGames page says they have to be called and another marks them optional; they cost little, so add them.
- [ ] Optional: `happytime` for a rare celebration, such as a boss defeated or the win. CrazyGames asks for it to be used sparingly, and not for every level or item.
- [ ] The initial download is then measured up to the first `gameplayStart`; keep it at or under 20 MB for the mobile homepage.
- [ ] Tested here before any upload: the SDK runs in a local test mode on `localhost` (or with `?useLocalSdk=true`), with demo ads, so the pausing, muting and ad breaks can be checked in the browser.

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

### Saving and accounts (C)
- [ ] Progress saved to the player's CrazyGames account, with the Progress Save option set in the submission. Either:
    - the Data module (CrazyGames' preferred way; it works like browser storage), or
    - Automatic Progress Save (it backs up the browser storage; allowed here because there are no real-money purchases).
- [ ] Use the CrazyGames username where the game asks for a name (for example, fill the initials from it); confirm with QA whether it applies.
- [ ] No privacy notice is needed while the game collects no personal data beyond CrazyGames' own SDK events. The initials stay on the player's device. If that ever changes, CrazyGames requires a Terms and Conditions or privacy notice for new players.

### After launch (B)
- [ ] Full QA review.
- [ ] Optional: one CrazyGames leaderboard (the SDK supports one), for the fixed-loadout scored mode.
- [ ] Watch revenue on the dashboard. Payouts arrive monthly once €100 is owed.
- [ ] Keep updating. Planned updates: the second loop and Hysteria if not already in, then a daily challenge.
- [ ] Hands-on SDK and ad-placement advice from CrazyGames starts at 50,000 combined plays.

## Sources
- CrazyGames docs, read 6 November 2026: [Introduction](https://docs.crazygames.com) · [Requirements](https://docs.crazygames.com/requirements/intro/) · [Technical](https://docs.crazygames.com/requirements/technical/) · [Gameplay](https://docs.crazygames.com/requirements/gameplay/) · [Advertisement](https://docs.crazygames.com/requirements/ads/) · [Account integration](https://docs.crazygames.com/requirements/account-integration/) · [Game covers](https://docs.crazygames.com/requirements/game-covers/) · [Quality guidelines](https://docs.crazygames.com/requirements/quality/) · [Basic Launch guide](https://docs.crazygames.com/resources/basic-launch-metrics/) · [FAQ](https://docs.crazygames.com/faq/) · [HTML5 v3 SDK](https://docs.crazygames.com/sdk/html5-v3/intro)
- Added later the same day: [SDK game module](https://docs.crazygames.com/sdk/game/) (the gameplay events, the mute setting, loading events, happytime) · [FAQ: Do I need to learn to code to make web games?](https://docs.crazygames.com/faq/#do-i-need-to-learn-to-code-to-make-web-games) (AI tools)
- The repo: `lantern-box/HANDOVER.md` (4d to kit 0.9.1), `lantern-box/GAMEPLAY-gloam-hallow.md`, `ARCADE.md`, `dist/gloam-hallow.html` (11.3 MB), `lantern-box/kit/lantern-box.js` and `lantern-box.css` (storage, iPhone sound, text selection, the automatic pause).
- Alongside it: *Gloam Hallow: portal readiness PRD* and *Twisted Retro Fit: changes for portals and the wisp shop* (both updated the same evening to match).
