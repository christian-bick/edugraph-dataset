# Canonical range source-band review and remaining policy recommendations

Completed 2026-11-01 from `818ca59a`, using ontology `0.33.0`. This completes the source review
required by the [consumer review](canonical-range-consumer-review.md). The user approved all
recommendations on 2026-11-01; coordinated implementation is tracked in the main plan. Approval
is not dataset acceptance. The pre-adoption baseline remains 1,013 normalized
targets and 1,222 routes. The Area allowlist and all unrelated annotation rules remain unchanged.

The review covers all **27 source definitions across 25 leaves** behind the two pilot producers,
including the complete integer branch of Grade 4 measurement. It also identifies the four-addend
sibling that must join the same source correction. Source review is complete; implementation,
matching migration and dataset acceptance are separate steps.

## Source Scope

The authoritative text is `public/coverage/ccss-tree.json`, SHA-256
`404c46f9aa2885828e086e21ef5dbfab67e271c448fc6648c561c8c8ab619663`.
The table contains exact relevant excerpts, with source line breaks joined. An explicit ceiling,
a digit-count requirement and a chosen representative sampling envelope are different constraints.

| Leaf | Relevant source quotation |
| --- | --- |
| K.CC.C.6 | “Identify whether the number of objects in one group is greater than, less than, or equal to the number of objects in another group, e.g., by using matching and counting strategies (include groups with up to ten objects).” |
| K.CC.C.7 | “Compare two numbers between 1 and 10 presented as written numerals.” |
| 1.NBT.B.3 | “Compare two two-digit numbers based on meanings of the tens and ones digits, recording the results of comparisons with the symbols >, =, and <.” |
| 2.NBT.A.4 | “Compare two three-digit numbers based on meanings of the hundreds, tens, and ones digits, using >, =, and < symbols to record the results of comparisons.” |
| 4.NBT.A.2 | “Read and write multi-digit whole numbers using base-ten numerals, number names, and expanded form. Compare two multi-digit numbers based on meanings of the digits in each place, using >, =, and < symbols to record the results of comparisons. Grade 4 expectations in this domain are limited to whole numbers less than or equal to 1,000,000.” |
| `K.OA.A.1` | “Represent addition and subtraction with objects, fingers, mental images, drawings (Drawings need not show details, but should show the mathematics in the problem. (This applies wherever drawings are mentioned in the Standards.)), sounds (e.g., claps), acting out situations, verbal explanations, expressions, or equations.” |
| `K.OA.A.2` | “Solve addition and subtraction word problems, and add and subtract within 10, e.g., by using objects or drawings to represent the problem.” |
| `K.OA.A.5` | “Fluently add and subtract within 5.” |
| `1.OA.A.1` | “Use addition and subtraction within 20 to solve word problems involving situations of adding to, taking from, putting together, taking apart, and comparing, with unknowns in all positions, e.g., by using objects, drawings, and equations with a symbol for the unknown number to represent the problem.” |
| `1.OA.C.6` | “Add and subtract within 20, demonstrating fluency for addition and subtraction within 10.” It continues: “Use strategies such as counting on; making ten” and lists decomposition, the addition/subtraction relationship and equivalent easier sums. |
| `1.OA.D.8` | “Determine the unknown whole number in an addition or subtraction equation relating to three whole numbers.” |
| `2.OA.A.1` | “Use addition and subtraction within 100 to solve one- and two-step word problems involving situations of adding to, taking from, putting together, taking apart, and comparing, with unknowns in all positions, e.g., by using drawings and equations with a symbol for the unknown number to represent the problem.” |
| `2.OA.B.2` | “Fluently add and subtract within 20 using mental strategies. (See standard 1.OA.6 for a list of mental strategies.) By end of Grade 2, know from memory all sums of two one-digit numbers.” |
| `2.OA.C.3` | “Determine whether a group of objects (up to 20) has an odd or even number of members, e.g., by pairing objects or counting them by 2s; write an equation to express an even number as a sum of two equal addends.” |
| `2.NBT.B.5` | “Fluently add and subtract within 100 using strategies based on place value, properties of operations, and/or the relationship between addition and subtraction.” |
| `2.NBT.B.6` | “Add up to four two-digit numbers using strategies based on place value and properties of operations.” |
| `2.NBT.B.7` | “Add and subtract within 1000, using concrete models or drawings and strategies based on place value, properties of operations, and/or the relationship between addition and subtraction; relate the strategy to a written method.” The following sentence concerns hundreds, tens, ones and composing/decomposing units in three-digit arithmetic. |
| `2.MD.B.5` | “Use addition and subtraction within 100 to solve word problems involving lengths that are given in the same units, e.g., by using drawings (such as drawings of rulers) and equations with a symbol for the unknown number to represent the problem.” |
| `2.MD.B.6` | “Represent whole numbers as lengths from 0 on a number line diagram with equally spaced points corresponding to the numbers 0, 1, 2, ..., and represent whole-number sums and differences within 100 on a number line diagram.” |
| `3.OA.A.3` | “Use multiplication and division within 100 to solve word problems in situations involving equal groups, arrays, and measurement quantities, e.g., by using drawings and equations with a symbol for the unknown number to represent the problem.” |
| `3.OA.A.4` | “Determine the unknown whole number in a multiplication or division equation relating three whole numbers.” |
| `3.OA.C.7` | “Fluently multiply and divide within 100, using strategies such as the relationship between multiplication and division (e.g., knowing that 8 × 5 = 40, one knows 40 ÷ 5 = 8) or properties of operations. By the end of Grade 3, know from memory all products of two one-digit numbers.” |
| `3.NBT.A.2` | “Fluently add and subtract within 1000 using strategies and algorithms based on place value, properties of operations, and/or the relationship between addition and subtraction.” |
| `3.MD.A.2` | “Measure and estimate liquid volumes and masses of objects using standard units of grams (g), kilograms (kg), and liters (l). (Excludes compound units such as cm^(3) and finding the geometric volume of a container.) Add, subtract, multiply, or divide to solve one-step word problems involving masses or volumes that are given in the same units, e.g., by using drawings (such as a beaker with a measurement scale) to represent the problem. [Excludes multiplicative comparison problems (problems involving notions of “times as much”)]” |
| `4.MD.A.2` | “Use the four operations to solve word problems involving distances, intervals of time, liquid volumes, masses of objects, and money, including problems involving simple fractions or decimals, and problems that require expressing measurements given in a larger unit in terms of a smaller unit. Represent measurement quantities using diagrams such as number line diagrams that feature a measurement scale.” |

