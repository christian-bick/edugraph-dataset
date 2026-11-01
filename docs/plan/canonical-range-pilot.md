# CCSS K–1 Canonical Upper-Range Pilot Target-Spec Plan

This is a reviewed standard-expansion seed for the [canonical range plan](canonical-range-labeling.md), not production activation. Source targets, samplers and released labels are unchanged at this checkpoint. The authoritative source is `public/coverage/ccss-tree.json` (SHA-256 `404c46f9aa2885828e086e21ef5dbfab67e271c448fc6648c561c8c8ab619663`). Read-only evidence is in `temp/canonical-range-2026-10-31/pilot-standard-review.json`, captured from content commit `031fb4b3a76068ab4f3e7478d9c05497b7ffab80`.

The [2026-11-01 shared-consumer review](canonical-range-consumer-review.md) completes the current
configuration-feasibility inventory for both producers. Existing bounded routes retain feasible
choices, but sampler activation also needs source-band review outside this pilot and the applicable
endpoint/lower-bound contracts. The target-expansion helper is implemented; this proposal has not
yet been applied to production targets.

## Source Scope

| Leaf | Source quotation |
|---|---|
| `K.CC.C.6` | “Identify whether the number of objects in one group is greater than, less than, or equal to the number of objects in another group, e.g., by using matching and counting strategies (include groups with up to ten objects).” |
| `K.CC.C.7` | “Compare two numbers between 1 and 10 presented as written numerals.” |
| `K.OA.A.2` | “Solve addition and subtraction word problems, and add and subtract within 10, e.g., by using objects or drawings to represent the problem.” |
| `K.OA.A.5` | “Fluently add and subtract within 5.” |
| `1.OA.A.1` | “Use addition and subtraction within 20 to solve word problems involving situations of adding to, taking from, putting together, taking apart, and comparing, with unknowns in all positions, e.g., by using objects, drawings, and equations with a symbol for the unknown number to represent the problem.” |
| `1.OA.C.6` | “Add and subtract within 20, demonstrating fluency for addition and subtraction within 10. Use strategies such as counting on; making ten (e.g., 8 + 6 = 8 + 2 + 4 = 10 + 4 = 14); decomposing a number leading to a ten (e.g., 13 – 4 = 13 – 3 – 1 = 10 – 1 = 9); using the relationship between addition and subtraction (e.g., knowing that 8 + 4 = 12, one knows 12 – 8 = 4); and creating equivalent but easier or known sums (e.g., adding 6 + 7 by creating the known equivalent 6 + 6 + 1 = 12 + 1 = 13).” |

## Proposed Disposition

### Proposed Active Targets

| Prefix / competency | Builder dimensions | Required artifact evidence | Expected production matches |
|---|---|---|---|
| `K.CC.C.6-compare-groups-by-counting` — compare counted groups | Preserve equality/greater/less variants; upper bands **5, 10** | Two positive groups, their independently counted quantities and the requested comparison | `comparison#numbers-compare-counting` |
| `K.CC.C.6-compare-groups-by-matching` — compare by one-to-one correspondence | Preserve equality/greater/less variants; upper bands **5, 10** | Two positive groups with observable correspondence and comparison | `comparison#numbers-compare-matching` |
| `K.CC.C.7-compare-numerals` — compare written values | Preserve equality/greater/less variants; upper bands **5, 10** | Two written positive numerals and their comparison; objects are not required | `comparison#numbers-compare` |
| `K.OA.A.2-word-problems` — solve a one-step addition/subtraction story | Preserve addition/subtraction variants; upper bands **5, 10** | The story's actual operands and necessary result, including a hidden input where requested | The word-problem routes below |
| `1.OA.A.1-word-problems` — solve an addition/subtraction story within twenty | Preserve addition/subtraction variants; upper bands **5, 10, 20** | Preserve story situations and support for unknowns in all positions; low-band practice does not replace the broader competency | The word-problem routes below |
| `1.OA.C.6-fluency` — generic binary addition/subtraction execution | Preserve addition/subtraction variants; upper bands **5, 10, 20** | The requested binary calculation; required strategy tasks remain in their existing separate definitions | The fluency routes below |
| `K.OA.A.5-fluency` — execution within five, retained control | Preserve addition/subtraction variants and upper band **5** | The requested binary calculation stays within the source's hard ceiling | The fluency routes below |

All existing non-range claims are retained. Comparison targets keep `NumbersWithoutNegatives`, `NumbersWithoutZero` and `ProcedureExecution`; group comparisons keep `PhysicalNumbers` and their counting or matching strategy. Written comparison keeps `ArabicNumerals` and `Base10`. Both story definitions keep `SingleStep`, `ArabicNumerals`, `Base10`, positive nonzero arithmetic and `TextualReception`. Both fluency definitions keep `TwoOperands`, `ArabicNumerals`, `Base10`, positive nonzero arithmetic and `ProcedureExecution`. No digit-width, zero, sign, Ability or strategy variant is added by this target expansion.

