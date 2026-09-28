# Recognizing shapes in realistic environmental objects

Follow-up to the [CCSS VQA report](ontology-v029-vqa-rerun.md), completed on 2026-09-28.
Baseline: `39da8f8` on `codex/ontology-v029-vqa-rerun`.

## Decision and scope

The user approved replacing the environmental illustrations with realistic AI-generated
object images while preserving the existing competency and labels. The five objects remain
a clock, window, table, pennant and honeycomb cell. The prompts identify the relevant surface:
clock face, window frame, tabletop, pennant, and opening of a honeycomb cell.

`PhysicalGeometry` describes geometric figures represented by manipulable physical objects.
Its examples do not restrict those objects to purpose-built classroom manipulatives. The
previous report's suggestion that environmental objects require a new descriptor was therefore
too restrictive. The chosen repair supplies clearer evidence of actual objects and their
materials, depth and outlines. Image format alone cannot distinguish physical-object
representation from an abstract diagram. The ontology definition and all target, generator,
view and artifact labels remain unchanged; the VQA results and residual uncertainty are recorded below.

The ten question/solution images cover seven targets through retained associations: the five
kindergarten environmental-shape variants and two grade-two shape-recognition variants.
K.G.A.1 asks for naming shapes in environmental objects; it does not specifically require
photographs. These images support that existing environmental context (`TSPEC-6`, `TSPEC-13`).
The checklist requires a visible, recognizable outline without adding an ontology exception
(`CHK-V6`). No new targets, schemas, mathematical payloads or generation-time randomness are
introduced.

## Fixed image assets

The built-in image generation tool produced five separate PNG assets. The original outputs
are copied without resizing or retouching to
[`public/icons/environment-objects/`](../../public/icons/environment-objects/).
The complete [prompt set](environmental-object-image-prompts.json) records the source, date,
file mapping, material cues, outline constraints and excluded answer text.
All five originals are 1,536 by 1,024 pixels; no image-generation retry was needed.

The view uses literal paths supported by the existing asset library, so the dependency graph
tracks the exact image bytes. Dataset generation only reads committed assets; it makes no image
generation requests. Both modes use the same object image and wording. Question Mode leaves
all choices neutral, and Solution Mode highlights the supplied answer. The image uses a fixed
frame with `object-contain` so its outline is preserved.

Seven renderer tests cover all five objects in both modes, deterministic output, malformed
payload rejection, and inclusion of every PNG in the view's dependency closure. The dependency
test guards against silently reusing stale canonical images or VQA results after asset changes.

## Baseline and verification

Baseline CCSS has 1,966 images: 1,940 passing judgments and 26 failures. Six of the ten affected
images fail only on `PhysicalGeometry`. All ten require fresh judgments because their images
and view/checklist evidence change. The other 1,956 judgments should be reusable.

Scope remains CCSS only, with canonical rendering and VQA concurrency four. Before/after image,
label, replay and cache evidence is retained under `temp/environmental-images-*`; matching
evidence is under `temp/spec-plans/ccss/environmental-images/`. The isolated `test` dataset,
cache and authored targets are outside this correction.

Implementation commit: `f4a09e9`. The seven focused renderer tests, production build and CCSS
repository checks pass. Matching retains 688 targets, 214 compatible pairs and 841 tuples,
with zero changed targets, routes, plans or dispositions. The strict label-architecture audit
reports zero violations, 97 review items and zero signals.

The complete coverage gate passes **3,498 tests across 547 files** and all configured thresholds
(97.14% statements, 94.02% branches overall; the unchanged environmental-shape generator has
94.44% statements and 90% branches). Two initial full runs encountered the previously recorded
Windows documentation-fixture cleanup failure. An overlapping coverage diagnostic also
invalidated the second run's temporary coverage directory. Commit `e2fef77` adds a bounded
cleanup retry; the final complete gate ran alone and passed. No production behavior changed
as part of that test-harness repair.

## Canonical images

Affected generation renders exactly **ten images**, writes one shard and reuses 290. The ten
image hashes change as intended. All 1,966 sample identities, labels, content/task fingerprints,
semantic plans, replay receipts, seeds and attempts are unchanged. The other 1,956 image hashes
are identical to baseline. Manual inspection covers both modes for every object: no relevant
outline or answer choice is clipped; questions are neutral and solutions highlight the correct
name. The clock contains no numerals, and the honeycomb prompt explicitly names a cell opening.

The split remains 1,654 training images and 312 validation images. All 841 matched tuples have
training evidence; 156 of the 211 validation-allocated tuples have validation evidence, leaving
the same 55 gaps. There is no cross-split leakage or within-split configured-task redundancy.

## VQA results and residual caveat

VQA at concurrency four makes **ten new judgments, all passing**, and reuses 1,956 judgments.
All six previous environmental failures pass on their existing identities. The 40 fresh label
checks contain **39 defendable, one uncertain and zero not defendable** verdicts; every general
check passes. Cache commit: `cdc345d`. There were no API or rate-limit errors and no VQA retries.

Nine `PhysicalGeometry` checks are defendable. The window question
`K.G.A.1-env-shapes~fdf278f5#shape-env-shapes#shape-env-shapes#train#question#inst:0`
is uncertain because the frame is a fixed architectural object rather than a handheld
manipulative. Its solution's check is defendable. The question passes under the existing policy,
which is unchanged; the raw caveat is retained in both the cache and findings history without
another request for the same evidence.

Current CCSS is **1,966 images: 1,946 pass, 20 fail and zero uncached**. The remaining failures
are three samples needing semantic review and 17 evaluator disagreements. The six former
environmental failures move to resolved history with their original evidence, increasing that
history to 55 records: 38 passing revalidations and 17 retired/replaced identities.

All 1,956 unaffected cache records are byte-identical, including judgments and timestamps;
no provenance-only update occurred. The isolated `test` pointer, cache and authored targets
remain unchanged. The strict dataset audit fails only for the 20 existing failed judgments;
all structural, renderer-identity, duplicate, malformed, missing, obsolete and freshness
checks are clean. No new failing sample or major implementation issue was found.

| Verification | Result |
| --- | --- |
| `npm run check -- --spec=ccss` | Pass |
| `npm run build` | Pass |
| `npm run test:coverage` | 3,498 tests / 547 files; all thresholds pass |
| `npm run audit:label-architecture -- --spec=ccss --strict` | Zero violations; 97 review items |
| `npm run validate:dataset -- --spec=ccss --concurrency=4` | Ten new passes, 1,956 reused; exits 1 for 20 existing flags |
| `npm run audit:dataset -- --spec=ccss` | Only the 20 unchanged raw verdicts fail |
| `npm run report:splits -- --spec=ccss` | No leakage or configured-task redundancy; 55 existing gaps |
| `npm run report:churn -- --spec=ccss --ref=39da8f8` | 1,956 unchanged images, ten intended image changes, no added/removed identities or seed/attempt changes |
