---
name: review-view
description: "/review-view {viewName} - Unified review of a visual view module (spec.ts, checklist.md, and view.tsx) under src/visuals/views/[<category>/]{viewName} against standard EduGraph rules."
---

Review the visual view module under `src/visuals/views/[<category>/]{viewName}` (identified by containing `spec.ts`, `checklist.md`, and `view.tsx`). The goal is to enforce visual rendering quality, layout spec separation of concerns, physical capacity rejection boundaries, and 100% seed-derived determinism.

If `{viewName}` is omitted, discover all view modules across `src/visuals/views/` and ask the user which module to review or review the specified target.

Validate the module against the following straightforward checklist across its three component files:

---

### 1. `spec.ts` Audit (Visual Specification)
- **Pure Visual/Layout Schemas**: Schema must define *only* visual representation, layout arrangement, or interactive mode parameters (e.g. `isReverse`, `arrangement`, `showTenFrame`). Must contain **zero** abstract math parameters (`range`, `useDecimals`, `allowNegatives`, etc.).
- **Physical Capacity & Layout Boundaries (`rejectedLabels`)**: View specs must use `rejectedLabels` to explicitly reject target scopes that exceed the view's physical rendering limits (e.g., coordinate overflow, label count limits). Use `...deductAdmitting([Scope.NumbersLarger10])` to logically expand rejection boundaries.
- **No Duplicate Parameterization**: View schemas must not re-query labels already processed by the matching generator. Views derive mathematical inputs purely from `problem.data`.

---

### 2. `checklist.md` Audit (Visual QA Criteria)
- **Pure Visual & Rendering Criteria**: Must specify *only* visual layout, SVG structures, positioning, rendering bounds, and mode presentation. Must contain **zero** abstract math generation rules.
- **Question Mode (`_mode-Q`) vs Solution Mode (`_mode-S`)**: Must clearly distinguish between Question Mode (answers blank, unselected, inputs empty) and Solution Mode (correct answers filled in, highlighted, or selected).
- **Prompt Scoping Rule**: Root `src/visuals/views/checklist.md` already states that Solution Mode hides instruction headers. Any prompt text requirement must be explicitly scoped to Question Mode (unless a documented exception is explicitly noted).
- **Hierarchical Scoping**: Check root (`src/visuals/views/checklist.md`) and parent category `checklist.md` before adding rules. Do NOT restate rules already covered at parent or root levels.

---

### 3. `view.tsx` Audit (React Renderer)
- **Strict Payload Validation**: Must import `validateProblemData` from `../../../helpers/validation.ts` (matching sub-directory depth) and call it at the beginning of the view component with required fields.
- **Graceful Error Recovery**: Must throw a `ViewValidationError` if required fields are missing or if problem data exceeds visual layout bounds. `ErrorBoundary` in `withConfig` catches this and displays a standard error card.
- **Zero Local Silent Fallbacks**: Must consume resolved `config` and `problem.data` directly without local default fallbacks (e.g. `data.shape || 'circle'`).
- **100% Seed-Derived Determinism**: All randomized visual decisions (icons, scatter positions, shuffles, rotations) must derive strictly from `payload.seed`. Never call `Math.random()` or unseeded random functions. `problem.id` is dead and unread.

---

### Automated Validation Script
Run the automated spec audit tool to catch overlapping or duplicate parameterizations:
```bash
npm run check:generator-view-specs
```
And run vitest unit tests:
```bash
npm run test -- src/visuals/views/[<category>/]{viewName}/
```
