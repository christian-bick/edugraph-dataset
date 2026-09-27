# Category ordering and extremum selection

Follow-up to the [ontology VQA rerun](ontology-v029-vqa-rerun.md), authorized on 2026-09-27.
Scope: CCSS category-count tasks; baseline `d59c376`. The isolated `test` targets, dataset,
and VQA cache are excluded by the user's instruction.

## Approved task separation

K.MD.B.3 requires classifying objects, counting each category, and sorting categories by count.
The previous `sorting-classify-sort` images only selected one category with the fewest or most
objects, despite claiming `NumericOrder`. All six baseline images passed VQA, but that did not
establish the requested complete order.

The user approved preserving extremum selection, extending the mathematical generator, and
separating the view logic. `K.MD.B.3-sort-by-count` now requests complete ascending or descending
orders. `K.MD.B.3-select-by-count` preserves least/most selection as an explicitly authored
supporting subskill of this standard, not as a separately stated CCSS requirement. K.CC.C.6
compares two groups and is not used as a substitute for selection among three categories.

## Capability ownership and shared contract

| Claim or decision | Owner | Observable or mathematical evidence |
| --- | --- | --- |
| Integer numeration, object sorting, integer and quantity bounds | `counting-classify-sort` generator | Three positive category counts and their total |
| Least/most relation | Generator relation schema | A unique selected minimum or maximum, with both endpoint sets calculated |
| Ascending/descending relation | Generator relation schema | Complete ordered groups of categories, allowing equal counts |
| Full numeric order | `sorting-classify-order` view | Every category requested and shown in magnitude order |
| Shape recognition | Each view | Circles, squares, and triangles identify the abstract categories |
| Procedure execution | Each view | Selecting an extremum or constructing a complete order |
| Arabic numerals and base ten | Ordering view | Explicit digit-count response in Question Mode and numerical counts in Solution Mode |

`NumericOrder` has no specialization overlap with the generator's `NumerationWithIntegers` or
`ObjectSorting`. Its canonical mathematical witness comes from the generator; only the complete
ordering projection claims this independent Area (`SPEC-11`, `IMPL-G8`, `IMPL-V11`). The existing
`AscendingOrder` and `DescendingOrder` scopes supply the direction, so it is recorded in the
resolved generator configuration and payload rather than chosen by unrecorded view randomness.

The shared payload carries counts, total, the mathematical relation, ascending equivalence
groups, and minimum/maximum category sets. These replace the task-specific single `answer`.
Both leaves accept the complete common payload. Positive compatibility rules over selected
generator labels select the intended production path; they do not narrow a structural output
union or conceal a runtime rejection (`SPEC-1`, `SPEC-V6`, `IMPL-G6`). Direct renderer tests
also cover every relation profile and tied endpoints. Canonical least/most tasks preserve a
unique answer; ordering tasks allow two categories with equal counts and retain at least two
distinct counts so the direction has a visible witness.

The ordering leaf also requires an explicit `NumericOrder` target claim (`SPEC-V7`). Its
independent ordering task must be requested rather than added incidentally to a broad counting
target. The view still supplies the positive capability; this applicability rule supplies no label
and does not parameterize rendering.

| Consumer | Targets | Adoption | Verification |
| --- | --- | --- | --- |
| Existing `sorting-classify-sort` | New `K.MD.B.3-select-by-count` supporting subskill | Read canonical endpoint sets; preserve neutral question choices and highlighted solutions | Endpoint, tie, mode, matching, and object-only notation tests |
| New `sorting-classify-order` | Corrected `K.MD.B.3-sort-by-count` | Request all categories; show ordered counts and explicitly grouped ties | Complete partitions, both directions, digit response, mode, matching, and rendering tests |

Each leaf has its own minimal checklist and thin wrapper, with shared rendering at the sorting
category level (`SPEC-V6`, `IMPL-V9`, `CHK-V6`). No evaluator instructions or global checklists
change. The classify/count view and its target are outside this correction.

The independent review also found a small inherited range defect: the generator applied a higher
minimum only to the total while starting each category at one. It now initializes every category
to the resolved integer minimum and the total to at least three times that minimum (`IMPL-G4`).
Impossible ranges return `null`. The current CCSS minimum of one retains the same sampling and
random-number sequence. Direct and schema tests cover the higher minimum and impossible bounds.
The existing advertised `NumbersLarger10` with an upper bound of 20 is numerically infeasible for
three categories plus their total; it now fails safely, and no current CCSS target requests it.

