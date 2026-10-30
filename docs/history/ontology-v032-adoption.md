# Ontology v0.32 candidate adoption

The original adoption and dataset results below are historical evidence from
2026-10-26 on `feat/adopt-v0.32`. They do not certify the later label-dependency branch
or its current dataset. The [branch integration](#branch-integration-2026-10-30)
records adoption of the newer pinned preview and the separate committed-source checks.

This migration starts from dataset commit `2e08f3654d30cc1567f701c4bc78b1b68f60d568`
on `feat/adopt-v0.32`, with the stable ontology `0.31.0`. The baseline strict audit passes
all 2,808 samples. CCSS is the only production standard.

The implementation follows the ontology's
[v0.32 dataset handover](https://github.com/christian-bick/edugraph-ontology/blob/9231304124e921da34b9fa8724f195da5b1cbbf6/docs/releases/v0.32.0-dataset-adoption.md).
This is a preview adoption, not adoption of a final stable v0.32 package or dataset publication.

## Exact package provenance

The latest published preview inspected on 2026-10-26 is
[`preview-0.31.0-pre.58.9231304124e9`](https://github.com/christian-bick/edugraph-ontology/releases/tag/preview-0.31.0-pre.58.9231304124e9),
published at 12:50:47 UTC from ontology commit
`9231304124e921da34b9fa8724f195da5b1cbbf6`. Its version prefix still reflects the last
stable release even though it contains the v0.32 candidate changes.

`package.json` and `package-lock.json` pin the exact published `edugraph-ts.tgz` asset;
the installed package reports `0.31.0-pre.58.9231304124e9`. No unrelated dependency changes
are included. The release asset SHA-256 is
`b8fcc2e574e42c4653c97ee628e7c1375f83d86e61a0ac7fccea9bebe2c19ac7`.
The lockfile integrity is
`sha512-snC/MUxbSmh8rfYOZj7/HbUo7aVRs6AqhiuLYvUkWm/uivw2iP1Wg3AzkxrIP8UGPfukRn6/QSLqfixtfPeCzA==`.

An independent library/source comparison confirms 1,441 → 1,489 descriptors and
7,668 → 7,934 assertions: exactly 23 renames, one retirement and 49 new descriptors
(40 eligible, nine organizers). The only retained-concept eligibility changes are
`DivisibilityRules` becoming an organizer and `FunctionSlope` becoming eligible. All 23
changed definitions and 16 changed comments match the handover inventory. Every installed
assertion equals the parsed authored source at the release commit; none is missing or extra.
The four authored ontology sources are unchanged between the guide's semantic baseline
`337e1ec8b3fc06094a8ace4deb356ca2d793fa01` and this preview commit.

## Identifier dispositions

All eight used rename sources migrate across live targets, capabilities, implementation
constants and tests. Their changed target hashes are recomputed by the existing builders;
test fixtures now expect the new hashes. Historical records retain their source-version names.

| Previous identifier | Candidate identifier | Live-source disposition |
| --- | --- | --- |
| `AffineDependence` | `AffineExpressionDependence` | Unused |
| `AlgebraicDependence` | `ExpressionBasedDependence` | Unused |
| `AngleConcept` | `Angle` | Migrated |
| `ArchConcept` | `Arc` | Migrated |
| `DecimalPrecission` | `DecimalPrecision` | Migrated |
| `ExponentialDependence` | `ExponentialExpressionDependence` | Unused |
| `GeometricConcepts` | `GeometricFoundations` | Unused organizer |
| `IntervalsWithInfinity` | `UnboundedIntervals` | Unused |
| `LineConcept` | `Line` | Migrated |
| `MeasuringVolumes` | `MeasuringVolume` | Migrated |
| `NumerationWithIntervals` | `NumberIntervals` | Unused |
| `OddAndEvenNumbers` | `ParityTest` | Unused |
| `PlaneConcept` | `Plane` | Unused |
| `PointConcept` | `Point` | Migrated |
| `PolynomialDependence` | `PolynomialExpressionDependence` | Unused |
| `QuadraticDependence` | `QuadraticExpressionDependence` | Unused |
| `RationalDependence` | `RationalExpressionDependence` | Unused |
| `RayConcept` | `Ray` | Migrated |
| `SlopeConcept` | `Slope` | Unused |
| `SpaceConcept` | `Space` | Unused |
| `SpatialModelling` | `SpatialModeling` | Unused |
| `VectorConcept` | `Vector` | Unused |
| `ZeroConcept` | `Zero` | Migrated |
| `ComputationalMathematics` | Retired without replacement | Unused |

No compatibility aliases or synthetic replacement descendants are introduced.
`DivisibilityRules` is not a live annotation; its organizer transition requires no source
relabeling. `FunctionSlope` has no current task use. The nine new organizers remain excluded
from direct capabilities and annotations under [SPEC-3](../spec-general.md#spec-3--most-specific-does-not-mean-leaf).

## Reviewed meanings and existing-task refinements

- Collection parity retains `EvenDivisibility` / `UnevenDivisibility` and independent even/odd
  Scopes. Its view renders complete pairing/equal groups with zero or one leftover. It does
  not assert numeric division or a quotient.
- Exact/remainder division already uses integer dividends, positive integer divisors, and
  Euclidean zero/nonzero remainders. No live `DivisionOfCollections` claim needs removal.
- Circular-solid drawings use circular-base projections; composition geometry uses positive
  radii. Broad `Cone` / `Cylinder` annotations remain justified. No automatic right/oblique
  refinement is added.
- The six polyhedral-net families retain `GeometricNet`; the revised right-cylinder example
  does not change their mathematical content.
- Numerical expression evaluation and candidate checks now declare `NumericSubstitution`
  rather than its broader `AlgebraicSubstitution` parent, following
  [SPEC-2](../spec-general.md#spec-2--declare-the-most-specific-label-that-is-still-true-and-never-its-ancestors).
  Three generators and eight existing Grade 6 target permutations adopt it. Tests prove that
  the broader request still matches through specialization while emitted labels stay specific.
- The existing percent-of-quantity and reference-whole tasks add `PercentageRateApplication`.
  Both give a nonzero rate and visibly apply or invert its factor. Their independently evidenced
  `PercentageEquivalence` and `ProportionalScaling` claims remain; they are not ancestors of
  the new descriptor. `PercentageRateDetermination` is not claimed because the rate is given.
- `IteratedOperation` and its equal-addends constraints remain unchanged, as required by the
  handover. No parked consolidation proposals are implemented.

The remaining changed definitions have no live task references: `AlgebraicFunctions`,
`AreaIntegration`, `CartesianPlane`, `Cosine`, `DifferentiationRules`, `FunctionRegularity`,
`FunctionSlope`, `FunctionValueProperties`, `GeometricFoundations`, `LowestCommonNumerator`,
`MatrixSystemRepresentation`, `MidpointCalculation`, `NumberIntervals`, `PolarAreaIntegration`,
`RationalExpressionDependence`, `Sine`, and `Tangent`. They remain ontology vocabulary, not
invented coverage requirements. All seven authored `ontologyTodos` exports are empty.
Other new set, graph, advanced function, counting and linear-system vocabulary does not
unblock an existing ontology TODO. Existing specific laws and statistics descriptors remain
more precise than their newly available generic ancestors.

## Matching and identity review

The complete normalized comparison retains all 1,013 targets with identical dispositions.
There are 36 replaced target IDs: 26 from mandatory identifier renames, eight from numeric
substitution refinement, and two from the percent claim. All map one-to-one; no competency is
added or dropped. Matched tuples increase from 1,179 to 1,180, with no lost pair.

The additional pair is `area-decomposition#area-rectilinear-decomposition` for
`6.G.A.1-polygon-area-dissection~453d1ccf`. Rectangles now specialize inclusive `Trapezoid`
through `Parallelogram`. The task explicitly decomposes a rectilinear figure into rectangles,
shows their dimensions, and calculates their areas. Its rectangular constituents provide
observable evidence for the broader involvement claim; it does not assert that the whole
L-shaped outline is itself a trapezoid. No exclusion is warranted.

There are 38 changed common pair-plan hashes, 37 on replaced IDs. The remaining retained
target is `4.MD.C.6-measure-angles~33195220`: its invariant emitted `Angle` label changes
even though the target requests `AngleCalculation`. This output annotation must migrate too.

Snapshots and normalized comparison diagnostics are under
`temp/spec-plans/ccss/ontology-v032-adoption/` and `temp/v032-adoption/`.

## Verification

Full repository checks, final type checking and the strict label-architecture audit pass:
1,013 normalized targets, 364 compatible pairs, 1,180 matched tuples, zero architecture
violations. The rebuilt preview coverage snapshot and its authoritative validation pass,
with 213 of 467 standards covered. The existing canonical-tree cluster warning is unchanged.

The complete coverage gate passes all **5,938 tests in 829 files**, including integration tests,
using two Vitest workers. Generator statement coverage is **98.46%**, branch coverage
**96.96%**, and every generator meets its required threshold. In addition to migration
fixtures, regressions cover numeric specialization, percent task matching, organizer eligibility,
changed relation boundaries and the additional rectangle/trapezoid match. The polygon-area
Ability-neutrality test now uses actual production plans rather than a legacy diagnostic
fallback that merged newly related exact shape alternatives.

Canonical `generate:dataset -- --spec=ccss --rebuild-graph` reconstructs the complete graph,
selects 336 affected generator/view pairs, and renders 2,766 images. Content addressing
reuses 270 shards and writes 230. The final snapshot contains **2,808 images in 500 shards**,
with 2,332 training and 476 validation rows; the baseline had 2,330 and 478 respectively.

| Comparison with the preserved baseline | Count |
| --- | ---: |
| Retained sample identities | 2,718 |
| Retained images with identical bytes | 2,680 |
| Retained images changed by the visual repairs below | 38 |
| Removed sample identities | 90 |
| Added sample identities | 90 |
| Retained seed or attempt changes | 0 |
| Retained samples with changed annotations | 2 |

The two retained relabeled samples are the protractor question and solution described above.
Their pixels remain identical. Relabeled target identities deliberately change seeds and split
allocation. Retained pixel changes are confined to the explicit visual repairs below; no
retained artifact changes its seed or winning attempt.
No removed identifier or ineligible annotation remains in current metadata.

The image audit finds zero duplicate groups or errors. Split integrity passes: every one of
the 1,180 matched tuples has training evidence, with no train/validation content leakage or
duplicate configured task. There are 54 allocated-tuple validation gaps, compared with 55
before migration; these remain warnings under the existing small-content-space split policy.

No metadata, manifests or cached judgments are rewritten by hand.

### Visual defects found by fresh VQA

The initial migration evaluates 160 current keys and reuses 2,648 passing judgments.
There are three final LOW/HIGH failures, with zero request errors: the line-drawing solution
and the rectangular-net question/solution. The defects belong to rendering and one local
checklist, not the mathematical declarations.

- SVG markers in the shared primitive renderer implicitly scale with stroke width, making
  nominal six-unit arrowheads 19.2 units wide in the solution. Explicit `userSpaceOnUse`
  marker units restore their intended size. Triangle bases anchor at the shaft endpoints so
  sharp tips extend beyond the rounded shaft caps. Angle labels also move clear of arrow tips;
  mathematical points, strokes and claims stay the same. A geometric SVG regression checks
  arrow/label clearance across all nine primitive guides and completed scenes.
- Net surface-area captions refer to triangle heights and dotted supporting-line extensions
  even when those markings do not appear. Captions now depend on the actual displayed face
  types and exterior altitude feet. Rendered regressions cover all-rectangle, all-triangle and
  mixed-face nets in both modes and both area leaves.
- The plain net-area checklist incorrectly requires a "rectangle-and-triangle" net, excluding
  valid cube/prism and tetrahedron nets already supported by its contract. Its identity now
  admits rectangular and/or triangular faces while retaining complete nets, once-only external
  face counting and correct perpendicular triangle heights. This is an evidence-backed
  [CHK-V6](../checklist-view.md#chk-v6--keep-one-minimal-observable-contract-per-view)
  correction; the central checklist, label policy, evaluator and pass/fail rules are unchanged.

The initial failure report is preserved at
`temp/validation-reports/dataset-ccss/2026-10-26T13-34-53-073Z__full.md`.
The repairs use the normal affected canonical generation and validation path; no failed
judgment is manually converted into a pass and no matching path is suppressed.

Affected regeneration renders 66 images across six pairs for the batched repairs, followed
by 36 geometry images for the final arrow-tip refinement. Compared with the initial migrated
snapshot, exactly 46 images change: 12 primitive drawings, 18 primitive-identification images,
six plain net-area images and ten net-area story images. There are no repair-related changes
to identities, annotations, mathematical plans, input hashes, target associations, seeds,
attempts or splits. Eight of these repaired images have newly migrated identities; the other
38 explain every retained pixel change against the original baseline.

Direct inspection covers 20 migration images, eight repaired net images and the final line,
right-angle and obtuse-angle solutions. Arrow tips and labels are clear, captions describe
visible features, and question/solution behavior remains correct. Exterior triangle altitude
feet are covered by a rendered independent fixture because the current canonical samples
do not draw that case.

### Final artifact verification

The final live validation passes **2,808/2,808 samples**. The strict read-only audit independently
confirms complete current-key passing coverage, zero missing/stale/failing/duplicate/malformed
records, no missing-label dependencies, canonical renderer identity and image integrity.
The final churn report confirms 90 added and 90 removed identities, the 38 explained retained
render changes, and zero seed or attempt shifts.

The final canonical generation is
`c785a210b0c3563a2c3be699b1419d2595dfb083aa260c6a38fda635f56bb564`.
The final passing live report is
`temp/validation-reports/dataset-ccss/2026-10-26T13-46-38-605Z__full.md`.

Against the stable baseline, the final cache has 182 fresh records: 90 new identities and
92 retained identities with changed validation keys. All 2,626 reused judgments, timestamps
and review histories remain unchanged. Of these, 1,532 complete records are byte-identical
and 1,094 refresh only the plan's input provenance. Fresh final judgments comprise 178 LOW
passes and four independent HIGH passes, with no uncertain fresh labels. Seven pre-existing
uncertain passing samples retain their original judgments under the unchanged policy.

The union rebuild contains 2,808 PNGs and passes its byte audit with zero duplicates or
errors. The generated asset index validates all 1,013 exact target label sets with 2,823
sample associations; shared evidence explains the difference from physical-image count.
`v0.32.0-preview-adoption` is only the prospective revision used in this local validation
index; it is not a created release tag. The local explorer snapshot is refreshed against
the final images and annotations.

The application build, full repository check, strict architecture audit, complete coverage
suite, strict dataset audit, image/split/churn checks and exact asset-evidence validation all
pass. Validation applies to the migration working tree on `feat/adopt-v0.32`, based on the
dataset commit recorded above. No final migration commit or dataset release is created by
this work. Promotion to stable v0.32 still requires pinning its eventual final published
package and following the normal dataset release workflow.

## Branch integration (2026-10-30)

The pending migration is integrated on `codex/label-dependency-audit`, following source
commit `661f5e453189cc5f6b4123b0fd9a049ea1812107`. That commit already pins
`edugraph-ts` **`0.32.0-pre.1.00409a39c911`**, from ontology commit
`00409a39c911`, rather than the older preview used by the historical dataset run above.
The exact installed version agrees with both manifests; its lockfile integrity is
`sha512-8r5icjE1wcIiNcnTLQ63W8oev2oMxB7RybblCrecv6+KLykTul4E00gDTf4Bv0bQbpLtIvSxc95tDD6G1PqPeg==`.
No dependency repinning is needed for this integration.

The review covers the eight used identifier renames, the three generator refinements to
`NumericSubstitution`, the two percentage-application claims, updated target identities,
and the geometry/net visual repairs described above. Broader algebra-substitution view
guards remain valid through specialization. Ontology regression tests assert the adopted
capability directions and organizer eligibility. The label-dependency Area allowlist,
algebra sign/zero cutoff, range-policy exclusion and annotation-only inference contract
are preserved.

Historical VQA cache changes are reviewed as records from the earlier migration. They are
not renewed judgments for the current source and are not evidence of current dataset
acceptance. This integration performs no dataset regeneration or external VQA requests.

The review of the preceding committed source found 85 TypeScript errors across 33 files:
the dependency pin was present, but its required identifier migrations were still only
in the working tree. Validation of the integration therefore uses a fresh archive of the
commit, with the exact installed locked dependencies and without the working tree's
generated dataset or source files. The committed-source gate consists of repository
checks, the full coverage suite, application build, strict label-architecture audit, and
a source dependency audit that inspects resolved omissions separately from strict exit
status. Stored-dataset acceptance remains a later regeneration/VQA step.

## Stable v0.33.0 adoption (2026-10-30)

**Status: stable pin, repository checks, full coverage and dataset verification pass.**

The stable [release `v0.33.0`](https://github.com/christian-bick/edugraph-ontology/releases/tag/v0.33.0)
was published on 2026-10-30 at 22:48:52 UTC from ontology commit
`b0d81eed9b3dc3f9f9a1799b9b080151d36bd8f5`. Its only source change from parent
`00409a39c911fa79adb911bf6b724a9d34473588` is the release note. The tag workflow passed;
all eight published assets were downloaded and matched their GitHub SHA-256 digests, and
the four Turtle assets match the tagged source. The dirty sibling ontology working tree
was not used as the package source.

The content baseline is `f665267ff18da0cf5499bc5afa18cef4d4fa87dc`. Its installed package,
complete ontology records, classifier involvement text and eligibility, generated enum
mappings, CCSS usage closure, stored sample identities and VQA cache hashes are retained
under `temp/stable-ontology-pin-2026-10-30/`. The baseline contains **1,491 descriptors**,
**7,626 semantic relation records**, a CCSS closure of **420 roots / 603 entities /
603 structural relations**, and **2,918 stored samples**.

Both dependency manifests pin the exact published
[`edugraph-ts.tgz`](https://github.com/christian-bick/edugraph-ontology/releases/download/v0.33.0/edugraph-ts.tgz)
asset, and the installed version is `0.33.0`. The asset SHA-256 is
`18ae5de668b1ac1fc96f4bcfbf27c446108e13e3f68c99a10cb3e932a0c6183f`.
The lockfile integrity is
`sha512-Ma4ri3BpB6uvx95qVtpW5e6aiTTSAC7vFh4RNWOFzQ9dChzXxL/mnHpK7VK6UJ7T8WY1MIJ8Ycs99YqU56MiQw==`.
The dependency URL, lock resolution/version/integrity and installed package agree.

Comparison with the retained installed preview finds **zero entity, relation, descriptor
text, eligibility, enum or CCSS-closure differences**. There are no runtime file changes.
Only package metadata and the packaged
[v0.33.0 release note](https://github.com/christian-bick/edugraph-ontology/blob/v0.33.0/docs/releases/v0.33.0.md)
differ. The full package comparison is
`temp/stable-ontology-pin-2026-10-30/candidate-comparison.json`; installed provenance is in
`installed-stable-pin.json` in the same directory. Published-release checks are retained
under `temp/ontology-stable-release-2026-10-30/`.

| Evidence | State |
| --- | --- |
| Published stable tag, release commit and asset URL | Verified, including all eight asset digests and the four tagged Turtle sources |
| Asset SHA-256 and lockfile SHA-512 integrity | Recorded above |
| Installed stable version and dependency-manifest agreement | Verified `0.33.0` with the exact published asset |
| Complete entity identities, eligibility, relations, classifier text and enum comparison | Identical to preview `0.32.0-pre.1.00409a39c911`; no runtime changes |
| Repository checks, types and application build | Pass, each exits 0 |
| Complete tests and generator coverage gate | Pass, 906 files / 7,464 tests; every generator meets its thresholds |
| Authoritative graph reconstruction and artifact-preservation comparison | Pass, metadata-only refresh with zero image bytes or shards written |
| Strict current-key dataset/cache audit | Pass, all 2,918 samples have exact passing coverage |

Canonical `--rebuild-graph` publishes snapshot
`b73ff2111380a3f86594a79b9b6087a6f9e7d288a2459721b9b5985502916cb2`.
Only **five non-render nodes** are affected; **16,740 nodes** and **508 shards** are
reused, with **zero shards written and zero image bytes written**. Strict dataset audit
confirms source freshness, canonical image integrity, zero annotation-dependency failures
and exact passing VQA coverage for **2,918/2,918 images**, with no missing, stale, failing,
duplicate or malformed cache records. No new VQA requests were required.

The independent post-pin comparison preserves all **2,918 complete stored rows and actual
PNG files**, all **175 VQA cache files**, all **1,013 target IDs and label sets**, and all
**1,222 matched routes**. Rows include complete plans/replay receipts, annotations,
fingerprints, configuration/seed/continuation data, ownership and associations. The union
merge retains **2,416 training and 502 validation images**; its byte audit passes with
zero errors and the same single warning for redundant copies with identical annotations.

Evidence is under `temp/stable-ontology-pin-2026-10-30/` in
`repository-check-status.json`, `canonical-generation.log`, `dataset-audit.log`,
`dataset-invariance-post-pin.json`, `merge.log` and `union-images.log`.

The complete coverage run passes **906 test files / 7,464 tests**. Generator coverage is
**98.36% statements, 97.05% branches, 100% functions and 99.46% lines**; every generator
passes the existing thresholds. Both test and coverage-check exit codes are zero, recorded
in `full-coverage-durable-status.json` with the complete output in
`full-coverage-durable.log` in the same evidence directory.

This adoption authorizes a dependency/provenance update. It preserves targets, matching
contracts, rendering, sampling, the Area allowlist, the range-policy exclusion and the
existing label-dependency/inference boundaries. It does not publish a dataset release or
change the separately deferred broader zero-label review. Earlier preview provenance and
validation records above remain historical evidence for their recorded source states.
