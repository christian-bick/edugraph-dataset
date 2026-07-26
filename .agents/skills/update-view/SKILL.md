---
name: update-view
description: "/update-view {viewName} - Update the visual view module under src/visuals/views/[<category>/]{viewName} to match its spec, adopt producing generators, and validate."
---

Update the visual view module under `src/visuals/views/[<category>/]{viewName}` (identified by containing `spec.ts`, `checklist.md`, and `view.tsx`) as follows:

1. **Review Module Integrity**:
   - Audit module structure, `spec.ts`, `checklist.md`, and `view.tsx` by invoking `/review-view {viewName}`.
   - Refer to `DOCS.md § 4` (Module Structure Breakdown) for core visual view requirements.

2. **Producing Generator Alignment**:
   - If the problem payload contract needed modification:
     - Run `npm run show:matching -- --spec=test` (or `--spec=ccss`) to find producing generators and inspect rejection reasons.
     - Adopt matched generators to supply required problem data fields.

3. **Validation Workflow**:
   - Follow the targeted debugging & fast-iteration workflows documented in `DOCS.md § 6` (Efficient Development & Debugging Iteration):
     - **Isolated Target Debugging**: `npm run test:target -- --target=<target.id> --spec=test --render`
     - **Isolated Sample Debugging**: `npm run test:sample -- --sample="<sample_key>" --spec=test`
     - **Fast Scoped Regeneration**: `npm run generate:dataset -- --spec=test --generator=<generator> --view=<viewName> [--training-only]`
     - **VQA Validation**: `npm run validate:dataset -- --view=<viewName> --dataset=test`
     - **Cache Churn Check**: `npm run report:churn -- --dataset=test`
     - **Vitest Unit Tests**: `npm run test`

IMPORTANT:
- Do NOT update code outside views, generators, and the "test" spec without user confirmation.
- Do NOT modify `spec.ts` without user confirmation.
