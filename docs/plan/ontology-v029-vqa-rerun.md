# Ontology v0.29 CCSS VQA rerun

## Outcome

Updated on 2026-09-28 after the numeral-system ownership, MeasuringTime definition, equation
correctness, shape recognition, category ordering, arithmetic-offset label, numeric-range,
successor-evidence, grouped-word-problem, count-out-supply, completion/explanation, operand-cardinality,
whole-tens subtraction, spatial-construction, whole-share Ability, environmental-image,
multiples-of-five, and picture-graph scale corrections on
branch `codex/ontology-v029-vqa-rerun`.
All **1,970 CCSS samples** have current judgments: **1,952 pass (99.1%) and 18 fail**, down from
51 failures in the initial 2026-09-26 rerun. Target-label and producer-contract corrections changed
sample identities and validation allocation: the equation update removed two images, the shape
update added four, the ordering extension added four, the numeric-range correction removed eight,
the count-out producer replacement removed two, the completion/explanation split added 30,
and the whole-tens target correction added four. The multiples-of-five and subsequent graph-scale
target migrations each add two validation images through the existing allocation policy, for a net
increase of 34 from the initial dataset. There are no uncached samples. The remaining failures comprise
**1 sample requiring semantic review** and **17 evaluator disagreements**. These are sample counts, not distinct defects;
some semantic concerns also affect currently passing samples.

The strict audit fails on those 18 recorded verdicts. It reports **zero** dataset-structure,
renderer-identity, duplicate-cache, malformed-cache, missing-key, obsolete-module, or stale-cache
issues. Every final failure concerns label evidence; none fails a general visual/math check.

[The machine-readable findings](ontology-v029-vqa-findings.json) contain the 18 active failed
samples with current evidence, dispositions, replay commands, and revalidation results. The 57
resolved finding records and initial totals are retained separately as history: 38 passed
revalidation, and nineteen were retired with corrected targets or producer contracts and replaced
by passing samples. This history includes the word-problem defect repaired during the numeric-range follow-up.
The authorized
corrections moved numeral-system ownership to the views supplying its evidence and changed the
two equal-sign targets from `PlausibilityEvaluation` to `CorrectnessEvaluation` and three sorting
targets from `ShapeProperties` to `ShapeRecognition`. Full category ordering now has its own
view and ascending/descending targets; least/most selection is preserved as a separate subskill
without claiming `NumericOrder`. Ten/hundred arithmetic offsets no longer claim sequence-position
labels; their input/result bounds and independent operand digit profiles are now corrected.
All 20 current offset/successor images and all ten bounded count-out images pass. The latter now
receive their available collection size from the generator, including valid exact-size pools.
Property and hundreds-bundle completion now have appropriate Abilities and distinct explanation
tasks. All 40 replacement samples now pass overall after the agreed operand-cardinality clarification.
Operands are counted across the complete expression, including nested operations and repeated
occurrences. Both distributive failures are resolved without changing their images or labels.
The subsequent whole-tens correction resolves the single-place subtraction review: six
`1.NBT.C.6` targets now use `Subtraction` with `PlaceValue`, preserving their model, written-method,
and explanation requirements. Identifiable partitioning routes remain supported, with unchanged
images and judgments. All 16 replacement whole-tens samples pass. Spatial construction now has
its own view and `SpatialGeneration` Ability, preserving the selection task with `SpatialImagination`.
All 42 replacement construction images pass. The picture-graph scale review, extended to the
question by the required 732-sample refresh, is now resolved for both modes. The related review of
four whole-from-shares fraction targets is also resolved: their view and targets now use
`ConceptualThinking`, and all eight unchanged exercises pass under the corrected label.
The five environmental objects now use fixed, realistic AI-generated images and precise surface
prompts. All ten updated exercises pass with their existing labels, resolving six failures;
one window question retains an uncertain `PhysicalGeometry` check under the existing pass policy.
Clock minutes and five-scale graph quantities now use `MultiplesOf5`; bar-graph views retain the
genuine `StepsOf5` evidence on their numbered axes. All 30 migrated samples pass with 218
defendable label checks. This resolves the five-minute precision review. The subsequent graph-scale
correction replaces the remaining picture sequence claims with quantity constraints, preserving
single-unit tasks without a divisibility label. Bar views own their numbered axis steps. All 54 fresh
judgments pass with 348 defendable label checks, resolving both unit-picture failures without a new rejection.
Resolved and remaining findings are described below.

