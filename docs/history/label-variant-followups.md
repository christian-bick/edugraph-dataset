# Label-variant integration follow-ups

The matching/generation implementation is merged through [PR #1](https://github.com/christian-bick/edugraph-dataset/pull/1), commit `56fe94f`. Its design and validation evidence remain in [label-variant-matching.md](label-variant-matching.md).

Follow-up order agreed on 2026-09-24:

1. **Integrate the feature.** Completed. Independent planner and persistence reviews found one bulk VQA cache-provenance issue, fixed before merge. Thirty focused tests pass with 100% evaluator line/function coverage; invalid row recipes fail before writes and strict audit remains read-only. GitHub's main validation and automatic explorer deployment both passed.
2. **Roll out the persisted formats.** Completed in the main checkout: canonical generation published 1,936 CCSS and 1,686 test images without rendering failures. All 3,622 image hashes and VQA keys match the verified feature-worktree baseline. An unchanged `--spec=test --affected` run proved clean inputs and skipped Docker startup entirely.
3. **Repair numeric feasibility.** Completed in commit `9233b2a`, independently reviewed. The two under-20 arithmetic-estimation routes retain their target labels and now generate across 50 seeds each. The payload carries canonical `numberDomain` context; generator values, proposed answers, and displayed rounded values respect both bounds. Existing valid `0..1000` draws retain their sampling path. The sole consumer is adopted. Fifty-six focused tests pass; the generator has 100% line and 93.33% branch coverage. Canonical regeneration adds six test images; all 3,622 existing image hashes and VQA keys remain unchanged. All 3,628 persisted recipes replay successfully. All 3,004 tests, 105 generator coverage thresholds, repository checks, and the production build pass. Fresh Gemini validation passes for all 14 arithmetic-estimation test images.
4. **Validate the complete production dataset.** Completed after renderer fixes in `c445606`. Full CCSS VQA initially found two view projection defects. Rounding now uses a precise marker, offset leader, and adjacent-tick cue; mass estimation depicts its six supported objects and the canonical approximate unit-reference relationship. Regression tests reproduce both failing seeds and check mode behavior, endpoint visibility, and reference totals. All 1,936 CCSS images now pass VQA, with zero missing, stale, malformed, duplicated, or failing entries in the strict read-only cache audit. All 28 affected test-view images pass fresh VQA. All 3,628 recorded recipes replay exactly, including 80 target associations; actual PNG hashes match persisted hashes. Regeneration changes only 12 CCSS and 14 test images in the two intended views, with no additions, removals, or plan changes. All 3,023 tests, generator coverage thresholds, repository checks, and the build pass. Declarations, targets, payloads, and checklists were unchanged by these visual fixes.
5. **Investigate dataset coverage last.** Completed. The local union originally lacked exact asset associations for five Grade 4 geometry targets. The unused `shapeAttributes` boolean gave identical classification payloads different bindings from earlier recognition targets. A single finite attribute configuration now distinguishes generic attributes, vertex count, angle count, and equal face count, with a declared generic default. This preserves ownership rules, exact bundle resolution, strict receipt admission, and deduplication. All 681 CCSS and 559 test targets have recorded evidence without new pixels or duplicate images. The split report uses persisted matching plans and validated associations, exposes entirely missing routes, and still audits training integrity when validation is empty. The allocation and sample-count policies are unchanged.

Final follow-up verification: all **3,045 tests in 525 files** pass, as do repository checks for both specs, the production build, the public ownership/spec gate, and the exact asset-index gate for all 681 CCSS target label sets. Production VQA and its strict read-only audit pass for all 1,936 images; all affected test views/generators also pass. The five target-pair regressions verify actual matching, canonical configuration, deduplication, stored association receipts, and exact asset evidence. These follow-ups are integrated through [PR #2](https://github.com/christian-bick/edugraph-dataset/pull/2).

Numeric changes and visual-validation fixes are separate from the completed matcher design. A local dataset rollout does not create a release tag or publish a new Hugging Face dataset.

## Coverage findings

The previous report counted primary training tuples only, hiding routes represented by associations and routes absent from both splits. The corrected report distinguishes physical images from represented tuples:

| Spec | Matched tuples | Primary training tuples | Training tuples represented | Allocated validation tuples | Validation tuples represented | Validation gaps |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| CCSS | 830 | 816 | 830 | 207 | 152 | 55 |
| test | 691 | 686 | 691 | 183 | 160 | 23 |

All 78 validation gaps exhaust their **implemented content domains** against the current same-view training corpus. This is not a claim that the underlying mathematical topics have no other possible exercises. We checked 1,000 deterministic attempts per gap (78,000 successful draws, zero nulls/errors) and then inspected every selected generator branch and its complete authored profile domain. The configurations have 69 singleton domains, three domains of size two, four of size three, and two of size four; every member has a training fingerprint witness. The bounded draws alone are not the exhaustion proof. This audit does not introduce payload inspection into compatibility decisions.

Representative complete domains:

| Generator/configuration | Implemented domain and implication |
| --- | --- |
| `writing`, `requireZero=true` | Exactly `{number: 0}`. A disjoint second payload would violate the target. |
| `measurement-mass-estimation`, kilograms | Backpack 3, chair 5, bicycle 12; all three already occur in training. Grams similarly exhaust crayon 10, apple 200, book 500. |
| `measurement-liquid-volume-estimation` | Four fixed container profiles, all present in training. |
| `shape-fraction-region`, circle/fourths/nonunit | Numerator 2 or 3; both occur in training. |
| `shape-classify-attributes`, selected line/angle criterion | One authored option array for each criterion. Recovered target associations share truthful existing artifacts. |
| `comparison`, positive nonzero less/greater through 1,000 | The selected branch uses range endpoints, despite computing a random magnitude. More mathematical diversity is possible, but more retries cannot change this implementation. |
| Other fixed shape/geometry/count/table branches | A selected shape, relation, composition tree, or primitive maps to a single payload. |

Validation has no images for 101 CCSS views (82 receive no validation allocation; 19 exhaust their content) and 99 test views (85 unallocated; 14 exhausted). The corresponding missing-label counts are 124 and 110. These are evaluation-coverage limitations, not missing production target assets.

Keep content disjointness and current sample counts. Increasing retries cannot fill these gaps. Broader validation coverage is a separate policy/content choice: allocate eligible tuples per desired view or label, reserve finite content before training, add mathematical profiles where appropriate, and define how intrinsically singleton targets are evaluated. Merely drawing the same content differently does not create independent validation evidence. The endpoint-only comparison branch is a concrete future diversity candidate.

Decision, 2026-09-24: generator content expansion is deferred. The estimate was 4–8 engineering
days for a focused numeric/object-profile increment, or 20–35 days for a broader expansion with
payload/view changes and validation. These are planning ranges, not a promise to eliminate all
78 gaps. No allocation-policy change or content implementation is scheduled by this consolidation.
