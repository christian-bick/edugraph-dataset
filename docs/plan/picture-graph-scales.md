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