## Scope and implementation

This maintenance run upgrades `edugraph-ts` from v0.26.0 through v0.29.0 to the exact
preview `0.29.0-pre.5.a88ac7a500c5`. It adopts the descriptor-text harmonization from v0.28.0,
the v0.29.0 involvement-statement helper, the broader `MeasuringTime` definition,
`CorrectnessEvaluation`, the clarified input/result numeric-range definitions,
expression-wide operand cardinality, and `MultiplesOf5`.
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

The [count-out supply follow-up](count-out-supply.md) gives selection tasks a precise mathematical
payload with bounded requested and available counts. The shared type change triggers 1,932 renders,
228 written shards, and 58 reused shards. Ten new count-out images replace twelve old identities;
the linear variant is no longer allocated to validation. All 1,922 retained images, seeds, attempts,
and semantic plans remain unchanged. VQA makes ten requests at concurrency four, all passing, and
reuses all 1,922 retained judgments. Only `generation_plan.inputHash` changes on 1,762 retained cache
records. Total failures fall from 28 to 27; no new rejection or API error occurs.

The [completion/explanation follow-up](procedure-task-separation.md) retains the five explanation
target permutations and adds five completion permutations. A precise property producer supplies
complete law relations; separate views distinguish applying a property or reading bundles from
explaining the method. The legacy box and vertical property formats remain available for completion.
Canonical generation renders 1,962 images, writes 226 shards, and reuses 65 shards. Forty new
identities replace ten old ones. All 1,922 retained images, labels, seeds, attempts, replay receipts,
and semantic plans remain unchanged. VQA makes 40 requests at concurrency four: 38 pass, and two
fail only on `ThreeOperands`. It reuses all 1,922 retained judgments, refreshing only
`generation_plan.inputHash` on 1,726 records. Both original Ability failures retire with passing
replacement tasks; the separate operand-cardinality findings keep the total at 27. No API error occurs.

The [operand-cardinality follow-up](operand-cardinality.md) clarifies the parent and all three
concrete operand-count definitions on ontology `main`, then adopts its published preview.
Canonical reconstruction reuses all 291 shards with no renders or written shards. All 1,962
images, labels, identities, replay receipts, semantic plans, seeds, and attempts remain unchanged.
VQA makes 732 required requests at concurrency four: 725 pass and seven fail on unrelated labels.
All 1,230 unaffected judgments remain byte-identical. Both distributive failures and two previous
`Formalization` disagreements pass; five previously passing samples receive new label rejections.
This moves the total from 27 to 28 failures. No API or rate-limit error occurs, and no verdict is
retried merely to obtain a pass. Operand checks comprise 731 defendable and one uncertain verdict,
with none rejected; the uncertain pictorial-division sample still passes under the existing policy.

The [whole-tens subtraction follow-up](whole-tens-subtraction.md) corrects six `1.NBT.C.6` target
variants and prevents the generator's direct whole-tens profile from claiming partitioning.
Canonical generation renders 56 images, writes six shards, and reuses 285. Sixteen new identities
replace twelve old ones; four additional images result from the corrected targets' validation
allocation. All 1,950 retained images, labels, seeds, attempts, replay receipts, and semantic plans
remain unchanged, including all six existing general subtraction-partitioning images. VQA makes
16 requests at concurrency four, all passing, and reuses 1,950 judgments. Only
`generation_plan.inputHash` changes on 40 retained cache records; the other 1,910 are byte-identical.
The old partitioning failure retires with its corrected target, reducing total failures from 28
to 27. No new rejection, API error, or rate-limit error occurs.

