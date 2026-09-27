# Ontology v0.29 CCSS VQA rerun

## Outcome

Updated on 2026-09-27 after the numeral-system ownership, MeasuringTime definition, equation
correctness, shape recognition, category ordering, arithmetic-offset label, numeric-range,
successor-evidence, and grouped-word-problem corrections on
branch `codex/ontology-v029-vqa-rerun`.
All **1,934 CCSS samples** have current judgments: **1,906 pass (98.6%) and 28 fail**, down from
51 failures in the initial 2026-09-26 rerun. The target-label corrections changed target hashes
and their validation allocation: the equation update removed two images, the shape update
added four, the ordering extension added four, and the numeric-range correction removed eight,
for a net decrease of two from the initial dataset.
There are no uncached samples. The remaining failures comprise **12 samples requiring semantic
review** and **16 evaluator disagreements**. These are sample counts, not distinct defects;
some semantic concerns also affect currently passing samples.

The strict audit fails on those 28 recorded verdicts. It reports **zero** dataset-structure,
renderer-identity, duplicate-cache, malformed-cache, missing-key, obsolete-module, or stale-cache
issues. Every final failure concerns label evidence; none fails a general visual/math check.

[The machine-readable findings](ontology-v029-vqa-findings.json) contain the 28 active failed
samples with current evidence, dispositions, replay commands, and revalidation results. The 40
resolved finding records and initial totals are retained separately as history: 28 passed
revalidation, and twelve were retired with their mislabeled targets and replaced by passing
samples. This history includes the word-problem defect found and repaired within the latest run.
The authorized
corrections moved numeral-system ownership to the views supplying its evidence and changed the
two equal-sign targets from `PlausibilityEvaluation` to `CorrectnessEvaluation` and three sorting
targets from `ShapeProperties` to `ShapeRecognition`. Full category ordering now has its own
view and ascending/descending targets; least/most selection is preserved as a separate subskill
without claiming `NumericOrder`. Ten/hundred arithmetic offsets no longer claim sequence-position
labels; their input/result bounds and independent operand digit profiles are now corrected.
All 20 current offset/successor images pass. New semantic findings concern the finite supply
in count-out tasks and explanatory Ability claims on direct property/conversion tasks. Resolved and
remaining findings are described below.

## Scope and implementation

This maintenance run upgrades `edugraph-ts` from v0.26.0 through v0.29.0 to the exact
preview `0.29.0-pre.3.dee88508f2f8`. It adopts the descriptor-text harmonization from v0.28.0,
the v0.29.0 involvement-statement helper, the broader `MeasuringTime` definition, and the new
`CorrectnessEvaluation` Ability, and the clarified input/result numeric-range definitions.
Only **CCSS** is regenerated and validated; the isolated `test` dataset and cache
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

The 2026-09-27 ownership correction regenerated 48 samples across seven affected pairs, replacing
10 shards and reusing 275. Revalidation made 18 new judgments at concurrency four and reused
1,918 current records. Seven failing samples became passing, with no newly rejected samples.
The [detailed follow-up](numeral-system-ownership.md) records consumer adoption and verification.

The subsequent [MeasuringTime follow-up](measuring-time-definition.md) changes only that ontology
definition. Canonical graph reconstruction reuses all 285 shards without rendering. VQA rechecks
58 time samples at concurrency four and reuses 1,878 records. The eleven clock failures and four
previous arithmetic disagreements pass; three other arithmetic samples receive `SingleStep`
rejections, reducing total failures from 44 to 32.

The [equation correctness follow-up](equation-correctness.md) adopts the next preview and
corrects both equal-sign target permutations and their view. Canonical generation renders four
replacement samples in one shard, reuses 283 shards, and retires six old sample identities.
All four new judgments pass at concurrency four; 1,930 unchanged records are reused. Total
failures fall from 32 to 31, with no new rejection.

