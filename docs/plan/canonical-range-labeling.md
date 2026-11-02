# Canonical range labels and reviewed target expansion

Started 2026-10-31 on `codex/label-dependency-audit`, from
`031fb4b3a76068ab4f3e7478d9c05497b7ffab80`, using stable ontology `0.33.0`.

Status: the target-expansion helper, first eight-family adoption, R4/R5 and six implemented
[autonomous batches](canonical-range-autonomous-rollout.md) pass their repository and full-suite
checks. These batches preserve
earlier competency/route lineages while adding reviewed source variants and applying the
authorized integer-domain and fixed-bound source corrections. The accepted source covers
**1,528 normalized targets /2,000 routes and4,602 complete selections**, with **99 range-presence
omissions** remaining. The
[remaining-family review](canonical-range-remaining-families.md#sixth-batch-final-review-and-decision-boundaries)
records13 concrete contract/policy questions, including two already-labelled precision topics.
Ordinary profiles and the source-backed local repairs are complete. The original inventory remains historical.
Stored annotations have not been regenerated for these range changes, and the range gate remains
report-only. Source readiness and dataset acceptance remain separate gates.

This is a new initiative following the completed
[local dependency work](label-dependency-graph.md) and
[stable ontology adoption](../history/ontology-v032-adoption.md#stable-v0330-adoption-2026-10-30).
Earlier range exclusions describe that initiative's scope; they are not approval to silently
change the current validator. The existing Area allowlist, algebra sign/zero cutoff and
independent Question/Solution evaluation remain unchanged.

## Accepted direction

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
1,062 stored rows. Generation/VQA and acceptance of refreshed artifacts remain pending; the stored
dataset is unchanged. The next unimplemented finite-domain candidates and the separate projection/
quantity decisions remain in the [remaining-family review](canonical-range-remaining-families.md).

### Subsequent autonomous checkpoints

The [autonomous rollout ledger](canonical-range-autonomous-rollout.md) records the completed
entry-document cleanup and six subsequent source batches. They close418 baseline range-presence
omissions:517→99. The current source has1,528 normalized targets,2,000 routes and4,602 complete
selections. Every earlier route lineage remains, with45 raw /27 normalized IDs migrating through
the recorded source corrections. Ordinary profile/local-repair work is complete; the remaining
13 contract/policy topics include two already-labelled precision reviews. Source gates and the
complete7,705-test /1,009-file coverage suite pass; all generator thresholds hold. The stored
dataset and VQA cache remain unchanged, and range validation remains report-only.