## Proposed Disposition

### Proposed Active Targets

The existing non-range dimensions remain: operation/relation, units, representations, learner action,
operand count, sign/zero and task structure. Exceptions are the explicitly described two-digit-addend
correction and the required migrations of exact lower/upper conjunctions. No band is added solely to
balance the dataset or to hide a matching failure.

#### Comparison definitions

| Definition | Current target domain | Recommended mathematical domain | Upper bands | Lower treatment | Authored count |
| --- | --- | --- | --- | --- | ---: |
| K.CC.C.6-compare-groups-by-counting | positive 1..10 | positive 1..10 | 5,10 | Target may remain lower-unspecified; generator selects the strongest additional lower profile | 3→6 |
| K.CC.C.6-compare-groups-by-matching | positive 1..10 | positive 1..10 | 5,10 | Same | 3→6 |
| K.CC.C.7-compare-numerals | positive 1..10 | positive 1..10 | 5,10 | Same | 3→6 |
| 1.NBT.B.3-place-value-comparison | 10..100 | **10..99** | 20,100 | Exact lower 10/20 variants, correlated with upper and relation | 3→8 |
| 2.NBT.A.4-compare-three-digit | 100..1000 | **100..999** | 120,1000 | Exact lower 100/120 variants, correlated with upper and relation | 3→8 |
| 4.NBT.A.2-compare-multi-digit-numbers | 1000..1,000,000 | Keep 1000..1,000,000 as this cohort's reviewed advanced-practice focus | 10000,100000,1000000 | Exact lower 1000/10000/100000 variants, correlated with upper and relation | 3→15 |

The proposed comparison count is **18 → 49 authored targets**, conditional on the lower/endpoint
recommendations below. Fifteen existing conjunctions remain, 34 are added and three legacy equality
conjunctions are replaced. A read-only probe matches all 49 through the existing intended routes;
that proves current capability coverage, not canonical sampling or the proposed 99/999 restrictions.

Grade 4's lower 1000 remains an explicit advanced-practice selection. The source word “multi-digit”
does not mean at least 1000; smaller multi-digit practice remains legitimate but is not newly added
to this cohort. Grade 1's current inclusion of 100 was an explicitly documented approximation, and
Grade 2 similarly admits 1000. Recommend correcting these cohorts to exact two-/three-digit
domains, while keeping ontology upper labels inclusive. This is a disclosed sampling-domain change.

#### Arithmetic definitions other than Grade 4 measurement

Bands in this table are upper-label thresholds on the maximum relevant magnitude, not lower limits
on every operand. Counts include every current permutation of each definition, including the
three-operand branch. Counts include correlated lower variants where a target already requests a
positive lower bound; upper thresholds alone do not define the complete configuration.

