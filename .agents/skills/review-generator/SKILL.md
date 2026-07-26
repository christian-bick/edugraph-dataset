---
name: review-gen
description: "/review-gen {moduleName} - Unified review of a generator module (spec.ts, checklist.md, and generator.ts) under src/generators/[<category>/]{moduleName} against standard EduGraph rules."
---

Review the generator module under `src/generators/[<category>/]{moduleName}` (identified by containing `spec.ts`, `checklist.md`, and `generator.ts`). The goal is to enforce mathematical correctness, ontology spec separation of concerns, and robust configuration validation.

If `{moduleName}` is omitted, discover all generator modules across `src/generators/` and ask the user which module to review or review the specified target.

Validate the module against the following straightforward checklist across its three component files:

---

### 1. `spec.ts` Audit (Pedagogical Bridge)
- **Pure Abstract Math Schemas**: Must define *only* abstract mathematical parameters (e.g. `range`, `includeZero`, `allowNegatives`, `useDecimals`, `attribute`, `relation`). Must contain **zero** visual presentation flags (no `isReverse`, `layoutStyle`, `themeColor`, etc.).
- **Matching Direction (Leaf Nodes)**: Must declare the most specific ontology label (`edugraph-ts` `Area`, `Scope`) that is a *true claim* about the generator's mathematical output. Never declare ancestor/parent labels of a label already declared (redundant), and never claim broader capabilities than the module truly produces.
- **Resolver Reusability**: All general resolvers (e.g. `hasLabel`, `selectExactMatch`, `resolveRangeFromLabels`) must be imported from `src/lib/resolvers.ts`. Do not define curried or ad-hoc resolvers inline. Pass resolver references/factory outputs to schema arrays without executing them prematurely.
- **No Overlap with `generalLabels`**: Parameters checked inside `schema` must have zero overlap with `generalLabels` (including taxonomic ancestors via `partOf`).
- **Simple Arrays for Parameter Values**: Prefer simple arrays (e.g. `[Scope.LinearArrangement, Scope.CircularArrangement]`) over resolvers when listing compatible discrete labels.

---

### 2. `checklist.md` Audit (Abstract Math Criteria)
- **Pure Abstract Math Criteria**: Must specify *only* mathematical logic, bounds, and tag output constraints. Must contain **zero** visual layout, CSS, rendering, shape styling, coordinate, or DOM interaction criteria.
- **Hierarchical Scoping (No Duplication)**: Check root (`src/generators/checklist.md`) and parent category `checklist.md` before adding rules. Do NOT restate rules already covered at parent or root levels.
- **Unaware of Parameterization**: Phrased as observable mathematical properties without conditioning on internal config flags (e.g. "The generated numbers must fall strictly within the specified range").
- **Concise & Principle-Based**: High-level verifiable principles only; avoid concrete leaf examples in root/category checklists.

---

### 3. `generator.ts` Audit (Math Engine)
- **Strict Configuration Validation**: Must import `validateConfigFields` from `../../../lib/errors.ts` (matching sub-directory depth) and call it at the very top of `generate(config)`. Must throw a `GeneratorValidationError` if required parameters are missing or empty. No silent local fallbacks.
- **Ontology Tag Propagation**: Any runtime mathematical choices (e.g. specific shape chosen, relation chosen) must be returned in the `tags` array of `ProblemStub` so they are captured in metadata. Do NOT duplicate tags already captured in `consumedLabels` from configuration parameters.
- **No Label Parsing**: Generator logic must consume strongly-typed `config` parameters directly; it must contain zero raw label parsing or string matching.

---

### Automated Validation Script
Run the automated spec audit tool to catch overlapping or duplicate parameterizations:
```bash
npm run check:generator-view-specs
```
And run vitest unit tests:
```bash
npm run test -- src/generators/[<category>/]{moduleName}/
```
