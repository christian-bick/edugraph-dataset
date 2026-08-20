---
name: implement-spec
description: "/implement-spec [{specModule}] - Autonomous orchestrator skill to work through implementationTodos step-by-step, delegating to /update-gen and /update-view, debugging failing samples, and verifying with VQA cache and churn reports."
---

Orchestrate implementing the target gaps in `implementationTodos` for a spec module (default `--spec=ccss`) to achieve 100% error-free problem generation and rendering.

---

### Autonomy, Stop, and Continuation Contract

Work through reviewed implementation definitions one-by-one. Proceed autonomously through
reversible implementation choices, tests, canonical scoped generation, approved target VQA,
commits, and transition to the next todo.

Stop and request user direction when:

- the implementation requires a new or changed ontology entity, relation, constraint, or definition;
- the standard or authored implementation definition is genuinely semantically ambiguous;
- the required change falls outside the current implementation todo;
- repository drift invalidates the reviewed ownership or `reuse`/`expand`/`new` strategy;
- validation evidence suggests changing a production target, module declaration, or VQA contract
  rather than fixing the planned implementation.

Do not stop for ordinary module structure, payload naming, test design, bounded rendering
choices, or other reversible decisions already governed by the repository references. When a
todo completes smoothly, create its commits, record their hashes and any autonomous decisions,
compact the working context, and continue directly to the next definition.

### Step-by-Step Orchestrator Workflow:

#### Step 1: Inspect `implementationTodos`
- Run the pre-approved npm script to list all pending implementation gaps:
  ```bash
  npm run show:imp-todos -- --spec=<specModule>
  ```
- Treat each referenced implementation definition as the stable package. Work through
  definitions in review order and preserve their authored module strategies. Do not regroup
  targets or replace ownership decisions without evidence and user approval.

#### Step 2: Execute the Reviewed Module Strategies
For each implementation definition, use its generator and view roles directly: `reuse` needs
no module change, `expand` updates the named existing module, and `new` creates the named
module. Verify the plan still satisfies `IMPL-7` in `docs/implementation-general.md`; if the
repository has changed enough to invalidate it, stop and request approval before changing the
authored implementation definition.

Before generator and view work diverges, establish and typecheck any new or materially changed
shared problem type, discriminant, invariants, and `ViewTypeMap` entry (`IMPL-8`). Only then
may the two role implementations proceed independently.

Keep the shared payload Ability-neutral while preserving the structured evidence for its Area
and Scope claims (`IMPL-G8`). If different Abilities change the observable learner action, use
separate leaf views with parent-level shared rendering code (`SPEC-V6`, `IMPL-V9`). Each leaf
must preserve the complete matched claim (`IMPL-V11`); use `requiredLabels` only for
generator-established Area/Scope applicability (`SPEC-V7`).

#### Step 3: Delegate Module-Level Tasks & Reviews
Delegate component updates and audits to specialized skills:
- For generator work $\rightarrow$ Invoke `/update-gen {moduleName}`
- For view work $\rightarrow$ Invoke `/update-view {viewName}`
- For module review $\rightarrow$ Invoke `/review-gen {moduleName}` or `/review-view {viewName}`

#### Step 4: Targeted Debugging & Error Resolution
Refer to `DOCS.md § 6` (Efficient Development & Debugging Iteration) for targeted debugging workflows:
- **Target Matching & Output Inspection**:
  ```bash
  npm run test:target -- --target=<targetId> --spec=<specModule> --render
  ```
- **Single-Sample Replay & VQA Debugging**:
  ```bash
  npm run test:sample -- --sample="<sampleKey>" --spec=<specModule> --no-validate
  ```

Use the isolated `test` spec only for deliberately authored prototypes, smoke paths,
and retained regressions. Add `--raw` to `test:target` only when inspecting source
definitions before production overlap deduplication.

#### Step 5: Canonical Scoped Iteration Loop
Keep iteration scoped during active development; every dataset render is canonical and starts
its own isolated renderer in Docker:
- Run Vitest unit tests: `npm run test`
- Run **scoped dataset generation**:
  ```bash
  npm run generate:dataset -- --spec=test --generator=<generator> --view=<view> [--training-only]
  ```
- At a VQA checkpoint, run **scoped VQA validation** against that canonical output:
  ```bash
  npm run validate:dataset -- --spec=test --generator=<generator> --view=<view> 
  ```
  The command fails on any failing or uncached sample and prints the path of a new timestamped
  report under `temp/validation-reports/dataset-test/`.
- Run **cache churn report**:
  ```bash
  npm run report:churn -- --spec=test
  ```
  *(Verify zero unexpected image churn in unrelated modules).*
- Treat this `test` run as a fast smoke loop. Before promotion, inspect and generate the
  actual target with `--spec=<specModule>`; the test spec is not evidence that the real
  standard matches correctly or that its production labels are visually defendable
  (`TSPEC-13`):
  ```bash
  npm run generate:dataset -- --spec=<specModule> --generator=<generator> --view=<view>
  npm run validate:dataset -- --spec=<specModule> --generator=<generator> --view=<view>
  ```
- Once clean and verified, **promote completed targets from `implementationTodos` to `spec`** in `src/spec/<spec>/`, per the export contract in `docs/target-spec.md` (`TSPEC-1`, `TSPEC-7`).

#### Step 6: Commit the Completed Todo and Continue

After scoped tests, canonical generation, real-standard VQA, churn review, and target promotion
all pass:

1. Inspect the diff and create an **implementation commit** containing the source, target,
   test, checklist, or documentation changes for this todo. Exclude
   `cache/vqa-validation/**`.
2. If VQA records changed, inspect them and create a separate **VQA cache commit** containing
   only the intended cache files. Never mix cache records into the implementation commit.
3. Record both commit hashes, the completed todo id, verification totals, and autonomous
   decisions in the working handoff/plan.
4. Compact context and continue to the next reviewed implementation definition without asking
   for confirmation when no stop condition applies.

#### Step 7: Final Full Dataset Validation Gate (Completion Gate)
Once ALL `implementationTodos` in the spec module are resolved and promoted to `spec`, execute the final full verification gate across the entire spec.

Every spec owns its dataset folder, so `--spec=<specModule>` is passed consistently to every script:
```bash
npm run generate:dataset -- --spec=<specModule>
npm run validate:dataset -- --spec=<specModule>
npm run audit:dataset -- --spec=<specModule>
npm run report:churn -- --spec=<specModule>
npm run report:splits -- --spec=<specModule>
npm run check -- --spec=<specModule>
npm run merge:dataset
```

`merge:dataset` rebuilds the union dataset at `out/dataset/` from every non-isolated standard. Skip it for an isolated spec such as `test` (`TSPEC-10` in `docs/target-spec.md`).
