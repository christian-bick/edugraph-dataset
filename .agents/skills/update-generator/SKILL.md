---
name: update-gen
description: "/update-gen {moduleName} - Update a generator module to match its spec, create or update its spec test, adopt consuming views, and validate."
---

Update the generator module under `src/generators/[<category>/]{moduleName}` (identified by containing `spec.ts` and `generator.ts`) as follows:

1. **Review Module Integrity**:
   - Audit module structure, `spec.ts`, `generator.ts`, and their tests by invoking `/review-gen {moduleName}`.
   - Core requirements: `docs/implementation-general.md` + `docs/implementation-generator.md`.

2. **Tests & Specifications**:
   - Add/update `generator.test.ts` and `spec.test.ts` per `IMPL-G5` in `docs/implementation-generator.md`.

3. **Ability Neutrality**:
   - Apply `SPEC-G3` and `IMPL-G8` to both declarations and data contracts. The generator exposes no preselected blank, unknown, prompt, hint, requested reasoning, or Ability-specific answer prose.
   - Preserve structured mathematical witnesses needed by consuming views. A canonical model retains every law, relation, object, scale, and intermediate step that proves generator-owned labels.
   - Apply `SPEC-11`: keep the invariant mathematical Area on the generator and express presentation-driven refinements through view-owned Scopes, never child Areas split across the boundary.

4. **Consuming View Alignment**:
   - If the returned problem payload contract needed modification, follow `IMPL-G6` in `docs/implementation-generator.md`: run `npm run show:matching -- --spec=<real-standard>` to find actual consuming views and inspect rejection reasons, then adopt each matched view to render the updated payload fields. Use `--spec=test` only for the isolated smoke path and `--raw` only for source-definition diagnosis.

5. **Validation Workflow**:
   - Follow the targeted debugging & fast-iteration workflows documented in `DOCS.md § 6` (Efficient Development & Debugging Iteration):
     - **Real Target Debugging**: `npm run test:target -- --target=<target.id> --spec=<real-standard> --render`
     - **Real Sample Debugging**: `npm run test:sample -- --sample="<sample_key>" --spec=<real-standard> --no-validate`
     - **Canonical Scoped Regeneration**: `npm run generate:dataset -- --spec=test --generator=<moduleName> --view=<viewName> [--training-only]`
     - **Real-standard VQA Regeneration**: `npm run generate:dataset -- --spec=<real-standard> --generator=<moduleName> --view=<viewName> [--training-only]`
     - **VQA Validation**: `npm run validate:dataset -- --spec=<real-standard> --generator=<moduleName>`
     - **Cache Churn Check**: `npm run report:churn -- --spec=<real-standard>`
     - **Vitest Unit Tests**: `npm run test`

IMPORTANT:
- Do NOT update code outside views, generators, and the "test" spec without user confirmation.
- Do NOT modify `spec.ts` without user confirmation.
