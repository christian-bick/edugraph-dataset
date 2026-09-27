# Numeric range bounds and operand profiles

Investigation requested on 2026-09-27, following the [CCSS ontology VQA rerun](ontology-v029-vqa-rerun.md).
Baseline: `3605b55`. This records a corrected interpretation and implementation options.
A subsequent target-block comment records the approved 900-cutoff approximation; no ontology,
generator behavior, target labels, view, dataset, or VQA cache change has been made.
The isolated `test` spec and its artifacts remain excluded.

## Clarified meaning

The user clarified that `NumbersLargerN` and `NumbersSmallerN` bound the involved mathematical
numbers, including operands and the result even when it is hidden. A smaller adjustment is
an operand and is not exempt. Thus `342 - 10 = 332` supports `NumbersLarger10` and
`NumbersSmaller1000`, but not `NumbersLarger100`.

This supersedes the earlier discussion's proposed exception for smaller adjustment operands.
Digits and place-value annotations used solely to represent the task's numbers remain a separate
representational concern. A coefficient such as the 3 in "3 hundreds" does not independently
make the main calculation a single-digit task. The concrete range definitions should explain
this distinction without exempting actual arithmetic operands.

Installed ontology preview: `0.29.0-pre.2.59ff94cc3573`. Its current template says that
"all involved numbers" have absolute values greater than or equal to, or less than or equal
to, the threshold. The inclusive absolute-value bounds should remain. The user prefers one
concise definition rather than additional explanatory sentences on every range label. Proposed
templates are:

- **NumbersLargerN:** Numeric contexts in which all numerical values used or determined by
  the main task have absolute values greater than or equal to N.
- **NumbersSmallerN:** Numeric contexts in which all numerical values used or determined by
  the main task have absolute values less than or equal to N.

"Used or determined" includes operands and unshown results; "main task" distinguishes those
values from annotations used only to represent them. These are proposed definitions, not a
published ontology change.

VQA receives each concrete label's own definition and comment through `involvementStatement`;
it does not expand parent definitions. Updating only `NumericRange` would be insufficient.

## Current implementation and reproduced evidence

The shared `resolveRangeFromLabels` resolver correctly produces inclusive numeric bounds.
The defect lies in their application: `generateCountingOffset` bounds the starting quantity
and result but never checks its fixed step against the range (`IMPL-G4`). Consequently, the
same range also serves as an implicit starting-number-size parameter.

The production inventory has 29 active targets with positive lower bounds. Their current
98 images were replayed from the recorded plans, selections, seeds, and attempts; all 98
canonical content fingerprints match the dataset. The audit checks the core operand/result
values, compared quantities, written number, or sequence terms, as appropriate. It does not
treat every numeric field in a payload as an independent task number.

| Current family | Replayed samples | Primary-number range conflicts |
| --- | ---: | ---: |
| Arithmetic pairs / triples / four operands | 30 | 0 |
| Comparison | 20 | 0 |
| Writing | 14 | 0 |
| Written standard algorithms | 8 | 0 |
| Hundred offsets | 6 | 0 |
| Ten offsets | 10 | 4 |
| One-step object-arrow tasks | 6 | 6 |
| Explicit number sequences | 4 | 0 |

The four ten-offset conflicts belong to the two grade-two variants. Their exact calculations
are `342 - 10 = 332`, `959 - 10 = 949`, `129 + 10 = 139`, and `538 + 10 = 548`.
All claim `NumbersLarger100`, and all currently pass VQA because their judgments consider
only the starting quantity and result. The grade-one ten-offset and hundred-offset samples
have no primary-number conflicts under the clarified interpretation. Their seven recorded
VQA failures concern the separate treatment of place-value components.

The six one-step conflicts belong to the two K.CC.A.2 count-from-number targets:
`15 + 1 = 16`, `6 + 1 = 7`, `5 + 1 = 6`, `7 + 1 = 8`, `14 + 1 = 15`, and `13 + 1 = 14`.
They claim `NumbersLarger5`. The current `counting-inc-dec/checklist.md` explicitly excludes
the arrow's step from range checks. Several passing judgments cite that exemption verbatim.
It conflicts with the clarified arithmetic interpretation and requires correction alongside
the task/declaration contract, not merely deletion followed by unchanged generation (`CHK-V6`).

