# Observable label cleanup

## Current status — 2026-09-10

All twelve grouping-label batches and their CCSS artifact validation are complete. Ontology
v0.25.0 is installed, and canonical CCSS generation plus a full test baseline have completed.
Both source targets and fresh image annotations contain **zero composition-parent labels**.
The detailed batch evidence below records the successive source-review checkpoints; the final
artifact evidence at the end supersedes their earlier Docker and regeneration blockers.

The final strict offline audit passes with **1,944/1,944 exact passing VQA records**, including
all four equal-shares ProofByConstruction images. The 17 revised images were authorized and
validated: 16 passed immediately, and one verified fraction-reading error passed a single
unchanged-image/prompt recheck. All original judgments remain in the diagnostic reports.
There are no missing, failing, stale, duplicate, malformed, or obsolete-module cache records.
Repository and split checks pass, and the local union has been rebuilt with all 1,944 images.
The separate fraction payload-family and classification-caption review findings remain tracked
below; structural eligibility does not resolve those independent implementation questions.

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

- [x] Restore a responsive Docker daemon. The supplied ontology Docker builds now complete
  successfully (v0.24.1 and v0.24.2, 2026-09-10), closing the earlier daemon blocker.
- [x] Run canonical `npm run generate:dataset -- --spec=ccss --affected` and test regeneration.
  The missing test snapshot required a full baseline; both completed in the final artifact gate.
- [x] Inspect changed samples and run the matching VQA validation. The authorized full CCSS run
  passed all Batch 1 samples; the remaining view repairs and revalidation are recorded below.
- [x] Rerun the observable-node audit against the fresh canonical snapshots and record actual
  annotation counts and image deltas. Live validation has now updated the corresponding cache.

## Batch 2: shape comparison and angle contexts

The shape-attribute generator always pairs different attribute counts. Its invariant relation
is therefore `NumericInequality`, not the `NumericComparison` grouping. Its concrete shape Area,
`ShapeAttributes`, and comparison claim already describe the task; remove the additional
`ShapeIdentity` grouping. Apply the same corrections to its CCSS and smoke targets.

Remove `AngleMeasurement` from angle concepts, arithmetic, and drawing declarations and targets.
Those tasks retain their angle Areas and applicable `DegreeScale`; no instrument is substituted
where none is shown. The actual protractor-reading task still declares `Protractor`.

- Existing module tests pass: 8 files, 53 tests. No migration-specific regression tests added.
- Full CCSS matching remains 653 targets and 790 pairs after mapping 16 changed target ids.
- Across 360 fixed-seed draws, generator configuration, view configuration, and payloads are
  identical. Only the reviewed labels change.
- Targets with composition-parent claims decrease from 159 to 146; image counts remain pending
  canonical regeneration.

## Batch 3: concrete unit contexts and number-line knowledge

Remove `MeasuringWithUnits` from the word-problem and number-line families. Merely using a
quantity with a unit does not teach unit systems, relative unit sizes, or conversion. Word
problems retain their arithmetic operation Areas; number lines explicitly claim
`NumerationWithFractions` or `NumerationWithDecimals`, according to the numeric model.

Replace the `LengthMeasurement`, `WeightMeasurement`, and `TimeMeasurement` groupings in these
families with the actual fixed `MeterScale`, `KilogramScale`, and `HourIntervals` contexts.
Liquid-volume and dollar contexts remain. Update the corresponding production and smoke targets.

Removing the inappropriate unit-study claim exposes eight additional, valid Grade 4 matches
through `arithmetic-ops-pairs` and `measurement-word-problem`. Keep these alternatives. Review
also exposed an independent configuration defect in that view: measurement family and unit could
resolve separately to incompatible choices. A single concrete unit configuration now chooses
grams, kilograms, or liters, with the coherent capabilities declared by that choice. The view
consumes plain configuration values rather than ontology labels. Existing Grade 3/test targets
use their actual gram or kilogram scales without the weight-tool grouping.

### Evidence

- All 653 active CCSS targets remain matched. Mapping 78 renamed target identities gives 798
  pairs: all 790 existing pairs plus the eight reviewed alternatives, with no lost pair.
- Replay of both measurement generators covers 1,400 fixed-seed draws. Generator configurations,
  mathematical payloads, and consuming view configurations are unchanged; annotation changes
  are exactly the intended corrections.
- The measurement-story view renders all 20 matched targets at 20 fixed seeds in both modes:
  400 draws and 800 successful server-side renders, including the eight additional matches.
  This checks rendering totality, not screenshots or visual annotation correctness.
- `npm run check:affected` passes. Full coverage passes: 444 test files, 2,438 tests, and all
  checked generator coverage thresholds. Unit-profile tests exercise valid resolution and
  incompatible context rejection, not migration-specific target snapshots.
- Targets with composition-parent claims decrease from 146 to 68. Canonical generation and
  VQA remain pending under the validation checklist above; stored image counts are unchanged.

## Batch 4: observed measurements versus supplied data

The `measurement-data` generator contributes statistical observations and their units. The
`measurement-data-table` view contributes `MeasuringLength`: it actually asks the learner to
measure depicted objects using rulers. Line-plot construction and arithmetic use supplied
measurements and do not claim that object-measurement task. Remove the broad `Measurement`
Area and `LengthMeasurement` grouping from these declarations and targets accordingly.

Declare the concrete centimeter or inch context already selected by each target. The generator's
unit resolver also explicitly publishes its existing default unit capability when the target
does not name a unit. This does not introduce a new random choice or change the selected unit.

Two further fixed contexts use their concrete labels: the length-difference problem and the
within-100 length stories use `CentimeterScale`. The one-meter fraction-to-decimal task retains
`DecimalEquivalence`, notation Areas, and `MeterScale`, without claiming study of unit systems
through `MeasuringWithUnits` or using the length-tool grouping.

### Evidence

- All 653 active CCSS targets remain matched. Eleven target identities change. All 798 existing
  pairs remain; one additional pair satisfies the existing Grade 2 ruler-use target through
  `measurement-data` and `measurement-data-table`, for 799 pairs total.
- Replay preserves generator configurations, view configurations, and mathematical payloads
  across all 840 baseline fixed-seed draws. The additional ruler-use match contributes 20 more
  draws. Only the reviewed annotation changes occur.
- All eight matched measurement-data targets pass both server-rendered modes at 20 seeds:
  160 draws and 320 renders. No view implementation, payload type, or checklist changed.
- `npm run check:affected` passes. The catalog integration test now checks preservation of
  every view's declared capabilities instead of fixing one module's historical label list.
- Full coverage passes: 444 test files, 2,438 tests, and all checked generator coverage thresholds.
- Composition-parent target usage decreases from 68 to 59. Image annotation counts and VQA
  remain pending canonical regeneration.

## Batch 5: unit conversion contract

Replace the generator's learner-task selector and task-specific quantity aliases with canonical
unit equivalences (`SPEC-G2`, `IMPL-G8`). `measurement-conversion` now produces only named-unit
equivalences; `measurement-unit-scale` produces the bounded segment-partition model. Each generator
guarantees one concrete payload family (`IMPL-G7`). The derivation view accepts their named union;
the other views accept only their appropriate concrete member. No matcher change is needed.

