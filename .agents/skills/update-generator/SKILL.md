---
name: update-gen
description: "/update-gen {moduleName} - Update the generator module under src/generators/[<category>/]{moduleName} to match its spec, create/update its spec.test.ts, adopt consuming views, and validate."
---

Update the generator module under `src/generators/[<category>/]{moduleName}` (identified by containing `spec.ts`) as follows: 

- Consider spec.ts as the source of truth for the intended behavior
- Add a spec.test.ts that makes use of "generateWithLabels" from "utils.ts" if missing
- Update generator.test.ts if necessary or make sure to cover edge-cases there
- Adopt the behavior of the generator to match the specification if necessary
- Update the checklist.md to match with items that cover the specification 

If the interface for the generated problem needed to be changed to fulfill the generator requirements then:

- Run `npx vite-node src/scripts/show-matching-stats.ts --spec=test` (or `--spec=ccss`) to find which views currently match and successfully consume this generator's problems, including rejection reasons for near-misses
- adopt the matched views to properly render these new problems

For validation:

- Review and update the `src/spec/test` spec module if needed to ensure you will have generation examples. Every spec file must export its targets as `export const spec: CompetencyTarget[] = [...]` — this is the only export the pipeline reads; do not invent a different export name or add alias exports
- Ensure the vite dev server is running (`npm run dev`) — the dataset pipeline and the debug scripts below render views headlessly via Playwright against it
- For a quick check of one target without touching the dataset: `npm run test:target -- --target=<target.id> --spec=test --render`, which reports matching, generates the sample data, and (with `--render`) writes images to `out/target-test/`
- For a full local slice: run `npm run generate:dataset -- --spec=test --generator=<generator> --view=<view>`
- Review the generation results (verifying both Question `_mode-Q` and Solution `_mode-S` modes) and fix remaining issues if needed
- Run `npm run validate:dataset -- --generator=<generator> --dataset=test` to catch checklist/rendering mismatches via the automated VQA check. If a sample fails after a fix, `npm run retest:sample -- --key="<sample_key>" --attempt=<n> --spec=test` (the exact command is printed for every failure in `out/dataset-test/validation-report.md`) replays just that one sample instead of regenerating the whole module
- run vitest via `npm run test`

For the checklists.md:

- Only include use abstract mathematical criteria - do NOT include any visual aspects
- Check `src/generators/checklist.md` (root) and the category `checklist.md` before writing anything — they are concatenated together with the leaf checklist for validation, so do NOT restate a rule they already cover
- Assume that the validation mechanism is unaware of parameterization - do NOT include conditional validation aspects
- Be concise and focus on the most important logical validation aspects - do NOT include edge cases

Reference examples: 

- You can visit the neighboring "arithmetic" module for guidance on numeric aspects
- You can visit the neighboring "shape-build-shape" for guidance on geometric aspects

IMPORTANT: 

- Do NOT update code outside views, generators and the "test" spec without user confirmation
- Do NOT care about matching of competencies with specs other than "test"
- Do NOT assume the need for backward compatibility with legacy code
- Do NOT modify spec.ts without user confirmation
