---
name: fix-spec
description: "/fix-spec [{specModule}] [--generator=X] [--view=Y] - Autonomous orchestrator skill to drive an existing spec module to zero failures: collects generation, VQA and determinism failures, triages each to its owning file, fixes via /update-gen and /update-view, and verifies with scoped regeneration and churn reports."
---

Orchestrate resolving **existing failures** in a spec module (default `--spec=ccss`) until generation, rendering and Visual QA are clean.

This is the debugging half of `/implement-spec`, run standalone. It assumes the targets already match a generator and a view, and that what exists is broken rather than missing.

## Boundary (What This Skill Does Not Do)

Hand off to `/implement-spec` instead of proceeding when a failure turns out to need:
- a **new** generator or view module, or an extension of the supported ontological space (`IMPL-7` in `docs/implementation-general.md`);
- resolution of an entry in `implementationTodos`, or promotion of targets into `spec`.

**Never make a failure disappear by suppressing the match.** Do not weaken a declaration, add a convenient `rejectedLabels` entry, or edit a target merely so the sample stops being generated (`TSPEC-6`, `SPEC-V3`). An evidence-backed classification correction is legitimate when the ontology definition and rendered task show that the current claim is false and the replacement is the most specific directly observable claim (`SPEC-2`, `SPEC-V5`, `TSPEC-13`). Explain that evidence and obtain user confirmation before changing any view `spec.ts` or production target; update the aligned `test` target when one exists. A rejection boundary remains legitimate only when the view physically cannot render the case.

## Scope: One Standard at a Time

Every spec owns its dataset folder (`--spec=ccss` → `out/dataset-ccss/`), so fixing one standard never disturbs another. Pass `--spec=<specModule>` consistently to every script below; the union at `out/dataset/` is a build output of `npm run merge:dataset` and is never fixed directly.

Rebuild the union only after the standard is clean (Step 6).

---

### Step-by-Step Orchestrator Workflow:

#### Step 1: Collect the Failure Set

Gather all three failure sources before fixing anything, so related defects are batched:

1. **Matching & generation failures** — targets that match nothing, and generators that fail or hit `rejectedLabels` boundaries:
   ```bash
   npm run show:matching -- --spec=<specModule>
   ```
2. **Visual QA failures** — the `## Failure TODO List` in the timestamped report path printed by `validate:dataset` under `temp/validation-reports/dataset-<spec>/`. Each run creates a new report instead of overwriting prior evidence. Every entry carries its module/view, the reason, the failing checks, the full sample identity, and a ready-to-run **Retest** command. VQA applies the central checklist and exactly one leaf checklist; the central checklist owns task identifiability and ontology-label support. Do not edit evaluator instructions or response mechanics to fix content. Validation is a real gate: failures and uncached samples exit non-zero; use `--report-only` only when intentionally collecting diagnostics without gating:
   ```bash
   npm run validate:dataset -- --spec=<specModule> [--generator=X] [--view=Y]
   ```
3. **Determinism regressions** — identities whose image changed when they should not have:
   ```bash
   npm run report:churn -- --spec=<specModule>
   ```

#### Step 2: Triage Each Failure to Its Owning File

Decide *where* the defect lives before touching code. Assigning a failure to the wrong file is the main way fixing makes things worse.

| Symptom | Owning file | Rules |
|---|---|---|
| Wrong answer, out-of-bounds value, or generated mathematics contradicts the requested label | `generator.ts` | `IMPL-G4` |
| A necessary mathematical clue or datum is absent from the payload | `generator.ts` / payload contract | `IMPL-G4`, `IMPL-G6`, `IMPL-V8` |
| Necessary payload evidence exists but is omitted, obscured, or mislabeled in the image | `view.tsx` | `IMPL-V3`, `IMPL-V4` |
| Correct data renders with overlap, clipping, or `NaN`/`undefined` text | `view.tsx` | `IMPL-V3`, `IMPL-V4` |
| Answer visible in Question Mode, or layout differs between modes | `view.tsx` | `IMPL-V5` |
| The rendered task family does not elicit the declared ability | view `spec.ts` or production target | `SPEC-2`, `SPEC-V5`, `TSPEC-6`, `TSPEC-13`; confirm with user |
| Checklist demands something a correct view need not show | `checklist.md` | `CHK-V6` |
| `🖼️ image changed (same seed & attempt)` in an untouched module | `view.tsx` | `IMPL-V6`, `IMPL-V7` |
| `⚠️ seed changed for same identity` | seeding logic | escalate — must never happen |
| View error card in the rendered image (`ViewValidationError`) | payload mismatch | `IMPL-G6`, `IMPL-V8` |
| Target matches no generator/view at all | out of scope | hand off to `/implement-spec` |

**A VQA failure is not proof of a code bug.** Inspect the rendered image, ontology definition, generator payload, view spec, and production target together. Judge only evidence available in the image. Before changing a checklist, apply the `CHK-V6` removal question and confirm that the leaf criterion describes an essential observable view contract rather than duplicating the central checklist or a unit test.

Group the triaged failures by `(generator, view)` so one fix and one regeneration cycle covers every sample it affects.

#### Step 3: Reproduce in Isolation

Reproduce each representative failure before fixing it. Rendering requires `npm run dev` to be running.

- **Single-sample replay** — copy the `Retest` command straight from the report:
  ```bash
   npm run test:sample -- --sample="<sampleKey>" --spec=<specModule> --no-validate
  ```
- **Whole-target inspection** — matched tuples, rejection reasons, exact seeds/attempts/data, cache status, and rendered images:
  ```bash
  npm run test:target -- --target=<targetId> --spec=<specModule> --render
  ```

#### Step 4: Fix Through the Module Skills

Delegate the actual edit so the module's own review and validation workflow runs with it:
- Generator defect $\rightarrow$ `/update-gen {moduleName}`
- View or checklist defect $\rightarrow$ `/update-view {viewName}`
- Verification only $\rightarrow$ `/review-gen {moduleName}` or `/review-view {viewName}`

Add or extend a unit test covering the defect whenever it is expressible as one (`IMPL-G5`) — a math failure that unit tests could have caught should not be re-verified through the image pipeline.

#### Step 5: Re-verify Scoped

Keep the iteration loop cheap. **Batch all pixel-affecting changes before regenerating**: every regeneration plus validation cycle costs LLM calls for every changed image (see `DOCS.md § 6`).

```bash
npm run test
npm run generate:dataset -- --spec=<specModule> --generator=<generator> --view=<view>
npm run validate:dataset -- --spec=<specModule> --generator=<generator> --view=<view>
npm run report:churn -- --spec=<specModule>
```

Confirm the fixed samples now pass **and** that churn is confined to the modules you actually touched.

#### Step 6: Completion Gate

Once the failure set is empty, verify across the whole standard, then rebuild the union:
```bash
npm run generate:dataset -- --spec=<specModule>
npm run validate:dataset -- --spec=<specModule>
npm run audit:dataset -- --spec=<specModule>
npm run report:churn -- --spec=<specModule>
npm run report:splits -- --spec=<specModule>
npm run check -- --spec=<specModule>
npm run merge:dataset
```

Skip `merge:dataset` for an isolated spec such as `test`, which never enters the union.

#### Step 7: Report

Summarize for the user: how many failures were found per source, how they were triaged, what changed per module, any evidence-backed label corrections and their confirmation, which failures were resolved by fixing a checklist rather than code, and anything handed off to `/implement-spec`.

IMPORTANT:
- Do NOT update code outside views, generators, and the "test" spec without user confirmation.
- Do NOT modify `spec.ts` without user confirmation.