The [shape recognition follow-up](shape-recognition.md) replaces the `ShapeProperties` Scope in
the two sorting views and three K.MD.B.3 target permutations with `Area.ShapeRecognition`.
It renders ten replacement samples in four shards, reuses 282 shards, and retires six old
identities. All ten new judgments pass at concurrency four; 1,928 unchanged records are reused.
Total failures fall from 31 to 27, with no new rejection. At that point, the separate `NumericOrder`
concern remained open despite the passing replacement judgments.

The [category ordering follow-up](category-ordering.md) extends the shared mathematical payload
and separates full ordering from least/most selection. The shared type change triggers broad
canonical regeneration: 1,942 images, 221 written shards, and 66 reused shards. Ten new sorting
identities replace six old ones, and all ten new VQA judgments pass at concurrency four. All
1,932 retained image hashes, seeds, attempts, judgment timestamps, and evaluations are unchanged.
The pipeline refreshes only `generation_plan.inputHash` on 1,730 retained cache records; their
semantic plan hashes and VQA contexts remain unchanged. No extra live judgments are needed for them.

The [arithmetic-offset follow-up](arithmetic-offset-labels.md) separates the two offset generators'
direction declarations from their inherited counting/sequence bundles. Canonical regeneration
renders 16 images in four shards and reuses 283 shards. All 1,942 images, seeds, attempts, and
sample identities remain unchanged; the other 1,926 cache records are byte-for-byte identical.
VQA makes 16 requests at concurrency four: nine pass and seven fail only on numeric bounds.
One previous failure passes, while two previously passing solutions receive range-label rejections,
so that checkpoint moves from 27 to 28 failures. No sequence-position rejection remains on
the corrected offsets, and no unrelated judgment changes.

The [numeric-range follow-up](numeric-range-bounds.md) publishes the agreed ontology wording
directly from `main`, adopts its preview, and separates offset operand-size profiles from global
arithmetic bounds. Canonical generation renders 20 images, writes five shards, and reuses 281.
Fourteen corrected offset identities replace 16 old ones; six invalid K.CC.A.2 arithmetic images
retire, yielding 1,934 samples. Six retained successor images change to show ordered start/result
positions. Three earlier winning retry attempts follow from newly freed duplicate payloads;
their former draws still reproduce exactly, and the seed derivation is unchanged.

The changed range definitions require 794 judgments at concurrency four. A temporary HTTP 503
leaves two samples uncached after 792 completed judgments; no HTTP 429 or rate-limit error is
observed. The next validation reuses 1,924 judgments and successfully completes those two missing
samples plus eight changed word-problem images. The original division-story defect passes after
the repair. The final singular/plural correction rechecks two of those images, both passing,
and reuses the other 1,932 judgments. This follow-up completes 804 live judgments, including the
repair rechecks. No repeated requests are made merely to replace a failing verdict with a pass.

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
31 of the 32 initially revalidated samples pass. The residual counting rejection is discussed
below and passes during the later numeric-range definition refresh.

The numeric-range refresh also exposes one incorrect division-story question: "90 items are
shared equally among 45 groups. How many are there now?" does not ask for the quotient's
per-group quantity. Commit `5f9d310` makes division ask for items in each group and multiplication
ask for the total, and identifies the unknown group quantity correctly in inverse problems.
Addition, subtraction, and length-story wording remain unchanged. Commit `72efab1` also fixes
singular item/group nouns and is/are agreement in grouped stories. Eleven new regressions cover
these repairs; all 25 tests across the three relevant suites pass, along with the typecheck,
specification audit, and build. Eight images change in total, and all eight pass VQA.

## Resolved findings

### Numeral-system labels on object-only tasks

**Resolved on 2026-09-27** in `879fe74`, with VQA results committed in `34d77e2`.
The `counting-basic`, `counting-classify-count`, and `counting-classify-sort` producers no longer
claim `Base10`. That representation now belongs to their views that display decimal numerals or
explicitly request a digit response (`SPEC-5`, `SPEC-G3`, `SPEC-11`). The user confirmed that such
requests support numeral-system labels even while Question Mode keeps the answer box empty.

