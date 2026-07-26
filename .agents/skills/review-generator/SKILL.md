---
name: review-gen
description: "/review-gen [{moduleName}] [--file=spec|checklist|code] - Unified review of generator module(s) under src/generators/ against standard EduGraph rules."
---

Perform a review of generator module(s) under `src/generators/` (identified by `spec.ts`, `checklist.md`, and `generator.ts`). The goal is to enforce mathematical correctness, ontology spec separation of concerns, and robust configuration validation.

## Scope Resolution
- **Specific Leaf Module**: If `{moduleName}` matches a specific leaf module (e.g., `/review-gen arithmetic-ops-pairs`), restrict review to that module.
- **Parent Category**: If `{moduleName}` matches a category directory (e.g., `/review-gen arithmetic`), review all leaf modules under that category.
- **Macro Review (All Modules)**: If `{moduleName}` is omitted (e.g., `/review-gen`), discover and review all generator modules across `src/generators/`.
- **Aspect Filter (`--file`)**: Optionally restrict focus to a single aspect across the selected scope:
  - `--file=spec` $\rightarrow$ Audit `spec.ts` files only.
  - `--file=checklist` $\rightarrow$ Audit `checklist.md` files only.
  - `--file=code` $\rightarrow$ Audit `generator.ts` files only.

---

## Audit Guidelines (Single Source of Truth)

Refer to authoritative guidelines in `DOCS.md` during reviews:

1. **`spec.ts` Audit (Pedagogical Bridge)**:
   - Audit against rules in `DOCS.md § 4b` (Specification Design Rules).
   - Enforce pure abstract math schemas (zero visual presentation flags).
   - Verify leaf node matching direction (declare most specific true label, no ancestor redundancy).
   - Enforce resolver reusability from `src/lib/resolvers.ts` and ensure zero overlap with `generalLabels`.

2. **`checklist.md` Audit (Abstract Math Criteria)**:
   - Audit against rules in `DOCS.md § 4c` (Checklist Design Rules).
   - Enforce pure mathematical/logical criteria (zero visual/layout rules).
   - Enforce 3-level hierarchical scoping (no restating root/category rules in leaf checklists).
   - Ensure rules are concise, principle-based, and unaware of internal config flags.

3. **`generator.ts` Audit (Math Engine)**:
   - Audit against rules in `DOCS.md § 4` (Module Structure Breakdown).
   - Enforce strict configuration validation: import `validateConfigFields` from relative `lib/errors.ts` and throw `GeneratorValidationError` on missing/empty config (no silent fallbacks).
   - Verify proper ontology tag propagation in `ProblemStub.tags` for runtime math choices.
   - Enforce zero raw label parsing inside generator math functions.

---

## Automated Verification Tools

Run automated audits and unit tests to complete the review:
- **Spec Overlap & Parameterization Check**:
  ```bash
  npm run check:generator-view-specs
  ```
- **Vitest Unit Tests**:
  ```bash
  npm run test -- src/generators/[<category>/]{moduleName}/
  ```
