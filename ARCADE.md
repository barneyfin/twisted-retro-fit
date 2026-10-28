# The arcade

Barney's browser arcade: sets of HTML arcade games, each set built on its own design style kit. A kit gives every game in its set the same look, the same game shell (menus, pause, scores, settings) and the same build. Retro Kit, in this folder, is the first kit and the model for every kit after it.

This file holds the rules for the whole arcade: every kit and every game. A kit's own docs (for Retro Kit: `README.md`, `CLAUDE.md` and the skill in `.claude/skills/retro-kit/`) add to these rules and never loosen them. If the two disagree, stop and ask Barney which wins. These rules change only when Barney decides.

## What every style kit contains

Each kit has these parts, built in this order:

1. **A design system**: a Design System artifact holding the tokens, typefaces, components with previews, and a README that is the kit's rulebook. It is the spec. Change it first, then the code, so the two never drift apart. Retro Kit's: https://claude.ai/artifact/6wXwkr898ypzb7cncN7a7B
2. **A code kit**:
   - a stylesheet and a runtime script, which hold the game shell (title, mode choice, pause, game over, initials, high scores, settings, HUD, phone controls, sound, saving) and the drawing tools for the kit's look
   - the kit's fonts and their licences
   - a game template
   - a build script that turns a game into one file and warns about anything that breaks the rules
3. **A Claude Code skill**: `SKILL.md` (rules and checklist), `design.md` (look and feel) and `reference.md` (the API). A fresh Claude with nothing but the skill must be able to build a correct game.
4. **A test page** that shows every drawing part, with a frame-rate readout.
5. **Games**: `games/<name>/index.html` is a game's source; `dist/<name>.html` is the built, playable file (generated, never edited by hand, not kept in git). A kit with its own folder keeps its games there (City Nights: `city-nights/games/<name>/index.html`).

Retro Kit's split between World (the playfield) and Interface (glass panels around it) is Retro Kit's own choice. A new kit decides its own layers in its PRD.

## Arcade rules (every kit, every game)

- Every game is one self-contained HTML file that works offline. The kit, fonts and code are copied in. No network requests, no outside libraries and no image files. The only extra allowed is a soundtrack MP3 that Barney supplies, built into the file.
- Controls are desktop keyboard and phone touch (phone held sideways). No gamepad. Players are adults and teens.
- Names and art are invented. Mechanics may be borrowed from classic games; titles, characters, logos, music and recognisable looks may not. If a design starts to resemble a famous character, change it.
- Each kit has its own identity. It must not look like another kit in the arcade, nor like a style that is everywhere today.
- Games use their kit and never edit it. Colours come only from the kit's named colours (no hex values in games). Changing a kit is its own job, done only when Barney asks. Afterwards, rebuild every game in that kit and check its test page.
- Safety and accessibility:
  - the whole screen never flashes
  - nothing bigger than a character flashes more than 3 times a second (a player's respawn blink may reach 6)
  - the reduce-motion setting is honoured
  - interface text has at least 4.5:1 contrast
- A game is finished only when it builds with no warnings and the browser console is clean.
- When a change shouldn't affect gameplay, prove it didn't: the same inputs must give the same game state before and after.

## How a new kit gets made

1. **Interview first.** Find out what the style is and how it should feel, the eras or references behind it, what makes it different from the existing kits and from styles common today, and which game genres it will host. Ask; don't fill gaps with assumptions.
2. **Show directions.** Two or three genuinely different looks, as mock-ups of the same game screen. Barney picks one; refine it in rounds until he says it's right.
3. **Write a short PRD**: problem, success criteria, scope and what's out of scope, constraints, a phased plan, open questions. Nothing is built until Barney explicitly approves it.
4. **Build in phases, with a review after each**: design system; code kit and test page; a pilot game; more games; skill, build checks and docs. After each phase, say what was checked and what could not be.
5. **Prove the skill.** A fresh agent builds a game from the skill alone. If it stumbles, fix the skill, not the game.
6. **Commit at the end of each phase.** Git is Barney's: he runs the commands.

## Open decisions

These are Barney's to decide. Raise them when they become relevant; don't settle them alone.

None are open at the moment.

## Decided

- **The arcade's name**: Twisted Retro Fit (Barney, 2026-10-25).
- **Arcade front page**: a website in `site/` with a card for every game, published to GitHub Pages from this public repository by a GitHub Action on every push to `main` (Barney, 2026-10-25).
- **Folder layout**: one repo, Retro Games, with each kit in its own place: Retro Kit in `kit/` and `games/`, City Nights in `city-nights/`. The repo keeps its name for now (Barney, 2026-10-28).
- **Shared core**: City Nights starts from a copy of Retro Kit's game shell and build, restyled, with its own drawing. A core shared by every kit is revisited when a third kit is planned (Barney, 2026-10-28).
- **Settings and high scores**: settings are shared across the whole arcade; high scores are kept per game, in Retro Kit's format, so the website shows every game's best (Barney, 2026-10-28).
