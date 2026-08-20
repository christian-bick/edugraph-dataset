---
name: update-view
description: "/update-view {viewName} - Update a visual view module to match its spec, adopt producing generators, and validate."
---

Update the visual view module under `src/visuals/views/[<category>/]{viewName}` (identified by containing `spec.ts`, `checklist.md`, and `view.tsx`) as follows:

1. **Review Module Integrity**:
   - Audit module structure, `spec.ts`, `checklist.md`, and `view.tsx` by invoking `/review-view {viewName}`.
   - Core requirements: `docs/implementation-general.md` + `docs/implementation-view.md`.
   - VQA loads the central checklist plus exactly this leaf checklist. Keep the leaf heading-free and concise, with **Identity** and **Modes** criteria; do not create generator/category checklists or move central label policy into the leaf (`CHK-V6`).

2. **Task Identity and Evidence**:
   - When an Ability changes the observable learner action, apply `SPEC-V6`: create or use a separate leaf view with that Ability invariant in `generalLabels`. Keep reusable rendering code and tests in the parent category (`IMPL-V9`); the shared renderer receives a fixed task mode and never parses ontology labels.
   - Use `requiredLabels` only to scope a leaf to generator-established Area/Scope context (`SPEC-V7`). It does not provide those labels and is not a substitute for a narrower payload type.
   - Apply `IMPL-V11` to the complete matched claim. Preserve payload evidence for generator-owned labels while making the leaf Ability observable; do not reduce physical objects, mathematical laws, scales, or premises to unsupported names or assertions.
   - Apply `SPEC-11`: do not specialize a compatible generator Area. Use Scope for presentation, representation, evidence-source, or other contextual refinement within the same knowledge domain; claim an Area only when the task contributes an independent domain.

3. **Producing Generator Alignment**:
   - If the view needs payload data it does not have, follow `IMPL-V8` in `docs/implementation-view.md`: run `npm run show:matching -- --spec=<real-standard>` to find actual producing generators and inspect rejection reasons, then adopt each matched generator to supply the required fields. Use `--spec=test` only for the isolated smoke path and `--raw` only for source-definition diagnosis. Never derive the missing mathematics inside the view.

4. **Validation Workflow**:
   - Follow the targeted debugging & fast-iteration workflows documented in `DOCS.md § 6` (Efficient Development & Debugging Iteration):
     - **Real Target Debugging**: `npm run test:target -- --target=<target.id> --spec=<real-standard> --render`
     - **Real Sample Debugging**: `npm run test:sample -- --sample="<sample_key>" --spec=<real-standard> --no-validate`
     - **Canonical Scoped Regeneration**: `npm run generate:dataset -- --spec=test --generator=<generator> --view=<viewName> [--training-only]`
     - **Real-standard VQA Regeneration**: `npm run generate:dataset -- --spec=<real-standard> --generator=<generator> --view=<viewName> [--training-only]`
     - **VQA Validation**: `npm run validate:dataset --  --spec=<real-standard> --view=<viewName>`
     - **Cache Churn Check**: `npm run report:churn -- --spec=<real-standard>`
     - **Vitest Unit Tests**: `npm run test`

IMPORTANT:
- Do NOT update code outside views, generators, and the "test" spec without user confirmation.
- Do NOT modify `spec.ts` without user confirmation.
