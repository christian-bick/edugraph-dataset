# Multiples of five migration

## Scope and decisions

The user supplied `MultiplesOf5` in ontology preview
`0.29.0-pre.5.a88ac7a500c5` and approved migrating the clock and five-scale graph cases
before discussing the remaining VQA issues. This continues branch
`codex/ontology-v029-vqa-rerun` from `cf7127d`; only CCSS data and VQA are in scope.

- `time` replaces its `StepsOf5` constraint with `MultiplesOf5`. The minute component is
  divisible by five; no sequence is claimed. Sampling uses 05, 15, 25, 35, 45 and 55 minutes
  to distinguish these examples from ten-minute values, as requested. This sampling policy
  does not redefine the ontology: multiples of ten are still multiples of five.
- `statistical-graphs` replaces its five-scale `StepsOf5` capability with `MultiplesOf5`.
  Category quantities, arithmetic operands and results remain divisible by five, and the
  payload still records scale 5. Category totals need not form a consecutive progression.
- The five-scale picture-graph target uses `MultiplesOf5`. Bar-graph targets retain
  `StepsOf5`, supplied by the numbered axis in their views. A view compatibility rule admits
  that axis claim only with the generator's five-multiple constraint. This repairs the
  capability ownership and observable-evidence issues (`SPEC-G3`, `SPEC-8`, `SPEC-11`,
  `TSPEC-13`, `IMPL-V11`). Genuine skip-counting targets retain `StepsOf5`.
- Existing scales 1, 2 and 10, including the two failed unit-scale picture-graph samples,
  remain for the subsequent discussion. The isolated `test` targets, dataset and cache are
  preserved at the user's request.

## Payload and projection review

No payload field or `ViewTypeMap` contract changes (`IMPL-G6`, `IMPL-G8`).

| Payload | Mathematical data | Structured evidence | Semantic context | View projection |
|---|---|---|---|---|
| Time | `secondsSinceMidnight` | `intervalSeconds` | Optional `period` | None |
| Statistical graph | Category counts and `scale` | Operation, operand category IDs, intermediate and answer when present | Category IDs | None |

The new bar-view parameter requires an axis whose successive labels differ by five. It
does not change learner action or select an Ability (`SPEC-V2`, `SPEC-V6`). All four leaves
retain their existing invariant Abilities, shared renderer, and concise Identity/Modes
checklists. They introduce no Area, target precondition or exclusion boundary. The
compatibility rule queries semantic capabilities, not generator configuration names.
Rendering continues to use the supplied scale and seeded category order (`IMPL-V6`,
`IMPL-V9`); it rejects an inconsistent requested five-step axis.

## Production consumer matrix

Baseline snapshot: 110 images across these two generators. Each row preserves the existing
payload fields; generator/spec tests, joint matching, canonical rendering and VQA verify
the migration. Unchanged image/cache reuse is checked separately.

| Consumer | CCSS target families | Adoption |
|---|---|---|
| `time-analog` | 1.MD.B.3; 2.MD.C.7; 3.MD.A.1 | Render unchanged time payload; verify migrated minutes |
| `time-analog-construction` | 1.MD.B.3; 2.MD.C.7; 3.MD.A.1 | Render unchanged time payload; verify migrated minutes |
| `time-digital` | 1.MD.B.3 | Unaffected reading projection |
| `time-digital-construction` | 1.MD.B.3; 2.MD.C.7; 3.MD.A.1 | Render unchanged time payload; verify migrated minutes |
| `data-bar-graph` | 2.MD.D.10; 3.MD.B.3 | Own five-step axis capability and validate supplied scale |
| `data-bar-graph-arithmetic` | 1.MD.C.4; 2.MD.D.10; 3.MD.B.3 | Same axis adoption; preserve arithmetic evidence |
| `data-bar-graph-classification` | 1.MD.C.4; 2.MD.D.10; 3.MD.B.3 | Same axis adoption; preserve observation grouping |
| `data-bar-graph-interpretation` | 1.MD.C.4 | Same axis contract; current unit-scale projection unaffected |
| `data-picture-graph` | 2.MD.D.10; 3.MD.B.3 | Existing scale-5 key and symbols evidence multiples |
| `data-picture-graph-arithmetic` | 1.MD.C.4 | Existing unit-scale projection unaffected |
| `data-picture-graph-classification` | 1.MD.C.4; 2.MD.D.10; 3.MD.B.3 | Existing scale-5 observation cards evidence multiples |
| `data-picture-graph-interpretation` | 1.MD.C.4 | Existing unit-scale projection unaffected |

## Verification plan

Baseline: 1,966 images, 1,946 passing and 20 failing current judgments. Capture matching,
image hashes, cache records and isolated-test snapshot/cache hashes before editing.
Run focused generator, schema and joint-planning tests, full coverage, CCSS checks and the
strict label-architecture audit. Commit source/dependency changes before canonical
`--affected` generation and cache-aware VQA at concurrency four. Inspect changed images,
matching/label churn, cache freshness and split integrity; record any new major issues in
the [original report](ontology-v029-vqa-rerun.md) and machine-readable findings. Commit VQA
and documentation separately and push the branch.
