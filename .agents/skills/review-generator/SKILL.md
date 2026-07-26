---
name: review-gen
description: "/review-gen [{moduleName}] [--file=spec|checklist|code] - Unified review of generator module(s) under src/generators/ against the EduGraph reference library."
---

Perform a review of generator module(s) under `src/generators/` (identified by `spec.ts`, `checklist.md`, and `generator.ts`). The goal is to enforce mathematical correctness, ontology spec separation of concerns, and robust configuration validation.

## Scope Resolution
- **Specific Leaf Module**: If `{moduleName}` matches a specific leaf module (e.g., `/review-gen arithmetic-ops-pairs`), restrict review to that module.
- **Parent Category**: If `{moduleName}` matches a category directory (e.g., `/review-gen arithmetic`), review all leaf modules under that category.
- **Macro Review (All Modules)**: If `{moduleName}` is omitted (e.g., `/review-gen`), discover and review all generator modules across `src/generators/`.
- **Aspect Filter (`--file`)**: Optionally restrict focus to a single aspect across the selected scope.

---

## Audit Guidelines (Single Source of Truth)

The reference library under `docs/` is authoritative. Load the references for the aspects in scope and work through their **Audit** sections in order.

| `--file` | File under review | Load                                                          |
|----------|-------------------|---------------------------------------------------------------|
| `spec`      | `spec.ts`      | `docs/spec-general.md` + `docs/spec-generator.md`             |
| `checklist` | `checklist.md` | `docs/checklist-general.md` + `docs/checklist-generator.md`   |
| `code`      | `generator.ts` | `docs/implementation-general.md` + `docs/implementation-generator.md` |

Without `--file`, review all three aspects.

**Reporting**: every finding must cite the rule ID it violates (e.g. `SPEC-G2`, `CHK-2`, `IMPL-G3`). If something looks wrong but violates no rule, report it as an observation and say so — do not invent a rule ID.

**Keep edits minimal**: do not rewrite, restructure, or remove anything that already complies. Only touch what actually violates a rule.

---

## Automated Verification Tools

Run automated audits and unit tests to complete the review:
- **Spec Overlap & Parameterization Check** (covers `SPEC-7`, `SPEC-8`, and redundant ancestor declarations):
  ```bash
  npm run check:generator-view-specs
  ```
- **Vitest Unit Tests**:
  ```bash
  npm run test -- src/generators/[<category>/]{moduleName}/
  ```