The [spatial-composition follow-up](spatial-composition.md) preserves selection/prediction with
`SpatialImagination`, adds a construction view with `SpatialGeneration`, and corrects 24 authored
K.G.B.6/1.G.A.2 variants, yielding 21 normalized target/route replacements. A generator extension
supplies explicit component geometry for single and multiple composition stages. The shared
type change triggers 1,966 renders, 224 written shards and 67 reused shards. Visual inspection
finds a hidden-edge projection defect, repaired before VQA with 42 further renders in one shard
and 290 reused shards. Forty-two new construction identities replace the 42 selection identities.
All 1,924 retained images, labels, seeds, attempts, replay receipts and semantic plans are unchanged.
VQA makes 42 requests at concurrency four, all passing, and reuses 1,924 judgments. Only
`generation_plan.inputHash` changes on 1,720 retained cache records; the other 204 are byte-identical.
The hexagon selection failure retires with its corrected task, reducing total failures from 27
to 26. No new rejection, API error, or rate-limit error occurs.

The [whole-share Ability follow-up](whole-share-ability.md) corrects the related review of
previously passing fraction exercises. `ConceptualThinking` replaces `ConceptComposition` in
the view and all four `1.G.A.3` target variants. Canonical generation renders eight replacements,
writes one shard and reuses 290. The eight replacement images are pixel-identical to their
former counterparts, with unchanged content/task fingerprints. VQA makes eight requests at
concurrency four, all passing, and reuses 1,958 byte-identical cache records. All 48 new label
checks are defendable. Active failures remain at 26; no previously failing identity is retired.
No new rejection, API error, or rate-limit error occurs.

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
of those starting-number standards. The separate count-out supply issue is corrected below.

### Successor principles and object-arrow evidence

**Resolved in `4b5cd9c`:** the retained `counting-inc-dec` tasks now show countable starting
objects, an explicit starting numeral, ordered Start/After or Before/Start positions, and a signed
directional step. Question Mode withholds the result; Solution Mode reveals it. This relates
successive numbers to the change in quantity and supplies the required `After`/`Before` evidence
without deleting the successor capability (`IMPL-V11`, `TSPEC-13`). The mathematical payload is
unchanged. K.CC.A.2 retains its valid explicit-sequence route as described above.

### Count-out supply versus numeric bounds

**Resolved on 2026-09-28** in implementation `cb6fab8`, with VQA results in `1ade36b`.
The earlier question
`K.CC.B.5-how-many~23fafedc#counting-basic#counting-objects-count-out#train#question#inst:0`
asks the learner to color 9 objects from a displayed pool of 14 diamonds while claiming
`NumbersSmaller10`. Exact replay confirms a requested count of 9; the view adds five spare
objects. This is an actual range conflict, not a counting error by the evaluator: the supplied
finite collection is part of the task's input.

Replay identified four such bound violations among twelve old samples, including three that VQA
had accepted. The user approved drawing the available count uniformly from the inclusive interval
`[max(requested count, lower bound), upper bound]`, allowing equality anywhere in the range.

The new `counting-selection` producer supplies both quantities; the existing view renders that
payload and its checklist accepts a sufficient collection (`IMPL-G7`, `IMPL-V8`, `IMPL-V11`,
`CHK-V6`). A dedicated object contract keeps the other counting consumers unchanged. Exactly three
K.CC.B.5 tuples change producer, preserving all target labels and competencies. The shared quantity
sampler retains the ordinary producer's payloads and PRNG continuation.

All ten replacement samples pass VQA, including solutions selecting all 17 of 17 and 19 of 19
objects under an upper bound of 20. The old failed identity is recorded as retired through producer
replacement, not as a passing revalidation. The [detailed report](count-out-supply.md) records
the bounds, matching, unchanged-image proof, and tests. No new major problem was found.

### Applying a property or conversion versus explaining a procedure

**Resolved on 2026-09-28:** implementation commit `d45c2bd` separates the requested learner
actions, with VQA evidence in `f8f6fc8`. The previous questions claimed `ProcedureUnderstanding`
while only requesting completion of a commutative equation or the number represented by hundreds.
The user approved preserving those useful tasks and adding distinct explanations (`SPEC-V5`, `TSPEC-13`).

| Task | Completion Ability | Separate explanation Ability |
| --- | --- | --- |
| Complete an equation using an arithmetic property | `ProcedureExecution` | `ProcedureUnderstanding` |
| Read the number represented by complete hundreds or ten tens | `DirectUnderstanding` | `ProcedureUnderstanding` |

