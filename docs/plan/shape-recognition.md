# Shape recognition classification

Follow-up to the [ontology VQA rerun](ontology-v029-vqa-rerun.md), authorized on 2026-09-27.
Scope: the two sorting views and their three CCSS K.MD.B.3 target permutations; baseline `77e749f`.

## Meaning and ownership

The pinned ontology preview `0.29.0-pre.2.59ff94cc3573` defines `Scope.ShapeProperties` through
physical features that permit or constrain manipulation: rolling, folding, or stacking. The
sorting exercises instead identify circles, squares, and triangles and group them by shared form.
They directly support `Area.ShapeRecognition`:

> Understanding how to visually identify and group multiple geometric shapes as belonging to the same category or concept based on their shared form and structural characteristics.

The user approved replacing the Scope with this Area in `sorting-classify-count`,
`sorting-classify-sort`, and their K.MD.B.3 target builders (`SPEC-2`, `SPEC-11`, `TSPEC-13`).
CCSS requests classifying objects into categories, counting each category, and sorting categories
by count; it does not require reasoning about physical manipulation.

The generators supply abstract categories, quantities, and sorting/counting relationships.
The views turn those categories into geometric shapes, so shape recognition is an independent
view-owned Area. It has no specialization overlap with generator-owned `ObjectSorting`.
Both views retain their existing Abilities and all other labels. The earlier numeral-system
ownership correction is preserved.

Only three source files change: the two view specs and the kindergarten target file. The
generator mathematics, renderers, schemas, checklists, dependency version, and evaluator remain
unchanged. K.G.A.3 and the isolated `test` spec/dataset/cache are outside this correction.

## Target identity and matching

The label-set changes produce the expected new target IDs (`TSPEC-5`):

| Task | Previous target | Corrected target |
| --- | --- | --- |
| Classify/count | `K.MD.B.3-classify-count~6f08223f` | `K.MD.B.3-classify-count~c6ccf9b3` |
| Least | `K.MD.B.3-sort-by-count~1bb99c29` | `K.MD.B.3-sort-by-count~5c7c2c25` |
| Most | `K.MD.B.3-sort-by-count~47cf0f93` | `K.MD.B.3-sort-by-count~bdc50867` |

Each retains its original generator/view path. Matching remains at 681 targets, 211 compatible
pairs, and 830 tuples. No other target, pair, disposition, or generation-plan hash changes.

Canonical affected generation renders ten images in four new shards and reuses 282 shards.
Six old sample identities retire. The corrected classify/count and most targets gain validation
allocations under the unchanged allocator, increasing the dataset from 1,934 to **1,938 samples**:
**1,632 train / 306 validation**. No unrelated sample identity changes.

## VQA outcome

The full cache-aware run makes ten requests at concurrency four, reuses 1,928 unchanged records,
and prunes the six obsolete records. **All ten replacement samples pass**, with every label
defendable, including `ShapeRecognition`. There are no new rejections or observed rate-limit errors.
The final totals are **1,911 pass / 27 fail / zero uncached**. The 27 other failures are unchanged.

All ten canonical images were inspected. Classify/count solutions display the correct quantities;
for example, the training solution has one circle, one square, and two triangles. The least
solution correctly selects the single square among three circles and two triangles. Most
solutions correctly select the largest category, and question choices remain neutral.

The four historical shape-property failures are resolved through target replacement, not reported
as passing revalidations of the old images. Their original evidence and passing replacement
records remain in the findings JSON. Two earlier numeral-system resolutions whose target IDs
also retired retain their historical pass timestamps and gain replacement-sample references.

**The separate NumericOrder issue remains open.** Most/least selection still does not ask for a
complete ordering of categories, including ties. The six current most/least samples pass VQA,
but that does not resolve the previously established semantic mismatch. No label or evaluator
rule was weakened to suppress it.

Subsequent follow-up on 2026-09-27: the [category-ordering extension](category-ordering.md)
resolves this remaining issue, preserving extremum selection and adding a complete-order view.
The preceding outcomes describe the shape-recognition checkpoint before that extension.

## Verification

Source correction: `603cac0`; VQA cache: `084af8c`, on `codex/ontology-v029-vqa-rerun`.

- CCSS repository checks and the build pass. All 3,074 tests across 527 files pass, and all
  generator coverage thresholds pass. Focused generator/view tests and numeral-ownership
  integration coverage also pass; existing tests suffice for this declaration-only correction.
- Strict label-architecture audit reports zero violations and 95 review items: 93 existing
  entries plus two view-owned-Area reviews introduced by this correction. Their ownership is
  reviewed above under `SPEC-11`; the new entries are not violations.
- Strict dataset audit exits 1 solely for the 27 retained failing verdicts. Dataset structure,
  renderer identity, duplicate/malformed records, missing keys, obsolete modules, and stale
  entries all report zero issues.
- Churn against `77e749f` is limited to ten added and six removed sorting identities. The other
  1,928 complete evaluation records and image hashes are unchanged, with no seed changes,
  attempt shifts, or image changes for retained identities.
- Split checks find no leakage or configured-task redundancy, and every matched tuple has
  training evidence. Of 208 validation-allocated tuples, 153 are represented; the same 55
  existing allocation gaps remain.
