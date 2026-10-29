# About this copy

This folder is a copy of the approved City Nights design system, version 6 (29 October 2026): https://claude.ai/artifact/4DhkqfUBGEBm3Qj2DeprsM. The artifact is the spec; this copy is here so Claude Code can read it while building the kit. Version 6 changed the crash pop to the smoke cloud; see `../HANDOVER-crash-pop.md`.

- **Don't edit these files.** Change the design system first (in Barney's Claude app project), then refresh this copy from it.
- `README.md` is the rulebook. `words.md` is the word list. `tokens.json` holds every token; `tokens.css` is the same tokens as CSS custom properties, generated from it.
- `components/<Name>/README.md` describes each part; `preview.html` shows it. The previews expect the design system page to load `tokens.css`, the fonts, `components/bundle.css` and `components/bundle.js` for them, and their street pictures are stored in the artifact, so opened from this folder they show unstyled and without backdrops. Open the artifact to see them.
- `components/bundle.css` is the interface written as CSS classes (`.cn-…`). `components/bundle.js` draws the seven-segment digits as HTML, and holds the crash pop's three drawings (`CityNights.crashPop`) with the Canvas 2D code that draws them (`drawCrashPop`). Both files are reference for the kit's own stylesheet and script; the crash pop's data and drawer are meant to be ported unchanged.
- `fonts/` and `assets/Licences/` are the kit's fonts and their SIL Open Font Licences. The two Chinese fonts are cut down to the characters on the word list; Bangers is for the crash pop's letters only.