The original five explanation target IDs and label sets remain; five completion variants are added.
`operations-properties-explanation` asks for transformation steps and why the result is preserved.
`place-value-hundreds-bundles-explanation` asks how grouping/counting works and why every unit is
preserved or counted once. Their solutions provide actual explanations, while Question Mode
withholds them. The ten-tens completion prompt now correctly asks for the represented number
of ones. The dedicated property views share a precise mathematical payload; existing box and
vertical completion routes retain their valid property support.

Both old failed identities retire, and their corresponding completion and explanation replacements
pass. Every new sample passes the relevant Ability and general visual/math checks. The two
initial distributive operand-count failures now pass after the clarification documented below.
The [detailed report](procedure-task-separation.md) records source, matching, tests, and cache evidence.

### Operand cardinality in nested distributive expressions

**Resolved on 2026-09-28:** the user clarified that every individual number in the expression is
an operand. Ontology `main` commit `a08f9a9` updates `OperandCardinality`, `TwoOperands`,
`ThreeOperands`, and `FourOperands`; dependency commit `969ccdc` adopts preview
`0.29.0-pre.4.a08f9a911317`. The concrete definition template is:

> A mathematical expression with exactly N explicit operand occurrences, counted across all nested operations.

Thus `8 × (2 + 10)` has three operand occurrences, while `(8 × 2) + (8 × 10)` has four;
the repeated 8 counts twice. The result in `8 × (2 + 10) = 96` is not an extra operand of the
left-hand expression, and its grouped subexpression is not counted again.

Both original distributive samples now pass. Their `ThreeOperands` declarations remain intact,
and all images and target labels are unchanged. The required refresh rechecks 732 affected
samples once at concurrency four, with no rejected operand label. Cache commit: `c645060`.
The [detailed report](operand-cardinality.md) records the single passing-but-uncertain pictorial
division verdict and all unrelated new findings. No prompt or checklist exemption was introduced.

### Single-place subtraction versus place-value partitioning

