# TitleMenu

The title screen's menu as a neon sign: a dark board with a yellow edge tube, items in unlit tubes, the selected item lit teal.

## When to use
- The title screen only: Start game, High scores, Settings. Every other menu is a lightbox (MenuPanel).

## Markup
```html
<nav class="cn-ui cn-neon cn-title-menu" aria-label="Main menu">
  <span class="cn-tube" aria-hidden="true"></span>
  <button class="cn-titem is-selected" aria-current="true">{play icon}Start game<span class="cn-kbd">Enter</span></button>
  <button class="cn-titem">{trophy icon}High scores</button>
  <button class="cn-titem">{sliders icon}Settings</button>
</nav>
```

## The game provides
- Nothing beyond its name in the logo; the items are the shell's.

## Rules
- Board `neon-board`, `radius-case`, `shadow-board`, 20px by 18px padding, `menu-width` wide; the `tube-yellow` edge tube 7px inside (`shadow-tube-yellow`).
- Unselected items `neon-unlit`, no glow. Selected: a 2px `tube-teal` outline with `shadow-tube-teal`, lettering in `tube-core-teal` with a teal glow, the keycap outlined in `tube-teal`.
- Sits `space-5` or so below the logo, on the left of the screen over `title-shade`, so the taxi stays in view.
- Keyboard focus is a `focus-dark` ring.