The named-unit payload becomes `{pair, equivalents: [{largerValue, smallerValue}, ...]}`.
It holds five consecutive, mathematically equivalent quantity pairs. Derivation and execution
use the first pair, while the table view projects the collection as rows. No quantity is repeated
under a task-specific alias. The segment variant retains its three mathematical counts without
a task discriminant.

| Production consumer | Target family | Payload adoption | Verification |
| --- | --- | --- | --- |
| `measure-unit-scale-relation` | Grade 2 same-length unit comparison | Retain segment counts; remove `task`; receive only `GenericUnitScaleRelationProblem`. | Typed-routing regression, fixed-seed markup comparison, and both modes. |
| `measure-conversion-derivation` | Grade 2 unit comparison and Grade 4 relative unit sizes | Keep segment projection; use the first canonical equivalence for named units. | Fixed-seed markup equivalence and both modes. |
| `measure-conversion-execution` | Grade 4 larger-to-smaller conversion | Use the first canonical equivalence; accept only `StandardUnitEquivalencesProblem`. | Typed-routing regression, fixed-seed markup comparison, and both modes. |
| `measure-conversion-table` | Grade 4 conversion tables | Own `ConversionTable`; render all equivalences; accept only `StandardUnitEquivalencesProblem`. | Equivalent-value/sequence tests, typed routing, and both-mode rendering. |

Remove the grouping claims `MeasuringWithUnits`, `LengthMeasurement`, `WeightMeasurement`,
and `TimeMeasurement`. Retain the actual magnitude/factor scaling and named-unit capabilities.
`UnitScaleRelation` is invariant mathematical evidence in both payload variants; `SegmentScale`
identifies the generic distance measured in segment counts. No new ontology entity is required.

The first named-unit quantity keeps the existing derivation/execution distribution (2 through 9).
The table now uses the same collection, so its first quantity also comes from that range rather
than a separate task-selected 1-through-5 distribution. Neither range is a target claim.

The segment generator invariantly declares `UnitScaleRelation` and `SegmentScale`. It has no
ontology-backed parameter to resolve; its bounded counts are seeded instance variation. All four
conversion views drop their family-selecting label requirements/exclusions. Shared renderers and
presentation helpers remain in place. The separate
[payload-family matching plan](payload-family-matching.md) records the broader architectural
direction and the still-unimplemented positive micro-filter migration.

### Validation

Source and automated validation completed on 2026-09-10. The initial combined-generator attempt
exposed the required-label-only union-member guard. The approved resolution splits precise output
families instead of broadening that guard; no shared matching code changed.

- `npm run check:affected` and `npm run check:docs` pass. All 653 CCSS and 559 test targets remain
  matched; the test spec covers all 81 generators.
- `npm run test:coverage` passes: 444 test files and 2,440 tests. Both unit-relation generators
  have 100% statement and branch coverage. Typed-routing integration tests replace three
  declaration-snapshot tests that only asserted the previous label guards.
- Full matching preserves all 799 CCSS pairs after the intended target-label corrections and
  the segment producer's ID change from `measurement-conversion` to `measurement-unit-scale`.
  There are no additional or lost target/view paths in CCSS or test.
- Replay of every baseline conversion tuple covers 920 fixed-seed draws and 1,840 successful
  server-side renders across CCSS and test. Non-table markup is unchanged. The 280 table draws
  have the intended quantity-series change; resolved labels have no unexplained difference.
  Reintroducing the segment entry point causes no additional fixed-seed markup change.
- Composition-parent target usage decreases from 59 to 37. These are source results, not new
  image-annotation counts. Canonical sample identities include target and generator IDs, so the
  migrated identities will obtain new seeds; fixed-seed markup equivalence is not PNG identity.
- Canonical generation and VQA remain pending. The sandbox denied Docker access; the subsequent
  outside-sandbox daemon query did not respond and was cancelled without restarting Docker.
  No new PNGs, VQA uploads, or cache entries were produced. Follow the shared artifact checklist
  above once canonical rendering is available.

Diagnostic evidence is in `temp/observable-cleanup-batch5/`: `before.json`, `after-split.json`,
`diff-split.json`, `matching-split.log`, `coverage-split.log`, and `check-affected-split.log`.

## Batch 6: measurement extrema arithmetic

Separate plain measurement observations from observations with a required extrema operation.
`measurement-data` retains plain observations; `measurement-extrema` owns the existing bounded
eighth-unit observations plus an addition/subtraction relation. Both use shared observation
generation. The arithmetic view accepts `MeasurementExtremaProblem` directly, not an optional
field made mandatory through `FractionArithmetic` (`IMPL-G7`, `SPEC-G3`).

| Production consumer | Target family | Payload adoption | Verification |
| --- | --- | --- | --- |
| `measurement-data-table` | Grade 2 observed length data | Plain observation structure remains unchanged; no arithmetic relation belongs to this contract. | Seed-aligned data/markup replay and both modes. |
| `measurement-line-plot` | Grades 2 and 4 provided-data construction | Retain the plain observation type and shared line-plot rendering. | Fixed-seed replay and frequency/scale tests. |
| `measurement-line-plot-arithmetic` | Grade 4 extrema addition/subtraction | Require the precise arithmetic payload; remove the grouping-label guard; order existing shortest/longest values in the view. | Typed-routing, relation validation, and both-mode replay. |

Remove `FractionArithmetic` from generator capabilities and the affected CCSS/test targets.
Addition/Subtraction and FractionNumbers already express the actual claim. Keep calculated
shortest, longest, and answer values as mathematical evidence, but remove `leftOperand` and
`rightOperand` aliases of the extrema (`IMPL-G8`). Resolve ontology labels to plain typed
configuration rather than comparing labels inside generator code (`IMPL-G1`).

The new arithmetic generator guarantees fractional observations in one compact frame. Addition
and Subtraction remain schema choices; centimeter/inch unit capabilities remain configurable.
Plain views do not consume this family: they would omit the arithmetic evidence. The arithmetic
view cannot consume plain observations whose required relation is absent. Typed routing enforces
both directions without a grouping-label guard.

Review also found unit/precision coupling in the shared views: the generator can produce whole
inches and fractional centimeters, but validation previously admitted only whole centimeters and
fractional inches. Validation and formatting now follow subdivisions independently of the unit.
Axes and rulers cover the numeric domain, and measurement instructions request whole, quarter,
or eighth units accordingly. This fixes an unnecessarily partial projection (`IMPL-V11`) rather
than restricting valid mathematical capabilities to the combinations in current targets.

No ontology changes, new learner actions, or shared matcher changes were needed. Baseline evidence
is in `temp/observable-cleanup-batch6/before.json`: 600 draws and 1,200 server renders across all
matched measurement-data consumers in CCSS and test.

### Validation

- All 653 CCSS targets retain their 799 matches after the producer ID change for extrema
  arithmetic. No CCSS or test target/view path is added or lost. The two CCSS and two smoke
  arithmetic targets no longer contain `FractionArithmetic`.
