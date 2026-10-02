#!/usr/bin/env python3
"""Injects the gallery markup into index.src.html and builds the deployable site into dist/. No dependencies.
Every photo is from europeangardendesign.ca; captions come from his own file names."""
import struct, pathlib

ROOT = pathlib.Path(__file__).parent

def webp_size(p):
    b = p.read_bytes()[:40]
    chunk = b[12:16]
    if chunk == b"VP8X":
        w = 1 + int.from_bytes(b[24:27], "little"); h = 1 + int.from_bytes(b[27:30], "little")
    elif chunk == b"VP8 ":
        w, h = struct.unpack("<HH", b[26:30]); w &= 0x3FFF; h &= 0x3FFF
    else:  # VP8L
        bits = int.from_bytes(b[21:25], "little"); w = (bits & 0x3FFF) + 1; h = ((bits >> 14) & 0x3FFF) + 1
    return w, h

G = [  # (file stem, category, caption)
 ("patio-raised-deck-dusk","stone","Contemporary stone patio and raised deck at dusk"),
 ("natural-stone-firepit-seating","stone","Natural stone backyard firepit with seating"),
 ("patio-bbq-dusk","stone","Contemporary stone patio with BBQ area at dusk"),
 ("outdoor-living-dusk","stone","Outdoor spaces designed for living"),
 ("patio-fireplace-seating-stonework","stone","Contemporary stone patio with fireplace and seating"),
 ("modern-patio-fireplace","stone","Modern patio with outdoor seating and fireplace"),
 ("natural-stone-seating-area","stone","Natural stone seating area"),
 ("stonework-patio-seating","stone","Stonework patio seating area"),
 ("seating-natural-stone-pathway","stone","Seating area and natural stone pathway"),
 ("stonework-pathway","stone","Natural stone pathway"),
 ("natural-stone-walkway","stone","Natural stone walkway in front of the house"),
 ("natural-stone-stairs","stone","Natural stone stairs along the side of the house"),
 ("patio-bbq-day","stone","Contemporary stone patio with BBQ area"),
 ("patio-fireplace-seating-day","stone","Contemporary stone patio with fireplace and seating"),
 ("patio-fireplace-bbq","stone","Stone patio with fireplace, seating and barbeque area"),
 ("patio-fireplace-raised-seating","stone","Stone patio with fireplace and raised seating area"),
 ("patio-bbq-custom-fence","stone","Stone patio BBQ area and custom fence"),
 ("patio-outdoor-heating","stone","Stone patio with outdoor heating and seating"),
 ("patio-bbq-stonework-artwork","stone","Patio barbeque area with detailed stonework"),
 ("natural-stone-retaining-wall-front","walls","Natural stone retaining wall, front garden"),
 ("stone-retaining-wall","walls","Stone retaining wall"),
 ("stone-retaining-wall-side","walls","Stone retaining wall from the side"),
 ("natural-stone-retaining-walls-flowers","walls","Natural stone retaining walls for flower beds"),
 ("stonework-fence-deck-retaining-wall","walls","Stonework, fencing, deck and retaining wall"),
 ("natural-stonework-garden-border","walls","Natural stonework garden border"),
 ("wattle-fence","decks","Traditional European wattle woven fence"),
 ("wattle-fence-garden-gate","decks","Wattle fence and custom wooden garden gate"),
 ("wattle-fence-privacy-screen","decks","Wattle fence privacy screen for a backyard seating area"),
 ("wattle-fence-hideaway","decks","Wattle fence hideaway"),
 ("wattle-fence-side-view","decks","Wattle fence, side view"),
 ("custom-wooden-bench-deck","decks","Custom wooden bench and deck"),
 ("custom-wood-bench","decks","Custom wood bench"),
 ("deck-railing-fence","decks","Deck railing and backyard fence"),
 ("stonework-fence-deck-railing","decks","Stonework, fencing and deck with railing"),
 ("deck-with-sculptures","decks","Contemporary deck with sculptures"),
 ("deck-and-fencing","decks","Deck and fencing"),
 ("decorative-dividing-fence","decks","Decorative dividing fence"),
 ("decorative-wooden-fence","decks","Decorative wooden fence"),
 ("architectural-fence","decks","Architectural fence design"),
 ("wooden-stairs-decking","decks","Wooden stairs and decking in the garden"),
 ("fence-and-deck","decks","Fence and deck"),
 ("backyard-oasis-yellow-house","garden","Backyard oasis"),
 ("backyard-oasis-garden","garden","Backyard oasis garden design"),
 ("flower-garden-stonework","garden","Flower garden with stonework"),
 ("flowering-garden","garden","Flowering garden"),
 ("flowering-garden-natural-stone","garden","Flowering garden with natural stone"),
 ("flowering-tree","garden","Flowering tree"),
 ("white-fence-flower-garden","garden","Decorative white fence and flower garden"),
 ("backyard-seating-lawn","garden","Backyard seating area and lawn"),
 ("ba-fountain-after","water","Garden fountain"),
 ("pond-stage-4","water","Backyard garden pond"),
 ("stone-man-artwork","water","Garden statue, stone man artwork"),
 ("ba-artwork-after","water","Artwork sculptures in the garden"),
 ("ba-backyard-before","ba","Backyard transformation: before"),
 ("ba-backyard-after","ba","Backyard transformation: after"),
 ("ba-fountain-before","ba","Garden fountain: before"),
 ("ba-fountain-after","ba","Garden fountain: after"),
 ("ba-pathway-before","ba","Paving stone pathway: before"),
 ("ba-pathway-after","ba","Paving stone pathway: after"),
 ("ba-artwork-before","ba","Artwork sculptures garden: before"),
 ("ba-artwork-before-2","ba","Artwork sculptures garden: before (2)"),
 ("ba-artwork-after","ba","Artwork sculptures garden: after"),
 ("pond-stage-1","ba","Backyard garden pond: stage 1"),
 ("pond-stage-2","ba","Backyard garden pond: stage 2"),
 ("pond-stage-3","ba","Backyard garden pond: stage 3"),
 ("pond-stage-4","ba","Backyard garden pond: stage 4 (final)"),
]

# Interleave categories so the "All" view opens with a mix of work.
from itertools import zip_longest
cats = []
for _, c, _ in G:
    if c not in cats: cats.append(c)
buckets = [[g for g in G if g[1] == c] for c in cats]
ordered = [g for row in zip_longest(*buckets) for g in row if g]

out = []
for stem, cat, cap in ordered:
    w, h = webp_size(ROOT / "images" / f"{stem}-800.webp")
    out.append(
        f'<li class="g-item" data-cat="{cat}"><a href="images/{stem}.webp" data-caption="{cap}">'
        f'<img src="images/{stem}-800.webp" width="{w}" height="{h}" alt="{cap}" loading="lazy" decoding="async"></a></li>')
src = (ROOT / "index.src.html").read_text()
css = (ROOT / "styles.css").read_text()
html = src.replace("<!--GALLERY-->", "\n".join(out))
html = html.replace('<link rel="stylesheet" href="styles.css">', "<style>\n" + css + "</style>")  # inline: no render-blocking request
import shutil
DIST = ROOT / "dist"
shutil.rmtree(DIST, ignore_errors=True)
DIST.mkdir()
(DIST / "index.html").write_text(html)
shutil.copytree(ROOT / "images", DIST / "images")
shutil.copytree(ROOT / "fonts", DIST / "fonts")
for f in ("main.js", "_headers", "robots.txt", "netlify.toml"):
    shutil.copy(ROOT / f, DIST / f)
print(f"dist/ built with {len(out)} gallery photos")
