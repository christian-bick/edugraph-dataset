# Whole-tens subtraction and identifiable partitioning

Follow-up to the [CCSS ontology VQA report](ontology-v029-vqa-rerun.md), completed on 2026-09-28.
Baseline: `e39b9f4` on `codex/ontology-v029-vqa-rerun`.

## Decision and scope

The user approved preserving `SubtractionPlaceValuePartitioning` where the task demonstrates
that strategy and using `Subtraction` together with `PlaceValue` otherwise.

[1.NBT.C.6](https://www.thecorestandards.org/Math/Content/1/NBT/) requires whole-tens subtraction
using models and place-value or related strategies, a written method, and explanation. It does
not require decomposing operands into place-value parts and coordinating partial differences.
The shared Grade 1 builder overstated that requirement (`TSPEC-6`, `TSPEC-13`). Its six
permutations retain their three learner tasks and positive/zero-result variants, replacing
only the overly specific Area with `Subtraction` and `PlaceValue`.

The generator's `operation` schema previously admitted partitioning together with its special
whole-tens profile, whose presentations subtract tens directly (`SPEC-G3`). A compatibility
guard excludes that conjunction before generation. General partitioning and regrouping
capabilities remain available. The ontology definition, evaluator prompt, and checklists remain
appropriate and need no changes.

## Contract review and implementation plan

The canonical `PlaceValueArithmeticProblem` contract is unchanged (`IMPL-G6`, `IMPL-G8`):

| Fields | Disposition |
| --- | --- |
| `num1`, `num2`, `operation` | Canonical mathematical inputs |
| `answer`, `operands`, `result`, `regrouping`, `strategySteps` | Calculated values and structured strategy evidence |
| `operandProfile` | Semantic context for the mathematical operand family |
| Prompts, blank placement, explanation prose, layout | View-owned; absent from this payload |

All three existing consumers accept this unchanged contract:

| Consumer | Target task | Effect |
| --- | --- | --- |
| `place-value-arithmetic-model` | Concrete place-value model | Whole-tens targets use the corrected Areas; general partitioning stays supported |
| `place-value-arithmetic-written-method` | Relate the model to a written method | Same correction, preserving `Formalization` |
| `place-value-arithmetic-explanation` | Explain a place-value strategy | Same correction, preserving `TextualArticulation` |

Each complete target needs at least one valid pair, and every admitted pair must preserve its
claims (`SPEC-1`, `IMPL-V11`). The retained general payload already contains decomposition and
strategy steps, so this fix does not require moving Area ownership or changing a renderer.

1. Capture canonical images, cache records, isolated `test` hashes, and matching before editing.
2. Correct the six Grade 1 target variants and the whole-tens compatibility boundary.
3. Verify both result variants across all three views, retained partitioning routes, matching,
   full coverage, repository checks, and build.
4. Regenerate CCSS canonically and revalidate affected samples at concurrency four. Inspect
   new artifacts and verdicts, compare retained images and cache evidence, and check split integrity.
5. Update the rolling report and findings, commit implementation/cache/documentation separately,
   and push the existing branch.

The baseline has 1,962 images, 1,934 passing judgments and 28 failures. This generator accounts
for 52 images, including 12 whole-tens images. Only CCSS is in scope; the isolated `test` dataset,
cache, and targets remain untouched. Baseline and verification evidence is retained under
`temp/whole-tens-*` and `temp/spec-plans/ccss/whole-tens-subtraction/`.

## Source and matching verification

The change is confined to the Grade 1 builder, the generator compatibility predicate, and its
specification tests. No generator implementation, payload type, or view changes are needed.
The declaration tests now verify acceptance of both whole-tens result variants across all three
consumers and rejection of the unsupported partitioning conjunction. They also preserve each
view's route for explicit regrouping. All 52 focused generator/view tests pass.

Matching retains 688 targets, 214 compatible pairs, and 841 tuples. Six corrected target IDs and
their six routes replace the original ones; all retained semantic plans and dispositions are
unchanged. Each corrected target retains its intended single view. The three existing general
subtraction-partitioning targets retain their six canonical images and currently passing VQA
evidence; Grade 3's existing equivalent-target association remains intact.

Visual inspection confirms that the retained explanation sample `259 − 236` shows `9 − 6 = 3`,
`250 − 230 = 20`, and `20 + 3 = 23`. The written-method sample `776 − 337` exchanges one ten
for ones, subtracts the ones, and shows the remaining hundreds/tens/ones and written result 439.
These supply identifiable partitioning evidence independently of the whole-tens correction.

Target distinctness retains 24 advisory findings. The concrete-model and written-method
whole-tens definitions remain meaningfully distinguished by `Formalization`; no new collision
or equivalence declaration is introduced. The strict label audit reports zero violations,
97 review items, and zero signals. Repository checks and the build pass.

Full coverage passes **3,443 tests across 543 files** and all generator thresholds. The arithmetic
generator achieves 92.12% statement and 87.91% branch coverage. The first run hit an existing
Windows `EPERM` during temporary docs-fixture cleanup; one bounded rerun passed without a source
change. The fixture error did not involve this generator or its views.

## Canonical generation and VQA

Canonical regeneration renders 56 images, writes six shards, and reuses 285. Sixteen corrected
whole-tens identities replace twelve old identities, giving **1,966 CCSS images**. All 1,950
retained images, labels, content/task fingerprints, semantic plans, replay receipts, seeds, and
attempts are unchanged. This includes all 40 retained images from the affected generator and
all six general subtraction-partitioning samples.

All 16 new images were inspected across both modes, all three views, both positive/zero-result
variants, and training/validation. They preserve the requested tasks: the model solution for
`80 − 50` removes five of eight tens; the written-method solution for `70 − 50` links that removal
to `7 tens − 5 tens = 2 tens`; explanation solutions state how place value gives the difference.
The zero-result samples correctly show that all tens are removed. Question Mode withholds the
answer and, where required, asks for the strategy or its written representation.

Live VQA at concurrency four makes **16 requests, all passing**, and reuses 1,950 judgments.
All 180 label judgments are defendable, and every general visual/math check passes. No API or
rate-limit error occurs, and no failed verdict is retried. Retained judgments and timestamps are
unchanged: 1,910 records are byte-identical, and 40 refresh only `generation_plan.inputHash`.
The validator prunes the twelve obsolete identities automatically.

The former written-method rejection retires with its corrected target. Its original evidence
is preserved in resolved history, alongside the passing replacement identities. The current
cache has **1,939 pass / 27 fail / zero uncached**: ten semantic-review samples and seventeen
evaluator disagreements, all predating this correction. No new major issue was found. The strict
audit exits 1 solely for those 27 recorded failures, with zero structural, renderer-identity,
duplicate/malformed/missing-key, obsolete-module, or stale-cache issues.

## Splits, churn, and commits

The split contains 1,654 training and 312 validation images. All 841 matched tuples have training
evidence; 212 are allocated to validation and 156 are represented there. The existing 56 coverage
gaps remain. The four added images are validation question/solution pairs for the corrected
zero-result model and explanation targets. No cross-split leakage or within-split configured-task
redundancy occurs. Sampling policy is unchanged.

Churn against `e39b9f4` confirms 1,950 unchanged retained images, 16 added/12 removed identities,
and no changed seeds or attempts. Against original baseline `644254d`, the complete maintenance
run retains 1,825 identical images and 43 intended changes, with 98 added/68 removed identities.
The same three previously explained successor retry changes remain; this correction adds none.
The isolated `test` dataset pointer and all its cache files are unchanged.

- Target/schema correction and regression tests: `f5300a3`.
- CCSS VQA cache: `3ea12ff`.
- Library remains `0.29.0-pre.4.a08f9a911317`; no ontology or dependency change is needed.
- Current and historical findings: [ontology-v029-vqa-findings.json](ontology-v029-vqa-findings.json).

Verification artifacts are retained under `temp/whole-tens-*`; matching and distinctness reports
are under `temp/spec-plans/ccss/whole-tens-subtraction/`.
