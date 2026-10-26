# Retro Games

Browser arcade games in the spirit of the late 80s and early 90s, all built on **Retro Kit**: one shared look (a smooth retro world of banded colour and ink outlines, inside a modern glass interface), one game shell (title, pause, game over, high scores, settings, phone controls for one or two thumbs) and one build.

## Play a game

Double-click any file in `dist\`. Each one is a single self-contained file: it works offline and can be copied anywhere. (`dist\` is not kept in git: rebuild it any time with the command below.)

Or play them all on the arcade's website, **Twisted Retro Fit** (see [The website](#the-website) below).

## Make a new game

Open Claude Code in this folder and describe the game, for example:

> Make a Frogger-style game using the retro kit.

Claude Code reads the kit's skill (`.claude\skills\retro-kit\`), writes `games\<name>\index.html` and builds `dist\<name>.html`.

## Rebuild by hand

If you change a game yourself, rebuild it. In **PowerShell** (one command, it works from any folder):

```powershell
& "C:\Users\barne\AppData\Local\Programs\Python\Python312\python.exe" "C:\Users\barne\Documents\Calude Code\Retro Games\kit\build.py"
```

That rebuilds every game and prints one line per game, such as `Built dist/dusk-shatter.html (300 KB)`, plus a warning for anything a game does that the kit's rules forbid. To rebuild just one, add its folder name to the end of the command.

## The website

**Twisted Retro Fit** is the arcade's front page: a card for each game (its logo, a picture, what it's about, its controls and your best score) and a Play button that opens the game. GitHub Pages hosts it for free from this repository.

**Look at it on your computer.** Build it, then double-click `_site\index.html`:

```powershell
& "C:\Users\barne\AppData\Local\Programs\Python\Python312\python.exe" "C:\Users\barne\Documents\Calude Code\Retro Games\site\build.py"
```

That builds every game on the page and puts the whole website in `_site\` (not kept in git).

**Publish it.** Every push to `main` publishes the site: GitHub runs the same build (`.github\workflows\publish-site.yml`) and puts the result online. Setting it up, once:

1. On github.com, make a new **public** repository (free GitHub Pages needs a public one). Leave it empty: no README, .gitignore or licence.
2. Connect this folder to it and push (replace `YOUR-NAME` and `YOUR-REPO`):
   ```powershell
   git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
   git push -u origin main
   ```
3. On the repository's page: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
4. Open the **Actions** tab, pick **Publish the arcade** and press **Run workflow** (the first run, from step 2, fails until step 3 is done). When it goes green, the site is at `https://YOUR-NAME.github.io/YOUR-REPO/`.

After that, commit and push as usual and the site updates itself a minute or two later.

**Full screen and the home screen.** Every game has a full-screen button (title screen and in-play bar) wherever the browser allows it: on Android it hides the address bar and holds the phone sideways. Players can also add the arcade to a phone's home screen (iPhone: Share, then Add to Home Screen; Android: the browser's menu, then Add to Home screen or Install app), and it then opens like an app with no browser bars. On the website each game's title screen also has a Back to arcade button (top left), because an app on the home screen has no browser Back button. The game files in `dist\` have neither the home-screen tags nor that button: the website build adds them to its own copies.

**Add a new game to the site.** Add an entry to `site\games.json` (its folder name, a genre, a one- or two-sentence blurb, and a description of its picture for screen readers) and a 16:9 picture of it in play at `site\art\<name>.webp`. The card's name, tagline, controls and modes are read from the game itself. A game not in `games.json` is not on the site; the build prints a note about it.

## What's where

| Path | What |
|---|---|
| `kit\retro-kit.css` | The look: colours, fonts, glass interface |
| `kit\retro-kit.js` | The game shell: screens, game modes, controls, full screen, sound, music, sprites, saving |
| `kit\build.py` | Turns a game's source into one playable file |
| `kit\template.html` | Starting point for a new game |
| `kit\fonts\`, `kit\licences\` | The four typefaces and their licences (SIL Open Font License: free to embed in games) |
| `games\<name>\index.html` | A game's source |
| `games\<name>\music.js` | Optional: a game's soundtrack (an MP3 written out as text), played by the kit |
| `dist\<name>.html` | The built game |
| `games\kit-sampler\` | The kit's test page: every drawing part on four scenes, with a frame-rate readout. Open `dist\kit-sampler.html` after changing the kit |
| `site\index.html` | The website's front page (the build adds a card for each game) |
| `site\games.json` | Which games are on the website, in what order, with a blurb for each |
| `site\art\` | The picture on each game's card |
| `site\manifest.webmanifest`, `site\icons\` | What a phone needs to add the arcade to its home screen as an app: its name, how it opens (full screen) and its icon (`icon.svg`, with the PNGs drawn from it) |
| `site\build.py` | Builds the games and the website into `_site\` |
| `.github\workflows\publish-site.yml` | Tells GitHub to build and publish the website on every push to `main` |
| `.claude\skills\retro-kit\` | Instructions Claude Code follows for every game |
| `CLAUDE.md` | Standing rules for Claude Code in this folder |

The full design system (colours, type, components, rules) is the Retro Kit design system page: https://claude.ai/artifact/6wXwkr898ypzb7cncN7a7B

Settings and high scores are saved in the browser on each device. Settings are shared by every Retro Kit game; high scores are kept per game, and per mode in a game with modes (such as Chrome Chomp's Classic and Advanced).
