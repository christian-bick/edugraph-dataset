# Numeric range bounds and operand profiles

Investigation and correction on 2026-09-27, following the [CCSS ontology VQA rerun](ontology-v029-vqa-rerun.md).
The investigation baseline is `3605b55`; the implementation baseline is `cac26a3`.
The user authorized changing the ontology directly on `main`, publishing its preview, then
adopting that preview before implementing the content repair. The ontology change is pushed
as `dee8850`, and dependency commit `0e7ccb8` adopts `0.29.0-pre.3.dee88508f2f8`.
Content implementation commit: `4b5cd9c`.
Minor word-problem repairs: `5f9d310` and `72efab1`. Final VQA cache: `3e2920e`.
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

The investigation used ontology preview `0.29.0-pre.2.59ff94cc3573`. Its template said that
"all involved numbers" have absolute values greater than or equal to, or less than or equal
to, the threshold. The inclusive absolute-value bounds should remain. The user selected one
concise definition rather than additional explanatory sentences on every range label. The agreed
templates are:

- **NumbersLargerN:** Numeric contexts in which all numerical values serving as inputs or
  results of the task have absolute values greater than or equal to N.
- **NumbersSmallerN:** Numeric contexts in which all numerical values serving as inputs or
  results of the task have absolute values less than or equal to N.

"Serving as inputs or results of the task" includes operands and unshown results while
distinguishing those values from annotations used only to represent them. Ontology commit
`dee8850` applies this wording to all 19 concrete range definitions. Comments, relations, and
the compatible parent definition remain unchanged. The published preview contains the exact
new definitions; they were verified after installing the released TypeScript tarball.

VQA receives each concrete label's own definition and comment through `involvementStatement`;
it does not expand parent definitions. Updating only `NumericRange` would be insufficient.

## Baseline implementation and reproduced evidence

The shared `resolveRangeFromLabels` resolver correctly produces inclusive numeric bounds.
At the baseline, the defect lay in their application: `generateCountingOffset` bounded the
starting quantity and result but never checked its fixed step against the range (`IMPL-G4`).
Consequently, the same range also served as an implicit starting-number-size parameter.

The baseline production inventory had 29 active targets with positive lower bounds. Its
98 images were replayed from the recorded plans, selections, seeds, and attempts; all 98
canonical content fingerprints match the dataset. The audit checks the core operand/result
values, compared quantities, written number, or sequence terms, as appropriate. It does not
treat every numeric field in a payload as an independent task number.

| Baseline family | Replayed samples | Primary-number range conflicts |
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
All claimed `NumbersLarger100`, and all passed VQA because their judgments considered
only the starting quantity and result. The grade-one ten-offset and hundred-offset samples
have no primary-number conflicts under the clarified interpretation. Their seven recorded
VQA failures concern the separate treatment of place-value components.

The six one-step conflicts belong to the two K.CC.A.2 count-from-number targets:
`15 + 1 = 16`, `6 + 1 = 7`, `5 + 1 = 6`, `7 + 1 = 8`, `14 + 1 = 15`, and `13 + 1 = 14`.
They claimed `NumbersLarger5`. The baseline `counting-inc-dec/checklist.md` explicitly excluded
the arrow's step from range checks. Several passing judgments cited that exemption verbatim.
It conflicted with the clarified arithmetic interpretation and required correction alongside
the task/declaration contract, not merely deletion followed by unchanged generation (`CHK-V6`).

