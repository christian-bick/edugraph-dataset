# Open and deferred work

Completed consolidation and migration documents are preserved unchanged in
[`docs/history/`](../history/). Their deferred sections remain available through the links below.
These items are not newly scheduled by the archive move.

- **Ontology v0.29 VQA follow-up:** [CCSS rerun findings](ontology-v029-vqa-rerun.md)
  record minor task-evidence repairs and remaining semantic reviews.
  The [numeral-system ownership correction](numeral-system-ownership.md),
  [MeasuringTime definition correction](measuring-time-definition.md),
  [equation classification correction](equation-correctness.md),
  [shape recognition correction](shape-recognition.md),
  [category ordering extension](category-ordering.md),
  [arithmetic-offset label correction](arithmetic-offset-labels.md),
  [numeric-range and successor correction](numeric-range-bounds.md),
  [bounded count-out supply correction](count-out-supply.md),
  [completion/explanation separation](procedure-task-separation.md),
  [operand-cardinality clarification](operand-cardinality.md),
  [whole-tens subtraction correction](whole-tens-subtraction.md), and
  [spatial-construction correction](spatial-composition.md) are complete;
  the current cache has 26 remaining failures among 1,966 CCSS images: 9 samples requiring
  semantic review and 17 evaluator disagreements. Complete ordering now has its own
  view, with least/most selection preserved as a separate supporting subskill.
  Offset tasks retain arithmetic direction without sequence-position labels. Whole-task numeric
  bounds now include their actual operands and hidden results, independently of operand digit
  profiles. All 20 current offset/successor images pass, and the invalid step-operand checklist
  exemption is removed. Existing result-boundary coverage gaps remain deferred.
  The 2.NBT.B.8 starting cutoff of 900 is intentionally ignored, as recorded in its target block.
  Count-out pools now come from a bounded generator interval, including equality; all ten new
  images pass. Property application and bundle reading now have appropriate completion Abilities
  and separate explanation tasks. All 40 replacement samples now pass after clarifying that
  operand cardinality counts occurrences across all nested operations. The 732 required rechecks
  retain all images and leave no rejected operand label; one pictorial-division verdict is uncertain
  but passes under the existing policy. Whole-tens targets now use `Subtraction` with `PlaceValue`,
  retaining their model, written-method, and explanation requirements; identifiable partitioning
  remains supported elsewhere. All 16 corrected samples pass without changing any retained image
  or judgment. Spatial construction now has its own view with `SpatialGeneration`, while
  selection/prediction remains available with `SpatialImagination`. All 42 construction images
  pass. A related Ability review covers four whole-from-shares fraction targets whose eight
  images currently pass. The picture-graph scale review includes its question as well.
  The fixed ten-tens explanation adds one validation-coverage gap, bringing
  that total to 56 without leakage. A division-story
  wording defect and singular/plural agreement were repaired during revalidation.
  The equation follow-up also
  records a separate review of the existing seeded claim's task-fingerprint representation.

- **Ontology consolidation:** measurement definitions, numeric boundaries, and progression
  semantics remain in the [ontology roadmap](https://github.com/christian-bick/edugraph-ontology/blob/main/docs/plan/ontology-consolidation.md).
- **Target-equivalence semantics:** the [deferred review](../history/automated-rule-checks.md#deferred-review-intra-standard-equivalences)
  distinguishes shared extracted competencies from equivalence of complete source standards.
- **Generator content expansion:** [coverage findings and the deferral decision](../history/label-variant-followups.md#coverage-findings)
  retain the current split policy and document the remaining validation gaps.
- **Synthetic regression experiment:** [the optional experiment](../history/payload-family-matching.md#optional-synthetic-regression-experiment)
  remains deferred.
- **Performance maintenance:** [retention, finer ownership, and field-origin provenance](../history/improve_performance.md#deferred-opportunities)
  remain separate opportunities. The existing [performance contract](../history/improve_performance.md#performance-contract)
  continues to apply.
