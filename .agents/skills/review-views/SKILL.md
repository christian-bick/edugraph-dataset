---
name: review-views
description: "/review-views [{viewName}] - Review view.tsx files in visuals/views (for a specific view module, or all views if omitted) to ensure standard problem payload validation."
---

Review the `view.tsx` files for the specified view module (or across all visual view modules if `{viewName}` is omitted). The goal is to enforce the standardized payload validation contract and prevent browser-level freezes/hangs during headless dataset generation:

## Scope Resolution
- **Specific Leaf Module**: If `{viewName}` matches a specific leaf view module ID (e.g., `/review-views operations-vertical`), restrict the review strictly to that leaf view module.
- **Parent Category Module**: If `{viewName}` matches a parent category directory name (e.g., `/review-views operations` or `/review-views shape`), review all leaf view modules under that category folder.
- **All Modules**: If `{viewName}` is omitted (e.g., `/review-views`), discover and review all view modules across `src/visuals/views/`.

1. **Strict Payload Validation**:
   - Ensure `validateProblemData` is imported from `../../helpers/validation.ts` (with correct relative path).
   - Verify that it is called at the beginning of the view component with the specific list of required fields accessed from `problem.data`.

2. **Graceful Validation Error Recovery**:
   - Rendering and validation exceptions are centrally intercepted and handled by the React `ErrorBoundary` integrated into the `withConfig` HOC wrapper.
   - If validation or a range check fails (e.g., `bandLength` or count values exceed rendering capability), throw a `ViewValidationError`. The wrapper will catch it and display a standardized red error card.
   - This prevents unhandled rendering crashes or infinite paint loops (e.g., trying to render a ruler with length `9007199254740991`), ensuring Playwright does not hang waiting for element stability.

3. **No Silent Fallbacks**:
   - Ensure all local silent fallbacks (e.g. `data.shape || 'circle'`, `data.relation || 'above'`) are removed from view logic.
   - This ensures that configuration-to-visual mismatches are immediately caught and flagged instead of silently generating incorrect images in the dataset.
   - Ensure the view consumes resolved configuration parameters directly from the `config` prop (e.g. `config.arrangement`, `config.isReverse`) without applying manual defaults (like `config.arrangement || 'scattered'`). The `withConfig` HOC automatically provides fallback values and validates that all parameters defined in the view spec schema successfully resolve to non-null/non-undefined values, safeguarding against missing configurations.

4. **Code & Component Generalization**:
   - Visual view modules are organized into 1-level category sub-directories (e.g., `src/visuals/views/operations/operations-vertical`).
   - Shared visual rendering components, helpers, or style constants used across sibling views under a category should be generalized up the tree into parent `helpers.ts` or `components/` files (e.g., `src/visuals/views/operations/helpers.ts` or `src/visuals/views/operations/components/`).
   - Leaf view modules import from shared parent helpers/components using relative paths (e.g. `import { helperFn } from '../helpers.ts'`).
   - Ensure imports from root `types/`, `lib/`, `components/`, or `helpers/` use correct relative paths (`../../../../types/`, `../../../../lib/`, `../../../components/`, `../../../helpers/`, `../../withConfig`).

5. **Verification**:
   - Run vitest via `npm run test`.

Follow these instructions strictly during the review:

## 1. General Principles

- **Minimal Code Churn**: Keep code edits minimal. Only modify view rendering setups that violate validation, fallback, or safety bounds rules.
- **Pure Visual Focus**: Views must not declare or calculate mathematical configurations or perform ontology resolution. They must consume pre-constructed properties from the `problem.data` payload directly.
- **Paths**: Keep imports relative and clean (`../../../../types/` and `../../../helpers/` for 2-level deep leaf views).