All six `counting-conservation` and four `sorting-classify-sort` images now omit both `Base10`
and `ArabicNumerals`. Their valid quantity, integer, and range claims remain. Written-response
views retain their numeral claims, with explicit digit instructions added to one-to-one,
classify/count, and the compatible cardinality view. No targets or matching pairs were removed.

All six conservation images pass. The classify/count question and one most-selection question
also changed from failing to passing, reducing the total failure count by seven. At that stage,
four sorting images still failed on the separate shape-property issue. The shape recognition
correction below subsequently resolves those failures. The cached simple-counting digit-answer
disagreement remains open; the independent `NumericOrder` concern is resolved below.

The [ownership correction report](numeral-system-ownership.md) contains the complete adoption
matrix, per-view results, and verification evidence.

### Clock instants versus measuring durations

**Resolved on 2026-09-27** by adopting ontology preview `0.29.0-pre.1.6282636d6637` in
`5f7c5f0`, with VQA results in `100dabb`. The user confirmed that `MeasuringTime` should cover
clock/calendar points as well as durations. Its revised definition now reads:

> Determining, representing, or comparing times of day, calendar dates, or elapsed durations using temporal reference systems and units.

The installed preview changes only this definition. Existing clock-reading/construction labels
and targets therefore remain appropriate. All 40 clock samples now pass, and all 58 rechecked
time samples accept `MeasuringTime`. No images, labels, seeds, or generation plans changed.
The [definition correction report](measuring-time-definition.md) records the dependency,
verification, and three residual `SingleStep` disagreements. The separate sequence-step concern
below remains open.

### Exact equation truth versus plausibility

**Resolved on 2026-09-27** by adopting preview `0.29.0-pre.2.59ff94cc3573` in `5720938`,
correcting the view and CCSS targets in `582930e`, and validating the replacements in `a61e7ae`.
The standard requests exact truth judgments about addition/subtraction equations; the existing
exercise was appropriate. Its `PlausibilityEvaluation` label described a different performance.

The preview adds `CorrectnessEvaluation` under `Evaluation`:

> Judging whether a statement, result, or solution is correct according to applicable facts, definitions, rules, or task requirements.

This covers both true and false equations without requiring a shown procedure or an actual
mistake. The view now owns that Ability, and both `1.OA.D.7-equal-sign` permutations request it
(`SPEC-2`, `SPEC-V5`, `TSPEC-6`, `TSPEC-13`). Mathematics, rendering, and the checklist are unchanged.

Addition target `~6f678d9f` becomes `~e3a36789`; subtraction `~9cf60b5d` becomes `~f3b9f3e3`.
All four resulting images pass, including a false equation whose solution correctly selects
False. All other 1,930 images and evaluation records are unchanged. The old failed addition
question is preserved in history as resolved by target replacement, not falsely reported as a
passing revalidation. The [detailed report](equation-correctness.md) records target mapping,
expected split changes, and a separate pre-existing task-fingerprint review item.

### Shape properties versus shape recognition

**Resolved on 2026-09-27** in `603cac0`, with VQA results in `084af8c`. Both sorting views and
their three K.MD.B.3 target permutations now claim `Area.ShapeRecognition`. The user agreed
that visually identifying and grouping circles, squares, and triangles supports this Area;
the old `Scope.ShapeProperties` describes physical features permitting or constraining
manipulation, such as rolling, folding, and stacking.

The generators supply abstract category counts; the views supply the geometric shapes and
therefore own the independent shape-recognition Area (`SPEC-2`, `SPEC-11`, `TSPEC-13`). Existing
counting, sorting, numeric, and Ability claims are retained. Rendering, mathematics, and
checklists are unchanged.