| Definition | Existing upper / extra dimensions | Recommended upper bands | Whole authored count | Rationale and limits |
| --- | --- | --- | ---: | --- |
| `K.OA.A.1-represent-operations` | 10; Add/Sub, TwoOperands, PhysicalNumbers, execution | 5, 10 | 2 → 4 | Both small object-group foundations and through-ten operation representation are meaningful. Ten is the existing curricular choice, consistent with adjacent K.OA work; it is not a hard ceiling in this leaf's wording. Do not expand sounds/acting into static modalities. |
| `K.OA.A.2-word-problems` | 10; Add/Sub, SingleStep, textual reception | 5, 10 | 2 → 4 | Both bands preserve the story-solving task within the explicit ceiling. Retain the unknown-input routes; do not reduce all variants to hidden results. |
| `K.OA.A.5-fluency` | 5; Add/Sub, TwoOperands, execution | 5 | 2 → 2 | Hard source ceiling five. No higher band; timing/mental retrieval remains unproved by a static image. |
| `1.OA.A.1-word-problems` | 20; Add/Sub, SingleStep, textual reception | 5, 10, 20 | 2 → 6 | Hard ceiling twenty; easier and beyond-ten word situations are all meaningful. Preserve situation/unknown-position coverage, rather than interpreting the new range variants as complete coverage of every source situation. |
| `1.OA.C.6-fluency` | 10,20; Add/Sub, TwoOperands, execution | 5, 10, 20 | 4 → 6 | Retain the accepted pilot interpretation: this existing definition covers direct calculation within twenty as well as the within-ten fluency foundation. Strategy-specific siblings retain their own conditions; do not add upper 5 to make-ten. See the Grade 1/2 distinction below. |
| `1.OA.D.8-unknown-number` | 20; Add/Sub, Equation, TwoOperands, Formalization | 5, 10, 20 | 2 → 6 | Unknown-value reasoning remains meaningful at all three magnitudes. Twenty is the existing Grade 1 curricular domain, not an explicit numeric ceiling in this leaf. Bound the necessary hidden operand/result. |
| `1.OA.D.8-unknown-operand` | 20; Add/Sub, Equation, TwoOperands, ProcedureInversion | 5, 10, 20 | 2 → 6 | Same numerical rationale; preserve the inverse learner action as a separate dimension, rather than merging it with equation formalization. |
| `2.OA.A.1-one-step-word-problems` | 100; Add/Sub, SingleStep, textual reception | 5, 10, 20, 100 | 2 → 8 | Hard ceiling 100. Small problems can assess story structure independently of calculation burden; the upper 100 band adds the within 100 challenge. Existing two-step sibling definitions remain separate. |
| `2.OA.B.2-fluency` | 20; Add/Sub, TwoOperands, execution | 20 | 2 → 2 | Deliberate later-grade focus on tasks whose maximum is above 10, retaining the original target set and earlier-grade foundational exposure. This is curriculum sampling, not a source prohibition on smaller tasks. Mental performance/recall remain existing beyondScope entries. |
| `2.OA.C.3-even-equal-addends` | 20; Addition, Equation, IteratedOperation, EvenNumbers, TwoOperands, Formalization | 5, 10, 20 | 1 → 3 | The even-total relation is genuine at totals 2/4, 6/8/10 and 12..20. Keep equal addends and even result; the upper threshold 20 follows the group-size ceiling, not a bound of 20 on each addend alone. |
| `2.NBT.B.5-fluency` | 100; Add/Sub, TwoOperands, execution | 20, 100 | 2 → 4 | Prefer multi-digit task magnitudes: maxima 11..20 supply first two-digit/place-value work, 21..100 supply the larger challenge. Do not multiply foundation-only ≤10 execution into a place-value/properties competency by default. This retires those low-maximum draws from this definition as a curriculum choice, not as mathematically false examples. Generic equation rendering alone does not prove the source's specified strategy use. |
| `2.NBT.B.6-two-three-addends` | ≥10/≤100; Addition; TwoOperands or ThreeOperands | TwoOperands:20,100,120,1000; ThreeOperands:100,120,1000 | 2 → 12 | Source fixes each operand at 10..99, not the total at 100. Add explicit two-digit largest-operand control and correlated canonical lower 10/20 variants: six for each operand count. See coordinated domain repair below; this is not a helper-only edit. |
| `2.NBT.B.7-written-add-subtract` | 1000; Add/Sub, TwoOperands, execution | 20, 100, 120, 1000 | 2 → 8 | Keep multi-digit calculations, including two-digit scaffolding and both catalog bands above 100. Do not add foundation-only whole tasks≤10 by default. Concrete-regrouping/model-to-written sibling competencies still carry their own source evidence. Plain computation alone does not establish those broader methods. |
| `2.MD.B.5-length-word-problems` | 100; Add/Sub, CentimeterScale, SingleStep, textual reception | 5, 10, 20, 100 | 2 → 8 | Hard ceiling 100; small same-unit lengths remain genuine measurement word problems. No conversions, different-unit arithmetic or geometric area/volume is introduced. |
| `2.MD.B.6-number-line-arithmetic` | 100; Add/Sub, Numberline, TwoOperands, execution | 5, 10, 20, 100 | 2 → 8 | Hard sum/difference ceiling 100; short number-line operations are meaningful. Keep the arithmetic clause separate from the rooted-length clause already served by its own producer. A through 5 integer tick layout is a local clarity improvement, not an operand-domain change. |
| `3.OA.A.3-multiplication-division-word-problems` | 100; Mul/Div, SingleStep, textual reception | 5, 10, 20, 100 | 2 → 8 | Hard ceiling 100. Small equal groups and identity facts remain meaningful story structures, alongside larger totals. Every matched view must preserve the appropriate grouping/measurement situation. |
| `3.OA.A.4-unknown-multiplication-division` | 100; Mul/Div, Equation, TwoOperands, inversion | 5, 10, 20, 100 | 2 → 8 | Unknown-factor/dividend/divisor reasoning is meaningful throughout the existing Grade 3 within 100 domain. The leaf itself has no hard 100 ceiling; this is consistent curriculum scoping from nearby OA work. Include the necessary unknown in the maximum. |
| `3.OA.C.7-compute-within-100` | 100; Mul/Div, TwoOperands, execution | 5, 10, 20, 100 | 2 → 8 | Hard ceiling 100; small identity/factor facts are part of the fact repertoire, not inherently irrelevant exercises. This generic computation slice does not prove recall, timing or the strategy method supplied by more-specific siblings. |
| `3.NBT.A.2-add-subtract-within-1000` | 1000; Add/Sub, TwoOperands, execution | 20, 100, 120, 1000 | 2 → 8 | Same multi-digit direct-computation sampling as the existing Grade 2 written slice; the exact old equivalence declaration remains structurally synchronized. Strategy/algorithm siblings are not automatically expanded. |
| `3.MD.A.2-same-unit-word-problems` | Add/Sub≤1000; Mul/Div≤100; three unit contexts (g,kg,L), SingleStep, textual reception | Add/Sub:5,10,20,100,120,1000; Mul/Div:5,10,20,100 | 12 → 60 | This leaf has no numerical ceiling. Retain current caps as explicit Grade 3 curriculum choices, aligned with within 1000 addition/subtraction and within 100 multiplication/division. Small and large masses/volumes all remain meaningful; do not falsely describe those caps as source requirements. Preserve same units, one step, and exclusion of multiplicative comparison. |

