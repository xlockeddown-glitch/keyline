# scripts

## Re-baking the city street maps (quarterly)

Re-bake every quarter so `public/streets/v2/` stays within a few months of OpenStreetMap:
`node --max-old-space-size=8000 --experimental-strip-types scripts/bake-city-graph.mts <city…> --drive --force`
(all 16 cities, one at a time; overpass-api.de only, it refuses a snapshot older than 7 days), then
`npm run check:city-graphs` (update a city's `budget` in `scripts/check-city-graphs.mts` if it grew), commit the new
hashed files and `manifest.json`, delete the old hashes, and ship. Players' cached copies update on their own: the
manifest is fetched network-first and the new hashed file replaces the old one in the `keyline-streets-v2` cache.

0.1.180: every manifest entry pins its file (`sha256`, `gz`, `url`, `origin`), and the client checks the bytes against
the pin before use and on every cache read. Philly is `origin: "remote"`: its pack and painted overlay live on the
keyline-packs host (GitHub Pages), not in `public/`. The exact pack bytes are vendored in `src/game/fixtures/packs/`
for `check:city-graphs` and the tests. To re-bake Philly, publish the new hashed file to that host first, then pin
its URL, sha256 and gz length in the manifest by hand and replace the vendored copy.