### Proposed Beyond-Scope Entries

None. Existing beyond-scope entries remain unchanged; static examples still do not establish memory retrieval, timing or mental performance.

### Proposed Intentional Equivalences

None. Partial overlaps across grades are not declarations that complete source competencies are equivalent.

### Proposed Ontology TODOs

None for these upper-band target additions. The main plan retains the separate lower-bound/equality conditions.

### Proposed Implementation TODOs

None added to the authored target TODO exports. Production activation remains subject to the shared-producer sampler and consumer review described below; this planning checkpoint does not claim that current inclusive sampling implements canonical upper buckets.

### Disposition Summary

| Active definition | Existing authored permutations retained | Proposed additions | Proposed authored total |
|---|---:|---:|---:|
| `K.CC.C.6-compare-groups-by-counting` | 3 | 3 | 6 |
| `K.CC.C.6-compare-groups-by-matching` | 3 | 3 | 6 |
| `K.CC.C.7-compare-numerals` | 3 | 3 | 6 |
| `K.OA.A.2-word-problems` | 2 | 2 | 4 |
| `1.OA.A.1-word-problems` | 2 | 4 | 6 |
| `1.OA.C.6-fluency` | 4 | 2 | 6 |
| `K.OA.A.5-fluency` — unchanged control | 2 | 0 | 2 |
| **Pilot total** | **19** | **17** | **36** |

| Disposition | Definitions/entries | Proposed permutations |
|---|---:|---:|
| `spec` | 7 | 36 |
| `implementationTodos` | 0 added | 0 added |
| `ontologyTodos` | 0 added | n/a |
| `beyondScope` | 0 added | n/a |
| `equivalentTargets` | 0 added | n/a |

Read-only synthetic normalization of the full authored CCSS set gives **1,028 → 1,045 raw targets**, **1,013 → 1,024 normalized targets**, and **1,222 → 1,241 current matching routes**. There are **11 distinct new label sets**, rather than 17 independent additions to normalized coverage. All 17 proposed authored additions currently match, across 51 raw routes. These are measurements under the existing capability contracts, not a forecast that canonical-bucket activation leaves every route/configuration unchanged.

## Detailed Design Decisions

### Ontology Design Decisions

1. **Review upper bands per competency.** The added within-five examples remain genuine comparisons or arithmetic stories inside the source's stated ceiling. They provide foundational practice; they do not stand in for satisfying the complete within-ten or within-twenty standard. Keeping the existing higher bands preserves those demands. The within-five fluency control cannot acquire bands ten or twenty because its source explicitly limits the task to five.
2. **Upper-bucket witnesses are not lower-bound labels.** Under the main plan, an upper-ten bucket needs a task-relevant maximum above five and at most ten; upper twenty similarly needs a maximum above ten. This does not mean every operand must exceed the previous threshold. Do not encode the witness with `NumbersLarger5` or `NumbersLarger10`, and do not add those descriptors to this pilot.
3. **Keep source ceilings and task nature.** No band above ten is added to the Kindergarten comparison/story definitions, nor above twenty to the Grade 1 definitions. No new descriptor is invented below the catalog's smallest positive upper threshold. Lower-range semantics, endpoint consistency and the Area allowlist are unchanged by this target review.
4. **Do not expand every strategy mechanically.** The make-ten definitions must not receive an upper-five variant: their prescribed mathematics involves ten. Counting-on, near-doubles and missing-addend strategy definitions need their own complete task-value review and are not automatically cross-multiplied by this generic fluency batch.

### Implementation Design Decisions

#### Label Ownership

| Target family | Claim / dimension | Expected capability owner | Required artifact evidence |
|---|---|---|---|
| All comparisons | `NumericEquality` / `NumericInequality`, requested relation, numeric domain and selected upper band | `comparison` generator | Actual positive compared quantities and a feasible requested relation |
| Counted comparison | `NumerationWithIntegers`, `AdditiveCount`, `PhysicalNumbers`, `ProcedureExecution` | `numbers-compare-counting` view for counting presentation/action; generator for quantities | Counting each group supports the comparison |
| Matched comparison | `SetComparison`, `PhysicalNumbers`, `ProcedureExecution` | `numbers-compare-matching` view | One-to-one object correspondence supports the comparison |
| Written comparison | `ArabicNumerals`, `Base10`, `ProcedureExecution` | `numbers-compare` view for notation/action | The written values and requested comparison remain identifiable |
| Stories | Addition/subtraction, single-step numeric domain and selected upper band | `arithmetic-ops-pairs` generator | Story operands and necessary result/input satisfy the range contract |
| Stories | `ArabicNumerals`, `TextualReception` and independently supplied presentation claims | Matched word-problem view | Readable story preserves the source situation and requested unknown |
| Generic fluency/control | Operation, `TwoOperands`, numeric domain and upper band | `arithmetic-ops-pairs` generator | Canonical binary arithmetic satisfies the selected domain |
| Generic fluency/control | `ProcedureExecution`, `ArabicNumerals` and presentation evidence | Matched arithmetic view | Requested calculation/unknown remains visible; Question withholds the answer |

