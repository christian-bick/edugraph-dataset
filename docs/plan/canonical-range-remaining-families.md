# Remaining numeric families and next range batch

Read-only production review on 2026-11-01 at `d6fd3b94`, ontology `0.33.0`, on
`codex/label-dependency-audit`. This extends the [range plan](canonical-range-labeling.md),
not the earlier historical inventory. The R4a–R4c proposal below was subsequently approved and
implemented; its [acceptance record](canonical-range-labeling.md#r4c--decimal-addition-profiles-and-complete-batch-acceptance)
supersedes the review-baseline counts. Current source range-presence findings are 517, with all
1,247 normalized targets / 1,672 routes retained and 2,969 complete source selections.

## Review baseline

Fresh catalog matching finds **1,286 authored / 1,247 normalized targets, 1,672 routes,
175 active producers, 336 active views and 354 matched producer/view pairs**. All 2,964 source
selections enumerate completely; no target is unmatched. The strict annotation audit passes
with no conflicts or incomplete tuples. Range remains report-only:

- **567 source selections across 64 producers** lack a range annotation under the existing
  Area qualification.
- **1,062 stored-row findings** belong to the unchanged 2,918-image dataset. They cannot be
  closed by editing source declarations alone.
- **43 active producers emit some range annotations**, including the eight already adopted
  families. The other 35 still need canonical-bound review; label presence does not prove a
  tight bound. The measurement-story adoption remains partial for its noninteger branch.

These measures overlap and are not additive. Likewise, 132 producers with no selected range
annotation are not 132 defects: many are qualitative or outside the Area allowlist. The review
triages the complete active catalog and examines the next candidates' mathematical support and
all current consumers in detail. It does not claim exhaustive numerical proof for every later family.

Preserve inclusive absolute-magnitude bounds, the strongest positive lower descriptor, omission
of `NumbersLargerZero`, and the narrow threshold-singleton exclusion. Include required operands,
results and mathematical intermediates. Ordinary notation digits and storage encodings are not
additional quantities; explicitly assessed scaling/counting arithmetic is. See the
[clarified interpretation](numeric-range-bounds.md#clarified-meaning) and
[approved decisions](canonical-range-source-review.md#approved-decisions).

Matching remains equality/specialization. No range-containment implication, graph completion,
payload annotation adapter or new `inferredLabels` is proposed. The Area allowlist, structural
algebra sign/zero cutoff and separate representation-completeness work stay unchanged.

## Recommended next batch: complete settled finite domains

Use three checkpoints. All **47 affected normalized targets and 48 routes** already exist;
their source labels and IDs can remain unchanged. Implementation would close **50 current source
presence findings** and must preserve all supported mathematical cases in this batch.

| Checkpoint | Producer / slice | Current routes | Current selections | Canonical declarations |
| --- | --- | ---: | ---: | --- |
| R4a | `decimal-power-ten-scaling` | 2 | 2 | Invariant upper100, no positive lower |
| R4a | `fraction-tenths-equivalence` | 6 | 8 | Invariant upper100, no positive lower |
| R4b | `measurement-word-problems`: all fractions and decimal subtraction/multiplication/division | 35 | 35 | Upper5 in the existing range schema, no positive lower |
| R4c | Same producer: decimal addition | 5 | 5 | Preselected upper5 or upper10, no positive lower |
| Total | Three producers, including one partially adopted producer | **48** | **50** | **55 proposed selections** |

### R4a: two invariant declarations

`decimal-power-ten-scaling` has two `5.NBT.A.2` targets and one consumer,
`numbers-power-ten-decimal-pattern-explanation`. Its task explicitly assesses factors/powers 1, 10 and
100. Decimal before/after values stay below 100, and a required value is below 5. Thus 100 is
both an upper bound and a required witness above 20. This holds across all 162 supported
coefficient/operation combinations. Add `NumbersSmaller100` to the generator's invariant labels.

`fraction-tenths-equivalence` has five distinct targets and six routes across
`3.NF.A.3b`, `4.NF.A.1` and `4.NF.C.5`. Its consumers are
`fractions-equivalence-explanation-model`, `numbers-fraction-line-explanation` and
`fractions-equivalence-completion-model`. All preserve the required denominator-scaling relation
`10 × 10 = 100`, as well as the corresponding numerator scaling. This is an assessed operation,
not a rule counting every displayed denominator as a separate magnitude. All ten supported
tenths numerators yield a required maximum 100 and a minimum below 5. Add the same invariant bound.

An in-memory catalog experiment with both declarations retains **exactly all 1,672 routes**,
with no added/lost routes, unmatched targets or ownership issues. Neither producer needs a new
schema choice, sampler, payload or rendering change. Existing same-seed mathematics can remain
identical; annotations and their artifact/cache identities will change.

### R4b/R4c: finish the noninteger measurement stories

All 40 routes are the existing five-unit `4.MD.A.2` variants, consumed only by
`measurement-word-problem-grade4`. Required quantities are the rational measured operands,
explicit group count where present, and the answer. The view retains those values in its story
and equation; it adds no conversion or optional model. A stored dollar value `120/100` denotes
`$1.20`, not an operand 120.

| Mathematical slice | Authored tuples per unit | Required maximum | Profile |
| --- | ---: | --- | --- |
| Fraction addition/subtraction/multiplication/division | 4 / 4 / 3 / 4 | At most 3, including integer group counts | upper5 |
| Decimal subtraction | 3 | At most 4.7 | upper5 |
| Decimal multiplication/division | 3 / 3 | At most 4.4, including group counts | upper5 |
| Decimal addition | 3 | 2.7, 3.7 or 5.7 | upper5 / upper10 |

The complete finite domain has **135 unit-specific tuples**: 130 fit upper5 and five fit
upper10. Every tuple has a required quantity below 5, so none admits a positive lower label.
None is an excluded threshold-singleton case. The proof exercises every authored pool index
through the current generator and checks its one-draw continuation; it is supported by inspection
of the complete finite pools, not a claim inferred from a handful of random seeds.

Use the existing range field and correlated compatibility. An invariant on the whole generator
would be false of its integer branch. R4b retains its 120 unit-specific tuples and their existing
within-pool sampling; R4c partitions the remaining 15 tuples before generation. No balancing
requirement is introduced. Ordinary profile selection may change the relative frequencies of
the three decimal sums and native seeded outcomes; this is within the accepted range-profile
sampling direction. Rendering for identical mathematical values stays unchanged.

**Shared-consumer preservation:** inspect all **168 family routes / 412 current selections**,
not only the 40 explicitly noninteger targets. The completed integer branch accounts for
128 routes / 372 selections. Forty-eight current family targets omit an explicit number kind;
the current integer-only range guard keeps their plans integer. Simply removing that guard
would broaden their supported annotations and mathematics. Retain that existing fallback through
an explicit schema-level integer default when number kind is unspecified, using existing resolver
metadata rather than target IDs. Explicit fraction/decimal requests must still resolve normally.
Verify exact old integer choices, resolved configurations and random continuation during adoption.

The in-memory schema/compatibility experiment verifies both checkpoints against the complete
catalog: no added/lost routes or unmatched targets; selected-label assignments on all 128 integer
routes remain identical. R4b leaves 412 family selections, and R4c increases them to 417. This
proves the proposed matching/declaration partition; direct resolution and the implemented sampler
still need the runtime acceptance checks below.

The intended complete outcome is **1,247 targets / 1,672 routes**, 2,969 source selections,
and **517 remaining source range-presence findings**. The new range choices add five selections
inside existing routes; no source permutation expansion is needed. These measurement preservation
counts are implementation acceptance requirements, not a claim that future sampler code is verified.

## Remaining queue after this batch

The source findings by owning directory are below, before and after R4. Counts refer to missing facets only;
families with old bounds still require canonical review. They are not implementation-batch counts.

| Family group | Review baseline | After R4 | Next treatment |
| --- | ---: | ---: | --- |
| Arithmetic | 90 | 90 | Finite strategies first, then known facts/patterns/word problems; method-specific intermediates before written algorithms |
| Counting and integer writing | 0 | 0 | Tighten existing bounds; review source variants and scalar-zero cases rather than treating presence as completion |
| Fraction | 204 | 196 | Separate fraction-value tasks from explicit equivalence/model-count operations |
| Number (decimal/rational/length) | 47 | 47 | Ordinary decimal values, comparisons and signed quantities; preserve each view's assessed relation |
| Place value | 11 | 9 | Existing integer bounds additionally need coefficient/method and source review |
| Measurement | 137 | 97 | Conversion and number-line contracts next |
| Currency | 18 | 18 | Trace cents, dollars, required conversion and group counts across the actual task |
| Time, elapsed time and interval arithmetic | 26 | 26 | Bound assessed clock components/calculations, not timestamp storage |
| Ratio | 10 | 10 | Include required ratio operands, conversion factors and results; finite profiles |
| Algebra | 24 | 24 | Formal numeric expressions remain range-report eligible in some projections; keep them separate from the agreed sign/zero cutoff |
| **Total** | **567** | **517** | No change to applicability policy |

Geometry, coordinate, shape and statistics tasks do not become mandatory range work merely
because their payloads contain numbers. Preserve the full resolved Area gate. Existing range
claims outside that gate still need to be truthful; the gate is not an exemption from label validity.

### Ready for a separate finite-domain batch

- **Counting on/back:** two generators, three views, six current routes. Add reviewed upper5
  variants alongside upper10/20 in `1.OA.C.5-counting-operation-relationship` and
  `1.OA.C.6-addition-counting-on`. A current-catalog experiment adds exactly three targets/routes:
  **1,250 targets / 1,675 routes**, retaining all existing routes. Complete feasible positive
  supports are 9 / 15 / 30 ordered problems per operation in bands5/10/20. Required unit steps
  rule out a positive lower. Seed0 currently produces `1+1=2` or `2−1=1` under upper10 and20,
  demonstrating why current passing tests do not prove tightness. Fix the two leaf samplers'
  exclusive `max−1` handling and profile them without changing the shared flexible-strategy
  schema. Existing payloads and all three views can remain.
- **Time interval arithmetic:** four targets/routes. The question explicitly requires minutes
  after the reference-hour origin; the endpoint is 65–90 and origin is zero. Upper100/no lower
  is a small invariant candidate, separate from ordinary clock-reading tasks.
- **Decomposition, flexible add/subtract strategies and known facts:** finite supports can use
  ordinary profiles. Include each required rewrite/intermediate. Make-ten cannot be expanded
  into a band excluding its required bridge10. Review all shared consumers before activation.
- **Length differences, unit-scale relations and bidirectional conversions:** finite profiles
  are suitable. Include actual conversion operands/results in their named units, not raw storage
  hundredths. Review the full source list before proposing particular target bands.

These are subsequent proposals, not automatic extensions of R4a–R4c.

### Concrete complications to keep separate

| Cases | Why a blanket range patch would fail | Recommended resolution |
| --- | --- | --- |
| Scalar writing, basic counting and rooted lengths | Scalar zero still matches upper20 requests, although its tightest upper is5. Scalar threshold5/10/20 cases meet the accepted singleton exclusion; a rooted length also contains origin0 and does not. Count-out tasks additionally assess the available collection. | Review source bands and all consumers; do not change the zero competency to manufacture a larger witness. Respect the [count-out input contract](count-out-supply.md#contract-and-implementation). |
| Counting sequences and fixed offsets | Sequence terms differ from an explicit offset operand. A +10 operation must include10 in its lower bound; a sequence's implicit step is not automatically another operand. | Preserve the [established distinction](numeric-range-bounds.md#baseline-implementation-and-reproduced-evidence); use separate profiles and include negative/zero policies already adopted. |
| Integer/decimal place-value methods and written columns | Ordinary notation coefficients are excluded, but a method can explicitly assess unit counts and their arithmetic. Some targets still require lower100/1000. | Resolve the concrete method's quantity set and source intent before changing those explicit lower targets. Do not silently weaken matching or reinterpret every digit as an operand. |
| Measurement-unit equivalences | Two views use only the first equivalence; the table uses five. At a start of7km, the single relation ends at7000m while the table reaches11000m. A payload-wide upper100000 is loose for the first projection. | Establish a consistent mathematical relation per consumer using existing contract options; seek confirmation for any necessary producer split. No hidden fifth-row witness. |
| Rational opposite relations | Line and double-opposite tasks share a payload, but the latter omits the axis. | Assess the projected mathematical task; unused axis extents cannot establish its tightest bound. |
| Fraction/measurement number lines | Axis positions may lie in0..1 while the task explicitly counts more than5 intervals. | Trace whether that count is an assessed mathematical quantity, not just representational subdivision. Keep the approved bound interpretation; document a decision only where the source task does not settle it. |
| Operation tables | Full fixed0..6 tables give addition max12 and multiplication max36, but the prompt emphasizes one row. | Preserve the prior full-table interpretation explicitly, or settle the focused-row contract before adding fixed upper20/100. Do not count an irrelevant cell merely to witness a larger bound. |
| Currency and clocks | `75¢+75¢=$1.50` assesses mixed units; clock components are not seconds since midnight. | Review the required arithmetic/conversion, preserving the explicitly supported cents/dollars competency. Do not normalize all labels from one storage unit. |
| Structural algebra / formal expressions | Formal membership does not make every hidden evaluation relevant. Range qualification currently differs from sign/zero qualification. | Separate review under the unchanged graph; no implicit policy retirement or invented variable bounds in this batch. |

These are rollout observations, not blanket old-contract violations. An existing loose inclusive
bound can have been valid before canonical adoption. Future changes must preserve the matched
claim and its witnesses (SPEC-G3, IMPL-G4, IMPL-V11), and may not stretch source labels to force
coverage (TSPEC-6, TSPEC-13).

## Validation and acceptance

Review evidence under `temp/canonical-range-next-review/` includes the fresh catalog/route
inventory, strict audit, arithmetic source experiment, invariant-declaration matching/ownership
experiment, staged measurement matching experiment and finite measurement-story proof. The spec audit passes. Focused existing tests
pass: arithmetic 89 tests / 12 files; measurement/currency/time 206 / 16; decimal/fraction
invariants 15 / 7. These validate the baseline, not unimplemented canonical guarantees.

Implementation acceptance for R4a–R4c:

1. Check every finite mathematical outcome against the selected canonical upper/lower and
   endpoint rule. Trace all listed consumer projections; include hidden required answers and
   explicit scaling/group quantities, excluding storage encodings and irrelevant payload data.
2. Exercise both direct and planned configuration resolution, explicit/unspecified number kind,
   all admitted selections, invalid choices, and exact replay. Preserve all 135 story tuples
   and unchanged integer configurations; no post-generation label derivation.
3. Compare exact targets and complete routes to this baseline, not only their counts. R4a–R4c
   must retain every old route and source claim, with no added routes or unintended integer-plan
   changes. Verify expected selection/finding deltas without calling sampled checks exhaustive.
4. Run focused tests, types, spec/standard checks and required full coverage. Commit each coherent
   checkpoint and update source-readiness accounting. Verify equal-value rendering and report
   artifact/cache identity consequences before the separately authorized artifact stage.
5. Regenerate and run independent Question/Solution VQA only at the later agreed acceptance
   point. Allocation is still 2,103 requested pairs / 4,206 images before deduplication if routes
   and target IDs remain unchanged; exact changed-image/cache work cannot be inferred from the
   50-selection count. Stored-row findings remain unchanged until regeneration.

Do not declare all range work closed after this batch or promote the range gate to strict.
