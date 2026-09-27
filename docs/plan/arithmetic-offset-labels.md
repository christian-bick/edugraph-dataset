# Arithmetic offsets and sequence positions

Follow-up to the [ontology VQA rerun](ontology-v029-vqa-rerun.md), authorized on 2026-09-27.
Scope: CCSS ten/hundred-more-less tasks; baseline `e112e3e`. The isolated `test` targets,
dataset, and VQA cache are excluded by the user's instruction.

## Evidence and approved boundary

The installed ontology defines `Increment` and `Decrement` as raising or reducing a quantity
by an amount. `Before` and `After` identify earlier/later chronological or sequence positions.
An arithmetic decrease does not establish the latter relation: 293 precedes 393 in an
ascending sequence but follows it in a descending sequence.

The inspected question for `2.NBT.B.8-place-value-offsets~caa6ebce` asks for 100 less than 393
using start/result place-value panels. It demonstrates decrementing to 293 without establishing
a preceding sequence position. The analogous ten-less questions start from 65 and 342.
The CCSS targets already request the arithmetic operation and do not request `Before`/`After`.
The incorrect additional claims came from the inherited `counting-inc-dec` direction bundles
(`SPEC-G3`, `SPEC-6`, `IMPL-G4`).

The pre-edit audit checked all active CCSS targets and every type-compatible consumer. No active
target requests `Before`; eleven request `After`. Nine use `counting-sequence`, and four also
or exclusively match `counting-inc-dec`: two K.CC.A.2 count-from-number variants and two
K.CC.B.4c successor-principle variants. The latter have no alternative producer/view path.

| Simulated change | CCSS result |
| --- | --- |
| Remove position labels from the shared direction schema for all three offset generators | Four matches lost; both K.CC.B.4c variants unsupported |
| Give the existing ten/hundred generators arithmetic-only direction schemas | All 683 targets and 832 tuples preserved; six offset plans change |

The user approved the second option. Existing module boundaries express the distinction, so no
additional generator, view, or optional labeling flag is needed (`IMPL-7`).

## Capability ownership and consumer review

The ten/hundred generators use a shared parent-level `arithmeticOffsetDirection` declaration
mapping `Area.Increment` to `inc` and `Area.Decrement` to `dec` with the ordinary exact-label
resolver. Their schemas no longer support or emit `Before`, `After`, `AdditiveCount`, or
`SubtractiveCount`. Removing the counting alternatives also prevents unrelated counting claims
when a future target leaves arithmetic direction unspecified (`SPEC-G3`, `SPEC-6`).

The one-step generator's direction schema and the independent sequence generator remain intact.
All target labels/IDs, generator implementations, random-number code, problem
types, view code, and checklists remain unchanged. No evaluator instructions are weakened.

| Payload field | Disposition and evidence |
| --- | --- |
| `numObjects`, `stepSize` | Canonical starting quantity and offset magnitude |
| `incDecType` | Mathematical increment/decrement direction |
| `incDecAnswer`, `simpleAnswer` | Calculated result and retained starting-value alias |
| `startPlaceValue`, `resultPlaceValue` | Structured base-ten decompositions |

No payload field selects a prompt, blank, or requested learner action (`IMPL-G8`). The existing
views continue to own the place-value presentation and observable Ability (`SPEC-V5`, `IMPL-V11`).

| Consumer | Production relationship | Adoption |
| --- | --- | --- |
| `counting-ten-more-less` | Four 1.NBT.C.5 / 2.NBT.B.8 variants from `counting-ten-offset` | None; payload and arithmetic unchanged |
| `counting-hundred-more-less` | Two 2.NBT.B.8 variants from `counting-hundred-offset` | None; payload and arithmetic unchanged |
| `counting-inc-dec` | Accepts the ten-offset payload type, but has no current CCSS ten-offset match; its one-step matches are retained | None; payload and one-step producer unchanged |

Regression tests cover both arithmetic directions, supported and resolved label sets, unspecified
direction fallback, fixed step sizes, and retained one-step successor/predecessor bundles.

## Separate successor-view review