The four sequence samples expose sequence terms rather than an explicit addition operand;
their terms satisfy the bounds. The K.CC.A.2 target's valid sequence interpretation should
therefore be preserved when repairing its object-arrow path. This connects to the already
documented [successor-view evidence review](arithmetic-offset-labels.md#separate-successor-view-review).
Changing a target's range solely to retain the wrong projection is not an appropriate repair
(`TSPEC-6`, `IMPL-V11`).

These ten conflicts were identified in samples that passed at the baseline; they were not ten
additional cached VQA failures. The baseline cache held 1,914 passing and 28 failing verdicts.

## Separate operand-size parameterization

The ontology already distinguishes operand digit count from operand cardinality:

- `TwoDigitLargestOperand`: a largest operand with exactly two digits.
- `ThreeDigitLargestOperand`: a largest operand with exactly three digits.
- `OperandCardinality`: the number of explicit operand occurrences, with labels such as
  `TwoOperands`; it does not describe the size of their values.

Existing multiplication and place-value arithmetic modules already use the digit-count labels.
The offset modules did not yet support them. A bounded capability extension can preserve their
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
  900, such as the baseline `959 - 10 = 949` sample, therefore do not require correction on
  that basis. Its incorrectly asserted `NumbersLarger100` was the separate issue repaired here.
  The sample is
  `2.NBT.B.8-place-value-offsets~e267d598#counting-ten-offset#counting-ten-more-less#train#solution#inst:0`.
- The same standard permits `111 - 100 = 11` and `100 - 100 = 0`; a blanket lower bound
  of 100 on hundred-less tasks excludes these cases. Conversely, the hundred-more family
  can keep a lower bound of 100 when starting at 100 or above.

The 900 starting cutoff is deliberately relaxed. This correction preserves the existing
restricted result domains and zero-digit avoidance; expanding their result coverage is deferred.
That keeps the mathematical-domain correction separate from adding zero results, crossing digit
boundaries, and changing place-value representations. Neither the investigation nor this repair
claims complete result-domain coverage of those standards.

An inherited generic limitation also remains: an unrestricted direct configuration without an
upper range label resolves to `Number.MAX_SAFE_INTEGER`, while this helper enumerates its
candidate domain. All current CCSS consumers supply an upper bound. Supporting an unspecified
upper bound needs an explicit finite-domain contract; this repair does not silently invent one.

## Content correction

The ten/hundred offset producers separate an optional operand digit profile from the range
over the whole task. Explicit profiles constrain the starting quantity to two or three digits
and ensure it is a largest operand. An unrestricted default preserves valid generic cases such
as `11 + 100 = 111`. The shared arithmetic helper checks the start, fixed step, and result;
selected-label compatibility rejects impossible range/profile/direction combinations before
generation (`SPEC-G3`, `IMPL-G4`). The payload and place-value views remain unchanged.

The two grade-one targets require `TwoDigitLargestOperand`. The four grade-two targets require
`ThreeDigitLargestOperand`, paired with `NumbersLarger10` for ten offsets or `NumbersLarger100`
for hundred offsets. Their upper bounds and direction variants remain unchanged. Target hashes
change normally with their corrected label conjunctions (`TSPEC-5`).

The one-step producer also enforces its actual operand 1. A lower bound of 5 therefore admits no
arithmetic configuration. This is a complete mathematical feasibility rule, not a target-specific
exclusion: the two K.CC.A.2 targets and their valid `counting-sequence` route remain unchanged.
Six mislabeled object-arrow images are retired rather than retaining the false lower bound or
weakening the target to accommodate that projection.

For the retained successor tasks, the `counting-inc-dec` view exposes ordered start/result
positions and a signed directional step alongside the countable starting collection. It
withholds the result numeral in Question Mode and reveals it in Solution Mode. This supplies
the previously missing `After`/`Before` evidence without a new learner action or payload
(`IMPL-V11`). The checklist's step-operand exemption is removed (`CHK-V6`).

## Verification

The ontology's authoritative `docker build . --output dist` passed TypeScript tests, ontology
and documentation validation, package smoke checks, Python lint/type checks, all 49 Python tests,
and wheel/source-distribution checks. The
[preview workflow](https://github.com/christian-bick/edugraph-ontology/actions/runs/36343945214)
also passed all Linux Python 3.11–3.14 and Windows Python 3.14 consumers before publishing the
[preview](https://github.com/christian-bick/edugraph-ontology/releases/tag/preview-0.29.0-pre.3.dee88508f2f8).

Focused checks pass 77 generator tests across eight files and 22 view tests across two files.
The planner/domain comparison covers all 264 supported bounded label combinations. Exact domain
tests preserve 648 grade-two ten-offset starts per direction, 72 grade-one starts per direction,
and 648 hundred-offset starts per direction, alongside operand/result bounds, candidate order,
the single seeded draw, unrestricted fallbacks, mode withholding, and ordered position evidence.

Matching retains all 683 targets and 212 compatible producer/view pairs. It replaces the six
offset target IDs and removes only the two mathematically impossible K.CC.A.2 arithmetic paths,
leaving 830 target/generator/view tuples and no active target without a match. The strict label
architecture audit reports zero violations and the same 97 review items. The build and full
CCSS repository checks pass.

Full coverage passes all **3,197 tests across 533 files**. The three generator implementations
have 100% statement and branch coverage, and all enforced coverage thresholds pass. The first
run exposed one stale unit-test assertion requiring every view family to remain represented in
the excluded `test` spec. The regression still checks indexed/direct matching consistency for
both specs; complete production-family coverage is now asserted against CCSS. No `test` target,
dataset, or cache was changed to accommodate the corrected operand bounds.

Canonical affected generation renders **20 images**, writes five shards, and reuses 281. It
replaces 16 former ten/hundred-offset identities with 14 corrected-target identities and retires
the six invalid one-step arithmetic images. The dataset therefore contains **1,934 images**:
1,632 training and 302 validation. All 830 matched tuples have training evidence, and the split
report finds no cross-split leakage or within-split configured-task redundancy. There are 206
tuples allocated to validation, 151 represented, and the same 55 recorded allocation gaps.

All 20 current arithmetic-offset/successor samples replay to their recorded content fingerprints;
their start, fixed operand, and hidden result satisfy the bounds, and every requested operand
profile is honored. Among the 1,920 retained sample identities, 1,914 images are byte-identical;
only the six intended successor-view images change.

Three successor samples take earlier winning retry attempts after duplicate values are freed:

| Retained sample | Attempt before → after | Previous owner of the newly available payload |
| --- | ---: | --- |
| `K.CC.B.4c-one-larger~762240a1`, training solution | 3 → 2 | Retired `K.CC.A.2-count-from-number~7f55d9c6` training solution |
| `K.CC.B.4c-one-larger~ade4a8e2`, training solution | 4 → 2 | The preceding successor solution's former payload |
| `K.CC.B.4c-one-larger~ade4a8e2`, validation question | 3 → 1 | Retired `K.CC.A.2-count-from-number~7f55d9c6` training question |

The seeding function is unchanged. Replaying all three former winning draws through the new
generator reproduces their old fingerprints exactly, and every new seed equals the ordinary
sample-key/attempt derivation. Thus these are explained deduplication changes within the affected
family, not nondeterministic drift. Evidence: `temp/numeric-range-retries.json`.

Of the 1,942 baseline samples, 802 carried at least one concrete range label; 98 had a positive
lower-bound label. After the target corrections and retirements, the actual dependency comparison
scheduled **794 new VQA judgments at concurrency four** and reused 1,140 unchanged records.
A temporary provider HTTP 503 interrupted one worker after 792 completed judgments, leaving two
uncached measurement solutions. The completed judgments were preserved. Both missing solutions
passed in the next cache-aware run; there were no HTTP 429 or rate-limit errors.

## Minor repairs found during revalidation

The refresh exposed one coherent equation with an incorrect story question: 90 items shared among
45 groups was followed by "How many are there now?" The quotient is the number in each group.
Commit `5f9d310` fixes the requested quantity in forward and inverse grouped stories: division
asks for items per group and multiplication asks for the total. Addition, subtraction, and length
stories remain unchanged. Visual inspection then caught "1 items"; `72efab1` corrects singular
item/group nouns and is/are agreement in the same grouped-story branches.

The shared helper schedules 132 renders per repair, but each run writes only two changed shards
and reuses 284. The first changes eight word-problem images; the grammar follow-up changes two
of those eight. All other images, mathematical payloads, seeds, attempts, and identities remain
unchanged. The final focused suites pass **25 tests across three files**, including eleven new
wording regressions; the typecheck, specification audit, final build, and full CCSS checks pass.

The second VQA pass completes ten judgments: the eight changed images and the two interrupted
measurement solutions, reusing 1,924 records. All ten pass. The grammar follow-up makes two
requests, reuses 1,932, and passes both. In total, this follow-up completes **804 live judgments**
at concurrency four. The final cache contains 794 newly judged sample records and 1,140 records
byte-identical to the implementation baseline. No failure was repeatedly submitted merely to
obtain a passing verdict.

## Final results and remaining findings

All **20 offset/successor samples** and **eight repaired word-problem samples** pass. The complete
CCSS dataset has **1,906 pass / 28 fail / zero uncached** among 1,934 samples. Seven previous
failed offset identities retire with their corrected target hashes, and four retained prior
failures now pass. Eleven previously passing samples are newly rejected. The temporary division
wording failure was repaired within this run and is preserved in the findings history.

The remaining rejections comprise **12 samples requiring semantic review** and **16 evaluator
disagreements**. Two new semantic topics require review:

- A count-out task asks for 9 objects from 14 supplied diamonds under `NumbersSmaller10`.
  The finite supply is an input, and the view currently invents the spare-object count. A
  generator-owned bounded supply needs a boundary policy for tasks requesting the maximum count
  (`IMPL-V8`, `IMPL-V11`, `SPEC-V2`).
  **Subsequently resolved on 2026-09-28:** the [count-out supply correction](count-out-supply.md)
  chooses the available count from the inclusive requested/lower/upper-bound interval, allowing
  equality anywhere. All ten replacement images pass; the figures in this section preserve the
  earlier numeric-range checkpoint.
- One property-completion task and one hundreds-conversion task claim `ProcedureUnderstanding`
  without requesting the how/why explanation required by its definition. Review target intent
  and view Ability together (`SPEC-V5`, `TSPEC-13`).

New evaluator disagreements concern formal equation completion, representational zero components,
and single-digit decimal notation. Reviewed canonical image hashes match their VQA records. The
[original report](ontology-v029-vqa-rerun.md) and [findings JSON](ontology-v029-vqa-findings.json)
record exact examples and retain the earlier unresolved topics.

Strict audit exits 1 solely for the 28 failing verdicts. Dataset structure, renderer identity,
duplicate/malformed/missing/obsolete/stale cache checks all report zero issues. Churn against
`cac26a3` is **1,906 identical retained images, 14 intended changes, 14 added identities, and
22 removed identities**. The 14 changes are six successor images and eight word-problem images;
the only three attempt/seed changes are the explained successor deduplication transitions above.
No seed derivation changes. The `test` targets and cache remain byte-identical to baseline
`644254d`, and its dataset pointer is unchanged from the start of this follow-up.

The original read-only evidence is `temp/numeric-range-investigation.json` and its execution
log. The implementation baseline additionally records all sample/image identities, cache-record
hashes, and the isolated test dataset pointer in `temp/numeric-range-baseline.json`.
