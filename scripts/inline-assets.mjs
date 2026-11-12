// Lists the pictures in public/stories/inline/ so story booklets show them
// in place of the dashed "missing picture" boxes. Run after adding files.
import { readdirSync, writeFileSync } from 'node:fs'
const dir = new URL('../public/stories/inline/', import.meta.url)
const files = readdirSync(dir).filter(f => /\.(webp|png|svg)$/i.test(f))
const map = {}
for (const f of files.sort()) map[f.replace(/\.[^.]+$/, '')] = `/stories/inline/${f}`
writeFileSync(new URL('../src/data/inlineAssets.json', import.meta.url), JSON.stringify(map, null, 2) + '\n')
console.log(`${files.length} pictures listed`)
