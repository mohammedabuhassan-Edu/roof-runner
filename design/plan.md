# Rooftop Courier Run — Plan (Size S)

## Pitch
A 3D endless runner where you switch lanes, jump and slide across anime city rooftops while chimneys and gaps close in, and grabbing glowing packages boosts your score combo.

## View and dimension
3D, third-person behind the player, world scrolls toward the camera (player runs +Z).

## Main action
Dodge — lane-switch to avoid hazards and collect packages.

## Controls

| Action | Keyboard | Touch | Gamepad |
|---|---|---|---|
| Move left lane | ArrowLeft / KeyA | Swipe left | D-pad left / stick left |
| Move right lane | ArrowRight / KeyD | Swipe right | D-pad right / stick right |
| Jump | Space / ArrowUp | Tap upper half | A / South |
| Slide | ArrowDown / KeyS | Swipe down | B / East |
| Pause | KeyP / Escape | Pause button | Start |

## Goal and end
Run until you hit a chimney or fall in a gap; score = distance + packages × combo. Tap or key to retry from menu.

## What keeps it fresh
1. Random chimney/gap patterns per segment.
2. Lane choice under rising scroll speed.
3. Package clusters reward risky center lanes.
4. Combo timer resets if you miss pickups too long.

## Difficulty
Steady ramp: scroll speed increases every 8 s, capped in CONFIG.

## Limits (CONFIG)
- Lanes: 3 (−1, 0, +1 world X), lane width 2.2 m
- Player speed base 12 m/s scroll, max 28 m/s
- Jump height ~1.1 m, slide duration 0.55 s, lane switch 0.12 s
- Max 6 hazards visible ahead, spawn gap min 4 m
- Combo max ×5

## Fun test
"We will know whether lane-switch + jump timing on narrow roofs feels fair at high speed."

## Screens
Start (tap to run), playing HUD, pause overlay, game over with score.

## Style
STYLE: anime cel shaded | PALETTE: #1d1b2f #5b5f97 #ffc1cc #a0e7e5 #fef9ef #ff6b6b | OUTLINE: thin | SHADING: cel | DETAIL: smooth | MOOD: dreamy, heroic, vivid