#### Expected Active Matches

- Counting, matching and written comparison use the exact routes in the proposed-active table.
- Word-problem definitions currently admit `arithmetic-ops-pairs` with `measurement-word-problem`, `operations-word-problem`, `operations-word-problem-inversion`, `operations-word-problem-within-100`, and `operations-word-problem-within-100-inversion`.
- Generic fluency/control currently admit `arithmetic-ops-pairs` with `operations-boxes`, `operations-boxes-inversion`, `operations-number-line-arithmetic`, `operations-representation`, `operations-vertical`, and `operations-vertical-inversion`.
- The read-only probe finds no new range descriptor or matching-capability declaration needed to request these bands. Existing range resolution and within-five width defaults resolve successfully. Fallback behavior during canonical upper-band activation still requires review; no new `inferredLabels` or post-generation relabeling is proposed.

**Shared-producer activation boundary.** This pilot is a standard-review seed, not the complete production scope. Activating a canonical upper-band sampler for `comparison` or `arithmetic-ops-pairs` requires reviewing **all** their admitted targets, configurations and consuming views, including consumers outside K–1. The new sampler must prove a task-relevant maximum in the selected bucket while preserving all other selected claims and handling infeasible combinations explicitly. For example, current upper-twenty subtraction admits a single-digit-largest-operand profile; that profile cannot witness a maximum above ten in nonnegative subtraction. Compatibility/fallback handling must resolve it rather than retry indefinitely, drop a width claim or falsely emit a band. No production activation is justified by the current matching probe alone.

#### Matching-Diff Review

1. Capture the authoritative full matching baseline before target/sampler activation, then compare the complete new graph. Explain every added/removed route and infeasible configuration; current read-only synthetic results are only the planning baseline.
2. Verify every story route, including the measurement-story and unknown-input leaves, against the original competency. Bound the hidden required result/input too; formatting components and unused capacities are not automatically arithmetic inputs.
3. Preserve the counting versus one-to-one matching distinction and all comparison relations. Verify exact-threshold cases and feasible unequal groups under the low band.
4. Check source-target associations after normalization. Adding overlapping Grade 1 word and fluency permutations changes the current representative from the corresponding Kindergarten prefix, even though their label hashes are identical. The probe observes the two Kindergarten word targets at upper ten becoming Grade 1 representatives, and the two Kindergarten fluency targets at upper five becoming Grade 1 representatives. Their seeds/replay identities can consequently change. Report that migration; do not promise zero normalized-ID or pixel churn merely because all authored permutations are retained.

#### Distinctness Review

- Kindergarten within-five stories overlap the new Grade 1 within-five stories; the latter's within-ten variants also overlap existing Kindergarten stories. Grade 1 within-five fluency overlaps the retained Kindergarten fluency control. These are partial overlaps of larger definition sets, not complete competency identities; TSPEC-8 permits overlap deduplication without adding an equivalence alias.
- There is currently **no** `equivalentTargets` declaration naming `1.OA.C.6-fluency` or `2.OA.B.2-fluency`. The Grade 2 definition currently contains upper twenty only, so this pilot does not stale such an alias. Their separately declared subtraction-make-ten equivalence is untouched.
- A later Grade 2 expansion to exactly the same generic fluency bands could create identical complete permutation sets. Review the source distinctions jointly then; do not introduce an alias merely to satisfy a structural validator. Run the formal target-distinctness analysis after implementation; these predictions do not replace it.
- Keep later source batches separate: `K.CC.B.5` permits line/rectangular-array/circle collections through twenty but scattered collections only through ten; its existing rectangular-array upper-ten slice and counting-layout behavior deserve a dedicated review. `K.OA.A.4` requires making ten, and `K.NBT.A.1` explicitly requires eleven through nineteen, so lower bands cannot simply be added. `2.NBT.B.5` requires strategies based on place value, properties and/or the addition/subtraction relationship; do not treat arbitrary low-number execution as equivalent to that whole competency. None of these existing definitions or dispositions changes in this pilot.

## Open Questions

None specific to these upper-band source additions. The main plan's existing lower-bound/endpoint conditions remain separate; no new blanket approval flow is introduced. Production activation follows the shared-producer review and sampler verification above.
