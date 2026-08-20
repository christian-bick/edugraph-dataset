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
| `checklist` | `checklist.md` | `docs/checklist-view.md`                                  |
| `code`      | `view.tsx`     | `docs/implementation-general.md` + `docs/implementation-view.md` |

Without `--file`, review all three aspects.

**Reporting**: every finding must cite the rule ID it violates (e.g. `SPEC-V3`, `CHK-V6`, `IMPL-V6`). If something looks wrong but violates no rule, report it as an observation and say so — do not invent a rule ID.

**Keep edits minimal**: do not rewrite, restructure, or remove anything that already complies. Only touch what actually violates a rule.

Check these explicitly on every view:
- `CHK-V6`: the central checklist is loaded once, every leaf has exactly one heading-free checklist with concise **Identity** and **Modes** criteria, and every extra sentence is observable and passes the removal question. There are no category or generator checklists.
- `SPEC-V5`: every Ability in `generalLabels` is elicited by the rendered task, and every Ability remains absent from `requiredLabels` and `rejectedLabels`.
- `SPEC-V6` / `IMPL-V9`: an Ability that changes learner action or task identity is an invariant leaf view; related leaves share parent-level rendering code rather than branching on labels inside one view.
- `SPEC-V7`: every `requiredLabel` is a generator-established Area/Scope applicability condition, not a capability supplied or rejected by the view.
- `SPEC-11`: a view never specializes a compatible generator Area; contextual refinement within that Area is a Scope, while a view-owned Area must be an independent knowledge domain.
- `IMPL-V11`: the projection preserves visible evidence for every generator-owned target label; names or assertions do not replace claimed objects, relations, laws, scales, or premises.
- Central label support: ontology-label evidence and verdict policy stay in the central checklist, not the leaf checklist or evaluator prompt.
- `IMPL-V6`: visual randomness is derived exclusively from `payload.seed`.

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