**Resolved on 2026-09-28:** the user approved retaining `SubtractionPlaceValuePartitioning`
where that strategy is identifiable and using `Subtraction` plus `PlaceValue` otherwise.
[1.NBT.C.6](https://www.thecorestandards.org/Math/Content/1/NBT/) requires whole-tens subtraction
and place-value or related strategies, but does not require decomposition and coordinated partial
differences. The former `90 − 60` written-method question correctly modeled nine tens minus six
tens; its target overclaimed a particular strategy (`TSPEC-6`, `TSPEC-13`).

Implementation commit `f5300a3` replaces the Area on all six target variants while retaining
models, `Formalization`, `TextualArticulation`, and both positive/zero-result variants. A generator
compatibility guard excludes `SubtractionPlaceValuePartitioning` with the direct whole-tens
profile (`SPEC-G3`). Existing general partitioning targets and all three consumer routes remain
supported. For example, the retained `259 − 236` explanation coordinates `9 − 6` and `250 − 230`
and combines their differences; its image and passing judgment are unchanged.

All 16 corrected samples pass, with all 180 label judgments defendable and all general checks
passing. The old failed identity retires, with its original verdict preserved in resolved history;
this is not recorded as a passing retry of the old task. Cache commit: `3ea12ff`.
The [detailed report](whole-tens-subtraction.md) records target/view coverage, visual inspection,
tests, unchanged retained samples, and split evidence.

### Spatial assembly versus concept composition

**Resolved on 2026-09-28:** the user approved preserving `ShapeSynthesis` and using the spatial
Ability actually elicited. `ConceptComposition` concerns combining related concepts into a more
complex concept. Selecting "Six triangles" to make a hexagon does not establish that performance,
nor does it fulfill the construction requested by K.G.B.6 and 1.G.A.2 (`SPEC-V5`, `TSPEC-13`).

Commit `5361115` retains `shape-compose-shapes` with `SpatialImagination` and adds
`shape-compose-shapes-construction` with `SpatialGeneration`. The new task asks learners to draw
an arrangement, showing how all pieces join; solutions render the generator's geometric witness.
Two-stage tasks require intermediate constructions before the final assembly. The corrected
CCSS targets retain their shapes, `ShapeSynthesis`, and composition levels. All 24 authored
variants normalize to 21 replaced targets/routes; the prediction capability remains available
without adding unsupported selection targets to construction standards.

All 42 construction images pass, with all 168 label checks defendable. Commit `48f0e96` repairs
hidden-face projection before validation; cache commit `6348f13` records the final judgments.
The old failed identity
`K.G.B.6-compose-shapes-other~4e78fdaa#shape-compose-shapes#shape-compose-shapes#train#question#inst:0`
retires with its target and remains in resolved history. Its replacement hexagon question and
solution pass. The [detailed report](spatial-composition.md) records the contract, consumer
adoption, geometry tests, visual inspection, and unchanged retained samples.

### Identifying a whole from equal shares versus concept composition

**Resolved on 2026-09-28** in `6f29fe9`, with VQA results in `227f7d4`. The task asks what the
shown halves or fourths make, with the answer "one whole." Its previous `ConceptComposition`
claim overstated recognizing that existing relationship. All eight images had passed VQA,
but the cached explanations conflated combining pieces with combining concepts.

The view and all four `1.G.A.3-compose-whole-from-shares` targets now use `ConceptualThinking`:
understanding and connecting concepts through their attributes, principles and relationships.
It is an eligible specialization family in the pinned ontology. None of its narrower concept
operations describes this task more accurately (`SPEC-2`, `SPEC-3`, `TSPEC-13`). The construction
Ability `SpatialGeneration` would change the intended fraction competency (`TSPEC-6`).

All four corrected targets retain their existing generator/view route and other labels. Their
eight replacement images are pixel-identical, and all pass VQA with 48 defendable label checks.
The other 1,958 images and cached judgments are unchanged. Since the former samples already
passed, that checkpoint's active failed count and resolved-failure history stayed at 26 and 49 respectively.
The [detailed report](whole-share-ability.md) records target identities, eligibility, tests,
retained artifacts, and the one changed validation allocation.

### Environmental illustrations versus physical manipulatives

**Resolved on 2026-09-28** in `f4a09e9`, with VQA results in `cdc345d`. The user approved
replacing the simplified room, pennant and flat honeycomb illustrations with realistic images
of the same physical objects. Five fixed PNG assets now depict a clock, window, wooden table,
fabric pennant and wax honeycomb. Prompts identify the clock face, window frame, tabletop,
pennant or cell opening. Both modes use the same image; only the solution choice is highlighted.

The earlier suggestion that environmental objects require a separate descriptor was too
restrictive. `PhysicalGeometry`'s examples do not limit it to specialized teaching manipulatives.
The repair improves evidence of physical materials, depth and shape while preserving all labels
and targets (`TSPEC-6`, `TSPEC-13`). No ontology change or checklist exception was made (`CHK-V6`).
The ten samples still cover seven targets through associations: five kindergarten environmental
variants and two `2.G.A.1-identify-supported-shapes` variants.

All ten updated images pass after one VQA run at concurrency four, resolving all six prior
failures. Of 40 label checks, 39 are defendable and one is uncertain: the window question's
`PhysicalGeometry` check notes that the frame is fixed rather than handheld. It passes under
the unchanged policy; this caveat is preserved without retrying the same evidence. No label is
rejected, and every general check passes. The other 1,956 images and cache records are unchanged.

The [detailed follow-up](environmental-object-images.md) records the generated assets,
[complete prompts](environmental-object-image-prompts.json), visual review, test-harness repair,
matching, retained artifacts and revalidation evidence.

### Clock minutes and five-scale graph quantities

**Resolved on 2026-09-28** in `ea3ac85`, with VQA results in `afbfd07`. Preview
`0.29.0-pre.5.a88ac7a500c5` introduces `MultiplesOf5`: integer values divisible by five
without a remainder. The clock generator and six `2.MD.C.7` targets now use it for the
minute component, without claiming a sequence. Sampling excludes ten-minute values and
uses 05, 15, 25, 35, 45 and 55 as requested. Multiples of ten remain valid members of the
ontology category; the exclusion is a sampling policy.

The statistical generator and five-scale picture-graph target likewise use `MultiplesOf5`.
Category totals and arithmetic inputs/results remain divisible by five, with no requirement
that category totals be consecutive. For example, the new picture-graph solution shows
40 books, 15 apples and 10 kites with a key of five items per symbol. Bar targets retain
`StepsOf5`, now owned by the views: their axes show 0, 5, 10, …, 40. Joint compatibility
binds that claim to the generator's five-scale quantities (`SPEC-G3`, `SPEC-8`, `SPEC-11`,
`TSPEC-13`, `IMPL-V11`). Genuine skip-counting targets are unchanged.

