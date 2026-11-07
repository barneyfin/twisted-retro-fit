# Ground

The play strip's floor rolls up and down in hills and banks, with pits in the dips, and small pieces to stand on and climb. Agreed in step 4b round 5 (5c to 5e).

## Code
`play.js`: terrains (`tHill`, `tGround`, `tRise`) and their drawing (`rlPath`, `rlFaces`); the pieces (`rlDryWall`, `rlGreatStump`, `rlCart`, `rlCrate`, `rlBarrel`, `rlBoulders`, `rlMossRock` and the rest); a level from its sections (`lvTerrain`, `LV_SEC`, `LV_ORDER`, `LV_LEAD`, `LV_ARENA`).

## Rules
- Never below today's floor. Hills up to about half the screen on the moor, 35 to 40% in the graveyard and the forest, about 25% in the old town; small undulations throughout. Steep banks: a jump below about 70 high, a climb up to about 130. Pits about 45 wide.
- A level: a flat start, then ten sections in the place's own fixed order (Night ACDBFGEDAF, Blood Red Rain AFDCBGEADC, Dawn ABDEFGCDEA, Mist ACGFEDBADF), never the same twice running, then the flat boss arena. Seven sections: ripples; a long climb with a crag drop; a bank and plateau; a pit in a dip; the big hill; terraces; a mound between two pits. The second loop shuffles them.
- The camera follows the wanderer along and up; the layers rise at their own rates (PRD question 5).
- Pieces each have a lit top edge and sit on crests and plateaus: Night the churchyard wall and a box tomb; Blood Red Rain barrels, crates and the handcart; Dawn the drystone wall, dolmen, boulders and cairn; Mist the fallen trunk, stumps, the great stump and a mossy rock.

## Version 12
- `lvTerrain` leaves out any pit from 120 before a checkpoint to 320 after it (`LV_CP_CLEAR`), as kit 0.9.1 does, so the fly-through shows the levels as played: three pits each in Night, Blood Red Rain and Dawn, four in the Mist (Checkpoint).
