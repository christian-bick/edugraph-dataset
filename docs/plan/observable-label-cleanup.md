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

### Fraction-partition review: decisions before implementation

The existing payload already separates a partition, a selected region, and a share comparison.
These are candidates for precise generator output families, with the existing six task views
sharing their renderer. That structural refactor does not settle these semantic choices:

| Current use | Observable evidence | Resolution candidate |
| --- | --- | --- |
| Grade 1 FractionInterpretation + ActiveVocabulary | A highlighted equal share is named half, fourth, or quarter, without written fractions. | Review NumberNameNotation + UnitFractions: its current definition covers written words for numerical values, so this may already express the naming task. Confirm that the part/whole meaning is preserved before considering a new Area or broader denominator-interpretation definition. Current numerator/denominator definitions explicitly refer to the top/bottom numbers. |
| Grade 1 FractionInterpretation + ConceptComposition | Separate halves or fourths are assembled into one whole. | ShapeSynthesis + EqualShares describes the composition; retain the fraction context without claiming written-notation interpretation. |
| Grade 3 ProportionSense + partition/label | Equal-area partition with an explicit 1/b label. | ShapeDecomposition plus FractionDenominatorInterpretation and the view's notation capability; check the full target conjunction. |
| Grade 3 ProportionSense + FractionNotation + Interpretation | A highlighted a/b region is written as a fraction and related to equal parts. | The existing numerator/denominator interpretation Areas are direct candidates. No generic proportional-reasoning claim is needed. |

The old Areas also select denominator ranges: Grade 1 chooses 2 or 4; Grade 3 chooses 2, 3, 4,
6, or 8. Those are real constraints in the tracked 1.G.A.3 and 3.NF.A.1 standard descriptions,
not arbitrary variation. Parameterize the mathematical denominator directly rather than retaining
a grade/task-Area switch. HalfFractions, ThirdFractions, QuarterFractions, and EighthFractions
already exist; SixthFractions does not. Request the missing denominator context before claiming
complete explicit coverage; do not drop sixths or use an unrelated number range.

Keep this review separate from the already tracked Circle / FractionEquivalence ontology structure
questions. The two angle-concepts FractionInterpretation usages also need a later evidence review;
they are not changed by the shape-construction extraction.

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
  task identity to views, and separate generator output families (Batch 5; canonical validation pending).
- [ ] Review `ProportionSense` and `FractionInterpretation` against their concrete constituents.
- [ ] Resolve the ontology modeling questions around `Circle` and `FractionEquivalence`:
  both describe directly observable content despite currently having composition children.
- [ ] Review `ShapeEquivalenceRelations` for equal-area partitions. Equal area does not imply
  congruence, similarity, or symmetry; do not choose an existing child that changes the claim.

### Next contract reviews

These are not safe global label substitutions. Review the mathematical payload and view
applicability before modifying targets or adding ontology entities.

1. **Unit conversion (resolved in Batch 5):** seven concrete unit pairs establish magnitude or
   factor scaling; abstract segment counts use a separate precise payload family. `UnitConversion`
   was not substituted: its definition concerns different unit systems, unlike several current
   within-system scaling examples. Complete canonical validation before closing the artifact gate.
2. **Measurement line-plot arithmetic (resolved in Batch 6):** plain observations and extrema
   arithmetic have precise separate contracts. The arithmetic view requires its relation through
   the payload type, with Addition/Subtraction as the actual operation claims.
3. **Shape construction (grouping use resolved in Batch 7):** edge composition no longer needs
   ShapeIdentity or a generator-owned assembly task. The remaining attribute/rotation/subsumption
   branches retain their current behavior and are tracked by the separate payload-family plan.
4. **Fraction partitioning (reviewed, awaiting decisions):** resolve the verbal share-naming
   meaning and missing sixth-denominator context described in Batch 7, then replace the Area-driven
   branches with explicit partition/selected-region/comparison families and denominator choices.

### Ontology questions to review with the user

- **Circle:** a whole circle is directly observable even though semicircles and quarter circles
  are its composition children. Replacing a whole-circle claim with either child is false.
- **FractionEquivalence:** an equivalence such as `1/10 = 10/100` does not necessarily demand
  simplification or least-common-denominator/numerator procedures. Review the placement of
  those procedures relative to the equivalence principle.
- **ShapeEquivalenceRelations:** the equal-area partition tasks need an equal-area claim, not
  congruence, similarity, or symmetry. Review whether a suitable constituent is missing.

The 31 remaining targets span these contract and modeling reviews; they are not
31 proven false annotations. Eligibility under the proposed structural rule and truthfulness
of the current content claim remain separate questions.