Canonical generation renders 112 images across the existing consumers. All 112 replay with
matching mathematical fingerprints and labels. The 22 replacement/new images and eight
retained bar images with updated labels receive 30 fresh passing judgments; all 218 label
checks are defendable, including 30 `MultiplesOf5` and eight `StepsOf5` checks. Every general
check passes. All 1,946 retained images preserve their bytes, seeds, attempts and mathematical
fingerprints; 1,938 judgments are reused. No VQA retry or checklist change was needed.

The [detailed migration record](multiples-of-five-migration.md) contains ownership decisions,
the complete consumer matrix, sample allocation changes and verification results. The
remaining unit-, two- and ten-scale picture-graph semantics were subsequently resolved below.

### Sequence steps versus scale and precision

**Resolved on 2026-09-28** in `a425a0d`, with VQA results in `b851404`. The original
`1.MD.C.4-find-total~358e3f7e` question and solution claimed `StepsOf1` because each symbol
represented one item. Neither displayed the consecutive-value evidence required by that label.
The user approved quantity constraints for scaled graphs and no multiples-of-one claim.

The generator now uses `EvenNumbers`, `MultiplesOf5` and `MultiplesOf10` for scales 2, 5 and 10.
An empty quantity-label selection explicitly resolves scale one. Grade 1/2 single-unit tasks remain; Grade 3
scaled-picture variants still use only 2, 5 and 10. Picture targets claim no `StepsOfX`. Bar views
own steps 1, 2, 5 and 10 because their numbered axes supply actual consecutive values; scaled
bar targets request both their quantity constraint and axis step. Joint compatibility keeps these
consistent (`SPEC-G3`, `SPEC-6`, `SPEC-8`, `SPEC-11`, `TSPEC-13`, `IMPL-V11`).

The two retired failures are replaced by passing `1.MD.C.4-find-total~73273aab` samples with the
same learner action: the question shows `4 + 5 + 6` with an empty answer, and the solution shows
`5 + 8 + 3 = 16`. Both use one item per symbol without a sequence claim. Scaled picture totals
need not be consecutive: one two-scale solution shows 8, 6 and 14, and one ten-scale solution
shows 60, 50 and 30. Their keys make the common scale visible.

All 74 graph samples replay exactly; 54 replacement/new identities receive fresh passing
judgments with 348 defendable labels and every general check passing. The other 1,916 judgments
are reused unchanged. Every retained image, numeric payload, label, seed and attempt is unchanged.
Both original rejected records remain in resolved history as retired targets, not passing retries.
No VQA retry, checklist change, rate-limit error or new major issue occurred. See the
[detailed migration record](picture-graph-scales.md) for consumer adoption and verification.

## Major findings requiring follow-up

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
  rectangular. Its `BoxArrangement` evaluation already recognizes the unit grid. The operand
  refresh repeats this objection on the solution's eight square cells in a two-by-four rectangle.
- A dollar currency task shows `75¢ + 50¢` using 25-cent coins. `Dollar` identifies the currency
  system, including its minor denomination; it does not require a dollar symbol, bill, or
  dollar-denominated value. The operand refresh introduces that unsupported requirement.
- Crossing an hour boundary does not inherently turn a single requested time addition or
  subtraction into multiple semantic operations. The rejected `SingleStep` questions require
  one result from supplied values; carrying/borrowing is part of executing that operation.
- A circular counting image was reported as 21 hearts. Replay of its recorded recipe confirms
  19 objects, consistent with the visible layout and the bound. This sample is already covered
  by revalidation of the repaired counting view.
- A line-plot solution was reported to plot `3¼` instead of a supplied `3¾`. The actual Pencil
  card reads `3¼`, and recorded-recipe replay produces 3.25; all six plotted measurements match.
