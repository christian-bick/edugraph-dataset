# Understanding a whole from its equal shares

Follow-up to the [CCSS VQA report](ontology-v029-vqa-rerun.md) and the related review in
[spatial composition](spatial-composition.md), completed on 2026-09-28.
Baseline: `db117e0` on `codex/ontology-v029-vqa-rerun`.

## Decision and scope

The user approved correcting the whole-from-shares view and all four corresponding `1.G.A.3`
target variants together. The task asks what the shown halves or fourths make and answers
“one whole.” It establishes an existing relationship between equal shares and their whole;
it does not combine related concepts into a new or more complex concept. The previous
`ConceptComposition` claim overstates the task (`SPEC-V5`, `TSPEC-6`, `TSPEC-13`).

Use the existing `ConceptualThinking` Ability, defined as understanding and connecting concepts
through their attributes, principles and relationships. Its narrower specializations concern
classification, composition, derivation, generalization or specification; none describes the
requested recognition of this part/whole relationship more accurately. The pinned library's
`inspectLabel` confirms that `ConceptualThinking` is eligible and has no constituent children
(`SPEC-2`, `SPEC-3`). No ontology or dependency change is needed.

The four target variants remain circles/rectangles crossed with halves/fourths. Their
`ShapeSynthesis`, `EqualShares` and `UnitFractions` claims remain, as do the concrete shape and
fraction labels. `shape-partition-whole-composition` keeps its existing task and renderer;
`shape-partition` supplies the same mathematical payload. The view has no schema alternatives
or applicability rules, and its Ability remains an invariant declaration (`SPEC-V6`). Its
view-owned `ShapeSynthesis` is evidenced by composing the shown pieces into the whole, without
claiming that the learner must draw an arrangement. The leaf checklist now describes the
observed answer and mode behavior accurately (`CHK-V6`).

The old eight images all passed VQA: their cached explanations conflated combining pieces
with combining concepts. Those raw judgments remain historical evidence, not a reason to keep
the incorrect label. This correction is not a resolution of an active failed sample.

## Baseline

Baseline: 1,966 images, 1,940 passing judgments and 26 failures. The eight whole-from-shares
images belong to four targets, each with only the `shape-partition` /
`shape-partition-whole-composition` route. Scope is CCSS only; isolated `test` assets stay unchanged.
Evidence is retained under `temp/whole-share-ability-*` and
`temp/spec-plans/ccss/whole-share-ability/`.

## Matching and static verification

Implementation commit: `6f29fe9`. Four target identities and their routes are replaced, with
no additional or missing capability paths. Every corrected target still has exactly one match:
`shape-partition` / `shape-partition-whole-composition`. Matching remains at 688 targets,
214 compatible pairs and 841 tuples; retained generation plans and dispositions are unchanged.

| Shape / shares | Previous target suffix | Corrected target suffix |
| --- | --- | --- |
| Circle / halves | `~c952a879` | `~8a743889` |
| Circle / fourths | `~4bab0d00` | `~0597f710` |
| Rectangle / halves | `~ba423cc2` | `~bc655b2a` |
| Rectangle / fourths | `~d0afc141` | `~26154679` |

The full coverage run passes **3,491 tests across 546 files**, with every configured threshold
met. The unchanged partition generator has 100% statement and branch coverage. The CCSS
repository checks pass; the strict label audit reports zero violations, 97 review items and
zero signals. Target distinctness remains at 24 advisory findings. No new tests are needed for
the declaration-only correction; the existing spec and payload-neutrality assertions now use
the corrected Ability, and existing renderer tests cover all supported share counts and modes.

## Canonical images and VQA

Affected regeneration renders **eight images**, writes one shard and reuses 290. Each corrected
target retains a question and solution. All eight replacement images are pixel-identical to
their corresponding former exercises, and their content and task fingerprints are unchanged.
Manual inspection confirms each circle/rectangle and halves/fourths pair in both modes, with
separate shares and an empty answer box in questions and a partitioned whole with “one whole”
in solutions. The target-label correction changes target/sample identities as intended.

VQA at concurrency four makes **eight new judgments, all passing**, and reuses 1,958 judgments.
All 48 new label checks are defendable, including all eight `ConceptualThinking` claims; all
general checks pass. There are no uncertain labels, API errors, rate-limit errors or new failures.
Cache commit: `227f7d4`.

The current CCSS dataset remains **1,966 images: 1,940 pass, 26 fail, zero uncached**. This closes
the semantic review of eight previously passing images, so neither the 26 active failed findings
nor the 49 resolved-failure history records change. The former `ConceptComposition` acceptance
and its explanations remain in the follow-up history as evaluator overacceptance.

All 1,958 retained images, labels, content/task fingerprints, semantic plans, replay receipts,
seeds and attempts are unchanged. Their cache records are byte-identical, including judgments
and timestamps; no provenance-only refresh is needed. The isolated `test` dataset pointer and
cache files are unchanged, as are its authored targets. No CCSS target or producing view now
declares `ConceptComposition`.

## Audit and split evidence

The strict dataset audit exits nonzero solely for the 26 existing recorded failures. Every
dataset-structure, renderer-identity, duplicate/malformed/missing/obsolete-cache and freshness
check reports zero issues. All expected sample identities have current judgments.

The dataset still contains 1,654 training and 312 validation images. All 841 matched tuples
have training evidence. The new target hashes allocate 211 tuples to validation instead of 212;
156 have validation evidence, leaving 55 gaps instead of 56. The former rectangle/halves target
was allocated to validation but had no independent payload; its replacement is not allocated.
This is an allocation change, not newly acquired validation evidence. No cross-split leakage
or within-split configured-task redundancy occurs, and sampling policy is unchanged.

| Verification | Result |
| --- | --- |
| `npm run check -- --spec=ccss` | Pass |
| `npm run test:coverage` | 3,491 tests / 546 files; all thresholds pass |
| `npm run audit:label-architecture -- --spec=ccss --strict` | Zero violations; 97 review items |
| `npm run validate:dataset -- --spec=ccss --concurrency=4` | Eight new passes, 1,958 reused; exits 1 for 26 existing flags |
| `npm run audit:dataset -- --spec=ccss` | Only the 26 unchanged raw verdicts fail |
| `npm run report:splits -- --spec=ccss` | No leakage or configured-task redundancy |
| `npm run report:churn -- --spec=ccss --ref=db117e0` | 1,958 identical retained images, eight added / eight removed identities |

All eight replacements also match the old pixels when compared by shape, share count and mode.
No new major issue was found. The remaining semantic reviews in the original report are unchanged.
