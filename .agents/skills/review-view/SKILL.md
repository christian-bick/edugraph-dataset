---
name: review-view
description: "/review-view [{viewName}] [--file=spec|checklist|code] - Unified review of visual view module(s) under src/visuals/views/ against the EduGraph reference library."
---

Perform a review of visual view module(s) under `src/visuals/views/` (identified by `spec.ts`, `checklist.md`, and `view.tsx`). The goal is to enforce visual rendering quality, layout spec separation of concerns, physical capacity rejection boundaries, and 100% seed-derived determinism.

## Scope Resolution
- **Specific Leaf Module**: If `{viewName}` matches a specific leaf view module (e.g., `/review-view operations-vertical`), restrict review to that module.
- **Parent Category**: If `{viewName}` matches a category directory (e.g., `/review-view operations`), review all leaf modules under that category.
- **Macro Review (All Modules)**: If `{viewName}` is omitted (e.g., `/review-view`), discover and review all view modules across `src/visuals/views/`.
- **Aspect Filter (`--file`)**: Optionally restrict focus to a single aspect across the selected scope.

---

## Audit Guidelines (Single Source of Truth)

The reference library under `docs/` is authoritative. Load the references for the aspects in scope and work through their **Audit** sections in order.

| `--file` | File under review | Load                                                      |
|----------|-------------------|-----------------------------------------------------------|
| `spec`      | `spec.ts`      | `docs/spec-general.md` + `docs/spec-view.md`              |
| `checklist` | `checklist.md` | `docs/checklist-general.md` + `docs/checklist-view.md`    |
| `code`      | `view.tsx`     | `docs/implementation-general.md` + `docs/implementation-view.md` |

Without `--file`, review all three aspects.

**Reporting**: every finding must cite the rule ID it violates (e.g. `SPEC-V3`, `CHK-V4`, `IMPL-V6`). If something looks wrong but violates no rule, report it as an observation and say so — do not invent a rule ID.

**Keep edits minimal**: do not rewrite, restructure, or remove anything that already complies. Only touch what actually violates a rule.

**Two failure modes dominate in this codebase** — check them explicitly on every view:
- `CHK-V4`: a leaf checklist rule requiring prompt/instruction text without scoping it to Question Mode.
- `IMPL-V6`: visual randomness not derived from `payload.seed`.

---

## Automated Verification Tools

Run automated audits and unit tests to complete the review:
- **Spec Overlap & Parameterization Check** (covers `SPEC-7`, `SPEC-8`, and redundant ancestor declarations):
  ```bash
  npm run check:generator-view-specs
  ```
- **Vitest Unit Tests**:
  ```bash
  npm run test -- src/visuals/views/[<category>/]{viewName}/
  ```
