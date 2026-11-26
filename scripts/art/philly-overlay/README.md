# Philly painted overlay (0.1.180 pack)

Sparse painted overlay for Philadelphia: water, parks with tree clumps, and landmark footprints. Streets are erased to
transparent so the OSM tiles show through. No labels. Rendered in Web Mercator over the baked graph bbox
[39.92448, -75.198, 39.97751, -75.13056] (S, W, N, E), so a Leaflet imageOverlay with those corner bounds lines up.

1. `python3 fetch.py`: OSM API /map tiles of the bbox into tiles/ (not committed).
2. `python3 parse.py`: water, park and named-building polygons into features.json (not committed).
3. `python3 render.py 15`: overlay-z15.png at z15 resolution (1571 x 1612), shown 2x at the default zoom 16.
4. Save as WebP q65, alpha q70, method 6 (218,632 B; cap 262,144 B), then `python3 anchors.py`, which measures the
   painted City Hall, Rittenhouse, Washington and Logan Squares against their OSM centroids
   (src/game/fixtures/packs/philly-overlay-anchors.json).

The WebP is published only on keyline-packs (v2/philly-overlay.<sha256>.webp), never in this repo's static output.
Style test for direction: /workspace/kl-themed-maps/philly-mock-v1.jpg (Ryan approved Nov 25, 2026, 7:05 PM CT).
