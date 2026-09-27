# MeasuringTime definition correction

Follow-up to the [ontology VQA rerun](ontology-v029-vqa-rerun.md), authorized on 2026-09-27.
Scope: CCSS tasks involving `MeasuringTime`; baseline `c0f2798`.

## Definition and dependency

The ontology's [preview release `0.29.0-pre.1.6282636d6637`](https://github.com/christian-bick/edugraph-ontology/releases/tag/preview-0.29.0-pre.1.6282636d6637)
contains the agreed definition:

> Determining, representing, or comparing times of day, calendar dates, or elapsed durations using temporal reference systems and units.

`package.json` pins this exact release asset, with its integrity recorded in the lockfile.
Comparing the installed bundled ontology statements against v0.29.0 confirms one changed record:
the `MeasuringTime` definition. Its duration example, entity identity, and relations are unchanged.

The Area now covers clock reading and construction, calendar dates, and elapsed-time tasks.
This implements the user's intended broad parent concept; finer point/interval specializations
can be introduced later. Existing generator and target labels are appropriate under the revised
definition. No view, checklist, target, or VQA policy change is required.

## VQA outcome

Completed on 2026-09-27. All 58 affected samples accept `MeasuringTime`, including every one of
the 40 clock-reading/construction samples. The definition mismatch is resolved.

The full cache-aware run made 58 new judgments at concurrency four and reused the other 1,878.
It ended with **1,904 passing / 32 failing / zero uncached CCSS samples**, down from 44 failures.
All 15 previously failing time samples now pass; three previously passing arithmetic samples
received new `SingleStep` rejections. There were no observed rate-limit errors.

| Generator | Samples | Failures before | Failures after |
| --- | ---: | ---: | ---: |
| `time` | 40 | 11 | 0 |
| `time-elapsed` | 4 | 0 | 0 |
| `time-interval-arithmetic` | 14 | 4 | 3 |

The original clock finding concerned the eleven failures among 40 reading/construction samples.
The four arithmetic failures were previously classified as evaluator disagreements about task
granularity. Their passing revalidation and the three new rejections show that this disagreement
persists across different samples; they do not indicate a content change.

The three new rejections concern hour rollover in one addition: `5:46 + 36 minutes`,
`5:45 + 41 minutes`, and `8:42 + 32 minutes`. Inspection of their canonical question/solution
images confirms one requested time addition and correct results. The evaluator treats carrying
minutes into the next hour as a separate semantic operation. These remain recorded as evaluator
disagreements, consistent with the prior review; no repeated requests were made to chase passes.

```text
3.MD.A.1-time-interval-word-problems~2cc9b380#time-interval-arithmetic#time-interval-word-problem#train#question#inst:0
3.MD.A.1-time-interval-word-problems~2cc9b380#time-interval-arithmetic#time-interval-word-problem#train#solution#inst:0
3.MD.A.1-time-interval-word-problems~3b716d20#time-interval-arithmetic#time-interval-word-problem#train#solution#inst:0
```

The separate `StepsOf5` concern remains open even though the current clock verdicts pass.

## Verification

The dependency update is committed as `5f7c5f0` and the VQA cache as `100dabb` on
`codex/ontology-v029-vqa-rerun`.

`npm run check -- --spec=ccss` and `npm run build` pass. The complete coverage suite passes
all 3,074 tests across 527 files, and all generator coverage thresholds pass. The first run had
one Windows `EPERM` error while removing a temporary documentation-test fixture; one complete
retry passed without source changes.

The strict label-architecture audit reports zero violations and the same 93 review items.
All 681 targets, 211 compatible pairs, and 830 matching tuples are preserved.

Canonical `generate:dataset -- --spec=ccss --affected --concurrency=4` reconstructs the graph
for the new library provenance. It changes 59 non-render nodes (the definition and 58 VQA
records), reuses all 285 shards, and renders no images. The split remains 1,632 train / 304
validation, with no leakage or task redundancy and every matching tuple represented in train.
The existing 55 validation-allocation coverage gaps remain unchanged.

Strict `audit:dataset -- --spec=ccss` exits 1 solely for the 32 recorded failing verdicts:
dataset structure, renderer identity, duplicate/malformed records, missing keys, obsolete modules,
and stale entries all report zero issues. `report:churn -- --spec=ccss --ref=c0f2798` confirms
all 1,936 images are unchanged, with no added/removed identities, seed changes, or attempt shifts.
A full before/after record comparison also confirms unchanged generation plans and labels,
and unchanged evaluation records for all 1,878 unaffected samples. The isolated `test` dataset
and cache were not modified.