- Two missing-operand equations, `433 - □ = 198` and `54 ÷ □ = 2`, were rejected for
  `Formalization` because no informal-to-formal translation is requested. The actual definition
  covers expressing information according to formal rules and conventions; it does not impose
  that additional translation requirement. Both pass the required operand refresh with unchanged images.
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
It also introduces new interpretations of unchanged tasks. The later operand refresh resolves
the two missing-operand formal-equation disagreements, restores the earlier equal-addends flag,
and adds the square-array solution and cents-denomination flags. The 17 current disagreements
comprise two fraction word-problem solutions, six shape-attribute comparisons, two square-cell
array images, three time-interval tasks, one representational zero-component judgment, one parity
question's decimal notation, one equal-addends question, and one currency-system judgment.
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

The numeric-range checkpoint confirmed **1,906 pass / 28 fail / zero uncached**. All 20 current offset
and successor images pass, as do the eight repaired word-problem images. One temporary HTTP 503
was recovered through cache-aware resumption; no API rate-limit errors were observed. Final VQA
cache commit for that checkpoint: `3e2920e`. The documentation check verifies local references and rule citations;
four existing external references cannot be fetched in the restricted network environment.

The count-out correction passes **3,277 tests across 537 files**, all generator coverage thresholds,
repository checks, and the build. Both counting producers have 100% statement and branch coverage.
Matching preserves all 683 targets, 212 compatible pairs, and 830 tuples; the strict label audit
remains at zero violations and 97 review items. All ten new judgments pass, with no rate-limit or
service error. That checkpoint is **1,905 pass / 27 fail / zero uncached**, in cache commit `1ade36b`.
All 1,922 retained evaluation results and timestamps are unchanged.

The completion/explanation split passes **3,434 tests across 543 files**, repository checks, the
build, and all generator coverage thresholds. The new property producer has 94.11% statement
and 95.23% branch coverage. All 1,536 captured legacy payloads and PRNG continuations are identical.
Matching now has 688 targets, 214 compatible pairs, and 841 tuples: five added completion targets,
16 added routes, and five removed routes, with no changed retained semantic plans. The strict
label audit remains at zero violations and 97 review items. That checkpoint is **1,935 pass / 27 fail /
zero uncached**, in cache commit `f8f6fc8`; all retained judgments and timestamps are unchanged.

The operand-cardinality preview passes the same **3,434 tests across 543 files**, all coverage
thresholds, repository checks, and the build. Ontology validation also passes its complete Docker
gate and hosted Linux/Windows checks. Matching remains at 688 targets, 214 compatible pairs,
and 841 tuples, with no changed retained semantic plans; the strict label audit remains at zero
violations and 97 review items. That checkpoint is **1,934 pass / 28 fail / zero uncached**, in cache
commit `c645060`. Exactly 732 judgments are refreshed and all 1,230 unaffected records are unchanged.

The whole-tens correction passes **3,443 tests across 543 files**, all coverage thresholds,
repository checks, and the build. One initial coverage run encountered an existing Windows
temporary-fixture cleanup `EPERM`; a single rerun passes without a source change. All 52 focused
generator/view tests pass. Matching remains at 688 targets, 214 compatible pairs, and 841 tuples:
six targets and their six routes are replaced, with no changed retained semantic plans. The strict
label audit remains at zero violations and 97 review items. That checkpoint is **1,939 pass / 27 fail /
zero uncached**, in cache commit `3ea12ff`. All 1,950 retained judgments and timestamps are unchanged.

The spatial-construction correction passes **3,491 tests across 546 files**, all coverage
thresholds, repository checks, and the build. All 94 focused tests pass. The new geometry helper
also has a dedicated coverage run: 97.33% statements, 94.59% branches, and 100% functions/lines.
Matching remains at 688 targets, 214 compatible pairs, and 841 tuples: 21 normalized targets
and their routes are replaced, with no changed retained semantic plans. The strict label audit
remains at zero violations and 97 review items. That checkpoint is **1,940 pass / 26 fail / zero
uncached**, in cache commit `6348f13`. All 1,924 retained judgments and timestamps are unchanged.

The whole-share Ability correction passes **3,491 tests across 546 files**, all coverage
thresholds and CCSS repository checks. Matching still has 688 targets, 214 compatible pairs,
and 841 tuples; only the four corrected targets and their routes change identity. The label
audit reports zero violations and 97 review items. That checkpoint's VQA is **1,940 pass / 26 fail / zero
uncached**, in cache commit `227f7d4`. All 1,958 retained cache records are byte-identical, and
the eight replacements preserve their former pixels and content/task fingerprints.