## Baseline and verification

The baseline has 681 active targets, 211 compatible pairs, and 830 matched tuples. Its 1,938
samples contain 1,911 passing and 27 failing verdicts; all six affected sorting samples pass.
The strict label audit reports zero violations and 95 review items. Baseline cache records,
image identities, and matching plans are preserved under `temp/category-ordering-*` and
`temp/spec-plans/ccss/category-ordering/`.

Implementation is complete. Focused verification passes 86 tests in nine files and the typecheck.
The full build passes with the existing chunk-size warning. Final matching has 683 targets,
212 compatible pairs, and 832 matched tuples: exactly four new targets replace two old targets,
with no unrelated target or generation-plan changes. The label audit has zero violations and
97 review items. The two additional entries cover the new view's independent Areas and explicit
`NumericOrder` target precondition; their ownership and applicability are justified above.

The full coverage suite passes **3,143 tests across 530 files**, with all generator thresholds
passing and 100% statement/branch coverage on the changed generator. CCSS repository checks
also pass. Independent generator/view review found no remaining blocker for these CCSS paths.
Documentation references and rule citations pass, with four existing external-fetch warnings.

## Targets, canonical images, and VQA

| Task | Target | View |
| --- | --- | --- |
| Least | `K.MD.B.3-select-by-count~2ca2ef8c` | `sorting-classify-sort` |
| Most | `K.MD.B.3-select-by-count~501842ea` | `sorting-classify-sort` |
| Ascending order | `K.MD.B.3-sort-by-count~610728d1` | `sorting-classify-order` |
| Descending order | `K.MD.B.3-sort-by-count~98f9e643` | `sorting-classify-order` |

These replace `K.MD.B.3-sort-by-count~5c7c2c25` and `~bdc50867`, as required by changed
competency labels and content-hashed target identities (`TSPEC-5`). The four targets create ten
images: eight training and two validation. Six previous sorting identities retire. The full
dataset grows from 1,938 to **1,942 images: 1,636 training / 306 validation**. Least selection
now receives validation allocation instead of most selection; neither ordering target is
allocated to validation under the unchanged allocator.

The shared problem-type edit invalidates broad canonical dependencies. The affected run therefore
renders all 1,942 images at concurrency four, writes 221 shards, and reuses 66 shards. This
broader execution produces **zero image changes for the 1,932 retained sample identities**.
Their seeds, attempts, semantic generation-plan hashes, validation contexts, evaluation contents,
and judgment timestamps are unchanged. The pipeline refreshes only `generation_plan.inputHash`
for 1,730 retained cache records. These provenance updates explain the broader cache-file diff;
they are not new VQA judgments or changes to the mathematical generation plans.

Cache-aware VQA prunes six obsolete sorting records, reuses 1,932 judgments, and makes **ten
requests at concurrency four**. **All ten pass with every label defendable**. There are no
newly rejected samples or observed API rate-limit errors. Final totals are **1,915 pass / 27 fail /
zero uncached**. The 27 pre-existing findings are unchanged; resolving this ordering concern
does not reduce that count because its old six images already passed despite the coverage defect.

All ten new canonical images were inspected, and their promoted hashes match the inspected
renders. The ascending solution shows Triangle 1 < Circle 2 < Square 6. The descending solution
shows Circle 2 = Square 2 > Triangle 1. The six extremum images preserve a unique answer, and all
question responses are neutral or blank. No decorative numerals were added to object-only tasks.

Strict audit exits 1 solely for the 27 retained failing verdicts; dataset structure, renderer
identity, duplicate/malformed/missing/stale cache entries, and obsolete modules all have zero
issues. Split checks find no leakage or configured-task redundancy. All 832 matched tuples have
training evidence; 153 of 208 validation-allocated tuples are represented, with the same 55
existing allocation gaps. Churn against `d59c376` is exactly ten added and six removed identities.
Against the full maintenance baseline `644254d`, there are 1,895 stable images, 29 expected prior
render changes, 18 added and 12 removed identities, with no retained seed or attempt changes.

Source commit: `b5e11c6`. VQA/cache provenance commit: `a41af55`. The original report and
machine-readable findings link this correction and retain the historical replacement judgments.
The `test` targets and cache are unchanged from `644254d`, and its dataset pointer is unchanged
from the start of this follow-up.
