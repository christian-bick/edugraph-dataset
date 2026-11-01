# Canonical range labels and reviewed target expansion

Started 2026-10-31 on `codex/label-dependency-audit`, from
`031fb4b3a76068ab4f3e7478d9c05497b7ffab80`, using stable ontology `0.33.0`.

Status: R1 implements the opt-in target-expansion helper; the shared-generator feasibility and
[source-band reviews](canonical-range-source-review.md) are complete, including the eight
measurement targets. All recommendations were approved on 2026-11-01; R2/R3 producer and target
adoption is in progress. Source readiness and dataset acceptance remain separate gates.
The inventory and first competency review remain the rollout baseline. No production
target adopts the helper yet; sampling, stored annotations and the report-only range gate remain
unchanged.

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

Remaining fraction, measurement, place-value and required-intermediate quantity domains need family review
before rollout. Preserve the source's actual competency rather than treating rendered digits,
optional methods or every hidden payload value as part of the range.
