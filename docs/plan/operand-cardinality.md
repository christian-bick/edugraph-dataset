# Operand cardinality across nested expressions

Follow-up to the [CCSS ontology VQA rerun](ontology-v029-vqa-rerun.md), completed on 2026-09-28.
Content baseline: `791d038` on `codex/ontology-v029-vqa-rerun`.

## Agreed meaning

The user clarified that every individual number in the expression is an operand, including
numbers inside parentheses. Operand cardinality therefore counts occurrences across the complete
expression, rather than only the direct arguments of one nested operator.

| Expression | Operand occurrences | Count |
| --- | --- | ---: |
| `4 + 4` | `4`, `4` | 2 |
| `8 × (2 + 10)` | `8`, `2`, `10` | 3 |
| `(8 × 2) + (8 × 10)` | `8`, `2`, `8`, `10` | 4 |

In `8 × (2 + 10) = 96`, the result 96 is not an additional operand of the left-hand expression.
The grouped subexpression `2 + 10` is not counted again on top of its individual operands.
Repeated values count as separate occurrences. These are expression counts, not a count of
all numbers displayed anywhere on an exercise page.

The three-operand expression is visible in both flagged distributive samples, so their existing
`ThreeOperands` claims should remain. The expanded equivalent expression can exhibit four
operands without making the three-operand claim about the original expression false.

## Ontology clarification

Ontology `main` commit `a08f9a9` updates `OperandCardinality`, `TwoOperands`, `ThreeOperands`, and
`FourOperands`. The concrete definition template is:

> A mathematical expression with exactly N explicit operand occurrences, counted across all nested operations.

Comments contrast flat, nested, and expanded expressions. The wording is present in each
concrete definition, since VQA receives that label's own involvement statement and comment,
without expanding parent definitions. Identifiers, dimensions, structural relations, progression
relations, and labeling eligibility remain unchanged.

The complete ontology Docker gate passes, including the TypeScript client/ontology/documentation
checks, 49 Python tests, typing/lint, and installed wheel/sdist consumer checks. Comparing all
4,118 source triples verifies that only the four definitions and four comments changed.
The hosted release workflow also passes its build and Linux/Windows Python matrix.

## Adoption and validation

The baseline has 1,962 CCSS samples: 1,935 passing and 27 failed, with zero uncached.
Its operand-label inventory contains 661 `TwoOperands`, 63 `ThreeOperands`, and eight
`FourOperands` samples. Only CCSS is regenerated and revalidated, at concurrency four.
The isolated `test` dataset and cache remain outside this work.

