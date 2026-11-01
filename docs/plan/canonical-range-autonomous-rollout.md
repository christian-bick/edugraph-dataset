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
other supported work continues. No graph-policy, matching, Area-allowlist or inference change is
part of this rollout.

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