- All 600 ordinary fixed-seed draws change their concrete measurements because the old
  plain-array `numberKind` selector consumed one random value even with an exact requested
  number kind. The typed exact resolver does not. A diagnostic replay accounts for that one
  removed draw and reproduces every baseline payload and all 1,200 markup outputs, after only
  deleting the two duplicate operand aliases and the grouping annotation. No dummy random draw
  is retained in production. Target and generator ID changes also affect canonical sample seeds.
- Regression tests cover schema resolution, bounded observations, coherent extrema arithmetic,
  rejection of missing relations, precise generator/view routing, and both rendered modes for
  every supported unit/subdivision combination. Relation arithmetic and plain-data generation
  remain independent of ontology labels in implementation code.
- Composition-parent target usage decreases from 37 to 35. Image counts remain those of the
  existing canonical snapshot, not a regenerated dataset.
- Full coverage: 447 test files and 2,456 tests pass; both measurement generators have 100%
  statement and branch coverage. The render regression adds 32 server renders across units,
  precisions, operations, and question/solution modes. `check:affected` passes, including types,
  module contracts, all 653 CCSS targets, all 559 test targets, and coverage of all 82 generators.
  Documentation checks and `git diff --check` also pass.
- Canonical generation and VQA remain pending: a fresh outside-sandbox Docker query still did
  not respond and was cancelled. No PNGs, uploads, or cache changes were produced.

Evidence files: `after.json` / `diff.json` record actual seeded changes; `after-aligned.json` /
`diff-aligned.json` isolate the removed schema draw. `coverage.log`, `check-affected.log`, and
`matching.log` record the repository gates.

## Batch 7: shape edge composition

The Kindergarten construction target describes assembling a polygon from loose edges and
vertices. Replace its grouping `ShapeIdentity` claim with the existing `ShapeSynthesis` claim:
the task combines component shapes into a whole. Do not reuse ShapeClassification merely because
both tasks involve sides and vertices (`SPEC-G3`, `TSPEC-6`).

Extract this mathematical family into `shape-edge-composition`, returning required target, side,
and corner counts without an assembly-task flag. The dedicated `shape-build-from-parts` view owns
the geometry-stick presentation. Shared polygon and material rendering stays in the shape parent
directory (`IMPL-G7`, `IMPL-G8`, `IMPL-V9`). This removes the branch that required a separately
resolved GeometrySticks flag to agree with a generator-selected task.

| Production consumer | Target family | Adoption | Verification |
| --- | --- | --- | --- |
| `shape-build-from-parts` (extracted from `shape-build-shape`) | K.G.B.5 loose-part construction, four polygons | Exact edge-composition payload; invariant GeometrySticks representation and existing Abilities. | Four shapes, both modes, typed routing and baseline markup. |
| `shape-build-shape` | Grade 1 defining attributes and Grade 2 attribute counts | Remove loose-part dispatch and unused count-choice branch; retain these existing contracts. | Existing tests and baseline replay. |
| `shape-draw-linear-shape` | Rotated polygons, defining attributes, excluded quadrilateral subcategories | No edge-composition input; preserve existing drawing payloads. | Baseline replay and drawing tests. |
| `shape-draw-circular-shape` | Rotated circles and defining attributes | No edge-composition input; preserve existing drawing payloads. | Baseline replay and drawing tests. |

The old ShapeIdentity + ShapeProperties branch only served unit fixtures, not a CCSS or test
target. Its choice of a side/corner count did not justify the view's VisualArticulation claim.
Remove that unused branch rather than moving it into the assembly contract. Other construction
families retain their current behavior; their wider payload/task normalization remains in the
separate payload-family plan.

### Validation

- All 653 CCSS targets retain their 799 matches after the four assembly targets change from
  ShapeIdentity to ShapeSynthesis and adopt the new generator/view pair. No CCSS or test path is
  otherwise added or lost. Composition-parent target usage decreases from 35 to 31.
- All 1,360 fixed-seed payloads and 2,720 server renders reproduce the baseline, accounting only
  for the removed assembly-task flag and corrected annotation. No PRNG alignment is needed.
  Changed target, generator, and view identifiers still change canonical sample identities.
- Full coverage: 450 files and 2,464 tests pass. The new generator has 100% statement/branch
  coverage; the remaining construction generator has 94.11% / 94.87%. Tests cover exact shape
  resolution, invalid configurations, independent typed routing, both view modes, and malformed
  construction evidence without pinning curriculum IDs.
- `check:types` and `check:affected` pass, including documentation, module contracts, all 653
  CCSS targets, all 559 test targets, and a test path for all 83 generators. `git diff --check`
  passes. Evidence is under `temp/observable-cleanup-batch7/`: `before.json`, `after.json`,
  `diff.json`, `types.log`, `coverage.log`, and `check-affected.log`.
- Canonical PNG generation and VQA remain pending. A fresh outside-sandbox Docker version query
  did not respond and was cancelled. No images, external uploads, or cache files changed.

### Fraction-partition review (resolved in Batch 8)

The existing payload already separates a partition, a selected region, and a share comparison.
The review identified precise generator output families, with the existing six task views
sharing their renderer. Batch 8 below records the implemented resolution of these candidates:

| Current use | Observable evidence | Resolution candidate |
| --- | --- | --- |
| Grade 1 FractionInterpretation + ActiveVocabulary | A highlighted equal share is named half, fourth, or quarter, without written fractions. | Review NumberNameNotation + UnitFractions: its current definition covers written words for numerical values, so this may already express the naming task. Confirm that the part/whole meaning is preserved before considering a new Area or broader denominator-interpretation definition. Current numerator/denominator definitions explicitly refer to the top/bottom numbers. |
| Grade 1 FractionInterpretation + ConceptComposition | Separate halves or fourths are assembled into one whole. | ShapeSynthesis + EqualShares describes the composition; retain the fraction context without claiming written-notation interpretation. |
| Grade 3 ProportionSense + partition/label | Equal-area partition with an explicit 1/b label. | ShapeDecomposition plus FractionDenominatorInterpretation and the view's notation capability; check the full target conjunction. |
| Grade 3 ProportionSense + FractionNotation + Interpretation | A highlighted a/b region is written as a fraction and related to equal parts. | The existing numerator/denominator interpretation Areas are direct candidates. No generic proportional-reasoning claim is needed. |

The old Areas also select denominator ranges: Grade 1 chooses 2 or 4; Grade 3 chooses 2, 3, 4,
6, or 8. Those are real constraints in the tracked 1.G.A.3 and 3.NF.A.1 standard descriptions,
not arbitrary variation. Parameterize the mathematical denominator directly rather than retaining
a grade/task-Area switch. HalfFractions, ThirdFractions, QuarterFractions, SixthFractions, and
EighthFractions are now available in the pinned ontology package. Do not drop sixths or use an
unrelated number range when implementing the explicit denominator configuration.

### Ontology prerequisite: v0.24.0

