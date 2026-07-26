---
name: update-view
description: "/update-view {viewName} - Update the visual view module under src/visuals/views/[<category>/]{viewName} to match its spec, adopt producing generators, and validate."
---

Update the visual view module under `src/visuals/views/[<category>/]{viewName}` (identified by containing `spec.ts`, `checklist.md`, and `view.tsx`) as follows: 

1. **Review Module Integrity**:
   - Run `/review-view {viewName}` to audit `spec.ts`, `checklist.md`, and `view.tsx` against core EduGraph rules.
   - Consider `spec.ts` as the source of truth for intended layout behavior.
   - Ensure strict payload validation: `view.tsx` must call `validateProblemData` from `../../../helpers/validation.ts` at the beginning of the component and throw `ViewValidationError` on missing fields or visual bounds overflow.
   - Ensure zero local silent fallbacks (e.g. `data.shape || 'circle'`).
   - Ensure 100% seed-derived determinism: derive ALL visual decisions exclusively from `payload.seed` (no `Math.random()`, unseeded RNG, or `problem.id` reading).
   - Physical space capacity boundaries must be declared in `spec.ts` `rejectedLabels` (using `...deductAdmitting(...)`).

2. **Producing Generator Alignment**:
   - If the interface for the problem payload needed to be changed or extended:
     - Run `npm run show:matching -- --spec=test` (or `--spec=ccss`) to find which generators match and produce content for this view.
     - Adopt matched generators to supply required problem data fields.

3. **Validation Workflow**:
   - Review/update `src/spec/test` if needed to ensure generation examples exist (`export const spec: CompetencyTarget[] = [...]`).
   - Ensure Vite dev server is running (`npm run dev`).
   - **Isolated Target Debugging**: `npm run test:target -- --target=<target.id> --spec=test --render` reports matching, generates sample data, and writes rendered images to `out/target-test/`.
   - **Isolated Sample Debugging**: If a specific sample fails, `npm run test:sample -- --sample="<sample_key>" --spec=test` replays and re-validates that exact sample live.
   - **Fast Scoped Regeneration**: Run `npm run generate:dataset -- --spec=test --generator=<generator> --view=<viewName> [--training-only]` to quickly generate dataset samples for affected modules.
   - **VQA Validation**: Run `npm run validate:dataset -- --view=<viewName> --dataset=test`.
   - **Cache Churn Check**: Run `npm run report:churn -- --dataset=test` to verify zero unintended churn in unrelated modules.
   - Run `npm run test` for vitest unit tests.

IMPORTANT:
- Do NOT update code outside views, generators and the "test" spec without user confirmation.
- Do NOT modify `spec.ts` without user confirmation.
