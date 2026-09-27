# Exact equation correctness

Follow-up to the [ontology VQA rerun](ontology-v029-vqa-rerun.md), authorized on 2026-09-27.
Scope: CCSS `1.OA.D.7-equal-sign`; baseline `5edbbc3`.

## Definition and correction

The ontology's [preview release `0.29.0-pre.2.59ff94cc3573`](https://github.com/christian-bick/edugraph-ontology/releases/tag/preview-0.29.0-pre.2.59ff94cc3573)
adds `CorrectnessEvaluation`, specializing `Evaluation`:

> Judging whether a statement, result, or solution is correct according to applicable facts, definitions, rules, or task requirements.

The installed bundle adds only this entity's four statements; no previous statements change.
The broader `MeasuringTime` definition from the preceding preview is preserved.
The dependency is pinned to the exact release asset with lockfile integrity.

CCSS 1.OA.D.7 requests understanding the equal sign and determining whether addition/subtraction
equations are true or false. The existing view already asks that exact question. This is a
correctness judgment, not a credibility estimate or an assessment of a displayed procedure.

The view's invariant Ability, the shared equal-sign target builder, and the generator test's
input fixture now use `CorrectnessEvaluation` instead of `PlausibilityEvaluation` (`SPEC-2`,
`SPEC-V5`, `TSPEC-6`, `TSPEC-13`). The view remains the Ability owner; the generator owns the
operation and numeric constraints. The mathematics, renderer, checklist, and other plausibility
tasks are unchanged. No applicability restriction or target removal suppresses a match.

Target IDs correctly follow the new label sets (`TSPEC-5`):

| Operation | Previous target | Corrected target |
| --- | --- | --- |
| Addition | `1.OA.D.7-equal-sign~6f678d9f` | `1.OA.D.7-equal-sign~e3a36789` |
| Subtraction | `1.OA.D.7-equal-sign~9cf60b5d` | `1.OA.D.7-equal-sign~f3b9f3e3` |

Both retain the `arithmetic-equation-judgment` / `operations-equation-judgment` path.
Matching remains at 681 targets, 211 compatible pairs, and 830 tuples. All other target
definitions, matching pairs, and generation-plan hashes are unchanged.

## VQA and split outcome

Canonical affected generation renders four images in one new shard and reuses 283 shards.
The old six equation sample identities retire. Under the unchanged deterministic allocator,
neither corrected target receives a validation allocation; previously the addition target did.
This changes the dataset from 1,936 to **1,934 samples**, with **1,632 train / 302 validation**.
It does not remove either competency or its training coverage.

The full cache-aware run makes four requests at concurrency four, reuses 1,930 records,
and prunes the six obsolete records. **All four new samples pass**, and each explicitly accepts
`CorrectnessEvaluation`. The final totals are **1,903 pass / 31 fail / zero uncached**, with no
new rejection or observed rate-limit error. The 31 other failures are unchanged.

Inspection of every new canonical image confirms neutral question choices and correct solution
selections: addition asks `5 + 8 = 13` and selects True for `18 + 2 = 20`; subtraction asks
`20 − 13 = 7` and selects False for `18 − 16 = 1`. Question and solution modes use independent
draws, as before.

The original failed addition question is recorded as resolved through target replacement,
not as a passing revalidation of the old image. The findings JSON preserves its original
verdict, replacement target, and passing replacement sample records.

## Verification

Commits: dependency `5720938`, label correction `582930e`, VQA cache `a61e7ae`, on
`codex/ontology-v029-vqa-rerun`.

- Repository checks for CCSS and the build pass. All 3,074 tests across 527 files pass,
  including existing true/false projection and operation/range tests; all generator coverage
  thresholds pass. The focused module run also passes all eight tests in three files.
- Strict label-architecture audit reports zero violations and the same 93 review items.
- Strict dataset audit exits 1 solely for the 31 retained failing verdicts. Structure,
  renderer identity, duplicate/malformed records, missing keys, obsolete modules, and stale
  entries all report zero issues.
- Churn against `5edbbc3` is confined to the four added and six removed equation identities.
  Every one of the other 1,930 complete evaluation records and image hashes is unchanged;
  there are no seed changes, attempt shifts, or image changes for retained identities.
- Split checks find no leakage or configured-task redundancy, and every matched tuple has
  training evidence. Of 206 validation-allocated tuples, 151 are represented; the same 55
  existing allocation gaps remain. The isolated `test` targets, dataset, and cache are untouched.

## Separate implementation review

The module review identified a pre-existing task-fingerprint concern: `resolveEquationClaim`
chooses the true/false claim from `payload.seed`, while the resolved view configuration is empty.
That choice changes the displayed equation but is absent from the configured-task fingerprint.
Review moving it into an ontology-neutral resolved choice under `SPEC-6` and `IMPL-V6`.
The current data has no detected leakage or redundancy; this observation is not a new VQA
failure and is separate from the completed Ability correction.
