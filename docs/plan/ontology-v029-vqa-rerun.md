# Ontology v0.29 CCSS VQA rerun

## Outcome

Completed on 2026-09-26 on branch `codex/ontology-v029-vqa-rerun`.
All **1,936 CCSS samples** have current judgments: **1,885 pass (97.4%) and 51 fail**.
There are no uncached samples. The remaining failures comprise **38 samples requiring semantic
review** and **13 evaluator disagreements**. These are sample counts, not distinct defects;
some semantic concerns also affect currently passing samples.

The strict audit fails on those 51 recorded verdicts. It reports **zero** dataset-structure,
renderer-identity, duplicate-cache, malformed-cache, missing-key, obsolete-module, or stale-cache
issues. Every final failure concerns label evidence; none fails a general visual/math check.

[The machine-readable findings](ontology-v029-vqa-findings.json) contain every failed sample,
rejected-label evidence, disposition, replay command, and bounded-revalidation result. Major
findings and proposed review directions are described below. No production targets or declared
labels were changed to make the run pass.

## Scope and implementation

This maintenance run upgrades the exact `edugraph-ts` dependency from v0.26.0 to v0.29.0,
adopting the descriptor-text harmonization from v0.28.0 and the new involvement-statement
helper. Only **CCSS** is regenerated and validated; the isolated `test` dataset and cache
remain outside this work.

VQA retains exact label identifiers but supplies the library's complete involvement statements.
Supporting comments are appended directly because they can explain boundaries as well as give
examples. The prompt identifies examples as illustrative. Both the validation-context hash and
ontology-definition dependency nodes include the complete text, so changes to labels, definitions,
or comments invalidate judgments while preserving image identity.

The initial canonical graph rebuild reused all 285 shards and rendered no images. The full
1,936-image CCSS rerun uses at most four concurrent Gemini requests. An interruption preserved
1,805 judgments (64 failures) in the incremental cache. Before resuming, the freshness gate
correctly required regeneration of the four repaired views. That affected run rendered 32 images
in six shards and reused the other 279 shards. Completion reused 1,773 current judgments and
requested 163 more: the remaining 131 original images plus the 32 repaired samples.

## Minor repairs

- **`operations-decompose`:** Question Mode now requests how and why counting the two groups
  and adding their counts recovers the whole. Solution Mode explains that each object belongs
  to exactly one group and is counted once. This makes the existing `ProcedureUnderstanding`
  claim observable without changing the payload, target, or declaration (`SPEC-V5`, `TSPEC-13`).
- **`counting-objects-simple`:** Question Mode requests the total in digits and a counting
  explanation. Solution Mode explains one-to-one counting and why the final counting number
  is the total, with a separate correct explanation for an empty collection. Its existing
  `ProcedureUnderstanding` claim now has explicit task evidence (`SPEC-V5`, `CHK-V6`).
- **`place-value-tens-bundles`:** Question Mode requests how and why grouping/counting tens
  works; Solution Mode explains that each full frame contributes ten ones, or that grouping
  the single ten preserves all objects. The existing payload supplies every needed value.
- **`shape-position`:** Ahead/behind scenes now identify the forward direction with a neutral
  downward arrow. The existing ball positions agree with that direction; Question Mode still
  withholds the selected relation. The choice uses "Ahead of the box" consistently (`IMPL-V11`).

The leaf checklists describe the repaired observable tasks. These repairs do not change a
production target or a module's declared labels. Canonical images were inspected in both modes;
31 of the 32 revalidated samples pass. The one residual counting rejection is documented below.

## Major findings requiring follow-up

### Exact equation truth versus plausibility

`operations-equation-judgment` asks whether an exact arithmetic equation is true or false.
For example, the inspected image asks about `18 + 2 = 20`. Its `PlausibilityEvaluation`
label concerns credibility or likelihood in context, which is a different performance.

Review the view declaration and `1.OA.D.7-equal-sign` production targets together. `ErrorDetection`
is a possible replacement, subject to checking both correct and incorrect equations; simply
renaming the question to "plausible" would not correct its meaning (`SPEC-2`, `SPEC-V5`,
`TSPEC-6`, `TSPEC-13`). The failing sample is:

```text
1.OA.D.7-equal-sign~6f678d9f#arithmetic-equation-judgment#operations-equation-judgment#train#question#inst:0
```

### Numeral-system labels on object-only tasks