All ten replacement images pass, including all four classify/count and six most/least samples.
The four old failures are retained in history as resolved by target replacement. Two earlier
numeral-system resolutions also gain replacement-sample references while retaining their
historical pass timestamps. All other 1,928 images and evaluation records are unchanged.

The [detailed report](shape-recognition.md) records the three target mappings, expected addition
of four validation images, ownership review, and verification. The following change resolves
the separate incomplete-ordering concern.

### Most/least selection versus a complete numeric order

**Resolved on 2026-09-27** in `b5e11c6`, with VQA results in `a41af55`. The user approved
preserving the existing capability while extending the mathematics and separating the views.

`counting-classify-sort` now supplies the complete ascending order as equal-count groups and
both endpoint sets. Its relation schema supports `Least`, `Most`, `AscendingOrder`, and
`DescendingOrder`. The new `sorting-classify-order` leaf requests every category and its count,
and its solution displays the full sequence, including ties. For example, the descending
solution shows Circle 2 = Square 2 > Triangle 1. This leaf owns `NumericOrder`, requires that
Area explicitly in the target, and owns numeral labels through its digit-count response.

The existing `sorting-classify-sort` leaf retains object-only least/most selection with a
unique correct category. Both leaves share rendering and accept the complete common payload;
positive relation compatibility selects their production paths (`IMPL-G8`, `SPEC-V6`,
`SPEC-V7`, `SPEC-11`, `IMPL-V11`). No evaluator or central checklist is weakened.

The old two `K.MD.B.3-sort-by-count` permutations become ascending and descending targets
`~610728d1` and `~98f9e643`. Separate `K.MD.B.3-select-by-count` targets `~2ca2ef8c` and
`~501842ea` preserve least and most. The latter are explicitly documented as our supporting
subskill decomposition of K.MD.B.3, not a separate CCSS requirement. A small inherited
generator range defect is also repaired so every category respects a higher requested minimum;
current CCSS sampling with a minimum of one is unchanged.

All ten new images were inspected and pass VQA with every label defendable. The total failure
count stays at 27 because the six retired images had already passed: this closes a confirmed
semantic coverage defect that passing VQA had not detected. The [detailed report](category-ordering.md)
records matching, canonical regeneration, provenance-only cache changes, and verification.

## Resolved: Arithmetic offsets and sequence-position labels

**Resolved on 2026-09-27** in `8598ac3`, with VQA results in `a7290e3`.

The ten/hundred-more-less views correctly demonstrate arithmetic offsets, such as finding 100
less than 393. Their targets already request `Increment` or `Decrement`; the unsupported
`Before`/`After` labels came from an inherited generator direction bundle. The user approved
the scoped declaration correction after reviewing current consumers and removal alternatives.

`counting-ten-offset` and `counting-hundred-offset` now share an arithmetic-only direction schema.
They no longer support or emit `Before`, `After`, `AdditiveCount`, or `SubtractiveCount`.
Their mathematics, payloads, views, and six CCSS targets remain unchanged (`SPEC-G3`, `IMPL-G4`).
All 683 targets and 832 matching tuples are preserved, with exactly six changed plans.

The shared one-step schema is retained: removing its position labels would lose four matches
and leave both K.CC.B.4c successor variants unsupported. The independent sequence generator
also retains its valid `After` capability. Its explicit sequence task establishes that relation;
the object-arrow successor projection had a separate evidence concern, resolved below.

All three previous `Before` rejections are eliminated. One of those samples now passes, while
the other two fail only on numeric bounds. Across the 16 necessary rechecks, nine pass and
seven fail on the already documented component-count boundary, including two newly rejected
solutions. The [detailed report](arithmetic-offset-labels.md) records exact transitions and
the unchanged image/cache evidence at that checkpoint. The subsequent correction below resolves
the offset numeric-bound issue.

### Numeric bounds and component counts

