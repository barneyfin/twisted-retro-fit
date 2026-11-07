# Lantern Box Games: logo

Made 6 November 2026. This is direction C, the LB plaque, as light branding for the Gloam Hallow test submission. It's enough for credits and profile pictures; it isn't a full brand kit.

The rounds and the final board are on the canvas *Lantern Box Games Logo*: https://claude.ai/artifact/3DdRUuxxrF4BjVR7TDiUKs

## The name
- **Lantern Box Games** is three words, each with a capital. On its own, "Lantern Box" means the style kit. The studio is always "Lantern Box Games".
- Every game in the arcade goes out as Lantern Box Games, whichever kit it's built on (decided 7 November 2026).
- A web search on 6 November 2026 found no studio with this exact name. The nearest were Lantern Studio and Lanternlight Studios. That was not a trademark search.

## Which version to use
| Version | Use it for | File |
|---|---|---|
| Full mark | 48 px tall and up | `lbg-mark.svg` |
| Small mark | Below 48 px (down to 16 px), favicons, small icons. It has no rule or glow, larger letters and a thicker edge. | `lbg-mark-small.svg` |
| Profile picture | Any profile picture. It is the small mark on ink, sized so that a round crop never cuts the plaque's corners. | `lbg-avatar-512.png`, `lbg-avatar-1024.png` |
| Horizontal lockup | The usual way to show the logo with the name | `lbg-lockup-h-dark.svg`, `lbg-lockup-h-light.svg` |
| Stacked lockup | Square or tall spaces | `lbg-lockup-s-dark.svg`, `lbg-lockup-s-light.svg` |
| One colour | Wherever gradients and glow can't be used, such as single-colour print, a stamp or a watermark. The plaque is solid, with the letters, edge line and rule cut out. | `lbg-mark-mono-ink.svg`, `lbg-mark-mono-brass.svg`, `lbg-mark-small-mono-*.svg`, `lbg-lockup-h-mono-*.svg` |
| Credit strip | The game's credits: "Made by" above the dark lockup, on a plaque with a brass edge | `lbg-credit.svg`, `lbg-credit@2x.png` |

"Dark" versions are for dark backgrounds and "light" versions for parchment or white. In the light versions the mark keeps its dark plaque.

## Minimum sizes
- Full mark: 48 px tall. Small mark: 16 px.
- Lockups: 56 px tall. Below that, "GAMES" can't be read, so use the mark on its own or write the name as text.
- Credit strip: 300 px wide.

## Clear space
Leave at least a quarter of the mark's height clear on every side (25 px around a 100 px lockup), with no other text or edges in it.

## Colours
These are Lantern Box design system tokens (version 11).

| Where | Token | Hex |
|---|---|---|
| Edge, diamond, "GAMES" on dark | brass | `#c9a25a` |
| Rules beside "GAMES" and under LB | brass-dim | `#8a7046` |
| "GAMES" on light | brass-deep | `#5a4a36` |
| The name on dark | heading | `#f1d79a` |
| The name on light, the one-colour ink version, the profile picture's background | ink | `#060508` |
| "MADE BY" | text-3 | `#b9ab97` |
| Credit strip panel | plaque-face, made solid | `#0e090b` |
| Inside the mark | string-light → gold-light → `#d9913f` (letters); night-sky-2 → ink (plaque); lantern-glow (the glow) | `#fff1c8`, `#ffcf6a`, `#57284f`, `#ffc96a` |

## Type
- IM Fell English for "LB" and "Lantern Box"; Alegreya Sans Bold for "GAMES" and "MADE BY".
- Both are under the SIL Open Font Licence, which allows their use in a logo.
- The text in every file is outlined, so no font is needed to show them.

## Don't
- Stretch it, rotate it, recolour it outside the table above, or add shadows or outlines.
- Retype the name in another font.
- Add Gloam Hallow's art. The logo stays game-neutral so it can sit on any Lantern Box game.

## On CrazyGames
- **Not on the game covers.** CrazyGames covers carry the game's name only, with no icons or logos (checklist, section 6).
- **In the game's credits:** still to decide. The arcade rules allow no image files and no hex colours in a game, so `lbg-credit.svg` can't be built in as it stands (ARCADE.md, open decisions). Whatever form the credit takes, the music credit "Music made with Google Gemini" stays on a line of its own; the studio credit doesn't replace it.

## Where the files live
`brand\` at the root of the Retro Games repo (decided 7 November 2026). It sits at the root, beside ARCADE.md, because the studio covers games from every kit.

## Remaking the files
`tools/final.py` builds every SVG from the Lantern Box kit's two fonts, in `lantern-box\kit\fonts` (`python final.py <fonts folder> <output folder>`; needs the fonttools and brotli packages). `tools/png.py` renders the PNGs (`python png.py <svg folder> <png folder>`; needs Playwright). Use them if the name or a colour changes, rather than editing the files by hand.