The table gives **51 → 179 authored permutations** across these 20 definitions, including the
correlated lower variants for `2.NBT.B.6`. Fifty of the current 51 route through arithmetic pairs; the
remaining permutation uses triples. These are source-plan counts, not distinct images or verified
future matching totals.

For Grade 1/2 fluency, retain the accepted Grade 1 5/10/20 plan and Grade 2's upper 20-only practice
focus. Grade 2 still permits small operands when another required value exceeds 10; foundation-only
whole tasks remain represented by earlier-grade targets. This is a reviewed curriculum choice, not
a claim that Grade 2 prohibits small facts. It preserves current source associations and avoids an
unjustified equivalence between distinct full source leaves.

The alternative is to restrict Grade 1's definition to its within 10 fluency clause and expand Grade 2
through 20. That is coherent but removes two Grade 1 generic execution source associations. Existing
Grade 1 strategy tasks assess understanding and do not replace those exact execution requests.
Expanding both generic definitions to identical sets and adding a convenience equivalence is rejected
under TSPEC-8. Existing historical equivalences must stay synchronized but are not re-certified here
as mutual equivalence of their complete source leaves.

#### Grade 4 measurement, including the eight previously unbounded targets

Recommend canonical uppers **5, 10, 20, 100** for the core same-unit whole-number stories. This is a
dataset sampling envelope, **not a limit stated by 4.MD.A.2**. Moderate integer quantities keep the
operation-with-units competency visible; the source's fractions, decimals, conversions and diagrams
are separately represented. Grade 4's million ceiling is stated for its NBT domain and must not be
silently imported as a measurement requirement.

The narrower envelope than Grade 3's addition/subtraction practice is intentional: these Grade 4
stories emphasize applying operations to measurement quantities, while the broader source progression
also comes from new number kinds and unit relationships. A later justified high-range story cohort
remains possible. Merely retaining arbitrary safe-integer draws and labeling them upper 1,000,000
would be false.

The existing definition has 60 targets: five units × three number kinds × four operations. All 60
match `measurement-word-problems#measurement-word-problem-grade4`; eight integer kilogram/liter
targets additionally match `arithmetic-ops-pairs#measurement-word-problem`, giving 68 current routes.
The eight have no explicit range or width label; their eight unique generic configurations come
from four operations × two fallback widths, shared across the two units.

| Suffix after `4.MD.A.2-measurement-word-problems~` | Operation | Unit |
| --- | --- | --- |
| `e665d4ea` | Addition | Liter |
| `38a1775e` | Subtraction | Liter |
| `77d2d00c` | Multiplication | Liter |
| `43d27383` | Division | Liter |
| `4454ec0f` | Addition | Kilogram |
| `dabfc001` | Subtraction | Kilogram |
| `4cb87041` | Multiplication | Kilogram |
| `06572448` | Division | Kilogram |

