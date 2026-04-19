# Procedural 3D Block Wall

A small frontend hobby project that turns a 2D numeric array into a faux-3D square block wall using plain HTML, CSS, JavaScript, SVG, and anime.js.

## What It Does

The renderer accepts a matrix like:

```js
[
  [1, 1, 2, 2],
  [1, 2, 2, 1],
  [2, 2, 1, 1]
]
```

Each number represents a block height. The renderer now supports `0` as a true flat level and will render larger integer values as deeper extrusions with interpolated top-face shading.

## Files

- `index.html` contains the demo shell and includes anime.js from a CDN.
- `styles.css` handles the responsive layout, controls, and stage styling.
- `script.js` contains the renderer, themes, animation presets, validation, and demo UI logic.
- `README.md` explains usage and extension points.

## Run It

You can open `index.html` directly in a browser.

If you prefer a tiny local server:

```bash
python3 -m http.server
```

Then open `http://localhost:8000`.

## Renderer API

The main function is:

```js
renderBlockPattern(container, matrix, options)
```

### Parameters

- `container`: a DOM element or selector string
- `matrix`: a rectangular 2D array of numeric heights
- `options`: optional renderer settings

### Example

```js
renderBlockPattern("#app", [
  [1, 1, 1, 2],
  [1, 2, 2, 2],
  [1, 2, 1, 1]
], {
  cellSize: 48,
  gap: 4,
  depthScale: 18,
  radius: 2,
  palette: {
    topLow: "#c89b6d",
    topHigh: "#a56f45",
    sideLight: "#d7b08b",
    sideDark: "#7a4d30",
    background: "#f6f3ee",
    shadow: "rgba(0,0,0,0.18)"
  },
  lightDirection: "top-left",
  theme: "wood",
  animation: {
    preset: "stagger-rise",
    duration: 900,
    stagger: 35,
    easing: "easeOutExpo"
  }
});
```

## Options

Supported options:

- `cellSize`: square block footprint size in pixels
- `gap`: spacing between blocks
- `depthScale`: extrusion depth per height level
- `radius`: top-face corner rounding
- `theme`: preset name (`wood`, `monochrome`, `neon`)
- `palette`: optional color overrides layered on top of the theme
- `lightDirection`: currently supports `top-left` and `top-right`
- `animation.preset`: `stagger-rise`, `wave`, or `pulse-depth`
- `animation.duration`
- `animation.stagger`
- `animation.easing`

## Themes

Included themes:

- `wood`: warm acoustic panel look
- `monochrome`: softer gallery-style relief
- `neon`: dark, luminous sci-fi panel treatment

Each theme defines:

- top face colors for lower and higher blocks
- light and dark side face colors
- panel background
- shadow color

## Demo UI

The demo includes:

- a textarea for matrix input
- controls for cell size, gap, depth, radius, theme, and animation
- a render button
- a randomize button for generating a `0` to `3` height pattern using the current input dimensions
- a replay button for the current animation preset

## Input Rules

- the matrix must be plain text rows of numbers separated by spaces
- the matrix must be rectangular
- rows cannot be empty
- values must be finite numbers

If input is invalid, the app shows a readable error message instead of failing silently.

Plain-text example:

```txt
0 0 0 0 1 1 1 2 2 2 3 3 3 3 3 3
0 0 0 1 1 1 2 2 2 3 3 3 3 3 3 3
0 0 1 1 1 2 2 2 3 3 3 3 3 3 3 3
```

## How It Works

Each block is rendered as an SVG group with:

- a top face
- left and right side faces
- a subtle front face tint for extra depth
- a soft blurred shadow

The projection is intentionally simple 2.5D. It avoids WebGL and keeps the SVG structure understandable for hobby-level editing.

## Extending It

Easy extension points:

- add more themes in the `themes` object
- add more animation presets in `animateBlocks`
- adjust the palette logic if you want a different color ramp across height levels
- add UI controls for lighting direction or animation timing

## Tradeoffs

- SVG was chosen over DOM divs because grouped faces, shadows, and scaling stay cleaner.
- The renderer uses a simple straight extrusion model instead of isometric projection to keep the code beginner-friendly.
- Rounded top faces are implemented on the top path only; side faces remain polygonal for clarity and simplicity.
