# BossBar

The boss's health in a fight: a long thin brass bar across the bottom middle with its name above, filled in ember. Agreed in step 4b rounds 8 and 9.

## Markup
```html
<div class="lb-bossbar" role="meter" aria-label="The Tentacled Skull" aria-valuenow="86"><p class="lb-bossbar-name">The Tentacled Skull</p>
  <div class="lb-bossbar-edge"><div class="lb-bossbar-track" style="--v:.86;--trace:.95"><i class="trace"></i><i class="fill"></i></div></div></div>
```

## Rules
- 420 px wide, 22 px from the bottom (300 px and 16 px on a phone, between the thumbs), over the black of the ground. The name in IM Fell English 18 px (16), `heading`.
- Fill `boss-top` through `ember` to `boss-low`; after a hit a lighter trace (`boss-trace`) of what was lost drains away. It fills as the boss arrives and goes when the fight ends.
