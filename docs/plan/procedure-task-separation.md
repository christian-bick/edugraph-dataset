# Property and hundreds-bundle task separation

Follow-up to the [CCSS ontology VQA rerun](ontology-v029-vqa-rerun.md), started on 2026-09-28.
Baseline: `6268e29` on `codex/ontology-v029-vqa-rerun`.

## Decision and scope

The user approved preserving useful completion exercises with appropriate labels and adding
distinct explanation tasks. The previous property and hundreds-bundle views requested only a
missing value but claimed `ProcedureUnderstanding`. That Ability requires explaining how and why
a procedure's steps, order, and conditions produce its result.

| Task | Completion Ability | Explanation Ability |
| --- | --- | --- |
| Apply a named arithmetic property to complete an equation | `ProcedureExecution` | `ProcedureUnderstanding` |
| Read the number represented by complete hundred bundles | `DirectUnderstanding` | `ProcedureUnderstanding` |

The existing five explanation target permutations keep their labels and IDs; five additional
completion permutations use the appropriate Ability. The application requirements in 1.OA.B.3
and 3.OA.B.5 do not explicitly require an explanation. Their explanation variants are the
deliberately retained supporting refinement agreed with the user, rather than an additional
claim about the standards' wording (`TSPEC-3`, `TSPEC-13`).

Only CCSS is regenerated and validated. The ontology version remains
`0.29.0-pre.3.dee88508f2f8`; the isolated `test` spec, dataset, and cache remain outside this work.

## Implementation

The two property leaves consume `ArithmeticPropertyProblem`, a required discriminated union for
commutative/associative relations and distributive relations. It includes the operation, law,
three operands, and result; the distributive branch also requires the combined factor and both
partial products. The type and view mappings passed type checking before producer and renderer
implementation proceeded independently (`IMPL-8`).

The new `arithmetic-property-relations` producer provides that complete contract. Its law selectors
require an explicitly selected law, preventing ordinary three-addend targets from entering the
property views. Bounded arithmetic is shared at the parent level with `arithmetic-ops-triples`;
the general producer retains its existing mathematical behavior and optional property capability.
Its existing box and vertical renderers already expose the law witness, so those valid completion
routes are preserved. Property views enforce their supported upper bound of 100 during matching.

The new producer also bounds the nonzero factor pair in a zero-multiplication relation. A final
result of zero does not justify an oversized intermediate calculation requested by an associative
explanation. This constraint is confined to the new property producer; the legacy sampler remains
unchanged. Existing CCSS property targets use nonzero operands.
Commutative witnesses require distinct outer operands, so the displayed swap changes the equation.
An existing different middle operand can be reordered without an extra random draw; an all-equal
draw returns `null` for the ordinary deterministic retry mechanism.

Matching checks the supported law/operation/zero profiles. Numeric feasibility stays in the
generator (`SPEC-G3`, `IMPL-G1`), including finite inclusive bounds, intermediate products, and
whether the requested range can contain a distinct commutative witness. The legacy distributive
sampler's unsupported zero and multiples-of-ten profiles are excluded from the new producer.

`operations-properties` now asks for completion under `ProcedureExecution`, while the separate
`operations-properties-explanation` leaf requests transformation steps and why they preserve the
result. Solution Mode supplies a method and reason using the canonical mathematical relation.
Neither generator chooses the learner action or authors explanation prose (`IMPL-G8`, `SPEC-V5`).

`place-value-hundreds-bundles` now claims `DirectUnderstanding`. Its ten-tens wording asks for the
represented number, correcting the previous mismatch between asking for a count of tens and
expecting 100. `place-value-hundreds-bundles-explanation` asks for the counting/grouping procedure
and its justification. Both use the unchanged `PlaceValueHundredsBundlesProblem` producer and
share parent-level block rendering (`SPEC-V6`, `IMPL-V9`).

## Verification evidence

The final complete coverage suite passes **3,434 tests across 543 files**, and every generator
coverage threshold passes. The new property producer has 94.11% statement and 95.23% branch
coverage; the legacy triples wrapper has 100% for both. Focused tests cover 2,700 law/range/zero/tens
combinations, visible swaps, hidden intermediate bounds, invalid payloads, and question/solution
separation. All **1,536** captured legacy payloads and PRNG continuations remain byte-identical.

`npm run check -- --spec=ccss`, `npm run build`, and the strict label-architecture audit pass.
The audit retains **zero violations and 97 review items**. Matching has **688 targets, 214
compatible producer/view pairs, and 841 tuples**. Exactly five completion targets are added;
no target is removed or silently relabeled. Sixteen routes replace five old routes, with no changed
retained semantic plans and no active target lacking a match.

The added property completion targets each have three truthful routes: the dedicated property
view and the preserved box and vertical views. Their explanation variants use only the new
explanation view and precise property producer. The two hundreds families each have exactly one
completion route and one explanation route. The ordinary three-addend target
`2.NBT.B.6-two-three-addends~71b01c5e` cannot enter either property view. Target distinctness finds
no new collision or overlap involving the changed families.

