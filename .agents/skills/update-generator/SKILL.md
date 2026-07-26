---
name: update-gen
description: "/update-gen {moduleName} - Update the generator module under src/generators/[<category>/]{moduleName} to match its spec, create/update its spec.test.ts, adopt consuming views, and validate."
---

Update the generator module under `src/generators/[<category>/]{moduleName}` (identified by containing `spec.ts`, `checklist.md`, and `generator.ts`) as follows: 

1. **Review Module Integrity**:
   - Run `/review-gen {moduleName}` to audit `spec.ts`, `checklist.md`, and `generator.ts` against core EduGraph rules.
   - Consider `spec.ts` as the source of truth for intended mathematical behavior.
   - Ensure strict configuration validation: `generator.ts` must call `validateConfigFields` from `../../../lib/errors.ts` at the beginning of `generate(config)` and throw a `GeneratorValidationError` on invalid/missing configs (zero silent local fallbacks).
   - Ensure runtime mathematical choices are returned in `ProblemStub.tags`.

2. **Tests & Specifications**:
   - Add/update `spec.test.ts` making use of `generateWithLabels` from `utils.ts`.
   - Update `generator.test.ts` to cover mathematical edge cases (e.g. division by zero, invalid target ranges, non-negative constraints) and verify that empty config throws `GeneratorValidationError`.

3. **Consuming View Alignment**:
   - If the interface for the generated problem needed to be changed or extended:
     - Run `npm run show:matching -- --spec=test` (or `--spec=ccss`) to find which views match and consume this generator's problems, including rejection reasons for near-misses.
     - Adopt matched views to properly render these problem data fields.

4. **Validation Workflow**:
   - Review/update `src/spec/test` if needed to ensure generation examples exist (`export const spec: CompetencyTarget[] = [...]`).
   - Ensure Vite dev server is running (`npm run dev`).
   - **Isolated Target Debugging**: `npm run test:target -- --target=<target.id> --spec=test --render` reports matching, generates sample data, and writes rendered images to `out/target-test/`.
   - **Isolated Sample Debugging**: If a specific sample fails, `npm run test:sample -- --sample="<sample_key>" --spec=test` replays and re-validates that exact sample live.
   - **Fast Scoped Regeneration**: Run `npm run generate:dataset -- --spec=test --generator=<moduleName> --view=<viewName> [--training-only]` to quickly generate dataset samples for affected modules.
   - **VQA Validation**: Run `npm run validate:dataset -- --generator=<moduleName> --dataset=test`.
   - **Cache Churn Check**: Run `npm run report:churn -- --dataset=test` to verify zero unintended churn in unrelated modules.
   - Run `npm run test` for vitest unit tests.

IMPORTANT:
- Do NOT update code outside views, generators and the "test" spec without user confirmation.
- Do NOT modify `spec.ts` without user confirmation.
