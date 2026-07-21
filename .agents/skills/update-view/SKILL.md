---
name: update-view
description: "/update-view {viewName} - Update the visual view module under src/visuals/views/[<category>/]{viewName} to match its spec, adopt producing generators, and validate."
---

Update the visual view module under `src/visuals/views/[<category>/]{viewName}` (identified by containing `spec.ts`) as follows: 

- Consider spec.ts as the source of truth for the intended behavior
- Ensure strict payload validation using `validateProblemData` from `../../../helpers/validation.ts` (or `../../helpers/validation.ts` for top-level views) at the beginning of the view component
- Ensure graceful validation error recovery by throwing `ViewValidationError` for invalid data or rendering bounds violations (caught by `ErrorBoundary` in `withConfig`)
- Remove all local silent fallbacks (e.g. `data.shape || 'circle'`, `config.arrangement || 'scattered'`) and consume resolved `config` and `problem.data` directly
- Maintain pure visual focus: views must not calculate mathematical properties or perform ontology resolution
- Adopt the rendering behavior of the view to match the specification if necessary
- Update the checklist.md to match with items that cover the specification 

If the interface for the problem payload needed to be changed or extended to fulfill the view requirements then:

- find generators that produce problems for this view
- adopt them to properly supply the required problem data fields

For validation:

- review and update the "/src/spec/test" spec module if needed to ensure you will have generation examples
- run the "src/scripts/generate-dataset.ts" script using the respective "--spec", "--generator" and "--view" settings
- review the generation results (verifying both Question `_mode-Q` and Solution `_mode-S` modes) and fix remaining issues if needed
- run vitest via `npm run test`

For the checklists.md:

- Only include visual layout, rendering, DOM structure, SVG representations, and interaction criteria - do NOT include abstract mathematical criteria
- Clearly distinguish between Question Mode (`_mode-Q`) (blank inputs/unselected) and Solution Mode (`_mode-S`) (filled/highlighted answers)
- Assume that the validation mechanism is unaware of parameterization - do NOT include conditional validation aspects
- Focus on key visual validation aspects - do NOT include edge cases or overly verbose criteria

Reference examples: 

- You can take inspiration from the neighboring "operations-vertical" module for guidance on standard exercise layouts
- You can take inspiration from the neighboring "counting-objects-simple" module for guidance on visual object arrangements
- You can take inspiration from the neighboring "geometry-naming" module for guidance on geometric rendering

IMPORTANT: 

- Do NOT update code outside views, generators and the "test" spec without user confirmation
- Do NOT care about matching of competencies with specs other than "test"
- Do NOT assume the need for backward compatibility with legacy code
- Do NOT modify spec.ts without user confirmation
