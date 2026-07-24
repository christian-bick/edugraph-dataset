---
name: update-view
description: "/update-view {viewName} - Update the visual view module under src/visuals/views/[<category>/]{viewName} to match its spec, adopt producing generators, and validate."
---

Update the visual view module under `src/visuals/views/[<category>/]{viewName}` (identified by containing `spec.ts`) as follows: 

- Consider spec.ts as the source of truth for the intended behavior
- Ensure strict payload validation using `validateProblemData` from `../../../helpers/validation.ts` (or `../../helpers/validation.ts` for top-level views, though no top-level view module currently exists — every view is category-nested) at the beginning of the view component
- Ensure graceful validation error recovery by throwing `ViewValidationError` for invalid data or rendering bounds violations (caught by `ErrorBoundary` in `withConfig`)
- The codebase-wide standard is zero local silent fallbacks (e.g. `data.shape || 'circle'`, `config.arrangement || 'scattered'`) — every view already consumes resolved `config` and `problem.data` directly, since `withConfig` guarantees every declared parameter resolves to a non-null value. Hold new/modified code to the same bar
- The codebase-wide standard is that every view derives all of its randomized visual decisions (icon choice, scatter/layout, shuffles, rotations) exclusively from `payload.seed`, with no unseeded entropy anywhere. `payload.problem.id` still exists on the type but is dead — no view reads it; do not reach for it. `withConfig` already seeds the global PRNG from `payload.seed` before your component runs, so a bare `random()` call is safe as long as you don't reseed it. Hold new/modified code to the same bar — any other entropy source breaks render determinism and silently poisons the VQA cache
- Maintain pure visual focus: views must not calculate mathematical properties or perform ontology resolution
- Adopt the rendering behavior of the view to match the specification if necessary
- Update the checklist.md to match with items that cover the specification 

If the interface for the problem payload needed to be changed or extended to fulfill the view requirements then:

- Run `npx vite-node src/scripts/show-matching-stats.ts --spec=test` (or `--spec=ccss`) to find which generators currently match and successfully produce content for this view, including rejection reasons for near-misses
- adopt the matched generators to properly supply the required problem data fields

For validation:

- Review and update the `src/spec/test` spec module if needed to ensure you will have generation examples. Every spec file must export its targets as `export const spec: CompetencyTarget[] = [...]` — this is the only export the pipeline reads; do not invent a different export name or add alias exports
- Ensure the vite dev server is running (`npm run dev`) — the dataset pipeline and the debug scripts below render views headlessly via Playwright against it
- For a quick check of one target/view without touching the dataset: `npm run test:target -- --target=<target.id> --spec=test --render`, which reports matching, generates the sample data, and (with `--render`) writes images to `out/target-test/`
- For a full local slice: run `npm run generate:dataset -- --spec=test --generator=<generator> --view=<view>`
- Review the generation results (verifying both Question `_mode-Q` and Solution `_mode-S` modes) and fix remaining issues if needed
- Run `npm run validate:dataset -- --generator=<generator> --view=<view> --dataset=test` to catch checklist/rendering mismatches via the automated VQA check. If a sample fails after a fix, `npm run retest:sample -- --key="<sample_key>" --attempt=<n> --spec=test` (the exact command is printed for every failure in `out/dataset-test/validation-report.md`) replays just that one sample instead of regenerating the whole module
- run vitest via `npm run test`

For the checklists.md:

- Only include visual layout, rendering, DOM structure, SVG representations, and interaction criteria - do NOT include abstract mathematical criteria
- Clearly distinguish between Question Mode (`_mode-Q`) (blank inputs/unselected) and Solution Mode (`_mode-S`) (filled/highlighted answers)
- Check `src/visuals/views/checklist.md` (root) and the category `checklist.md` before writing anything — they are concatenated together with the leaf checklist for validation, so do NOT restate a rule they already cover (e.g. root already says Solution Mode must never show instruction text headers)
- If the view shows a prompt/instruction text in Question Mode, state that requirement as scoped to Question Mode explicitly (e.g. "In Question Mode, the prompt must read X. Per the global Instruction & Mode Rules, this text is absent in Solution Mode.") — an unscoped requirement reads as an override of the root rule and will fail the view's own correct Solution Mode rendering
- If the view deliberately shows the prompt in both modes (a legitimate but rare exception), state that explicitly and explain why the Solution image would otherwise be ambiguous — see `sorting-classify-sort/checklist.md`
- Assume that the validation mechanism is unaware of parameterization - do NOT include conditional validation aspects (mode is the one exception, since it's given as explicit context)
- Focus on key visual validation aspects - do NOT include edge cases or overly verbose criteria

Reference examples: 

- You can take inspiration from the neighboring "operations-vertical" module for guidance on standard exercise layouts
- You can take inspiration from the neighboring "counting-objects-simple" module for guidance on visual object arrangements
- You can take inspiration from the neighboring "shape-naming" module for guidance on geometric rendering
- You can take inspiration from the neighboring "time-analog" module for guidance on a view with multiple valid internal configurations (see its `checklist.md` for how to phrase alternative observable layouts without referencing internal config flags)

IMPORTANT: 

- Do NOT update code outside views, generators and the "test" spec without user confirmation
- Do NOT care about matching of competencies with specs other than "test"
- Do NOT assume the need for backward compatibility with legacy code
- Do NOT modify spec.ts without user confirmation
