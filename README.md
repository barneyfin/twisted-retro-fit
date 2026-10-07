# Retro Games

Browser arcade games in the spirit of the late 80s and early 90s, all built on **Retro Kit**: one shared look (a 16-bit pixel world inside a modern glass interface), one game shell (title, pause, game over, high scores, settings, phone controls) and one build.

## Play a game

Double-click any file in `dist\`. Each one is a single self-contained file: it works offline and can be copied anywhere.

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

## What's where

| Path | What |
|---|---|
| `kit\retro-kit.css` | The look: colours, fonts, glass interface |
| `kit\retro-kit.js` | The game shell: screens, game modes, controls, sound, music, sprites, saving |
| `kit\build.py` | Turns a game's source into one playable file |
| `kit\template.html` | Starting point for a new game |
| `kit\fonts\`, `kit\licences\` | The five typefaces and their licences (SIL Open Font License: free to embed in games) |
| `games\<name>\index.html` | A game's source |
| `games\<name>\music.js` | Optional: a game's soundtrack (an MP3 written out as text), played by the kit |
| `dist\<name>.html` | The built game |
| `.claude\skills\retro-kit\` | Instructions Claude Code follows for every game |
| `CLAUDE.md` | Standing rules for Claude Code in this folder |

The full design system (colours, type, components, rules) is the Retro Kit design system page: https://claude.ai/artifact/6wXwkr898ypzb7cncN7a7B

Settings and high scores are saved in the browser on each device. Settings are shared by every Retro Kit game; high scores are kept per game, and per mode in a game with modes (such as Chrome Chomp's Classic and Advanced).
