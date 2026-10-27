# scripts

## Re-baking the city street maps (quarterly)

Re-bake every quarter so `public/streets/v2/` stays within a few months of OpenStreetMap:
`node --max-old-space-size=8000 --experimental-strip-types scripts/bake-city-graph.mts <city…> --drive --force`
(all 15 cities, one at a time; overpass-api.de only, it refuses a snapshot older than 7 days), then
`npm run check:city-graphs` (update a city's `budget` in `scripts/check-city-graphs.mts` if it grew), commit the new
hashed files and `manifest.json`, delete the old hashes, and ship. Players' cached copies update on their own: the
manifest is fetched network-first and the new hashed file replaces the old one in the `keyline-streets-v2` cache.