**Resolved on 2026-09-27:** ontology `main` commit `dee8850` changes all 19 concrete range
definitions to bound numerical values "serving as inputs or results of the task". Content
dependency commit `0e7ccb8` adopts published preview `0.29.0-pre.3.dee88508f2f8`; implementation
commit `4b5cd9c` applies the corrected contract. The inclusive absolute-value bounds include
actual operands and hidden results. Place-value annotations used only to represent those values
are separate. Thus `342 - 10 = 332` requires `NumbersLarger10`, not `NumbersLarger100`.

The offset producers check the starting quantity, fixed step, and result. Optional
`TwoDigitLargestOperand` / `ThreeDigitLargestOperand` profiles independently preserve the intended
starting sizes and ensure the start is a largest operand. Six CCSS target permutations adopt
these profiles, with the grade-two ten-step lower bound corrected to 10. The old seven failing
offset identities retire with their target hashes and are replaced by corrected samples.

The same rule makes operand 1 incompatible with the two K.CC.A.2 targets' lower bound of 5.
Only those two impossible arithmetic paths and their six samples are removed; both targets and
their valid sequence paths remain. The checklist exemption that previously excluded the step is
removed (`CHK-V6`). Matching retains all 683 targets and 212 compatible producer/view pairs,
with 830 tuples and no unsupported target.

The [detailed correction](numeric-range-bounds.md) records exact domain preservation, replay and
matching evidence. The 2.NBT.B.8 cutoff of 900 remains intentionally relaxed, as the user requested
and the target comment records. Existing restrictions on zero results and results crossing digit
boundaries remain a separate coverage expansion; this correction does not claim complete coverage
of those starting-number standards. The new count-out supply issue below is also separate.

### Successor principles and object-arrow evidence

**Resolved in `4b5cd9c`:** the retained `counting-inc-dec` tasks now show countable starting
objects, an explicit starting numeral, ordered Start/After or Before/Start positions, and a signed
directional step. Question Mode withholds the result; Solution Mode reveals it. This relates
successive numbers to the change in quantity and supplies the required `After`/`Before` evidence
without deleting the successor capability (`IMPL-V11`, `TSPEC-13`). The mathematical payload is
unchanged. K.CC.A.2 retains its valid explicit-sequence route as described above.

## Major findings requiring follow-up

### Count-out supply versus numeric bounds

The refreshed question
`K.CC.B.5-how-many~23fafedc#counting-basic#counting-objects-count-out#train#question#inst:0`
asks the learner to color 9 objects from a displayed pool of 14 diamonds while claiming
`NumbersSmaller10`. Exact replay confirms a requested count of 9; the view adds five spare
objects. This is an actual range conflict, not a counting error by the evaluator: the supplied
finite collection is part of the task's input.

The mathematical payload should supply a bounded available count instead of the view inventing
one (`IMPL-V8`, `IMPL-V11`). A view-only cap cannot inspect generator-owned range parameters
(`SPEC-V2`). A boundary policy also needs review: requesting the maximum allowed count leaves
no room for a strictly larger pool under the same bound. Decide whether such tasks may use the
entire pool, should exclude that requested count, or need a different target range. No silent
target restriction or payload-contract change was made during this correction.

### Applying a property or conversion versus explaining a procedure

Two refreshed questions claim `ProcedureUnderstanding`, defined as explaining how and why a
procedure's steps, order, and conditions produce its intended outcome, without requesting that
explanation:

- `1.OA.B.3-properties~1cdccfff`, `operations-properties`, shows the commutative property and
  asks the learner to complete `4 + 4 + 7 = 7 + 4 + □`.
- `2.NBT.A.1b-hundreds~229993b4`, `place-value-hundreds-bundles`, asks for the number represented
  by 9 hundreds, with 900 as the hidden answer.