The `counting-basic` producer supplies `Base10` invariantly even to `counting-conservation`,
whose inspected question and solution images contain object collections and word choices,
with no positional numeral representation. The conservation targets do not request `Base10`;
the additional annotation comes from the producer.

Review representation ownership across its five CCSS consumers: conservation, count-out,
one-to-one, parity, and simple counting. Similar missing numeral evidence occurs in
`sorting-classify-count` Question Mode and all inspected `sorting-classify-sort` images.
Removing a producer claim requires a coordinated review of consumers and affected targets;
adding a decorative numeral or a caption naming the label is not a sufficient repair
(`SPEC-2`, `SPEC-5`, `IMPL-V11`, `CHK-V6`).

Distinguish absence of numerals from single-digit notation. A visible ordinary decimal
numeral can reasonably support `Base10`; VQA rationales demanding multiple digits or a
place-value lesson impose a stronger requirement than the definition. Physical collections
also supply integer quantities without printed numerals, so the count question's rejections
of integer, range, and positive/nonzero labels are not automatically classification defects.

Affected families include `K.CC.B.4b-conservation`, `K.MD.B.3-classify-count`, and
`K.MD.B.3-sort-by-count`.

### Shape properties versus shape recognition

Both sorting views claim `ShapeProperties`, while the supplied statement concerns physical
features that permit or constrain manipulation, such as rolling, folding, and stacking.
The inspected tasks group circles, squares, and triangles by appearance.

Review both view declarations and the corresponding kindergarten targets. `Area.ShapeRecognition`
is an eligible candidate describing visual identification and grouping by shared form, but this
would be a coordinated classification and dimension change (`SPEC-2`, `SPEC-11`, `TSPEC-13`).
The mismatch is present even in some samples where VQA accepted that label.

### Most/least selection versus a complete numeric order

`sorting-classify-sort` asks which category has the most or least objects and highlights that
single category in Solution Mode. `NumericOrder` instead describes arranging values into a
magnitude-based sequence. The underlying CCSS competency calls for sorting categories by count;
removing the label would lose the intended coverage.

This needs a generator/view correction that supplies and requests the complete order, including
tied counts. It is more substantial than a prompt clarification. Do not substitute
`NumericComparison`, which is structurally ineligible as a label (`IMPL-G8`, `IMPL-V11`,
`TSPEC-6`, `TSPEC-13`). Both `K.MD.B.3-sort-by-count~1bb99c29` and
`K.MD.B.3-sort-by-count~47cf0f93` are affected.

### Arithmetic offsets and sequence-position labels

The ten/hundred-more-less views show a place-value transformation such as "Find 100 less"
with start/result panels. The rejected `Before` statement describes identifying an earlier
chronological point or a preceding sequence position. Review whether these arithmetic-offset
targets and producer declarations provide sufficient sequence-position evidence, or need a
different semantic encoding. The corresponding `After` direction deserves the same review.

Affected families are `1.NBT.C.5-ten-more-less` and `2.NBT.B.8-place-value-offsets`.

### Numeric bounds and component counts

Some ten-more-less tasks claim `NumbersLarger10` while explicitly displaying separate place
counts such as "1 one" or small tens counts. VQA treats those as involved quantities below the
requested bound. Review the intended boundary between the whole operand range and numerical
quantities used in its representation before altering generators or production targets.
This is a semantic decision rather than a layout defect.

### Spatial assembly versus concept composition

`shape-compose-shapes` claims `ConceptComposition`, whose statement concerns combining related
concepts into a coherent new or more complex concept. The inspected question asks which pieces
make a hexagon and offers "Six triangles" or "Six circles". Review whether this spatial assembly
task establishes the claimed conceptual performance, or needs a different Ability or stronger
conceptual task evidence. Do not settle this by changing the wording alone (`SPEC-V5`, `TSPEC-13`).

The reported sample is
`K.G.B.6-compose-shapes-other~4e78fdaa#shape-compose-shapes#shape-compose-shapes#train#question#inst:0`.

### Environmental illustrations versus physical manipulatives

`shape-env-shapes` invariantly supplies `PhysicalGeometry`, defined through geometric figures
represented by manipulable physical objects. The inspected artifacts instead show ordinary
environmental illustrations: a room's clock/window/table, a pennant, and a flat hexagon named
as a honeycomb cell. They do not clearly depict geometry manipulatives or models.

