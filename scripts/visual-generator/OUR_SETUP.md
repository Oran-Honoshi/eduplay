# Visual generator in this repo (EduPlay)

The designer's library, validator and generator are wired in like this:

- Renderer: `src/lib/eduVisuals/` (visuals.js, icons.js, validate.js). `src/lib/mathVisual.ts` hands every type it has no case for to this library (objects, ten_frame, groups, array, share, base_ten, money, clock, ruler, pictograph…). Types both know (fraction, number_line, graph, shapes) stay on the older renderer, which carries the labels and options the higher grades use; a question opts in with `"lib": "eduplay"`. `coordinate` and `angle` exist only in the older renderer.
- Input for the generator: `GET /api/design/grade-audit?key=<design key>&format=json&grade_max=3&subject=math&no_visual=1` → save as `lesson.json`.
- Run (needs `npm i @anthropic-ai/sdk` and `ANTHROPIC_API_KEY`, locally, not in the app):
  `node scripts/visual-generator/generate.mjs lesson.json out.json`
- Approve: as admin, `POST /api/admin/visuals-import` with `{ "items": <out.json>, "apply": false }` for a dry run, then `"apply": true`. Only library-mode visuals that pass the validator again are saved, only on questions with no picture yet; custom SVGs, warnings and question fixes are returned for a person to review.