Adopt the integer family coherently across all five units (meter, hour, liter, kilogram, dollar),
not through exceptions for eight target IDs. Ordinary matching-capable range profiles must be added
to both producers before target expansion. Twenty integer permutations become 80; the 40 fractional
and decimal permutations remain unchanged, giving **60 → 120** for the definition. The eight shared
requests become 32 band-specific successors. Their original unbounded IDs change, while the source
prefix, non-range claims and both intended producer paths are preserved through successors.

Under only the existing pair set this projects 68 → 152 routes: 80 specialized integer, 32 generic
integer and 40 unchanged noninteger routes. This is not a global matching forecast: new specialized
range capabilities can admit additional bounded targets elsewhere and require a complete diff.

Exact enumeration proves the specialized producer's entire current integer support fits the envelope:

| Operation | Current support | Maximum | Counts in upper 5 / 10 / 20 / 100 |
| --- | --- | ---: | --- |
| Addition | Ordered operands 2..20 | 40 | 3 / 25 / 125 / 208 (361 total) |
| Subtraction | Subtrahend 2..10, positive answer 1..15 | 25 | 6 / 30 / 84 / 15 (135 total) |
| Multiplication | Groups 2..6, quantity per group 2..12 | 72 | 1 / 7 / 15 / 32 (55 total) |
| Division | Groups 2..6, quantity per group 1..12 | 72 | 5 / 8 / 15 / 32 (60 total) |

Every operation has support in every selected band. These are exhaustive finite-support counts,
not sample estimates. The generic arithmetic tail above 100 is deliberately retired from this proposed
cohort; that is a mathematical-support reduction, not just reweighting. All quantities serving as
inputs/results count, including a dimensionless group count and a hidden answer.

| Operation | Feasible bands with generic single-digit largest operand | With multiple-digit largest operand |
| --- | --- | --- |
| Addition | 5,10,20 | 20,100 |
| Subtraction | 5,10 | 10,20,100 |
| Multiplication | 5,10,20,100 | 10,20,100 |
| Division | 5,10 | 10,20,100 |

Do not over-filter boundaries: `9+9=18` and `3×7=21` use single-digit operands, while `10−1=9`,
`1×10=10` and `10÷1=10` have a two-digit operand but canonical upper 10. Existing owner resolvers
need corresponding faithful width choices; mathematical feasibility does not prove today's schema
already admits them. No inferred labels or after-generation completion is needed.

Alternative: retain broad targets and select finite bounds through ordinary schema fallbacks. This
preserves target IDs and can produce truthful additional annotations, but does not allocate a target
per reviewed band. With the current per-route draws, some bands might never be represented. It is a
valid staging option, not the recommended final state. Adding bounds to targets alone would lose the
specialized routes because that producer currently declares no range capabilities.

### Proposed Beyond-Scope Entries

None added. Existing mental-performance, memory-retrieval and non-image modalities stay separate;
range refinement does not make them observable in static artifacts.

### Proposed Intentional Equivalences

None added. Retain and audit existing declarations; do not create aliases for partial overlaps or
identical currently supported slices. In particular, keep the Grade 1/2 fluency distinction above.

### Proposed Ontology TODOs

None required for the recommended endpoint exclusion. Preserve the ontology's inclusive bound
definitions and recorded descriptor conflicts. Do not repurpose arithmetic operand-digit scopes for
compared numerals merely to enforce two-/three-digit comparison domains.

### Proposed Implementation Work

| Work | Existing roles to extend | Required evidence |
| --- | --- | --- |
| Canonical range profiles | `comparison`, `arithmetic-ops-pairs` | Selected upper/lower witnesses, feasible joint choices, direct/planned resolution parity |
| Secondary array routes | `number-array` with `operations-number-array-total` | Canonical quantities and ranges for existing addition/multiplication target matches |
| Two-digit addend source correction | `arithmetic-ops-pairs`, `arithmetic-ops-triples`, `arithmetic-ops-four` and their existing views | Every operand 10..99; correct whole-task sum bounds for two, three and four addends |
| Integer measurement adoption | `measurement-word-problems`, `arithmetic-ops-pairs`, existing measurement views | Every reviewed band populated, both shared routes retained, other number kinds unaffected |
| Number-line clarity | Shared arithmetic number-line view body | A through 5 integer axis for upper 5 tasks; preserve required model and zero handling |

No new producer split is proposed. These are reviewed implementation batches, not new authored TODO
exports or a claim that source-ready generation already exists.

### Disposition Summary

