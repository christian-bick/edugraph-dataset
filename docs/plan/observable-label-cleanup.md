# Observable label cleanup

## Goal and boundary

Review direct target and dataset labels against the proposed distinction between structural
groupings and observable descriptors. Candidate direct labels are structural leaves or nodes
with specialization children, not nodes with `partOf` children. This is not a leaf-only rule:
`Rectangle` and `FractionNumbers`, for example, have meaningful broader claims and specialization
children.

Structural eligibility does not prove that a label describes an artifact. Apply `TSPEC-6`,
`TSPEC-13`, `SPEC-4`, and `SPEC-G3` to the actual task first. Do not automatically substitute a
child, change ontology edges, or weaken targets just to satisfy a structural check. Resolve
genuine modeling questions before making this a universal validation gate.

This is a follow-up to the completed label and relation migrations, not a claim that the new
structural criterion was part of their acceptance gates.

## Baseline

The audit used installed ontology `0.23.0`, checked its structural children against the authored
ontology sources, and replayed the current local canonical CCSS snapshot. It found no mixed
composition/specialization parents and no structural difference between those ontology sources.

- 179 of 653 active normalized targets contain a composition-parent label.
- 497 of 1,878 stored image annotations contain at least one such label.
- 15 distinct labels are involved: 11 Areas, 4 Scopes, and no Abilities.
- The generated snapshot is `9a517263d42e741301adb163cb84a4c56bd48398bd653c33f48d248da2c7640b`.

The image counts describe that snapshot, not the older materialized release union or the source
state after the edits below. Diagnostic scripts and reports are under `temp/observable-nodes/`
and `temp/observable-cleanup/`.

## Batch 1: existing specific claims

Source changes and automated checks completed on 2026-09-10; canonical regeneration and VQA
remain pending.

| Path | Correction | Mathematical claim retained |
| --- | --- | --- |
| `factor-multiple-relations` and its Grade 4/test targets | Remove `Factorization` from the task bundles and targets. | `FactorsAndMultiples`, `PrimeNumbers`, or `CompositeNumbers`; the multiple test additionally requires `PerfectDivisibility`. |
| `comparison` and the Grade 4/test multi-digit comparison targets | Replace target `NumericComparison` with `NumericEquality` or `NumericInequality`, following the already explicit `Equal`, `Less`, or `Greater` relation. Remove the grouping capability and duplicate fallback bundles. | The concrete equality/inequality and directional Scope. |
| `fraction-arithmetic` and its Grade 4/test targets | Remove the invariant `FractionArithmetic` grouping label. | The operation Areas and fraction-form, denominator, and shared-whole Scopes already present in each competency. |

No generator implementation, payload type, view implementation, checklist, or ontology entity
changed. Factor evidence, comparison values/place-value evidence, and fraction relations remain
canonical mathematical data and derived evidence. Every consuming view uses the same fields and
configuration as before; no payload adoption is required (`IMPL-G6`, `IMPL-G8`).

### Evidence

- `npm run check:affected` passes: types, related tests, capability/label checks, and CCSS/test
  target validation. CCSS retains all 653 normalized targets; `test` retains 559 targets and a
  generatable path for every one of the 80 generators.
- `npm run test:coverage` passes: 443 test files, 2,433 tests; every generator meets its coverage
  thresholds. The three affected generators have statement/branch coverage of 100%/100% for
  factor relations, 95.83%/95.31% for comparison, and 100%/100% for fraction arithmetic.
- A before/after comparison maps the 20 changed target identities by their intended label
  corrections and proves that all 790 target/generator/view matches are preserved, with no
  additional or lost pair.
- Replay covers 39 affected-module tuples with 20 fixed seeds each: 780 draws. All generator
  and view configurations are identical, and the only annotation changes are the intended
  grouping-label removals.
- 91 comparison draws change their concrete numbers. Each is explained exactly by removing
  one random draw that selected between equivalent fallback label bundles. Do not retain a
  dummy random call to preserve this duplication. New target hashes also deliberately change
  canonical sample seeds and may change split membership (`TSPEC-5`). Pixel identity is not
  claimed.
- Composition-parent target usage decreases from 179 to 159. The stored image annotations have
  not yet been regenerated, so their baseline count of 497 must not be presented as an updated
  dataset result.

### Remaining validation for Batch 1

- [ ] Restore a responsive Docker daemon. The sandboxed server query was denied; an
  outside-sandbox server query then did not respond and was cancelled. No daemon restart was
  attempted.
- [ ] Run canonical `npm run generate:dataset -- --spec=ccss --affected` and the affected `test`
  regeneration.
- [ ] Inspect changed samples and run the matching VQA validation. Obtain permission before
  uploading new PNG/prompt sets to Gemini. No new VQA result or cache update is claimed here.
- [ ] Rerun the observable-node audit against the fresh canonical snapshot and record actual
  annotation counts and cache churn.

## Remaining semantic review

Prioritize usages with an existing truthful replacement; do not batch-replace a label across
all modules merely because one usage is redundant.

- [x] Remove all active `Factorization` grouping claims from the reviewed task family.
- [x] Remove `NumericComparison` from `comparison`; its shape-attribute usage remains below.
- [x] Remove `FractionArithmetic` from `fraction-arithmetic`; its measurement-data usage remains
  below.
- [ ] `measurement-data` uses `FractionArithmetic` as a behavioral flag, and
  `measurement-line-plot-arithmetic` requires it. Review the operation and applicability contract
  together. Deleting the label alone would disable or invalidate a real arithmetic task.
- [ ] `shape-compare-attributes` uses `NumericComparison` and `ShapeIdentity`. Review which
  attribute relations and shape knowledge the task actually asks for before choosing concrete
  labels. Other `ShapeIdentity` usages also need individual review.
- [ ] Review `MeasuringWithUnits`, `Measurement`, and the `LengthMeasurement`,
  `WeightMeasurement`, `TimeMeasurement`, and `AngleMeasurement` Scope groupings. Concrete
  operation, unit, and instrument labels can replace grouping uses only where the artifact
  actually supplies their evidence; a number line must not become a ruler claim.
- [ ] Review `ProportionSense` and `FractionInterpretation` against their concrete constituents.
- [ ] Resolve the ontology modeling questions around `Circle` and `FractionEquivalence`:
  both describe directly observable content despite currently having composition children.
- [ ] Review `ShapeEquivalenceRelations` for equal-area partitions. Equal area does not imply
  congruence, similarity, or symmetry; do not choose an existing child that changes the claim.