These tasks may exercise valid property application or place-value knowledge, but the displayed
actions do not establish the declared explanatory Ability. Review target intent and view evidence
together (`SPEC-V5`, `TSPEC-13`); an ornamental explanatory caption would not repair a mismatched
learner action. These findings are recorded for semantic review rather than relabeled automatically.

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
All clock samples pass after the MeasuringTime definition update, but the `StepsOf5` definition
and task evidence are unchanged, so that semantic review remains open.

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
adds requirements absent from the supplied definition. These received one bounded scoped
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
- Two missing-operand equations, `433 - □ = 198` and `54 ÷ □ = 2`, are rejected for
  `Formalization` because no informal-to-formal translation is requested. The actual definition
  covers expressing information according to formal rules and conventions; it does not impose
  that additional translation requirement.
- The place-value comparison `10 < 100` is rejected for `NumbersWithoutZero` because its ones
  columns say "none". Those are representational components of nonzero task values, consistent
  with the user's clarification and the ontology's exclusion of zero digits as separate quantities.

Persistent disagreements remain visible in the final cache and findings report.

On 2026-09-26, ten reviewed scopes received one forced pass, totaling 158 judgments at concurrency four.
Fourteen previous failures resolved and four previously passing samples were newly rejected;
the full-dataset failure count changed from 61 to 51 before the ownership correction reduced it
to 44, the MeasuringTime update reduced it to 32, the equation correction reduced it to 31,
and the shape recognition correction reduced it to 27. Category ordering preserved that count;
the necessary offset rechecks later moved it to 28 through the separate numeric-bound review.
No further retries were made to chase a passing result. The required numeric-range refresh later
passes the previous equal-addends and digit-answer counting questions and two shape comparisons.
It also introduces new interpretations of unchanged tasks. The 16 current disagreements comprise
two fraction word-problem solutions, six shape-attribute comparisons, one square-cell array
question, three time-interval tasks, two missing-operand formal equations, one representational
zero-component judgment, and one parity question's decimal notation.
The table records the original 2026-09-26 recheck.

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

The MeasuringTime update necessarily rechecked all 14 time-interval samples. All four earlier
failures passed, while three previously passing samples were rejected for the same hour-rollover
interpretation of `SingleStep`. Their canonical images show one requested time addition with
correct arithmetic. The [current findings JSON](ontology-v029-vqa-findings.json) records these
three new verdicts and preserves the four resolved ones separately. This is evaluator variation
on the existing task-granularity disagreement; the images and `SingleStep` definition did not change.

The repaired counting view previously had one numeral-evidence rejection: its question explicitly asks
for a total in digits, while its response box remains blank. This is a Question Mode boundary
disagreement (`ArabicNumerals`/`Base10`), distinct from the repaired counting explanation. It was
not repeatedly resubmitted. On 2026-09-27, the user explicitly confirmed that requesting a digit
answer supports these labels. Its unchanged image retained the cached disagreement until the
required numeric-range definition refresh, when it passed. The answer remains withheld; no
decorative digits or prompt weakening were needed.

## Verification

The initial implementation passed `npm run check`, `npm run build`, and the complete coverage
suite: 526 test files and 3,066 tests. Changed-library coverage was 96.95% statements,
80.72% branches, and 98.88% lines. The strict CCSS label-architecture audit found no rule
violations; its existing semantic review items are separate from those static checks.

An initial Windows fixture-cleanup failure passed on retry. A concurrent coverage write caused
the first Docker source-copy attempt to stop before generation; sequential execution resolved it.

After the four initial view repairs, `npm run check` and `npm run build` both passed again.
The 2026-09-26 cache-aware validation confirmed 51 failures with zero uncached samples.

After the ownership correction, `npm run check -- --spec=ccss` and the complete coverage suite
passed: **527 test files and 3,074 tests**, including eight new ownership/matching regression cases.
All generator coverage thresholds passed. The strict label-architecture audit reports zero
violations and 93 existing review items. All 681 targets and 830 matching tuples are preserved;
17 generation plans record the ownership transfer.

After the MeasuringTime preview update, repository checks, the build, and the same complete coverage
suite passed again. One initial documentation-fixture cleanup failed with a Windows `EPERM`;
one complete retry passed without source changes.