The four sequence samples expose sequence terms rather than an explicit addition operand;
their terms satisfy the bounds. The K.CC.A.2 target's valid sequence interpretation should
therefore be preserved when repairing its object-arrow path. This connects to the already
documented [successor-view evidence review](arithmetic-offset-labels.md#separate-successor-view-review).
Changing a target's range solely to retain the wrong projection is not an appropriate repair
(`TSPEC-6`, `IMPL-V11`).

These ten conflicts are newly identified semantic concerns in currently passing samples,
not ten additional cached VQA failures. The committed cache remains 1,914 pass / 28 fail.

## Separate operand-size parameterization

The ontology already distinguishes operand digit count from operand cardinality:

- `TwoDigitLargestOperand`: a largest operand with exactly two digits.
- `ThreeDigitLargestOperand`: a largest operand with exactly three digits.
- `OperandCardinality`: the number of explicit operand occurrences, with labels such as
  `TwoOperands`; it does not describe the size of their values.

Existing multiplication and place-value arithmetic modules already use the digit-count labels.
The offset modules do not yet support them. A bounded capability extension can preserve their
existing payload and views while resolving the digit profile independently of the whole-task
range (`SPEC-G2`, `IMPL-G7`). For these positive offsets, generation can explicitly keep the
starting quantity as a largest operand and constrain its digit count; this relationship must
be enforced rather than assumed from the name of the parameter.

Lowering the grade-two ten-offset bound from 100 to 10 without that profile expands each
direction from 648 to 720 valid starting values under the current zero-digit restriction.
It admits 72 two-digit starts: as low as 11 for incrementing and 21 for decrementing.
Adding the three-digit starting profile restores exactly the former 648-start domain in
both directions, while making the global bound truthful.

An in-memory matching experiment added `TwoDigitLargestOperand` to the two grade-one targets,
`ThreeDigitLargestOperand` to the four grade-two targets, and changed only the grade-two
ten-step lower bounds to 10. Without producer support, all six offset matches disappear.
Adding the corresponding schema capabilities to the two existing offset producers restores
all 683 targets / 832 tuples, with the same target-family-to-generator/view multiplicities.
This establishes matching feasibility only; production implementations and complete fallback
compatibility guards were not changed or validated by the experiment. Target hashes would
change normally with their label sets (`TSPEC-5`).

## CCSS boundary decisions and remaining gaps

The canonical CCSS source in `public/coverage/ccss-tree.json` distinguishes starting-number
requirements from whole-expression bounds:

- **1.NBT.C.5:** starts with a two-digit number. `99 + 10 = 109` and `19 - 10 = 9` are valid
  examples but are excluded by the current shared 10-to-100 whole-task range. Covering the
  full starting domain requires direction-appropriate result bounds and consideration of
  `10 - 10 = 0`, rather than treating a two-digit operand as a two-digit result guarantee.
- **2.NBT.B.8 — accepted approximation:** the source specifies starts from 100 through 900.
  The user explicitly approved ignoring the pedagogically arbitrary 900 cutoff, documented
  in a comment above `placeValueOffsetsBuilder` in `src/spec/ccss/grade-02.ts`. Starts above
  900, such as the current `959 - 10 = 949` sample, therefore do not require correction on
  that basis. Its incorrectly asserted `NumbersLarger100` remains a separate open issue.
  The sample is
  `2.NBT.B.8-place-value-offsets~e267d598#counting-ten-offset#counting-ten-more-less#train#solution#inst:0`.
- The same standard permits `111 - 100 = 11` and `100 - 100 = 0`; a blanket lower bound
  of 100 on hundred-less tasks excludes these cases. Conversely, the hundred-more family
  can keep a lower bound of 100 when starting at 100 or above.

The 900 starting cutoff is deliberately relaxed. The remaining result-boundary cases still
need an explicit disposition: preserving the existing restricted subskills and extending
their result coverage are different scopes. The in-memory matching experiment does not
claim complete result-domain coverage.

## Proposed next correction and verification

1. Use concise concrete ontology range definitions around values used or determined by
   the main task, with no exception for adjustment operands.
2. Separate operand digit profiles from numeric bounds in the existing offset generators;
   enforce all operands and results against the selected range. Declare label-expressible
   contradictions in compatibility rules and retain defensive numeric checks (`SPEC-G3`).
3. Correct the affected targets, explicitly decide the remaining result-boundary cases, and repair
   the related one-step range/checklist issue without losing valid sequence capabilities.
4. Run required unit coverage, matching and static gates, canonical affected generation,
   VQA at concurrency four, and churn/split checks. Preserve unrelated records and `test`.

Of the current 1,942 samples, 802 carry at least one concrete range label; 98 have a positive
lower-bound label. Revising every used lower and upper definition would therefore affect
802 current VQA contexts before any target changes. A lower-bound-only clarification has
a smaller scope. An actual package update and dependency comparison must determine the
final rerun scope rather than assuming that only the seven failing samples need rechecking.

Read-only evidence: `temp/numeric-range-investigation.json` and its execution log. No live
VQA requests, canonical renders, or production-code changes were performed for this investigation.