## Canonical generation and VQA

`npm run generate:dataset -- --spec=ccss --affected --concurrency=4` completes with 1,962 renders,
226 written shards, and 65 reused shards. The shared type change reaches 203 exact producer/view
pairs, but all **1,922 retained image hashes, labels, content/task fingerprints, semantic plan
hashes, replay receipts, seeds, and attempts are unchanged**. Forty new identities replace ten
old identities, bringing the dataset from 1,932 to 1,962 samples.

`npm run validate:dataset -- --spec=ccss --concurrency=4` requests exactly **40 new judgments** and
reuses 1,922. All 40 pass their Ability labels and general visual/math checks. **38 pass overall**;
two distributive tasks fail only on `ThreeOperands`, as documented below. Both original
`ProcedureUnderstanding` failures retire with passing completion and explanation replacements.
No service or rate-limit error occurs, and no judgment is forced merely to replace a failure.

The final cache contains **1,935 pass / 27 fail / zero uncached**. Its 27 active findings comprise
11 semantic-review samples and 16 evaluator disagreements. Of the retained cache records, 196
are byte-identical and 1,726 differ only in `generation_plan.inputHash`; evaluations, timestamps,
VQA contexts, and semantic hashes remain unchanged. The strict dataset audit exits 1 solely for
the 27 recorded failures, with zero structural, renderer-identity, duplicate, malformed, missing-key,
obsolete-module, or stale-cache issues. The isolated `test` pointer and cache are unchanged.

The two retired failed identities are:

- `1.OA.B.3-properties~1cdccfff#arithmetic-ops-triples#operations-properties#train#question#inst:0`
- `2.NBT.A.1b-hundreds~229993b4#place-value-hundreds-bundles#place-value-hundreds-bundles#train#question#inst:0`

The report retains these as historical retirements through task separation, not passing
revalidations of the original identities. There are now 43 resolved historical findings:
28 passing revalidations and 15 retired identities.

Canonical image inspection covers every task family, property law, and mode, including the
100-result boundary and all hundreds-bundle images. The matching, replay, and unit checks cover
the mathematical payloads independently of VQA.

## Operand-cardinality review at this checkpoint

**Subsequently resolved:** the [operand-cardinality follow-up](operand-cardinality.md) records
the user's expression-wide interpretation, ontology preview adoption, and passing revalidation
of both samples below. All 40 replacement samples now pass. The figures in this document
preserve the earlier completion/explanation checkpoint.

Two new distributive samples are rejected for `ThreeOperands`:

| Sample | Expression |
| --- | --- |
| `3.OA.B.5-distributive-property~bcbf8b0e#arithmetic-ops-triples#operations-boxes#train#solution#inst:0` | `6 × (10 + 1) = 66` and its distributive expansion |
| `3.OA.B.5-distributive-property~bcbf8b0e#arithmetic-property-relations#operations-properties#val#question#inst:0` | `8 × (2 + 10)` and `(8 × 2) + (8 × 10)`, with the result withheld |

The pinned definition says "A mathematical operation instance with exactly three explicit
operands", with the example `4 + 7 + 5`. The complete distributive expression has three numeric
inputs, while each individual multiplication or addition has two operands. The evaluator takes
the latter interpretation. The definition's flat-addition example does not resolve that nested
expression boundary, so these are semantic-review findings rather than confirmed evaluator errors.
The target and producer declarations remain intact pending that decision (`SPEC-3`, `TSPEC-13`).
No caption, unrelated expression, prompt exemption, or retry was added to make the flag disappear.

## Split and churn evidence

The current dataset has **1,654 training / 308 validation images**. Every one of the 841 matched
tuples has training evidence. Of 210 tuples allocated to validation, 154 are represented. The
existing 55 gaps remain, and the ten-tens explanation route adds one. Its generator has one
mathematical relation; after 50 duplicate attempts, generation links its validation request to
the existing training sample. That association is not treated as independent validation evidence.
The report confirms no cross-split leakage or within-split configured-task redundancy.

`report:churn` against `6268e29` confirms 1,922 stable retained images, no changed retained image,
seed, or attempt, and 40 added/ten removed identities. Against the original `644254d` baseline,
the full maintenance run has 1,837 stable retained images, 43 intended changes, and 82 added/56
removed identities. The same three earlier successor retry changes remain explained in the
[numeric-range follow-up](numeric-range-bounds.md).

## Commits and retained evidence

- Implementation: `d45c2bd`.
- VQA cache: `f8f6fc8`.
- Original rolling report: [ontology-v029-vqa-rerun.md](ontology-v029-vqa-rerun.md).
- Current and historical findings: [ontology-v029-vqa-findings.json](ontology-v029-vqa-findings.json).

Baseline snapshots, canonical/VQA logs, strict audit, split comparison, and churn evidence are
retained under `temp/procedure-root-*`. Matching and distinctness evidence is under
`temp/spec-plans/ccss/procedure-task-separation/`.
