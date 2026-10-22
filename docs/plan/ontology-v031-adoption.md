# Ontology v0.31 adoption and dataset readiness

This record covers adoption of the stable ontology release after the algebra, analysis,
calculus, number theory, geometry, probability, statistics and combinatorics refinements.
It migrates existing K–5 content; the Grade 6 plan remains a separate curriculum task.

## Baseline and semantic review

The starting content commit is `351ba6fa46641d79f1bc092009384e2205f2d321`, on `feat/grade-06`,
using `0.30.0-pre.10.10a40360f726`. Its 822 normalized production targets generate 2,290
samples: 1,916 training and 374 validation images in 370 immutable shards. The strict
offline audit passes all 2,290 samples before migration.

The new ontology contains 1,441 descriptors and 7,668 authored assertions, compared with
888 descriptors and 4,766 assertions in the installed preview. The source-reference audit
finds no removed identifiers used by this repository. `Statistics` is the only used
production label that becomes organizational and therefore ineligible under
[SPEC-3](../spec-general.md#spec-3--most-specific-does-not-mean-leaf).

The review covers 367 enum-referenced descriptors and all 496 ontology nodes reached by
the existing production graph, including dynamically expanded capabilities and ancestors.
`FactorsAndMultiples` remains eligible. `DistanceAbstraction` remains a structural lookup
root in the unit resolver, not a sample annotation.

Existing coordinate tasks remain valid under the broader spatial definitions of
`PointConcept` and `PointPlotting`. The new circular-sector ancestry of `HalfCircle` and
`QuarterCircle`, number-theory organization and examples, and measurement-tool ancestors
also preserve their current meanings. These changes still participate in graph and VQA
identity; retaining a label does not imply retaining every cached judgment.

## Statistics label migration

| Observable content | Replacement and ownership |
| --- | --- |
| Categorical counts in tables, picture graphs and bar graphs | `FrequencyDistribution`, owned by `statistical-graphs` |
| A length recorded for each named object | `StatisticalVariable`, owned by the three measurement-data generators |
| Repeated measured values grouped in a line plot | `FrequencyDistribution`, owned by the construction, arithmetic and problem-solving line-plot views |

Raw measurement targets use `StatisticalVariable`; graph and line-plot targets use
`FrequencyDistribution`. A raw measurement table need not aggregate observations, so it
does not receive the distribution claim. Conversely, the line-plot views establish that
additional claim through their grouping of observations. This preserves single ownership
across compatible generator/view pairs, including measurement producers whose payloads
extend the shared measurement-data type.

The statistics migration changes labels and their derived target identities, not the
generators' mathematical behavior. Existing regression fixtures adopt the same vocabulary.
Live validation later exposed one independent solution-color defect, repaired below.
The baseline has 128 `Statistics`-labeled samples; ontology changes to
other used definitions or ancestry can invalidate additional artifacts independently.

## Verification and release boundary

[Ontology v0.31.0](https://github.com/christian-bick/edugraph-ontology/releases/tag/v0.31.0)
was published from `1672a72975623663c5b2446d595dca9aeefd75a3`. Its
[release workflow](https://github.com/christian-bick/edugraph-ontology/actions/runs/39710245318)
and full local Docker build pass. All eight release assets are present. The installed
TypeScript package matches all 7,668 source assertions exactly; the lockfile changes only
the ontology dependency and its integrity record.

Full source checks, the application build and the strict label-architecture audit pass:
822 normalized targets, 272 compatible pairs, 972 matched tuples and zero architecture
violations. The matching comparison has 44 replaced target IDs and 52 replaced target/pair
associations. Mapping the intended label substitutions proves identical pair sets for
every target, with no lost coverage or changed dispositions.

One retained target, `2.MD.A.1-use-length-tool~14c09892`, changes its generation plan because
the measurement-data producer's invariant annotation changes. The target itself did not
request `Statistics`, so its ID remains stable. Regeneration must update that sample's
annotation as well as the explicitly relabeled targets.

Full coverage verification passes all 4,261 tests in 672 files and every generator coverage
threshold. The final run bounds Vitest to two workers after three full-snapshot tests hit
the default timeout under concurrent load; all three passed unchanged in isolation and
in the complete rerun. Two stale test expectations were repaired: the line-plot invariant
label list and an evaluator fixture that still quoted the superseded vertical-only
checklist. The evaluator test now verifies that the prompt includes the actual leaf
checklist in full. Production validation policy and checklists remain unchanged.

Canonical generation rebuilt the dependency graph and selected 243 generator/view pairs,
rendering 2,212 images. Content addressing initially reused 337 shards and wrote 34.
The solution-color repair then regenerated four coordinate-pattern images, changing only
one image and replacing one shard. The final snapshot contains 2,292 samples in 371 shards:
1,916 training and 376 validation images.

| Comparison with the preserved baseline | Count |
| --- | ---: |
| Retained sample identities | 2,164 |
| Retained images with identical pixels | 2,163 |
| Retained images with corrected solution colors | 1 |
| Retained seed or attempt shifts | 0 |
| Removed statistics sample identities | 126 |
| New migrated sample identities | 128 |
| Retained samples with changed labels | 2 |

The two retained relabeled images are the raw measurement-table question and solution
identified above. Another 118 retained samples change only their generation-plan input
provenance; their semantic plan hashes remain unchanged. Six retained target-association
records likewise change only input provenance. The two additional images result from
the migrated targets' validation allocation, not new curriculum content.

All 972 matched tuples have training evidence. There is no cross-split content leakage or
duplicate configured task. The existing 55 allocated-tuple validation gaps remain; these
are warnings under the current split policy. Direct visual spot-checks of 24 migrated
questions and solutions cover every affected graph/measurement view and found no defects.

The merged artifact has 2,292 PNGs with no byte-identical groups or image-integrity errors.
Its validated asset index covers all 822 exact target label sets with 2,306 sample
associations; shared evidence explains the difference from physical-image count. The index
uses `v0.31.0-01` only as a prospective release revision; no dataset tag was created.

### Completed live validation and solution-color repair

With explicit user approval, live Gemini validation evaluated all 150 affected samples on
2026-10-22: 128 new sample identities and 22 retained images whose labels or ontology
context changed. All passed under the existing LOW/HIGH policy, with two independent HIGH
reviews. No fresh final label verdict is uncertain.

Manual inspection of those two reviews found that the coordinate-pattern plotting solution
still used purple markers and labels, contrary to the central green solution convention
([IMPL-V5](../implementation-view.md#impl-v5--question-and-solution-preserve-the-task-while-serving-different-roles),
[CHK-V6](../checklist-view.md#chk-v6--keep-one-minimal-observable-contract-per-view)). LOW had
correctly identified this defect; HIGH had overlooked it. The renderer now uses green for
the solution markers and labels. Regeneration preserves the question and both sibling
pair-forming images exactly. The repaired solution passes a fresh LOW evaluation; the
other 2,291 judgments are reused. The second HIGH review concerns a fractional line plot:
direct inspection confirms all six marks agree with the supplied measurements.

The final strict offline audit passes **2,292/2,292 samples**, with zero missing, stale,
failing, duplicate or malformed cache records and no structure, renderer or image-integrity
issues. Against the original baseline, the cache contains 150 fresh records and removes
148 stale records. All 2,142 retained judgments, review histories and timestamps remain
unchanged. Of those, 2,024 complete records are byte-identical; the remaining 118 only
refresh `generation_plan.inputHash` to match the canonical dataset's provenance. The nine
previously uncertain passing records remain unchanged under the existing policy.

Final churn verification finds 128 added identities, 126 removed identities and the one
explained color change, with no seed or attempt shifts. The affected view's seven tests,
type checking and generator/view specification validation pass after the repair. The merged
artifact and asset index are rebuilt and revalidated against the final images. No ontology
label, checklist or evaluation rule was weakened to obtain passing coverage.

The source migration, canonical generation, exact VQA coverage and merged-artifact coverage
are now verified: the dataset is **locally ready for the release workflow**.

The dataset is prepared locally on the existing branch. Dataset publication remains a
separate action: it requires integration to clean synchronized `main`, successful CI on
that exact commit, and the dataset release workflow. The ontology release does not publish
the dataset or expand its curriculum coverage.
