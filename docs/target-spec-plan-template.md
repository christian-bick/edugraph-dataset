# <Standard> <Grade or File> Target-Spec Plan

<!--
Replace every placeholder and keep the plan section order through Open Questions. Use
"None." for an empty section. Do not copy the final Audit section into `plan.md`.
Keep accepted facts and rationale under Detailed Design Decisions. Put only unresolved,
directly answerable questions under Open Questions, and end every item there with "?".
-->

## Source Scope

| Leaf | Source quotation |
|---|---|
| `<standard-id>` | “<Exact source text needed to justify the covered competencies.>” |

## Proposed Disposition

### Proposed Active Targets

| Prefix / competency | Builder dimensions (permutations) | Required artifact evidence | Expected production matches |
|---|---|---|---|
| `<definition-prefix>` — <competency> | <Shared labels and variant dimensions> (<count>) | <Visible or necessary textual evidence for every claimed label> | `<generator>#<view>` |

### Proposed Beyond-Scope Entries

| Leaf / competency | Reason |
|---|---|
| `<standard-id>` <competency> | <Why the required evidence cannot exist in the dataset medium> |

### Proposed Intentional Equivalences

| Definition pair | Reason |
|---|---|
| `<definition-prefix-a>` ↔ `<definition-prefix-b>` | <Why identical permutation sets are intentional> |

### Proposed Ontology TODOs

| Leaf / competency | Missing ontology distinction / proposal |
|---|---|
| `<standard-id>` <competency> | <Most-specific missing distinction and proposed ontology placement> |

### Proposed Implementation TODOs

Legend: a bare module id is reused as-is; `△` adopts or extends an existing module; `＋`
proposes a completely new module. Treat new module ids as provisional ownership names.

| Leaf / competency | Proposed labels and dimensions | Evidence required from a future artifact | Group | Generator | View |
|---|---|---|---|---|---|
| `<standard-id>` <competency> | <Current-ontology labels and variants> | <Evidence the future artifact must expose> | `<stable-group>` | `<generator>`, △ `<generator>`, or ＋ `<generator>` | `<view>`, △ `<view>`, or ＋ `<view>` |

### Disposition Summary

| Disposition | Definitions/entries | Permutations |
|---|---:|---:|
| `spec` | <count> | <count> |
| `implementationTodos` | <count> | <count> |
| `ontologyTodos` | <count> | n/a |
| `beyondScope` | <count> | n/a |
| `equivalentTargets` | <count> declarations | n/a |

## Detailed Design Decisions

### Ontology Design Decisions

1. **<Decision title>.** <Accepted proposal, alternatives considered, and rationale.>

### Implementation Design Decisions

#### Expected Active Matches

- `<target family>` → `<generator>#<view>`.

State the expected added and removed active-pair totals. State that implementation TODOs
must have no genuine production path until their assigned modules are implemented or adopted.

#### Matching-Diff Review

1. <Specific suspicious or boundary match that the generated diff must verify.>

#### Distinctness Review

- <Expected identical, contained, overlapping, or adjacent definitions and their intended disposition.>
- State that predictions do not replace review of `target-distinctness.md`.

## Open Questions

1. Should <one unresolved decision be accepted>?

## Audit

Use this checklist when authoring a plan; do not copy it into the generated `plan.md`.

- [ ] Every covered standard leaf is quoted under Source Scope.
- [ ] Every distinct competency appears in exactly one disposition.
- [ ] Active and implementation targets state labels, permutation dimensions, and observable evidence.
- [ ] Every implementation TODO has a stable group and generator/view ownership indicator.
- [ ] Equivalence declarations and all disposition counts agree with their tables.
- [ ] Detailed Design Decisions contains accepted rationale, matching risks, and distinctness expectations.
- [ ] Open Questions contains only directly answerable questions ending in `?`.
- [ ] No implementation-package summary or pre-ontology permutation projection is included.
