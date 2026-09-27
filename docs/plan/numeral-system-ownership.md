# Numeral-system ownership correction

Follow-up to the [ontology v0.29 rerun](ontology-v029-vqa-rerun.md), authorized on 2026-09-27.
Scope: the numeral-system claims inherited by object-only counting and sorting tasks in CCSS.
Baseline: `1d5b58a`; the isolated `test` dataset remains outside this work.

## Evidence and correction

`Base10` describes positional numeral representations. The `counting-basic`,
`counting-classify-count`, and `counting-classify-sort` generators produce counts and category
relations, not notation. Their invariant `Base10` claim incorrectly reached conservation and
most/least tasks that contain only objects and word choices (`SPEC-5`, `SPEC-G3`, `SPEC-11`).

Remove that claim from the three producers. Views that display decimal numerals or require a
written numeral response own it instead. Conservation and most/least classification contribute
neither `Base10` nor `ArabicNumerals`. No matching exclusions or target removals are needed:
neither object-only target family requested a numeral system.
The user explicitly confirmed that requesting an answer in digits supports numeral labels even
while the question's answer box remains empty.

Integer counts, nonzero/nonnegative constraints, ranges, and parity describe the quantities
involved in a counting task and remain with their mathematical producer. A physical collection
can supply a numerical quantity without selecting any written numeral system.

| Consumer | Observable numeral evidence | Ownership |
| --- | --- | --- |
| `counting-conservation` | Two object arrangements and word choices; no numeral response | No numeral-system claim |
| `sorting-classify-sort` | Objects and shape-name choices; no numeral response | No numeral-system claim |
| `counting-objects-count-out` | A printed count requests how many objects to color; solution prints the count | View owns `Base10` |
| `counting-objects-parity` | The collection's count is printed in both modes | View owns `Base10` |
| `counting-objects-one-to-one` | Question requests written counting numbers; solution numbers the objects | View owns `Base10` |
| `counting-objects-simple` | Question explicitly requests the total in digits; solution prints it | View owns `Base10` |
| `sorting-classify-count` | Category response boxes; solution prints each count | View owns `Base10`; question explicitly requests counts in digits |
| `counting-objects-cardinality` | Compatible numeral-based counting view, currently without an active CCSS match | Preserve the numeral claim at the view and explicitly request the total in digits |

The classify/count, one-to-one, and cardinality instructions explicitly request digits rather
than adding decorative numerals or revealing a count (`IMPL-V5`, `CHK-V6`). Questions that require
a written answer still withhold it. This correction does not introduce mode-dependent labels or
change the global VQA policy.

The separate `ShapeProperties`, `NumericOrder`, and numeral-response evidence disagreements
remain tracked in the earlier report; they are not resolved by changing ownership.

## Verification

Completed on 2026-09-27. The fix is committed as `879fe74` on
`codex/ontology-v029-vqa-rerun`.

All ten object-only images (six conservation and four most/least tasks) now omit both numeral-system
labels. Comparison of all 48 affected samples confirms that the only annotation removal is
`Base10` from those ten images. The other 38 samples retain their complete annotation sets.
No target, sample identity, seed, or attempt changed.

The full cache-aware VQA run made **18 new judgments at concurrency four**, reused 1,918 records,
and pruned the 18 superseded keys. It ended with **1,892 passing and 44 failing CCSS samples**,
down from 51 failures. There are no uncached samples, new failures, or observed rate-limit errors.

| View | Samples | Failures before | Failures after |
| --- | ---: | ---: | ---: |
| `counting-conservation` | 6 | 5 | 0 |
| `counting-objects-count-out` | 12 | 0 | 0 |
| `counting-objects-one-to-one` | 6 | 0 | 0 |
| `counting-objects-parity` | 4 | 0 | 0 |
| `counting-objects-simple` | 14 | 1 | 1 |
| `sorting-classify-count` | 2 | 2 | 1 |
| `sorting-classify-sort` | 4 | 4 | 3 |

The remaining four rechecked failures reject `ShapeProperties`: the classify/count solution,
both least-selection modes, and the most-selection solution. The last also records uncertainty
about `NumericOrder`. These are the previously documented semantic issues, outside this correction.
The newly passing sorting images do not resolve those broader concerns.

The unchanged simple-counting validation question still has its earlier cached rejection of
`ArabicNumerals` and `Base10` despite explicitly requesting the answer in digits:

```text
K.CC.B.5-how-many~42b8a625#counting-basic#counting-objects-simple#val#question#inst:0
```

The user's confirmed interpretation supports those labels. Its image, checklist, and validation
context are unchanged, so the existing judgment was reused and remains visible as an evaluator
disagreement. No evaluator policy was changed or repeated requests made to seek a passing verdict.

| Check | Result |
| --- | --- |
| `npm run test:coverage` | 527 files / 3,074 tests pass, including eight new ownership/matching regression cases; all generator coverage thresholds pass |
| `npm run check -- --spec=ccss` | Pass |
| `npm run audit:label-architecture -- --spec=ccss --strict` | Zero violations; 93 existing review items |
| `npm run report:matching-diff -- --spec=ccss --plan=numeral-system-ownership` | 681 targets and all 830 matching tuples preserved; zero added/removed semantic pairs or changed dispositions; 17 generation plans reflect the ownership change |
| `npm run generate:dataset -- --spec=ccss --affected --concurrency=4` | 48 samples rendered across seven pairs; 10 shards replaced, 275 reused |
| `npm run validate:dataset -- --spec=ccss --concurrency=4` | 1,892 pass / 44 fail / zero uncached; exits 1 for the retained failures |
| `npm run audit:dataset -- --spec=ccss` | Exits 1 solely for the 44 failing verdicts; zero structure, renderer, duplicate, malformed, missing-key, obsolete-module, or stale-cache issues |
| `npm run report:churn -- --spec=ccss --ref=1d5b58a` | 1,932 unchanged images; four expected instruction changes; zero added/removed identities, seed changes, or attempt shifts |
| `npm run report:splits -- --spec=ccss` | 1,632 train / 304 validation; no leakage or task redundancy; every matched tuple has training evidence |
| `npm run check:docs` | Local references and rule citations pass; four existing external references could not be fetched in the restricted network environment |

The four changed images are the three one-to-one questions and the classify/count question.
Representative canonical images were inspected: instructions are legible and answer positions
remain empty. Cardinality has no active CCSS match and therefore produced no dataset changes.
The existing 55 validation-allocation coverage gaps remain unchanged. The isolated `test` dataset,
cache, and targets were not modified.
