---
name: update-view
description: "/update-view {viewName} - Update the visual view module under src/visuals/views/[<category>/]{viewName} to match its spec, adopt producing generators, and validate."
---

Update the visual view module under `src/visuals/views/[<category>/]{viewName}` (identified by containing `spec.ts`, `checklist.md`, and `view.tsx`) as follows:

1. **Review Module Integrity**:
   - Audit module structure, `spec.ts`, `checklist.md`, and `view.tsx` by invoking `/review-view {viewName}`.
   - Core requirements: `docs/implementation-general.md` + `docs/implementation-view.md`.

2. **Producing Generator Alignment**:
   - If the view needs payload data it does not have, follow `IMPL-V8` in `docs/implementation-view.md`: run `npm run show:matching -- --spec=<real-standard>` to find actual producing generators and inspect rejection reasons, then adopt each matched generator to supply the required fields. Use `--spec=test` only for the isolated smoke path and `--raw` only for source-definition diagnosis. Never derive the missing mathematics inside the view.

3. **Validation Workflow**:
   - Follow the targeted debugging & fast-iteration workflows documented in `DOCS.md § 6` (Efficient Development & Debugging Iteration):
     - **Real Target Debugging**: `npm run test:target -- --target=<target.id> --spec=<real-standard> --render`
     - **Real Sample Debugging**: `npm run test:sample -- --sample="<sample_key>" --spec=<real-standard>`
     - **Fast Scoped Regeneration**: `npm run generate:dataset -- --spec=test --generator=<generator> --view=<viewName> [--training-only]`
     - **VQA Validation**: `npm run validate:dataset -- --view=<viewName> --spec=test`
     - **Cache Churn Check**: `npm run report:churn -- --spec=test`
     - **Vitest Unit Tests**: `npm run test`

   The `test` spec commands are the fast prototype/smoke/regression loop. Final matching
   and generation evidence must come from the real standard target.

IMPORTANT:
- Do NOT update code outside views, generators, and the "test" spec without user confirmation.
- Do NOT modify `spec.ts` without user confirmation.
