---
name: update-gen
description: "/update-gen {moduleName} - Update the generator module under src/generators/[<category>/]{moduleName} to match its spec, create/update its spec.test.ts, adopt consuming views, and validate."
---

Update the generator module under `src/generators/[<category>/]{moduleName}` (identified by containing `spec.ts`, `checklist.md`, and `generator.ts`) as follows:

1. **Review Module Integrity**:
   - Audit module structure, `spec.ts`, `checklist.md`, and `generator.ts` by invoking `/review-gen {moduleName}`.
   - Core requirements: `docs/implementation-general.md` + `docs/implementation-generator.md`.

2. **Tests & Specifications**:
   - Add/update `generator.test.ts` and `spec.test.ts` per `IMPL-G5` in `docs/implementation-generator.md`.

3. **Consuming View Alignment**:
   - If the returned problem payload contract needed modification, follow `IMPL-G6` in `docs/implementation-generator.md`: run `npm run show:matching -- --spec=<real-standard>` to find actual consuming views and inspect rejection reasons, then adopt each matched view to render the updated payload fields. Use `--spec=test` only for the isolated smoke path and `--raw` only for source-definition diagnosis.

4. **Validation Workflow**:
   - Follow the targeted debugging & fast-iteration workflows documented in `DOCS.md § 6` (Efficient Development & Debugging Iteration):
     - **Real Target Debugging**: `npm run test:target -- --target=<target.id> --spec=<real-standard> --render`
     - **Real Sample Debugging**: `npm run test:sample -- --sample="<sample_key>" --spec=<real-standard>`
     - **Fast Scoped Regeneration**: `npm run generate:dataset -- --spec=test --generator=<moduleName> --view=<viewName> [--training-only]`
     - **VQA Validation**: `npm run validate:dataset -- --generator=<moduleName> --spec=test`
     - **Cache Churn Check**: `npm run report:churn -- --spec=test`
     - **Vitest Unit Tests**: `npm run test`

   The `test` spec commands are the fast prototype/smoke/regression loop. Final matching
   and generation evidence must come from the real standard target.

IMPORTANT:
- Do NOT update code outside views, generators, and the "test" spec without user confirmation.
- Do NOT modify `spec.ts` without user confirmation.