A two-dimensional image can represent a physical model, so the evaluator's blanket rejection
of drawings is too strong. Nevertheless, the contrast with `VisualGeometry` warrants a
coordinated semantic review. Consider whether environmental context needs a separate descriptor;
mechanically replacing or removing the current context could admit generic diagrams in place of
the environmental competency (`SPEC-2`, `TSPEC-6`, `TSPEC-13`).

Ten physical samples cover seven targets through retained associations: `K.G.A.1-env-shapes`,
`K.G.A.1-env-shapes-other`, and two `2.G.A.1-identify-supported-shapes` variants. A caption
calling an illustration a physical model would not supply the missing witness (`CHK-V6`).

### Clock instants versus measuring durations

The `time` generator invariantly supplies `MeasuringTime`, whose involvement statement concerns
durations of events and intervals between them. All 40 canonical samples across 17 targets and
four time views read or construct a single clock time instead. This includes currently passing
samples: the issue is broader than the eleven VQA rejections.

Review the generator declaration and clock-reading/construction targets together. Adding an
elapsed-time calculation would change the competency, while deleting the descriptor without
review would leave the target encoding incomplete (`SPEC-G3`, `TSPEC-6`, `TSPEC-13`).
`TimeMeasurement` already covers clocks and times of day, but is a Scope, not an Area replacement;
the current Area catalog has no other clock/time entry. This likely needs ontology coordination.

### Sequence steps versus scale and precision

`statistical-graphs` maps `StepsOf1` to a picture-graph symbol scale. The inspected total question
uses "Each symbol = 1 item" and the solution `3 + 7 + 4 = 14`; neither displays a sequence of
consecutive values. The harmonized statement defines consecutive values whose absolute
difference is one. `time-digital-construction` similarly uses `StepsOf5` to select minute
precision, while the inspected image contains only a single time with minute value 20.

Review whether these descriptors are intended to cover scale/granularity, or whether those need
different target and producer encodings. Six digital-construction samples across two targets
claim `StepsOf5`. The observed pictograph failure is
`1.MD.C.4-find-total~358e3f7e#statistical-graphs#data-picture-graph-arithmetic#train#solution#inst:0`.
This is a semantic boundary decision; decorative sequences would not repair the original task.

### Concrete inference versus deriving a concept

`measure-mediated-comparison` shows A shorter than B and B shorter than C, then asks which of
A or C is shorter. `ConceptDerivation` covers inferring a new concept or conceptual relationship;
the evaluator overlooks the latter alternative. However, this task appears to apply transitivity
to particular ribbons rather than derive a conceptual relationship.

Review `LogicalInference` as a more direct eligible Ability for this premise-to-conclusion task.
The view declaration and `1.MD.A.1-mediated-length-comparison~1b505a26` target must be reviewed
together, preserving the measurement and mediated-relation claims (`SPEC-V5`, `SPEC-3`, `TSPEC-13`).
Four canonical samples share that target; its validation question was rejected. The underlying
relation chain and rendered comparison evidence are coherent.

## Evaluator disagreements

The initial pass also produced findings whose reasoning conflicts with visible evidence or
adds requirements absent from the supplied definition. These receive one bounded scoped
revalidation, without prompt/checklist weakening or repeated retries until a pass:

- Equal addends `7 + 7` structurally imply an even result, although Question Mode withholds it.
- Solving `52 × □ = 52` can execute an inverse procedure; `ProcedureExecution` does not
  require forward multiplication.
- The parity task explicitly displays ordinary single-digit numerals.
- A fraction model displays two equal `4/6` groups, eight `1/6` parts, and the equivalent
  equation chain, supporting repeated-operation evidence.
- Fraction word problems likewise show repeated equal groups: the inspected question has two
  craft kits with `3/8` meter each; the solution groups two copies of `2/8` into four unit parts.
- Ordering three lengths into a complete shortest-to-longest sequence can execute an ordering
  procedure; calculation algorithms and experimental protocols are examples, not exhaustive
  requirements.
- Shape-attribute comparisons explicitly display decimal numerals such as 1, 8, 0, and 6.
  Single-digit counts do not require a separate place-value lesson to support `Base10`.
- An array's ten equal square unit cells support `Square`, even when their outer boundary is
  rectangular. Its `BoxArrangement` evaluation already recognizes the unit grid.
