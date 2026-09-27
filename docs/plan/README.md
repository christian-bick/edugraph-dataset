# Open and deferred work

Completed consolidation and migration documents are preserved unchanged in
[`docs/history/`](../history/). Their deferred sections remain available through the links below.
These items are not newly scheduled by the archive move.

- **Ontology v0.29 VQA follow-up:** [CCSS rerun findings](ontology-v029-vqa-rerun.md)
  record minor task-evidence repairs and remaining classification and numeric-boundary reviews.
  The [numeral-system ownership correction](numeral-system-ownership.md),
  [MeasuringTime definition correction](measuring-time-definition.md),
  [equation classification correction](equation-correctness.md),
  [shape recognition correction](shape-recognition.md),
  [category ordering extension](category-ordering.md),
  [arithmetic-offset label correction](arithmetic-offset-labels.md), and
  [numeric-range and successor correction](numeric-range-bounds.md) are complete;
  the current cache has 28 remaining failures among 1,934 CCSS images: 12 samples requiring
  semantic review and 16 evaluator disagreements. Complete ordering now has its own
  view, with least/most selection preserved as a separate supporting subskill.
  Offset tasks retain arithmetic direction without sequence-position labels. Whole-task numeric
  bounds now include their actual operands and hidden results, independently of operand digit
  profiles. All 20 current offset/successor images pass, and the invalid step-operand checklist
  exemption is removed. Existing result-boundary coverage gaps remain deferred.
  The 2.NBT.B.8 starting cutoff of 900 is intentionally ignored, as recorded in its target block.
  New reviews concern count-out pools exceeding their numeric bounds and direct property or
  place-value tasks claiming an explanatory `ProcedureUnderstanding` Ability. A division-story
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
