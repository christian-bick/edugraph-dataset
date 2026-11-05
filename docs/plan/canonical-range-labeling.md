# Canonical range labels and reviewed target expansion

Started 2026-10-31 on `codex/label-dependency-audit`, from
`031fb4b3a76068ab4f3e7478d9c05497b7ffab80`, using stable ontology `0.33.0`.

Current direction, 2026-11-05: retain the pinned ontology's inclusive minimum/maximum definitions.
The proposed largest-magnitude reinterpretation was withdrawn. Separate syntax and calculation
contracts for Q1/Q2 are implemented; their [adoption matrix](#q1q2-syntax-and-calculation-contracts)
records the implementation and source verification scope. The approved Q6
[partition/sharing separation](#q6-unit-fraction-division-contracts) and Q7
[fraction-product separation](#q7-fraction-product-contracts) are also implemented. Q8 retains
the existing producer with [shared part-count ranges](#q8-fraction-equivalence-part-counts).
Q9 separates [fractional-scale relations and whole-number analogies](#q9-fractional-scale-relation-and-analogy-contracts).
Q10 separates [generic unit counts and scale-factor derivation](#q10-source-verification).
Q11 separates [single named-unit equivalences and five-row sequences](#q11-source-verification).
Q12 qualifies [currency amounts in their displayed monetary units](#q12-source-verification).
Q13 excludes [algebra tasks from numeric range annotations](#q13-source-verification).
Q15 separates [collection totals and enumeration](#q15-source-verification).
Q16 qualifies [the represented scalar for every writing notation](#q16-source-verification).
Q4 qualifies [representable standard multiplication while retaining unlabelled overflow](#q4-source-verification).

Status: the target-expansion helper, first eight-family adoption, R4/R5 and six implemented
[autonomous batches](canonical-range-autonomous-rollout.md) pass their repository and full-suite
checks. The Q1/Q2, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q13, Q15, Q16 and Q4 decision batches also pass their
focused and independent source checks.
These batches preserve
earlier competency/route lineages while adding reviewed source variants and applying the
authorized integer-domain and fixed-bound source corrections. The accepted Q4 source checkpoint covers
**1,547 normalized targets / 2,024 routes and 4,768 complete selections**, with **one intentionally
unlabelled multiplication-overflow selection**. The
[remaining-family review](canonical-range-remaining-families.md#sixth-batch-final-review-and-decision-boundaries)
records all contract/policy decisions as resolved. Overflow above the largest ontology upper
bound remains an approved range-presence exception. Ordinary profiles and the source-backed
local repairs are complete. The original inventory remains historical.
The protected pre-fix artifact baseline is
`ec7939fbc7e81ff14ce36337791517f9e28faed32aab3671fc9aa568faed7f9b`, with **4,870 rows**.
Its offline replay, annotation, split and both-operand checks pass. The historical range report
has a subsequently identified fraction-comparison part-count blindspot; it does not establish
that family's range correctness. Completed baseline VQA records **4,851 PASS /18 HIGH-confirmed
FAIL /one uncached request error**. Its exact cache is preserved as `840f8701`.
The [2026-11-05 checkpoint](#vqa-findings-and-source-checkpoint-2026-11-05) records the approved
fraction correction, layout repairs, exact estimation-cache proof and test repairs. Current source
coverage is **1,547 targets /2,017 routes /4,843 selections**; only seven fraction semantic plans
change from the preceding 4,837-selection checkpoint. Operational input hashes are separate.
All five reviewed leaf checklist corrections are applied as `43c13b2d`; central policy and
evaluator code remain unchanged. Three prior failed full collectors remain historical. The
complete **10,016-test /1,077-file coverage run at `d530904d` and original generator gate pass**.
The [affected publication checkpoint](#affected-canonical-acceptance-checkpoint-2026-11-05) now
records successful regeneration and passing offline replay/range/annotation/split checks.
The d724 churn has one separately accepted range-conditioned retry change. The subsequent
[multiplication-cache refresh](#multiplication-cache-and-canonical-refresh-2026-11-05) now passes
all-row offline checks, exact zero-row/pixel/key churn, all seven repository checks and full
coverage at `d530904d`. The approved 190-key live run completed with 188 passing keys and
two confirmed currency HIGH failures. The Question-only unit witness `25101e8c` now has
passing scoped checks and canonical publication `b55cd009…2ea1`; exact churn preserves every
stored row and changes only 21 Question PNGs and 42 currency keys. Current fresh VQA/strict-cache,
reviewed historical churn and local union checks now pass in the
[final checkpoint](#approved-live-vqa-and-union-checkpoint-2026-11-05). Acceptance covers the
sampled artifact and materialized union, retaining the allocation and overflow caveats below.
Missing-range findings remain report-only; the algebra exclusions are enforced. The earlier
Q4 and 4,825-selection image-label checkpoints remain historical.

This is a new initiative following the completed
[local dependency work](label-dependency-graph.md) and
[stable ontology adoption](../history/ontology-v032-adoption.md#stable-v0330-adoption-2026-10-30).
Earlier range exclusions describe that initiative's scope; they are not approval to silently
change the current validator. The existing Area allowlist, algebra sign/zero cutoff and
independent Question/Solution evaluation remain unchanged.

## Largest-magnitude clarification (2026-11-03)

The user withdrew the largest-magnitude interpretation recorded in documentation commit
`e9b4335a` after reviewing ontology `0.33.0`. Retain the existing inclusive bounds on every
relevant magnitude: the lower describes their minimum and the upper describes their maximum.
No ontology revision, shared range-policy migration or change to the previously approved
threshold-singleton exclusion is needed for Q1/Q2.

The observability clarification remains: include quantities observable in the problem or
solution and quantities required by a necessary solution step. A hidden required answer counts;
an unused evaluation stored in a payload does not. Thus writing `3^3` without evaluating uses
upper5, while evaluating it uses upper100; neither has a positive lower because 3 is an input.
For `90 - 80 = 10`, lower10/upper100 remains correct. The boundary example `10 + 10 = 20`
retains lower10/upper20 under the existing convention.

## Q1/Q2 syntax and calculation contracts

The user approved separate mathematical producers and payloads for syntax and calculation,
including schema, shared-type and consumer adoption, validation and a batch commit. Preserve
the existing learner tasks and source competencies. Mathematical helpers and renderers remain
shared where they need no task-specific evaluation. Apply IMPL-8 before parallel implementation.

| Production consumer | Target family | Payload and adoption | Verification |
| --- | --- | --- | --- |
| `operations-grouping-write` | `5.OA.A.1-use-grouping` | `NumericalExpressionStructureProblem`; format structure without evaluated operation/group values | Grouped Q/S rendering and structure validation |
| `operations-grouping-evaluate` | `5.OA.A.1-evaluate-grouped-expressions` | Retain `NumericalExpressionProblem` and exact steps; producer becomes `arithmetic-numerical-expression-calculations` | Exact steps, hidden Question answer, wrong-family rejection |
| `operations-numerical-expression-write` | `5.OA.A.2-write-numerical-expression` | Structural payload; retain prescribed prose and unevaluated expression solution | Both structure choices, Q/S rendering |
| `operations-numerical-expression-interpretation` | `5.OA.A.2-interpret-numerical-expression` | Structural payload retains the factor/reference relation | Grouped/ungrouped comparison evidence without evaluation |
| `numerical-power-expression-write` | `5.OA.A.2-write-numerical-expression`, `6.EE.A.1-write-power-expressions` | `NumericalPowerExpressionSyntaxProblem` from `numerical-power-expression-syntax`; literal base/exponent only; upper5 moves from view to producer | Exact notation, 0^0 rejection, both exponent domains, Q/S rendering |
| `numerical-power-expression-evaluate` | `6.EE.A.1-evaluate-power-expressions` | Retain `NumericalPowerExpressionProblem`, exact values, facts, reductions and precedence evidence | Single/mixed calculations, all six frames, exact intermediate ranges and Q/S rendering |

The existing `arithmetic-numerical-expressions` ID becomes the structural producer. Its exact
calculation sibling preserves the old mathematical domain. Power calculation helpers, formatters
and independent calculation fixtures retain their contracts; only the writing leaf narrows its
accepted family. Each leaf's nominal type boundary must reject the opposite mathematical family
in matching (SPEC-V6, IMPL-G6, IMPL-V8).

Baseline: eight distinct normalized target IDs, nine target/generator/view routes and 25 admitted
selections across Q1/Q2. Fourteen selections lack a range facet: six numerical-expression and
eight power-evaluation selections. Preserve every target/view lineage, recording generator-ID
migration explicitly. Profile sampling may change the mixture as already accepted; verify complete
source support and conditional weights rather than relying on random examples.

### Q1/Q2 source verification

All nine target/view lineages remain, with no target additions, removals or label edits. Four pairs
migrate to the appropriate new producer: grouped evaluation and the three power-writing routes.
The other five pairs retain their IDs and gain precise generation plans. Affected selections grow
25 to 68: 18 expression-syntax, seven expression-calculation, 11 power-syntax and 32 power-calculation.
Global source coverage remains 1,528 normalized targets and 2,000 routes, with 4,645 selections.

The source-only dependency audit uses an explicitly empty dataset snapshot. It closes all 14 Q1/Q2
range omissions, leaving 85 across nine other producers. It reports zero non-range omissions,
conflicts, contract errors, incomplete tuples, invalid contexts or pending/invalid inference.
All 119 existing inference selections still resolve exhaustively. The 34 already-labelled precision
routes remain separate from these omission counts.

Q1's independent finite proof preserves all 12,401 original calculation paths and the conditional
source weights. Syntax retains 12,399: only the all5 and all10 ungrouped literal triples retire under
the previously approved threshold-singleton exclusion. Seven syntax and 14 calculation profiles
partition their respective domains. Catalog declarations contain only these reviewed cells;
sampling domains build lazily, and an import guard prevents their construction during model loading.
Q2 retains all 468 original weighted single-power paths across the two exponent domains and all six
mixed calculation frames. Exact rational range checks include every required power intermediate,
never the numerator or denominator as a storage-based magnitude.

The independent full-catalog oracle checks all 68 selections with 24 seeds: 1,632 draws and 1,632
exact replays. Persistent integration tests independently check nominal family isolation, all nine
source lineages, range/sign/zero semantics and planned replay. The shared-type contract passed a
typecheck before generator/view work proceeded independently (IMPL-8).

Native browser verification renders 20 Question/Solution samples across all six views and nine
target/view lineages. All 40 repeated captures are byte-identical; representative screenshots are
visually inspected for task identity, answer withholding, complete calculation evidence and layout.
This is a native smoke check, not canonical dataset or VQA acceptance.

Repository check stages 1–5 pass: types, generator/view contracts, labels, documentation and source
standards. The local generated snapshot is older than the accepted source: it has 1,944 rows and
neither affected original producer, rather than the historical 2,918-image accepted snapshot.
Its split check fails for missing recorded generation plans/receipts; the strict stored-annotation
gate reports 4,006 failures. Those rows and validation implementations are unchanged by this batch.
The source-only audit above establishes source closure without hiding these artifact failures.
Focused coverage passes all 116 tests across 20 files. Each of the four affected generator bodies
has 100% statement and branch coverage and passes the repository's coverage thresholds.
The full `npm run test:coverage` attempt is blocked by two existing five-second timeouts in
`label-dependencies.test.ts` and the 30-second catalog setup timeout in `compatibility-rules.test.ts`.
An isolated coverage run against an untouched archive of pre-batch HEAD reproduces exactly those
failures: 181 tests pass, two time out and 60 are skipped after the setup timeout. No timeout,
test or threshold is relaxed; full-suite acceptance remains unresolved.

Evidence is under `temp/range-decisions/batch1/`: focused logs, `independent-oracle.json`,
`source-audit.json`, `check.log`, `scoped-coverage.log`, `coverage-gate.log`,
`baseline-timeouts.log` and `renders/manifest.json`. The matching report is under
`temp/spec-plans/ccss/range-decisions-2026-11-03/`. Canonical regeneration and independent
Question/Solution VQA remain a separate dataset acceptance stage; stored findings and cached
verdicts are not closed by this source batch.

## Q6 unit-fraction division contracts

Approved after Q1/Q2 on 2026-11-03, from `c65e754b`. Preserve sharing/inverse/story tasks
separately from construction and interpretation of a whole's fine-part model. The current
ontology and observability convention remain unchanged. A denominator in rational notation
is not an independently assessed integer count; an explicitly constructed whole-part count is.

The existing producer retains whole-by-whole and whole-by-unit-fraction mathematics. Two
unit-dividend producers separate a complete one-meter partition from a fractional amount
shared among recipients. Operands, quotient and inverse are canonical mathematics; optional
equation/multiplication witnesses and explicit partition counts are structured evidence;
material and measurement/recipient units are semantic context. No producer owns task wording,
an unknown placement or answer prose (SPEC-11, IMPL-G8).

| Production consumer | Existing source families | Mathematical contract and projection | Verification |
| --- | --- | --- | --- |
| `fractions-quotient-interpretation` | `5.NF.B.3-interpret-quotient` | Existing whole quotient; allow the fine-part family for valid future unit-dividend notation, where the denominator is explicitly interpreted as an integer divisor | Preserve notation controls; reject relation-only unit sharing |
| `fractions-division-interpretation` | `5.NF.B.7a`, `5.NF.B.7b`, `6.NS.A.1` | Whole quotient or `FractionUnitPartitionProblem`; retain the full one-meter refinement model and quotient interpretation | Both modes, whole-part counts and all three Grade 6 relation profiles |
| `fractions-division-execution` | `5.NF.B.7a`, `5.NF.B.7b`, `6.NS.A.1` | Whole quotient or `FractionUnitPartitionProblem`; retain model-based execution, BarModel and optional equation/inverse evidence | Withheld quotient/check unknowns in Questions; complete evidence in Solutions |
| `fractions-division-story-creation` | `5.NF.B.7a`, `5.NF.B.7b`, `6.NS.A.1` | Whole quotient or `FractionUnitSharingProblem`; show the given fractional amount shared among recipients without constructing a refined whole | Original quantities/story demand, optional witnesses and both modes |
| `fractions-division-inverse-explanation` | `5.NF.B.7a`, `5.NF.B.7b`, `6.NS.A.1` | Whole quotient or `FractionUnitSharingProblem`; preserve exact multiplication reconstruction and recipient shares | Question supplies quotient but withholds reconstruction/reason; exact Solution check |
| `fractions-division-word-problem` | `5.NF.B.3`, `5.NF.B.7c`, `6.NS.A.1` | Whole quotient or `FractionUnitSharingProblem`; retain the prose-first sharing problem and contextual equation | Standalone Question, units, quotient withholding and complete Solution |

The independent general-division producer and its six leaves, including
`fractions-division-model-construction`, are outside this migration and remain negative controls.
Each mathematical family must be accepted only by its legitimate consumer group; no range-driven
guard may remove a valid task (SPEC-V6, SPEC-V7, IMPL-G6, IMPL-V8, IMPL-V11).

Baseline: the old quotient producer has 22 routes and 104 admitted selections. Q6 accounts for
10 routes/16 selections; the other 12 routes/88 selections are preservation controls. Capture
matching, complete control configurations and seeded mathematics before edits. Establish the
shared types, `ViewTypeMap` and minimum adoption in one serial transition; require a passing
typecheck before independent role work (IMPL-8).

For each basic/inverse/equation profile, the original native domain is the 25 ordered pairs
`d,n ∈ {2,…,6}`, with each material equally likely. Preserve every pair and conditional weight.
Fine-part counts `d×n` partition into upper5/10/20/100 with 1/7/11/6 pairs. Recipient-only
sharing partitions into upper5/10 with 20/5 pairs. Required fractions below 1 prevent a positive
lower descriptor in both families. Resolve the band before generation, then sample pairs uniformly
inside that cell and choose the material with its original equal weight. Band selection changes
the overall unit-case mixture and seeded outcomes within the previously accepted profile-sampling
scope; the twelve non-unit routes retain their original generation behavior.
Explicit `UnitFractions` requests default to the basic relation unless multiplication/equation
is requested. Broader Grade 6 requests retain all three planned relation alternatives. Direct,
unqualified extraction uses the basic default; explicit relation requests retain all three native
profiles. These are module declarations; generic extraction and compatibility APIs are unchanged.
The existing broad fraction-notation target still uses its whole-number producer; qualified future
unit notation accepts the fine-part family only.

The sharing story's inverse profile supplies the equivalent multiplication relation without
adding a learner action. Its Question withholds the share; its Solution shows exact reconstruction.
A valid future inverse word-problem profile similarly withholds/completes its multiplication
check. Current word-problem source routes retain their contextual equation. None constructs a
whole with `d×n` fine parts or treats a written denominator as that integer quantity.

### Q6 source verification

All ten unit-dividend target/view lineages migrate to the appropriate new producer, with no
target additions, removals or claim edits. Their selections grow 16→48: 32 fine-part and 16
recipient-sharing. The twelve other quotient routes retain all 88 selections. Global coverage
remains 1,528 normalized targets /2,000 routes, with 4,677 complete selections.

The source-only dependency audit explicitly uses an empty dataset snapshot. It closes all 16
Q6 range omissions, leaving 69 across eight producers. Non-range omissions, conflicts, contract
errors, incomplete tuples, invalid contexts and pending/invalid inference remain zero; all 119
existing inference selections still resolve exhaustively. The 34 already-labelled precision
routes remain outside the omission count.

An independent baseline oracle checks every original control plan/configuration, resolved label
set, replay receipt and PRNG continuation over 704 draws. All 1,408 legacy Question/Solution
renderings remain byte-identical after the final renderer changes. It also checks 384 migrated
planned draws and all 300 native unit outcomes: 25 operand pairs, two materials, three relation
profiles and two mathematical families. These proofs preserve support and conditional weights;
they do not claim unchanged unit-case seed outputs or global mixture.

Persistent integration independently verifies the four-producer/twelve-view acceptance matrix,
all 22 quotient routes /136 selections, 1,088 planned draws and exact replays, rational/count
ranges, future notation compatibility, malformed payload rejection and inverse evidence. The
shared-type transition passed its typecheck before parallel implementation proceeded (IMPL-8).
The scoped generator/view implementation audit reports no findings.

Native browser smoke verification renders 56 Question/Solution images across all six views and
22 routes. All 112 repeated captures are byte-identical, with no browser errors or error cards.
Representative fine-part, sharing, story and word-problem images are visually inspected for
answer withholding, mathematical evidence and layout. This is source smoke verification;
canonical dataset regeneration and independent Question/Solution VQA remain separate acceptance.

Final TypeScript, generator/view contract, label, documentation and source standards checks pass.
The full repository command still fails against the unchanged 1,944-row local dataset: missing
recorded generation plans/receipts prevent split verification, and the stored-annotation gate
reports the same 4,006 failures as before Q6. Source closure above does not close these artifact
findings or the earlier full-suite timeouts recorded for Q1/Q2.

Coverage verification separates six unchanged general-division stress cases from the affected
checks. An untouched `c65e754b` archive reproduces the exhaustive leaf's 66.4-second runtime
against its 30-second limit, and all five additional integration rendering timeouts against their
original five-second limits. The final focused command excludes exactly these six cases; no test
skip marker, timeout or coverage threshold changes. Its initial broader attempt is retained too.
The affected quotient leaf checks now run separately for each profile with all original seeds,
views and modes. Migration tests retain every range/replay assertion while sharing one stateless
dependency evaluator per test instead of rebuilding its ontology indexes for each selection.

Final focused coverage passes all 116 selected tests across 17 files, with exactly the six
baseline stress cases excluded. The three generator bodies and shared mathematical helper reach
98.64% statement /98.7% branch coverage overall: the retained quotient body has 97.29% /97.5%,
and each new producer and the shared helper has 100% /100%. All three producers pass the
repository's unchanged 85% statement /60% branch thresholds. This is scoped coverage acceptance,
not a claim that the full test suite or stored dataset is accepted.
Evidence is under `temp/range-decisions/batch2-q6/`; matching snapshots and the exact ten-pair
migration report are under `temp/spec-plans/ccss/range-q6-2026-11-03/`. Stored rows and cached
VQA findings are unchanged.

## Q7 fraction-product contracts

Approved after Q6, from `40792489`. Keep the interpretation's complete derivation separate
from the existing story and word-problem method. Retain the current ontology and observability
convention. For `17/6 × 6`, interpretation explicitly requires the intermediate `17 × 6 = 102`
(upper120); story and word tasks use selected parts and the product 17 (upper20). A stored
numerator 102 in `102/6` alone is not an independently assessed integer quantity.

| Production consumer | Existing source family | Mathematical contract and adoption | Verification |
| --- | --- | --- | --- |
| `fractions-product-partition-interpretation` | `5.NF.B.4a-partition-product` | Retain `fraction-products` / `FractionProductProblem`, including `partition.scaledQuantity`; clarify that the Question requests both existing calculation orders | Both modes, exact `q/b` and `a×q` witnesses, necessary hidden intermediate |
| `fractions-product-story-creation` | `5.NF.B.4a-create-product-story` | Adopt `fraction-product-relations` / `FractionProductRelationProblem`, omitting the unused `scaledQuantity`; preserve the given equal-parts model and story request | Story/answer withholding, original quantities, exact unit-bearing Solution |
| `fractions-product-word-problem` | Both fraction and mixed-number `5.NF.B.6` targets | Adopt the same relation family, retaining the prose-first task, required partition method and contextual equation | Both original operand forms, blank Question equation/answer, exact Solution model |

Each family retains all five native mathematical profiles and legitimate future combinations,
not only the profiles selected by today's routes. No new view, target or range-driven rejection
is required (SPEC-V6, IMPL-G6, IMPL-V8). Shared mathematical helpers and the renderer may be
reused; establish types, `ViewTypeMap` and minimum adoption serially through a passing typecheck
before independent role work (IMPL-8).

For a valid future equation-profile story, supply its multiplication equality with the product
blank in Question mode; this preserves the equation claim without adding a learner action.
Today's story and interpretation routes use partition profiles without that witness, so their
equation display stays unchanged. Word Questions retain their prose-first equation/answer blank.

Operands, product and equal-part relations are canonical mathematics; `q/b`, model counts and
the interpretation's `a×q` are structured evidence; material and units are semantic context.
Neither producer stores a learner action or prose (SPEC-11, IMPL-G8). Relevant counts are
selected parts `a`, parts per copy `b` and copy count. The unused aggregate `availablePartCount`
does not become a required total merely because all cells are drawn: at `a=7,b=6`, the task
selects seven parts without asking for a count of all twelve available cells. Likewise, mixed
quantity numerators are rational storage unless actually used as integer quantities.

The native law has 6,150 weighted operand paths, collapsing to 5,670 distinct states, each
with two equally likely materials. Preserve denominator and conditional numerator probabilities,
the improper sampler's doubled weight at `2b+1`, the partition profiles' half-whole/half-fraction
quantity choice, and every original fraction/mixed notation. Range selection conditions that law
within a preselected canonical cell; the resulting global mixture and seeded outcomes may change
under the previously accepted range-profile sampling direction. All supported outcomes remain.

Independent finite-domain verification confirms 20 full-derivation and 13 relation cells across
the five profiles. Every case has `q/b < 5`, so no positive lower
descriptor applies. Keep the three views' existing zero-label ownership unchanged.

### Q7 source verification

All four target/view lineages remain, with no target additions, removals, claim edits or
disposition changes. Three routes migrate to the relation producer; the interpretation route
retains its ID and gains the precise range plan. Affected selections grow 7→22: nine
interpretation, five story, five fraction-word and three mixed-word. Global coverage remains
1,528 normalized targets /2,000 routes, with 4,692 complete selections.

The dependency audit uses an explicitly empty dataset snapshot. It closes all seven Q7 range
omissions, leaving 62 across seven producers. Non-range omissions, conflicts, contract errors,
incomplete tuples, invalid contexts and pending/invalid inference remain zero; all 119 existing
inference selections still resolve exhaustively. The 34 already-labelled precision routes are
separate from these omission counts.

An independent oracle reconstructs the original law without production range helpers. It checks
all 11,340 original material-inclusive outcome weights and all 22,680 family-specific payloads
and conditional weights across 33 cells. Every weighted selector midpoint is checked, as are
1,056 seeded native draws and their PRNG continuation. The full-catalog route proof covers all
22 selections with 176 planned draws, direct resolutions and exact receipt replays.

The protected pre-batch baseline contains four routes, seven selections, 56 draws and 112
Question/Solution renderings. All 96 controls remain byte-identical: every Solution plus all
story and word Questions. The 16 interpretation Questions differ only by the approved request
for both calculation orders. Forty-seven malformed, wrong-family and invalid-configuration
checks pass. Original operands, exact products, model geometry, units and materials are retained;
only the accepted range-conditioned mixture/seed changes and Question clarification apply.

Native browser verification covers every source selection: 44 Question/Solution images across
three views and four routes, with 88 byte-identical repeated captures and no browser errors or
error cards. Visual inspection includes the same `17/6 × 6` interpretation/story example and
mixed-number word Questions/Solutions, checking answer withholding, both derivations and layout.
This is native source smoke verification, not canonical dataset or VQA acceptance.

Schema checks cover both standalone range fallbacks and complete profile/range contexts.
Direct extraction conditions unspecified choices on a feasible pair; the same static cells
constrain planned generation. Native weighted pools construct lazily during generation, not
catalog loading. The scoped implementation audit of both generators and all three consumers
reports no findings.

Final types, generator/view contracts, labels, documentation and source standards checks pass.
The unchanged local 1,944-row dataset still fails split integrity for missing recorded replay
plans/receipts, and the stored-annotation gate retains its 4,006 failures. The earlier full-suite
timeout limitations remain recorded in the Q1/Q2 and Q6 checkpoints; this batch does not claim
their resolution or change timeouts, skip markers or coverage thresholds.

Focused coverage passes all 106 tests across 11 files, with none excluded. Both generator
bodies have 100% statement /100% branch coverage and pass the unchanged 85% /60% thresholds.
The shared mathematical helper reaches 97.89% /98.14%; overall affected-code coverage is
98.13% /98.27%. The 21 persistent integration tests include all five profiles on each valid
consumer, exact source replay, future equation-story evidence and counterexamples excluding
unused cell totals and stored numerators. Scoped coverage does not claim full-suite or dataset
acceptance.

Evidence is under
`temp/range-decisions/batch3-q7/` and `temp/spec-plans/ccss/range-q7-2026-11-03/`.
Canonical dataset regeneration and independent Question/Solution VQA remain separate acceptance.

## Q8 fraction-equivalence part counts

Approved after Q7, from `0ac3fcc7`, with the user's correction that `1/2 = 4/8`
explicitly represents four selected parts out of eight equal parts. Those counts matter
even in equality recognition: upper10 is required. The earlier proposed upper5 recognition
versus upper10 calculation distinction was incorrect for this family. Retain the existing
`fraction-equivalence` producer and `ProperFractionUnitScalingProblem` payload; no mathematical
producer or type split is needed.

| Production consumer | Contract and adoption | Preservation check |
| --- | --- | --- |
| `fractions-equivalence-model`, `numbers-fraction-line-classification` | Equality recognition with the explicit selected/total part counts; exclude selected multiplication/scaling claims because these tasks do not require that method | Both modes and both range cells; original classification content unchanged |
| `fractions-equivalence-completion-model`, `fractions-equivalence-explanation-model` | Retain the existing numerator/denominator multiplication scaffold | All four mathematical flag combinations; retain tenths/hundredths arms |
| `numbers-fraction-line-formalization`, `numbers-fraction-line-explanation` | Make the existing proper-fraction scaling method explicit with a matching part-count scaffold, keeping the missing numerator hidden in Questions | All four flag combinations; retain tenths/hundredths and whole-number arms unchanged |
| `fractions-equivalence-unit-scaling` | Retain the unit multiplier and existing proportional-scaling target requirement | Both range cells; exact numerator/denominator scaling and unit value one |

Preselect upper5/upper10 before generation. The eight native uniformly sampled pairs partition
into one upper5 pair (`1/2 = 2/4`) and seven upper10 pairs. Preserve all eight outcomes and the
one-draw uniform law within each selected cell, independently of the two existing mathematical
flags. The accepted profile-selection direction permits changes to the global mixture and seeded
outputs. No positive lower descriptor applies. Relevant quantities include the represented part
counts; this does not turn every fraction storage numerator into a separately assessed integer.

The classification compatibility boundary follows the selected shared labels and the actual
task demands, not a range difference or producer configuration field. It preserves both existing
classification source routes and all their mathematical outcomes. No target, ontology, generic
matching or other producer change is planned. Capture the clean baseline before source mutations,
then verify all seven current source routes, all seven legitimate consumers and their shared
payload arms.

### Q8 source verification

Completed 2026-11-04 from the protected `0ac3fcc7` baseline.

All seven current source target/view lineages remain. The matching comparison has no added or
removed targets, semantic pairs, label edits or disposition changes; only these seven plans change.
Proper-fraction selections grow 7→14, while the ten shared tenths/whole routes retain all 24
selections. Global coverage is 1,528 normalized targets /2,000 routes /4,699 complete selections.

The source dependency audit uses an empty dataset snapshot. It closes all seven Q8 omissions,
leaving 55 range facets across six producers. Non-range omissions, conflicts, contract errors,
incomplete tuples, invalid contexts and pending/invalid inference remain zero; all 119 existing
inference selections still resolve exhaustively. Eight decision topics remain, including the two
precision topics covering 34 already-labelled routes.

The independent oracle reconstructs all eight original pairs and four flag combinations without
the production domain table. It verifies exact conditional probabilities 1 and 1/7, 512 native
draws and their single-draw PRNG continuation. All 38 real selections have eight planned/direct
draws and exact receipt replays: 112 proper-fraction draws and 192 shared-control draws.
All 384 shared-control Question/Solution renderings remain byte-identical, together with their
configurations, labels, plans, payloads and receipts. Of the 112 protected proper renderings,
80 remain unchanged and 32 gain only the approved proper-line scaffold and prompt.

The seven-consumer native mathematical matrix contains 448 Question/Solution renderings:
320 unchanged and 128 proper-line clarifications. Both ranges are retained in every legitimate
context. All 56 future selected-claim cases resolve as intended: 40 admitted and 16 excluded by
the classification evidence boundary or the existing unit-scaling target requirement. No payload,
type, target or ontology migration is needed, and the scoped implementation audit has no findings.

Native browser verification covers all 17 real proper/shared routes and their 38 selections,
plus four selections on two future proper-fraction formalization routes. All 84 Question/Solution
images have byte-identical repeated captures (168 captures), with no browser errors or error
cards. Visual inspection covers the new proper-line Question/Solution scaffold, classification,
future formalization, unit scaling and unchanged whole-number controls. This is source smoke
verification, not canonical dataset or VQA acceptance.

Repository types, generator/view contracts, labels, documentation and source standards checks
pass. Full `npm run check` still fails on the unchanged local 1,944-row dataset: split integrity
has missing recorded generation plans/receipts, and strict stored annotations retain 4,006
failures. The earlier full-suite timeout limitations remain recorded in Q1/Q2 and Q6; no timeout,
skip marker or coverage threshold changes are made.

Focused coverage passes all 116 tests across 15 files, with none excluded. The generator,
new mathematical domain helper and shared bar renderer each have 100% statement /100% branch
coverage and pass the unchanged 85% /60% thresholds. Overall affected-code coverage is
95.7% statement /96.17% branch. Forty persistent integration tests cover all seven source
lineages, both range cells, every mathematical flag combination, future consumer applicability,
exact receipt replay and the shared payload arms. Twenty-two validation-contract tests reject
malformed part counts, incoherent scaling, wrong families and unsupported task modes with typed
errors. The existing 20-seed shared-family rendering checks retain every seed and assertion.
This focused acceptance does not claim full-suite or canonical dataset acceptance.

Evidence is under `temp/range-decisions/batch4-q8/` and
`temp/spec-plans/ccss/range-q8-2026-11-03/`. Canonical dataset regeneration and independent
Question/Solution VQA remain separate acceptance gates.

## Q9 fractional-scale relation and analogy contracts

Approved 2026-11-04 after Q8, from `aa32eb1f`. Keep the comparison's existing request to
compare without finding the exact product, and retain the explanation's given whole-number
analogy. For reference 5 and factor `3/2`, comparison uses upper5; explanation also gives
`5 × 2 = 10` and therefore uses upper10. Both contracts include the explicitly assessed
selected/reference part counts: factor `11/6` needs upper20 even when its rational product
is below ten.

| Production consumer | Existing source family | Mathematical contract and adoption | Verification |
| --- | --- | --- | --- |
| `fractions-scaling-comparison` | Three `5.NF.B.5a` greater/less/equal routes | Adopt `fraction-scale-relations` / `FractionScaleRelationProblem`, omitting only the unused analogy; preserve the current task, blank and equal-part reasoning | Both modes, all three profiles and seven canonical cells, unchanged rendering for identical mathematics |
| `fractions-scaling-explanation` | Two `5.NF.B.5b` greater/less routes | Retain `fraction-scaling` / `FractionScaleComparisonProblem`, including the exact `2q` analogy in both modes | Both modes and all seven cells, including the valid future equal profile |

Establish the nominal payload discriminants, `ViewTypeMap`, shared renderer/validation adoption
and minimum producer changes serially through a passing typecheck before parallel role work
(IMPL-8). The shared renderer accepts correlated task/data variants, and the analogy projection
requires its own complete mathematical family. Keep all current route/target claims and all
future native profiles. No range-driven consumer exclusion or new task is needed.

Reference `q`, fraction factor `a/b`, exact product and comparison relation are canonical
mathematics. `q/b` and signed `a-b` are structured mathematical witnesses; the `2q` enlargement
belongs only to the analogy-bearing family (SPEC-11, IMPL-G8). Relevant range quantities are
`q`, `a/b`, `q/b`, the integer part counts `a` and `b`, and unit one, plus two and `2q` for
the analogy family. The unused exact product, its unreduced storage numerator and signed
difference do not become required calculations or range/sign/zero quantities. Preserve existing
positive/nonzero ownership and do not add an exact-product calculation to either task.

The original law selects `q` uniformly from 2..5 and `b` uniformly from 2..6, then selects
`a` uniformly from 1..`b-1` or `b+1`..`2b-1`; equality fixes `a=b`. Each family retains
60 greater, 60 less and 20 equal states. Preserve the exact conditional weights within each
preselected range, including two native draws for equality and three otherwise, without
rejection. The accepted range-selection direction permits changes to the global mixture
and seeded output. Comparison has 16/40/4 greater states in upper5/10/20, 40/20 less and
16/4 equal states in upper5/10. Analogy has 4/52/4 greater, 10/50 less and 4/16 equal states.
Each family therefore has seven feasible profile/range cells and no positive lower descriptor.

Capture the protected baseline before mutations, then verify source lineages, conditional
weights, direct/planned generation, exact receipt replay, PRNG continuation and both native
render modes. Canonical dataset regeneration and independent VQA remain separate gates.

### Q9 source verification

The serial shared-type/consumer gate passes before independent test and verification work
(IMPL-8). All five source target/view lineages remain: three comparison routes migrate to
`fraction-scale-relations`, and two explanation routes retain `fraction-scaling`. Matching
records exactly these three producer substitutions, with no target additions/removals, claim
edits, disposition changes or unmatched targets. Current selections grow 5→12: seven comparison
and five explanation selections. Global source coverage is 1,528 normalized targets /2,000
routes /4,706 complete selections.

The source dependency audit uses an empty dataset snapshot. It closes all five Q9 range
omissions, leaving 50 across five producers. Non-range omissions, conflicts, contract errors,
incomplete tuples, invalid contexts and pending/invalid inference remain zero; all 119 existing
inference selections resolve exhaustively. Seven decision topics remain, including the same
two precision topics covering 34 already-labelled routes.

An independent oracle verifies all 280 family-specific payloads and exact native/conditional
weights across 14 cells. All states remain reachable across 1,349 seeded draws, with exact
two-draw equality and three-draw strict-profile PRNG continuation. All 12 current selections
pass 96 planned draws, direct resolution and exact receipt replay; all 14 future profile/range
admissions pass. The 520 unchanged native renderings and all 80 protected source renderings are
byte-identical. Only the 40 future equality-explanation Question/Solution renderings receive
the approved neutral header and three-way wording. No current strict task text changes.

Native browser verification covers all 12 current selections plus both future equality-analogy
cells: 28 Question/Solution images, each captured twice with identical bytes (56 captures),
without browser errors or error cards. Visual inspection includes the same `5 × 3/2` example
in comparison upper5 and explanation upper10, plus future equality Question/Solution modes.
The Question keeps its relation blank and states no equality verdict. This is source smoke
verification, separate from canonical dataset or VQA acceptance.

Final repository types, generator/view contracts, labels, documentation, source standards and
the scoped implementation audit pass. Full `npm run check` retains the same stale-artifact
failures in the unchanged local 1,944-row dataset: missing recorded generation plans/receipts
fail split integrity, and strict stored annotations retain 4,006 failures. The earlier full-suite
timeout limitations remain recorded in Q1/Q2 and Q6. No timeouts, skip markers or coverage
thresholds change, and canonical regeneration/VQA acceptance is not claimed.

Focused coverage passes all 90 tests across nine files, with none excluded. Both generators,
the shared renderer and its validation helper have 100% statement /100% branch coverage. The
weighted mathematical domain has 98.55% /98%; overall affected-code coverage is 99.23% /99.2%.
All pass the unchanged 85% statement /60% branch thresholds. The 36 persistent integration
tests include every native conditional-weight interval midpoint and both edges, all 14 future
cells, exact source replay, nominal/runtime boundaries and malformed mathematical witnesses.

Evidence is under `temp/range-decisions/batch5-q9/` and
`temp/spec-plans/ccss/range-q9-2026-11-04/`.

## Q10 generic unit-count and scale-factor contracts

Approved 2026-11-04 after Q9, from `ed4a821d`. Keep count comparison separate from
deriving the scale factor. For five large units and ten small units, comparison uses the
two counts and supports lower5/upper10; factor derivation also requires two and therefore
has no positive lower descriptor. Preserve every original count pair and both current
Grade 2 source routes.

| Production consumer | Mathematical contract and adoption | Preservation check |
| --- | --- | --- |
| `measure-unit-scale-relation` in `measure` | Adopt `measurement-unit-count-relations` / `GenericUnitCountRelationProblem`, with nominal kind and large/small counts only | Both modes and all four range cells; original comparison content unchanged |
| Generic arm of `measure-conversion-derivation` in `measurement` | Retain `measurement-unit-scale` / `GenericUnitScaleRelationProblem`, including the factor | Both cells; clarify only Question Mode with an explicit factor request and `large count × □ = small count`; retain the qualitative conclusion and unchanged Solution |
| Named-unit derivation, conversion-to-smaller and conversion-table arms; numeric bidirectional conversion | Preserve `UnitEquivalenceSequenceProblem`, `MeasurementConversionValuesProblem`, all existing producer/view pairs and the complete shared union | Every current route/configuration plus valid future unit pairs and mathematical arms; identical rendering for identical data |

Establish the new nominal type, comparison `ViewTypeMap` entry and minimum producing/consuming
adoption serially through a passing typecheck before independent role work (IMPL-8). Keep
`MeasurementConversionProblem = GenericUnitScaleRelationProblem | UnitEquivalenceSequenceProblem`
unchanged. The shared derivation must not reject a valid named-unit arm to simplify the generic
range contract (SPEC-G3, IMPL-G6, IMPL-V11). No target or ontology changes are needed.

Counts and their equal-length relation are canonical mathematics; the factor-bearing family
also supplies the exact integer count multiplier (SPEC-11, IMPL-G8). The comparison projection
does not recover or render that multiplier. The derivation Question currently asks only for the
qualitative comparison although its Solution includes the factor. Make that already-shown
factor a requested unknown without revealing it, adding no new mathematical quantity one.
The current generic derivation Solution and all named-unit projections stay unchanged.

The eight native frames select the large count uniformly from 3..6, then factor uniformly
from 2..3. Preserve two draws and the exact conditional law within each preselected cell;
in a cell containing large count five once and six twice, the first-draw masses are 1/3 and
2/3. The accepted range-selection direction permits changed global mixture and seeded outputs.
Comparison has three states in lower0/upper10, one in lower0/upper20, one in lower5/upper10
and three in lower5/upper20. Derivation has four upper10 and four upper20 states, all with
no positive lower. Zero here denotes an omitted positive lower descriptor, not a zero value.

Capture the clean baseline before source mutations, including every shared named-unit arm.
Then verify conditional support, direct/planned configurations, exact receipt replay, PRNG
continuation, native rendering and unchanged shared controls. Canonical dataset regeneration
and independent VQA remain separate acceptance gates.

### Q10 source verification

The serial shared-type/consumer gate passes before independent verification (IMPL-8).
Both source target/view lineages remain: comparison migrates to
`measurement-unit-count-relations`, while factor derivation retains `measurement-unit-scale`.
Matching records exactly one approved producer-pair substitution and one changed factor-generation
plan, with no target additions/removals, claim edits, disposition changes or unmatched targets.
Generic selections grow 2→6: four count-comparison cells and two factor-derivation cells.
Global source coverage remains 1,528 normalized targets / 2,000 routes, with 4,710 complete selections.

The source dependency audit uses an empty dataset snapshot. It closes both Q10 range omissions,
leaving 48 across four producers. Non-range omissions, conflicts, contract errors, incomplete
tuples, invalid contexts and pending/invalid inference remain zero; all 119 existing inference
selections resolve exhaustively. Six decision topics remain, including the same two precision
topics covering 34 already-labelled routes.

The independent finite oracle preserves all eight original count pairs in both families:
16 payload projections across six cells. Twenty-four exhaustive sampler-interval proofs establish
the exact uniform conditional probabilities. All states remain reachable in 39 seeded draws,
with exact two-draw PRNG continuation. All six generic selections pass 48 planned draws,
direct resolution and exact receipt replay. The complete shared-consumer union retains all
49 named-unit routes / 80 selections, with identical configurations, labels, semantic plans,
receipts, payloads and PRNG continuation across 640 protected draws. Operational matching input
hashes refresh with source provenance; the named-control semantic plan hashes remain unchanged.

All 1,280 protected named-unit source renderings and all 336 renderings of the 56 native
named equivalence sequences are byte-identical. For the eight generic native pairs, all
16 comparison renderings and eight factor-derivation Solutions remain byte-identical; only
the eight derivation Questions receive the approved factor request and `large count × □ = small count`
scaffold. The original generic source controls likewise retain 24 renderings and clarify only
their eight derivation Questions. No named-unit arm or comparison task changes.

Native browser verification covers all six generic selections plus five representative named-unit
control selections across all five leaves: 22 Question/Solution images, each captured twice
with identical bytes (44 captures), without browser errors or error cards. This is source smoke
verification, separate from canonical dataset regeneration or independent VQA acceptance.

Focused coverage passes all 111 tests across ten files. Both generators, the comparison leaf,
the shared conversion renderer and its validation helper have 100% statement / 100% branch
coverage. The mathematical domain has 97.14% / 96.77%; overall affected-code coverage is
99.37% / 99.4%, with 100% function coverage. The unchanged coverage gate passes all six
affected files, without exclusions, timeout changes or threshold changes. Final TypeScript
revalidation also passes after the native-entrypoint mount/reused-root test.

The first five source stages of full `npm run check` pass, including types, generator/view
contracts, labels, documentation and source standards. Only its two stored-artifact stages fail
on the unchanged local 1,944-row dataset: missing recorded generation plans/receipts fail split
integrity, and strict annotation validation retains 4,006 existing failures. That snapshot has
1,396 eligible rows and 2,324 missing annotation-facet assessments, with zero conflicts or
incomplete tuples. These are existing artifact limitations, not source failures; canonical
regeneration and independent VQA acceptance remain unclaimed.

Evidence is under `temp/range-decisions/batch6-q10/` (`baseline-summary.json`,
`verification-after.json`, `source-audit.json` and `renders/`) and
`temp/spec-plans/ccss/range-q10-2026-11-04/`.

## Q11 single-equivalence and five-row contracts

Approved 2026-11-04 after Q10, from `ebb35553`. Separate one named-unit equality from
five consecutive equalities, preserving every unit pair, original starting value and task.
A single conversion from seven kilometers reaches 7,000 meters, while the five-row sequence
starting there reaches 11,000 meters. The two single-equivalence consumers both involve the
one-unit relation: it is given in conversion and derived in the relation task. Their relevant
quantities are `1`, the unit factor, the larger-unit value and its equivalent smaller-unit value.
The table uses the factor and all five larger/smaller values. Its instruction to complete two
blank entries counts response positions rather than assessed measurement quantities; likewise,
the column count is layout metadata. Preserve those instructions without treating them as
measurement operands or results. This follows the existing incidental-layout exclusion, not
a new interpretation of range bounds.

| Production consumer | Mathematical contract and adoption | Preservation check |
| --- | --- | --- |
| Named arm of `measure-conversion-derivation` | Adopt `measurement-unit-equivalence` / `UnitEquivalenceProblem`, with nominal kind, named pair and one exact `equivalent` | Seven source routes; all seven unit pairs and eight starting values, both modes; same one-unit factor derivation |
| `measure-conversion-to-smaller` | Adopt the same single-equivalence family | Fourteen source routes; same given one-unit relation, larger-to-smaller calculation, unknown and solution |
| `measure-conversion-table` | Retain `measurement-unit-equivalences` / `UnitEquivalenceSequenceProblem`, with the complete five-row sequence | Seven source routes; all 56 original sequences, both withheld entries and both modes unchanged |
| Generic scale-factor and count-relation arms, numeric bidirectional conversions and conversion stories | Retain their precise current types and producers | All shared-union controls, including the Q10 families and integer/decimal and directional arms |

Define `UnitEquivalenceProblem = {kind: 'unit-equivalence', pair, equivalent}` with exact
positive integer equality, native larger value 2..9 and a supported named unit pair. Replace
only the named arm in `MeasurementConversionProblem` with that type, retaining its generic
scale-factor arm. The table sequence remains a separate type and producer. Establish types,
`ViewTypeMap` and minimum producer/consumer adoption through a passing serial typecheck before
independent role work (IMPL-8). All typed and runtime family boundaries must agree; do not
reject valid mathematical outcomes to simplify labeling (SPEC-G3, IMPL-G6, IMPL-V11).

The original generator uses one uniform draw for a starting larger-unit value in 2..9.
Each family retains that draw count and the exact conditional uniform distribution within
its selected range cell, without rejection sampling. Preserve all 56 native pair/start states
in each family. The accepted range-selection direction permits a changed global mixture and
seeded draw results. Unit choices and their existing Area/Scope bundles remain unchanged.

The finite quantity review predicts 11 single-equivalence unit-pair/range cells and 20 table
cells. Single equivalences have no positive lower because they involve one. Table starts 2..4
have no positive lower, while starts 5..9 support lower5. The upper witness uses the single
converted value or the last converted row, respectively, and includes the supplied factor.
All 28 named-unit routes should remain, growing from 28 to 53 complete selections. Expected
global selections are 4,735, with 20 remaining omissions across three producers and five decision
topics, including the same two already-labelled precision topics. Verify these predictions
against fresh matching and an empty-snapshot source audit; do not change targets or ontology.

Capture the protected clean baseline before source edits. Verify all native states, exact
conditional probabilities, direct/planned configuration, receipts/replay, one-draw continuation,
complete source lineages and identical rendering for identical mathematics. Canonical dataset
regeneration and independent VQA remain separate acceptance gates.

### Q11 source verification

The serial shared-type/consumer gate passes before independent verification (IMPL-8).
All 28 named-unit source target/view lineages remain: 21 single-consumer routes migrate to
`measurement-unit-equivalence`, and seven table routes retain `measurement-unit-equivalences`.
Matching records exactly 21 added/21 removed approved producer-pair substitutions and seven
retained-table generation-plan changes, with no target additions/removals, claim edits,
disposition changes or unmatched targets. Named selections grow 28→53; the complete shared
measurement union retains all 51 routes and grows 86→111 selections. Global source coverage
is 1,528 normalized targets / 2,000 routes / 4,735 complete selections.

The empty-snapshot source dependency audit closes all 28 Q11 range omissions, leaving 20
across three producers. Non-range omissions, conflicts, contract errors, incomplete tuples,
invalid contexts and pending/invalid inference remain zero; all 119 existing inference
selections resolve exhaustively. Five decision topics remain, including the same two precision
topics covering 34 already-labelled routes.

The independent finite oracle verifies all 112 family-specific payload projections and exact
conditional probabilities across 31 unit-pair/range cells: 11 single-equivalence and 20 table
cells. It checks 224 sampler intervals/left endpoints and reaches every state across 235 seeded
draws with exact one-draw PRNG continuation. All 53 named selections pass 424 planned draws,
direct resolution and exact replay of their current receipts, which include the new range
choices. The 23 shared control routes retain all 58 selections, with byte-identical baseline
receipts and semantic plans, configurations, labels, payloads and PRNG continuation across
464 draws. Operational input hashes refresh for source provenance without changing those
control semantic plans.

All 448 protected named source renderings and 928 control source renderings are byte-identical.
The 336 renderings of all 56 native named sequences remain identical through the single-row
projections and complete tables; all 32 native Q10 control renderings also remain unchanged.
The original full-sequence helper preserves all 56 seeded payloads and one-draw continuations.
The complete five-producer/five-view nominal admission matrix and all 50 runtime family/view/mode
checks pass. No task wording or pixels change for identical mathematics.

Native browser verification covers all 42 named unit-pair/range/consumer cells plus eight
control selections: six Q10 generic cells and both numeric bidirectional kinds. Across all
five leaves, 100 Question/Solution images each produce identical repeated captures (200
captures), without browser errors or error cards. Visual inspection confirms the single
7 km→7,000 m conversion/derivation against the table's 7..11 km sequence reaching 11,000 m, with
unchanged tasks and unknowns. This source smoke check is separate from canonical dataset
regeneration and independent VQA acceptance.

Focused coverage passes all 305 tests across 16 files in 16.44 seconds, including the unchanged
nine-file coverage gate. Both generators, the shared profile resolver factory, generator and
visual helpers, both renderers and the conversion validation helper have 100% statement /
100% branch coverage. The mathematical domain has 96.77% / 96.66%; overall affected-code
coverage is 99.61% / 99.59%, with 100% function coverage. No exclusions, timeout changes or
threshold changes are introduced.

The first five source stages of full `npm run check` pass, including types, generator/view
contracts, labels, documentation and source standards. Only the existing stored-artifact
stages fail on the unchanged local 1,944-row dataset: missing recorded generation plans/receipts
fail split integrity, and strict annotation validation reports 4,006 failures. The current
stored audit has 1,396 eligible rows and 2,296 missing annotation-facet assessments, with zero
conflicts or incomplete tuples. These artifact failures remain separate from source acceptance;
canonical regeneration and independent VQA acceptance are not claimed.

Evidence is under `temp/range-decisions/batch7-q11/` (`baseline-summary.json`,
`verification-after.json`, `source-audit.json` and `renders/`) and
`temp/spec-plans/ccss/range-q11-2026-11-04/`.

## Q12 currency amounts and monetary units

Approved 2026-11-04 after Q11, from `be96a334`. Count monetary amounts and denominations
in the units actually shown, including the required result. Include conversion quantities
only when shown or required by the task. Integer-cent storage does not itself establish a
range quantity or require an all-cents solution method. Preserve the existing cents/dollars
competency, every denomination and every supported mathematical outcome.

For `$1 - 75¢ = 25¢`, relevant monetary magnitudes include 1, 75, 25 and the 25-cent coin
face. The unshown storage value 100 is not a separate assessed amount. Likewise, a displayed
75-cent addition with a dollar-valued result does not automatically add an integer-cent
result to the quantity set. The current tasks neither request nor show a particular conversion
algorithm. Both possible strategies and the existing monetary-order definition of operand
digits remain available; do not change the accepted integer/digit declarations.

| Production consumer | Mathematical contract and adoption | Preservation check |
| --- | --- | --- |
| `currency-word-problem` | Retain `currency-arithmetic` / `CurrencyArithmeticProblem` and all existing fields; qualify the remaining coin-only and mixed-unit configurations before generation | All 18 Grade 2 routes, both operations, all denominations, both modes, original stories, unknowns, denomination faces and equation notation |
| Already adopted banknotes-only, penny-only, nickel-only and dime-subtraction configurations | Retain their current range cells, sampled rows and one-draw behavior | All seven configurations / 198 original ordered paths and exact direct/planned replay controls |
| Pending quarter-only, dime-addition and mixed bills/coins configurations | Add explicit canonical profiles using amounts in their shown units and coin/bill faces | All 11 configurations / 702 original ordered paths, preserving duplicate outcome weights and the original two/four-draw order |

Monetary items, totals, operation and result remain Ability-neutral mathematical data
(SPEC-11, IMPL-G8). Coin faces are cent-valued amounts; banknote faces are dollar-valued.
Operand and result units follow the existing local amount-card and global story/equation
rules. Unasked piece counts and `Amount 1` / `Amount 2` captions are not additional monetary
operands or results. No payload, view task, ontology or target changes are needed.

Condition the pending sampler's original count-prefix tree on the preselected range. Preserve
ordered raw paths and their multiplicities; do not deduplicate equal payloads or flatten the
prefix probabilities. Mixed paths draw notes/coins for the first amount, then notes/coins for
the second. Equal totals deterministically add one first item, which is a banknote for mixed
amounts and a coin for coin-only amounts; subtraction then swaps amounts when necessary.
That adjustment consumes no extra randomness. The accepted range-profile direction permits
the changed global mixture while retaining the exact within-cell law and draw count.

The independent quantity review predicts 16 cells for the 11 pending configurations.
Quarter addition has lower20/upper100 for 3 of 9 paths and no-positive-lower/upper100 for
6; subtraction has 8 and 1, respectively. Dime addition has lower10/upper100 for 30 of
36 paths and no-positive-lower/upper100 for 6. Mixed quarter and dime configurations
use upper100 and upper10 respectively. Mixed nickel/penny addition has upper5 for 51 of
81 paths and upper10 for 30; their subtraction uses upper5. All mixed configurations
have no positive lower because the shown banknote face is one dollar.

Expected currency selections grow 26→31 without changing any of the 18 routes; global
selections become 4,740. Closing all 11 Q12 omissions should leave nine across two producers
and four decision topics, including the same two already-labelled precision topics. Verify
these predictions with fresh matching and an empty-snapshot audit after the protected baseline.
Use independent integer-unit proofs, direct/planned replay, native rendering and focused
coverage. Canonical dataset regeneration and independent VQA remain separate acceptance gates.

### Q12 source verification

All 18 currency source routes remain, with no target additions/removals, claim edits,
producer/view pair changes, disposition changes or unmatched targets. Matching records exactly
11 changed generation plans for the newly qualified configurations. Currency selections grow
26→31: the 15 adopted selections remain, and the 11 pending selections become 16 canonical
cells. Global source coverage is 1,528 normalized targets / 2,000 routes / 4,740 complete selections.

The empty-snapshot source dependency audit closes all 11 Q12 range omissions, leaving nine
across two producers. Non-range omissions, conflicts, contract errors, incomplete tuples,
invalid contexts and pending/invalid inference remain zero; all 119 existing inference
selections resolve exhaustively. Four decision topics remain, including the same two precision
topics covering 34 already-labelled routes.

The independent integer-unit oracle preserves all 900 original ordered paths and 619 distinct
payloads with their exact multiplicities. All 702 newly qualified paths have exact rational
prefix-probability proofs and 1,404 interior sampler-interval checks. Across 3,776 seeded draws,
every pending path remains reachable with its original two/four-draw continuation and
deterministic equal-total correction. All 198 previously adopted raw paths retain their
one-draw law, and all 121 distinct control payloads retain their protected seeded continuations.
The quantity proof includes denomination faces, local cards, global story/equation amounts
and the required answer in their displayed units, without treating cent storage or unasked
piece counts as additional quantities.

All 31 selections pass 248 planned draws, direct resolution and exact current-receipt replay.
The 15 old selections preserve their selected labels, configurations, mathematical bindings,
payloads and PRNG continuation across 120 source draws. Their semantic generation plans and
receipts are also unchanged; only the 15 operational input hashes refresh source provenance.
All 1,238 native Question/Solution renderings and 416 protected source renderings are
byte-identical for the same mathematical payloads. No payload or learner-task changes are needed.

Native browser verification covers all 18 routes and 31 selections: 62 Question/Solution
images, each captured twice with identical bytes (124 captures), without browser errors or
error cards. The captured boundary cases preserve the existing cent/dollar formatting,
denomination faces and withheld answers. This source smoke check remains separate from
canonical dataset regeneration and independent VQA acceptance.

Focused coverage passes all 179 tests across nine files and the unchanged four-file coverage
gate. The generator has 100% statement / 100% branch coverage; the numeric domain has
99.18% / 98.73%, the range profile 100% / 94.44%, and the unchanged view helper 100% / 100%.
Overall affected-code coverage is 99.5% statements / 97.79% branches, with 100% function and
line coverage. The cent-only direct/planned proof shares one ontology evaluator across its
seven selections after the first run hit the existing five-second test limit; all assertions
and timeouts are retained, with no exclusions or threshold changes. This focused acceptance
does not replace the earlier full-suite timeout limitations recorded in
[Q1/Q2](#q1q2-source-verification) and [Q6](#q6-source-verification).

Source validation passes: full `npm run check` stages 2–5 pass generator/view contracts,
label usage, documentation and source standards, and final standalone TypeScript validation
passes after the test-fixture type correction. The stored-artifact stages retain the known
failures on the unchanged local 1,944-row dataset: missing recorded generation plans/receipts
fail split integrity, and strict annotation validation reports 4,006 failures. Its current
audit has 1,396 eligible rows and 2,285 missing annotation-facet assessments, with zero
conflicts or incomplete tuples. Canonical regeneration and independent VQA acceptance remain
separate from these source checks.

Evidence is under `temp/range-decisions/batch8-q12/` (`baseline-summary.json`,
`verification-after.json`, `source-audit.json` and `renders/`) and
`temp/spec-plans/ccss/range-q12-2026-11-04/`.
Acceptance logs are `scoped-coverage.log`, `scoped-coverage-first.log`, `coverage-gate.log`,
`types-final.log` and `check.log` in the Q12 evidence directory.

## Q13 algebra range exclusion

Approved 2026-11-04 after Q12, from `343eac6a`. The user first excluded unbound
structural tasks, then broadened the decision: do not use numeric range labels for algebra
tasks at all. This supersedes the proposed constants-only interpretation and includes bound
substitution, evaluation, modeling and equation solving.

Use the existing algebra sign/zero boundary: any resolved Area structurally within
`AlgebraicExpression`, or within `Algebra` after ignoring the `Arithmetic` branch per Area.
For range only, also include the `Variable` branch: the two current unknown/generalized
variable-role tasks otherwise lie outside that boundary. Statistical/random variables are
separate branches. Do not use algebraic representation as a task qualifier; arithmetic ratio
tables legitimately use it. An additional arithmetic Area cannot mask an algebraic task. Pure `ArithmeticExpression`
tasks and shared elementary arithmetic laws retain their numeric range classification.
The pinned ontology's inclusive bound meanings and the existing sign/zero cutoff stay intact.

Add a separate range exclusion to the annotation dependency policy. Qualifying algebra
contexts must neither require nor permit `NumericRange` annotations, including contexts
outside the completeness allowlist. The shared evaluator must enforce this from annotations;
do not classify payloads, inspect module IDs or filter labels after generation. No new
ontology descriptor or trigger grammar is needed for this broader decision.

Inventory and remove existing algebra range claims at their authored owners, including
explicit source requests, while preserving every task, supported mathematical outcome and
non-range claim. Retain mathematical generation constraints where they still control the
existing domain. Record any target-ID migration explicitly and verify exact route lineage,
configuration, seeded mathematics, replay and equal-payload rendering against the baseline.
The eight Q13 source omissions become inapplicable by policy; they are not eight newly
qualified numeric profiles. Canonical regeneration and independent VQA remain separate gates.

### Q13 source verification

The resolved Area inventory covers 39 algebra selections on 37 source routes, including both
variable-role tasks. None already supplies a numeric range annotation or an explicit target
range request, so no generator, view, target label, task or ID migration is needed. Ordinary
numeric `ArithmeticExpression` and elementary arithmetic-law contexts retain their range policy.

The empty-snapshot source audit compares every one of the 4,740 subjects with Q12. Exactly
eight missing range assessments retire under `LD-ALGEBRA-RANGE-01`; all other 4,732 evaluations
and the complete selection coverage remain identical. Source coverage remains 1,528 normalized
targets / 2,000 routes / 4,740 selections. One missing range facet remains, on
`standard-algorithm-multiplication` target
`5.NBT.B.5-multiplication-standard-algorithm~71786b7e`. Non-range omissions, conflicts,
contract errors, incomplete tuples, invalid contexts and pending/invalid inference remain zero;
all 119 existing inference selections resolve exhaustively. Three topics remain: multiplication
overflow and the two already-labelled precision reviews covering 34 routes.

The independent protected baseline and after comparison cover all six algebra producers and
18 views: 43 routes / 84 selections, comprising 39 algebra selections and 45 numeric structural
controls. All semantic plans, receipts, selected labels/configurations, 672 fixed-seed draws,
direct generation from resolved configurations, PRNG continuation and receipt replays remain
exact. All 1,344 Question/Solution SSR strings are byte-identical. Of 121 protected inputs,
120 production/reference inputs remain unchanged; the policy graph is the sole exception.
The evaluator engine and mathematical producer/view implementations remain unchanged.
One existing annotation re-resolution error for the normalization selection on
`6.EE.A.4-identify-equivalent-expressions~91b107b9` is recorded unchanged; its planned resolution,
mathematical generation, replay and rendering all succeed. This policy batch does not repair
that separate direct-resolver limitation.

Native browser verification covers all 18 views and 26 source selections, including all eight
retired-range lineages, both variable roles, bound algebra examples and numeric structural
controls. All 52 Question/Solution images have byte-identical repeated captures (104 captures),
with no browser errors or error cards. These checks use protected baseline payloads with current
views and write only ignored temporary evidence; stored dataset images and caches remain untouched.

Full-check source stages 1–5 pass, including TypeScript, specs, labels, documentation and
standards. Final TypeScript revalidation after the updated policy integration assertion also
passes. Existing artifact stages 6/7 still fail on the unchanged 1,944 stored rows without
generation plans/receipts and 4,006 strict findings: 1,396 eligible rows, 2,277 missing facets,
zero conflicts and zero incomplete tuples.

All 369 focused tests across 11 files pass. Scoped coverage is 98.94% statements, 97.72%
branches, 99.2% functions and 99.41% lines; the unchanged four-file coverage gate passes.
The shared gate and policy graph have 100% statement/branch coverage, the evaluator has
99.64% / 98.54%, and the audit has 96.87% / 90.47%. The first scoped run hit the existing
five-second limit in three compound identity tests. Independent comparisons are now separate
cases and reuse reference setup, retaining every assertion and the original timeouts and
thresholds, with no exclusions. Earlier full-suite timeout limitations remain as recorded above;
this scoped pass does not claim a new full-suite pass. Canonical dataset regeneration and
independent VQA remain separate acceptance gates.
Evidence is under `temp/range-decisions/batch9-q13/`, including `inventory-before.json`,
`baseline.json`, `preservation-after.json`, `source-audit.json`, `renders/manifest.json` and
`check.log`. Focused acceptance logs are `scoped-coverage-first.log`, `scoped-coverage.log`
and `coverage-gate.log`.

## Q15 collection totals and enumeration

Approved 2026-11-04 after Q13, from `f4c839f8`. Separate the cardinality of a collection
from the mathematical enumeration `1..N` used to count it. For six objects, conservation
compares the quantities 6 and 6; explaining or supplying the count uses 1 through 6.
The user also approved applying the existing threshold-singleton exclusion to conservation
totals 5, 10 and 20. Preserve every other supported total and all enumeration totals 1..20.

Keep `counting-basic` for enumeration and add `counting-total` for scalar cardinality.
Use distinct named, tagged mathematical payloads: `CountingEnumerationProblem` supplies
`countingNumbers` exactly `1..N`; `CountingTotalProblem` supplies the total. Both retain
`numObjects`, `simpleAnswer` and the optional parity constraint on the collection total.
The existing plain `CountingProblem` remains an internal scalar sampling shape, not a
shared accepted payload for the adopted views. Establish the shared types and `ViewTypeMap`
entries, then pass TypeScript before generator/view implementation proceeds independently
(IMPL-8). Neither payload contains a learner-action or display flag.

| Consumer | Mathematical producer / payload | Adoption and verification |
| --- | --- | --- |
| `counting-objects-simple` | `counting-basic` / `CountingEnumerationProblem` | Preserve its count explanation, all four arrangements and the current ten source routes; validate the necessary enumeration witness |
| `counting-objects-one-to-one` | `counting-basic` / `CountingEnumerationProblem` | Render supplied counting numbers on the existing numbered objects; preserve all eight source routes and all three arrangements |
| `counting-objects-cardinality` | `counting-basic` / `CountingEnumerationProblem` | Preserve the valid admitted consumer even without a current source route; render supplied counting numbers and the final total |
| `counting-conservation` | `counting-total` / `CountingTotalProblem` | Preserve the two equal collections, task, layout and capacity; migrate both existing routes and add the reviewed upper5 source variant |

Enumeration has no positive lower: upper5 covers totals 1..5, upper10 covers 6..10 and
upper20 covers 11..20. Total-only cardinality has no-lower/upper5 for 1..4,
lower5/upper10 for 6..9, and lower10/upper20 for 11..19. The excluded conservation
totals are exactly 5, 10 and 20; they remain supported in enumeration. Each cell retains
uniform one-draw sampling among its original parity-compatible totals. Changed profile
mixture is accepted; no retries, post-generation labels or unused quantity witnesses.

Add conservation's upper5 source variant so totals 1..4 remain covered after canonical
refinement. Preserve its existing upper10/upper20 target claims and IDs; the selected
mathematical profiles supply the stronger lower descriptors. Predicted coverage becomes
1,529 normalized targets / 2,001 routes / 4,741 selections. This precision review does
not close the separate multiplication-overflow omission.

Keep the shared `countingQuantitySchema`, labels and scalar sampling primitive unchanged.
Protect counting-selection and parity-grouping consumers, all current non-range claims,
fixed-seed mathematical controls, configuration/receipt replay and equal-mathematics rendering.
Validate nominal family isolation and complete native supports, including the future cardinality
consumer. Canonical dataset regeneration and independent VQA remain separate acceptance gates.

### Q15 source verification

The fresh matching comparison preserves all earlier targets, claims, dispositions and active
coverage. The two conservation pairs migrate to `counting-total`, while the new upper5 source
adds one target/pair: +1 target and +3 / -2 pairs overall. All 18 enumeration pairs retain
their IDs and receive changed canonical plans. Global coverage is 1,529 normalized targets /
2,001 routes / 4,741 complete selections. All 20 earlier Basic target/view lineages remain;
conservation now has three source bands and enumeration retains its 18 source routes.

The empty-snapshot source audit reports 4,276 eligible selections and 22,086 satisfied
assessments. All 4,720 unaffected selections remain semantically identical to Q13. The one
remaining range omission is still multiplication overflow; non-range omissions, conflicts,
contract errors, incomplete tuples, invalid contexts and pending/invalid inference remain
zero. All 119 existing inference selections resolve exhaustively. Q15 refines 20 already-labelled
routes rather than closing a missing facet. Two topics remain: multiplication overflow and
positive non-Name writing precision on 14 already-labelled routes.

The independent baseline protects 34 routes / 42 selections across the shared three-producer,
six-view counting union, with 336 seeded draws and 672 Question/Solution SSR records. Its finite
scalar oracle covers all totals 1..20 under any/even/odd constraints, including 27 bound/parity
profiles and 142 original profile paths. It also protects 880 native renderings through all
four legitimate Basic consumers and all 11 arrangement configurations, including cardinality
without a current source route.

The after proof covers 35 routes / 43 selections with 344 planned draws, direct mathematical
generation and exact receipt replay. Complete native support is 40 enumeration count/parity
payloads and 34 total-only payloads, with exact uniform conditional weights and one draw per
sample across 18 cells. Only conservation totals 5, 10 and 20 retire; every other total remains,
and enumeration retains all three endpoints with its supplied `1..N` witness. Builders explicitly
project scalar fields so richer inputs cannot override the family or leak foreign evidence.
All 868 retained native Question/Solution SSR strings are byte-identical; the 12 retired rows
are exactly the conservation singleton cases.

All 22 shared parity/selection controls preserve their selected labels/configurations, semantic
plans, receipts, seeded mathematics, PRNG continuation and replay: 176 draws and 352 unchanged
SSR strings. Actual operational input/plan/receipt identity changes are zero for these controls.
The shared schema, labels and scalar sampling primitive remain unchanged. Changed canonical
profile mixtures and affected receipts are accepted; this proof does not claim identical old
affected draws after conditioning on the new mathematical contracts.

Native browser verification covers all six views and 32 selections: all 21 affected source
lineages, two shared controls, three matched future-cardinality bands and six boundary cases.
All 64 Question/Solution images have byte-identical repeated captures (128 captures), with no
browser errors or error cards. The boundary cases retain enumeration totals 5, 6 and 20 and
show total-only cardinalities 4, 6 and 19. Visual inspection of five saved captures confirms
clear upper5 conservation in both modes, complete 1..20 numbering and total, a correct future
cardinality endpoint marker and the unchanged parity control, with no clipping or overlap.

Full-check source stages 1–5 pass, including TypeScript, specs, labels, documentation and
standards. Existing artifact stages 6/7 still fail on the unchanged stored snapshot without
recorded generation plans/receipts: 2,277 missing annotation facets, 4,006 strict findings,
1,396 eligible stored samples, zero conflicts and zero incomplete tuples.

The broad scoped run passes 314 tests across 19 files, including the complete catalog/source
checks and all 1,282 selection/grouping SSR control projections. A later 53-test run across
two view/integration files adds five cases beyond that run: 319 distinct current tests are
verified across the 19 files, rather than a single 319-test execution. The eight-file core
coverage gate passes separately: every reported file has 100% statement and branch coverage
except the unchanged selection generator's 83.33% branches, which passes its unchanged
threshold. The separate four-view gate passes with 100% statements in every affected view
body; branches are 100% for conservation/simple, 95.45% for cardinality and 95% for one-to-one.
The added view tests exercise browser entrypoint registration, mounting, reused roots and
existing validation branches.

Contract tests load their participating declarations; full-catalog regressions still load
the complete catalogs within their existing test budgets. Planned-draw tests distinguish raw
payloads from resolved annotations and cover every admitted parity alias alternative.
The selection/grouping render proof is partitioned by range/arrangement and
range/parity, retaining all 207 pairs, all 20 grouping counts, both modes, every assertion and
the exact 1,282 total. No timeouts or coverage thresholds change, and no cases are excluded.
Final TypeScript revalidation after these test changes passes. Earlier full-suite timeout
limitations remain as recorded above; these source/native proofs do not claim a new full-suite pass, canonical dataset regeneration
or independent VQA. Evidence is under
`temp/range-decisions/batch10-q15/`: `baseline.json`, `verification-after.json`,
`independent-math.ts`, `source-audit.json`, `renders/manifest.json` and `visual-review.json`.
The fresh matching comparison is under `temp/spec-plans/ccss/range-q15-2026-11-04/`.
Focused evidence is `scoped-coverage-first.log`, `scoped-coverage.log`,
`coverage-core-gate.log` / `core-summary.json`, and
`view-coverage.log` / `coverage-views-gate.log` / `views-summary.json`.

## Q16 scalar numeral ranges

Approved 2026-11-04 after Q15, from `463ab518`. The user clarified that individual digits
and place-value components represent the whole number for numeric-range labeling. Thus
321, including a representation as three hundreds, two tens and one unit, uses scalar
321 and lower120/upper1000. A zero digit in 310 does not establish scalar zero. Other
independently assessed quantities retain the existing inclusive minimum/maximum convention.
This quantity interpretation is recorded under SPEC-G2.

Retain the existing `WritingProblem`, producer id and five consumers. No payload, type or
renderer migration is required (IMPL-G6, IMPL-8). Refine positive non-Name configurations
using the nine existing scalar Name profiles. Keep the nine Name source bindings and three
fixed-zero bindings exact, including resolved configs, mathematics and PRNG continuation.
Preserve the existing explicit non-Name zero path and its legacy range binding. Positive
zero absence becomes a matching-capable choice before generation; digits do not drive it.

| Consumer | Baseline source routes | Adoption | Verification |
| --- | --- | --- | --- |
| `numbers-read-standard` | 3 positive | Shared scalar range, unchanged numeral/name task and place-value payload | Retained scalar intervals, source successors, legacy/multidigit Q/S and replay |
| `numbers-write-standard` | 5 positive + 1 zero | Shared scalar range, unchanged frames/block sketch/place chart | All source bands, zero-digit examples, Q/S and replay |
| `numbers-write-stroke` | 3 positive + 1 zero | Same shared payload; selected positive profiles honor the renderer's 1000 capacity, retaining its original target policy | Every valid band and glyph branch, including 321 under an unqualified request's upper1000 completion; zero and missing-bound capacity cases |
| `numbers-write-count` | 3 positive + 1 zero | Same whole-number response; selected positive profiles honor the 1000 renderer capacity | Ten-frame/block modes, decomposition and zero-digit cases; zero/capacity isolation |
| `numbers-write-name` | 9 Name | Unchanged scalar Name contract and source | Exact config, labels, payload, RNG, replay and Q/S controls |

The two selected-profile capacity rules query generator-owned semantic labels. An explicit
generator scalar-zero choice bypasses this positive-profile check, preserving its actual zero
domain even when the legacy configured range is broad. Stroke retains its original target
participation boundary without applying that boundary to unrequested selected descriptors. Both
stroke and count support scalar values through 1000; read/standard/name retain their complete
valid range through one million.

Reviewed source expansion preserves the represented-number union for each competency, apart
from the already-approved threshold singletons (TSPEC-4). Kindergarten numeral-writing and
count-writing gain a positive upper5 variant. The three Grade 1 reading/writing/count-writing
competencies expand their upper120 ceiling into upper5/10/20/100/120. The two Grade 4
digit-reading/writing lineages with lower1000/upper1m receive three explicit adjacent-band
successors, matching the established Name source refinement. All other source ids remain.
Expected delta: +18 normalized targets and +23 routes/selections; writing grows 26 to 49
routes (14 positive non-Name to 37, with the 12 controls retained). Expected global coverage
is 1,547 normalized targets / 2,024 routes / 4,764 selections; verify these rather than treating
the expectation as acceptance.

Each positive notation family retains all 999,991 nonthreshold integers through one million.
The only excluded values are 5, 10, 20, 100, 120, 1000, 10000, 100000 and 1000000 under the
existing threshold-singleton policy. Each band conditions the original uniform scalar law
and consumes one draw; explicit zero consumes none. Profile mixtures may change as already
accepted. The shared positive-number primitive remains unchanged.

The protected baseline has 26 selections, 208 seeded draws, 416 source Q/S SSR strings,
234 independent boundary SSR projections and 53 saved source inputs. Keep raw schema labels,
complete inferred annotations and operational source identities distinct when comparing.
Independent scalar support/weight proofs, matching/source audit, persistent integration,
native browser checks, TypeScript and scoped coverage establish source acceptance. Stored
dataset regeneration and independent VQA remain separate gates. Evidence belongs under
`temp/range-decisions/batch11-q16/`; the matching plan is `range-q16-2026-11-04`.

### Q16 source verification

The accepted source has **1,547 normalized targets / 2,024 routes / 4,764 complete selections**.
Writing grows from 26 to 49 routes/selections: 37 positive non-Name selections, nine Name
controls and three fixed-zero controls. All 24 retained target/view lineages keep their labels;
the two former Grade 4 broad digit-reading/writing lineages have six explicit adjacent-band
successors. The matching comparison records 20 added and two removed targets, 25 added and
two removed pairs, and 12 changed generation plans. No dispositions or competency associations
are lost, and no stable target ID changes its labels.

The source audit retains all 4,715 non-writing selections semantically unchanged. It reports
4,299 eligible selections and 22,178 satisfied assessments, with zero conflicts, contract errors,
incomplete tuples, invalid contexts or pending/invalid inference. The sole missing range facet
remains `5.NBT.B.5-multiplication-standard-algorithm~71786b7e`, whose supported overflow exceeds
upper1m. The writing inference callback is retired because positive zero absence is selected
before generation; the remaining 93 non-writing inference selections resolve exhaustively.
The 12 Name/zero controls retain their emitted annotations and evaluations while their
annotation-resolution bookkeeping changes from `exhaustive` to `not_required`.

The independent scalar proof exhaustively partitions all 999,991 retained positive integers
for each of the three notation families across nine cells. Only the nine catalog threshold
singletons retire from the former non-Name domain. Every cell conditions the original uniform
scalar law, with one positive-sample draw and no zero-sample draw; 240 native seeded checks
independently reconstruct the payload and PRNG continuation. All 49 source selections pass
eight seeds: 392 planned draws, exact replays and direct-generation comparisons. The nine
Name and three fixed-zero controls preserve configurations, mathematical payloads, emitted
labels, semantic plans, receipts and all 96 seeded PRNG continuations. Their 12 operational
input hashes refresh with the source closure; this is recorded separately from semantic identity.

All 192 protected control SSR strings and 176 retained native boundary SSR projections remain
byte-identical. The other 58 non-Name boundary projections represent the deliberately retired
threshold values. Of 53 protected production/reference inputs, eight have the approved source,
schema, sampler or capacity changes; all five renderer implementations remain unchanged.
The independent source-lineage proof preserves every competency's represented-number union
apart from those approved endpoints.

Native browser verification covers all 49 source selections and the five consumers, plus
Count321, Read1005 and Stroke321: **104 Question/Solution images / 208 byte-identical repeated
captures**, with no browser errors or error cards. Stroke321 uses an unqualified positive
target's upper1000 completion; explicit upper1000 targets remain rejected by the original
participation rule. Ten representative captures are visually inspected: place-value parts
still ask for the whole 321, zero digits in 1005 do not imply scalar zero, tracing keeps its
unknown writing boxes, and Name/fixed-zero controls retain their tasks and complete layouts.

Repository check stages 1–5 pass, including TypeScript, contracts, labels, documentation and
source standards. The unchanged local artifact stages still fail on 1,944 stored rows missing
recorded generation plans/receipts, 2,277 missing annotation facets and 4,006 strict failures
among 1,396 eligible stored samples, with zero conflicts or incomplete tuples.

All **129 focused tests across 11 files pass** on the first coordinated coverage run.
Overall measured coverage is **100% statements / 97.59% branches**. The writing generator,
unchanged zero-profile resolver and new capacity helper have 100% statement/branch coverage;
the shared range-profile module has 100% statements / 95.23% branches. The unchanged four-file
85% statement / 60% branch gate passes. These focused source/native results do not claim
a new full-suite pass, dataset regeneration or independent VQA. Evidence is under
`temp/range-decisions/batch11-q16/`: `baseline.json`, `independent-math.ts`,
`verification-after.json`, `source-audit.json`, `renders/manifest.json`, `visual-review.json`
and `check.log`; focused results are in `scoped-coverage.log`, `coverage-summary.json` and
`coverage-gate.log`. Fresh matching is under `temp/spec-plans/ccss/range-q16-2026-11-04/`.

## Q4 multiplication overflow

Approved 2026-11-04 after Q16, from `a34caa50`: keep products above the pinned
ontology's largest upper bound unlabelled for now. Adopt canonical ranges for representable
standard multiplication without truncating the existing factors, products or algorithm work.
This resolves the last policy question; it does not authorize an upstream ontology change
or claim that the intentionally unlabelled overflow satisfies range completeness.

| Consumer / source | Mathematical contract and adoption | Verification |
| --- | --- | --- |
| `operations-multiplication-standard-algorithm`, `5.NBT.B.5-multiplication-standard-algorithm` | Retain `standard-algorithm-multiplication` / `StandardMultiplicationProblem`, both factor domains, shifted partial products, carry chains and final sum; select a representable range or unlabelled overflow before sampling | Original conditional sampling weights, complete support partition, direct/planned replay, both native modes and unchanged rendering for equal mathematics |
| Decimal multiplication and shared column-calculation renderer | Separate decimal payload and producer remain controls; shared row/sum structures and renderer require no migration | Shared renderer and decimal consumer regression tests |

Relevant quantities include the factors, final product, partial products and the explicitly
assessed digit multiplication and column addition arithmetic. Passive numeral digits and
place indexes are not additional quantities. Every aligned-row sum contains an actual zero
addend from a shifted row, so no positive lower descriptor is justified. The product dominates
the maximum; the existing requirement for both multiplication and addition carries places
all admitted products above 120. The feasible upper bands are 1000,10000,100000 and1m; overflow
above1m retains an explicit no-range configuration. The payload and learner task stay the same
(SPEC-6, IMPL-G4, IMPL-G6, IMPL-G7).

The four range alternatives and explicit empty overflow alternative refine the existing
Grade 5 target's generation plan. No target, payload type, view or shared matching rule needs
to change. Exact upper endpoints remain supported because these tasks also contain zero;
they are not threshold singletons. For example, `4000 × 250 = 1,000,000` is labelled upper1m,
while `4001 × 250 = 1,000,250` is unlabelled.

The original proposal law assigns multiplicand-width weights 100/10/1 and multiplier
weights 90 for two digits, 9 for ordinary three digits and 109 for the overlapping `a0b`/`ab0`
scenarios. Pair weights have common denominator 874,800,000 before the two carry requirements
are applied. The implementation conditions that law on the selected cell. Lazy per-cell
row masses and two inverse draws preserve every admitted pair and its conditional weight
without constructing millions of payloads at catalog import. The original retry sampler's
seeded payloads and draw counts intentionally change; equal mathematical payloads retain
their rendering.

### Q4 source verification

An independent scan of all 9,890,100 native factor pairs finds 8,975,330 pairs satisfying both
original carry requirements, with total integer weight 582,992,000. The production domains
agree on every admitted pair, every row mass and all five cell hashes:

| Selected upper | Admitted pairs | Original integer weight |
| --- | ---: | ---: |
| 1000 | 369 | 3,321,000 |
| 10000 | 17,560 | 50,384,000 |
| 100000 | 293,772 | 166,527,770 |
| 1m | 2,348,923 | 210,830,376 |
| Unlabelled overflow | 6,314,706 | 151,928,854 |

The independent proof checks 160 native draws and 160 planned draws/replays against the
conditional inverse sampler and exact two-draw continuation. All 64 protected source/native
Question/Solution SSR strings remain byte-identical, including maximum overflow. Of 22
protected inputs, only the producer implementation and schema change; the new local domain
helper enters the source closure. The original 512 seeded payloads remain valid supported
mathematics, while the new seed schedule intentionally selects different pairs.

The accepted source has **1,547 normalized targets / 2,024 routes / 4,768 complete selections**.
All 4,763 other selections are semantically unchanged. Q4 refines its sole existing route from
one to five selections, with no changes to target IDs/labels, matched pairs or dispositions. Only its generation
plan changes; the other 2,023 plans remain exact. Source inspection finds 4,303 eligible selections
and 22,202 satisfied assessments, with 93 exhaustive inference selections and zero conflicts,
contract errors, incomplete tuples, invalid contexts or pending/invalid inference. The single
missing range assessment now belongs exclusively to the approved overflow selection; it remains
visible in the report rather than being suppressed by a validator exception.

Native browser verification covers all five planned cells, four exact upper endpoints,
maximum overflow and a zero-multiplier pass: **22 Question/Solution images / 44 byte-identical
repeated captures**, with no browser errors or error cards. Six representative captures are
visually inspected. Unknowns remain withheld in Questions; Solutions preserve every aligned
row, carry and column equation, including the complete seven-digit maximum result.

Final standalone TypeScript and full-check stages 2–5 pass: generator/view contracts, labels,
documentation and source standards. The initial check found a readonly-array mismatch in a
new test call; passing a mutable copy resolves it, and the final TypeScript run exits 0.
The unchanged local artifact gates still fail on 1,944 stored rows without recorded generation
plans/receipts, 2,277 missing annotation facets and 4,006 strict failures among 1,396 eligible
stored samples, with zero conflicts or incomplete tuples.

All **140 focused tests across 13 files pass**. Measured coverage is **100% statements /
98.75% branches**, with the unchanged two-file coverage gate passing: generator100%/100%,
domain100%/98.61%. The first focused run passed the other 118 tests but exceeded the default
setup timeout for the 22-case integration suite. Splitting independent catalog, renderer,
source and domain fixtures into separate ordinary hooks resolves the timeout; all 22 cases,
default timeouts and assertions remain intact. The final run includes every focused case.
These checks do not claim a new full-suite pass, canonical regeneration or independent VQA.
Stored dataset regeneration and independent VQA remain separate gates. Evidence belongs under
`temp/range-decisions/batch12-q4/`: `verification-after.json`, `independent-math.ts`,
`source-matching-after.json`, `renders/manifest.json`, `visual-review.json`, `types-final.log`,
`check.log`, `scoped-coverage.log`, `coverage-summary.json` and `coverage-gate.log`.
Matching snapshots remain beside the source proof as `matching-before.json` and `matching-after.json`.

## Artifact acceptance (2026-11-04)

The user authorized canonical regeneration, live VQA and resolution of the failing artifact
gates after source commit `446d433f`. This stage does not publish a release or change the
approved range policies, including algebra exclusion and unlabelled multiplication overflow.

The local baseline contains 1,944 images in an immutable-store snapshot, but its build graph
uses older schema/epoch identities and its rows lack current generation plans and replay
receipts. Its renderer also predates the current fit-view capture policy. A complete canonical
regeneration of both splits is required before incremental regeneration or VQA is trustworthy.
The current 2,024 routes allocate at most 4,048 train and 1,032 validation images before
deduplication and finite-domain exhaustion; the 4,768 schema selections do not multiply that
allocation.

The acceptance sequence is full canonical regeneration with `--reset-graph`, complete
replay/range and annotation checks, split/image integrity, cached live VQA with the existing
LOW/HIGH workflow, strict offline cache audit, churn review and union rebuild. Failures are
assigned to their mathematical or visual owners through the fix-spec workflow. Declarations
and evaluator policy are not weakened to hide failures.

Baseline and run evidence belongs under `temp/range-artifact-acceptance-2026-11-04/`.
Acceptance remains in progress until the resulting artifact and cache pass these gates.

### Representation follow-ups found during artifact review

The replay-audit preparation found earlier producers whose bounds still include passive
digit-strip coefficients, contrary to the approved Q16 interpretation (SPEC-G2). These are
implementation corrections under the existing policy, not new ontology decisions:

| Producer / unchanged consumer | Assessed range quantities | Concrete correction |
| --- | --- | --- |
| `place-value-expanded` / `place-value-expanded-form` | The represented numeral and actual nonzero operands in the requested sum | `3100 = 3000 + 100` needs lower100/upper10000; the passive digits `3,1,0,0` cannot force no positive lower. Retain all existing numerals and term counts. |
| `place-value-scaling` / `place-value-scaling` | The represented numeral, the two asked place values and factor10 | A repeated5 in the hundred-thousands and ten-thousands places of556789 gives minimum10 and upper1m; unrelated digits cannot force lower5 or no positive lower. Retain every repeated-digit and zero-digit pattern. |
| `decimal-writing`, `decimal-reading-relations` / three decimal reading/writing leaves | Complete decimal values, including all complete reading choices | `8.123` needs lower5/upper10. Its fractional component is not another assessed value. `0.123` remains positive despite its zero whole-part glyph. |
| `decimal-place-comparison` / `numbers-decimal-place-comparison` | The two complete decimal values | Comparing `555.555` with `555.556` needs lower120/upper1000. The aligned digit counts support numeral comparison rather than introducing separate quantities. |
| `decimal-place-value-expanded`, `decimal-place-value-scaling` / their existing leaves | Retain independently assessed multiplication/unit or scaling quantities | Preserve all zero-glyph charts while retiring false numeric-zero choices: expanded terms omit zero coefficients and the scaling quantities are positive. |
| `decimal-notation` / both notation directions, decimal number line and measurement | Decimal value, assessed numerator and denominator, and the shared whole | `0.79 = 79/100` and locating tick79 of100 require upper100. Tenths require upper10. This applies the approved Q8 part-count rule, rather than treating fraction counts as numeral digits. |

The pinned ontology's `NumbersWithZero` and `NumbersWithoutZero` statements explicitly say
that a zero digit in a nonzero numeral does not establish a zero-valued quantity. Both tasks'
actual inputs, results and assessed sum/scaling quantities are positive. Their former
digit-strip zero claims are therefore corrected to invariant `NumbersWithoutZero`; the
expanded-form inference callback is retired, and scaling's glyph-zero schema choice becomes
ordinary concrete numeral variation in the generator. No production target or view spec changes.

Both repairs preserve their payloads, tasks and supported mathematical outcomes. Expanded form
retains all 15,714 numerals and one uniform conditional draw across 50 feasible cardinality/range
cells. Scaling retains all 269,001 native outcomes in three actual lower cells0/5/10 under
upper1m, using the original proposal weights8/9 according to adjacent-pair position. Its six-draw
sampler preserves zero-digit patterns as incidental variation; the old seeded schedule changes.
Canonical regeneration and VQA will use the repaired profiles, and the complete replay audit
must pass before the artifact is accepted.

The decimal repairs retain native values, precision patterns and original conditional proposal
weights. The two plain reading/writing bands merge whole-part0 with wholes1..4 in their original
1:4 mass ratio, and retain wholes5..9 in lower5/upper10. Decimal notation retains all99 original
fraction/decimal values and its two-draw continuation, conditioning its original equally likely
tenths/hundredths branches on the selected upper10/upper100 profile. Source and finite-domain
acceptance evidence for these follow-ups is recorded below.

The first focused follow-up gate passes 208 tests across 11 files, including the expanded-form
source/SSR integration, all99 decimal-notation values and original two-draw continuation controls.
All six covered generator/helper files pass the unchanged 85% statement /60% branch thresholds
(99.23% statements /96.84% branches overall). The decimal place-value preservation oracle also
passes: 810,243 expanded outcomes and 177,309 scaling outcomes retain their exact original masses,
including 278,802 and 66,717 zero-glyph outcomes respectively. All 240 protected SSR strings remain
byte-identical; source lineages remain intact while false zero-choice selections merge8→6 and7→5.

The remaining decimal gate passes 187 tests across 28 files, bringing these follow-ups to 395
passing focused tests across 39 files. Its 13 covered implementation/helper files have 100%
statement and 97.93% branch coverage and pass the unchanged thresholds. The earlier six-file
gate remains independently recorded. No timeout or coverage threshold was changed.

Plain before/after checks preserve all 10,080 decimal-writing construction paths and 9,990
distinct values, with 5,040 paths /4,995 values in each scalar band. All 2,048 protected high-band
payload and PRNG-continuation controls remain exact. Decimal place comparison retains the
original 11 deciding/shortening branch masses, 4,495,500 independent triangular transition paths,
98,901 equality values, 295 interval probes and 192 generated/replayed draw schedules. Only nine
strict scalar cells are feasible under its original prefix law; those and six equality cells
retain 24 complete choices across the three protected decimal source lineages.

The obsolete `NumbersWithoutZero`-only number-name fallback in plain decimal writing is retired.
Numeric zero absence is now invariant and does not select notation. The ordinary two-family
schema retains exact explicit notation requests and seeded fallback; all five actual source
routes explicitly request notation, so their mathematical availability is unchanged (SPEC-9).

The complete eight-producer source comparison records 4,810 selections /2,037 routes /1,547
normalized targets. All 4,691 unaffected semantic/annotation outcomes remain exact; all 23 old
affected lineages remain, with 75 exhaustive inference selections and no conflicts, contract
errors, incomplete tuples or invalid contexts. The sole missing-range finding remains approved
Q4 overflow. There are 13 additional decimal-place-comparison routes, discussed below, so this
is a candidate source checkpoint rather than curriculum acceptance. The comparison preserves
2,001 old plans unchanged and records 23 affected old-plan changes.

All source stages of the repository check pass after test-only TypeScript fixture adoption;
the 115 affected test cases are rerun successfully. The stored-artifact stages still fail on
the unchanged 1,944-row snapshot: missing generation receipts/plans at the split gate and 4,006
strict annotation failures. No stored artifact, VQA cache or evaluator policy was changed.
The Gemini key is locally configured, ignored by Git and verified by a successful authentication
request; live image evaluation awaits a successful canonical publication.

The source fixes are committed in three batches: `7e062245` (whole place value), `d741179c`
(decimal representations and genuine scaling/decomposition quantities), and `7df8d785`
(assessed fraction counts in decimal notation).

The first complete canonical render attempt produced 4,860 successful images and 10 failures in
`operations-representation`; the transaction did not promote its staged snapshot. All failures
were multiplication/division payloads admitted to a view whose actual object renderer supports
only nonnegative addition/subtraction within10. A read-only proposed compatibility correction
removes exactly four invalid pairings, retains every target and its other working views, and
leaves all existing addition/subtraction plans unchanged. The user explicitly approved this
compatibility correction and it is applied without changing the renderer, capabilities or
checklist. Live VQA has not started on the failed stage.

The 13 newly exposed decimal comparison routes reveal a second declaration gap. The two source
builders `K.CC.C.7-compare-numerals` and `2.NBT.A.4-compare-three-digit` omit `IntegerNumbers`.
Their broad labels therefore admit the corrected decimal producer. The
[approved source review](canonical-range-source-review.md#comparison-definitions) and
[consumer review](canonical-range-consumer-review.md) describe integer comparison and the
Grade2 domain100..999; this is not intended decimal practice. Keep the truthful decimal producer
capabilities. The proposed precision correction adds the missing integer scope at the two
source builders, with explicit target-ID migration and preservation of their integer routes.
The user explicitly approved the precision correction (SPEC-2, TSPEC-13); only those two scope
labels are added to the production builders. Impact evidence and the reviewed patch remain
under `temp/spec-plans/ccss/integer-comparison-precision/`.

The read-only precision proposal passes patch applicability and full raw/normalized matching.
It changes exactly two builder label lists: raw count 1,595, normalized count 1,547 and 48
deduplications stay unchanged; 14 target IDs migrate and all 1,533 other targets remain exact.
Routes fall 2,037→2,024 solely by removing the 13 unintended decimal pairs. Every integer
`comparison#numbers-compare` route remains, with the same 16 bindings and 128 same-seed
configuration/annotation/math and pre/post-draw PRNG controls under the explicit ID mapping.
The reviewable proposal is `temp/spec-plans/ccss/integer-comparison-precision/plan.md`.
The object-view correction removes its four unsupported routes as separately approved.

### Approved declaration verification

After both corrections, the complete source gate passes with **1,547 normalized targets /2,020
routes /4,791 selections**. Raw count 1,595 and 48 deduplications remain unchanged. All 14 target
ID/label migrations match the approved map; all other target claims remain exact. Relative to
the Q4 checkpoint, only the four unsupported object-view routes are removed, with 4,685
unaffected selection semantics/annotations exact, 37 expected plan changes and 1,983 unchanged
plans. Relative to the representation candidate, all 4,791 retained selections remain exact
under the ID mapping; only the 13 exposed decimal selections and six unsupported operation
selections are removed. All 14 intended integer routes, 16 bindings and 128 same-seed
payload/annotation/config/replay and post-draw PRNG controls pass.

The bounded production-target regression suite passes all 16 cases. The object-view suite
passes all 31 cases, including supported zero/endpoint10 payloads in both modes, rejection of
unsupported selected domains, broad-target fallback, all eight intended K/Grade1 lineages and
continued alternate-view coverage for the four Grade3 targets. These bring focused acceptance
to 442 tests across 41 files. No mathematical, rendered or checklist contract was weakened.
Final source evidence is `source-audit-approved.json`, `matching-after-approved.json` and
`source-matching-approved.json` in the artifact-acceptance folder. The configured Gemini model
also passed an authenticated availability check before the live VQA phase.
Final TypeScript and the complete generator/view contract audit pass after these declarations.
The integer correction is committed as `04151500`; the object-view boundary and its 31 tests
are committed as `8a31e6a4`. Both preserve their existing mathematical/rendering implementations.

### Fresh snapshot and remaining image-label corrections

Canonical regeneration from `046575f7` completed successfully and published immutable generation
`cc7ba1aac520daa1842a3f1a0f43cda649c3e050e57f198f976cd506a3c50e62`: 4,866 images,
527 shards and 160,611,856 PNG bytes. All seven repository check stages pass. The independent
stored-row audit replays every primary row exactly and checks 3,899 range proofs across all
119 range-bearing producers, with no unmapped producer or mathematical failure. It separately
records 92 algebra exclusions, 874 rows outside range obligations and the one approved overflow
sample (product 1,464,892). The official two range advisories refer to that sample and its source
selection, rather than two physical images.

Every PNG digest, graph identity and replay receipt passes the fast artifact audit. Strict
annotation checks pass for 3,912 eligible rows, with 954 outside the policy scope; splits have
no leakage or task redundancy. The image gate still finds two groups with identical pixels and
different labels. One additional identical-label copy group is advisory. Live VQA has not run.
The protected original 175 cache files remain unchanged; the read-only readiness check finds
1,002 reusable passing rows and 3,864 uncached rows (3,863 unique missing module cache keys).
These counts describe this snapshot, before the following corrections.

After reviewing both concrete proposals, the user explicitly approved both corrections:

- **Exact operand widths:** refine `place-value-arithmetic` into the six exact largest/smallest
  width cells `(1,1)`, `(2,1)`, `(2,2)`, `(3,1)`, `(3,2)`, `(3,3)`. Keep the original native-domain
  selection separate from completed width labels, preserving the legacy nine ordered pairs and
  general eighteen ordered pairs in the upper20 regrouping collision. The proposal's independent
  finite proof partitions 775,251 accepted general cases across 60 original contexts and retains
  all 14 nonempty legacy contexts. Legacy seeded sampling is to stay exact; general profiles may
  change seeds and their unqualified mixture while preserving conditional weights and support.
  Payloads, targets and all three consuming views remain unchanged.
- **Equation tasks:** remove unsupported `Formalization` from numeric result/operand completion.
  Preserve the existing law completion tasks through preselected presentation profiles: ordinary,
  commutative and associative equations use `ExpressionOnOneSide`; the necessary distributive
  composite-to-composite witness uses `ExpressionOnBothSides`. The ontology forbids emitting both.
  Add `operations-equal-addends-equation`, using the existing `ArithmeticPairProblem`, to ask for
  a whole equation from an even total and reveal the canonical equal pair only in Solution mode.
  This retains the same three target IDs for upper5/10/20, rather than reclassifying their demands.

Implementation review found a further admitted configuration of the same law-shape issue:
`Multiplication + SingleDigitSmallestOperand + NumbersSmaller20 + ProcedureInversion` selects
the triples producer's bundled distributive capability without explicitly requesting a law.
The target-only property rejection therefore does not establish that inversion always has a
one-side equation. Apply the same approved correlated presentation rule to both inversion
siblings as well, retaining their existing explicit law-target rejection, unknowns and pixels.
Verify these width-induced law bindings in all four execution/inversion leaves; an absent law
in the raw target must not prune a valid profile selected by the producer. Evidence is
`law-inversion-width-fallback.json` / `.log`. This is the same equation-label correction, with
no new mathematical producer, task identity or exclusion boundary.

The width-domain separation also removes the old addition-only coupling from explicit subtraction
width requests. `Subtraction` / `SubtractionPlaceValuePartitioning` with exact `(2,1)` uses the
existing general subtraction domain; exact `(2,2)` plus `MultiplesOf10` keeps whole-tens
subtraction. Only an addition-compatible original conjunction selects the legacy addition
sampler, and its unspecified-operation default remains addition. This makes the approved exact
capabilities requestable without changing any previous domain. The intermediate focused width suite passed
195 cases across eight files, including all 60 general contexts, 14 legacy contexts /448
continuation controls, the actual collision and all three consumers. Independent source review
finds no target-ID dispatch, post-generation labels or native-support loss.

The equation proposal's full in-memory dry-run preserves all 1,547 target IDs, label conjunctions
and dispositions, all twenty law routes /26 selections and every retained generator binding.
Its authorized six-to-three equal-addends route migration gives 2,017 routes /4,786 selections
before any width refinement; 160 retained plans change and 1,854 remain exact. The width plan's
actual matching delta and both implementations' runtime proofs were pending at that proposal
checkpoint; their completed results follow below. The approved new view type-map entry
typechecked before view implementation began. These source corrections still require final
artifact and VQA acceptance.

Evidence in the artifact-acceptance directory includes `generation-approved.log`,
`check-fresh-artifact.log`, `range-audit.json`, `range-audit-projector-review.md`,
`range-audit-advisory-reconciliation.md`, `artifact-fast-audit.json`,
`fresh-cache-readiness.json`, `width-fix/proposal.md`, `width-fix/law-proof.json` and
`law-correction-proposal.md` / `.json`. This snapshot precedes the approved source changes;
their affected regeneration and remaining acceptance gates are recorded in the
[published snapshot checkpoint](#affected-canonical-snapshot-checkpoint-2026-11-04).

### Approved image-label correction verification

The actual combined source comparison passes with **1,547 targets /2,017 routes /4,825 complete
selections**. Every target ID, label conjunction and disposition is unchanged. The only route
change is the approved six-to-three equal-addends writer migration. All 1,947 retained non-width
routes keep their generator bindings. The 67 width routes remain, with their selections refined
75→114; no additional width route appears in the current catalog. Every old width cell has its
complete exact refinements, and all 280 legacy planned payload/PRNG controls pass.

The old 75 width-inference selections retire: there are now no inference callbacks in the current
source selections. The annotation gate has zero conflicts, contract errors, invalid contexts,
incomplete tuples or pending inference; the only missing range remains approved Q4 overflow.

Independent native verification checks all 775,251 general cases, all 14 legacy ordered lists,
and 1,550,502 legacy/single/multiple control comparisons across 180 contexts. Original rational
proposal denominators, row/second ordering and conditional weights remain exact. All 1,952
exact-cell and 528 control two-draw continuations pass. The feasibility scan now limits each
row to the selected digit interval before visiting pairs; it retains the original proposal
denominators and random calls. No mathematical outcome is removed by this optimization.

The two protected implicit-law width contexts survive in all four equation leaves: twelve
original generator-binding selections and 48 draw/replay/PRNG controls pass. Their distributive
projections all declare Equation/BothSides without false Formalization. Result and second-operand
unknowns remain distinct and withheld in Question mode. The ordinary law/writer lineage suite
also verifies all 26 law and five writer selections across four seeds, including 124 draw/replay
controls and 248 Question/Solution SSR checks.

Focused acceptance passes **304 tests across eighteen files**: 222 width tests and 82 equation
tests. Expanded width coverage includes all nine module production files (95.30% statements,
92.32% branches); every file clears the unchanged 85%/60% thresholds. Equation coverage includes
fourteen production files at 100% statements, branches, functions and lines. The expanded scan
initially exposed four timeout failures; interval pruning removes three, and organizing the
remaining monolithic range proof into ten independent contexts preserves every pair, band,
witness and exact cardinality. No timeout, assertion, coverage threshold or gate is weakened.
The original failure logs remain protected.

The compatibility regression fixture now loads exactly its 26 required generators and one
real view rather than the entire catalog, asserting both discovered and loaded inventories.
Its original cases and 30-second setup limit remain. Two formerly rejected width requests
are now valid under the approved exact capabilities; their negative rows use genuinely
impossible single-digit/whole-tens conjunctions, with two additional positive native regressions.
All 62 compatibility tests pass. Independent final reviews of both source batches find no
actionable correctness or preservation issues.

Final TypeScript, complete generator/view declaration validation and documentation references
pass. One integration-test-only generic typing correction uses the concrete pair schema and
asserts its actual no-inference spec; no production type or producer changes. The source batches
are committed as `4ae015ef` (exact operand widths) and `a1bd08f2` (equation tasks).
Full repository coverage remains pending: two collected attempts exposed existing exhaustive-test
and cold catalog timeouts. Five test files now separate independent contexts and fixture phases,
retaining every original candidate, seeded draw, assertion and timeout. All 90 revised cases pass
under coverage. They retain all 704 general-model draws /2,816 SSR calls, 264 word-model draws
/528 SSR calls, 960 polygon draws and the complete rounding oracle. Model-only catalog loading
is staged separately from the independently loaded full runtime catalog, with both 30-second
limits retained. This test-structure verification does not replace the affected production-file
coverage above. The test-only batch is committed as `e2de6a2a`.
Complete-suite verification remains pending; the later three-file timeout repair is recorded
below. Source/native verification does not establish final artifact or live
VQA acceptance; the published snapshot checkpoint below records the current gates.

Evidence includes `after-approved-corrections/source-acceptance.json`,
`after-approved-corrections/law-width-induced-proof.json`,
`after-approved-corrections/width-native-proof.json`, `width-fix/expanded-coverage-second/coverage-summary.json`,
`law-coverage/coverage-summary.json`, `types-corrections-verified.log`,
`specs-corrections-final.log`, `docs-corrections-final.log` and `test-partitions-coverage-final.log`.

### Affected canonical snapshot checkpoint (2026-11-04)

Canonical affected generation from clean `6aae1dae` completed successfully and published
`fc0ce99326514fd6b08124643fd3dc3458df0d0295e7cf35f7e50b0bbb34dd70`: **4,866 images in
529 shards**, with 334 reused and 195 written. Its graph retains **1,547 targets /2,017 routes**.
The split report retains three tuple-allocation advisories; graph-plan coverage does not imply
that every matched tuple has a physical sample.

Independent replay reproduces all **4,866 primary rows exactly**. Mathematical checks pass
all **3,899 range-bearing rows across 119 producers**, separately accounting for 92 algebra
exclusions, 874 rows outside range obligations and the one approved unlabelled overflow
product, **1,464,892**. There are no failures or uninspected rows. Annotation checks pass for
3,912 eligible rows, with 954 outside policy scope and no invalid contexts. All image digests,
recorded plans, receipts and prepared views agree with the immutable graph. The 3,968 train
and 898 validation rows have no split leakage or task redundancy.

The image gate remains blocked by **one new conflicting-label group**: the same `10+10=20`
place-value explanation Solution is labelled `MultiplesOf10` on its legacy route but lacks
that claim on its general route. Two other identical-image groups have identical labels and
remain warnings: distributive boxes/vertical Solutions, whose approved equation labels now
agree, and the existing Grade5/Grade6 unit-sharing inverse Questions.

The exact `cc7ba1…` to `fc0ce9…` churn review finds **57 width image/payload changes**, eight new
writer identities and eight retired completion identities. All **486 equation-presentation
changes retain their pixels and mathematical payloads**. There are no unexpected changes
outside the approved closure. Two changed retry seeds/attempts are independently verified
valid deduplication shifts, rather than sampler regressions; provenance refreshes are recorded
separately from mathematical changes.

The initial **any-operand proposal was withdrawn**. Its 67-route /114→152-selection dry run and
132 train /32 validation SSR simulation remain historical evidence in
`temp/range-artifact-acceptance-2026-11-04/multiples-ten-fix/proposal.md`; they are not the approved
condition or current source counts. The both-operand policy and its verification follow below.

Final full VQA, cache acceptance, repository checks, global coverage and union verification
remain pending; no full-suite or dataset-acceptance pass is claimed. Evidence is under
`temp/range-artifact-acceptance-2026-11-04/`: `generation-corrections-affected.log` and
`after-approved-corrections/` reports `artifact-fast-audit.json`, `images-after.json`,
`annotations-after.json`, `split-after.json`, `range-audit.json`, `snapshot-churn.json`,
`width-seed-attempt-review.json` and `fresh-cache-readiness.json`. The interrupted full-suite log is
`full-coverage-after-partitions.log`.

### Approved both-operand policy and word-diagram follow-up

The user approved the binary `MultiplesOf10` rule now recorded in
[SPEC-G3](../spec-generator.md#spec-g3--declare-the-area-and-scope-capabilities-the-math-produces):
**both primary operands must be multiples of ten**, including a necessary unknown operand.
Thus `10 + [] = 20` qualifies, while `34 + 20` does not. A divisible result or a derived
place-value component does not establish this claim. Keep the native sampling pool separate
from the semantic condition.

The final place-value source proof preserves all **67 routes**, refining **114→126 selections**,
with **1,008 planned draw/replay controls passing**. The independent native proof covers all
**775,251 general ordered pairs across 60 contexts**, refining 61 width cells into 77 nonempty
cells under the both-operand partition, and retains all fourteen legacy native contexts. Three upper100 legacy
addition bindings each refine **368→44** truthfully labelled pairs: the concrete model
`1.NBT.C.4-concrete-place-value-addition~cdd1e96d`, explanation
`1.NBT.C.4-explain-place-value-addition~313fb8fe`, and written method
`1.NBT.C.4-model-to-written-method~25ba6b2e`. The 324 excluded false-claim occurrences per
binding total 972; their mathematical pairs remain available through general sampling and
raw native controls. These are corrected claim-conditioned pools, not lost mathematical support.
The final 126-plan allocation simulation retains all 67 routes and checks 132 train /32 validation
SSR rows plus 64 native constructor controls. It has zero cross-split collisions or conflicting
label groups; the one same-label, same-split `10+10` copy group remains a warning.

All **379 module tests across nine files pass**. Coverage instruments all nine production files
and measures **95.32% statements /92.69% branches /97.64% functions /98.48% lines**, passing the
unchanged thresholds. Canonical artifact acceptance remains separate from this source proof.
The module correction, future generic-pair helper and normative SPEC-G3 clarification are
committed as `b1d11c86`.

The same rule removes the false claim from known-fact place-value scaling without changing
its mathematics. All **64 native scaling frames, 18 competencies, 32 routes and 39 selections**
retain their configurations and draw law. Eight scaling selections lose only `MultiplesOf10`;
31 other selections retain their labels. Checks cover 624 seeded mathematical draws and
256 native continuation controls. All **25 focused tests pass**, with full statement/branch
coverage of the unchanged generator and domain. This correction is committed as `b14fb1b4`.
Under the unchanged
`3.NBT.A.3-one-digit-times-multiple-of-ten` prefix, the three approved target suffix migrations
are `2da80b18→c9f9a57d`, `703366da→3df7c1b7` and `a0353fc0→c0753c57`; the standard competencies,
learner tasks and native outcomes remain.

Future generic-pair multiplication with `MultiplesOf10` now uses a step of ten for both
factors. All **842 stored pair images lack that claim**, so the correction does not invalidate
their existing mathematics. The completed live evaluation of those images records **840 PASS,
two HIGH-confirmed FAIL, zero uncached rows and zero evaluation errors**; this pre-fix cache
checkpoint is preserved separately as `9483a4c5`. The two failures share
the normal word-problem target `3.OA.A.3-multiplication-division-word-problems~b8ee80e2`, but are
different exercises: Question `1÷1` and Solution `2÷2=1`. Both diagrams incorrectly depict
the friend count as another apple amount. The shared-view correction uses the actual
story roles, withholds the unknown answer picture in Question mode, and restores it in Solution
mode. It preserves all mathematical tasks across the two leaves' 30 routes /80 physical rows;
every current plan bounds the answer by 20. Specs, checklists and mathematical payloads are
unchanged. The renderer correction is committed as `2fecb3be`.
Canonical rendering and live evaluation of the corrected images
remain pending, so the pre-fix VQA run does not establish their acceptance.

The separate test-only commit **`01811486` passes all 65 tests across three files**. Its grade
partition retains the complete authored target/candidate inventory; all 780 decimal trace
fixtures and 2,400 original /2,400 replay stress draws remain. Both reported decimal production
files have 100% statement, branch, function and line coverage. Every original assertion,
timeout and threshold is retained.

A separate **52-test run across six files passes**, measuring **98.13% statements /95.62%
branches /100% functions /98.94% lines**; the quantity component and generic-pair generator
each have full coverage. Final TypeScript passes. Global coverage remains pending after these
bounded repairs; no coverage exclusion, timeout or threshold is relaxed.

Evidence under `temp/range-artifact-acceptance-2026-11-04/` includes
`multiples-ten-both-fix/native-proof.json`, `multiples-ten-both-fix/source-proof.json`,
`multiples-ten-both-fix/simulated-splits.json`, `multiples-ten-both-fix/focused-coverage-final.log`
and its `coverage/coverage-summary.json`,
`both-multiples-review/known-fact-after.json`, `both-multiples-review/known-fact-focused-coverage.log`,
`both-policy-root-coverage.log`, `both-policy-root-coverage/coverage-summary.json`,
`both-policy-types.log`, `test-partitions-followup-coverage-final.log` and its coverage summary.
No post-fix generation,
full VQA/cache, complete-check or union acceptance is claimed.

### VQA findings and source checkpoint (2026-11-05)

The protected pre-fix publication is
`ec7939fbc7e81ff14ce36337791517f9e28faed32aab3671fc9aa568faed7f9b`: **4,870 physical rows**.
All rows replay, with direct/planned mathematical RNG repeatability; 78 `MultiplesOf10` rows,
18 known-fact scaling rows without the false claim, 92 algebra exclusions and one approved
overflow are verified. Annotation and split checks pass. The historical 3,903-row range report
omitted assessed part counts in fraction comparison; that family's range pass is superseded.
The original report and projector remain preserved as historical evidence.

Completed baseline VQA records **4,851 PASS /18 HIGH-confirmed FAIL /one uncached request error**,
with no pending HIGH or invalid review. Commit `840f8701` preserves 184 cache files containing
4,867 records /35.6 MB. There are 4,868 unique module keys: 4,849 passing, 18 failed and one
missing. The missing measurement-table request remains ordinary evaluation work, not a verdict.

The approved fraction correction `f2495863` retains **177 payloads /289 weighted paths**,
**seven routes /13 canonical cells**, upper5/upper10 and no positive lower. Three common-part
draws and one benchmark draw retain the original conditional law. The benchmark asks why its
comparison is justified. Scoped proof covers 104 exact planned/direct/replayed draws and 208
Q/S renders. All **95 tests /seven files pass**, with 100% statement, branch, function and line
coverage of the generator, range domain and shared comparison helper under unchanged gates.
Full source comparison passes at **1,547 targets /2,017 routes /4,843 selections**: only seven
fraction semantic plans change, adding six choices. All 2,010 other routes /4,830 selections
remain semantically exact; operational input-hash refreshes are recorded separately.

| Verified source checkpoint | Evidence and boundary |
| --- | --- |
| Layout `4e3e1112` | 57 tests /three files pass, including 41 common-factor controls. Decimal captions: 12 images /24 identical captures, 36 contained boxes, no text/grid overlap. Whole-fraction line: 60 images /120 identical captures, 360 contained boxes, no overlap, minimum 5 px gap. Canonical pixels still need revalidation. |
| Estimation `becba375` | Private admission-cache indexing only; 84 contexts /47 cells retain row/second order, weights and proposals. All 3,008 seeded payload/three-draw continuations match; 155 actual tests pass with V8 coverage, two workers and original limits. Final churn must show no math/config/label/RNG/pixel change. |
| Test conservation `956687e0` | All 28 changed test inventories and distinct assertions reviewed, including mutable-Map typing, diagnostic titles and the final 41-case common-factor refinement. Original per-case budgets, skips and thresholds remain. Bounded setup staging, pure SSR reuse and the genuine enumeration fixture correction are disclosed. |

All five reviewed leaf checklists are applied as **`43c13b2d`**: algebra-expression-parts,
currency-word-problem, numbers-write-count, fractions-compare-benchmark-models and numbers-compare.
Their guarded inventory SHA256 is `34b66df67bde9ecb86147e0cb80a82fef0b04a75d54d2819a31c37a7f099dcc7`.
The central checklist, VQA evaluator and evaluation prompt, policy and cache machinery are unchanged. These
task-owned clarifications retain independently assessed fraction parts, requested cent totals,
actual response counts and worked comparison evidence; compact relation completion requires
no extra place-value panel. Changed contexts require normal fresh-key LOW/HIGH validation.

The earlier full baseline remains **9,357 passed /35 failed of 9,392 tests**. The next collector
records **9,978 passed /six timeouts of 9,984 tests across 1,077 files**, taking 3,468.03 seconds; it did
not pass. Windows independently records a 1,588.565-second sleep during the two extreme cases.
Commit `b018a772` partitions only the other four composite checks. All **69 scoped tests /six
files pass**, including both unchanged sleep-affected controls, and TypeScript passes. No test
budget, skip or coverage threshold is relaxed. Whole-repository coverage was pending at that
checkpoint; the complete passing run is recorded below.

The affected publication and completed offline checks are recorded in the
[next checkpoint](#affected-canonical-acceptance-checkpoint-2026-11-05). The final full-coverage
and seven-stage repository passes are recorded below. Fresh VQA/cache and union were pending
at that checkpoint; their passing final results are now recorded in the final checkpoint.
Neither failed collector above is superseded by a scoped pass.

Evidence is under `temp/range-artifact-acceptance-2026-11-04/`: `after-both-corrections/` retains
the old range report and completed VQA/cache evidence; `fraction-comparison-fix/` has the native,
planner, 95-test and full-source proofs; both layout directories retain their native proofs.
`estimation-performance-fix/installed-proof-inventory.json` and the 28-file conservation review
retain the source proofs. Failed collectors remain `full-coverage-both-policy.log` and
`full-coverage-vqa-corrections.log`; the 69-test follow-up is
`test-coverage-followups-and-suspend-controls.log`. Fresh acceptance evidence belongs under
`after-vqa-content-fixes/`, including the applied-context inventory and protected baseline-state map.

### Affected canonical acceptance checkpoint (2026-11-05)

Canonical affected regeneration from clean `9c35e6a1` published
`d72415e5450387efa43a5135a8de1a2d137405149ccfbb55961bfd046c50b9a7`.
It retains **4,870 physical rows: 3,968 train /902 validation**, with 529 shards: 520 reused
and nine written. Canonical work rendered 100 images in 91.23 seconds. The immutable manifest
is 43,264,064 bytes, SHA256 `d738a15a2bdedad8b829f364b782d30575da7ea5c44224c8a744a2bb3850b056`.
The protected `ec7939` publication, baseline cache and both failed coverage logs remain intact.

All **4,870 primary rows replay exactly**, including stored receipts, prepared configurations,
annotations and recorded view RNG. Direct/planned mathematical RNG repeatability also passes
for every row. The corrected explicit projectors verify **3,903 mathematical range rows**,
92 algebra exclusions, one approved multiplication-overflow row and 874 rows without a range
obligation; zero rows are uninspected and zero failures remain. All 78 `MultiplesOf10` rows
and 18 corrected known-fact scaling rows pass. This proves the sampled stored rows, not all
future outcomes; historical post-generation RNG continuations are not stored.

The offline annotation gate checks 3,916 eligible rows with zero failures. Images and split
integrity pass: no label conflicts, cross-split leaks or redundancy errors; three duplicate
image groups share labels, mode and split. All **1,547 target identities/claims and 2,017 route
identities** remain exact against `ec7939`, with no new target migrations. Current source has
4,843 complete selections. These source counts are distinct from physical allocation: three
matched routes are unrepresented, and 451 of 521 allocated validation tuples are realized
(70 advisories). No claim of complete matched-route allocation is made.

Immutable churn retains all 4,870 sample identities with no additions, removals or unexpected
changes. **26 PNGs change** within the three approved families: decimal multiplication captions,
fraction comparisons, and whole/fraction number-line captions. All 48 estimation rows retain
exact math and PNGs; the private cache optimization has no semantic or pixel change. There are
189 changed VQA keys. The sole changed winning attempt is explained by exact production replay:
old `1/3 < 2/3` at attempt one duplicates a train task and selects attempt two; the conditioned
new `2/6 < 5/6` is unique at attempt one. Seeds and dedup rules are unchanged.

Protected **before-live** readiness records 4,680 passing physical rows /4,678 unique module
keys. **190 normal evaluation keys remained**: 189 fresh keys and the old uncached measurement-table request.
All 18 baseline HIGH failures now have fresh keys. No fresh-key passing verdict is claimed;
zero current completed failures before evaluation is not VQA acceptance. The protected
baseline remains 4,851 PASS /18 HIGH failures /one missing request.

The awake collector subsequently ended at **10,015 passed /one overflow timeout of 10,016
tests**, with 1,076 of 1,077 files passing, in 29m21s. It did not pass; the chained generator
coverage gate was not reached. An isolated passing timing does not supersede this full-run
failure. The subsequent cache correction and complete passing run are recorded below.

| Historical before-live gate sequence | Result at that checkpoint |
| --- | --- |
| Awake whole-repository coverage | **PASS** — 10,016 tests /1,077 files in 1,754.12s; all 185 generator files pass unchanged 85% statement /60% branch thresholds. |
| Fresh live VQA/cache | **Not yet run then** — the 190 exact current keys, including the old fetch error, awaited normal evaluation. Final b55 passing results are below. |
| Complete strict repository checks | **PASS** — all seven ed256 stages; the separate before-live strict cache audit recorded 190 missing /189 stale keys. |
| Immutable churn and union | ed256 churn **PASS**, all stored rows/PNGs/keys exact; live-cache and union had not yet passed at this checkpoint. Their final results are below. |

Evidence in `temp/range-artifact-acceptance-2026-11-04/after-vqa-content-fixes/` includes
`range-audit.json`, `artifact-fast-audit.json`, `target-lineages.json`, `split-after.json`,
`fresh-cache-readiness.json`, `snapshot-churn.json`, `winning-attempt-review.json` and
`decision-cross-gate-review.json`. The churn report's review-required retry is resolved by the
separate exact retry proof. The latest checkpoint below records the subsequent passing offline
audits, seven repository stages and complete coverage. The final checkpoint records the later
passing fresh VQA/cache and union gates.

### Multiplication cache and canonical refresh (2026-11-05)

Commit `d530904d` changes only the standard-multiplication domain's private fixed table of
990 multiplier digits/maxima/weights. Range domains remain lazy; guards, carry logic, bounds,
ordered support, integer weights and the two-draw sampler remain unchanged. Independent
execution proves all **9,890,100 native pairs**, 8,975,330 admitted pairs and total integer mass
582,992,000, with exact row/order hashes in all five cells, 55 interval tapes and **1,285 seeded
payload/continuation comparisons**. No spec, payload, view, target or test changes are made.

The bounded fresh-process V8 comparison keeps both original files/all 39 cases, two workers
and 5s limits: cold overflow construction improves **3.664→2.596s**, and its original 60-seed
case **4.235→3.034s**. These are one measured pair of runs, not a timing guarantee. All **68
module tests /four files pass**; generator statement/branch/function/line coverage is 100%,
and TypeScript passes. This scoped result does not convert the failed full collector to a pass.

Canonical affected refresh from clean `d530904d` publishes
`ed25642af4e0ad38ef6f47710a345608cc513253c641adbff866e6121ebbab69`.
It retains **4,870 rows: 3,968 train /902 validation**. The pipeline renders one pair/two images
in 28.95s, reuses all 529 shards and writes no new shard or image bytes. The immutable manifest
is 42,958,039 bytes, SHA256 `1f27bf6b394474d15b0f7ac21cc1ff8cf9fc6756cef62975675199139f23bb25`.

New guarded audits replay all **4,870 rows**, including mathematical RNG repeatability;
3,903 range proofs, 92 algebra exclusions, one approved overflow and 874 no-obligation rows
have zero failures/uninspected rows. All 78 `MultiplesOf10` and 18 known-fact scaling rows pass.
The annotation gate checks 3,916 eligible rows with no failures. Images/splits pass, retaining
three same-label/mode/split duplicate warnings and the separate three missing-route /70
unrealized-validation allocation advisories. All 1,547 target identities/claims and 2,017 route
identities remain exact; current source still has 4,843 complete selections.

Strict immutable d724→ed256 churn finds **all 4,870 complete stored rows, PNGs and VQA keys
identical**: no math/config/label/fingerprint/seed/attempt/RNG/identity/allocation change.
The graph changes only the pinned domain bytes and retires five unreferenced checklist nodes.
Each retired leaf has zero graph/physical references and unchanged disk/Git bytes; this is the
pipeline's intentional orphan pruning, not five additional source edits. The first overly broad
source-node assertion and its failed log are protected; the corrected derived predicate and
independent review pass without relaxing any physical-row check.

All **seven repository checks pass**, including TypeScript and strict annotations. The protected
**before-live** API-disabled strict VQA cache audit **exited 1**: 4,680/4,870 passing physical rows,
**190 missing current keys /189 stale historical keys**, zero freshness/structure/renderer
issues, and no API calls. Readiness preserves the old fetch-error key as ordinary work; no
fresh-key passing verdict is claimed. A successful offline inventory is not live VQA acceptance.

At `d530904d`, the unchanged awake `npm run test:coverage` **exits 0**: all **10,016 tests /1,077 files
pass in 1,754.12s**, with zero skipped tests. npm continues into the generator coverage gate:
all **185 generator files pass** the original **85% statement /60% branch** thresholds; minima
are 87.5% /66.66%. Aggregate coverage is **98.85% statements /97.27% branches /100% functions
/99.4% lines**. Node24, the default worker pool, V8 coverage, two workers, timeouts, tests and thresholds are unchanged.
The process-only sleep lease is released. HEAD/source configuration and the ed256 pointer stay
exact throughout; all three prior failed collectors and their logs remain protected.

The user explicitly approved transfer of the 190 generated synthetic PNGs, ontology definitions
and visual checklists to Google Gemini using the configured key, with local verdict storage.
The completed accepted-key inventory has 188 PASS /two confirmed currency HIGH failures;
the final checkpoint below records their view-only repair and the passing 42-key follow-up.
The old 190-missing /189-stale result remains protected historical before-live evidence.
Evidence: `after-vqa-content-fixes/multiplication-overflow-perf-fix/installed-proof-inventory.json`
plus `temp/range-artifact-acceptance-2026-11-04/after-multiplication-cache/` — `range-audit.json`,
`artifact-fast-audit.json`, `fresh-cache-readiness.json`, `snapshot-churn.json`,
`source-node-churn-diagnostic.json`, `decision-corrected-churn-review.json`,
`full-repository-check.log`, `strict-cache-audit-before-live.log` and
`final-whole-coverage-result.json` (SHA256 `c7bd10d6336e0e57c705b38d2256cb65b701e10b9140050c5e964f1c60ab898c`).
Its final log SHA256 is `b8950f0154a37dbae27637eef8495f2007d16600816bb6591bbacf8d847cbb74`;
`final-whole-coverage/` preserves the log and both coverage reports.

### Approved live VQA and union checkpoint (2026-11-05)

**The sampled CCSS artifact and materialized local union pass their acceptance gates.** The
explicit Gemini consent/invocation remains in `approved-live-vqa/consent-and-invocation.json`.
The first 190-key run plus schema recovery remains historical: 188 PASS /two currency HIGH
failures (169 LOW /19 HIGH passes), preserved as `82297e16` and `first-run-cache/`. The recovered
schema response is included in those 190 keys. No old failed verdict is rewritten as a new pass.

The view-only unit witness `25101e8c` makes the canonical answer unit observable as `$?` or
`?¢`. Q12 policy, helpers/spec/schema, targets, mathematics and sampling remain unchanged.
All **196 scoped tests /10 files**, TypeScript and 42 exact recipe/HTML comparisons pass;
native Question geometry and all 21 Solution PNGs remain exact. Its **17 new view tests**
postdate the `d530904d` full pass: 10,016 tests /1,077 files and all 185 original generator
gates. That historical full run and this view follow-up are separate passing scopes.

Canonical publication from `25101e8c` is
`b55cd009029bc729946ce97254d5cab23aafd38f19616708a30bae93d6592ea1`:
42 renders in 44.40s, 527 reused /two written shards, **4,870 rows** (3,968 train /902 validation).
Manifest SHA256 `c135d960d29b24a5ce35b4ad0f5cb4ac21a01e4920686a9f8658fc7304994e76`, 43,024,399 bytes.
Strict ed256→b55 churn preserves every complete row, math/config/label/receipt and RNG/seed/
attempt field. Only **21 currency Question PNGs and 42 currency VQA keys** change; all 21
Solution and 4,828 outside PNGs remain identical. All seven current repository checks pass.

The normal 42-key follow-up exits 0: **39 LOW /three HIGH passes**, including both former
currency failures. All **4,828 reused physical rows** retain complete cache records exactly;
42 obsolete currency keys are normally pruned. The complete current report records
**4,870 PASS /zero failed, uncached or request-error rows**: 4,735 LOW /135 HIGH passes.
Its 55 final evaluations with uncertain labels retain the existing passing policy; their
evidence stays in the report. Exact readiness proves **4,870 physical rows /4,868 unique
module keys** passing, zero missing/failing/pending/invalid/work keys. The strict cache audit
passes with zero stale/malformed/renderer/structure issues. Cache `e3f77b7f` contains 184 files,
4,868 records and 35,610,014 bytes; only currency keys change from `82297e16`.

Official cache churn versus `446d433f` exits 0: **1,252 stable /1,223 changed /2,393 added
/442 removed identities**. The raw changed buckets remain 1,106 render/code, 106 attempt and
11 seed-number warnings. Independent review resolves those 11 as historical Question/Solution
winning-origin switches already in cc7/fc0, not seed-scheme drift; both seed/fallback sources
remain byte-identical. All 11 later recorded recipes/PNGs are exact through ec793→d724→ed256→b55.
Old 13a has no replay receipts and six old cache PNGs differ from that artifact; this is not
blanket historical equivalence or a reconstructed 50-attempt collision search.

The union merge exits 0 using only CCSS: **3,968 train /902 validation rows**, corresponding
to 1,984 /451 exercises, with zero merge deduplication. Independent verification hashes all
4,870 public and 4,870 source PNGs and checks every compact metadata row's exact ordered
labels/solution flag against b55; zero missing/extra PNGs or unexpected auxiliary files.
The standalone image audit passes with only three benign same-label/split/mode duplicate
groups and zero errors. Coverage export reports **4,870 images /413 labels /2,442 label
combinations**. The legitimate generated `coverage-report.md` is separately pinned; its first
overly narrow root-directory assertion and failed log are preserved, without relaxing PNG checks.

Evidence under `after-multiplication-cache/approved-live-vqa/`: `currency-unit-churn/snapshot-churn.json`,
`final-repository-check.log`, `final-strict-cache-audit.log`, `currency-unit-readiness/`,
`final-official-churn.log`, `historical-seed-disposition/` and `union-publication-proof.json`;
the final live report is `2026-11-05T08-49-18-917Z__full.md`. All raw histories remain protected:
the 190-missing /189-stale before-live state, ec793 4,851 PASS /18 HIGH failures /one request
error, fraction-projector blindspot and three failed full collectors. Source coverage stays
**1,547 targets /2,017 routes /4,843 selections**; this acceptance does not resolve the three
unrepresented routes, 70 unrealized validation allocations or approved unlabelled overflow row.

## Accepted direction

These agreements retain their minimum/maximum interpretation. The withdrawn reinterpretation
above does not change their ontology, matching or endpoint semantics.

- Use the tightest supported catalog bounds for the mathematical quantities involved in the
  competency. Preserve the inclusive absolute-value definitions and the
  [established operand/result interpretation](numeric-range-bounds.md#clarified-meaning).
- Expand a reviewed broad competency into relevant finer range permutations during target
  construction, before `toTargets()` assigns IDs. This is reusable authoring shorthand for
  ordinary explicit targets, not a change to generic ontology matching.
- Review relevant bands per competency within its source standard node. A contiguous reviewed
  sequence can be expanded automatically; exceptions can name selected bands. Do not apply
  every smaller threshold to every existing target by default.
- Preserve each source competency and its standard association. Replace the selected upper
  bound in each variant rather than appending both the broad and narrow bounds.
- Correct an underspecified target when its source clearly establishes the missing numeric
  domain, rather than adding a module guard to compensate for that omission. The user explicitly
  approved this strategy for Grade1 integer fluency and equivalent source aliases. Such corrections
  legitimately change claims/IDs; record their exact lineage, matching consequences and preserved
  competency coverage. Keep module participation preconditions for genuine stronger task contracts.
  The [integer-domain source correction](canonical-range-integer-domain-correction.md) records
  the first completed alias-closure migration and exact target/route mappings.
- Sampling changes and the increased number/weight of meaningful permutations are accepted.
  Choose feasible configurations without forcing a balanced mixture. Record counts and coverage
  effects; do not silently discard an unsupported reviewed competency.
- Omit `NumbersLargerZero` from the new explicit annotation convention. Its ontology relations
  remain intact; its absolute-value floor does not express positivity or zero absence.
- Keep labels resolved before generation. Prefer matching-capable declarations and mathematical
  profiles. Do not introduce post-generation annotation adapters, graph-driven completion or
  payload-reading `inferredLabels`.
- The 2026-11-01 approval also adopts strongest positive lower profiles, exclusion of isolated
  positive threshold magnitudes, the reviewed measurement envelope and exact source-domain
  corrections. The [source review](canonical-range-source-review.md#approved-decisions) records
  the complete decision and its support/matching consequences.

The user asked whether generator tests already guarantee canonical bands. They do not in general:
the current contract guarantees the declared bounds, while strongest-band sampling is a stronger
requirement. Updates to compatibility, mathematical samplers and their tests are an implementation
requirement of this design, not evidence that all current generators violate their existing contract.

## Baseline and inventory

The accepted baseline contains 1,013 normalized CCSS targets, 1,222 matching routes and 2,918
stored images. Its snapshot is
`b73ff2111380a3f86594a79b9b6087a6f9e7d288a2459721b9b5985502916cb2`.
The preceding acceptance passed 7,464 tests and all 2,918 exact VQA cache checks. Those checks
establish the current contract, not canonical range completeness.

The prior range report has 613 missing source-selection assessments and 1,062 missing stored-row
assessments. These are range-family presence findings, not 1,675 proved numerical errors.
Truthful but loose existing bounds require a different review and are not counted by that total.

The [mechanical inventory](canonical-range-inventory.csv) records authored competency definitions,
their current bounds and matching coverage. It is an inventory, not a globally approved expansion
list. Scratch scripts and full evidence belong under `temp/canonical-range-2026-10-31/`.

It contains **402 competency definitions across 216 active source leaves**. Of these,
106 definitions include explicit numerical bounds and 296 do not.

| Current target inventory | Authored permutations | Normalized representatives |
| --- | ---: | ---: |
| Total | 1,028 | 1,013 |
| Explicit upper bound | 231 | 223 |
| Positive lower and upper bounds (subset of the preceding row) | 29 | 29 |
| Lower bound only | 0 | 0 |
| No explicit numerical bound | 797 | 790 |

All normalized targets match, through 1,222 routes and 354 distinct matched generator/view
pairs. The 15 deduplicated authored permutations retain their representative mappings in the
inventory. Counts of routes through shared representatives must not be summed across definitions
as if they were distinct global routes. Missing explicit target bounds do not prove unbounded
mathematics or incomplete final annotations; targets remain partial competency requests.

The inventory preserves source files and `toTargets()` call lines, standard IDs/descriptions,
definition prefixes, exact authored IDs, normalized representatives, actual range conjunctions,
and matched modules. All source mappings resolve. Recomputing it produces identical CSV bytes:
SHA-256 `9d25f226ec0b32429a17ba9849715a96ddce76f7962943e82768bc8e1cd0d26e`.
The canonical CCSS source-tree hash is
`404c46f9aa2885828e086e21ef5dbfab67e271c448fc6648c561c8c8ab619663`.

## Why target expansion needs generator support

Let `Q` be the nonempty set of relevant mathematical inputs and results, including necessarily
determined hidden answers. Let `M = max(abs(q))`. For a selected catalog upper bound `U`,
with immediately preceding catalog threshold `P`, canonical upper-band generation requires:

```text
every relevant quantity satisfies abs(q) <= U
and at least one relevant quantity satisfies abs(q) > P
```

For the smallest upper threshold, 5, only the upper condition applies. The predecessor comes
from the complete pinned threshold catalog, not from the subset chosen for a standard. Choosing
only the 10 and 100 variants does not make 10 the predecessor of 100: 20 remains its predecessor.

| Upper label | Required maximum magnitude |
| --- | --- |
| `NumbersSmaller5` | `M <= 5` |
| `NumbersSmaller10` | `5 < M <= 10` |
| `NumbersSmaller20` | `10 < M <= 20` |
| `NumbersSmaller100` | `20 < M <= 100` |
| `NumbersSmaller120` | `100 < M <= 120` |
| `NumbersSmaller1000` | `120 < M <= 1000` |

Subsequent catalog upper thresholds are 10,000, 100,000 and 1,000,000. All comparisons remain
inclusive at the declared upper limit. Fractions require exact comparison when later included.

This maximum condition must be separate from the ordinary lower bound on every task quantity.
`30 + 2 = 32` witnesses the highest `<=100` band even though one operand is 2. Changing the
existing `range.min` to 21 would incorrectly remove that exercise and many multiplication tasks.

Current matching admits `Addition + NumbersSmaller100 + SingleDigitLargestOperand` in
`arithmetic-ops-pairs`. Its two operands are at most 9, so its result is at most 18. That complete
configuration cannot witness `M > 20`. If width is optional, retain feasible alternatives; if the
source target explicitly demands the impossible combination under the new policy, record the
competency for review rather than weakening the band or removing it invisibly.

Unit tests currently check equations, operand widths, bounds and related claims. They must gain
explicit strongest-band assertions. Finite-domain enumeration can prove support and exhaustiveness;
seeded samples can reveal counterexamples but cannot establish a universal guarantee.

### Reproduced current-code acceptance examples

All **115 existing tests across nine focused files** pass unchanged during this investigation.
The following deterministic probes establish the missing guarantee independently of those passes:

| Current configuration / task | Reproduced result | New-policy consequence |
| --- | --- | --- |
| Direct positive addition, range 1..10, seed 0 | `3 + 1 = 4` | Truthful `<=10`, but canonical upper is 5 |
| Normal schema resolution for positive nonzero addition with `NumbersSmaller10`, seed 0 | `1 + 3 = 4`, annotated `NumbersSmaller10` | Target expansion alone leaves this ambiguity intact |
| Normal schema resolution with `NumbersSmaller20` and single-digit largest operand, seed 0 | `1 + 1 = 2`, annotated `NumbersSmaller20` | Existing width profiles do not guarantee a canonical upper band |
| Fixed addition table with operands 0..6 | Maximum 12 | `NumbersSmaller20` is configuration-invariant |
| Fixed multiplication table with operands 0..6 | Maximum 36 | `NumbersSmaller100` is configuration-invariant |

The complete positive-addition support within 10 contains 45 ordered pairs: 10 have canonical
upper 5 and 35 have canonical upper 10. Within 20, the existing single-digit profile has 81
pairs split 10/35/36 across upper bands 5/10/20; the two-digit profile has 109 pairs, all in
upper band 20. These are exhaustive support counts for those concrete domains, not proposed
sampling weights. They show where a finite direct sampler can enforce the additional condition.

Probe configuration, resolved labels, values and replay evidence are retained in
`temp/canonical-range-2026-10-31/generator-band-evidence.json` and its accompanying note;
`probe-generator-bands.ts` reproduces them. `existing-generator-tests.log` records the existing
test results. The fixed tables are useful declaration-only controls; they do not prove that
random arithmetic or other consumer projections are ready for the new convention.

## Implementation design

### Target authoring shorthand

Use a small pure helper at the `DatasetPermutationBuilder.applyLabelVariants()` stage, before
`toTargets()`. The reviewed inventory supplies the permitted upper-band sequence or explicit
selection. Preserve other label dimensions and the existing standard/definition prefix. Do not
rewrite already identified targets inside `loadTargets()` or during generator matching.

Resolve duplicate alternatives before target emission, and retain normal definition-distinctness
review. Overlapping target sets do not prove that two source standards are semantically equivalent.
Follow [TSPEC-4 and TSPEC-5](../target-spec.md#tspec-4--build-permutations-programmatically) and
[TSPEC-8](../target-spec.md#tspec-8--definitions-must-be-distinct-exact-semantic-identities-must-be-declared).

The same final label set and prefix retain their target ID. New combinations get new IDs and
their own split allocation. Sampling changes, deduplication and target associations can still
change winning draws or stored output; stable IDs alone are not a preservation proof.

### Configuration and generation

Keep the selected range label and its existing inclusive bound semantics. Resolve an additional
mathematical maximum-band condition before generation. Compatibility checks the entire admitted
configuration: operation, widths, zero/sign claims, fixed steps and any other mathematical limits.
Generators construct valid cases directly where practical, rather than relying on repeated failure
to discover a systematically impossible band.

Pure generators still return only mathematical data. Tests and consumers validate that the
required quantities are actually involved in the task. Do not scan every numeric payload field:
layout indexes, storage denominators and incidental capacities are not automatically task inputs.
Range interpretation must be reviewed independently of the zero-evidence interpretation.

Configuration inference remains restricted by
[SPEC-12](../spec-general.md#spec-12--inferred-annotations-are-a-fallback-without-matching-capabilities).
It cannot tighten a randomly realized range or replace a selected target capability.

### Separate measures of readiness

Report these independently:

1. Source relevance: the standard competency justifies the selected bands.
2. Existing capability matching: each concrete target has a declared generator/view path.
3. Band feasibility and generation: each admitted configuration can and does witness its band.
4. Artifact evidence: Question and Solution each support the task's range interpretation.
5. Dataset acceptance: canonical replay, labels, VQA keys, splits and coverage are current.

Do not count a currently matched path as band-ready merely because its old inclusive bound was
valid. Do not let available implementations choose the source competency's pedagogical scope.

## Checkpoints and validation

The [first source review](canonical-range-pilot.md) proposes a small counting/comparison and
integer-arithmetic cohort. The [complete shared-consumer source review](canonical-range-source-review.md)
extends it to all 27 definitions behind the two pilot producers, plus the four-addend sibling.
Its source recommendations and read-only matching audit do not activate producer contracts or targets.

The seven-definition pilot retains 19 authored permutations and adds 17, giving 36. Read-only
normalization against the entire existing target set gives 1,013 → 1,024 normalized targets and
1,222 → 1,241 routes under today's capability contracts. Four existing normalized targets change
representative IDs through cross-grade overlap, which can change seeds and replay identities.
These counts establish existing declared support; they do not establish canonical-band feasibility.

| Checkpoint | Work | Exit evidence |
| --- | --- | --- |
| R0 — inventory and first review | Capture current targets/routes, source quotations, candidate bands and generator counterexamples | Reconciled inventory, reviewed pilot proposal and explicit open decisions |
| R1 — opt-in expansion helper | Implement deterministic reviewed band expansion before target IDs; add authoring guidance | Unit coverage, unchanged default targets, duplicate/order/constraint/identity tests |
| R2 — pilot generator contracts | Introduce the maximum-band condition and feasibility checks in the selected families | Boundary and finite-support proofs, coherent configs, ordinary target matching, consumer checks |
| R3 — pilot target adoption | Activate reviewed per-competency expansions using the helper | Before/after target and matching inventories, standard ownership, distinctness review and weighting estimates |
| R4 — remaining competency batches | Review and adopt bounded arithmetic/counting first, then task-specific number/measurement/fraction contexts | Per-batch source relevance, feasibility and canonical-bound evidence; deferred cases remain visible |
| R5 — acceptance and classifier handoff | Canonical generation, range-aware support/completeness review, VQA and export checks | Dataset/ontology/policy pins, current coverage, no split leakage, controlled boundary contrasts |

### R1 — reviewed expansion helper (2026-11-01)

Implemented in `d009f763`.

`DatasetPermutationBuilder.applyUpperRangeVariants({ through: 20 })` expands a reviewed sequence
of catalog upper thresholds. `{ bands: [5, 20] }` names reviewed exceptions. The pure
`expandUpperRangeVariants` helper replaces existing upper labels, retains other dimensions,
deduplicates final label sets, and preserves content-derived IDs for unchanged permutations.

The helper rejects unsupported thresholds, widening an existing ceiling, and upper bounds below
an existing informative lower bound. Equal lower/upper endpoints fail explicitly while their policy
is open. It omits only the accepted universal `NumbersLargerZero` floor; sign/zero involvement
claims are retained. Invalid expansion leaves the builder unchanged. Authoring rules are in
[TSPEC-4](../target-spec.md#tspec-4--build-permutations-programmatically).

No production target invokes the helper. A read-only regression comparison verifies exact equality
of all 1,028 authored target IDs/label sets, all 1,013 normalized target IDs/label sets, and all
1,222 matching routes against the inventory baseline. This establishes unchanged target behavior,
not unchanged source-dependency cache identities. Evidence is in
`temp/canonical-range-2026-11-01/r1-regression.json` and its reproducible script.

The helper and builder tests pass all 19 cases. The new helper has 100% statement, branch,
function and line coverage. `npm run check -- --spec=ccss` passes, including unchanged strict
annotation results (zero conflicts/failures; 1,675 report-only range findings). Documentation
references pass with six external-fetch warnings.

The full coverage suite passes **7,480 tests across 907 files** with four workers; the generator
coverage checker also passes (98.36% statements, 97.05% branches, 100% functions, 99.46% lines).
The first sandbox attempt could not rename Vitest temporary files; the unrestricted parallel run
then hit four timeouts and one transient fixture lock. Rerunning with filesystem permission and
`--maxWorkers=4` passes without changing tests or timeouts. Logs are in
`temp/canonical-range-2026-11-01/`. No dataset regeneration or VQA is part of R1.

### R2/R3 — shared-consumer feasibility prerequisite (2026-11-01)

The [consumer review](canonical-range-consumer-review.md) now covers every current route of the
two pilot producers, including consumers outside the original seven-definition pilot:

- `comparison`: 18 routes, 18 admitted selections and 12 unique resolved configurations; every
  selection has a feasible canonical upper witness. Its Grade 1/2/4 consumers also need source-band
  review. Exact endpoint equalities make the existing singleton question concrete.
- `arithmetic-ops-pairs`: 54 normalized targets, 135 routes and 37 unique configurations. Seven
  optional width choices are empty under the upper-witness condition, affecting 60 routes; every
  bounded route retains a feasible alternative. Eight measurement routes have no explicit upper
  bound and require separate source review. The <=5 number-line projection is a local simplification
  candidate, not a proved violation of the established operand/result range definition.

Under this upper-only feasibility check, no currently authored target needs removal just to retain a matching path. This does not yet prove
preservation of all smaller-number examples: activating a shared sampler requires reviewing bands
for all of its source competencies. The review records the relevant quantities, minimal constructive
sampler changes, exact empty-width proofs and complete consumer lists. Neither family needs a new
producer or annotation adapter for the upper-witness construction. Lower-bound and singleton
semantics remain open.

### R2/R3 — source-band and migration review (2026-11-01)

The [completed source review](canonical-range-source-review.md) contains all 25 source-leaf excerpts,
per-definition band choices and separate recommendations for canonical lower bounds and isolated
threshold endpoints. The eight previously unbounded kilogram/liter targets need coordinated adoption
across both existing producers. Their twenty-target integer measurement branch expands to eighty
under the recommended 5/10/20/100 sampling envelope; the standard itself states no numeric ceiling.
The other forty fraction/decimal measurement targets remain unchanged.

The review also identifies two source corrections: exact 10..99 and 100..999 comparison domains,
and two-/three-/four-addend tasks whose operands are two-digit numbers but whose sums may exceed 100.
Secondary array routes join the implementation scope. No new generator split or annotation adapter
is proposed. Strongest-lower profiling requires explicit lower-target variants where requested;
three old equality conjunctions need canonical successors, refining the earlier upper-only result.

A combined in-memory proposal produces **1,252 authored / 1,213 normalized targets**, with
1,434 routes under current declarations. Structural normalization and equivalence checks pass,
but **60 proposed targets are unmatched**: twelve addend cases and 48 measurement cases. All 80 integer
measurement successors need dedicated-producer range support, including 32 with an existing fallback
match. All 1,002 retained authored IDs keep their routes. These are implementation gaps, not source
review failures or evidence of dataset readiness. The counts include correlated lower variants:
the impossible lower 10/upper 1000 two-addend combination is replaced by a lower 20 successor.

This checkpoint changes documentation only. Production targets, sampling, matching, ontology,
dataset and VQA cache remain unchanged. `npm run check:docs` passes, with the same six external-fetch
warnings as the preceding checkpoint. The diff passes whitespace validation; no implementation tests,
regeneration or VQA are needed for this documentation-only review.

### Remaining implementation and acceptance work

R1 is inert until deliberately adopted. R2 and R3 must become operational together for each
reviewed family: explicit target expansion without canonical-band generation does not fix the
training ambiguity. Preserve a reviewable commit sequence and never publish an intermediate
dataset as range-canonical.

A reviewed target subset is not an isolation boundary for a shared generator. Before changing
one producer's sampling contract, inspect every current consumer and admitted configuration of
that producer, including targets outside the first standard review. Scope activation to complete
mathematical families and their compatibility contracts; do not add a target-ID-based pilot switch
inside a generator or silently change unreviewed consumers. The pilot establishes acceptance
examples and an expansion proposal, not permission to skip that wider consumer review.

For implementation checkpoints, run focused helper/generator tests, type/spec/standard checks,
the required full coverage gate and matching/distinctness reports. Include zero, exact thresholds,
values just above thresholds, hidden answers, negative magnitudes, fixed-step operands and
combinations made infeasible by width constraints. A smallest-band task must not acquire a fake
positive lower bound.

Estimate new target permutations, matched routes, allocated draws and per-competency weighting
before regeneration. Actual image/VQA counts follow canonical deduplication and changed keys;
they are not equal to the raw permutation multiplier. Increased meaningful coverage is accepted
and does not itself require another balancing decision.

Keep the historical classifier predictions/gold immutable. Use revised releases as separately
pinned objectives; compare controlled threshold crossings and fresh held-out examples. Prior
inspected examples remain regression evidence. Publishing a dataset or launching paid training
is a later action, not part of this planning checkpoint.

## Approved contracts and remaining rollout

1. Adopt the [strongest positive lower profiles](canonical-range-source-review.md#strongest-lower-bounds),
   selected before generation, with no positive lower when the minimum magnitude is below 5.
   Explicit lower-target requests need correlated refinements under unchanged matching.
2. Adopt the [narrow endpoint exclusion](canonical-range-source-review.md#endpoint-policy): omit
   examples whose relevant absolute magnitudes all equal one positive catalog threshold.
   This replaces the earlier upper-wins recommendation. It preserves source competencies and
   conflict semantics, while explicitly reducing mathematical support at those exact points.
3. Adopt the reviewed source-domain recommendations, particularly exact two-/three-digit comparison
   caps and the Grade 4 measurement envelope. These are disclosed curriculum sampling choices and
   source corrections, not numeric limits inferred from unrelated standard domains.

The user approved all source-review recommendations on 2026-11-01, including the isolated endpoint
exclusion and two-digit addend correction. No ontology conflict suppression or matching implication
extension is introduced. Canonical lower/upper acceptance now depends on implementation and validation.

### Adoption checkpoint 1 — shared mathematical profiles

The shared numeric helper describes inclusive bounds and their strict tightness witnesses, using
finite JSON-safe values for replay. A separate schema helper exposes the 45 feasible correlated
catalog profiles. A partial upper request can select an additional canonical lower; an explicit
lower request is never replaced through implication. The empty optional binding uses `false`,
consistent with the schema's non-null resolution contract. No payload-derived label inference is used.

The target-expansion helper continues to reject equal lower/upper endpoints, now under the approved
exclusion instead of an unresolved-policy error. Unit tests cover threshold boundaries, omitted/weak
lower claims, signed magnitudes, excluded singletons and partial-request capability selection.
Producer and target adoption follows in coordinated checkpoints; this helper alone activates no sampler.
The focused helper checkpoint passes 46 tests across three files. Full repository coverage and
matching validation follow the coordinated family adoption, before dataset regeneration.

### Adoption checkpoint 2 — reviewed source families

The coordinated adoption covers comparison, arithmetic pairs/triples/four-addend sums, property
relations, number arrays, equal-group collections and whole-number measurement word problems.
All use ordinary matching-capable configuration alternatives selected before generation. Constructive
sampling or a finite mathematical domain proves feasibility; generated payloads never supply labels.
Generic matching, the Area allowlist, ontology conflicts and inference behavior are unchanged.

The authored targets implement the approved proposal plus the six definitions identified by the
[shared-producer closure](canonical-range-source-review.md#additional-shared-producer-closure).
This closure preserves smaller examples behind the additional array/triple routes rather than
silently restricting those competencies to their previous largest band. It adds 34 permutations
to the core proposal: **1,286 authored / 1,247 normalized targets**, compared with the pre-adoption
1,028 / 1,013. Structural, duplicate and declared-equivalence checks pass; exact labels agree with
the reviewed proposal and closure.

Specific mathematical and rendering changes are:

- Comparison uses local 10..99 and 100..999 cohorts, while ontology bounds remain inclusive.
  Correlated lower/upper/relation cells remove only the approved threshold-singleton examples.
- Two-, three- and four-addend `2.NBT.B.6` tasks use two-digit addends and allow their larger sums.
  Canonical lower profiles preserve both lower10 and lower20 cases. Pair subtraction/division
  retain both roles for the smaller quantity; negative, zero, width and fixed-step claims remain
  correlated with the chosen mathematical domain.
- Grade 4 integer measurement uses the approved upper5/10/20/100 envelope. All 611 original
  dedicated-producer tuples per unit survive across 31 feasible profiles, including all operand
  widths. The 40 fraction/decimal target permutations, payload sampling and random continuation
  remain unchanged. The eight shared kilogram/liter targets are covered through both producers.
- Equal-group collections preserve all 25 ordered `2..6 × 2..6` pairs and both division meanings.
  Array repeated-addition tasks retain their five-by-five domain; binary addition can use two
  rows with up to 20 columns to witness the requested upper100 band.
- The through5 arithmetic number line uses five integer intervals. Other scales, rooted lengths
  and the existing zero-reference policy retain their behavior. Comparison views accept valid
  inclusive catalog endpoints while the dedicated two-digit view enforces its local 99 maximum.
- Property-law construction ensures a commutative exchange changes visible operands. Required
  associative/distributive calculations may supply range evidence; unused commutative products
  cannot establish a wider upper band.

These changes intentionally alter sampling, target identities and replay/cache keys within the
reviewed cohorts. Exact source ceilings, approved dataset envelopes and deliberately retired
endpoint cases remain distinguished in the source review. No new producer split or adapter is used.

The matching migration has **1,675 routes**, with no unmatched target. All 1,178 old routes whose
exact label sets remain are retained. The other 44 old route obligations have canonical successors
under the same source definition, producer and view. An independent source-association audit
preserves all 1,015 distinct source/nonrange conjunctions; only the reviewed bounds and the explicit
`2.NBT.B.6` two-digit-largest constraint are excluded from that comparison. All 40 noninteger
measurement targets retain their exact IDs.

| Producer | Current routes |
| --- | ---: |
| `comparison` | 49 |
| `arithmetic-ops-pairs` | 347 |
| `arithmetic-ops-triples` | 50 |
| `arithmetic-ops-four` | 24 |
| `arithmetic-property-relations` | 20 |
| `number-array` | 28 |
| `equal-groups-collection` | 12 |
| `measurement-word-problems` | 168 |

With the existing one-instance allocation and deterministic validation split, requested train/val
tuples change from **1,222 / 305** to **1,675 / 430**. That is **1,527 → 2,105 requested pairs**,
or **3,054 → 4,210 images before deduplication** (about 38% more). Actual stored images and VQA
work depend on canonical deduplication, split exclusion and cache identity. The old accepted artifact
contains 2,918 images; the allocation estimate is not a regenerated dataset count.

#### Separate source decision — `1.OA.D.8` unknown-number Ability

Reviewing all 21 newly admitted array routes found three that expose an inherited source-mapping
error. `1.OA.D.8-unknown-number` currently requests `Formalization`, but the standard asks for an
unknown in a supplied equation (`8 + ? = 11`, `5 = □ − 3`, `6 + 6 = □`). The array formalization
view instead asks the learner to write a complete equation from the array. Its labels are truthful;
the target Ability does not express the intended source competency.

History supports a local correction: the original target (`dd8382f5`) and its implementation
(`f5635dfb`) used `ProcedureExecution`. Commit `99dce1547` changed it to `Formalization` while
adding `Equation` during a Grade 1 ontology migration, without specifying a new equation-writing
competency. Recommend restoring **`ProcedureExecution` on exactly the six unknown-number targets**,
retaining `Equation`, operation, bounds and all other claims. The six separate unknown-operand
`ProcedureInversion` targets stay unchanged. Do not introduce a view blacklist or target-ID gate.

The concrete in-memory migration keeps 1,286 authored / 1,247 normalized targets and all target
coverage. Each affected target retains the existing `arithmetic-ops-pairs` routes through
`operations-boxes` and `operations-boxes-inversion`. Only the three newly admitted array-formalization
routes disappear: 1,675 → 1,672 total routes. Six target IDs and their native seeds/replay/cache keys
change; sampler mathematics and view rendering code do not. Existing source targets outside this
six-target set are unchanged. Evidence is `temp/canonical-range-source-review/unknown-number-ability-proposal.json`.

This Ability change is outside the original range approval and the standing preservation of target
conjunctions. The user separately approved the concrete correction on 2026-11-01; its implementation
and verification are recorded in checkpoint 3 below. The adoption counts above deliberately
describe the range checkpoint.

Array cardinality also remains deliberately at its original granularity when the target leaves it
unspecified. The ontology has no five-operand descriptor, so five-row tasks retain their previous
omission of operand-width claims rather than acquiring unsupported count obligations. Explicit
binary profiles carry truthful widths. The unused `IteratedOperation + TwoOperands` combination
is now rejected: it previously forced two rows despite this family's existing repeated-addition
contract requiring at least three addends. No current target route requires that combination.

#### Source verification

The independent cross-family probe enumerates **1,790 admitted selections across 698 affected
routes**. It passes 7,160 planned draws and their exact replays, 958 direct draws, resolved target
coverage and strict annotation validation, with zero failures. This exhausts configuration
selections; the numerical draws use two seeds per Question/Solution mode and are **not** an
exhaustive proof of every numerical outcome. Finite measurement/collection/array support proofs
and constructive sampler boundary tests provide complementary mathematical evidence.

The direct-path checks caught and repaired contextual choices that the planned path already
handled: range-qualified measurement requests now select the integer domain; multiplication
widths remain single-digit where required; explicit array widths select a supported binary
configuration. Unspecified array arity retains the five-by-five domain. Four-addend fallback
metadata advertises only its six feasible cells. No shared resolver, matching algorithm or
validation gate was relaxed to accommodate these fixes.

The shared numeric/label helpers have 100% focused coverage. Dedicated measurement and collection
generation has 100% focused coverage; arithmetic helper/generator coverage exceeds 97% statements
and 96% branches, with 100% lines/functions. Comparison and array profiles include all feasible
direct/planned configurations, finite-support checks, exact boundaries and consumer layout tests.
Reproducible probe reports and logs are under `temp/canonical-range-source-review/`.

`npm run check -- --spec=ccss` passes, including all 517 generator/view modules, source matching,
label usage, documentation, stored split integrity and the strict annotation gate. The latter
checks 2,969 source selections and the existing 2,918 stored images: zero strict failures,
conflicts or incomplete tuples; 1,629 range findings remain report-only. Documentation has the
same six external-fetch warnings. Stored-split and annotation checks do not establish replay or
VQA acceptance for the changed source.

The larger catalogue exposed a shared sorting cost during coverage, not a numerical feasibility
cost. Profiling attributed 7.43 seconds of matching CPU to repeated UTF-8 prefix work. A separate
behavior-preserving checkpoint skips common bytes before radix bucketing; the same measurement
fell to 0.65 seconds. A 3,408-array catalogue workload runs about 6.2 times faster with identical
ordered bytes and aggregate hashes. This is a sorting benchmark, not a claim about whole-pipeline
speed. All 103 focused identity/matching/planned/replay tests pass, with 100% coverage of
`content-identity.ts`. Matching rules, ordering, test timeouts and validation requirements are
unchanged; ordinary source-file fingerprints still reflect the implementation edit.

The final `npm run test:coverage` passes **7,472 tests across 910 files** with four workers, with
no timeout changes. Generator coverage is 98.85% statements, 97.84% branches, 100% functions and
99.46% lines; every generator passes its coverage threshold. Earlier runs exposed the corrected
four-addend fallback declaration and obsolete pre-canonical compatibility expectations, then
catalogue timeouts. The final run uses the settled source and prefix optimization. No regeneration
or VQA was performed for this adoption checkpoint.

Other fraction, decimal, place-value and required-intermediate quantity domains still need family
review before rollout. Range dependency diagnostics remain report-only. Stored dataset acceptance
is separate from this source adoption: regeneration, replay/split checks and independent Question
and Solution VQA must validate a new artifact before it is described as range-canonical.

### Adoption checkpoint 3 — restore unknown-number execution

The approved correction replaces `Formalization` with `ProcedureExecution` in the single
`1.OA.D.8-unknown-number` builder, covering addition/subtraction at upper5/10/20. All other labels
and the separate unknown-operand targets remain unchanged. This follows the source and restores
the Ability used before the earlier ontology migration.

The exact migration audit confirms **1,286 authored / 1,247 normalized targets and 1,672 routes**,
with zero unmatched targets, structural errors or declared-equivalence issues. All six changed
target IDs/label sets and the complete route diff agree with the approved proposal: only the
three array-writing routes disappear; the existing equation-completion routes remain.

The final deterministic allocation is 1,672 train tuples and 431 validation tuples: 2,103 requested
pairs / 4,206 images before deduplication. The changed target IDs alter validation assignment as
well as native seeds. This still is an allocation estimate, not a generated or accepted artifact.
The implementation does not change generator mathematics, view rendering or annotation policy.

Evidence: `source-correction-verification.ts/.json` and `source-correction-planned-probe.log` under
`temp/canonical-range-source-review/`. The range adoption was committed as `4d141bbb`; the shared
profiles and sorting prerequisite are `9bf4dda9` and `34cffab5` respectively.

`npm run check -- --spec=ccss` passes after the correction: 2,964 source selections, zero strict
annotation failures/conflicts/incomplete tuples, and 1,629 report-only range findings. The
eight-family probe now covers 695 routes / 1,785 selections, with 7,140 planned draws and exact
replays plus 952 direct draws, all passing. The preceding 7,472-test coverage run validates the
unchanged generator/library implementations; the target-only correction is verified by the exact
migration, complete source contracts and resolved-draw checks. Regeneration and independent VQA
remain the next artifact acceptance stage, and other numeric families still require range review.

### Remaining-family review and next proposed batch — 2026-11-01

The [current review](canonical-range-remaining-families.md) inventories all 175 active producers
at `d6fd3b94`, traces the proposed families through their actual consumers, and separates missing
range annotations from loose existing bounds. Fresh matching retains **1,286 authored / 1,247
normalized targets, 1,672 routes and 2,964 complete source selections**. The strict annotation
audit passes; its report-only range findings comprise **567 source selections and 1,062 stored
rows**. Neither count measures all canonical-range work still needed.

Recommend three implementation checkpoints, without target edits:

1. Invariant upper100 for `decimal-power-ten-scaling` and `fraction-tenths-equivalence`:
   **10 current selections / 8 routes**. Required mathematical scaling witnesses 100 in every
   exercise; no positive lower applies. The in-memory declaration/matching review preserves
   the complete current route set and ownership contracts.
2. Upper5 through the existing range schema for **35 noninteger measurement-story selections**:
   20 fraction cases and 15 decimal subtraction/multiplication/division cases. Preserve their
   finite mathematical support and the completed integer branch.
3. Upper5/upper10 profiles for the **five remaining decimal-addition story selections**. Preserve
   all three existing sums; only `3.1 + 2.6 = 5.7` requires upper10. Select the profile before
   generation, using ordinary matching-capable declarations.

This covers **50 current source findings, 48 routes and 47 distinct targets**. It is expected
to leave 517 source presence findings and increase complete selections by five, without changing
the target or route counts. These are proposal counts; implementation must verify them. The
measurement rollout must retain integer selection for existing targets without an explicit
number kind: loosening the current range guard alone would admit unintended noninteger choices.
The in-memory measurement experiment retains every route and the selected-label assignments
on all 128 integer routes at both stages. The detailed review records this preservation requirement
and the remaining runtime acceptance checks.

Counting-on/back is the next separate finite-domain candidate: its reviewed upper5 variants add
three targets/routes while retaining the current six. Conversion projections, scalar-zero target
bounds, required column-unit arithmetic and other unsettled cases remain separate. No graph
policy, Area allowlist, ontology meaning, matching implication, target, generator or view changed
in this review; regeneration and VQA were not run.

### R4a — invariant scaling bounds

The approved first checkpoint adds invariant `NumbersSmaller100` to
`decimal-power-ten-scaling` and `fraction-tenths-equivalence`, covering ten source selections
through eight routes and four views. Required powers/denominator scaling witness 100, while a
required value below 5 rules out a positive lower descriptor. Generator mathematics, schema
choices and payloads are unchanged.

Tests cover all 162 coefficient/operation cases and all ten tenths numerators, plus positive
matching with the new bounds. All 14 generator/spec tests and ten existing consumer tests pass.
The preceding complete-catalog experiment preserves all 1,247 targets / 1,672 routes with no
ownership issues. Full runtime/source acceptance for the three checkpoints follows R4c.
Evidence: `temp/canonical-range-next-review/r4a-focused-tests.log` and `r4a-consumer-tests.log`.

### R4b — fixed noninteger measurement bounds

The second checkpoint adds upper5 through the existing range field to all 20 fractional and
15 decimal subtraction/multiplication/division selections. Their 120 unit-specific tuples remain
unchanged. Decimal addition retains its previous unprofiled contract until R4c.

Unspecified number-kind requests now have an explicit integer default in both planner metadata
and direct resolution. This replaces the former integer-only range guard while preserving its
effect on existing consumers. Partial and explicit fraction/decimal requests remain supported.
No mathematical payload, view, target or generic matching contract changes.

All 92 focused tests pass, including exhaustive finite support, canonical bounds, malformed
profiles, direct/planned resolution and one-draw sampling. The before/after runtime probe retains
exactly all 1,286 authored / 1,247 normalized targets and 1,672 routes. All 2,054 recorded integer
config/data/label/random-state comparisons and 32 invariant-family comparisons are unchanged.
It passes 1,688 planned draws and exact replays plus 754 direct draws; complete family selection
counts remain 412. Evidence is under `temp/canonical-range-r4/` (`verification-r4b.json` and
`measurement-tests.log`). Full coverage and final audit follow R4c.

### R4c — decimal-addition profiles and complete batch acceptance

The third checkpoint adds upper5/upper10 choices to the five decimal-addition story routes.
The upper5 pool retains `1.2+1.5=2.7` and `2.3+1.4=3.7`; upper10 retains
`3.1+2.6=5.7`. The schema selects the bound before generation. Sampling uses exact tenths and
one draw within the selected pool, including its singleton. The accepted profile selection changes
the relative frequencies and seeded outcomes of this slice. No balance is imposed.

All branches now require a canonical range, so the module no longer admits an empty range choice
or uses the optional range resolver. The 35 fixed-bound noninteger contexts keep their original
sampling and all 135 unit-specific noninteger tuples remain supported. No new tuple is introduced;
all source target labels/IDs, payloads, rendering implementations and matching semantics remain.

The final audit enumerates **2,969 selections**, with zero strict failures, conflicts or incomplete
tuples. Source range-presence findings decrease **567→517**, closing exactly 50. The 1,062 stored-row
findings remain, since no dataset was regenerated. Range remains report-only and the Area allowlist
is unchanged.

The exact baseline comparison retains **1,286 authored / 1,247 normalized targets and 1,672 route
keys**. Measurement has 417 selections across its 168 existing routes. Across the three producers,
427 selections pass 1,708 planned draws and exact replays plus 764 direct draws, with canonical
witnesses, target coverage and strict annotation checks. All 2,054 recorded integer config/data/
label/random-state outcomes and 32 representative invariant-family outcomes are identical. Numerical
draws supplement the finite-support proof; they do not exhaust the random seed space.

The finite verification retains all 135 noninteger mathematical tuples with zero new/missing cases,
and 9,000 same-seed canonical/one-draw checks pass. Generator tests cover all 172 scaling outcomes
(162 power-ten cases and ten tenths numerators), all 120 fixed-bound story tuples, and all 15
decimal-addition tuples. The 180 focused generator/spec/presentation tests pass, including both
addition profiles in all five units and independent Question/Solution equation presentation.
The 164 integration tests retain all 120 Grade 4 measurement targets and validate all 200 of their
source selections, including the range facet. Synthetic partial requests explicitly test the integer
default; future noninteger requests must declare their number kind. Every current CCSS route is retained.

Evidence under `temp/canonical-range-r4/`: `baseline.json`, `verification-final.json`,
`finite-story-support-final.json`, `measurement-r4c-tests.log` and `audit/audit.json`. R4a is
committed as `7a713e20`; R4b as `d8d4ae69`. Final repository/coverage verification is recorded below.

Final verification passes `npm run check -- --spec=ccss`, TypeScript and documentation checks,
and the complete **7,504-test / 910-file coverage suite**. `VITEST_MAX_WORKERS=2` avoids unrelated
default-concurrency timeouts without changing any test, timeout or coverage threshold. Generator
coverage is 98.85% statements / 97.84% branches / 100% functions / 99.46% lines; every generator
meets its required thresholds. Measurement stories and tenths equivalence each have 100% statement
and branch coverage; decimal power-ten scaling has 93.54% / 93.75%. Logs: `check.log`,
`types-final.log`, `docs-final.log` and `coverage-bounded.log` in the same evidence directory.

The next separate proposal is counting-on/back; its three source additions were reviewed but are
not part of R4. Conversion/projection and quantity-contract work remains in the remaining-family
review. Source completion does not yet establish dataset acceptance; regeneration and VQA remain
at the later acceptance point.

### R5 — counting-on/counting-back canonical ranges

Approved after R4, from `1579c61b` on the same branch. The two Grade 1 counting-strategy
producers now use isolated upper5/10/20 schemas and a finite mathematical sampler. The shared
flexible-strategy schema and `integer-strategy-evidence.ts` retain their previous behavior.
The inherited counting-leaf capabilities above 20 had no current target consumers and are retired
within this reviewed family scope; the broader flexible producer remains available.

For each operation, the complete positive domain partitions into **9 / 15 / 30 ordered problems**
under upper5/10/20. Addition uses a positive starting value plus 1..3; subtraction uses the
corresponding positive minuend, decrement and answer. Every explicit unit step remains in the
payload. Required step operand 1 rules out a positive lower descriptor. Results/minuends at 10
and 20 are included; these are not threshold-singleton tasks because 1 is also involved.

The chosen band is resolved before generation. One uniform draw selects a feasible ordered pair
inside it, without retries or a balancing rule. This changes seeded outcomes and conditional
sampling, as accepted for the range rollout. Existing mathematical cases below 20 remain supported
across the bands, and the previously excluded inclusive upper endpoints become available. No
post-generation annotations, adapters or inferred labels are introduced. Payload shapes, rendering,
Area qualification, ontology bounds and generic matching semantics remain unchanged.

Checkpoint 1 isolates the two generators and verifies all six existing routes before source
expansion. Checkpoint 2 adds upper5 alongside upper10/20 to
`1.OA.C.5-counting-operation-relationship` (addition/subtraction, ConceptDerivation) and
`1.OA.C.6-addition-counting-on` (ProcedureUnderstanding), preserving every existing label set and ID.
All consumers are reviewed: `operations-counting-on-operation-derivation`,
`operations-counting-back-operation-derivation` and the counting-on member of
`operations-add-subtract-strategy-understanding`.

The current-catalog source proposal adds exactly three targets/routes: **1,286→1,289 authored,
1,247→1,250 normalized, 1,672→1,675 routes and 2,969→2,972 complete selections**. The two source
competencies gain 50% more train tuples (4→6 and 2→3), representing meaningful finer bands. Native
allocation adds three train tuples and one validation tuple: **2,107 requested pairs / 4,214 images
before deduplication**, up from 2,103 / 4,206. These are allocation estimates, not generated artifacts.

This batch repairs loose existing bounds and adds reviewed coverage; it does not close missing
range-presence findings. The 517 source findings and 1,062 stored-row findings remain separate.
Evidence and acceptance results are recorded under `temp/canonical-range-counting/`.

#### R5 checkpoint 1 — isolated canonical sampling

All **93 focused tests / seven files** and TypeScript validation pass. Independent projection
tests exercise all 324 producer/view/mode combinations across the complete support. The runtime
probe preserves exactly all 1,286 authored / 1,247 normalized targets and 1,672 routes before
expansion. Every non-adopted generation plan hash is unchanged, and all 76 flexible-strategy
control records retain their configurations, values, labels, view state and PRNG continuation.
All six current counting routes pass 24 planned draws with exact replays and 24 direct draws,
checking canonical witnesses, target coverage and strict annotations. Broader controls pass
40 planned/replay and 36 direct draws. Numerical draws supplement the exhaustive finite tests;
they do not exhaust seed space. Logs: `implementation-focused.log`, `implementation-types.log`,
`projection-tests.log` and `verification-checkpoint1.json`.

#### R5 checkpoint 2 — source bands and acceptance

The two reviewed builders now use `applyUpperRangeVariants({ bands: [5, 10, 20] })`.
The exact source audit confirms **1,289 authored / 1,250 normalized targets, 1,675 routes and
2,972 selections**. Exactly the three approved upper5 targets/routes are added; every earlier
authored and normalized target ID/label set and every existing route remain. No target is unmatched.
The source standards gate passes. Native allocation is 1,675 train and 432 validation tuples;
only the new understanding variant acquires the additional validation allocation.

All **1,666 non-adopted generation plans** remain identical to the `1579c61b` baseline, as do
all 76 flexible-strategy runtime controls. The nine counting routes/selections pass 36 planned
draws and exact replays plus 36 direct draws, checking canonical ranges, target coverage and strict
annotations. Exhaustive tests prove all 108 operation-specific mathematical problems across
the three bands; the three views preserve their required unit-step evidence in all 324 static
Question/Solution projections. These are source and rendering-contract checks, not canonical
dataset screenshots or VQA acceptance.

The sampler checkpoint is `c47fc0b2`. Evidence: `source-verification.json`,
`source-standards-check.log`, `verification-final.json` and `consumer-review.md` in
`temp/canonical-range-counting/`. Final repository and coverage gates are recorded below.

Final acceptance passes `npm run check -- --spec=ccss`, TypeScript, documentation references and
the complete **7,533-test / 912-file coverage suite** with `VITEST_MAX_WORKERS=2`. No test, timeout
or threshold is relaxed. Both counting generators have 100% statement and branch coverage; all
generator thresholds pass. Overall generator coverage is 98.84% statements / 97.84% branches /
100% functions / 99.46% lines. Logs: `check-final.log`, `types-final.log`, `docs-final.log` and
`coverage-final.log` in the evidence directory.

The strict annotation audit enumerates all 2,972 source selections with zero conflicts, incomplete
tuples or strict failures. Its 1,579 report-only range findings remain 517 source omissions plus
1,062 stored rows. At that checkpoint, generation/VQA and refreshed-artifact acceptance were
pending and the stored dataset was unchanged. The then-unimplemented finite-domain candidates
and projection/quantity decisions were in the [remaining-family review](canonical-range-remaining-families.md);
subsequent implementation and artifact acceptance are recorded above.

### Subsequent autonomous checkpoints

The [autonomous rollout ledger](canonical-range-autonomous-rollout.md) records the completed
entry-document cleanup and six subsequent source batches. They close418 baseline range-presence
omissions:517→99. At that checkpoint, the source has1,528 normalized targets,2,000 routes and4,602 complete
selections. Every earlier route lineage remains, with45 raw /27 normalized IDs migrating through
the recorded source corrections. Ordinary profile/local-repair work is complete; the then-remaining
13 contract/policy topics include two already-labelled precision reviews. Source gates and the
complete7,705-test /1,009-file coverage suite pass; all generator thresholds hold. The stored
dataset and VQA cache remain unchanged, and range validation remains report-only.
