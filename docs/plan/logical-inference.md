# Logical inference in mediated length comparison

## Approved scope and design

Continue from `51a9efd` on `codex/ontology-v029-vqa-rerun`. The user approved replacing
`ConceptDerivation` with `LogicalInference` for the mediated length-comparison task and
retaining its question in solution mode. The installed ontology preview already supplies the
eligible descriptor, so no library or ontology change is required. Only CCSS is regenerated
and validated; the isolated test spec, dataset and cache remain outside this work.

`LogicalInference` means deriving a conclusion from stated premises using valid deductive
rules. The existing task supplies A-to-B and B-to-C comparisons and asks for the appropriate
A-or-C endpoint. This is an application of transitivity, consistent with the indirect-comparison
clause of [1.MD.A.1](https://www.thecorestandards.org/Math/Content/1/MD/).

Replace the Ability in the view's invariant declaration and the single CCSS target builder
(`SPEC-3`, `SPEC-V5`, `TSPEC-13`). This is one existing learner action with an empty view schema;
there is no new task branch or need to split the module (`SPEC-V2`, `SPEC-V6`). The view owns
no Area, target precondition or rejection boundary. The generator continues to supply
`MeasuringLength`, `MediatedRelation`, the comparison direction and the complete relation chain.
Its canonical payload and all generator code remain unchanged (`IMPL-V8`, `IMPL-V11`).

The implementation keeps the already resolved question visible in both modes. Previously the
solution highlighted A or C without saying whether the longer or shorter endpoint had been
requested. Restoring that context resolves the presentation issue (`IMPL-V5`); the concise
Modes checklist now states the observable requirement (`CHK-V6`). The renderer introduces
no random choice and retains its existing deterministic illustrations (`IMPL-V6`).

The only production route is `measurement-mediated-comparison` → `measure-mediated-comparison`
for `1.MD.A.1-mediated-length-comparison`. No other consumer or producer requires adoption.

## Baseline and verification plan

Baseline: 1,970 CCSS images, 1,952 passes, 18 failures, zero uncached; the affected route has
four images and one rejected `ConceptDerivation` judgment. An in-memory investigation retains
688 targets, 214 compatible pairs and 841 matched tuples, replacing one target identity and route.
The new target hash is allocated to training only under the existing split policy, so canonical
generation is expected to replace the four old identities with two training images.

Capture matching and image/cache identities, including the isolated test snapshot/cache hashes.
Run focused existing tests, CCSS checks, label audit and the production build. After committing
the source correction, regenerate through the canonical affected graph and perform cache-aware
VQA at concurrency four. Inspect both modes, exact replay, cache/image churn and split integrity.
Update the original report and machine-readable findings, retain the retired failure's evidence,
commit the validation and documentation separately, and push the branch.
