---
name: implement-spec
description: "/implement-spec [{specModule}] - Autonomous orchestrator skill to work through implementationTodos step-by-step, delegating to /update-gen and /update-view, debugging failing samples, and verifying with VQA cache and churn reports."
---

Orchestrate implementing the target gaps in `implementationTodos` for a spec module (default `--spec=ccss`) to achieve 100% error-free problem generation and rendering.

---

### Step-by-Step Orchestrator Workflow:

#### Step 1: Inspect & Group `implementationTodos`
- Run the pre-approved npm script to list all pending implementation gaps:
  ```bash
  npm run show:imp-todos -- --spec=<specModule>
  ```
- Treat each authored `group` value as the stable implementation package. Work through groups in review order; do not regroup targets ad hoc unless the user approves changing their source `group` values.

#### Step 2: Determine Extension vs. Creation Strategy
For each target group, choose the cleanest implementation path per `IMPL-7` in `docs/implementation-general.md`: extend an existing generator, extend an existing view, and only create a new leaf module when doing so extends the supported ontological space.

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

#### Step 5: Fast Scoped Iteration Loop
Keep iteration loops fast (<5 seconds) during active development:
- Run Vitest unit tests: `npm run test`
- Run **scoped dataset generation**:
  ```bash
  npm run generate:dataset -- --spec=test --generator=<generator> --view=<view> [--training-only]
  ```
- At a VQA checkpoint, regenerate the scope canonically and run **scoped VQA validation**:
  ```bash
  npm run generate:dataset:container -- --spec=test --generator=<generator> --view=<view> [--training-only]
  npm run validate:dataset -- --spec=test --generator=<generator> --view=<view> 
  ```
  The command fails on any failing or uncached sample and writes its scoped report under `out/dataset-test/validation-reports/`.
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
  npm run generate:dataset:container -- --spec=<specModule> --generator=<generator> --view=<view>
  npm run validate:dataset -- --spec=<specModule> --generator=<generator> --view=<view>
  ```
- Once clean and verified, **promote completed targets from `implementationTodos` to `spec`** in `src/spec/<spec>/`, per the export contract in `docs/target-spec.md` (`TSPEC-1`, `TSPEC-7`).

#### Step 6: Final Full Dataset Validation Gate (Completion Gate)
Once ALL `implementationTodos` in the spec module are resolved and promoted to `spec`, execute the final full verification gate across the entire spec.

Every spec owns its dataset folder, so `--spec=<specModule>` is passed consistently to every script:
```bash
npm run generate:dataset:container -- --spec=<specModule>
npm run validate:dataset -- --spec=<specModule>
npm run audit:dataset -- --spec=<specModule>
npm run report:churn -- --spec=<specModule>
npm run report:splits -- --spec=<specModule>
npm run check -- --spec=<specModule>
npm run merge:dataset
```

`merge:dataset` rebuilds the union dataset at `out/dataset/` from every non-isolated standard. Skip it for an isolated spec such as `test` (`TSPEC-10` in `docs/target-spec.md`).