The environmental-image correction passes **3,498 tests across 547 files** and all coverage
thresholds, CCSS checks and production build. Matching and strict label-audit counts are unchanged.
The recurring Windows documentation-fixture cleanup error is repaired with bounded retries in
`e2fef77`; the final coverage gate passes when run independently. Ten images change with no
identity, label, mathematical fingerprint, plan, replay, seed or attempt changes. VQA reuses
1,956 byte-identical cache records and records ten passes in `cdc345d`: 39 defendable label
checks and the one window uncertainty described above. That checkpoint's VQA is **1,946 pass / 20 fail /
zero uncached**; the six resolved failures remain in history with their prior evidence.

The multiples-of-five migration passes **3,511 tests across 549 files**, all coverage thresholds,
CCSS repository checks and the production build. Generator coverage is 97.36% statements /
96.96% branches for `time` and 98.33% / 97.95% for `statistical-graphs`. Matching retains
688 targets, 214 compatible pairs and 841 tuples; seven target identities and eight routes
are replaced, and 30 retained plans change. The strict label audit remains at zero violations,
97 review items and zero signals. All 112 affected samples replay exactly. Cache `afbfd07`
contains **1,948 pass / 20 fail / zero uncached**. All 20 failure judgments are unchanged.

The picture-graph scale migration passes **3,539 tests across 549 files**, all coverage thresholds,
CCSS repository checks and the production build. Statistical-generator coverage is 98.36%
statements / 98.03% branches. Matching retains 688 targets, 214 compatible pairs and 841 tuples;
15 target identities and 21 routes are replaced, and seven retained plans change. The strict label
audit remains at zero violations, 97 review items and zero signals. All 74 graph samples replay
exactly. Cache `b851404` contains **1,952 pass / 18 fail / zero uncached**. The two retired scale
failures have passing replacements, and the other 18 verdicts are unchanged.

Current verification commands and outcomes (2026-09-28):

| Command | Outcome |
| --- | --- |
| `npm run generate:dataset -- --spec=ccss --affected --concurrency=4` | Graph-scale migration: 74 renders, 13 shards written, 278 reused; 54 added/52 removed identities, no retained-image changes |
| `npm run validate:dataset -- --spec=ccss --concurrency=4` | 54 live judgments, all passing with 348 defendable label checks; 1,916 reused; final 1,952 pass / 18 fail / zero uncached; exits 1 for the documented failures |
| `npm run audit:dataset -- --spec=ccss` | Exits 1 solely for those 18 failing cache records; all structural, freshness, and integrity checks clean |
| `npm run report:splits -- --spec=ccss` | No cross-split leakage or within-split task redundancy; every matched tuple has training evidence |
| `npm run report:churn -- --spec=ccss --ref=163fb9e` | Latest follow-up: 1,916 identical retained images, 54 added/52 removed identities, no retained seed/attempt changes |
| `npm run report:churn -- --spec=ccss --ref=644254d` | Entire maintenance run: 1,693 identical retained images, 53 intended changes, 224 added/190 removed identities; the same three explained successor retry changes |

The final split contains 1,654 training and 316 validation images. All 841 matched tuples have
training evidence. Of 213 tuples allocated to validation, 158 have validation evidence. The 55
remaining gaps include the ten-tens explanation route added earlier: its fixed mathematical
relation repeats the training payload. Generation records 50 duplicate attempts before linking
that request to the existing training sample. It is not counted as independent validation evidence.
The previous total of 56 gaps falls by one because the corrected whole-share target hashes no
longer allocate the rectangle/halves variant to validation; that earlier correction added no validation
evidence. Each subsequent graph-label migration adds one allocated and represented tuple overall,
producing two additional validation images per migration while leaving the number of gaps unchanged.
There is no cross-split leakage or within-split configured-task redundancy. Validation allocation policy is unchanged.

The `test` cache is byte-for-byte unchanged from baseline `644254d`. Its obsolete ontology context
is intentionally outside this CCSS-only task.