- Crossing an hour boundary does not inherently turn a single requested time addition or
  subtraction into multiple semantic operations. The rejected `SingleStep` questions require
  one result from supplied values; carrying/borrowing is part of executing that operation.
- A circular counting image was reported as 21 hearts. Replay of its recorded recipe confirms
  19 objects, consistent with the visible layout and the bound. This sample is already covered
  by revalidation of the repaired counting view.
- A line-plot solution was reported to plot `3¼` instead of a supplied `3¾`. The actual Pencil
  card reads `3¼`, and recorded-recipe replay produces 3.25; all six plotted measurements match.

Persistent disagreements remain visible in the final cache and findings report.

Ten reviewed scopes received one forced pass, totaling 158 judgments at concurrency four.
Fourteen previous failures resolved and four previously passing samples were newly rejected;
the full-dataset failure count changed from 61 to 51. No further retries were made to chase a
passing result. The remaining disagreements are one equal-addends question, one counting
question, two fraction word-problem solutions, four shape-attribute comparisons, one square-cell
array question, and four time-interval tasks.

| Generator / view | Rechecked | Failures before | Failures after |
| --- | ---: | ---: | ---: |
| `arithmetic-ops-pairs` / `operations-boxes` | 44 | 1 | 1 |
| `arithmetic-ops-pairs` / `operations-vertical-inversion` | 32 | 1 | 0 |
| `counting-basic` / `counting-objects-parity` | 4 | 1 | 0 |
| `fraction-arithmetic` / `fractions-understanding-model` | 10 | 1 | 0 |
| `fraction-arithmetic` / `fractions-word-problem` | 16 | 2 | 2 |
| `measurement-order` / `measure-order` | 4 | 1 | 0 |
| `shape-compare-attributes` / `shape-compare-attributes` | 22 | 7 | 4 |
| `shape-unit-square-grid` / `shape-square-array-inversion` | 2 | 1 | 1 |
| `time-interval-arithmetic` / `time-interval-word-problem` | 14 | 6 | 4 |
| `measurement-data` / `measurement-line-plot` | 10 | 1 | 0 |

The repaired counting view still has one numeral-evidence rejection: its question explicitly asks
for a total in digits, while its response box remains blank. This is a Question Mode boundary
disagreement (`ArabicNumerals`/`Base10`), distinct from the repaired counting explanation. It was
not repeatedly resubmitted. The answer must remain withheld, and decorative digits would not
clarify the task's mathematical evidence.

## Verification

The initial implementation passed `npm run check`, `npm run build`, and the complete coverage
suite: 526 test files and 3,066 tests. Changed-library coverage was 96.95% statements,
80.72% branches, and 98.88% lines. The strict CCSS label-architecture audit found no rule
violations; its existing semantic review items are separate from those static checks.

An initial Windows fixture-cleanup failure passed on retry. A concurrent coverage write caused
the first Docker source-copy attempt to stop before generation; sequential execution resolved it.

After the four view repairs, `npm run check` and `npm run build` both passed again. The final
cache-aware validation reused all 1,936 records without further API calls and confirmed 51
failures with zero uncached samples. No API rate-limit errors were observed.
The final documentation check passed all local references and rule citations; four existing
external references could not be fetched in the restricted network environment.

Final verification commands and outcomes:

| Command | Outcome |
| --- | --- |
| `npm run generate:dataset -- --spec=ccss --affected --concurrency=4` | 32 rendered samples; 279 shards reused; six shards replaced |
| `npm run validate:dataset -- --spec=ccss --concurrency=4` | Complete coverage; 1,885 pass / 51 fail; exits 1 for the documented failures |
| `npm run audit:dataset -- --spec=ccss` | Exits 1 solely for those 51 failing cache records; all structural, freshness, and integrity checks clean |
| `npm run report:splits -- --spec=ccss` | No cross-split leakage or within-split task redundancy; every matched tuple has training evidence |
| `npm run report:churn -- --spec=ccss --ref=644254d` | 1,910 identical images; 26 expected image changes confined to the four repaired views; zero added/removed identities, attempt shifts, or seed changes |

The split contains 1,632 training and 304 validation images. Of 207 tuples allocated to validation,
152 have validation evidence; the report retains the 55 coverage-gap warnings and does not infer
their cause. This run did not change sampling or split membership.

The `test` cache is byte-for-byte unchanged from baseline `644254d`. Its obsolete ontology context
is intentionally outside this CCSS-only task.
