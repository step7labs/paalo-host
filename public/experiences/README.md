# Experience photos

Drop the exported photos in this folder using these exact filenames. Nothing
else needs changing — the `<img>` tags in `index.html` already point here.

This folder is `public/`, so everything in it is copied straight into the build
untouched. That means a photo can be added or replaced and it will appear as
soon as the site is rebuilt, with no code change and nothing to wire up.

| File | Where it appears |
|---|---|
| `neon-fluid-painting.jpg`   | Large tile, top left of the Experiences grid |
| `puppy-experience.jpg`      | Small tile, top right |
| `edible-candle-painting.jpg`| Small tile, middle right |
| `candlelight-concert.jpg`   | Full-width tile across the bottom |

## What to export

- **Format:** JPG (not PNG — these are photographs, PNG triples the filesize)
- **Width:** 1600–2000px on the long edge. Bigger is wasted; smaller goes soft.
- **Orientation:** landscape. All four slots are wider than they are tall.
- **Export from the original photos**, not from a Canva design page. Exporting a
  design re-compresses the photo and bakes in whatever is layered over it.
- **No text, logos or graphic overlays on the image.** The experience name and
  description are set in type directly beneath each photo — anything written
  into the picture itself will collide with it.

## Framing

Each photo is cropped to fill its slot with `object-fit: cover`, anchored to the
centre. Keep the subject near the middle; anything important in the outer ~15%
may be cropped on narrow screens.

## Missing files are safe

If a file isn't here yet, its `<img>` is removed on load and the designed
placeholder graphic shows in its place. No broken image icons, so the site can
go live before all four photos exist.
