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
profiles. Existing target claims/routes remain supported. Reviewed smaller source bands can be
added without changing earlier IDs. Cases needing an unresolved quantity interpretation, a new
source envelope, a split or a change to an existing target claim are recorded separately while
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
selections replacing one unbounded selection. This closes one baseline source-presence finding.

The time and length-difference focused gate passes 11 tests across four files, including complete
finite support and canonical witnesses. Exact owned route comparison and TypeScript pass.
Evidence: `temp/range-autonomous/measurement-time/route-verification.json`, `first-focused.log`
and `types-first.log`. The invariant checkpoint is `4e556963`.

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

## Decisions and complications

These entries do not block work in other families.

- `measurement-unit-scale`: the comparison view assesses large/small counts, while the derivation
  view explicitly assesses conversion factor 2/3. For `5 large = 10 small`, the comparison's
  quantities support lower5, but the factor forces no positive lower in derivation. A shared
  invariant/profile must not use unprojected quantities to establish its lower bound. Resolve the
  projection contract before adoption.
- Existing currency mixed-unit and five-row conversion-projection cases remain separate, as
  recorded in the remaining-family review. They are not assigned invented range annotations.