| Reviewed scope | Current authored permutations | Recommended source-band stage |
| --- | ---: | ---: |
| Six comparison definitions | 18 | 49, including correlated explicit lower variants |
| Twenty arithmetic definitions excluding Grade 4 measurement | 51 | 179, including correlated explicit lower variants |
| Grade 4 measurement definition | 60 | 120, including 40 unchanged noninteger targets |
| Four-addend sibling, coordinated source correction | 1 | 6, including correlated explicit lower variants |

These are authored counts for the reviewed scope. Normalization, unchanged definitions and current
capability coverage are accounted for below; image counts require allocation and generation.
The combined read-only proposal check records implementation gaps separately from source recommendations.

### Combined read-only matching review

The complete proposal was constructed in memory and checked with the production normalization
validators and matcher. No target file was changed. These counts include the four-addend sibling,
all twenty integer measurement combinations and the feasible strongest-lower variants for `2.NBT.B.6`.

| Metric | Current | Proposed, before producer adoption |
| --- | ---: | ---: |
| Authored permutations | 1,028 | 1,252 |
| Normalized label sets | 1,013 | 1,213 |
| Duplicate associations removed by normalization | 15 | 39 |
| Routes under current capability declarations | 1,222 | 1,434 |
| Unmatched normalized targets | 0 | 60 |

All structural normalization checks pass: unique IDs, permutations within definitions, complete
definition distinctness and freshness of existing equivalences. There are no errors or stale
equivalence warnings, and no equivalence was added. The 27 overlapping-label clusters include
12 new clusters. Overlap does not establish complete source-competency identity.

Of the raw IDs, 1,002 remain, 250 are added and 26 retire. Every retained raw ID keeps all its
existing routes. This is not a coverage-preservation verdict for their successors:

- **Twelve two-/three-addend proposals are unmatched.** The pair producer rejects six variants
  under its `largest-operand-width-domain` rule; the triple producer lacks the requested
  `TwoDigitLargestOperand` capability for six variants. Re-establish all nine original
  generator/view routes through appropriate successor targets. The four-addend proposals
  already match, but still need canonical-band verification.
- **Forty-eight integer measurement proposals are unmatched.** These cover meter, hour and
  dollar contexts. The other 32 kilogram/liter variants match the pair producer only. All
  **80** integer variants need the dedicated measurement producer to adopt range capabilities:
  retaining a fallback match does not preserve their existing dedicated route. The current
  28 integer source routes (20 dedicated + 8 pair) would otherwise become 32 pair-only routes.
- **All 49 comparison proposals match.** This proves declared capabilities, not strongest-bound
  generation, the proposed exact digit domains or endpoint behavior.

The existing array routes remain at upper 100. The written-add/subtract expansions additionally
acquire that array route through their upper 100 label sets; finer bands do not acquire it.
Other newly admitted view routes and cross-grade representatives also require semantic review
during adoption. The provisional 1,434-route count must not conceal the 60 unimplemented targets
or be reported as a ready dataset. Image/VQA totals require allocation, canonical generation and
deduplication; neither authored-target growth nor current matching alone determines them.

## Detailed Design Decisions

### Strongest lower bounds

**Recommendation: use the strongest positive catalog lower bound, chosen before generation.**
For the task's relevant quantities `Q`, define `m=min(abs(Q))`, `M=max(abs(Q))`. Select:

```text
U = the smallest catalog upper threshold at least M
L = the largest positive catalog lower threshold at most m, if one exists
```

The mathematical profile for upper `U` guarantees `previous(U) < M <= U` (only `M<=5` for the
smallest band). A lower `L` profile guarantees `L <= m < next(L)` when a next threshold exists. A no-positive-lower profile
guarantees `m < 5`; omit `NumbersLargerZero` as already agreed. Missing positive lower labels in
this validated convention are not arbitrary omissions. Profiles still need source and runtime
contract validation; an annotation-only dependency graph cannot infer an omitted lower witness.
For the largest catalog lower threshold, there is no finite next-threshold limit; the chosen
upper profile still constrains the complete configuration.

| Task | Recommended lower | Recommended upper | Reason |
| --- | ---: | ---: | --- |
| `2+3=5` | none | 5 | Minimum 2 is below the smallest positive floor |
| `6+7=13` | 5 | 20 | Minimum 6 and maximum 13 |
| `10+10=20` | 10 | 20 | The result prevents a singleton-boundary case |
| `30+2=32` | none | 100 | The small operand remains part of the task |
| `45+50=95` | 20 | 100 | A lower 10 annotation would be unnecessarily weak |
| `11=11` | 10 | 20 | Equality is allowed away from a catalog threshold |
| `350=350` | 120 | 1000 | The catalog has no lower 200 or 300 |

Use the same mathematical quantity interpretation in both Question and Solution modes, including
necessary hidden answers. Compared cardinalities/numerals are inputs; the relation is the answer.
Arithmetic uses operands and required result. Counting progress, place-value digits and axis ticks
used only to represent those quantities do not become independent operands. A separate conversion
task must review its genuine conversion inputs; the same-unit recommendations do not silently cover it.

