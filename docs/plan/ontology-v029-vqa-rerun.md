# Ontology v0.29 CCSS VQA rerun

## Outcome

Updated on 2026-09-27 after the numeral-system ownership, MeasuringTime definition, equation
correctness, shape recognition, category ordering, and arithmetic-offset label corrections on
branch `codex/ontology-v029-vqa-rerun`.
All **1,942 CCSS samples** have current judgments: **1,914 pass (98.6%) and 28 fail**, down from
51 failures in the initial 2026-09-26 rerun. The target-label corrections changed target hashes
and their validation allocation: the equation update removed two images, the shape update
added four, and the ordering extension added four, for a net increase of six over the initial dataset.
There are no uncached samples. The remaining failures comprise **16 samples requiring semantic
review** and **12 evaluator disagreements**. These are sample counts, not distinct defects;
some semantic concerns also affect currently passing samples.

The strict audit fails on those 28 recorded verdicts. It reports **zero** dataset-structure,
renderer-identity, duplicate-cache, malformed-cache, missing-key, obsolete-module, or stale-cache
issues. Every final failure concerns label evidence; none fails a general visual/math check.

[The machine-readable findings](ontology-v029-vqa-findings.json) contain the 28 active failed
samples with current evidence, dispositions, replay commands, and revalidation results. The 28
resolved findings and initial totals are retained separately as history: 23 passed revalidation,
and five were retired with their mislabeled targets and replaced by passing samples. The authorized
corrections moved numeral-system ownership to the views supplying its evidence and changed the
two equal-sign targets from `PlausibilityEvaluation` to `CorrectnessEvaluation` and three sorting
targets from `ShapeProperties` to `ShapeRecognition`. Full category ordering now has its own
view and ascending/descending targets; least/most selection is preserved as a separate subskill
without claiming `NumericOrder`. Ten/hundred arithmetic offsets no longer claim sequence-position
labels; their remaining rejections concern the separate numeric-boundary review. Resolved and
remaining findings are described below.

## Scope and implementation

This maintenance run upgrades `edugraph-ts` from v0.26.0 through v0.29.0 to the exact
preview `0.29.0-pre.2.59ff94cc3573`. It adopts the descriptor-text harmonization from v0.28.0,
the v0.29.0 involvement-statement helper, the broader `MeasuringTime` definition, and the new
`CorrectnessEvaluation` Ability.
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
so the current total moves from 27 to 28 failures. No sequence-position rejection remains on
the corrected offsets, and no unrelated judgment changes.

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
the object-arrow successor projection has a separate evidence concern below.

All three previous `Before` rejections are eliminated. One of those samples now passes, while
the other two fail only on numeric bounds. Across the 16 necessary rechecks, nine pass and
seven fail on the already documented component-count boundary, including two newly rejected
solutions. The [detailed report](arithmetic-offset-labels.md) records exact transitions and
the unchanged image/cache evidence; the numeric-bound issue is not considered resolved.

## Major findings requiring follow-up

### Successor principles and object-arrow evidence

K.CC.B.4c requires relating successive number names to quantities one larger. Both authored
variants legitimately require `After`, but the current `counting-inc-dec` view shows objects
and an upward arrow marked 1 rather than an explicit number sequence. Its evidence is weaker
than the ordered terms in `counting-number-sequence`. Review a successor-specific projection
that preserves the relationship between successive numbers and quantities (`IMPL-V11`, `TSPEC-13`).

This also concerns the two K.CC.A.2 count-from-number variants matched by the object-arrow view.
Their explicit sequence-view paths are preserved. These passing samples do not add to the cached
failure count; passing VQA and maintaining coverage are not proofs of adequate sequence evidence.
The arithmetic-offset correction deliberately preserves this capability pending that separate review.

### Numeric bounds and component counts

Six ten-more-less samples currently fail `NumbersLarger10` while explicitly displaying separate
place counts such as "1 one" or small tens counts. One hundred-less question fails
`NumbersLarger100` because it shows component counts 3 and 9, the unchanged lower-place value
93, and a step of 1 hundred. VQA treats those as involved quantities below the requested bound.

The required arithmetic-offset revalidation added range rejections to two unchanged solutions
(81 → 91 and 31 → 41), and changed the 393 → 293 question's rejection from `Before` to
`NumbersLarger100`. All seven remaining offset failures concern this representation boundary.

**Clarified on 2026-09-27:** range bounds include the primary task's operands and result,
including a hidden result. Digits/place-value annotations used solely to represent those
numbers are separate; actual adjustment operands are not exempt. Thus `342 - 10 = 332`
supports `NumbersLarger10`, not `NumbersLarger100`. This supersedes the earlier proposed
exception for smaller adjustments. Concrete label definitions must carry the clarification;
VQA does not automatically include parent definitions.