K.CC.B.4c legitimately requires the next number to represent one more. Its current
`counting-inc-dec` view depicts objects and an upward arrow marked 1. This is weaker sequence
evidence than the explicit ordered terms in `counting-number-sequence`. Preserving a match or
a passing VQA result is not proof of adequate observable evidence (`IMPL-V11`, `TSPEC-13`).
Review a successor-specific projection that explicitly relates successive numbers and quantities;
retain the competency rather than deleting its `After` requirement. This separate review also
concerns the two K.CC.A.2 targets matched by the object-arrow view. It is outside the approved
arithmetic-offset declaration correction and does not change the current cached failure count.

The numeric-boundary question about whole operands versus small place-value component counts
also remains separate and unresolved.

## Verification

Baseline: 1,942 samples, 1,915 passing and 27 failing verdicts; zero uncached samples.
The label audit reports zero violations and 97 review items. Matching, complete baseline cache
records, and the read-only removal simulation are retained under `temp/arithmetic-offset-*`,
`temp/offset-label-audit.json`, and `temp/spec-plans/ccss/arithmetic-offset-labels/`.

Source commit: `8598ac3`. The focused generator suites pass 57 tests across eight files;
the typecheck and build pass. Matching confirms exactly six changed plans, no changed target
IDs/labels, no added or removed matches, and no unsupported active target. The strict label audit
remains at zero violations and 97 review items.

The full coverage suite passes **3,150 tests across 530 files**, and all generator coverage
thresholds pass. CCSS repository checks, documentation references, and split integrity also pass.
The build retains its existing chunk-size warning; the documentation check retains four existing
external-fetch warnings.

Canonical affected generation renders **16 images**, writes four shards, and reuses 283 shards.
All 1,942 image hashes, sample identities, seeds, and attempts are unchanged from the baseline.
The 16 offset records receive the corrected labels and semantic plans; all other **1,926 cache
records are byte-for-byte unchanged**, including their evaluations and timestamps. No target
or split allocation changes. Representative regenerated images and both newly rejected solution
images were inspected against the recorded evidence.

Cache-aware VQA makes **16 requests at concurrency four** and reuses 1,926 judgments. Nine
rechecked samples pass with every label defendable; seven fail only on numeric bounds. There
are no remaining `Before`/`After` labels or counting-direction labels on these offset samples,
and every general visual/math check passes. No API rate-limit errors were observed.

| Revalidation result | Detail |
| --- | --- |
| Newly passing | `2.NBT.B.8-place-value-offsets~e267d598`, training question, previously rejected solely for `Before` |
| Previously failing, still failing | Four grade-one images retain `NumbersLarger10` rejections; the 393-to-293 question changes from a `Before` rejection to `NumbersLarger100` |
| Newly rejected | Training and validation solutions for `1.NBT.C.5-ten-more-less~7cd81d94` now receive `NumbersLarger10` rejections |

The two newly rejected images show 81 → 91 and 31 → 41, with the ones count displayed as
`1 one` and `1 = 1`. Their pixels and bounds labels are unchanged. These are new verdicts on
the existing operand-versus-component-count boundary, not a new arithmetic or rendering defect.
The 393 question explicitly displays component counts 3 and 9, the unchanged lower-place value
93, and the unit step 1; its new bound rejection belongs to the same unresolved boundary.
No bounds declarations, visual witnesses, or evaluator instructions are changed to suppress it,
and no repeated requests are made merely to obtain a passing verdict.

Final totals are **1,914 pass / 28 fail / zero uncached**, compared with 1,915 / 27 before this
correction: one previous failure resolves and two previously passing samples are newly rejected.
The seven offset failures are all classified under the separate component numeric-bound review.
The other 21 failures are unchanged. The original report and findings JSON retain the earlier
verdicts and record the three rejected `Before` claims as resolved by the declaration correction.

Strict audit exits 1 solely for the 28 cached failing verdicts. Dataset structure, renderer
identity, duplicate/malformed/missing/stale records, and obsolete-module checks all report zero
issues. The split remains 1,636 training / 306 validation images; all 832 matching tuples have
training evidence. The same 55 validation allocation gaps remain. Churn against `e112e3e` is
zero for all 1,942 retained images, with no added or removed identities.

VQA cache commit: `a7290e3`. The `test` target/cache files remain unchanged from baseline
`644254d`, and the `test` dataset pointer is unchanged from the start of this follow-up.
