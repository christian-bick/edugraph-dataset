# Autonomous canonical range rollout

Started from `16f09717` after the user's instruction to continue the backlog wherever the agreed
solutions apply. The [range policy](canonical-range-labeling.md#accepted-direction) and
[remaining-family review](canonical-range-remaining-families.md) remain the basis for this work.
Module-specific changes and acceptance records stay in plans and module tests, rather than
README.md or DOCS.md. Their cleanup is committed as `138e1478`.

The authoritative R5 baseline is **1,289 authored / 1,250 normalized targets, 1,675 matching
routes and 2,972 selections**.
Source range-presence findings are 517; stored-row findings are 1,062. Neither count includes all
loose existing bounds. Generation and VQA remain a later acceptance stage.

Implementation continues through invariants, existing schema bundles and finite correlated
profiles. Unchanged target claims/routes remain supported. Reviewed smaller source bands can be
added without changing earlier IDs. The user's subsequent instruction also authorizes correcting
evidently underspecified source targets, with exact old/new ID and route-lineage verification.
Prefer that source correction over a module participation guard compensating for a missing true
numeric-domain claim. This does not replace legitimate task/representation preconditions.
Cases needing an unresolved quantity interpretation, a new
source envelope, a split or an unsettled change to an existing target claim are recorded separately while
other supported work continues. No graph-policy, generic-matching or Area-allowlist change is
part of this rollout, and no annotation-inference mechanism is added. A fallback can be replaced
by ordinary declarations when the new configuration profiles prove its claim before generation.

## Settled fractional values and elapsed-time arithmetic

- `decimal-notation`, `decimal-comparison`, `fraction-comparison` and
  `fraction-benchmark-arithmetic` gain invariant upper5, with no positive lower. Their required
  rational values, benchmark bounds and arithmetic results fit the smallest catalog band.
  Ordinary notation components are not treated as independent operands. All four generator
  bodies, mathematical support and random draws remain unchanged. All 19 existing routes are
  retained across nine view leaves.
- `time-interval-arithmetic` gains invariant upper100 with no positive lower. Both question and
  solution require offsets from the reference-hour origin: the end offset is 65..90, while the
  origin is zero. Its four existing routes/selections and generator body are unchanged.

Tests exercise the complete finite notation/comparison/benchmark supports, including 99 notation
representations and 1,638 decimal-comparison pairs. The fractional checkpoint passes 54 tests
across nine files. Time tests cover all 9,360 clock-component/operation outcomes; its seven focused
tests pass. Exact owned route comparisons pass, and current targets remain covered. These five
families close 23 baseline source presence findings; the final global audit will verify the total
after the remaining checkpoints.

Evidence: `temp/range-autonomous/fraction-decimal/` (`invariant-tests.log`, `baseline.json`,
`current.json`, `types.log`) and `temp/range-autonomous/measurement-time/` (`first-focused.log`,
`route-verification.json`, `types-first.log`). Full repository and coverage acceptance follows the
completed autonomous run.

## Length-difference profiles

`measurement-length-difference` now selects one of five canonical range profiles before drawing:
lower/upper `(0,10)`, `(5,10)`, `(0,20)`, `(5,20)` and `(5,100)`, containing respectively
9, 1, 24, 44 and 10 tuples. These disjoint cells preserve all 88 original shorter/difference/longer
triples. All three quantities are required by the sole `measure-length-difference` projection;
no payload or view change is needed. The one existing target/route remains, with five admitted
selections replacing one unbounded selection. This family had no baseline numeric dependency
assessment. Adding a numeric range activates the number-kind/sign/zero obligations; invariant
positive-integer declarations now satisfy all three for every profile. No new operand-width
obligation is triggered, and no baseline range-presence closure is claimed for this family.

The time and length-difference focused gate passes 11 tests across four files, including complete
finite support and canonical witnesses. Exact owned route comparison and TypeScript pass.
Evidence: `temp/range-autonomous/measurement-time/route-verification.json`, `first-focused.log`
and `types-first.log`. The invariant checkpoint is `4e556963`.
The additive declarations pass all five profile evaluations with no missing facets, errors or
conflicts; the generator/view ownership audit and five focused tests pass. Evidence:
`length-additive-fix.log` and `length-ownership-check.log` in the same directory.

## Decomposition and make-ten profiles

`arithmetic-decompose` now has upper5/upper10 profiles over the complete original totals3..10,
including every pair/orientation. Required decompositions guarantee a quantity below5, so no
positive lower applies. The sole existing upper10 route remains; a source-reviewed upper5
variant is added to `K.OA.A.3` without changing any earlier target ID or labels. Dormant upper
capabilities above10 are retired within this reviewed source family.

`place-value-make-ten` retains all 11 original complements. Upper10 is fixed; positive complements
other than5+5 use no positive lower, while5+5 uses lower5. Zero-bearing complements keep no lower.
Compatibility and runtime guards reject zero plus a positive lower. All three profiles use one
mathematical draw, including the singleton. No view or payload changes are required.

All 15 focused tests across four files pass. Exact owned matching preserves both earlier routes
and adds only the reviewed decomposition route; three total routes admit four selections. Sixteen
planned draws and exact replays plus seven direct draws pass canonical witnesses, target coverage
and strict annotation checks. This repairs loose bounds and adds coverage, rather than closing
range-presence omissions. Evidence: `temp/range-autonomous/arithmetic/first-review.md`,
`verify-first.json` and `first-focused.log`.

## Power notation and whole-number scaling

Whole-number power-ten scaling gains invariant upper10000: every original11..99 is explicitly
multiplied by100, producing1100..9900. Required factor1 or zero establishes no positive lower.
The generator body and mathematical support remain unchanged; tests cover all81 originals.

Power notation now preselects one exponent profile: zero/upper10→0, nonzero/upper10→1 and
nonzero/upper100→2. All three previous mathematical cases remain, with one draw per case. The
local configuration replaces the Boolean zero selector with the actual exponent; payloads and
views stay unchanged. Given `100` and given `10 × 10` both denote the input number being converted
to power notation. The bound includes that represented input, base10 and exponent, without
including unrelated hidden intermediate calculations.

Both old target/route claims remain exact; two old notation selections become three, giving four
selections across two routes. Sixteen focused tests pass, including all12 question/solution
representation combinations. Twenty-four planned draws/replays pass canonical witnesses, strict
annotations and target coverage. Three baseline presence findings close. Evidence:
`temp/range-autonomous/arithmetic/power-review.md`, `power-tests.log` and `verify-powers.json`.

## Fraction number-line counts

`fraction-number-line` retains all36 original numerator/denominator cases and all four routes.
The question explicitly requires partition and iteration counts, so the range bounds those
counts as well as rational positions and the required zero origin. Upper5/10/20 profiles have no
positive lower. Six previous selections become14 feasible kind/range selections. The generator
now receives mathematical kind values rather than interpreting label IDs; payloads and rendering
remain unchanged. Thirteen focused tests pass, including consumer projection and finite support.
This closes six baseline presence findings. Evidence:
`temp/range-autonomous/fraction-decimal/line-tests.log`, `line-current.log` and `types-line.log`.

## Bounded rational axes

`rational-magnitude-relations` and `rational-order-relations` gain invariant upper5. Every assessed
value and generated axis lies within this smallest band, and the required zero reference excludes
a positive lower. The claim does not rely on an unprojected larger axis. Both generator bodies,
sampling and the three existing routes remain unchanged. Twenty focused tests pass, including all
128 scale/location/sign outcomes and976 strict ordered pairs/directions. Four baseline presence
findings close. Evidence: `temp/range-autonomous/fraction-decimal/axis-tests.log` and the finite
regression `src/generators/number/canonical-axis-ranges.it.test.ts`.

## Bidirectional measurement conversions

`measurement-conversion-values` partitions all 39,242 original ordered-distinct equality pairs
into26 feasible unit/kind/range cells. The sole bidirectional view requires both equalities and
the given one-large-unit conversion relation. Its explicit1 rules out a positive lower; all four
numeric input/output quantities and the conversion factor determine the upper witness. Shared
helpers expose the same existing candidate arrays without changing other samplers.

All21 earlier routes remain exact, with28 previous selections becoming52. Forty-seven focused
tests across four files pass, including the complete finite pools, all26 direct/planned cells,
invalid profiles and one-draw sampling. Payloads, views and source targets are unchanged; range
profile selection changes conditional sampling. This closes28 baseline source-presence findings.
Evidence: `temp/range-autonomous/measurement-time/conversion-focused.log`,
`conversion-types.log` and `route-verification.json`.

## Conversion stories

`measurement-conversion-problems` now preselects canonical range profiles over all 16,310 original
mathematical stories. Required quantities include the one-unit relation, conversion factor,
source and converted amounts, added quantity and final total. The given1 excludes a positive
lower. All14 previous routes remain; their14 selections become28. Payloads and rendering remain
unchanged. Sixty-nine focused tests across four files and TypeScript pass, covering the complete
finite support and planned profile choices. Fourteen baseline source-presence findings close.

The added range capability initially admitted a generic Grade 2 addition-only target. That source
does not ask for the multiplication/division and unit-conversion knowledge required by this task.
The existing positive target-precondition mechanism resolves the mismatch: the view now requires
`Area.UnitConversion`, supported by both existing scaling specializations. All14 conversion targets
remain matched. A regression proves that removing only this precondition re-admits the unrelated
Grade 2 target. No target-ID filter, negative blacklist or global matching change is introduced.

Evidence: `temp/range-autonomous/measurement-time/checkpoint-report.md`, `story-focused.log`,
`story-types.log` and `route-verification.json`. The final combined matching audit preserves every
old target ID/label set and route, adding only the reviewed decomposition upper5 target/route:
**1,290 authored / 1,251 normalized targets, 1,676 routes and 3,025 complete selections**.
There are no unmatched targets or incomplete selections. Validation allocation remains432 tuples.

## First autonomous batch acceptance

The combined batch updates15 families and closes **78 baseline source range omissions:
517→439**. The length-difference activation is accounted separately: its newly required positive
integer annotations are complete, with no newly unresolved dependencies. The final audit has
only range-presence findings:439 source and1,062 unchanged stored rows, with zero conflicts,
invalid contexts, incomplete selections or strict failures.

All **7,576 tests /914 files** pass through the complete coverage gate using two workers, with no
test, timeout or threshold relaxed. Generator coverage is98.86% statements /97.87% branches /
100% functions /99.48% lines, and every generator meets its required thresholds. Repository,
TypeScript and documentation gates pass. Exact global matching preserves every earlier target
ID/label set and route, adding only the reviewed decomposition target/route. Allocation is now
1,676 train+432validation tuples:2,108 requested pairs /4,216 images before deduplication.

Evidence under `temp/range-autonomous/`: `global-verification.json`, `check-batch1.log`,
`types-batch1.log`, `docs-batch1.log` and `coverage-batch1.log`. The stored dataset and VQA cache
are unchanged; this is source acceptance. The user requested pushing this batch as soon as its
validation finishes. Work continues after that push using the same agreed solutions.

## Second-batch queue at its start

These are not blocked merely because their implementation is larger:

- Prime/composite finite classification profiles and six reviewed smaller-band target variants.
- Equation judgment over existing exact relations and bounded neighboring claims.
- Decimal writing/reading profiles preserving the established whole/fractional-quantity contract.
- Finite mass/volume estimation, unit-rate relations and ratio-table comparisons. Consumer tracing
  confirms the required quantities are projected by both unit-rate views; the provisional
  projection concern there was falsified and is not a deferral.
- Other arithmetic/fraction families still need complete source and consumer traces; a technical
  challenge alone does not make them a user decision.

## Decisions and complications

These entries do not block work in other families.

- `measurement-unit-scale`: the comparison view assesses large/small counts, while the derivation
  view explicitly assesses conversion factor 2/3. For `5 large = 10 small`, the comparison's
  quantities support lower5, but the factor forces no positive lower in derivation. A shared
  invariant/profile must not use unprojected quantities to establish its lower bound. Resolve the
  projection contract before adoption.
- Existing currency mixed-unit and five-row conversion-projection cases remain separate, as
  recorded in the remaining-family review. They are not assigned invented range annotations.

## Second batch: prime/composite classification

The two classification producers now partition their complete original2..99 support into ordinary
upper5/10/20/100 profiles. Required factor evidence includes1, so no positive lower applies.
All98 values (25 primes,73 composites) and their proof structures remain. The original two-digit
cap remains; the rollout does not silently add100. Six reviewed smaller-band source variants
extend4.OA.B.4 while retaining both original target IDs and matching routes. There are now eight
classification routes/selections. Conditional sampling changes within the accepted range rollout.

All28 focused tests/six files and196 exhaustive question/solution projections pass. Thirty-two
planned draws/replays pass canonical witnesses, target coverage and strict annotation checks.
Two hundred same-seed controls preserve unaffected factor-pair/multiple-test sibling values and
PRNG continuation. These families already had range labels: this repairs tightness and adds
source-band coverage, rather than closing range-presence findings. Evidence:
`temp/range-autonomous/batch2/arithmetic/classification-review.md` and
`verify-classification.json`.

## Second batch: equation judgment

The existing upper20 Grade1 equal-sign tasks retain all840 mathematical claims, including their
stated false proposals. Four reviewed smaller-band source variants retain both old target IDs
and routes. Six routes now admit18 correlated relation/range profiles. Each bound includes both
operands, the correct result and the stated proposal; a proposed zero remains a zero quantity
even when the correct result is positive. One finite-pool draw replaces rejection without forcing
a verdict mixture. Payloads, views and neighboring-proposal semantics stay unchanged.

All11 focused tests pass, including1,680 question/solution projections. Every old claim belongs
to exactly one feasible profile;72 planned draws and exact replays pass canonical witnesses,
strict annotations and target coverage. This tightens existing bounds rather than closing missing
range findings. Evidence: `temp/range-autonomous/batch2/arithmetic/equation-review.md` and
`verify-equation.json`.

## Second batch: equivalent-ratio table comparisons

Finite profiles preserve all832 original numeric frames across four quantity contexts. Bounds
include both full tables and their common-consequent comparison; unused coordinate-layout witnesses
do not determine the range. Upper10/20/100/120/1000 cells retain the three Grade6 routes, with
three selections becoming13 and three source omissions closed. All14 focused tests pass,
including every3,328 finite context/frame combinations and actual consumer rendering.

The new upper10 capability exposed three unrelated Kindergarten numeral-comparison matches.
The existing positive target-precondition mechanism now requires `Area.RatioEquivalence`, which
the task necessarily assesses. A regression retains all earlier Grade6 routes and rejects the
actual Kindergarten requests without target-ID filters or a global matching change. Evidence:
`temp/range-autonomous/batch2/measurement-time/comparison-focused.log` and
`route-verification.json`.

## Second batch: multiplicative comparison

Eleven operation/range profiles retain all87 original reference/scale pairs for each supported
operation. Both consumers require reference quantity, scale factor and compared quantity.
The existing three routes now admit16 selections, closing four baseline source range omissions.
Sampling remains uniform-scale/uniform-reference conditional on the selected feasible profile,
without a balancing requirement. All11 tests pass, including696 question/solution projections
across both views, and64 planned draws/replays pass strict annotations and target coverage.

The new range capability initially admitted eight generic Grade3 multiplication/division stories.
The comparative word task requires the distinct reference-to-compared proportional-scaling
competency. Its existing positive participation mechanism now requires `Area.ProportionalScaling`,
retaining all three earlier routes and rejecting those unrelated Grade3 requests. No target or
global matching change is used. Evidence:
`temp/range-autonomous/batch2/arithmetic/comparison-review.md` and `verify-comparison.json`.

## Second batch: finite mass and volume contexts

Mass reading, mass estimation and liquid-volume estimation now use nine feasible mathematical
range cells over all16 original object/container outcomes. Digital mass reading assesses the
displayed mass; estimation also requires the given one-unit reference and reference count.
The reference1 excludes a positive lower only in estimation. The digital3/4kg cases have no
positive lower,12kg uses lower10/upper20, and180/320/450g use lower120/upper1000.
Truthful invariant positive-integer labels satisfy the numeric obligations activated by ranges.

The exact eight earlier routes remain, with eight selections becoming15. Twenty-seven focused
tests pass, including actual estimation projections, exhaustive finite support and dependency
evaluation of every admitted bundle. These eight routes previously lacked a numeric trigger, so
this activates and satisfies their numeric dependencies; it does not close eight findings from
the439 baseline. No targets, views, payload contracts or global policies change. Evidence:
`temp/range-autonomous/batch2/measurement-time/mass-focused.log`, `mass-ownership.log` and
`route-verification.json`.

## Second batch: rooted whole-number lengths

The rooted relation retains origin0, unit1 and every positive endpoint, now selected through
ordinary canonical upper profiles. The required origin excludes a positive lower. The reviewed
2.MD.B.6 builder adds upper5/10/20 variants and preserves its original upper100 ID and labels.
Its marking view keeps an explicit target-bound precondition, generalized to any of the four
supported upper bands. The actual unbounded Grade6 regression remains rejected.

The shared number-line renderer uses integral0..5 ticks for endpoints through5, extending its
existing arithmetic behavior to marking tasks. Otherwise an upper5 task would display an
unnecessary10. All100 original positive endpoints are retained exactly once across the four
source bands; the required origin and endpoint remain observable in both modes. All21 focused
tests/five files pass, including all202 original0..100 question/solution projections, direct
resolution of all nine declared catalog bands and16 planned draws/replays. TypeScript and global
target/route preservation pass. This tightens existing annotations without closing a baseline
range-presence finding. Evidence: `temp/range-autonomous/batch2/rooted-length-tests.log`.

## Second batch: rational number-line values

Rational axes now select upper5 for fractions/decimals and upper5/10/20 for integer scales.
Every tick is a required scale anchor, including zero, so no positive lower applies. All704
original finite scale/point/form/precision/sign cases remain. The12 old routes and their explicit
sign choices remain, with three reviewed Grade2 source bands additionally matching the rational
positioning view. There are15 routes and23 selections. Because2.MD.B.6 requests whole numbers,
the existing schema fallback mechanism selects only the nonnegative domain when sign is
unspecified; explicit signed requests remain supported. Every original Grade6 target explicitly
requests its sign context, so no earlier sign selection is lost.

All28 focused tests/four files pass, including exhaustive support, question/solution projections,
direct/planned fallback checks and invalid form/range combinations. Twelve baseline range-presence
findings close; no targets, global matching or payload contracts change. Evidence:
`temp/range-autonomous/batch2/fraction-decimal/rational-line-tests.log` and
`rational-line-route-comparison.json`.

## Second batch: unit-rate relations

Four finite upper5/10/20/100 profiles preserve all2,534 original context/frame outcomes,
including the original strict99 source cap and scale factors1/2,2,3. Both consumers require the
original ratio, normalization to one and requested scaling. Their required1 excludes a positive
lower. All three old source routes retain their claims and IDs; their three selections become12
because those targets leave range unspecified. Three baseline range omissions close.

All23 focused tests/four files and TypeScript pass, including exhaustive finite support,
question/solution consumers and both schema-resolution paths. No target, view or payload change
is needed. Evidence: `temp/range-autonomous/batch2/measurement-time/unit-rate-focused.log` and
`route-verification.json`.

## Second batch: measurement-ratio conversions

Six upper profiles preserve all34,992 original fact/numerator/denominator draw outcomes,
including repeated reduced-rational outcomes. Both direction projections require the unit
equality, converted quantities and the dimension-preserving conversion-ratio identity1. That
identity is required mathematical reasoning, so it prevents positive lower bounds consistently;
unused forward/reverse scalar witnesses are not substituted for the projected quantities.
The compact domain uses fewer than100 indexed interval blocks instead of materializing payloads
at spec import. The original route remains, with one selection becoming six and one baseline
range omission closed. All22 focused tests/six files pass, including exhaustive support and both
question/solution direction projections. Targets, views and payload shapes stay unchanged.
Evidence: `temp/range-autonomous/batch2/measurement-time/ratio-conversion-focused.log` and
`route-verification.json`.

## Second batch: decimal writing and reading

Decimal writing and decimal reading now expose upper5/upper10 profiles under their established
whole/fractional-quantity contract. The required fractional quantity is below1, excluding positive
lower bounds. Zero-whole configurations admit only upper5. A constructive whole-part sampler
replaces bounded rejection while retaining all9,990 original values and every fractional sampling
path; reading distractors retain the same whole part and therefore the same range. Conditional
sampling changes, but targets, rendering and the payload contract remain unchanged.

All38 focused tests/nine files pass, including question/solution consumers and an exhaustive
10,080 raw fractional-path review. The two writing routes and one reading route remain exact;
writing selections change4→6 and reading2→3. Six baseline range-presence omissions close.
No inference or matching-policy change is used. Evidence:
`temp/range-autonomous/batch2/fraction-decimal/writing-tests.log`,
`current.json` and `writing-route-comparison.json`.

## Second autonomous batch acceptance

The second batch updates14 producer families and closes **29 baseline source range omissions:
439→410**. Eight mass/volume routes are newly qualified and complete; they were not baseline
omissions and are accounted separately. Other checkpoints tighten existing annotations rather
than claiming missing-label closures. All findings remain range-only:410 source plus1,062
unchanged stored rows. There are zero conflicts, invalid contexts, incomplete selections,
inference-contract errors or strict failures. The graph and Area qualification are unchanged.

Exact cumulative comparison against16f09717 preserves every authored/normalized target ID and
label set and every earlier matching route. From the first-batch baseline,13 reviewed source
targets and16 routes are added: six classification, four equation-judgment and three rooted-length
targets, with the latter also admitting three nonnegative rational-positioning routes.
Current counts are **1,303 authored /1,264 normalized targets,1,692 routes and3,105 selections**.
Native allocation is1,692 train+436 validation tuples:2,128 requested pairs /4,256 images before
deduplication. This is source allocation, not a regenerated dataset.

The complete **7,570-test /920-file coverage gate** passes with two workers; no test timeout or
coverage threshold is relaxed. Instrumented coverage is98.89% statements /97.87% branches /
100% functions /99.50% lines, and every generator meets its required threshold. Repository,
TypeScript and documentation gates pass. Existing external-document404 warnings are unrelated
to this batch. Evidence: `temp/range-autonomous/batch2/{check-final,types-final,docs-final,
global-final,coverage}.log`, its `audit/` reports and the family verification records above.
The stored2,918-image dataset and VQA cache are unchanged. This batch is ready to push promptly
under the user's instruction; established-profile work continues afterward.

## Next standard work after the second push

- Common GCD/LCM, full common-factor extraction and paired patterns have finite reviewed domains.
- Decimal column add/subtract, multiplication and division already demand their unit-count
  mathematics in both modes. Later expanded-form/scaling/rounding/comparison domains need compact
  constructive sampling, not a new labeling mechanism.
- Rational opposites can use the existing relation profiles and precise leaf compatibility.
  Fraction whole-equivalence explicitly requires numerator-part counts in all consumers.
- Elapsed-time arithmetic, clock components and unit-dimension operations have concrete finite
  quantity contracts. Explicit cancellation identity1 is mathematical work; an empty unit
  denominator written as1 is notation and must not suppress a truthful positive lower.

The remaining-family review separately records actual shared-projection/open-question issues.
Those do not stop these standard batches, and their unresolved requirements are not counted closed.

## Third batch: common-divisor and common-multiple proofs

Ten correlated operation/range profiles preserve all10,200 original GCD pairs and169 LCM pairs,
including the original inclusive100/12 operand caps. Each range follows its required proof:
the GCD task excludes the unused stored LCM (99/100 stores9900), while LCM includes its required
common-product proof. Explicit factor1 or zero prevents a positive lower. The finite domain
preserves the exact five-scenario probability mass, including overlaps, then conditions it on
the selected band. Both existing target claims/routes remain. Their NumberTheory Areas put these
contexts outside the unchanged all-Areas allowlist, so they had no baseline range finding and
no missing-range closure is claimed.

All23 focused tests pass, including full domain/probability verification and60 representative
boundary question/solution projections. Forty planned draws/replays pass canonical witnesses,
annotation contracts and target coverage. Dependency completeness remains outside policy scope
for these contexts. No source, view or global-policy change is needed.
Evidence: `temp/range-autonomous/batch3/arithmetic/common-relation-review.md` and
`verify-common-relation.json`. Combined repository/coverage acceptance follows the completed batch.

## Third batch: full common-factor extraction

Six upper profiles preserve all3,913 original ordered positive addend pairs with a nontrivial
common factor, retaining the inclusive100 addend cap and required sum through200. Both projection
modes require the common-factor, coprime-residual, reconstruction and sum proof. Its explicit
factor1 prevents a positive lower. The original target/route remains, admitting six selections;
its GCD Area puts the complete conjunction outside the unchanged Area allowlist, so no baseline
range finding closes. All35 tests pass, with36 representative boundary projections
and24 planned draws/replays checking canonical bounds, annotation contracts and target coverage.
Evidence: `temp/range-autonomous/batch3/arithmetic/full-factor-review.md` and
`verify-full-factor.json`. No target, view or global-policy change is used.

## Third batch: elapsed-time split

An invariant upper100 covers every one of the6,500 original hour/start/end-minute outcomes.
The required31..55 starting-minute component proves a maximum above20; every required clock
component, subinterval and duration is at most59. The question requires splitting at the next
whole hour, whose minute component0 prevents a positive lower. Timestamp storage is excluded.
The generator and views remain unchanged, and both earlier routes/selections remain. Six
focused tests pass and two source range omissions close. Evidence:
`temp/range-autonomous/batch3/measurement-time/` (elapsed focused and route verification reports).

## Third batch: factor pairs and divisibility

Four factor-proof bands and five divisibility bands retain all99 original factor inputs and178
divisor/quotient cases. Complete factor proofs include1; a divisibility case may instead support
lower5/upper100 when divisor and quotient are both at least5. The stored zero remainder is not a
new range witness: this projection says “Divides evenly” and assesses candidate/divisor/quotient.
The original strict99 cap and all proof payloads stay unchanged. Weighted finite selection
preserves the old divisor/quotient probability law conditional on the preselected profile.

Six reviewed smaller-band variants extend the same4.OA.B.4 source builders, retaining both old
target IDs/claims and routes. Eight routes admit nine selections. The existing task selector's
explicit absence default is preserved; a positive floor requires the declared divisibility
context, so it is an admitted alternative rather than a context-free fallback. No resolver or
matching-engine feature is added. This tightens existing bounds and closes no baseline omission.

All32 focused tests/seven files pass, including unaffected classification siblings. All277
original cases retain their proofs across554 question/solution projections. Thirty-six planned
draws and replays pass target coverage, strict annotations and both resolution paths. Spec
ownership/applicability and TypeScript pass. Evidence:
`temp/range-autonomous/batch3/{factor-multiple-tests,factor-projections,factor-specs,factor-types}.log`
and `verify-factors.json`.

## Third batch: aligned recurrence patterns

Five mode/range configurations preserve all1,764 independent and376 correspondence frames,
including their exact original source-example and additive/multiplicative mixture masses before
conditioning. Positions0..5 are mathematical recurrence inputs in this family: each prompt asks
for corresponding positions/alignment and rules advancing from the initial step. They are shown
in both modes, unlike arbitrary table row numbering. They preserve the existing view-owned zero
claim and rule out a positive lower even when every sequence value is at least5.

All three old routes remain, with seven selections and three source range omissions closed.
Nine tests,48 representative boundary projections and28 planned draws/replays pass. The original
correspondence default remains; no source, renderer or global-policy change is used. Evidence:
`temp/range-autonomous/batch3/arithmetic/paired-pattern-review.md` and
`verify-paired-pattern.json`.

## Third batch: decimal column addition/subtraction

Ordinary upper10/20 profiles include the explicitly requested base-ten unit counts before/after
exchanges, alongside the decimal operands/results. Required10-for-1 exchanges make upper5
infeasible, while zero-free cases necessarily use upper20. No positive lower applies. Every
original scenario path and its conditional per-pair probability remains; the generator's payload
and both projections are unchanged. The two old routes now admit six selections, closing four
source range omissions. The subsequently authorized source correction adds `IntegerNumbers`
to the elementary fluency aliases, so ordinary positive matching excludes decimal methods.
No decimal-domain participation guard remains.

All23 tests/five files pass, including exhaustive scenario membership, canonical maxima and
conditional probability checks. Evidence: `temp/range-autonomous/batch3/fraction-decimal/`
(column profile tests, route comparison and type checks).

## Third batch: decimal product and quotient models

Seven product and three quotient profiles preserve all973 multiplication pairs and48 division
inputs, with their original scenario/divisor probabilities conditioned on range. These existing
tasks explicitly require cell/row/column counts and, for division, quotient-unit traces and inverse
checks. Those assessed quantities determine the bounds; scaled storage fields alone do not.
Fractional unit values or the required final zero remainder prevent positive lower bounds.

Both old routes remain, changing1→7 and1→3 selections and closing two source omissions. Corrected
integer source domains prevent unrelated non-decimal matches through normal matching. No payload, renderer
or endpoint support changes. All45 tests/seven files and TypeScript pass, including complete
finite support and both-mode consumer checks. Evidence:
`temp/range-autonomous/batch3/fraction-decimal/` (decimal model verification reports) and
`src/generators/arithmetic/decimal-model-ranges.it.test.ts`.

## Third batch: opposite relations and whole-fraction counts

Rational opposites now use relation-aware upper5/10 profiles over all14,168 original raw
lattice/point paths, preserving duplicate reduced-step probability mass after conditioning.
Iterated negation assesses its original/reference magnitude and required zero; axis tasks assess
their complete required axis. Existing relation descriptors and precise leaf compatibility keep
those projections aligned without a producer split. All three old routes remain,3→6 selections,
with three source omissions closed. All88 tests/five files and types pass; no endpoint retires.

Whole-fraction equivalence explicitly requires numerator-part counts in all three consumers.
All15 original whole/denominator pairs partition into upper5/10/20/100 cells of4/6/4/1. A required
whole or fractional unit defeats a positive lower. All five old routes remain,5→20 selections,
closing five source omissions. Nine tests/five files pass, including actual prepared
question/solution rendering and replay across the three consumers. No target, payload or renderer
changes occur. Evidence: `temp/range-autonomous/batch3/fraction-decimal/` (opposite and whole
equivalence test/route reports).

## Third batch: clock components

Compact hour/minute blocks and contiguous second intervals preselect canonical ranges over
displayed clock components, excluding timestamp storage. All17 earlier routes remain;20 selections
become108. Exhaustive support covers89,462 retained mode-specific timestamp outcomes. The agreed
positive-threshold singleton exclusion retires ten configuration-class outcomes: four positive
minute, two five-minute subset and four legacy-second cases. The subset overlaps two positive
minute cases, so eight distinct payload timestamps retire before separate AM/PM metadata variants.
Required zero-minute/second components and normalized displayed hours retain their existing meaning.

All107 focused tests/18 files and types pass across every actual consumer. Twenty baseline source
range omissions close. Both direct and planned configs agree throughout the owned source proof;
no targets, payloads, renderers, Area qualification or range policy change. Legacy direct clock
configurations remain available. Evidence: `temp/range-autonomous/batch3/measurement-time/`
(clock support, consumer, route and source verification reports).

## Third batch: unit-dimension operations

Fifteen operation/range cells over eleven annotation bundles preserve all23,040 original unit
pair/numerator/denominator draws. Explicit cancellation quotient1 is required mathematical work;
an empty unit denominator written1 is notation and is excluded. Length×length therefore retains
truthful strongest lower5/10 profiles where feasible. Exact integer cross-products establish
fractional threshold feasibility, avoiding floating comparison errors such as(5/3)÷(1/3).

Both old routes remain,2→15 selections, closing two baseline source omissions. Eighteen focused
tests/four files, types and ownership pass. The combined measurement/time proof checks all21
owned routes/125 admitted selections through dependency evaluation and both resolution paths,
with no missing facets or conflicts. No target, view, payload or policy changes occur.
Evidence: `temp/range-autonomous/batch3/measurement-time/` (unit-dimension finite support and
combined source verification reports).

## Third batch: source-owned integer domains

The user explicitly approved correcting underspecified target domains instead of compensating
with module guards. Exact normalization tracing identifies six elementary fluency/written-arithmetic
builders across Kindergarten and Grades1–3:30 raw permutations sharing12 normalized label sets.
All add only `IntegerNumbers`; the three temporary decimal-domain target guards are removed.
The [complete source migration](canonical-range-integer-domain-correction.md) records every old/new
raw and normalized ID, the source-alias closure and64 affected route identities.

Before/after counts remain1,309 authored /1,270 normalized targets,1,698 routes and3,258 selections.
Every old route maps to its corrected identity with identical selected annotations; there are no
lost/added routes, selections, source associations or unmatched targets. Seventeen focused
tests/four files, types and standards validation pass. All mathematical sampler hashes remain
unchanged. Source ID-derived seeds/replay/cache identities will change at regeneration; they
are recorded as an approved source correction, separately from additive band expansion or
range-gap closure. Future clearly evidenced source-domain omissions use the same strategy.

## Third autonomous batch acceptance

The third batch updates12 producer families and closes **41 baseline source range omissions:
410→369**. NumberTheory conjunctions remain outside the agreed all-Areas allowlist, so GCD/LCM
and full-factor profiles receive no omission-closure credit. Factor/divisibility profiles tighten
existing declarations and add six reviewed source bands. Clock singleton retirements remain
separate support changes, precisely counted above. All current findings are range-only:
369 source+1,062 unchanged stored rows, with zero conflicts, invalid contexts, incomplete
selections, annotation-contract errors or strict failures. The graph/Area policy is unchanged.

Current source counts are **1,309 authored /1,270 normalized targets,1,698 routes and3,258
complete selections**. Cumulative comparison against16f09717 preserves every prior route lineage
and every unchanged claim. The explicitly approved integer-domain correction maps30 raw and12
normalized IDs across64 routes without losing a route, selection, competency or source alias.
Apart from those migrations, this batch adds only six reviewed4.OA.B.4 band targets/routes.
Native allocation is1,698 train+437 validation tuples:2,135 requested pairs /4,270 images before
deduplication. Source ID-derived seeds/replay/cache identities will refresh at regeneration.

All **7,601 tests /932 files** pass the complete coverage gate using two workers. No timeout,
test or coverage threshold is relaxed; all generator thresholds pass. Instrumented coverage is
98.78% statements /97.54% branches /100% functions /99.37% lines. Repository, standards, types
and documentation checks pass. Logs: `temp/range-autonomous/batch3/{check-corrected,
types-corrected,global-corrected,coverage}.log`, `audit/` and the owned family/source records.
The stored2,918 images and VQA cache are unchanged. The completed batch is ready for immediate
push under the user's instruction; independent standard work continues afterward.

## Next standard work after the third push

- Known-fact derivation and flexible add/subtract strategies have a reviewed concrete source-band
  plan preserving the full existing source frames and intended wider producer support.
- Decimal expanded form and adjacent-place scaling have compact weighted-block designs; rounding,
  comparison and fraction arithmetic remain larger applications of the established approach.
- Small rulers, measurement number lines and the banknotes-only currency branch have settled
  projection/quantity contracts. Coin/mixed-unit and open ratio-table projections remain separate.
- The fixed100 ten-tens leaf supports a clear U120→U100 source correction; its separate100–900
  sibling keeps its genuine broader envelope. Scalar zero/source bands are under the same direct
  source-intent review. A source-ID change alone no longer makes a clear correction a blocker.

## Fourth batch: known-fact derivation

Ordinary strategy/range profiles preserve all696 authored frames:56 unequal-factor commutative
facts,512 associative triples,64 inverse-division facts and64 tenfold scaling frames. Required
quantities are the given fact, derived operands/answer and explicitly assessed scaling10; an
unused product from another associative grouping is excluded. Uniform mathematical sampling
remains uniform conditional on the selected band, with one draw and no balancing requirement.

Five reviewed Grade3 builders add12 targets and21 routes. All six earlier raw aliases and11
routes remain, for32 routes/39 selections. Inclusive endpoints20/120 fit the agreed policy without
widening source ceilings; broader authored associative support remains available. Eighteen
focused tests,228 representative projections and156 planned draws/replays pass. Direct/planned
resolution and the complete generator/view spec gate pass, including standalone fallback probes
and rejection of infeasible supplied context. This tightens old bounds and closes no baseline
range-presence finding. Evidence: `temp/range-autonomous/batch4/arithmetic/known-fact-review.md`,
`verify-known-fact.json` and `known-fact-spec-gate.log`.

## Fourth batch: ruler profiles and smaller Grade1 measurements

Four upper bands5/10/20/100 preserve all100 integer lengths and991 exact decimal tenths from the
original family union. Origin0 prevents positive floors. Values through5 now select the existing
five-unit ruler support; every displayed ruler numeral fits the same tight band as the length.
No shared renderer changes are needed. Within each profile the draw is uniform over exact lengths;
the legacy decimal endpoint half-weights are intentionally replaced by uniform tenth-unit tickets
under the accepted sampling changes. Both mathematical domains remain complete.

Two reviewed upper5 Grade1 variants extend `1.MD.A.2-measure-length`, retaining all six earlier
routes. Eight routes admit20 selections, including both earlier Grade2 unbounded-tool routes.
Forty focused tests/11 files pass. All new source profiles pass dependency evaluation and direct/
planned config comparison. Two baseline range omissions close; four earlier ranged routes gain
canonical witnesses. Evidence: `temp/range-autonomous/batch4/measurement-time/ruler-focused.log`,
`route-verification.json` and `source-verification.json`.

## Fourth batch: fixed-value source bounds

Source intent settles four isolated bound corrections without changing any producer or view:
the literal ten-tens leaf uses upper100 instead of120, and the two zero-only K.CC.A.3 branches
use upper5 instead of20. Required hundred quantities are1,10,100; each zero branch has only0.
The genuine100–900 sibling and every positive-writing range/claim remain unchanged. This does
not claim complete canonical adoption of either broader producer family; flat-hundred and
positive-writing projection questions stay separate.

| Source | Old ID suffix | New ID suffix |
| --- | --- | --- |
| 2.NBT.A.1a ten-tens / DirectUnderstanding | 6eb535f7 | b3136955 |
| 2.NBT.A.1a ten-tens / ProcedureUnderstanding | 8b2822b7 | 5ede9391 |
| K.CC.A.3 write-numerals / zero | 71492382 | 74c636e9 |
| K.CC.A.3 represent-counts / zero | 1432894b | 14a9f846 |

All23 writing/hundred family routes remain after the four source IDs migrate; five routes are
affected and none is added/lost. Five source selections and20 planned draws/replays pass
canonical witnesses, target coverage and annotation contracts. Thirty-seven focused tests/six
files prove unchanged values and random continuation; same-value hundred markup remains identical
in both tasks/modes. No baseline missing-range closure is claimed. Evidence:
`temp/range-autonomous/batch4/fixed-source-verification.json` and `fixed-source-tests.log`.

## Fourth batch: banknote-only currency

An optional canonical range qualifies only the existing banknote-only branch: addition uses
upper5/10 and subtraction upper5, with no positive lower because the visible denomination is1.
All18 original count-draw outcomes remain, including duplicate/tie-adjustment multiplicities.
Conditional pool sizes are8/1 for addition and9/0 for subtraction. Ordinary profile selection may
change the earlier8/9 versus1/9 band mixture under the accepted sampling changes.

All18 earlier routes remain,18→19 selections, closing two range omissions. Sixty-four focused
tests/four files pass. All882 coin/mixed raw outcomes retain their original arithmetic and2/4
draw continuation; their empty range alternative keeps16 omissions visible rather than claiming
completion. Rendering and the cents/dollars competency remain intact. Evidence:
`temp/range-autonomous/batch4/measurement-time/` (banknote tests, route/source proof).


## Fourth batch: decimal expanded form

Eight correlated zero/range profiles retain all810,243 original values:278,802 zero-present and531,441 zero-free. The task explicitly assesses coefficient counts and unit-valued factors as well as the full decimal; fractional units prevent positive floors. Compact weighted pattern blocks preserve each original conditional path mass without rejection or endpoint retirement. The old route remains,2→8 selections, closing two range omissions. Twenty-six focused tests/five files cover independent finite support/probability, block endpoints, both resolution paths and question/solution evidence. Payloads, targets and rendering are unchanged.

Evidence: `temp/range-autonomous/batch4/fraction-decimal/`: `expanded-tests.log`, `expanded-matching.log` and neighboring proof records.


## Fourth batch: adjacent decimal-place scaling

Seven correlated profiles retain all177,309 original charts:66,717 zero-present and110,592 zero-free. Required quantities include the full numeral, highlighted contributions, factor10 and reciprocal0.1; no positive floor applies. First-zero weighted blocks retain the original conditional law and distinguish the one-free-digit whole charts from four-free-digit fractional charts. The old route remains,2→7 selections, closing two range omissions. Twenty-two tests/seven files prove finite support/mass, sampler block endpoints, direct/planned correlation and both projections. No endpoint, source, payload or renderer changes.

Evidence: `temp/range-autonomous/batch4/fraction-decimal/`: `scaling-tests.log`, `scaling-matching.log` and neighboring proof records.


## Fourth batch: decimal rounding

Twelve profiles include input, rounded value, interval endpoints/midpoint and required distances. Zero-endpoint cases admit upper5/10/100; nonzero cases admit all six uppers through1000, plus lower5/10/20 only with upper1000. Products of interval progressions and offset spans prove complete original support and conditional probability, retaining all18/24 zero/nonzero place/scenarios. Rank selection skips exactly the old rejected whole-number inputs. The old route remains,2→12 selections, closing two omissions. Thirty-two tests/seven files cover analytic partitions, both resolution paths and question/solution projections. No endpoint retirement, source or renderer changes.

Evidence: `temp/range-autonomous/batch4/fraction-decimal/`: `rounding-tests.log`, `rounding-matching.log` and neighboring analytic proof records.


## Fourth batch: decimal place comparison

Twenty-four relation/zero/range profiles preserve the original conditional source law through a local six-position digit DP. It retains deciding-place weights, shared-whole prefixes, triangular unequal digits, short-format overrides and the corrected final-digit pair mass. Equality retains all98,901 original values. Analytic finite-state probability partition and independent enumeration of4,495,500 final-place paths verify the law; this is not a brute-force claim over every full inequality pair. Every explicitly compared place-unit count participates in the range. Three old routes remain,5→24 selections, closing five omissions. Thirty-eight tests/five files cover profiles, both resolution paths and projections. Constructive successful-profile sampling removes the old4096-retry null outcome without changing mathematical support, precision sampling, payloads, sources or rendering.

Evidence: `temp/range-autonomous/batch4/fraction-decimal/`: `comparison-tests.log`, `comparison-matching.log` and neighboring probability proof records.

## Fourth batch: measurement number lines

Upper5/10 profiles bound the provided axis/step values and explicitly required target-step count.
The denominator in a supplied1/8 step is notation; unlike partition-construction tasks, this
question does not ask learners to count all eight partitions. All80 original lines remain across
five measurement units, represented by100 weighted tickets. Quarter targets retain weight3 versus
eighth targets1; decimal targets retain their original uniform law conditional on band.

All12 prior routes remain,20→40 selections, closing20 baseline range omissions. Sixty-two tests/
four files and type checks pass, including complete support, rendered helper evidence and both
resolution paths. Rendering, source targets and payload shapes are unchanged. The combined ruler/
line proof covers20 routes/60 selections without missing/conflicting annotations. Evidence:
`temp/range-autonomous/batch4/measurement-time/line-focused.log`, `route-verification.json` and
`source-verification.json`.

## Fourth batch: flexible integer strategies and declared widths

Compact anchor/tail intervals retain all1,338,862 original authored frames under the original
conditional row probabilities and two mathematical draws. Required operands, results, adjustments
and typed-step quantities determine the bounds. Two impossible single-width/U1000 assignments
retire while their target routes remain via multiple-width profiles; every old small-width frame
is retained under reviewed smaller bands. The original cap999 and broad authored support remain.
All10 old raw aliases and eight routes survive. Ten added raw variants create nine normalized
targets/routes, with the new Grade3 think-addition upper20 alias correctly sharing its existing
Grade1 representative. Seventeen routes admit32 selections. No baseline range omission closes.

Near-double smaller-operand widths are now ordinary matching-capable declarations: upper5/10/20
implies single-digit, while upper100/120/1000 implies multiple-digit. The supplementary inference
rule is removed; old emitted widths and strategy meaning remain correct at the original source
ceilings. Common inference machinery and the four expanded-form fallback cases stay unchanged;
a synthetic fixture retains the proof that inferred-only outputs cannot establish matching.
The production-dead legacy strategy sampler and its duplicate tests are retired.

Sixty focused tests/nine files,684 representative projections and128 planned draws/replays pass.
Independent finite enumeration proves full support, weights and canonical extrema; generator tests
cover both ends of every compact row. Both resolution paths, types, the full spec gate and CCSS
standards validation pass. Evidence: `temp/range-autonomous/batch4/arithmetic/flexible-review.md`,
`verify-flexible.json` and `near-double-claim-migration.json`.

## Fourth batch: penny-only currency

The existing formatter uses cents for coin-only amounts below100; the question cards, coin faces
and solution equation all retain that unit. In particular, the old6/6 count draw becomes7¢+6¢=13¢,
so13 is an explicitly required result rather than a hidden stored cent total. Upper5/10/20 profiles
retain all36 raw draws per operation and duplicate weights; face1¢ prevents a positive floor.
Conditional addition counts are10/22/4 and subtraction24/12 for upper5/10. No formatting is changed,
and cents/dollars conversion remains supported in the other branches.

All18 currency routes/source IDs remain,19→22 selections, closing two more range findings.
Fourteen coin/mixed omissions remain explicit. Sixty-seven tests/five files pass. The340 same-seed
controls and all810 other coin/mixed raw outcomes preserve data and2/4-draw continuation relative
to the banknote checkpoint. The final owned measurement/currency proof covers38 routes/82
selections, with no other missing facets/conflicts and direct/planned configs equal. Evidence:
`temp/range-autonomous/batch4/measurement-time/penny-*` and its source/route verification reports.

## Fourth autonomous batch acceptance

Nine producer families and two isolated source-bound slices are adopted. The batch closes
**37 source range omissions: 369→332**, for185 cumulative closures from the517 R5 baseline.
Known-fact and flexible-strategy profiles tighten existing claims rather than closing omissions.
The source has **1,333 authored /1,293 normalized targets,1,730 matching routes and3,382 complete
selections**. All earlier route lineages and unchanged target claims survive. Relative to the third
batch,24 raw/23 normalized variants add32 routes; one new Grade3 alias shares an existing Grade1
representative. Cumulative authorized source migrations are34 raw/16 normalized IDs: the earlier
integer-domain corrections plus the four fixed100/zero-only bound corrections recorded above.
No additional source change is accepted by the exact migration verifier.

All current findings remain range-only:332 source omissions plus1,062 unchanged stored rows.
There are zero conflicts, unmatched targets, incomplete selections, annotation-contract errors
or strict failures. Native allocation is1,730 train+442 validation tuples, or2,172 pairs/4,344
requested images before deduplication. The generic matcher, Area allowlist and graph policy stay
unchanged. No new inference is introduced; near-double width inference becomes ordinary declared
capability while the existing four expanded-form fallback cases remain.

Repository, standards, TypeScript and documentation checks pass. The complete coverage gate passes
**7,600 tests /946 files**, with98.85% statements /97.57% branches /100% functions /99.35% lines;
all generator thresholds pass using two workers, without relaxing a test, timeout or threshold.
The first coverage run exposed a historical currency fixture that discarded spec-owned range
rules and assumed one selection per target. Commit `7719d629` retains those rules, audits all22
current selections and preserves the original configuration, data and PRNG equality assertions.
Its87 focused tests pass; the subsequent complete coverage run passes.
The immediate follow-up types the fixture's retained compatibility rules explicitly: the catalog's
loose spec type otherwise leaves its filter callback implicitly typed. This is test typing only;
the runtime fixture, production inputs and passing coverage behavior are unchanged.

Evidence: `temp/range-autonomous/batch4/{global-final,check-final,types-final,docs-final,
coverage-final}.log`, `global-verification.json`, `audit/` and the owned family records above.
The stored2,918 images and VQA cache remain unchanged. Canonical regeneration and independent
Question/Solution VQA remain separate acceptance work after source readiness.

## Next standard work after the fourth push

Continue finite/correlated arithmetic, fraction and signed-context profiles; use constructive
compact domains for the remaining written methods where the required quantities are settled.
Keep partial adoption explicit: an empty deferred binding is not a closed range finding.
Two newly verified complications stay separate while independent work continues:

- Unlike-denominator fraction execution can hide a choice of common denominator. For1/2+1/4,
  the existing Question is identical at denominator4 or8, but the Solution's required count
  changes the canonical band. A method/question contract is needed for that slice; this does
  not defer the same-denominator and other settled fraction tasks.
- Standard whole-number multiplication permits products above1,000,000, beyond the largest
  approved catalog upper. Preserve that support pending a larger ontology bound or a reviewed
  sampling-envelope decision; do not silently truncate it to close a finding.

## Fifth batch: percent application and inversion

The two existing6.RP.A.3c targets remain unchanged. Both projections explicitly require the
per-hundred equivalence, percentage, scale factor, whole and part; the inverse additionally
divides by the same factor. Reference100 rules out upper5/10/20, and the factor at most1.5
rules out a positive lower. Ordinary fraction components and an unused product numerator
are not additional range inputs. Upper100/120/1000/10000 profiles are selected before generation.

Compact numerator intervals preserve all **563,664 raw paths** supported by the old declared
upper10000 source cap, including duplicate reduced-rational paths and their conditional mass.
The old omitted-range/upper1000 support (56,133 paths) remains a subset. The profile mixture
changes sampling and seeds; previously unbounded source requests can now draw from the larger
already-declared cap as well. No new numeric envelope is invented. The per-hundred competency
has no source ceiling, and both prior targets/routes remain. No target-band expansion is needed
for these already-unbounded requests. Payload shapes and same-value rendering are unchanged.

Independent full enumeration agrees with all1,003 compact rows:61,036 /19,369 /218,545 /264,714
paths in the four bands. No endpoint or old mathematical case is retired. Twenty-four focused
tests/five files pass, including exact finite support and mass, inclusive boundaries, both real
native routes, all eight finalized selections, direct/planned configuration equality, deterministic
replay and both Question/Solution projections. TypeScript passes. The owned annotation audit has
no missing facets or conflicts. This closes two baseline omissions; combined source acceptance
will verify the batch-wide count rather than adding unverified closures to the ledger.

Evidence: `temp/range-autonomous/batch5/percent/{domain-census,interval-proof}.json` and
`{focused,types}.log`. No inference, adapter, generic matching or Area-policy change is involved.

## Fifth batch: standard decimal multiplication

Six upper profiles from100 through1,000,000 describe the required coefficient-column work:
both coefficients, unscaled product and prescribed shifted rows. The printed shift0 rules out
a positive lower. Compact coefficient intervals retain all10,055,172 paths in the former largest
source-cap domain, every precision/orientation, and exact1,000,000 coefficient support. The two
old explicit-cap capabilities retain their own conditional source laws; newly exposed smaller
bands condition the former omitted-range corpus. These distinct laws are not presented as one
unchanged global profile mixture. Sampling and native replay identities change.

The sole existing target/route remains, one→six selections, closing one range omission. Payloads
and same-value question/solution markup stay unchanged. Fifty-six tests/six files cover analytic
support/mass, all interval boundaries, both configuration paths, decimal method evidence and the
integer-domain matching boundary. The independent boundary proof checks1,712 exact payloads.
Owned files typecheck; batch-wide types and native route/replay gates follow the concurrent
checkpoints. Evidence: `temp/range-autonomous/batch5/fraction-decimal/standard-multiplication-*`.

## Fifth batch: recurrence patterns

All81 original recurrence/law frames remain in20 disjoint canonical cells, with each original
uniform branch law preserved conditional on the selected profile. Required quantities are the
rule/start, sequence terms including the missing answer, associative combined operand and explicit
law witness; positional multiplication also requires its mathematical position inputs. Ordinary
card numbering is excluded. Sampling/seed changes follow profile selection; no target or renderer
changes are needed.

The16 existing routes remain with no new matches,16→48 complete selections, closing16 omissions.
Twenty-three tests/four files pass, including full finite support, both configuration paths,
810 same-value projections across all five consumers, and96 native planned draws with exact
replays. Types and generator/view spec validation pass. Evidence:
`temp/range-autonomous/batch5/arithmetic/{pattern-review.md,verify-patterns.json,pattern-tests.log}`.

## Fifth batch: unevaluated power writing

The existing writing view gains invariant upper5 for its required base/exponent inputs. Its
question explicitly says not to calculate the power, so an unused evaluated result cannot witness
a larger range. All468 original mathematical paths and936 Question/Solution projections pass.
The11 writing selections close11 omissions; all five existing power-family routes remain,
including the separate evaluator routes. Forty-four native draws/replays retain exact old data
and view random continuation. Thirty-two tests, types and the spec/ownership gate pass. Source
targets, IDs, rendering and sampling are unchanged.

Mixed-power evaluation's eight omissions remain separate. This producer still owns no range
labels, so the writing invariant creates no ownership overlap. Future evaluator adoption must
respect that boundary rather than assigning evaluated-value bounds to writing. Evidence:
`temp/range-autonomous/batch5/arithmetic/{power-writing-review.md,verify-power-writing.json}`.

## Fifth batch: signed contextual values

Reference-zero has invariant upper5 through its relation-correlated range choice. Its sampler
remains unchanged, verified across all four context choices and256 exact data/PRNG controls.
Directed pairs use upper5/no positive lower or lower5/upper10. A third upper10/no-lower choice
is infeasible: the neighboring-value sampler cannot place one magnitude strictly below5 and the
other above5. No artificial profile is added.

The compact88 blocks retain2,912 non-singleton raw paths with their exact conditional source
weights (110,268 integer-weighted tickets). Only88 raw threshold-singleton paths retire,
representing16 distinct contextual signed pairs at magnitudes5/10. This is the approved narrow
endpoint exclusion, not a new zero/sign rule. All three old routes and source IDs remain,
three→five selections, closing three omissions. Forty focused tests/six files, final TypeScript,
actual source selections, direct/planned resolution and same-value projections pass. Directed
sampling/replay identities change; reference-zero continuation remains exact. Payloads, renderers,
matching policy and the Area allowlist are unchanged. Evidence:
`temp/range-autonomous/batch5/measurement-time/{signed-focused.log,signed-types.log,verification.json}`.

## Fifth batch: settled fraction arithmetic

Same-denominator operations, decomposition, whole-fraction products, mixed-number work and
tenths/hundredths addition use existing task/operation configurations with canonical uppers5/10/20/100.
Their required unit-part, scaling and regrouping counts are included; ordinary notation components
are not automatically independent quantities. All315 weighted finite paths plus450 tenths/
hundredths pairs remain, with the original nested denominator/numerator and regroup probabilities
conditioned on the selected band. No positive lower or endpoint retirement is introduced.

Unlike-denominator pools retain their exact old sampling and an empty range-label binding to the
original unbounded mathematical constraint. Their16 unresolved selections stay visible; declaring
possible range outputs does not close them. All24 routes remain,32→55 selections, closing16
actual baseline omissions. Eighty-one tests/nine files pass, including finite support/mass,
all24 feasible settled task/operation/range cells, direct/planned/replay checks and the existing
Question/Solution presentations. Types and whitespace checks pass. Four consumer fixtures now
provide the explicit mathematical range; renderers, payload types, source targets and IDs are unchanged.
Evidence: `temp/range-autonomous/batch5/fraction-decimal/fraction-arithmetic-*`.

## Fifth batch: positive-integer two-step stories

Constructive compact intervals support all753,174 positive integral frames within the existing
ceiling100 across the ten authored operation sequences, in62 canonical cells. All former
operand-at-most12 cases remain; a subtraction/subtraction source that formerly could not witness
upper100 now has a valid challenge band. This expands mathematical support inside the existing
standard envelope. One uniform concrete-frame index replaces bounded rejection; profile selection
changes sampling and replay identities without forcing a balanced mixture.

The Grade2 builder adds nine reviewed upper5/10/20 variants, retaining all three old upper100
aliases. All13 previous routes remain, now22 routes/88 selections, closing ten baseline omissions.
Rounding, letter-equation and interpreted-remainder siblings retain their exact old field contracts
and1,000,000 envelope through an extracted category-level declaration. Their8/10/1 routes and
selection sets, mathematical draws and PRNG continuation remain unchanged. The unused old small
sampler is removed. Payloads and renderers stay unchanged.

Fifty-six tests/12 files pass, including complete direct support across all16 operation sequences,
600 same-value Question/Solution projections,352 real-target draws/replays and sibling controls.
The spec gate passes; final combined types follow the concurrent checkpoints. Evidence:
`temp/range-autonomous/batch5/arithmetic/{two-step-review.md,verify-two-step.json}`.

## Fifth batch: contextual order and magnitude

Both families use compact weighted numerator intervals with upper5/10 and no positive lower,
including their common required reference datum0. Temperature/balance state zero directly;
elevation names the sea-level datum already represented by the view's zero declaration. No
pairwise distance up to20 is requested. The unrestricted legacy helper remains unchanged.

All137,880 original paths and their conditional denominator/pattern/order weights remain, with
no endpoint retirement. Integer-weight indexing is safe and the complete raw-path proof checks
each interval. Order retains four routes,8→16 selections; magnitude retains two routes,3→6
selections. Eleven baseline omissions close. Fifty-nine tests/nine files and label checks pass,
with every actual source selection graph-clean, direct/planned equal, and88 native replay/state
controls. No target, renderer, payload or matching changes occur; profile sampling changes seeds.
Evidence: `temp/range-autonomous/batch5/measurement-time/{ordered-focused.log,verification.json}`.

## Fifth batch: cents-only nickel and dime slices

Nickel addition/subtraction and dime subtraction retain all108 original raw draws and duplicate
weights. Operand totals and answers stay below100 cents, and both Question/Solution use cents.
The assessed5¢/10¢ denominations establish lower5/10. Unasked picture cardinalities are not
additional numerical inputs. Nickel addition has5/31 tickets at upper20/100; subtraction has
3/12/21 at upper10/20/100. Dime subtraction has3/33 at upper20/100.

All18 currency targets/routes remain,22→26 selections, closing three omissions. The702 other
coin/mixed raw paths are unchanged, with608 exact seed/data/continuation controls across19
unaffected configurations. Ninety tests/seven files and label checks pass;104 native replay
controls, every direct/planned source selection and graph check pass. The historical currency
fixture now accounts for the26 selections and11 explicit range deferrals without weakening its
mathematical or entropy comparisons. Rendering and numeric units stay unchanged.
Evidence: `temp/range-autonomous/batch5/measurement-time/{cent-focused.log,cent-slices.log,
cent-unaffected-verify.log,verification.json}`. Remaining dollar/cent cases stay separate.

## Fifth batch: settled quotient roles

Whole-sharing, fraction-as-quotient and whole-by-unit-fraction roles use existing configurations
with finite upper5/10/20/100 profiles. All107 unique role/numeric pairs and177 actual relation
pairs remain; both existing material variants are checked through354 outputs. Their original
uniform conditional laws remain. Unit-dividend roles keep unchanged samplers and empty range
bindings, leaving16 omissions visible rather than assigning a payload-wide count to every task.

All22 routes remain,52→104 selections, closing36 baseline omissions. Twenty-three settled schema
combinations pass direct/planned/replay and all six Question/Solution projections. Sixty-six
focused tests/eight files plus23 migration tests/four files pass. An exposed direct resolver alias
is repaired: explicit NumbersWithoutZero now resolves the same existing whole-sharing/unit-divisor
role admitted by planned bindings. It adds no capability label, route or global matching behavior.
Seven consumer fixtures supply the explicit range. Payloads, rendering, source targets and IDs
are unchanged; profile sampling changes native outcomes. Evidence:
`temp/range-autonomous/batch5/fraction-decimal/quotient-*`.

## Fifth batch: multidigit partial products

All72,981 original ordered digit draws and69,705 distinct sorted factor pairs remain in25
canonical cells, retaining duplicate draw-path weights. Required decomposition magnitudes,
region products and final result determine the range; digit/place captions used only for notation
do not create independent quantities. All five routes and source claims remain, five→25
selections, closing five omissions. No source, payload or renderer changes occur.

Thirty-six tests pass, including complete support/multiplicity proofs,150 Question/Solution
projections and50 native draws/replays. The spec gate and final TypeScript pass; a typed Map
replaces an unsafe fromEntries record assertion in the finite domain. Evidence:
`temp/range-autonomous/batch5/arithmetic/{partial-products-review.md,verify-partial-products.json}`.

## Fifth batch: existing sequence bounds and one-step closure

Counting sequences now select tightest upper/strongest lower profiles before generation. Their
implicit step remains a sequence relation rather than an additional arithmetic operand, consistent
with the established range distinction. The finite domain retains all1,993 distinct old declared
range/step sequences across57 cells, including old preferred lengths and truncated end runs.
No sequence is shortened to create a witness. Sampling is uniform over distinct retained frames
within a profile; the former source-cap/start hierarchy is not claimed unchanged. This is the
accepted incidental sampling change, not a balancing requirement.

Source review adds22 variants across K.CC.A.1, K.CC.A.2,1.NBT.A.1 and2.NBT.A.2, keeping all nine
old aliases and their1,553 source-case instances. Bands are per step: counting by5 starts at
upper10, by10 at upper20, and by100 at upper120. K.CC.A.2 additionally has lower10/upper20 so
its former starts10..19 retain truthful strongest floors. Other source claims remain unchanged.

The smaller bands reach nine new one-step object/sequence routes. That existing producer also
gains canonical profiles, with the explicit adjustment1 ruling out every positive lower. Its full
old support partitions across the six upper bands without retirement. The two old routes remain.
Together the two producers have42 routes:31 sequence and11 one-step. Payload types and renderers
remain unchanged. Ten/hundred offsets retain their exact legacy range declarations through the
existing category helper, and their sampling remains unchanged; their separate assessed-count
question is not silently decided here.

The102-test/12-file focused gate passes, including exhaustive old-support partition, both native
configuration paths, exact replay and actual Question/Solution components for every admitted
selection. The cumulative source verifier preserves every earlier route lineage and claim;
TypeScript and the generator/view spec gate pass. These tighten existing annotations and add
truthful source variants; no baseline missing-range closure is claimed. Evidence:
`temp/range-autonomous/batch5/counting/{verification.json,verification.log,focused-final.log,
native.log,types.log,spec-gate.log,global.log}`.

## Fifth batch: shared general-division configurations

Eight existing operand/group configurations have common canonical bounds across the required
group model and the execution/inverse reciprocal. Their3,485 weighted rows retain exact old
support and conditional mass. Quantities include operands/quotient, mandatory complete-group
count, numbered axis positions and the explicitly assessed last-group remainder/divisor counts.
Stored coverage ticks, unused totals and pure notation denominators are excluded. The reciprocal
is checked independently and cannot change an adopted band's maximum.

The three reciprocal-sensitive configurations retain their old sampler and empty range bindings:
proper-fraction by proper-fraction in both group profiles, and integer by proper-fraction with
zero complete groups. Their18 selections remain unresolved. All18 routes remain,66→204
selections, closing48 baseline omissions. Thirty-one settled bands and34 total bindings pass
direct/planned/replay checks and all six Question/Solution projections. Fifty-nine tests/11 files
pass, including the independent4,396-row magnitude oracle. Types and whitespace checks pass.
Four shared fixtures are adopted; source targets, payloads, renderers and policies stay unchanged.
Evidence: `temp/range-autonomous/batch5/fraction-decimal/general-division-*` and its census JSON.

## Fifth batch: partial-quotient division

All931,315 original mathematical frames and conditional draw-path weights remain in28 canonical
cells. Required decomposition addends, quotient chunks, products, running subtraction states and
final remainder participate; ordinary captions do not become additional operands. Exact100/1000
dividend endpoints remain in the appropriate width profiles. Compact weighted remainder rows
replace rejection failures without changing the source envelope or payload.

The matching review caught ten unsuitable new subtraction/multiplication-fluency routes admitted
by truthful intermediate Area declarations. The fixed area-model view now requires the original
target's DivisionPartialQuotients competency through the existing positive task-precondition
helper. All seven previous routes already request it and remain; there are no new family routes.
No grade/target-ID guard, blacklist, target mutation or matcher change is introduced. Selections
ten→28, closing exactly six baseline omissions. The four Grade4 selections were outside the
Area policy because of ImperfectDivisibility; their optional canonicalization receives no closure credit.

Sixty-one tests/eight files pass, including full support/uniqueness/path-weight and required-quantity
proofs,168 Question/Solution projections, all28 configuration cells and56 native draws/replays.
Complete TypeScript, static specs and whitespace checks pass. Evidence:
`temp/range-autonomous/batch5/arithmetic/{partial-quotient-review.md,verify-partial-quotients.json}`.

## Fifth batch: standalone sequence instructions

Independent review exposed an existing consumer ambiguity made systematic by the new step10/
upper20 source route: the two-term question displayed10 and a blank without stating the step.
Both modes now say to count forward by ones/fives/tens/hundreds using the already supplied
mathematical relation. This repairs the missing premise under IMPL-V5/IMPL-V11; the question
still withholds its answer. It does not turn the sequence step into an arithmetic offset operand
or change the agreed range quantity set.

This is a local rendering-text/checklist change. Payloads, source labels/targets, matching, sampling
and RNG are unchanged. Tests distinguish identical10/blank displays with answers11 versus20,
cover every step, interior physical blanks, both modes and invalid input. Sixty-three tests/nine
files, including every actual native counting selection, and fresh TypeScript pass. The unchanged
number renderer and constant word mapping add no randomness. Evidence:
`temp/range-autonomous/batch5/counting/{step-instruction-tests.log,step-instruction-types.log}`.
The view/checklist identity will refresh its affected artifacts at the later canonical stage.

## Fifth batch: historical fixture adoption

The first complete coverage run found16 failures in three historical fixtures. Two recurrence
consumer fixtures bypassed configuration resolution and omitted the newly required range; they
now provide explicit feasible canonical upper20/100 fields while retaining all original prose,
rendering and rejection assertions. Their45-test/six-file suite and final TypeScript pass.

The measurement-precondition fixture selected the first Grade2 addition target, which is now
the reviewed upper5 variant. Its counterfactual conversion family needs at least upper20 because
of a required factor16. Selecting the unchanged original upper100 target restores the intended
comparison: removing only the UnitConversion prerequisite admits it, and the actual view rejects
exactly that missing competency. Both assertions remain unchanged. Thirty tests and final types
pass. No production behavior or validation rule is relaxed. Evidence:
`temp/range-autonomous/batch5/arithmetic/{pattern-consumer-fixtures,types-pattern-fixtures}.log`
and `measurement-time/fixture-repair-{tests,types}.log`.

## Fifth batch: weighted-sampler boundaries

All7,672 tests then passed, but the percent generator's unreachable null-fallback branch left
its branch coverage at50%, below the unchanged60% threshold. The cumulative weighted selection
now uses an explicit loop with the last bucket as its total default, preserving the same draw law
and floating-point behavior. Two thousand fixed-seed data/PRNG controls match the prior sampler.
Four additional tests exercise both the zero draw and maximum possible Mulberry32 draw for
every band, including inclusive final numerator choices. All28 focused tests pass, with100%
statement/branch coverage for that generator, and final TypeScript passes. No test, timeout or
coverage threshold is relaxed. Evidence: `temp/range-autonomous/batch5/percent/
{sampler-before,sampler-after,boundary-coverage}.log`.

## Fifth batch: complete acceptance

The committed implementation passes the full 7,676-test / 975-file coverage suite with two
workers. Overall coverage is 98.64% statements / 97.13% branches / 100% functions / 99.20% lines;
every generator meets the unchanged thresholds. Complete CCSS checks, TypeScript, documentation
references and whitespace checks pass. Evidence is in `temp/range-autonomous/batch5/`, including
`coverage-accepted.log`, `check-final.log`, `types-final.log` and `global-verification.json`.

The source now contains **1,364 authored / 1,324 normalized targets, 1,770 routes and 3,841
complete selections**. Exactly 168 more baseline range omissions close: 332→164. The fifth batch
adds 31 reviewed source variants and 40 routes, with no new target-ID migrations. Cumulative
verification from `16f09717` preserves every earlier route lineage through exactly the previously
authorized 34 raw / 16 normalized source-ID migrations. There are no unmatched targets,
conflicts, incomplete tuples, contract errors or strict annotation failures.

Native allocation is 1,770 train plus 448 validation pairs: 2,218 requested pairs / 4,436 images
before deduplication. These are source estimates. The 2,918 stored images, VQA cache and 1,062
stored range findings remain unchanged; range stays report-only. Further ordinary work includes
the reviewed decimal methods, numeric structural tasks, standard division and legacy bounds
already present on counting/place-value families. Concrete quantity/projection decisions stay
separate and do not stop those repairs.

## Sixth batch: existing shape-comparison claims

The existing upper20 declaration is tightened into upper5/10/20 profiles for the two explicitly
compared attribute counts. All 70 original ordered shape/attribute/partner frames remain, with
their original uniform-attribute then uniform-partner weights conditioned on the selected band.
Every comparison has a required count below5, so no positive floor is claimed. The existing
geometric Areas remain outside the mandatory range gate; this is repair of an explicit range
claim and receives no missing-facet closure credit.

All nine source routes remain, nine→20 selections, with no target, payload or renderer changes.
Thirty-four focused tests pass; all40 native draws/replays and direct/planned configurations
agree. Both rendering modes expose the counts in all140 projections of the complete support.
Evidence: `temp/range-autonomous/batch6/shape/{tests.log,verification.json}`. Overall source and
coverage acceptance follows after the remaining sixth-batch slices stabilize.

## Sixth batch: standard decimal division

Eight canonical upper profiles cover the largest existing declared source corpus, retaining all
16,592,798 coefficient paths, supplied precision variants and four-scenario preimage weights.
The former cap mixture changes as accepted; no new source envelope or source-cap parameter is
introduced. Required normalization factors, normalized values and actual long-division work
participate. A raw coefficient cap is not confused with the canonical mathematical maximum.
Exact final remainder0 rules out a positive lower claim.

The existing target and single route remain, one→eight selections, closing one source omission.
There are no payload, renderer or target changes. The complete row/mass census, all20,530 finite
prefix cases /33,174 supplied-trim traces and analytic tail bounds establish full support, beyond
sampled controls. Forty-three module tests,22 shared tests, direct/planned configuration checks,
native replay, Question/Solution projection and the owned-file typecheck pass. Exact zero and
maximum Mulberry32 draws exercise each sampling boundary. Evidence:
`temp/range-autonomous/batch6/fraction-decimal/division-*.log` and the comparison JSON.

## Sixth batch: integer-column source correction

Four Grade3/4 targets incorrectly applied lower100/1000 to every required quantity even though
their instructed carrying/borrowing calculations necessarily use1. The source standards require
whole-number algorithms and an upper ceiling, not those global floors. Following the authorized
source-correction strategy, remove the false floors and explicitly add IntegerNumbers. Removing
only the floors was falsified: it admitted two unintended decimal routes.

| Source / operation | Old suffix | Corrected suffix |
| --- | --- | --- |
| 3.NBT.A.2-standard-algorithms / addition | 9a1c4254 | 71ef3460 |
| Same / subtraction | 786b9192 | a800be2e |
| 4.NBT.B.4-standard-algorithm-add-subtract / addition | 79ac303a | f6e2d068 |
| Same / subtraction | f8aa30b4 | d95a6bf6 |

Every other source claim and all four route lineages remain. The four nonempty three-/six-column
corpora retain their exact mathematical sampling; the advertised upper120 corpus was already
impossible and is retired. Source-derived native IDs/seeds change normally. This corrects false
claims without closing a missing-facet finding. Cumulative source-ID migrations are now38 raw /
20 normalized; the verifier recognizes exactly these four additional transformations.

Fifty-two focused tests /five files, eight direct/planned configurations,48 same-value Q/S
projections,24 actual source draws/replays and pre-edit payload hashes pass. Complete types,
module specs and CCSS standards checks pass. Evidence:
`temp/range-autonomous/batch6/arithmetic/{integer-column-review.md,verify-integer-columns.json}`.

## Sixth batch: definite numeric structural expressions

The six fully numeric relations now resolve45 feasible sign/range cells before expression
construction. Participating quantities follow the approved structural contract: literal inputs
and explicitly assessed signed terms participate; unused evaluation totals/subtotals do not.
The complete97,920 raw-path census retains97,770 paths and duplicate reduced-rational weights.
The150 retired paths are exactly the approved isolated positive threshold5 cases.

Compact integer tickets avoid rare-profile rejection and expression-tree catalogs. All21 routes
and source claims remain,31→60 selections, closing16 baseline omissions. The eight symbolic
range findings remain separate: an unbound variable cannot inherit a hidden sampled binding's
bound. No new inference, graph policy, source or renderer change occurs.

Sixty-seven focused tests /six files, every45-cell direct/planned configuration,270 boundary
Question/Solution projections and240 actual native/replay controls pass. All448 unaffected
symbolic/substitution/modeling controls preserve data and PRNG continuation. Evidence:
`temp/range-autonomous/batch6/measurement-time/{algebra-focused.log,algebra-verification.json}`.

## Sixth batch: standard integer division

All99,890,010 original dividend/divisor pairs remain within their existing99,999 ceiling, grouped
into48 canonical cells. Compact quotient/remainder intervals retain the old zero-scenario mixture
and uniform zero-free conditional masses. Quotient digits participate where they multiply the
divisor; ordinary bring-down glyphs do not add quantities. The backward-remainder argument and
complete small-divisor remainder checks prove the strongest lower distinction.

The existing Grade6 target/route remains, six→48 selections, closing six omissions. No source,
payload or renderer changes occur. Early provider resolvers now consider declared range requests
so broad direct requests cannot choose an empty branch. Eighty-four focused tests /seven files,
full types and module specs pass. Independent positional traces cover every compact row boundary;
192 same-value Q/S projections,144 all-cell configuration/replay checks and six actual source
draws/replays pass. Evidence:
`temp/range-autonomous/batch6/arithmetic/verify-standard-division.json` and the associated logs.

## Sixth batch: standard decimal column addition/subtraction

Twenty-six feasible range/zero profiles partition the largest existing raw-coefficient corpus
of1m. Weighted top prefixes and exact digit/borrow ranks preserve its conditional nested source
law without the former2048-draw rejection exhaustion. Every old mathematical frame remains;
the old cap mixture and retry continuation change as accepted for profile sampling. The actual
required quantities never exceed100k, so the unsupported explicit1m upper capability retires;
neither current source target requested it.

Required unit counts, working sums/differences and positive carry/borrow quantities establish
the bounds; the existing zero predicate is unchanged. No target, payload or renderer changes
occur. Both routes remain, four→26 selections, closing four omissions. Sixty-five focused tests /
seven files, complete types, the1m digit census,495,450 independent low-coefficient subtraction
traces, rank/CDF checks, all compact-case random endpoints,2,400 stress draws/replays and all
native configurations/Q/S projections pass. The original seed105 zero-free mathematical frame
remains constructible. Evidence:
`temp/range-autonomous/batch6/fraction-decimal/add-sub-proof.md` and its accompanying logs.

## Sixth batch: strongest floor for integer place scaling

The existing six-coefficient contract partitions all269,001 original vectors into84,681 with
zero,177,920 positive vectors with a coefficient below5, and6,400 with every coefficient at
least5. The last group adds matching-capable lower5; the existing upper1m is already tight.
The conditional repeated-digit and first-low-position construction preserves every vector and
its old relative proposal weight without rejection. The zero-containing branch retains its
exact mathematics/PRNG continuation in512 controls. The other profile outcomes change normally.

The single source target/route remains, two→three selections. No target, payload, renderer,
inference or graph changes occur, and no missing-facet closure is claimed. Seventeen focused
scaling tests, the complete vector census, first-low/random-endpoint cases, all six actual native
draws/replays, direct/planned configurations and Q/S rendering pass. Evidence:
`temp/range-autonomous/batch6/scaling/{tests.log,verification.json}`.

The shape provider follow-up also completes broad range-only direct requests using only feasible
shape alternatives. Exact shape requests remain exact, including Rectangle/Square specialization;
no matching rule or shared resolver changes. All original nine routes /20 selections and40 native
draws/replays remain, with35 shape/consumer tests passing.

## Sixth batch: broad direct requests in three earlier families

The recurrence, partial-product and partial-quotient provider resolvers now consider later
range/zero requests before choosing a branch. This repairs supported broad requests that could
previously select an infeasible width/operation in the direct path. Existing alternatives,
mathematical domains, native plans and shared resolution are unchanged.

All28 routes and101 emitted selections remain exactly the same. Eighty-five focused tests /
13 files, full types, module specs and84 fixed-seed native payload/view controls pass. Small-band
and zero/floor direct requests pass32-seed controls. One manual fixture now selects its intended
consistent binding instead of combining conflicting zero claims; all28-cell assertions remain.
No source edits or missing-facet closures are claimed. Evidence:
`temp/range-autonomous/batch6/arithmetic/verify-fallbacks.json`.