The CorrectnessEvaluation preview and target correction also pass repository checks, the build,
and all 3,074 tests across 527 files. Matching preserves all 681 target competencies and 830
tuples, replacing only the two expected target IDs. The strict label-architecture audit remains
at zero violations and 93 review items.

The shape recognition correction passes the same complete checks, build, and coverage suite.
Matching preserves all 681 target competencies and 830 tuples, replacing only three target IDs.
The strict label-architecture audit reports zero violations and 95 review items: 93 existing
entries and two new view-owned-Area entries. The latter are reviewed in the
[shape recognition report](shape-recognition.md); they reflect the intended independent
geometric capability supplied by the views.

The category-ordering extension passes repository checks, the build, and **3,143 tests across
530 files**, including 86 focused cases. The changed generator has 100% statement and branch
coverage. Matching now has 683 targets, 212 compatible pairs, and 832 tuples. The label audit
reports zero violations and 97 review items; its two additional entries concern the new view's
independent Areas and explicit `NumericOrder` precondition, reviewed in the detailed report.

The arithmetic-offset correction passes **3,150 tests across 530 files**, including 57 focused
cases, the build, and CCSS repository checks. It preserves all targets and matches, changes only
six offset plans, and leaves the strict label audit at zero violations and 97 review items.

The numeric-range correction passes **3,197 tests across 533 files** and all coverage thresholds;
the three offset generator implementations have 100% statement and branch coverage. Its domain
checks cover 264 bounded configurations. Subsequent word-problem changes pass the 25 focused
view tests and final full CCSS repository checks and build. Matching retains all 683 targets and
212 compatible pairs, with 830 tuples after two impossible arithmetic paths retire. The strict
label audit reports zero violations and 97 review items.

The latest validation confirms **1,906 pass / 28 fail / zero uncached**. All 20 current offset
and successor images pass, as do the eight repaired word-problem images. One temporary HTTP 503
was recovered through cache-aware resumption; no API rate-limit errors were observed. Final VQA
cache commit: `3e2920e`. The documentation check verifies local references and rule citations;
four existing external references cannot be fetched in the restricted network environment.

Current verification commands and outcomes (2026-09-27):

| Command | Outcome |
| --- | --- |
| `npm run generate:dataset -- --spec=ccss --affected --concurrency=4` | Numeric/successor repair: 20 renders, five shards written, 281 reused. Each word-helper repair schedules 132 renders, writes two shards and reuses 284; eight distinct story images change |
| `npm run validate:dataset -- --spec=ccss --concurrency=4` | 804 completed live judgments across the range refresh, interrupted-request resumption, and repair rechecks; final 1,906 pass / 28 fail / zero uncached; exits 1 for the documented failures |
| `npm run audit:dataset -- --spec=ccss` | Exits 1 solely for those 28 failing cache records; all structural, freshness, and integrity checks clean |
| `npm run report:splits -- --spec=ccss` | No cross-split leakage or within-split task redundancy; every matched tuple has training evidence |
| `npm run report:churn -- --spec=ccss --ref=cac26a3` | Latest follow-up: 1,906 identical retained images, 14 intended changes, 14 added/22 removed identities; three explained successor retry changes and no seed-scheme changes |
| `npm run report:churn -- --spec=ccss --ref=644254d` | Entire maintenance run: 1,859 identical retained images, 43 intended changes, 32 added/34 removed identities; the same three explained successor retry changes |

The final split contains 1,632 training and 302 validation images. All 830 matched tuples have
training evidence. Of 206 tuples allocated to validation, 151 have validation evidence; the report
retains the same 55 coverage-gap warnings and does not infer their cause. There is no cross-split
leakage or within-split configured-task redundancy. The numeric target replacements and removal
of invalid arithmetic paths account for the latest allocation changes. Sampling policy is unchanged.

The `test` cache is byte-for-byte unchanged from baseline `644254d`. Its obsolete ontology context
is intentionally outside this CCSS-only task.
