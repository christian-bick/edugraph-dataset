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
- Analyze the output. **Merge logically related implementation TODOs** (e.g. multiple targets needing the same generator extension or view arrangement) so they are tackled efficiently together.

#### Step 2: Determine Extension vs. Creation Strategy
For each target group, evaluate the cleanest implementation path adhering to `DOCS.md § 4` (Module Structure Breakdown):
- **Extend existing generator**: Keep problem payload contracts stable where possible. Add parameters to `spec.ts` schema and handling in `generator.ts`.
- **Extend existing view**: Keep existing renderings stable where possible. Add layout properties to `spec.ts` schema and `view.tsx`. Declare physical capacity limits in `spec.ts` `rejectedLabels` (using `...deductAdmitting(...)`).
- **Create new generator or view**: Create a new leaf module under `src/generators/[<category>/]<module>` or `src/visuals/views/[<category>/]<module>` **ONLY when extending the supported ontological space**.

#### Step 3: Delegate Module-Level Tasks & Reviews
Delegate component updates and audits to specialized skills:
- For generator work $\rightarrow$ Invoke `/update-gen {moduleName}`
- For view work $\rightarrow$ Invoke `/update-view {viewName}`
- For module review $\rightarrow$ Invoke `/review-gen {moduleName}` or `/review-view {viewName}`

#### Step 4: Isolated Debugging & Error Resolution
Refer to `DOCS.md § 6` (Efficient Development & Debugging Iteration) for isolated debugging workflows:
- **Target Matching & Output Inspection**:
  ```bash
  npm run test:target -- --target=<targetId> --spec=test --render
  ```
- **Single-Sample Replay & VQA Debugging**:
  ```bash
  npm run test:sample -- --sample="<sampleKey>" --spec=test
  ```

#### Step 5: Fast Scoped Iteration Loop
Keep iteration loops fast (<5 seconds) during active development:
- Run Vitest unit tests: `npm run test`
- Run **scoped dataset generation**:
  ```bash
  npm run generate:dataset -- --spec=test --generator=<generator> --view=<view> [--training-only]
  ```
- Run **scoped VQA validation**:
  ```bash
  npm run validate:dataset -- --generator=<generator> --view=<view> --dataset=test
  ```
- Run **cache churn report**:
  ```bash
  npm run report:churn -- --dataset=test
  ```
  *(Verify zero unexpected image churn in unrelated modules).*
- Once clean and verified, **promote completed targets from `implementationTodos` to `spec`** in `src/spec/<spec>/`.

#### Step 6: Final Full Dataset Validation Gate (Completion Gate)
Once ALL `implementationTodos` in the spec module are resolved and promoted to `spec`, execute the final full verification gate across the entire spec:
1. Regenerate full spec dataset:
   ```bash
   npm run generate:dataset -- --spec=<specModule>
   ```
2. Run full VQA validation (leveraging the VQA cache):
   ```bash
   npm run validate:dataset -- --spec=<specModule>
   ```
3. Run full VQA cache churn report:
   ```bash
   npm run report:churn -- --dataset=<specModule>
   ```
4. Run full repository checks:
   ```bash
   npm run check -- --spec=<specModule>
   ```
