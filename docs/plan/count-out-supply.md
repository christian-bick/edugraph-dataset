# Bounded count-out supply

Correction on 2026-09-28, following the [CCSS ontology VQA rerun](ontology-v029-vqa-rerun.md).
Baseline: `e086167` on `codex/ontology-v029-vqa-rerun`.
Implementation: `cb6fab8`. VQA cache: `1ade36b`.

## Contract and implementation

The available collection is a mathematical input to a count-out task. Both its cardinality and
the requested count must satisfy the configured numeric bounds. The user approved choosing the
available count uniformly from every integer in this inclusive interval:

```text
max(requested count, lower bound) <= available count <= upper bound
```

Equality is allowed throughout the interval, including below the upper boundary. For example,
requesting 6 under an upper bound of 10 permits a collection of 6, 7, 8, 9, or 10 objects.
Requesting 10 permits exactly 10. No additional remainder quantity or zero-valued answer is needed.
The current ontology preview already expresses the required input/result bounds.

The new `counting-selection` producer supplies `CountingSelectionProblem`: requested subset
cardinality `numObjects`, containing collection cardinality `availableCount`, the selected count
as `simpleAnswer`, and optional parity of that selected count. Pool sampling is not parity-filtered.
This precise object contract confines the additional mathematical quantity and random draw to
selection tasks (`IMPL-G7`, `IMPL-G8`). The existing `CountingProblem` remains unchanged.

The basic and selection producers reuse the existing one-draw quantity sampler. Only selection
draws the containing collection size. The shared type and `ViewTypeMap` entry passed type checking
before the producer and view were implemented independently (`IMPL-8`).

The existing `counting-objects-count-out` view consumes the available count directly; its seed
only controls presentation. It rejects missing, non-integer, non-positive, or insufficient counts.
Question Mode leaves every object unselected and requests the count; Solution Mode selects exactly
that many and identifies the selected count. The checklist now requires a sufficient collection,
including equality, instead of a strictly larger one (`IMPL-V8`, `IMPL-V11`, `CHK-V6`).
Minor accompanying repairs use singular wording for one object, reject unsupported arrangements,
and preserve the prompt's layout space in Solution Mode.

## Baseline and consumer adoption

The previous view added two to six spare objects independently of the generator's range.
Exact replay found four violations among twelve count-out samples, although VQA rejected only one:

| Arrangement / mode / split | Requested | Available | Upper bound | Old VQA |
| --- | ---: | ---: | ---: | --- |
| Scattered / question / train | 9 | 14 | 10 | Fail |
| Scattered / question / validation | 6 | 12 | 10 | Pass |
| Circular / solution / train | 18 | 23 | 20 | Pass |
| Linear / question / train | 20 | 25 | 20 | Pass |

The producer change preserves the existing target intent, capabilities, and view task. Consumer
adoption is confined to the three K.CC.B.5 count-out variants:

| View | Producer after correction |
| --- | --- |
| `counting-objects-count-out` | `counting-selection` |
| `counting-objects-simple` | `counting-basic` |
| `counting-objects-one-to-one` | `counting-basic` |
| `counting-conservation` | `counting-basic` |
| `counting-objects-parity` | `counting-basic` |
| `counting-objects-cardinality` | `counting-basic`; no current CCSS match |

The distinct named object contracts select the correct paths without target-label filters.
No target labels, target IDs, or ontology definitions change. The isolated `test` spec, dataset,
and VQA cache are outside this correction.

## Verification

The complete coverage suite passes **3,277 tests across 537 files**, and all generator thresholds
pass. Both `counting-basic` and `counting-selection` have 100% statement and branch coverage.
The focused checks include 49 generator/helper tests, 29 view tests, 28 payload-family contract
tests, and nine numeral-ownership integration tests. Seventy-two separately captured basic
generator cases retain byte-identical payload JSON and identical PRNG continuations.

The generator tests cover the full inclusive supply interval, equality below and at the maximum,
singleton domains, both numeric bounds, positive quantities, subset parity, and invalid or
infeasible ranges. View tests cover all three arrangements in both modes, equality, singular
wording, deterministic presentation, and malformed payload rejection.

`npm run check -- --spec=ccss`, `npm run build`, and the strict label-architecture audit pass.
The audit retains zero violations and 97 review items. Matching retains **683 targets, 212
compatible producer/view pairs, and 830 tuples**. Exactly three tuples replace `counting-basic`
with `counting-selection`; there are no target additions/removals, changed target labels,
changed retained semantic generation plans, or unsupported targets.

Read-only evidence is retained under `temp/count-out-root-*` and
`temp/spec-plans/ccss/count-out-supply/`. The original snapshot is
`temp/count-out-root-baseline.json`; the basic sampler comparison is in
`temp/count-out-agent-gen-basic-baseline.json` and its comparison log.

## Canonical generation and VQA

Canonical generation at concurrency four renders 1,932 images, writes 228 shards, and reuses 58.
The shared payload-type dependency causes this broad render pass. All **1,922 retained images**,
content fingerprints, labels, seeds, attempts, and replay receipts remain unchanged. There is no
unexpected duplicate-resolution or determinism change.

Ten count-out identities replace twelve old ones. All three variants retain training evidence;
scattered and circular variants retain validation evidence, while the new producer identity means
the linear variant is no longer allocated to validation. This is the existing deterministic split
policy, not a target restriction. The final dataset has 1,632 training and 300 validation images.
All 830 matched tuples have training evidence; 150 of 205 allocated tuples have validation evidence.
The same 55 validation-coverage warnings remain, with no cross-split leakage or task redundancy.

Exact replay and visual inspection verify all ten replacements:

| Arrangement | Split | Mode | Requested | Available | Upper bound |
| --- | --- | --- | ---: | ---: | ---: |
| Scattered | Train | Question | 4 | 5 | 10 |
| Scattered | Train | Solution | 3 | 5 | 10 |
| Circular | Train | Question | 18 | 20 | 20 |
| Circular | Train | Solution | 19 | 20 | 20 |
| Linear | Train | Question | 5 | 8 | 20 |
| Linear | Train | Solution | 17 | 17 | 20 |
| Scattered | Validation | Question | 2 | 10 | 10 |
| Scattered | Validation | Solution | 1 | 8 | 10 |
| Circular | Validation | Question | 8 | 12 | 20 |
| Circular | Validation | Solution | 19 | 19 | 20 |

VQA makes **ten live requests at concurrency four, all passing**, and reuses 1,922 judgments.
There are no API or rate-limit errors and no newly rejected sample. All retained evaluations,
validation timestamps, and VQA context hashes remain unchanged. The pipeline refreshes only
`generation_plan.inputHash` on 1,762 retained records; the other 160 retained records are identical.
The twelve retired producer identities are pruned from the cache.

The final CCSS cache has **1,905 pass / 27 fail / zero uncached**. The previous count-out rejection
is resolved through producer replacement and preserved as history, rather than reported as a
passing judgment on the old identity. The remaining 27 verdicts are unchanged: eleven samples
requiring semantic review and sixteen evaluator disagreements. No new major issue was found.

The strict dataset audit exits 1 solely for those existing failures. Structure, renderer identity,
duplicate/malformed/missing/obsolete/stale cache checks all report zero issues. Churn against
`e086167` is 1,922 stable images, zero changed retained images, ten added identities, and twelve
removed identities. The isolated `test` dataset pointer and cache files are unchanged.