- [x] Upgrade the exact `edugraph-ts` release URL and lockfile to v0.24.0.
- [x] Verify SixthFractions specializes CommonDenominator and expands ThirdFractions. The package
  adds only that descriptor; CommonDenominator and ThirdFractions gain the corresponding inverse
  links. No existing descriptor is removed or redefined.
- [x] Compare all existing CCSS/test matches and three seeded configuration/capability resolutions
  per pair: unchanged (653 CCSS targets / 799 pairs; 559 test targets / 691 pairs).
- [x] Run the complete test suite (450 files / 2,464 passing tests) and `check:affected`.
- [x] Use the new Scope in the fraction-partitioning migration (Batch 8). The package upgrade
  itself did not change target labels or denominator selection.

Temporary evidence: `temp/ontology-v024/{before,after,delta}.json`, `tests.log`, and
`check-affected.log`. The upstream schema also removes ontology-wide dimension requirements on
CompetencyDescription; this does not change the dataset's own `TSPEC-14` authoring requirement.
No canonical artifacts or VQA cache files are changed by this dependency update.

Keep this review separate from the already tracked Circle / FractionEquivalence ontology structure
questions. The two angle-family FractionInterpretation usages are resolved separately in Batch 9;
they are not changed by the shape-construction extraction.

## Batch 8: fraction partitioning

The generators now use three precise mathematical output families: equal partition, selected fraction region,
and unit-share comparison. Shape and denominator choices belong to generator schemas; the
mathematical activity contributed by each projection belongs to its view (`SPEC-11`, `IMPL-G8`).
The family migration removes raw-label task dispatch (`IMPL-G1`) without changing the matcher.

Consumer adoption matrix (`IMPL-G6`):

| View | Target family | Payload | Projection and verification |
| --- | --- | --- | --- |
| shape-partition-equal | 1.G.A.3 partition | Equal partition | Own ShapeDecomposition; explicit halves/fourths; withhold/reveal boundaries. |
| shape-partition-share-name | 1.G.A.3 vocabulary | Equal partition | Own NumberNameNotation; name fractional values in words; preserve part/whole context and fourth/quarter synonyms. |
| shape-partition-whole-composition | 1.G.A.3 composition | Equal partition | Own ShapeSynthesis; show separate shares and the resulting whole. |
| shape-partition-unit-fraction | 3.G.A.2 partition and label | Equal partition | Own ShapeDecomposition, FractionDenominatorInterpretation and FractionNotation; explicit denominator scopes. |
| shape-partition-fraction-interpretation | 3.NF.A.1 region | Selected fraction region | Own numerator/denominator interpretation and FractionNotation; validate every proper unit/nonunit combination. |
| shape-partition-share-comparison | 1.G.A.3 smaller share | Unit-share comparison | Keep fourth versus half; explicit mathematical comparison, no family-routing labels. |

`shape-partition` returns only `ShapePartitionProblem`; `shape-fraction-region` returns
`ShapeFractionRegionProblem`; `shape-unit-share-comparison` returns `ShapeUnitShareComparisonProblem`.
All six `ViewTypeMap` entries consume exactly their accepted family. No required/rejected label
guard or shared matcher change is needed. The pre-existing stronger partition-and-label view
remains eligible for plain partition targets; this batch does not change stronger-Ability policy.

Naming and composition now support all five denominators through shared words and piece rendering,
while Grade 1 targets explicitly request halves or fourths. Six/eight composition pieces use two
rows. The selected-region schema uses an exact correlated choice for denominator and proper
fraction kind: unit fractions allow 2/3/4/6/8; nonunit fractions allow 3/4/6/8 with numerator in
2..denominator-1. Impossible nonunit halves fail configuration resolution. Concrete numerator
variation remains seeded generator logic, and presentation-only highlight selection remains seeded
view logic (`SPEC-6`).

The share-naming resolution uses the existing NumberNameNotation definition: written words for
numerical values. The learner supplies "one half", "one fourth (one quarter)", and the corresponding
whole phrases; EqualShares, UnitFractions, the denominator, and shape preserve the part/whole
context. Numerator/denominator interpretation labels are reserved here for the views that actually
teach fraction notation. No additional ontology entity or definition change was needed.

### Validation

- CCSS expands from 653 targets / 799 pairs to **681 targets / 829 pairs** because denominator
  contexts are explicit target variants. All previous view paths survive within their competency
  families, with comparison and selected-region paths transferred to their precise generators.
  Every unrelated target and matching pair is unchanged.
- The isolated test spec retains 559 targets and a generatable path for all **85 generators**.
- Full tests and `npm run test:coverage`: **455 files / 2,494 tests pass**. All three generators
  have **100% statement and branch coverage**. Renderer tests exercise both shapes, every supported
  denominator, all proper region numerators, both modes, vocabulary, and invalid payloads.
- `check:affected` passes, including types, related tests, generator coverage, generator/view
  declarations, label checks, docs, and both CCSS/test standards validation. Target distinctness
  reports no finding involving the migrated fraction definitions.
- A temporary fixed-seed probe checks **1,240 draws / 2,480 server-rendered outputs** over current
  CCSS/test tuples. Replaying all 640 pre-refactor payloads in both modes produces **1,280 unchanged
  HTML hashes**. This is renderer-equivalence evidence, not canonical pixel or live VQA proof.
- Composition-parent target candidates change from 31 to **40**: Circle expands from 16 to 30
  explicit denominator targets. ProportionSense drops from 6 to 0, and FractionInterpretation from
  6 to the two unmodified angle targets. FractionEquivalence (9) and ShapeEquivalenceRelations (2)
  remain unchanged. These overlapping label counts are not counts of proven false annotations.
- Canonical PNG generation and VQA are pending. Docker access is denied inside the sandbox; an
  outside-sandbox server-version query also did not respond and was cancelled. No Docker restart,
  image upload, or VQA-cache change was performed.

Temporary evidence: `temp/fraction-partition/{before,after,summary}.json` and
`temp/fraction-partition-*.log`.

## Batch 9: angle fraction interpretation

Source changes and automated checks completed on 2026-09-10; canonical regeneration and VQA
remain pending.

The two 4.MD.C.5a tasks use a unit fraction to relate an arc or a one-of-360 turn to angle
measure. FractionDenominatorInterpretation expresses the partition-count meaning actually used;
no separate numerator-interpretation task is added. The degree scale supplies its explicit
360-degree full-turn convention, without requiring an invented denominator-360 Scope.

The review also found generator-owned task dispatch and raw feature-label parsing (`IMPL-G1`,
`IMPL-G8`), plus one view/checklist combining arc interpretation with repeated-unit interpretation
(`SPEC-V6`, `CHK-V6`). These are resolved together through precise families and shared rendering.

| Consumer | Generator / mathematical family | Adoption |
| --- | --- | --- |
| geometry-angle-concepts | angle-arc-fraction / fractional arc of a full turn | Accepts only arc fractions; owns denominator interpretation. |
| geometry-angle-one-degree-derivation | angle-unit-partition / equal one-degree partition of a full turn | Accepts only unit partitions; owns denominator interpretation; preserves the magnified inset. |
| geometry-angle-degree-iteration (new) | angle-unit-iteration / repeated one-degree units | The existing interpretation task has a thin leaf and its own checklist. |