This uses ordinary matching-capable mathematical profiles. Every callback/configuration is resolved
before generation; choose a feasible interval cell and construct the exercise inside it. Do not
derive annotations from the drawn payload, and do not choose labels independently then retry empty
combinations. Keep operation, digit-width, sign/zero, cardinality and range compatibility correlated.

Targets without a lower requirement may remain partial requests and admit these additional profiles.
Targets with an explicit lower requirement need reviewed lower variants: under current matching,
`NumbersLarger20` does **not** satisfy `NumbersLarger10`. Do not emit both a weaker and stronger
lower just to keep the old match. This is target refinement, not an `implies` matching extension.

Alternatives are inferior for this training objective: keeping whatever weak lower the source target
requested makes identical mathematics depend on hidden authoring choices; omitting all lower labels
discards useful information and breaks existing lower requests; deriving a lower after generation
violates the agreed architecture. Strongest lower profiles preserve a rule the classifier can apply
to the mathematical exercise itself.

### Endpoint policy

**Recommendation: exclude only examples whose relevant absolute magnitudes all equal one positive
catalog threshold: `m=M=T`.** The user approved this narrow training-domain restriction on
2026-11-01. It preserves ordinary equalities and mixed-magnitude boundary examples.

Exclude, for example, `10=10` and `100=100`; keep `11=11`, `10<20`, `100<120` and `10+10=20`.
For signed contexts the same magnitude rule would exclude `-10<10` too. Do not define the policy as
one distinct signed value. None of the reviewed comparison leaves requires a particular excluded
threshold equality; each retains equality, Less and Greater. Exact threshold values remain usable
when another relevant magnitude differs.

The pinned ontology marks all nine same-threshold lower/upper pairs incompatible while defining
both boundaries inclusively. Its descriptor-level conflict intentionally allows shared instances;
that is not automatically an ontology defect. The probe also confirms no conflict for the 36 positive
catalog pairs with `L<U`. Preserve those semantics and ordinary conflict enforcement.

| Alternative | Consequence |
| --- | --- |
| Upper wins; omit the equal lower | Keeps the exercise, but can drop a requested lower capability; requires source-domain/profile ownership and target migration. Grade 1's current view also rejects explicit upper 10 targets. |
| Use the preceding weaker lower | Adds an exception to strongest-lower labeling; `10=10` would use lower 5 despite lower 10 being true. |
| Keep the lower and use a looser upper | Reintroduces the hidden-domain ambiguity and violates the canonical upper witness. |
| Permit both by changing ontology/compatibility | Broader semantic and release/adoption work; unnecessary for preserving these source competencies. No local bypass is proposed. |

The recommended exclusion is simpler and applies uniformly. It does reduce mathematical support;
record that fact instead of describing it merely as a sampling-weight change. If retaining those
particular examples is important later, revisit a documented endpoint annotation convention and its
matching consequences together.

### Correlated lower/upper target variants

For exact-width comparison, equality cannot occupy arbitrary lower/upper combinations:

| Family | Lower | Upper | Relations |
| --- | ---: | ---: | --- |
| Grade 1 | 10 | 20 | Less,Equal,Greater |
| Grade 1 | 10 | 100 | Less,Greater |
| Grade 1 | 20 | 100 | Less,Equal,Greater |
| Grade 2 | 100 | 120 | Less,Equal,Greater |
| Grade 2 | 100 | 1000 | Less,Greater |
| Grade 2 | 120 | 1000 | Less,Equal,Greater |
| Grade 4 | 1000 | 10000 | Less,Equal,Greater |
| Grade 4 | 1000 | 100000 | Less,Greater |
| Grade 4 | 10000 | 100000 | Less,Equal,Greater |
| Grade 4 | 1000 | 1000000 | Less,Greater |
| Grade 4 | 10000 | 1000000 | Less,Greater |
| Grade 4 | 100000 | 1000000 | Less,Equal,Greater |

Canonical upper 100 equality is above 20, so its strongest lower is 20, not 10. The following three
old exact conjunctions must migrate to the corresponding canonical equality successors:

- `1.NBT.B.3-place-value-comparison~117c3259`
- `2.NBT.A.4-compare-three-digit~3f4f9a39`
- `4.NBT.A.2-compare-multi-digit-numbers~33bfdd0b`

This refines the earlier upper-only feasibility conclusion: all source competencies retain routes,
but full canonical lower labeling cannot preserve every old exact target ID. Kindergarten comparison
targets can remain lower-unspecified, with canonical lower profiles selected by the owner.

### Two-digit addend correction

`2.NBT.B.6` limits operands to two digits; it does not limit their sum to 100. Two, three and four
operands 10..99 can total 198, 297 and 396 respectively. Keeping only upper 100 underrepresents the
source; raising the bound without an operand-width guarantee would admit the wrong competency.

