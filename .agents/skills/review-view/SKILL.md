---
name: review-view
description: "/review-view [{viewName}] [--file=spec|checklist|code] - Unified review of visual view module(s) under src/visuals/views/ against standard EduGraph rules."
---

Perform a review of visual view module(s) under `src/visuals/views/` (identified by `spec.ts`, `checklist.md`, and `view.tsx`). The goal is to enforce visual rendering quality, layout spec separation of concerns, physical capacity rejection boundaries, and 100% seed-derived determinism.

## Scope Resolution
- **Specific Leaf Module**: If `{viewName}` matches a specific leaf view module (e.g., `/review-view operations-vertical`), restrict review to that module.
- **Parent Category**: If `{viewName}` matches a category directory (e.g., `/review-view operations`), review all leaf modules under that category.
- **Macro Review (All Modules)**: If `{viewName}` is omitted (e.g., `/review-view`), discover and review all view modules across `src/visuals/views/`.
- **Aspect Filter (`--file`)**: Optionally restrict focus to a single aspect across the selected scope:
  - `--file=spec` $\rightarrow$ Audit `spec.ts` files only.
  - `--file=checklist` $\rightarrow$ Audit `checklist.md` files only.
  - `--file=code` $\rightarrow$ Audit `view.tsx` files only.

---

## Audit Guidelines (Single Source of Truth)

Refer to authoritative guidelines in `DOCS.md` during reviews:

1. **`spec.ts` Audit (Visual Specification)**:
   - Audit against rules in `DOCS.md § 4b` (Specification Design Rules).
   - Enforce pure visual/layout schemas (zero abstract math parameters).
   - Enforce physical capacity rejection boundaries in `rejectedLabels` (using `...deductAdmitting(...)`).
   - Enforce zero duplicate parameterization (do not re-query labels already processed by the generator).

2. **`checklist.md` Audit (Visual QA Criteria)**:
   - Audit against rules in `DOCS.md § 4c` (Checklist Design Rules).
   - Enforce pure visual and rendering criteria (zero abstract math logic).
   - Clearly distinguish between Question Mode (`_mode-Q`) and Solution Mode (`_mode-S`).
   - Scope prompt/instruction text requirements explicitly to Question Mode (per root checklist global rule).

3. **`view.tsx` Audit (React Renderer)**:
   - Audit against rules in `DOCS.md § 4` (Module Structure Breakdown).
   - Enforce strict payload validation: call `validateProblemData` from relative `helpers/validation.ts` and throw `ViewValidationError` on missing fields or visual bounds overflow.
   - Enforce zero local silent fallbacks (consume resolved `config` and `problem.data` directly).
   - Enforce 100% seed-derived determinism: derive ALL visual randomness from `payload.seed` (no `Math.random()`, unseeded RNG, or `problem.id` reading).

---

## Automated Verification Tools

Run automated audits and unit tests to complete the review:
- **Spec Overlap & Parameterization Check**:
  ```bash
  npm run check:generator-view-specs
  ```
- **Vitest Unit Tests**:
  ```bash
  npm run test -- src/visuals/views/[<category>/]{viewName}/
  ```
