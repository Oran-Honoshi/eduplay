# Visual generator (question → visual, automatically)

## Two strategies: one setting

| | `EDUPLAY_VISUAL_STRATEGY=library` (the default today) | `EDUPLAY_VISUAL_STRATEGY=draw` (**the goal**) |
|---|---|---|
| What the model does | Fills `visual_data`; the library draws it | **Draws every picture itself** as SVG |
| Brand look | 100%, from code | Learned from 8 reference drawings rendered by the library (`few_shot_draw.json`) and enforced by the validator |
| When a type is missing | Draws custom (sent for review) | Draws, as usual |
| Cost and speed | Cheap and fast | More tokens (SVG), slower |
| Approval | Library = automatic; custom = a person | A person checks a sample, then switches to automatic once quality holds |

**Recommended path:** run a lesson in both modes and compare in admin. Once `draw` passes the validator and a visual review, make it the default. The library stays as the style reference and as a free fallback.

For questions the library doesn't cover yet, or for new lessons. A model looks at each question and chooses one of three options:

1. **Library** (`mode: library`): fills `visual_data` for one of the 60 types. `visuals.js` draws it. This covers most cases.
2. **Custom drawing** (`mode: custom`): when no type fits, the model draws an SVG in the brand language (palette, Rubik/Assistant, flat shapes, "?" for the unknown). The validator rejects anything off-brand. It also sends a `new_type_suggestion`, so a recurring need becomes a library type.
3. **No picture** (`mode: none`): when a picture adds nothing (for example a bare calculation in grade 6).

## How it works

```
question + answer → model (SYSTEM_PROMPT.md + few_shot.json, tool submit_visual)
       → validate.js  ──fail──→ the error goes back to the model (up to 3 attempts)
       → pass → library: approve automatically · custom / warning: a person approves in admin
```

## Running it

```bash
npm i @anthropic-ai/sdk
export ANTHROPIC_API_KEY=...
node generator/generate.mjs lesson.json lesson.visuals.json        # batch
node generator/generate.mjs --one "כמה זה 3 × 4?" 12 math ב          # a single question
# the model is configurable: EDUPLAY_VISUAL_MODEL=claude-opus-5-5 (for hard custom drawings)
```

Input: an array of `{ id, text, answer, subject, grade, options? }`. Output: `{ id, mode, visual_data | svg, alt, why, hidden, warnings, errors, needs_review }`.
**Nothing is written to the database.** Import the output in the admin screen and approve it there.

## What validate.js checks (on every output, model or human)

- **The answer doesn't appear in the picture:** not as text, not as a full clock (`clock_span`), not as a shaded fraction, not as a marked point on a line.
- Known types, required fields, icons that exist, up to 20 objects, share up to 40.
- The numbers drawn come from the question (warning).
- Custom SVG: the brand palette only, Rubik/Assistant only at bold weights, font size ≥ 16, no hairline strokes, no gradients, filters, images, scripts, emoji or external links, and viewBox ≤ 720×480.

It also works on its own: use `validateVisual(question, result)` in CI or in admin when a person edits by hand.

## Files

| File | |
|---|---|
| `SYSTEM_PROMPT.md` | The model's system prompt: decision order, rules, the type catalogue, brand rules for SVG |
| `few_shot.json` | 7 examples of correct tool calls (library, none, custom) |
| `DRAW_MODE.md` | Added to the prompt in draw mode: "draw everything yourself, in the reference style" |
| `few_shot_draw.json` + `build_draw_refs.mjs` | 8 reference drawings rendered by the official library. Re-run the script after changing the style |
| `generate.mjs` | The run: Claude API, tool use, validation, retries, batch |
| `validate.js` | The validator |
| `demo/demo_run.json` + `demo/generator_demo.html` | A demo on 16 new questions, including a rejected attempt and its fix |

## Growing the library over time

`new_type_suggestion` and `missing_icons` from the outputs are the backlog. When the same custom drawing comes up 3 times or more, turn it into a type in `visuals.js` (one function) and add it to the catalogue in `SYSTEM_PROMPT.md`.
