# Picture-graph quantity constraints and bar-axis steps

## Approved scope

Continue from `163fb9e` on `codex/ontology-v029-vqa-rerun`, using the existing ontology
preview `0.29.0-pre.5.a88ac7a500c5`. The user approved completing the graph migration:
use `EvenNumbers`, `MultiplesOf5` and `MultiplesOf10` for category quantities, omit a
divisibility label for scale one, and preserve genuine `StepsOfX` bar-axis claims.
Only CCSS targets, generation and VQA are in scope; the isolated test spec and its
dataset/cache remain untouched.

The source competencies were reviewed directly: [1.MD.C.4](https://www.thecorestandards.org/Math/Content/1/MD/)
requires category counts and totals; [2.MD.D.10](https://www.thecorestandards.org/Math/Content/2/MD/)
explicitly requires single-unit graph scales; [3.MD.B.3](https://www.thecorestandards.org/Math/Content/3/MD/)
requires scaled graphs. Retain unit-scale exercises for the first two. The third already uses
only scales 2, 5 and 10.

## Design and review

- The generator schema resolves a numeric scale: no divisibility label means exactly 1;
  `EvenNumbers` means 2, `MultiplesOf5` means 5, and `MultiplesOf10` means 10. Use the shared
  exact label-set resolver with an explicit empty default (`SPEC-6`). The unit-scale case
  remains covered by the invariant `IntegerNumbers`; it claims neither a sequence nor a
  meaningless multiples-of-one restriction (`SPEC-G3`, `TSPEC-13`).
- Picture targets drop `StepsOf1` and replace `StepsOf2`/`StepsOf10` with the corresponding
  divisibility claims. Unit picture targets always resolve scale 1; broad requests cannot
  randomly fall back to a scaled graph.
- Bar views own all four axis-step labels. Their shared schema resolves the axis step, and
  joint compatibility binds it to the generator's quantity scale. Scaled bar targets retain
  the existing step claim and explicitly request the quantity constraint as a conjunction.
  Unit bar targets keep `StepsOf1`. This separates mathematical quantities from numbered
  axis evidence without duplicate ownership (`SPEC-8`, `SPEC-11`, `IMPL-V11`).
- The generator continues to reject scaled sorting/three-operand-total configurations.
  No new generator, view, Ability, Area, checklist exception or ontology change is needed.

Payload contracts and seeded sampling stay unchanged (`IMPL-G6`, `IMPL-G8`). Category
counts and scale are canonical mathematical data; operation, operand category IDs,
intermediate and answer are structured arithmetic evidence; category IDs are semantic
context. There are no view-projection fields. Axis configuration changes presentation
without changing learner action (`SPEC-V2`, `SPEC-V6`). Existing target preconditions,
exclusions and concise Identity/Modes checklists retain their meanings (`CHK-V6`).

## Consumer matrix

All eight consumers retain their existing payload fields and mathematical tasks.

| Consumer | CCSS families | Adoption and verification |
|---|---|---|
| `data-picture-graph` | 2.MD.D.10; 3.MD.B.3 | Existing symbol key; test unit default and quantity labels; canonical VQA |
| `data-picture-graph-classification` | 1.MD.C.4; 2.MD.D.10; 3.MD.B.3 | Same scaled observation projection; verify unit/default and scaled cases |
| `data-picture-graph-interpretation` | 1.MD.C.4 | Existing count-reading projection; verify scale one |
| `data-picture-graph-arithmetic` | 1.MD.C.4 | Existing total projection; verify scale one and retirement of both false step claims |
| `data-bar-graph` | 2.MD.D.10; 3.MD.B.3 | Shared axis schema and validation; joint-plan and rendered-axis tests |
| `data-bar-graph-classification` | 1.MD.C.4; 2.MD.D.10; 3.MD.B.3 | Same axis adoption with existing classification task |
| `data-bar-graph-interpretation` | 1.MD.C.4 | Same axis adoption; preserve unit axis |
| `data-bar-graph-arithmetic` | 1.MD.C.4; 2.MD.D.10; 3.MD.B.3 | Same axis adoption; preserve arithmetic operands and results |

## Verification plan

Baseline: 1,968 CCSS images, 1,948 passing judgments and 20 failures; 72 statistical-graph
images. Capture matching, image/cache identities and isolated-test snapshot/cache hashes.
Run focused generator/schema/rendering tests, full coverage, CCSS checks and label audit.
Commit source changes, then run canonical affected generation and cache-aware VQA with
concurrency four. Review matching, exact replays, images, cache churn and split integrity;
update the original report and machine-readable findings, commit results, and push.

## Implementation and verification

Implementation commit: `a425a0d`. The focused suite passes 165 tests across 20 files; full
coverage passes 3,539 tests across 549 files and every configured threshold. The statistical
generator reaches 98.36% statement and 98.03% branch coverage. CCSS repository checks and
the production build pass. The strict label audit reports zero violations, 97 existing review
items and zero signals. A readonly-array inference error in a new test was corrected before
the successful type check; no production defect was discovered by these checks.

Matching retains 688 targets, 214 compatible generator/view pairs and 841 tuples. Fifteen
target identities and 21 routes are replaced; seven retained unit-bar plans change. No active
target loses its implementation. Canonical generation at concurrency four renders 74 graph
images, writes 13 shards and reuses 278. All 74 recorded draws replay exactly, including labels
and mathematical fingerprints. The sample mix is 26 picture graphs and 48 bar graphs across
the eight consumers; scales 1, 2, 5 and 10 have 26, 14, 18 and 16 samples respectively.
Replay checks confirm every Grade 1/2 graph has scale one, pictures have no step claims,
quantity labels match their scales, and bar-axis configurations and labels agree.

Manual inspection covers the replacement total question and solution, two- and ten-scale
picture solutions, and unit-, two- and ten-step bar solutions. Symbol counts, keys, numeric
totals and axes agree. For example, the two-scale picture shows 8 books, 6 apples and 14 kites;
the ten-scale picture shows 60 books, 50 kites and 30 apples. These are scaled quantities,
without a consecutive-category requirement.

The split contains 1,654 training and 316 validation images. All 841 matched tuples have
training evidence; 213 are allocated to validation and 158 have validation evidence. The
existing 55 gaps remain, with no cross-split leakage or configured-task redundancy. Changed
target hashes produce one additional allocated/represented tuple and two validation images;
the allocation policy is unchanged.

## VQA and cache outcome

Cache commit: `b851404`. Cache-aware VQA at concurrency four makes 54 fresh judgments and
reuses 1,916; all 54 pass, with 348 defendable label checks and every general check passing.
These include 14 `EvenNumbers`, 12 `MultiplesOf5`, 16 `MultiplesOf10`, ten `StepsOf2`, twelve
`StepsOf5` and twelve `StepsOf10` checks. Unit-bar verdicts are reused with their unchanged
`StepsOf1` evidence. All 74 current graph images pass.

The two failed `1.MD.C.4-find-total~358e3f7e` identities retire. Their corrected
`1.MD.C.4-find-total~73273aab` question and solution pass; the original report preserves the old
rejections as history. Overall CCSS now has 1,970 images: 1,952 pass, 18 fail, none uncached.
The remaining failures are one separate semantic review and seventeen evaluator disagreements.
No newly rejected sample, VQA retry, rate-limit error or new major issue occurred.

Compared with `163fb9e`, there are 54 added and 52 removed identities. All 1,916 retained images,
mathematical fingerprints, labels, seeds and attempts are unchanged. Fourteen unit-bar task
fingerprints and plan/replay receipts change with the shared view-schema ownership. Of the
retained cache records, 1,896 are byte-identical, six update only their plan input hash, and
fourteen refresh plan/replay receipts; all 1,916 evaluations and timestamps are unchanged.
The strict dataset audit exits 1 solely for the eighteen existing rejected judgments, with no
structural, stale-cache or integrity issue. Both the isolated test snapshot pointer and every
test cache file are byte-identical to the captured baseline.

The [original report](ontology-v029-vqa-rerun.md) and its
[machine-readable findings](ontology-v029-vqa-findings.json) record this completed follow-up.
