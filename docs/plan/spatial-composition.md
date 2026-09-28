# Spatial assembly and concept composition

Follow-up to the [CCSS VQA report](ontology-v029-vqa-rerun.md), completed on 2026-09-28.
Baseline: `9c31272` on `codex/ontology-v029-vqa-rerun`.

## Decision and implementation

The user approved preserving `ShapeSynthesis` and replacing the unsupported
`ConceptComposition` claim with the spatial Ability actually elicited. K.G.B.6 and 1.G.A.2
request construction, including a second composition stage in Grade 1
([K.G.B.6](https://www.thecorestandards.org/Math/Content/K/G/),
[1.G.A.2](https://www.thecorestandards.org/Math/Content/1/G/)). Selecting a piece name
does not demonstrate that construction (`TSPEC-6`, `TSPEC-13`, `SPEC-V5`).

- Retain `shape-compose-shapes` as the selection/prediction task, with `SpatialImagination`.
- Add `shape-compose-shapes-construction`, invariantly declaring `SpatialGeneration`. It asks
  learners to draw an arrangement with piece boundaries; solutions show a valid arrangement.
- Correct the construction target builders in Kindergarten and Grade 1 while preserving their
  shapes and single/multiple composition levels. Do not invent selection targets for standards
  requesting construction (`SPEC-V6`, `TSPEC-1`).
- Extend the existing mathematical producer with explicit geometric regions for every component,
  intermediate and whole. Coordinates and partitions are generator-owned structured evidence;
  colors, projection, workspace, prompts and response layout remain view-owned (`IMPL-G8`).

The new `ShapeAssemblyProblem` extends the existing tree contract with a corresponding geometric
assembly. Each assembly node holds a polygon, circular sector, box, or radial solid and the
regions composing it. All coordinates share the whole's mathematical coordinate frame. There
are no pixels, colors, instructions, answer strings, or view choices in that model.

| Consumer | Contract / task | Adoption |
| --- | --- | --- |
| `shape-compose-shapes` | Existing `ShapeComposeShapesProblem`; predict suitable components | Accepts the extended producer structurally; retain its layout and selection behavior |
| `shape-compose-shapes-construction` | `ShapeAssemblyProblem`; construct one or two stages | Render actual component geometry, empty construction spaces, and solved arrangements |

Shared composition vocabulary belongs at the view category level. The construction renderer
projects supplied regions and never derives a new partition (`IMPL-V8`, `IMPL-V9`). Polygon area,
solid volume, containment and disjointness tests verify the producer's construction evidence.

The separate `shape-partition-whole-composition` task asks for the fraction relationship “one
whole,” not a spatial arrangement. Its `ConceptComposition` interpretation needs its own review;
this change does not silently turn the four 1.G.A.3 description targets into construction tasks.

Baseline and verification artifacts are retained under `temp/spatial-composition-*` and
`temp/spec-plans/ccss/spatial-composition/`. The isolated `test` targets, dataset and cache are
unchanged. No ontology or dependency change was required.

## Implementation and static verification

The baseline contains 1,966 images, 1,939 passing judgments and 27 failures. The composition
producer accounts for 42 images. Its only existing production consumer is the selection view;
the construction leaf becomes the sole compatible consumer of the corrected CCSS targets.
The selection capability remains available and tested without adding unsupported prediction
competencies to the standards.

All 24 authored Kindergarten/Grade 1 construction permutations are corrected. Production
normalization yields 21 replaced targets and 21 replaced routes, preserving the existing shared
competency associations. Matching remains at 688 targets, 214 compatible pairs and 841 tuples.
There are no changed retained semantic plans or dispositions. Target distinctness remains at
24 advisory findings; the strict label audit reports zero violations, 97 review items and no signals.

The contract typecheck, repository checks and build pass. All 94 focused tests pass, including
22 independent geometric checks across every shape and composition level. These check positive
area/volume, the whole's expected measure, volume-preserving cubic components, equal total
measure and sampled containment/disjointness at every intermediate. Construction tests exercise
both modes for all 22 cases, keep solutions out of question workspaces, and reject inconsistent
or nonfinite geometry. Planner tests verify that prediction cannot satisfy construction and
neither task claims `ConceptComposition`.

Full coverage passes **3,491 tests across 546 files** and every configured threshold. The
generator has 95.12% statement and 94.59% branch coverage. Because the repository-wide coverage
configuration includes generator entry points, a separate focused coverage run verifies the new
geometry helper: 97.33% statements, 94.59% branches, and 100% functions/lines.
Implementation commit: `5361115`.

## Rendering and visual inspection

The shared type extension triggers broad canonical regeneration: 1,966 rendered images,
224 written shards and 67 reused shards. The 42 construction images replace 42 selection
identities; the other 1,924 images are pixel-identical to the baseline.

Manual inspection covers flat and solid shapes, curved pieces, both question and solution modes,
and single/two-stage tasks. Examples include six triangles forming a hexagon, two rectangles
forming a square, two prisms forming a cube, two half-cones forming a cone, and two shorter
cylinders forming a cylinder. Two-stage pages provide a separate workspace and solved arrangement
for each intermediate before joining those intermediates. Questions leave their construction
spaces empty; solutions make the component boundaries visible. Piece trays preserve relative
scale within each stage, and long pages expand without clipping.

Inspection found hidden lower-face edges leaking onto curved cone surfaces. Commit `48f0e96`
corrects outward face winding and culls back faces in the projection renderer. A regression checks
the three visible cube faces and excludes the cone's hidden base. A second canonical generation
renders only the 42 construction images, writes one shard and reuses 290. The repair happened
before paid VQA, so it did not require repeated judgments.

## VQA and retained-data verification

VQA at concurrency four makes **42 new judgments, all passing**, and reuses 1,924 current
judgments. All 168 new label checks are defendable, including every `ShapeSynthesis`,
`SpatialGeneration`, and single/multiple-composition claim. All general checks pass. There are
no uncertain labels, new rejections, API errors, or rate-limit errors. Cache commit: `6348f13`.

The current CCSS dataset has **1,966 images: 1,940 pass, 26 fail, zero uncached**. The failed
hexagon selection identity retires with its corrected target and task. Its two replacement
construction images pass, and its original verdict remains in resolved history. It is not
counted as a passing retry of the former exercise. The other 26 failures are unchanged.

For all 1,924 retained identities, image hashes, labels, content/task fingerprints, semantic
plans, replay receipts, seeds, attempts, evaluation results and validation timestamps are
unchanged. Exactly 204 cache records remain byte-identical; 1,720 refresh only
`generation_plan.inputHash` to reflect the shared source dependency. No retained image or
judgment changes, and no obsolete cache key remains. The isolated `test` dataset pointer and
all its cache files are byte-identical to baseline.

The strict dataset audit exits nonzero solely for the 26 recorded failures; every structural,
renderer, cache-integrity and freshness check reports zero issues. The split remains 1,654
training and 312 validation images. All 841 matched tuples have training evidence; 156 of 212
allocated tuples have validation evidence, preserving the 56 existing gaps. There is no
cross-split leakage or within-split configured-task redundancy. The construction generator's
fixed geometry does not create independent validation examples; the existing deduplication
policy remains in force.

| Verification | Result |
| --- | --- |
| `npm run check -- --spec=ccss` | Pass |
| `npm run test:coverage` | 3,491 tests / 546 files; all thresholds pass |
| `npm run build` | Pass; existing chunk-size warning |
| `npm run validate:dataset -- --spec=ccss --concurrency=4` | 42 new passes, 1,924 reused; exits 1 for 26 existing flags |
| `npm run audit:dataset -- --spec=ccss` | Only the 26 unchanged raw verdicts fail |
| `npm run report:splits -- --spec=ccss` | No leakage or configured-task redundancy |
| `npm run report:churn -- --spec=ccss --ref=9c31272` | 1,924 identical retained images, 42 added / 42 removed identities |

## Related review: identifying a whole from equal shares

`shape-partition-whole-composition` still supplies `ConceptComposition` to four `1.G.A.3` targets:
`~4bab0d00`, `~ba423cc2`, `~c952a879`, and `~d0afc141`. All eight images currently pass VQA;
their judgments and images are unchanged. These exercises ask what halves or fourths make,
with the answer “one whole.” The standard requests describing that fraction relationship,
so changing it to `SpatialGeneration` would change the intended competency (`TSPEC-6`).

Review the appropriate Ability for recognizing or explaining the part/whole relationship
separately. This concern is recorded in the original report and machine-readable follow-up,
without inventing failing verdicts for currently passing images or weakening the construction fix.
