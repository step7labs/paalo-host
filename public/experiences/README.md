# Experience photos

Drop the exported photos in this folder using these exact filenames. Nothing
else needs changing — the `<img>` tags in `index.html` already point here.

This folder is `public/`, so everything in it is copied straight into the build
untouched. That means a photo can be added or replaced and it will appear as
soon as the site is rebuilt, with no code change and nothing to wire up.

| File | Where it appears |
|---|---|
| `neon-fluid-painting.jpg`   | Large tile, top left of the Experiences grid |
| `yoga-with-puppies.jpg`     | Small tile, top right |
| `pasta-night.jpg`           | Small tile, middle right |
| `candlelight-concert.jpg`   | Bottom left tile |
| `bhajan-jamming.jpg`        | Bottom right tile |

## Pop-up station photos

The sideways strip in section 04 reads from this folder too, one file per
station. These are portrait rather than landscape — the cards are taller
than they are wide.

| File | Station |
|---|---|
| `vintage-polaroid-station.jpg`  | 01 · Vintage Polaroid Station |
| `block-printing-tote.jpg`       | 02 · Block Printing on Tote Bags |
| `mug-tumbler-engraving.jpg`     | 03 · Mug & Tumbler Engraving |
| `charm-bracelet.jpg`            | 04 · Make Your Own Charm Bracelet |
| `shell-bag-making.jpg`          | 05 · Shell Bag Making |
| `make-your-own-candle.jpg`      | 06 · Decorate Your Own Candle |
| `potpourri-bag.jpg`             | 07 · DIY Potpourri Bag |
| `body-scrub.jpg`                | 08 · DIY Body Scrub |
| `neon-fluid-painting-live.jpg`  | 09 · Neon Fluid Painting |
| `diy-keychains.jpg`             | 10 · DIY Keychain Station |
| `plant-your-own-pot.jpg`        | 11 · Plant Your Own Pot |
| `design-your-own-cap.jpg`       | 12 · Design Your Own Cap |
| `design-your-own-tumbler.jpg`   | 13 · Design Your Own Tumbler |
| `jello-shots.jpg`               | 14 · Make Your Own Jello Shots |

All fourteen station photos come from the pitch deck. Several were
screenshots of Instagram posts, so each has been cropped to remove the
phone chrome (status bar, "Add comment" bar, action rail) and, where the
frame allowed, the posting account's handle or logo — `@thatcuteshop_`,
`@_kalanidhii`, `justlittlethingsss` and a retail brand's packaging were
all cropped out rather than published.

Worth knowing: those four were sourced from other businesses' social
posts rather than shot at a Paalo event. Cropping removes the visible
attribution but not the question of who owns the picture, so replace them
with Paalo's own photography when it exists.

`shell-bag-making.jpg` is deliberately cropped in tight on the monogram so
the guest holding the bag is not identifiable.

Four of the five tile photos are now real Paalo event photography, pulled
from the clips in `media-source/` (see the README there for which file each
one came from). `bhajan-jamming.jpg` is still missing — nothing in the
supplied batch shows a bhajan session — so that tile keeps its placeholder.

`neon-fluid-painting.jpg` and `neon-fluid-painting-live.jpg` were also
swapped over to Paalo's own UV-night footage, replacing the versions lifted
from the pitch deck. That removes the provenance question on both.

## What to export

- **Format:** JPG (not PNG — these are photographs, PNG triples the filesize)
- **Width:** 1600–2000px on the long edge. Bigger is wasted; smaller goes soft.
- **Orientation:** landscape. All five tile slots are wider than they are tall;
  the station cards below are portrait (roughly 4:5).
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
