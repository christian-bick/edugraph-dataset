---
name: update-gen
description: "/update-gen {moduleName} - Update the generator module under src/generators/[<category>/]{moduleName} to match its spec, create/update its spec.test.ts, adopt consuming views, and validate."
---

Update the generator module under `src/generators/[<category>/]{moduleName}` (identified by containing `spec.ts`, `checklist.md`, and `generator.ts`) as follows:

1. **Review Module Integrity**:
   - Audit module structure, `spec.ts`, `checklist.md`, and `generator.ts` by invoking `/review-gen {moduleName}`.
   - Refer to `DOCS.md § 4` (Module Structure Breakdown) for core generator requirements.

2. **Tests & Specifications**:
   - Add/update `spec.test.ts` using `generateWithLabels` from `utils.ts`.
   - Update `generator.test.ts` to cover mathematical edge cases and verify that empty config throws `GeneratorValidationError`.

3. **Consuming View Alignment**:
   - If the returned problem payload contract needed modification:
     - Run `npm run show:matching -- --spec=test` (or `--spec=ccss`) to find consuming views and inspect rejection reasons.
     - Adopt matched views to properly render updated payload fields.

4. **Validation Workflow**:
   - Follow the targeted debugging & fast-iteration workflows documented in `DOCS.md § 6` (Efficient Development & Debugging Iteration):
     - **Isolated Target Debugging**: `npm run test:target -- --target=<target.id> --spec=test --render`
     - **Isolated Sample Debugging**: `npm run test:sample -- --sample="<sample_key>" --spec=test`
     - **Fast Scoped Regeneration**: `npm run generate:dataset -- --spec=test --generator=<moduleName> --view=<viewName> [--training-only]`
     - **VQA Validation**: `npm run validate:dataset -- --generator=<moduleName> --dataset=test`
     - **Cache Churn Check**: `npm run report:churn -- --dataset=test`
     - **Vitest Unit Tests**: `npm run test`

IMPORTANT:
- Do NOT update code outside views, generators, and the "test" spec without user confirmation.
- Do NOT modify `spec.ts` without user confirmation.
