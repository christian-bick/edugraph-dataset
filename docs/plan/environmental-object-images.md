# Recognizing shapes in realistic environmental objects

Follow-up to the [CCSS VQA report](ontology-v029-vqa-rerun.md), started on 2026-09-28.
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
view and artifact labels remain unchanged; new VQA judgments will test this interpretation.

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