The published [preview 0.29.0-pre.4.a08f9a911317](https://github.com/christian-bick/edugraph-ontology/releases/tag/preview-0.29.0-pre.4.a08f9a911317)
is installed with its exact tarball URL and integrity hash. The installed library contains the
clarified definitions. No generator, view, target, VQA prompt, or checklist changes are needed.
Dependency commit: `969ccdc`.

All 3,434 tests across 543 files and all coverage thresholds pass. Repository checks, the build,
and the strict label-architecture audit pass; the latter retains zero violations and 97 review
items. Matching is unchanged at 688 targets, 214 compatible pairs, and 841 tuples, with no
added/removed target, added/removed route, or changed retained semantic plan.

Canonical graph reconstruction reuses all 291 shards, writes no shard, and renders no image.
Byte hashes confirm that all 1,962 images are unchanged. Labels, mathematical/task fingerprints,
semantic plans, replay receipts, seeds, attempts, and sample identities are unchanged as well.
The isolated `test` pointer and cache remain byte-identical to the baseline.

The split remains 1,654 training / 308 validation images. Every matched tuple has training
evidence; 154 of 210 validation-allocated tuples have validation evidence. The same 56 coverage
gaps remain, with no train/validation leakage or within-split configured-task redundancy.

## VQA results

Exactly **732 affected judgments** are refreshed once at concurrency four, and all **1,230
unaffected cache records remain byte-identical**. Of the refreshed samples, 725 pass and seven
fail on unrelated labels. No API or rate-limit error occurs. The final cache contains
**1,934 pass / 28 fail / zero uncached**. The strict audit exits 1 solely for those 28 raw
verdicts; every structural, renderer-identity, freshness, duplicate, malformed, missing-key,
and obsolete-module check is clean. No failed sample has a general visual/math failure.

Both original nested-expression failures pass with unchanged images and `ThreeOperands` labels:

- `3.OA.B.5-distributive-property~bcbf8b0e#arithmetic-ops-triples#operations-boxes#train#solution#inst:0`
- `3.OA.B.5-distributive-property~bcbf8b0e#arithmetic-property-relations#operations-properties#val#question#inst:0`

All 40 replacement samples from the preceding completion/explanation work now pass. Across the
732 operand checks, 731 are defendable, one is uncertain, and none is rejected. The uncertain
verdict concerns a passing pictorial-division question: "Share 4 objects equally among 2 groups."
The evaluator recognizes the implied `4 ÷ 2` but asks for a symbolic expression. Its exact key is
`3.OA.A.2-partitive-division~1d471dcd#equal-groups-collection#operations-equal-groups#val#question#inst:0`.
That uncertainty remains in the cache and findings follow-up; no symbolic answer or forced retry
was added. It does not concern the resolved nested-expression count.

Two earlier `Formalization` disagreements also pass during this required refresh. Their images
and descriptor definitions are unchanged, so those outcomes are recorded as revalidation evidence,
not as consequences of the operand-definition correction.

### Other findings from the required refresh

Five previously passing samples receive new label rejections:

| Label / task | Review disposition |
| --- | --- |
| `SubtractionPlaceValuePartitioning`: model `90 − 60` as nine tens minus six tens | New semantic review: only one place is occupied, while the definition requires coordinating partial differences. The standard's multiples-of-ten restriction must be preserved when deciding the appropriate Area. |
| `StepsOf1`: picture-graph total question with counts 3, 2, and 5 | Extends the existing symbol-scale-versus-sequence review to the question; a one-item-per-symbol legend is not a displayed number sequence. |
| `EvenNumbers`: `7 + 7 = □` | Recurrence of the reviewed disagreement: the equal addends necessarily yield the even hidden result 14. |
| `Dollar`: `75¢ + 50¢` | Evaluator disagreement: the Dollar currency system includes cents and does not require a dollar symbol or major-denomination value. |
| `Square`: a two-by-four array of unit squares in the area solution | Extends the reviewed square-cell disagreement; the rectangular outer boundary does not remove the eight square units used for measurement. |

The existing `StepsOf1` solution and `Square` question rejections persist. All seven refreshed
failures retain their raw judgments. The new subtraction issue needs a semantic decision, rather
than an automatic caption or arithmetic change. It is documented in the original report alongside
the other remaining reviews. There are now 11 active semantic-review samples and 17 evaluator
disagreements. Historical records preserve the four newly passing findings, bringing that history
to 47 records: 32 passed revalidations and 15 retired identities.

The subsequent [whole-tens subtraction correction](whole-tens-subtraction.md) resolves the first
row with the user's approval: six `1.NBT.C.6` targets now use `Subtraction` with `PlaceValue`, while
identifiable partitioning remains supported. Its 16 replacement samples pass, and the old failed
identity is retained as history. The counts above describe this operand-cardinality checkpoint;
the rolling report records the current totals.

## Churn and commits

The churn report against `791d038` confirms all 1,962 images are stable, with no added/removed
identities or seed/attempt changes. Against original baseline `644254d`, the complete maintenance
run retains 1,837 identical images and 43 intended changes, with 82 added/56 removed identities.
The same three previously explained successor retry changes remain; this follow-up adds none.

- Ontology definitions on `main`: `a08f9a9`.
- Content dependency: `969ccdc`.
- VQA cache: `c645060`.
- Original rolling report: [ontology-v029-vqa-rerun.md](ontology-v029-vqa-rerun.md).
- Current and historical findings: [ontology-v029-vqa-findings.json](ontology-v029-vqa-findings.json).

Baseline, source-triple comparison, build/coverage logs, canonical/VQA logs, image comparison,
strict audit, splits, and churn evidence are retained under `temp/operand-cardinality-*`.
Matching evidence is under `temp/spec-plans/ccss/operand-cardinality/`.