Canonical fields retain mathematical fractions, partition counts, unit sizes, and calculated
angle measures. Task names, fixed diagram orientation, tick arrays, and duplicate endpoint
or answer aliases are removed. Views derive diagram coordinates, ticks, and wording from the mathematical
relation (`IMPL-G6`, `IMPL-V9`).

The arc generator resolves HalfFractions, ThirdFractions, QuarterFractions, or SixthFractions.
When no denominator is requested, its exact schema choice records the selected denominator in
the observable labels. The standard's angle task does not prescribe that four-denominator set,
so it is not expanded into arbitrary denominator-specific target variants. Both fraction-facing
targets replace only FractionInterpretation; DegreeScale is now an invariant generator capability
for all three families. The unit-partition and iteration generators have empty schemas: their
mathematical capabilities are invariant. Iteration count remains seeded generator variation.

Each `ViewTypeMap` entry accepts its precise family. There are no family-selecting
`requiredLabels`/`rejectedLabels`, raw-label implementation branches, or shared matcher changes.
The three fixed task projections share a frame and diagram helpers; no view chooses between
parallel tasks. No ontology change was needed.

### Validation

- CCSS retains **681 targets / 829 pairs**. All three angle tasks keep exactly one matching
  path, now through their precise families. All unrelated CCSS/test target matches are unchanged.
- The isolated test spec retains **559 targets** and covers all **87 generators**.
- Full tests and `npm run test:coverage`: **460 files / 2,518 tests pass**. All three new
  generators have **100% statement and branch coverage**.
- `check:affected` passes, including types, related tests, coverage, generator/view declarations,
  labels, docs, and CCSS/test target validation. Renderer regression tests cover each supported
  denominator and iteration count, both modes, answer withholding, and invalid family evidence.
- A temporary before/after probe covers **240 generated samples / 480 server-rendered outputs**.
  For the same mathematical values, every question/solution HTML hash matches the previous
  rendering. This does not establish identical sample seeds, canonical PNG pixels, or VQA results.
- FractionInterpretation is absent from active source declarations. **40 CCSS targets** still
  contain a composition-parent candidate: Circle (30), FractionEquivalence (9), and
  ShapeEquivalenceRelations (2). Counts overlap; the two angle targets also contain Circle,
  so the number of candidate targets does not fall when their fraction claim is corrected.
- Canonical PNG generation and VQA remain pending. Docker is inaccessible inside the sandbox;
  an outside-sandbox server-version check also timed out after 15 seconds. Only that probe was
  stopped. No daemon restart, image upload, or VQA-cache change was performed.

Temporary evidence: `temp/angle-cleanup/{before,after,summary}.json` and `temp/angle-*.log`.

## Batch 10: circular-shape ontology correction