The [numeric-range investigation](numeric-range-bounds.md) replays all 98 positive-lower-bound
samples and verifies their content fingerprints. It finds ten additional semantic conflicts
in currently passing samples: four grade-two ten-offset images exclude the operand 10 from
their lower bound of 100, and six one-step object-arrow images exclude 1 from a lower bound
of 5. The latter checklist explicitly instructs VQA to ignore the step, contrary to the
clarified interpretation (`CHK-V6`). The seven cached component-count failures and these ten
passing-but-mislabeled samples are distinct; the cache totals remain unchanged.

Separating numeric bounds from the existing operand digit-count labels is viable without a
new payload or view family. An in-memory capability experiment preserves all 683 targets
and 832 tuple relationships. It is not an implemented repair. The user explicitly approved
ignoring 2.NBT.B.8's pedagogically arbitrary 900 starting cutoff; a comment in that standard's
target block records the decision. The current `959 - 10 = 949` sample therefore needs no
correction for exceeding 900, while its `NumbersLarger100` claim remains incorrect. Smaller
hidden results and the other result-boundary gaps remain open. The agreed ontology wording
uses "serving as inputs or results of the task" in each concise range definition. No generator behavior, target
labels, ontology definitions, checklists, or VQA records have changed; only the target comment
and investigation documentation have been updated.

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

Persistent disagreements remain visible in the final cache and findings report.

On 2026-09-26, ten reviewed scopes received one forced pass, totaling 158 judgments at concurrency four.
Fourteen previous failures resolved and four previously passing samples were newly rejected;
the full-dataset failure count changed from 61 to 51 before the ownership correction reduced it
to 44, the MeasuringTime update reduced it to 32, the equation correction reduced it to 31,
and the shape recognition correction reduced it to 27. Category ordering preserved that count;
the necessary offset rechecks later moved it to 28 through the separate numeric-bound review.
No further retries were made to chase a passing result. The 12 current disagreements are one
equal-addends question, one counting question, two fraction word-problem solutions, four
shape-attribute comparisons, one square-cell array question, and three time-interval tasks.
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

The repaired counting view still has one numeral-evidence rejection: its question explicitly asks
for a total in digits, while its response box remains blank. This is a Question Mode boundary
disagreement (`ArabicNumerals`/`Base10`), distinct from the repaired counting explanation. It was
not repeatedly resubmitted. On 2026-09-27, the user explicitly confirmed that requesting a digit
answer supports these labels. Its unchanged image and validation context retained the cached
disagreement. The answer must remain withheld, and decorative digits would not clarify the task's
mathematical evidence.

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

The latest validation confirmed **28 failures and zero uncached samples** after 16 new judgments
and 1,926 reused records. No API rate-limit errors were observed. The documentation check passed
all local references and rule citations; four existing
external references could not be fetched in the restricted network environment.

Current verification commands and outcomes (2026-09-27):

| Command | Outcome |
| --- | --- |
| `npm run generate:dataset -- --spec=ccss --affected --concurrency=4` | Arithmetic offsets: 16 canonical renders, four shards written and 283 reused; every image hash unchanged |
| `npm run validate:dataset -- --spec=ccss --concurrency=4` | Complete coverage; 1,914 pass / 28 fail; nine of 16 new judgments pass, seven fail only on numeric bounds; exits 1 for the documented failures |
| `npm run audit:dataset -- --spec=ccss` | Exits 1 solely for those 28 failing cache records; all structural, freshness, and integrity checks clean |
| `npm run report:splits -- --spec=ccss` | No cross-split leakage or within-split task redundancy; every matched tuple has training evidence |
| `npm run report:churn -- --spec=ccss --ref=e112e3e` | Arithmetic offsets: all 1,942 images identical, no added/removed identities, no attempt or seed changes |
| `npm run report:churn -- --spec=ccss --ref=644254d` | Entire maintenance run: 1,895 identical images and 29 expected changes from earlier repairs, plus 18 added/12 removed equation and sorting identities; no retained-identity attempt or seed changes |

The split contains 1,636 training and 306 validation images. Of 208 tuples allocated to validation,
153 have validation evidence; the report retains the same 55 coverage-gap warnings and does not
infer their cause. The equation correction removed one validation allocation, while the shape
recognition correction adds two. Category ordering adds four training images and replaces the
previous most-selection validation allocation with a least-selection allocation, without changing
the validation total. Sampling policy and sample identities outside the corrected equation and
sorting targets are unchanged.

The `test` cache is byte-for-byte unchanged from baseline `644254d`. Its obsolete ontology context
is intentionally outside this CCSS-only task.
