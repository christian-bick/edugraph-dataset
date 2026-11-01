# Canonical upper-range consumer review

Reviewed 2026-11-01 from `58673c2c`, ontology `0.33.0`, as the feasibility prerequisite for
[R2/R3](canonical-range-labeling.md#checkpoints-and-validation). This is a whole-family review,
including consumers outside the [K–1 pilot](canonical-range-pilot.md). It does not activate new
samplers, target variants or range enforcement. Loose but truthful existing bounds are observations
under the proposed policy, not violations of the current inclusive-bound contract.

## Findings and scope

| Family | Normalized targets | Matching routes | Unique resolved configurations | Result |
| --- | ---: | ---: | ---: | --- |
| `comparison` | 18 | 18 | 12 | Every current configuration can witness its selected upper band |
| `arithmetic-ops-pairs` | 54 | 135 | 37 | Seven optional width choices are infeasible; every bounded route has another feasible choice |

Thus no currently authored target needs removal merely to preserve a matching route under the
upper-witness condition. This is narrower than preserving the full support of each competency:
tightening its only upper variant would remove smaller-band examples. All shared consumers need
source-band review before activation. Eight arithmetic routes have no selected upper bound and
remain outside the finite-band completeness proof.

This review followed `review-gen` and the applicable reference audits. Ownership and implementation
requirements remain those in SPEC-G2, SPEC-G3, SPEC-6, SPEC-11, IMPL-G1, IMPL-G3, IMPL-G4,
IMPL-G5 and IMPL-G8. No payload change, producer split, target-ID routing, inferred annotation or
post-generation completion is proposed.

## Comparison

Fresh matching and exhaustive selection enumeration cover six definitions, five source leaves
and four views. Every current selection explicitly requests positive, nonzero quantities and one
of Less, Equal or Greater.

| Definition | Routes | Existing quantity interval | Canonical upper predecessor | View |
| --- | ---: | --- | ---: | --- |
| `K.CC.C.6-compare-groups-by-counting` | 3 | 1..10 | 5 | `numbers-compare-counting` |
| `K.CC.C.6-compare-groups-by-matching` | 3 | 1..10 | 5 | `numbers-compare-matching` |
| `K.CC.C.7-compare-numerals` | 3 | 1..10 | 5 | `numbers-compare` |
| `1.NBT.B.3-place-value-comparison` | 3 | 10..100 | 20 | `numbers-place-value-comparison` |
| `2.NBT.A.4-compare-three-digit` | 3 | 100..1000 | 120 | `numbers-compare` |
| `4.NBT.A.2-compare-multi-digit-numbers` | 3 | 1000..1,000,000 | 100,000 | `numbers-compare` |

The compared values are the canonical mathematical quantities. Their relation is the required
answer; place-value evidence represents those same quantities. Object groups and written numerals
remain visible in both modes, so no consumer removes the maximum witness. Place-value digits and
layout counts are not independent operands under the established range interpretation.

All 18 admitted selections (12 unique configurations) have feasible witnesses. Current positive inequalities through 1,000 select
the interval endpoints and already witness the upper bound. Equality samples throughout its interval;
large inequalities are random. A 100-seed counterexample probe finds loose upper annotations on
eight routes, including `3 = 3` labeled upper10 and `110 = 110` labeled upper1000. The probes are
not exhaustive generation proofs. All 54 current module/view tests pass.

The minimal sampler change is to constrain the common equality magnitude to the witness interval.
For large inequalities, select one magnitude from that interval and a distinct partner from the
original domain, then orient the pair. Keep ordinary `range.min` separate. No same-value view or
payload change is necessary. Declared signed/zero branches also need tests and compatibility:
`0 = 0` cannot witness an upper band above the smallest catalog bucket.

### Additional source review and endpoint consequences

The nine new Kindergarten upper5 permutations fit the current three comparison views. Shared
sampler activation also reaches the nine Grade 1/2/4 routes. Candidate source expansions for their
existing domains are:

| Source competency | Candidate upper variants | Existing lower constraint | Isolated boundary case |
| --- | --- | ---: | --- |
| Two-digit comparison | 20, 100 | 10 | `10 = 10` |
| Three-digit comparison | 120, 1000 | 100 | `100 = 100` |
| Multi-digit comparison | 10000, 100000, 1000000 | 1000 | `1000 = 1000` |

These are review candidates, not target edits. Source ceilings and inherited boundary approximations
(including 100 in the two-digit domain and 1000 in the three-digit domain) must be accounted for
explicitly. The isolated equalities would need equal tight lower/upper labels to preserve their
existing lower claims. That reaches the already-open singleton policy. Choosing to omit an equal
lower label also needs a target/configuration ownership review; it cannot be implemented as silently
dropping a requested label after generation. No endpoint interpretation or ontology-conflict bypass
has been selected by this review.

## Arithmetic pairs

The complete surface contains 58 authored permutations in 21 definitions, normalized to 54 targets.
Four authored overlaps retain their source associations. Every admitted production configuration is
positive, nonzero and unit-step.

| Consumer | Routes | Relevant quantities |
| --- | ---: | --- |
| `measurement-word-problem` | 28 | Same-unit operands and required answer; no conversion |
| `operations-boxes` | 16 | Both operands and hidden/revealed result |
| `operations-boxes-inversion` | 20 | Includes the required hidden operand |
| `operations-vertical` | 13 | Both operands and result; no extra column-unit algorithm |
| `operations-vertical-inversion` | 13 | Includes the required hidden operand |
| `operations-number-line-arithmetic` | 11 | Operands and endpoint/result; scale review below |
| `operations-representation` | 6 | Object cardinalities and the same equation |
| `operations-word-problem` | 4 | Story inputs and required result |
| `operations-word-problem-inversion` | 4 | Includes the required hidden input |
| `operations-word-problem-within-100` | 10 | Pair branch operands and required result |
| `operations-word-problem-within-100-inversion` | 10 | Pair branch including required hidden input |

The producer owns the operation, domain, widths, bounds and mathematical restrictions. Views retain
their Ability and presentation claims. `num1`, `num2` and `operation` are canonical data; `answer`
is uniquely determined evidence that remains relevant when hidden. Units, layout indexes and story
themes do not introduce independent numerical operands.

Exhaustive selection resolution yields 29 finite-upper configurations across 46 targets/127 routes,
and eight unspecified-upper configurations across eight Grade-4 measurement targets/routes. Finite
uppers are 5, 10, 20, 100 and 1,000. Only one current configuration has a positive lower bound:
addition with every relevant value at least 10 and at most 100.

### Empty optional width choices

Exact enumeration of bounded positive integer support, including results, widths, equal-addend and
even-result constraints, proves these seven choices cannot witness the selected band:

| Operation | Upper bound | Largest-operand digits | Maximum available versus required witness |
| --- | ---: | ---: | --- |
| Subtraction | 20 | 1 | At most 9; needs above 10 |
| Addition | 100 | 1 | At most 18; needs above 20 |
| Subtraction | 100 | 1 | At most 9; needs above 20 |
| Addition | 1000 | 1 | At most 18; needs above 120 |
| Subtraction | 1000 | 1 | At most 9; needs above 120 |
| Subtraction | 1000 | 2 | At most 99; needs above 120 |
| Division | 100 | 1 | Dividend at most 9; needs above 20 |

Sixty current routes admit at least one such choice. Every one of the 127 bounded routes also has
a feasible choice, and none of these seven widths is forced by its source target. Compatibility and
direct resolution can remove empty choices without weakening targets or relying on exhausted retries.

Do not overgeneralize that exclusion: two-digit addition can exceed 120, single-digit multiplication
can exceed 20, and single-digit addition can exceed 10. The equal-addend example `10 + 10 = 20`
has minimum10 and maximum20; it is not an unresolved equal-bound singleton.

### Minimal construction and remaining consumer work

Extend the owner-local range resolver with a strict lower threshold on the maximum, using the full
catalog predecessor. Keep per-value bounds unchanged. The positive row samplers internally use
`x + y` for addition/subtraction and `x * y` for multiplication/division. Intersect their allowed
second-value intervals with `y >= P - x + 1` or `y >= floor(P / x) + 1`; equal addends require
`2*x > P`. Retain widths and all other mathematical restrictions. Validate declared negative, zero
and fixed-step branches too, even though current CCSS routes do not select them.

Source-band review must cover all 21 authored definitions: Kindergarten operation representation,
stories and fluency; Grade 1 stories, fluency and unknown-value tasks; Grade 2 fluency, written
operations, two-addend/even-addend tasks, stories and number lines; Grade 3 calculation, unknown
multiplication/division and same-unit stories; and Grade 4 measurement stories. The current pilot is
the starting source review, not a runtime isolation boundary.

The eight unspecified-upper measurement configurations include multiple-digit support exceeding the
largest ontology upper threshold. Preserve that path until source relevance establishes the finite
bands to use. Do not introduce an arbitrary cap or claim those routes are range-complete.

The arithmetic number-line view rounds its axis through at least10, so a task whose relevant maximum
is at most5 still displays ticks through10. Under the established interpretation this scale is
representational, not a proved operand-bound violation. A local simplification for the new convention
is a through5 axis with integer ticks, retaining the existing zero-origin suppression. Avoid ten
subdivisions of5, which would introduce half-unit ticks. Review other producers of the shared view
body before changing it; no new producer or global policy is required for this local projection.

All 110 current arithmetic tests pass. Exact bounded enumeration finds 22 feasible and seven empty
configuration domains. Seeded probes supplement that proof; they do not replace it.

## Next implementation checkpoints

1. Source-band review is [complete](canonical-range-source-review.md), including inherited endpoint
   constraints and all eight unspecified-upper measurement targets. The follow-up records source
   recommendations, support changes, secondary producers and a combined matching migration audit.
2. Resolve the already-open singleton and strongest-lower contracts where required. Upper-only
   progress must not claim full canonical lower/upper acceptance.
3. Add owner-local maximum-witness resolution, constructive sampling and compatibility together,
   with finite support/boundary proofs and direct/planned resolution parity. Keep generic matching,
   the Area allowlist and all unrelated dependency rules unchanged.
4. Activate reviewed target variants with the helper in a coordinated checkpoint. Capture complete
   before/after matching and source associations, review overlaps, and report sampling/weight effects.
5. Perform canonical regeneration, replay and independent Question/Solution VQA only after source
   readiness. No released dataset changes in this review.

Reproducible scripts, exact target/configuration mappings, support counts and test logs are in
`temp/canonical-range-2026-11-01/`: `comparison-review.ts/.json`, `arithmetic-review.ts/.json`,
`arithmetic-support.ts`, and their review notes. The committed tables above retain the substantive
results independently of those scratch artifacts.