Adopted ontology [v0.24.1](https://github.com/christian-bick/edugraph-ontology/releases/tag/v0.24.1)
on 2026-09-10 through the exact `edugraph-ts` release URL and lockfile.

`CircularShapes` now groups `Circle`, `HalfCircle`, and `QuarterCircle` through `partOf`,
under `TwoDimensionalObjects`. `Circle` retains the meaning of a complete circle and its
enclosed region. Physical composition between the objects does not automatically establish
composition between their concepts, and the three siblings do not inherit one another's claims.

All three concrete descriptors are now structural leaves. Existing whole-circle targets and
module declarations remain truthful without substituting the new grouping label. No target,
generator, view, payload, checklist, or matching implementation changes are needed.

### Validation

- Before/after comparison preserves all **681 CCSS targets / 829 pairs** and **559 test targets /
  691 pairs**. Three fixed-seed generator/view configuration and resolved-capability probes per
  pair are identical: **4,560 resolutions** across both specs.
- The package adds only CircularShapes. Existing changed records are Circle, HalfCircle,
  QuarterCircle, and TwoDimensionalObjects; no descriptor is removed.
- The complete test suite passes: **460 files / 2,518 tests**. `check:affected` passes type,
  generator/view contract, label, documentation, and CCSS target validation checks.
  Separate test-spec validation passes all 559 targets and confirms a path for all 87 generators.
- Composition-parent candidates decrease from 40 to **11 CCSS targets**: FractionEquivalence (9)
  and ShapeEquivalenceRelations (2). The 30 Circle occurrences no longer violate the proposed
  structural criterion; one overlaps a remaining candidate. The isolated test spec has 8
  remaining candidate targets across the same two labels.
- Canonical regeneration and VQA remain pending with the earlier cleanup batches. Docker is now
  responsive and the upstream patch passed its supplied Docker build. This dependency adoption
  does not itself regenerate artifacts or update VQA caches. The changed Circle definition
  requires fresh validation context for Circle annotations; unchanged matching is not proof of
  cache reuse or artifact freshness.

Temporary evidence: `temp/ontology-v0241-adoption/{before,after,delta}.json` and validation logs
in the same directory.

## Remaining semantic review

Prioritize usages with an existing truthful replacement; do not batch-replace a label across
all modules merely because one usage is redundant.

- [x] Remove all active `Factorization` grouping claims from the reviewed task family.
- [x] Remove `NumericComparison` from `comparison` and `shape-compare-attributes`.
- [x] Remove `FractionArithmetic` from `fraction-arithmetic` and measurement-data arithmetic.
  Batch 6 replaces the latter's behavioral flag and view requirement with precise mathematical
  payload families and the existing operation claims.
- [x] Replace `NumericComparison` and remove redundant `ShapeIdentity` in
  `shape-compare-attributes`; replace the construction use with ShapeSynthesis and a precise
  edge-composition family (Batch 7).
- [x] Replace the angle-tool and measurement word-problem/number-line grouping uses with their
  actual observable contexts and knowledge claims (Batches 2 and 3).
- [x] Separate observed length measurement from provided-data tasks; declare the concrete
  units of the decimal-measurement, length-difference, and within-100 story contexts (Batch 4).
- [x] Review the unit-conversion family: replace grouping claims with concrete scales, move
  task identity to views, and separate generator output families (Batch 5; artifact validation complete).
- [x] Resolve all partition-family `ProportionSense` and `FractionInterpretation` uses (Batch 8).
- [x] Resolve the two angle-family `FractionInterpretation` targets (Batch 9).
- [x] Resolve the Circle modeling question through the CircularShapes sibling grouping and
  adopt ontology v0.24.1 (Batch 10).
- [x] Resolve the ontology modeling question around `FractionEquivalence`: the three procedures
  now belong to the existing FractionStrategies field in ontology v0.24.2. The equivalence
  principle, targets, and matched configurations remain unchanged (review and adoption below).
- [x] Resolve `ShapeEquivalenceRelations` through the approved ProofByConstruction context
  and a neutral partition-geometry payload (Batch 12). Canonical validation remains a separate gate.

### Next contract reviews

These are not safe global label substitutions. Review the mathematical payload and view
applicability before modifying targets or adding ontology entities.

1. **Unit conversion (resolved in Batch 5):** seven concrete unit pairs establish magnitude or
   factor scaling; abstract segment counts use a separate precise payload family. `UnitConversion`
   was not substituted: its definition concerns different unit systems, unlike several current
   within-system scaling examples. The final canonical and VQA gate is complete.
2. **Measurement line-plot arithmetic (resolved in Batch 6):** plain observations and extrema
   arithmetic have precise separate contracts. The arithmetic view requires its relation through
   the payload type, with Addition/Subtraction as the actual operation claims.
3. **Shape construction (grouping use resolved in Batch 7):** edge composition no longer needs
   ShapeIdentity or a generator-owned assembly task. The remaining attribute/rotation/subsumption
   branches retain their current behavior and are tracked by the separate payload-family plan.
4. **Fraction partitioning (source refactor resolved in Batch 8):** precise families, explicit
   denominator contexts, and view-owned mathematical projections replace Area-driven branching.
   The final canonical and VQA gate is complete.
5. **Angle fraction interpretation (source refactor resolved in Batch 9):** three precise
   mathematical families and three fixed projections replace task dispatch and raw feature-label
   parsing. Both fraction-facing views own denominator interpretation. The artifact gate is complete.

### Ontology review outcome

The final grouping-label use, ShapeEquivalenceRelations, is resolved in Batch 12 by describing
the partition mathematics and its constructed possibility witness. No ontology question remains
open for this cleanup. Structural eligibility and observable truth still require independent
checks against the newly generated dataset.

## FractionEquivalence review: existing strategy family

Reviewed on 2026-09-10 against ontology v0.24.1. The approved correction is implemented in
ontology commit `bec2374`, released as
[v0.24.2](https://github.com/christian-bick/edugraph-ontology/releases/tag/v0.24.2), and adopted
through the exact release dependency and lockfile. Dataset targets, module implementations,
generated PNGs, and VQA caches are unchanged by this correction.

### Target and evidence trace

The nine CCSS targets have eleven matched paths through `fraction-equivalence`; the six isolated
test targets have eight paths. Each target's FractionEquivalence claim is supplied by the
generator's invariant declaration. The view supplies the Ability and representation, retaining
the equality through aligned quantities, points, symbolic wholes, or scaling evidence.

| Competency family | CCSS targets | Mathematical evidence and view projection |
| --- | ---: | --- |
| 3.NF.A.3a recognition | 2 | Two fraction values occupy equal portions of equal wholes or the same point; classify their equivalence. |
| 3.NF.A.3b generation and explanation | 2 | Complete a numerator and explain why multiplying both terms preserves the represented amount or point. |
| 3.NF.A.3c whole numbers as fractions | 2 | Complete an equality such as `2 = 8/4`, using complete groups or number-line subdivisions. |
| 4.NF.A.1 scaling | 2 | Complete and explain the relation between `a/b` and `(n × a)/(n × b)`, with the shared whole preserved. |
| 4.NF.C.5 tenths to hundredths | 1 | Complete a relation such as `3/10 = 30/100`, with aligned grids and multiplication evidence. |

The distinction agrees with the official [Grade 3 fraction standards](https://www.thecorestandards.org/Math/Content/3/NF/)
and [Grade 4 fraction standards](https://www.thecorestandards.org/Math/Content/4/NF/).
These tasks do not universally require reducing a fraction to simplest form or finding a least
common denominator/numerator. Replacing their Area with one of those procedures would change the
claim rather than repair it (`TSPEC-6`, `SPEC-G3`).

The payload fields have the following dispositions under `IMPL-G8`: fraction numerators and
denominators and the whole-number value are canonical mathematics; `scaleFactor` and `relation`
are structured mathematical evidence; the normalized `sharedWhole` supplies the unit reference.
There is no narrative context or Ability-selected unknown, prompt, or explanation. The `task`
field distinguishes three mathematical payload variants, albeit with task-oriented names.
Leaf wrappers fix classification, completion, or explanation; their view schemas are empty and
their Area ownership does not overlap the generator. None uses required/rejected label guards.

### Approved ontology correction

FractionEquivalence retains its current definition as the directly observable principle,
its `partOf FractionArithmetic`, `expands RatioEquivalence`, and incoming
`DecimalEquivalence expands FractionEquivalence` relations.

The `partOf` parent of these three existing descriptors moves from FractionEquivalence to
FractionStrategies:

- FractionSimplification;
- LowestCommonDenominator;
- LowestCommonNumerator.

FractionStrategies already describes methods for coordinating fraction magnitude, equivalence,
and arithmetic. It can contain these procedures alongside the existing comparison strategies;
no new grouping descriptor or definition is needed. FractionEquivalence is now a structural
leaf. Its present definition names a principle, not a field composed of those procedures
([ONT-D4](https://github.com/christian-bick/edugraph-ontology/blob/v0.24.1/docs/descriptors.md#ont-d4--define-the-educational-meaning-and-its-boundaries),
[ONT-S1](https://github.com/christian-bick/edugraph-ontology/blob/v0.24.1/docs/structure.md#ont-s1--partof-organizes-constituents)).

Do not blanket-convert the three edges to specialization. For example, finding the common
denominator 12 for `1/4` and `1/6` need not show any equivalent fraction pair, and the two supplied
fractions are not equal. Likewise, finding the common numerator 6 for `2/5` and `3/7` does not
assert equality between those fractions. Simplification does produce an equivalent fraction,
but organizing it as a strategy avoids conflating a method with the principle it uses. Any later
progression refinement is a separate decision; keep the existing FactorsAndMultiples edges.

All three children have no structural descendants. Both the old and new parent are directly
under FractionArithmetic. The move introduces neither a mixed-child parent nor a
specialization-to-composition transition. It changes structural ancestry, not specialization.
Actual annotations must still be audited after canonical regeneration.

### Verification and separate implementation finding

- `check:generator-view-specs` passes; focused tests pass **22 files / 70 tests**.
- A temporary probe resolves all 19 current CCSS/test paths over 20 fixed seeds: **380 mathematical
  draws / 760 question-and-solution server renders**, with coherent equalities and no render errors.
  This is not canonical pixel validation or live VQA.
- The probe also confirms a separate payload-totality defect (`SPEC-V6`): a synthetic proper-fraction
  Formalization target with ArabicNumerals matches `fractions-whole-equivalence`, whose declared
  input is the complete union but whose runtime validator accepts only the whole-number member.
  All current active targets avoid this combination. Track the contract correction in
  [payload-family matching](payload-family-matching.md#broader-adoption-in-order), independently
  of the ontology correction; do not repair it by altering the meaning of FractionEquivalence.
- Canonical review must also check the classification number-line question's literal "same point"
  caption: it may disclose the requested equivalence verdict (`IMPL-V5`). Successful server
  rendering and a structural ontology correction do not settle that visual evidence question.

Temporary evidence: `temp/fraction-equivalence-review/report.json`, representative question/solution
HTML in that directory, and `temp/fraction-equivalence-review{,-tests,-contracts}.log`.

### Batch 11: release and adoption evidence

- The supplied ontology Docker build and GitHub release workflow passed. All eight published
  assets were verified, including matching Turtle sources, RDF relations, archive integrity,
  and package versions. Both published clients pass their relation suites (14 Python tests).
- Exact source comparison with v0.24.1 confirms only three parent replacements. Five generated
  relation records change: the three procedures plus FractionEquivalence and FractionStrategies.
  All 744 identifiers, definitions, specialization ancestry, progression relations, and constraints
  remain unchanged. The complete structural graph has 737 nodes / 729 edges and no ordering,
  mixed-child, or cycle violations.
- Before/after replay preserves all **681 CCSS targets / 829 matched paths** and
  **559 test targets / 691 matched paths** exactly. Three fixed seeds per path give **4,560
  resolved configurations** with identical generator configuration, view configuration, and
  complete pair-derived labels.
- Composition-parent candidates decrease from 11 to **2 CCSS targets**, and from 8 to
  **2 test targets**. All four remaining occurrences use ShapeEquivalenceRelations. This is
  a source-target result, not a refreshed count of stored image annotations.
- `npm run test:coverage` passes **460 files / 2,518 tests**, with 96.31% statement and
  92.84% branch coverage; all generators meet their thresholds. `check:affected` passes types,
  generator/view contracts, labels, docs, and CCSS validation. Separate test-spec validation
  passes all 559 targets and verifies coverage of all 87 generator modules.
- Canonical regeneration, image review, VQA, and cache freshness remain pending for the cleanup
  batches. Neither this ontology patch nor its adoption changes generator/view source or targets;
  the separate fraction payload-domain and classification-caption findings remain open above.

Temporary evidence: `temp/ontology-v0242/semantic-review.json`, published-package checks in
that directory, `temp/ontology-v0242-adoption/{before,after,delta}.json`, and
`temp/ontology-v0242-adoption-{coverage,check,test-spec}.log`.

## Batch 12: equal shares through a constructed witness

Source refactor, canonical generation, and all four CCSS VQA judgments completed successfully
on 2026-09-10 with ontology v0.25.0. The broader cleanup's three view repairs also pass revalidation.

### Approved semantics

The [2.G.A.3 standard](https://www.thecorestandards.org/Math/Content/2/G/) asks learners to
recognize that equal shares of identical wholes need not have the same shape. This is a
possibility claim: one valid construction establishes it. It is not a claim that every pair
of equal shares must differ in shape, nor that equal area implies congruence or similarity.

The approved ontology release adds the JustificationScope field, including ProofMethod and its
ProofByConstruction specialization. The content now uses:

- Generator: ShapeDecomposition + EqualShares, and the selected Circle or Rectangle.
- View: ConceptDerivation + ProofByConstruction.
- CCSS and smoke targets: the conjunction of those claims.

The earlier EqualAreaRelation/DifferentlyShapedShares proposal was rejected and is not an
outstanding ontology request. ShapeEquivalenceRelations remains an organizational field for its
existing geometric relations; this task no longer claims it. No new theorem-specific Area is
needed. ProofByConstruction belongs to the view because the same partitions could instead be
shown without asking or establishing a possibility claim.

The question asks, “Can equal shares of identical wholes have different shapes? Explain using
these pictures.” The solution relates the displayed instance to that conclusion. Within each
whole a half-turn exchanges its two pieces, establishing equal area; across the two partitions
the pieces have different forms. It does not manufacture a false universal statement merely to
label its refutation as DisproofByCounterexample.

### Contract and consumer adoption

The generator no longer emits unsubstantiated comparison strings or reads Area enum values.
Its schema reuses the exact shape mapping, and its plain configuration selects a mathematical
whole and two partition boundaries. Rectangles use a median and a diagonal. Circles use a
diameter and a centrally symmetric two-segment cubic boundary.

| Payload field | Disposition | Use |
| --- | --- | --- |
| `whole` | Canonical mathematical object | One rectangle's dimensions or one circle's radius defines both identical wholes. |
| `boundaries` | Structured mathematical evidence | Two partitions in origin-centered mathematical coordinates prove the equal-share construction. |
| Removed comparison strings | Replaced by evidence | Equality and contrasting form follow from the actual boundaries rather than assertions. |

No pixel coordinates, SVG paths, prompt, chosen unknown, or answer prose enters the payload
(`IMPL-G1`, `IMPL-G4`, `IMPL-G8`). The view transforms those coordinates to pixels, draws the
two wholes, and owns the question and explanation (`IMPL-V8`, `IMPL-V11`).

| Production consumer | Target families | Adoption | Verification |
| --- | --- | --- | --- |
| `shape-partition-equivalence` | Two 2.G.A.3 circle/rectangle permutations | Render supplied whole/boundaries; ask for and explain the possibility witness. | Generator geometry tests, view mode/geometry tests, matching diff, canonical images and VQA. |

This is the only production consumer. The isolated test spec retains both shape paths.
There is one learner action, an empty view schema, and no required/rejected labels; no matcher
extension or split view is indicated (`SPEC-V6`, `IMPL-G6`, `CHK-V6`).

### Verification

- Published `edugraph-ts` v0.25.0 is pinned in package.json and package-lock.json.
- Focused generator/view tests: **4 files / 12 tests**, passing. Tests check rectangle bisection,
  disk containment, half-turn symmetry, the nonstraight curved divider, actual payload rendering,
  strict malformed-geometry rejection, deterministic rendering, and question/solution separation.
- Type checking passes.
- Complete CCSS matching stays at **681 targets / 829 paths**. Only the two intentional
  label-set hashes change; each retains its one original pair. No unmatched target or unrelated
  match change appears.
- [x] Release and adopt the approved justification context.
- [x] Migrate the mathematical payload and its sole production consumer.
- [x] Adopt target claims and review the full matching delta.
- [x] Finish full tests, canonical generation, visual review of the four equal-shares images,
  and the fresh annotation audit.
- [x] Obtain approval for the exact changed PNG/prompt set and complete Gemini VQA for this batch.
  Both shapes in both modes pass with their complete ProofByConstruction claim.

Temporary evidence: `temp/spec-plans/ccss/equal-shares-construction/`,
`temp/equal-shares-consumers.log`, and the validation records added below.

### Canonical artifact evidence before live validation

- Full suite: **461 files / 2,522 tests**, all passing. Overall statement/branch coverage is
  **96.31% / 92.83%**; the changed generator has **100% / 100%**. Every generator passes its
  coverage thresholds. `npm run check` passes all six gates, including both split audits.
- Strict architecture audit: **681 CCSS targets / 829 matched paths**, zero violations.
  The 95 reported review items are not newly classified violations.
- CCSS affected generation: **1,944 images**, no generation or render failures; 220 immutable
  shards reused and 59 written. Generation id:
  `317814423d2e978ec08eff55f91b3a6262a22a8c28b7a83abc7f8aebcb3501bd`.
- Test full baseline: **1,686 images**, no generation or render failures. Generation id:
  `7c0b9ee71ed7562fd2140dd861e1eefad8ec66f95954caf3d8207affb9657ee4`.
- Direct annotation audit: **0/1,944 CCSS images** and **0/1,686 test images** use a composition
  parent. Source audits likewise find **0/681 CCSS** and **0/559 test** target occurrences.
  These are structural checks, not substitutes for VQA evidence.
- Relative to the old 1,878-image CCSS snapshot, 1,436 sample identities survive, 508 are added,
  and 442 removed by the accumulated cleanup. Of surviving identities, 1,422 keep identical
  pixels. Thirteen changed comparison samples follow the previously documented removal of a
  redundant random fallback draw. The other changed sample is a measurement word-problem
  validation draw whose successful attempt changes from 1 to 2 after train-content changes.
- Visually inspected all four revised CCSS equal-shares PNGs: both constructions, the question
  without its conclusion, and the solution's equal-area argument and possibility conclusion.
- Offline VQA audit verifies current graph freshness and all 1,944 image identities: **zero
  dataset-structure or renderer-identity issues**. Exact passing coverage is **1,380/1,944**;
  there are **564 missing keys**, **492 stale records**, and one obsolete module cache
  (`angle-concepts`). There are no failing, malformed, or duplicate cache records. This is an
  incomplete VQA gate, not a passed audit. A full authorized live run must validate the misses,
  prune obsolete output, and be followed by the strict offline audit.
- `report:churn` is unchanged because no VQA cache was mutated. The independent image-digest
  comparison above describes actual artifact changes; a zero cache diff does not imply zero
  image changes.

Temporary evidence: `temp/observable-cleanup-final/{before,after}-summary.json`, its per-spec
records, `temp/equal-shares-{coverage,check,architecture,generation,test-generation,vqa-audit,churn}.log`.
The first container snapshot attempt overlapped temporary coverage writes and failed before
generation; retrying after the test process finished completed successfully without source changes.

### Live validation and focused view repairs

The user approved uploading the 564 uncached canonical CCSS PNGs and their complete prompts.
The full run reused 1,380 exact passing records and obtained 560 passes and four failures.
It also pruned the 492 obsolete records and removed the obsolete `angle-concepts` cache file;
the committed versions remain recoverable through Git. The timestamped report preserves the
original judgments, including failures.

| Finding | Resolution | Changed CCSS images |
| --- | --- | ---: |
| Component-angle inversion solution omitted its generator-owned Addition witness. | Show the existing numeric addition relation alongside the inverse subtraction (`IMPL-V11`). | 2 |
| Circle drawing used a near-closed arc with the wrong center and no observable turn. | Draw two exact semicircles; show a moving boundary mark and turn arrow for rotation conservation. Leave the question response blank. | 3 |
| Fraction ticks on dense line plots used 9px text; Gemini misread several correct labels. | Use 14px labels, checked on both the 17-tick eighth and 25-tick quarter axes. | 12 |
| Gemini reported a missing digit in a correct large-integer division. | Manual inspection confirmed `5271685800394752 ÷ 2635842900197376 = 2`; one recheck of the exact unchanged image and complete prompt passed. Both judgments are retained in diagnostic evidence. | 0 |

No generator, payload contract, target, spec, checklist, or ontology definition changed in these
repairs. Full tests pass: **463 files / 2,536 tests**. Focused view tests cover both angle operations,
both unknown components, question/solution behavior, bounded closed-circle geometry, visible
rotation evidence, deterministic rendering, and the complete fraction tick sequence. Repository
checks pass. All 17 revised CCSS PNGs were inspected directly, including both modes and the
densest fraction labels; the subsequent Gemini gate is recorded below.

Affected canonical regeneration completed without generation or render failures:

- CCSS: 40 images scheduled, **17 changed**, 274 shards reused and five written; all other
  image hashes are unchanged. Current generation:
  `7ca35901a5f2f1c28399d3af5558edba4fb5d554cf0fbf8c7bc04e6e38af0684`.
- Test: 30 images scheduled, **11 changed**, 269 shards reused and four written. Current generation:
  `efc25e82e5983a5516b47012ebdb00591312ab93bfc19259a5a5d5bcd1f7ead7`.
- Both snapshots preserve their sample identities, seeds, attempts, and exact annotation sets.
  Composition-parent annotations remain zero. The isolated test snapshot has not received live VQA.
- Before revalidation, the CCSS offline audit confirmed graph freshness and zero dataset-structure
  or renderer-identity issues, but coverage was **1,927 passing and 17 missing**. Its 17 stale
  predecessor keys were pruned by the authorized live run, not by the read-only audit.

- [x] Obtain approval for the 17 revised CCSS PNGs and their complete VQA prompts.
- [x] Validate the revised set, require the full offline audit to pass, and record final cache
  churn and split integrity before rebuilding the union.

Temporary evidence: `temp/validation-reports/dataset-ccss/2026-09-10T19-42-17-982Z__full.md`,
`temp/observable-cleanup-final/division-single-recheck.json`, the `*-view-fixes.json` records in
that directory, and `temp/observable-cleanup-fixes-{tests,check,generation,test-generation,audit}.log`.

### Completed artifact gate

- The authorized 17-image run reused 1,927 passing records, obtained 16 new passes, and flagged
  one validation-split line plot. All repaired angle and circle images passed.
- The remaining judgment read the pencil's `3¼ in` as `3¾ in`. Exact seed replay, the unchanged
  content fingerprint, formatted measurement, tick counts, and inspected PNG all agree on 3¼.
  One recheck of the same PNG and complete prompt passed, explicitly identifying 3¼. Neither
  evaluator instructions nor content was changed to obtain this judgment. Both results remain
  in the timestamped report and `line-plot-single-recheck.json` diagnostic evidence.
- Final strict offline audit: **1,944/1,944 passing**, zero uncovered images, structure or renderer
  issues, and zero failing, missing, stale, duplicate, malformed, or obsolete-module records.
  It reconstructed current graph expectations and verified all 1,944 canonical image digests.
- Final `check` and CCSS split audit pass. The complete unchanged test suite remains at
  **463 files / 2,536 passing tests**. The isolated test dataset remains outside live CCSS VQA.
- Final cache churn against HEAD: 1,419 stable identities, 17 changed images, 508 additions,
  and 442 removals. The 17 comprise the previously explained 13 comparison changes, one
  arithmetic validation draw, and three repaired circle images; two are attempt shifts and
  none is a seed-scheme change. This older cache baseline differs from the immediate pre-repair
  snapshot, against which exactly the 17 images in the repair table changed.
- The derived local union was replaced from the validated CCSS snapshot: **1,630 training +
  314 validation images**, with no exercise lost in merge. It is reproducible from the source
  snapshot. No dataset release, tag, or remote publication is part of this validation completion.

Final evidence: `temp/validation-reports/dataset-ccss/2026-09-10T20-00-14-587Z__full.md`,
`temp/observable-cleanup-final/line-plot-single-recheck.json`, and
`temp/observable-cleanup-final-{vqa,audit,check,churn,splits,merge}.log`.