Recommend coordinated matching-capable two-digit operand control and these correlated profiles:

| Operand count | Canonical lower | Feasible canonical uppers |
| --- | ---: | --- |
| Two | 10 | 20, 100, 120 |
| Two | 20 | 100, 120, 1000 |
| Three | 10 or 20 | 100, 120, 1000 for each lower |
| Four | 10 or 20 | 100, 120, 1000 for each lower |

The explicit lower 10 target becomes reviewed lower 10/20 alternatives. Do not multiply in an empty
lower 100 choice when every operand is at most 99. `10+10=20` remains valid. The two-/three-addend
definition becomes **2 → 12**, and the four-addend sibling becomes **1 → 6**.

Lower refinement is not merely additive: two addends with strongest lower 10 have a smaller operand
at most 19, so their sum is at most 118. Thus lower 10/upper 1000 is empty under canonical witnesses;
the valid upper 1000 successor uses lower 20. Exact enumeration partitions all 8,100 ordered two-addend
tuples and all 729,000 three-addend tuples into six nonempty cells each. Explicit witnesses establish
all six four-addend cells, with every operand 10..99 and sums bounded by 396. These profiles retain the
full two-digit addition domain while replacing its old overly restrictive total ceiling.

The pair's existing smallest-width aliases are limited to upper 100; triples need a largest-width
extension, while the four-addend producer already declares two-digit operand extremes. Update all
three producers and their existing consumers together. This is a separate source-correction checkpoint
with successor-route evidence, not a helper-only edit.

### Matching, rendering and sampling consequences

Generic matching remains equality/specialization. New bounds and source corrections produce new
target IDs; overlap normalization can change representatives and seeds. Greater target counts also
change allocation and weighting. Accepted meaningful sampling growth does not establish these
specific domain recommendations as implemented or prove future dataset acceptance.

The comparison 99/999 restrictions belong in explicit local mathematical sampling profiles, not in
the shared ontology range resolver or a target-ID/grade switch. Their annotations remain inclusive
upper 100/1000. A selected upper label does not require sampling its endpoint in every cohort.
Do not silently change the meaning of a descriptor to implement exact digit counts.

Existing `number-array` routes for `2.NBT.B.5-fluency` addition and `3.OA.C.7-compute-within-100`
multiplication join the adoption scope. Measurement range capabilities may admit further routes.
Review every added/removed pair rather than assuming the two original generators are the entire
matching closure. Generic procedure execution does not by itself prove all strategy/model clauses;
range review preserves those inherited limitations instead of treating them as solved.

Identical retained payloads can use the existing renderers. A local integer-tick through 5 number line
removes the current scale-through 10 distractor for small-band tasks; shared consumers need controls.
Changed draws naturally change images, content fingerprints, replay identities and VQA keys.
Question and Solution judgments remain independent.

### Implementation sequence and validation

1. Lower/endpoint conventions and disclosed sampling-domain recommendations were approved on 2026-11-01.
2. Extend mathematical profiles and compatibility across the complete producer set; preserve all
   correlated claims and reject empty combinations before sampling.
3. Adopt reviewed target variants by coherent source family, including secondary routes and the
   two-/three-/four-addend source correction. Do not publish target-only changes as ready.
4. Run matching/distinctness checks, exact finite-support proofs where possible, boundaries and
   direct/planned resolution tests. Report old-to-new source associations and every support reduction.
5. Regenerate canonically and perform replay, split and independent VQA acceptance when source-ready.

## Approved decisions

1. Adopt strongest positive lower profiles, including explicit lower-target expansion where needed.
2. Exclude `m=M=T` threshold-singleton magnitude cases while retaining all other feasible comparisons.
3. Adopt the disclosed source-domain recommendations: exact 99/999 comparison caps, the Grade 4
   whole-number measurement envelope through 100, and the stated grade-specific practice selections.

All recommendations, including the two-digit addend correction and coordinated route adoption,
were accepted by the user on 2026-11-01. No further policy clarification is needed for these batches.

## Evidence

Read-only evidence is under `temp/canonical-range-source-review/`: source extraction and arithmetic
recommendations, `comparison.ts/.json`, `measurement-support.mjs` and `measurement.json`, and
`range-policy-probe.ts/.json`. The latter verifies all nine same-bound conflicts, no conflicts for
positive `L<U` catalog pairs, lack of lower 20→lower 10 capability substitution, and the comparison
cell counts 8/8/15. `combined-proposal-final.ts/.json` retains every final proposed target,
normalized representative, matching route and capability gap. `combined-proposal-feasibility.mjs/.json`
records the exact addend-domain partitions and witnesses. The earlier `combined-proposal.ts/.json`
and diagnostics retain the preliminary upper-stage audit separately. No production code, target definitions,
ontology, dataset or cache changes were
made for this review. Documentation checks and committed-state verification are recorded in the main plan.
