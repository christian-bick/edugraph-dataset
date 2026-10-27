# Local label dependency graph

Status: implemented as annotation-only validation. The repository contains one small graph,
a pure ontology-aware evaluator, and a shared strict gate and audit. Generator payloads and
rendered images are outside this initiative.

Next work: [repair rollout and consolidated backlog](#repair-rollout-plan) and
[algebra/parity decisions](#algebra-and-parity-decision-note). The
[second measurement batch](#second-measurement-batch), including M2b, is implemented.
[M3 operand-digit declarations](#m3-operand-digit-declarations-2026-10-27) are implemented
in separate division and multiplication checkpoints. The
[integer-only operand-digit gate](#integer-only-operand-digit-gate-2026-10-28) narrows the
remaining measurement obligation to ten integer addition/subtraction selections. The
[M4 width choices](#m4-integer-additive-width-choices-2026-10-28) repair these through
explicitly selected generator configurations and a separately approved sampling change.

## Scope

Use declarative TypeScript data and the exact installed `edugraph-ts` ontology. Dependency
edges require annotation groups; conflicts identify incompatible annotation claims. The
validator does not choose label values or mutate annotations.

The motivating analysis is in the sibling `edugraph-classify` documents
`UPSTREAM-LABEL-COMPLETENESS-20261003.md` and `UPSTREAM-ANNOTATION-HANDOFF-20261003.md`.
Those describe older snapshots; current identifiers and semantics come from this repo's
pinned ontology. There is no runtime dependency on a sibling repo or graph database.

Targets remain partial competency requests. Validate complete resolved generator/view
annotation sets and actual stored annotations. Do not alter targets, matching policy,
configuration, random draws, or images inside dependency validation. The separately
approved M4 generator work below adds explicit width choices before sampling; validation
still only checks annotations and never derives or completes them from generated values.

**Range-policy work is excluded.** The existing range-presence check remains report-only.
Do not recompute bounds, change thresholds or endpoint semantics, choose stronger ranges,
or rewrite range labels.

## Agreed Area allowlist

Apply the policy when the complete involved Area conjunction is nonempty and every Area
is a transitive structural descendant of at least one of:

- `Area.Arithmetic`
- `Area.IntuitiveMathematics`
- `Area.FormalMathematics`

Use all invariant and selected generator/view Areas. A path to any allowed root is enough,
even if the Area has other ancestors. Do not choose a primary Area, union alternative
schema choices, add an Arithmetic anchor, or introduce explicit algebra exclusions.
Organizational roots are selectors, never emitted annotations.

`AlgebraicExpression + Addition` is intentionally eligible; adding `EquationSolving` or
`AlgebraicModeling` puts the conjunction outside the allowed union. Empty Area sets,
unknown labels and ineligible labels are contract errors.

## Integer operand-digit qualification

The global Area allowlist above is unchanged. Within it, only the operand-digit obligation
has an additional qualification. It requires all three of:

- at least one complete resolved Area structurally within `Area.ArithmeticOperations` or
  `Area.IntegerArithmetic`;
- a nonempty set of declared number-kind labels, all structurally within `Scope.IntegerNumbers`;
- an operand-count or actual operand-digit descriptor.

This is a positive integer-context check. Fractional, decimal, mixed integer/noninteger, and
missing-number-kind annotations do not trigger a digit requirement. A missing number kind
still produces the existing numeric dependency finding; it is not inferred from an Area or
payload. Integer annotations outside the two arithmetic branches likewise do not trigger
operand-digit enforcement. Operand-count, numeric, fraction, decimal and conflict checks
keep their own existing triggers.

Both Area and number-kind qualification are necessary with the installed ontology. Generic
`Addition` and `Subtraction` belong to `ArithmeticOperations`, not `IntegerArithmetic`.
Conversely, integer-branch standard-algorithm Areas are also used by the decimal
addition/subtraction generator. Area membership alone would either omit the measurement
integer cases or enforce digit counts on decimal contexts.

The digit facet accepts value-bearing width descriptors: single/multiple-digit smallest
operand, largest operand, dividend and divisor, including their capability specializations.
It does not accept the four role-group nodes as completed classifications. An existing
truthful integer-role descriptor on a fractional or decimal task is retained; absence of
such a descriptor is simply outside the integer-only digit obligation. No label is added,
removed or inferred by this qualification.

## Graph markup

The graph is authored in `src/validation/label-dependencies.ts`:

```ts
import {Area, Scope} from 'edugraph-ts/generated';
import type {LabelDependencyGraph} from '../types/label-dependencies.ts';

/** Repo-local assessment obligations. Grouping roots never become annotations. */
export const labelDependencies = {
    version: 1,
    context: {
        allAreasWithin: [Area.Arithmetic, Area.IntuitiveMathematics, Area.FormalMathematics],
        requireArea: true
    },
    facets: {
        numeric: {root: Scope.NumericAbstraction},
        numberKind: {root: Scope.NumericSpace},
        numeralSystem: {root: Scope.Numerals},
        base: {root: Scope.NumericBase},
        range: {root: Scope.NumericRange, check: 'presence-only'},
        sign: {root: Scope.NumericSign},
        zero: {root: Scope.NumericZero},
        operandCount: {root: Scope.OperandCardinality},
        operandDigits: {labels: [
            Scope.SingleDigitSmallestOperand, Scope.MultipleDigitSmallestOperand,
            Scope.SingleDigitLargestOperand, Scope.MultipleDigitLargestOperand,
            Scope.SingleDigitDividend, Scope.MultipleDigitDividend,
            Scope.SingleDigitDivisor, Scope.MultipleDigitDivisor
        ]},
        fraction: {root: Scope.FractionNumbers},
        fractionMagnitude: {labels: [Scope.ProperFractions, Scope.ImproperFractions]},
        decimal: {root: Scope.DecimalNumbers},
        referenceFrames: {root: Scope.ReferenceFrameComplexity}
    },
    rules: [
        {id: 'LD-NUM-01', when: {any: [{family: 'numeric'}, {family: 'numeralSystem'},
            {family: 'operandCount'}, {family: 'operandDigits'}]},
            assess: ['numberKind', 'numeralSystem', 'base', 'range', 'sign', 'zero']},
        {id: 'LD-OPERANDS-01', when: {any: [{family: 'operandCount'}, {family: 'operandDigits'}]},
            assess: ['operandCount']},
        {id: 'LD-OPERANDS-02', when: {all: [
            {any: [{areaWithin: Area.ArithmeticOperations}, {areaWithin: Area.IntegerArithmetic}]},
            {familyWithin: {family: 'numberKind', root: Scope.IntegerNumbers}},
            {any: [{family: 'operandCount'}, {family: 'operandDigits'}]}
        ]}, assess: ['operandDigits']},
        {id: 'LD-FRACTION-01', when: {family: 'fraction'}, assess: ['fractionMagnitude']},
        {id: 'LD-DECIMAL-01', when: {family: 'decimal'}, assess: ['base']}
    ],
    conflicts: [
        {id: 'LD-ZERO-CONFLICT-01', facet: 'zero', labels: [Scope.NumbersWithZero, Scope.NumbersWithoutZero]},
        {id: 'LD-SIGN-CONFLICT-01', facet: 'sign', labels: [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives]},
        {id: 'LD-FRAME-CONFLICT-01', facet: 'referenceFrames',
            labels: [Scope.SingleFrameOfReference, Scope.MultipleFramesOfReference]}
    ]
} as const satisfies LabelDependencyGraph;
```

Family roots select eligible structural descendants. Explicit label groups also accept
capability specializations. Neither mechanism emits grouping roots as annotations.

`any` and `all` combine annotation conditions. `areaWithin` checks the complete resolved
Area conjunction for a descendant of its named root, including that root structurally;
it does not add the root as a label or replace the global all-Area gate. `familyWithin`
requires a nonempty selected family whose every member is structurally within its named
root. It cannot succeed vacuously when the family is absent. These selectors use only
annotations and ontology relations.

The five obligations are:

| Rule | Annotation trigger | Required groups |
|---|---|---|
| `LD-NUM-01` | Numeric Scope, numeral system, operand count, or operand digits | Number kind, numeral system, base, sign, zero, plus report-only range presence |
| `LD-OPERANDS-01` | Operand count or operand digits | Operand count |
| `LD-OPERANDS-02` | Operand count or operand digits, an arithmetic-operation/integer-arithmetic Area, and exclusively integer number-kind annotations | Operand digits |
| `LD-FRACTION-01` | Fraction annotations | Proper/improper magnitude |
| `LD-DECIMAL-01` | Decimal annotations | Numeric base |

Zero presence/absence, negative presence/absence, and single/multiple reference-frame
claims are explicit conflict groups. Other facets can legitimately contain multiple labels:
for example, a task can contain both proper and improper fractions or several operand counts.

Unit/nonunit fraction descriptors do not exhaust fractions, and the cataloged decimal
precisions stop at thousandths. These cannot be blanket completeness requirements. Written
explanation and reference-frame obligations also need a sound annotation trigger before
being added to this graph. Content inference is outside the validator.

## Evaluator and audit

`createLabelDependencyEvaluator().evaluate(labels, resolvedAreas?)` reads only annotations
and ontology membership. It returns context (`eligible`, `outside_policy_scope`, or
`invalid_context`), present/absent rule triggers, satisfied/missing group assessments,
conflicts and contract errors. Missing groups do not imply their correct member or an
opposing claim.

The audit enumerates complete admitted label assignments within the existing bound and
reads both splits of one immutable dataset snapshot. For each row it checks sample-key
identity and recovers authoritative resolved Areas from the recorded generation selection.
It never executes generators, reconstructs mathematical payloads or inspects image pixels.

Reports retain target/generator/view/sample/split/mode provenance and target associations.
The policy hash binds the graph, evaluator and relevant ontology records. Deterministic JSON
and Markdown are written only under `temp/label-dependencies/<spec>/`.

```bash
npm run audit:label-dependencies -- --spec=ccss
npm run audit:label-dependencies -- --spec=ccss --strict
```

The default command is report-only. Strict mode rejects missing non-range groups and
conflicts in every eligible actual sample, invalid contexts, structural annotation/row
errors, incomplete selection enumeration and missing/empty snapshots. Static selection
omissions remain advisory; selection conflicts and invalid contexts still fail. This is
an explicit rollout distinction, not an exception based on producer or payload support.

The same gate runs at the canonical artifact boundary before duplicate/retry acceptance,
rendering, fallback publication and retained target association; in dataset validation
before cached/live VQA; in repository checks; and before union-source replacement.
Pure draw helpers remain available for diagnostics. VQA independently checks whether an
exercise supports supplied labels.

## Scope cleanup

The initial implementation mistakenly introduced mathematical evidence extraction and
automatic label enrichment. This cleanup removes the adapters, optional payload-replay
command path, generation-time additions/replacements, extra annotation receipts, and their
special source/ontology/image identity tracking. The earlier implementation history remains
in Git rather than in active design documentation.

Generation emits invariant and resolved schema labels only. It does not infer operand
digit profiles, zero participation or property-law labels from a sampled payload. The
simple declaration fixes for counting articulation and Arabic numerals remain ordinary
module declarations.

Existing generated snapshots and passing VQA records are not rewritten or regenerated by
this cleanup. Their previously reviewed annotations remain historical data; old extra row
metadata is ignored by the generic row reader. New generation no longer emits that metadata.
Changing the generation machinery requires an authoritative graph rebuild before further
incremental generation.

One earlier repair depended on a special parity zero replacement. The stored even-parity
samples retain their corrected labels. Source checkpoint `3993827f` now removes the inherited
zero-absence declaration through ordinary ownership: common counting quantities are zero-neutral,
the selection producer explicitly retains its nonzero count claim, and the four positive-count
basic projections declare zero absence with corresponding payload guards.

Parity declares neither zero descriptor. Even counts expose an empty remainder, one object
exposes empty groups, and larger odd counts expose positive groups and remainder one. Neither
claim is an invariant, so future parity annotations report missing zero classification rather
than inferring a replacement. No schema field, adapter or post-draw completion is introduced.
The existing parity targets and every other production target continue to match unchanged.

## Current findings and next work

The current immutable snapshot is
`cada54596eb7b8fd3dc3dd293c5576d9ec8d6fa0f952134a356e1b462058f4c2`.
It contains 2,808 samples; 1,884 satisfy the Area allowlist. The label-only audit has
4,318 non-range rule/facet failures across 1,332 samples, with zero conflicts, invalid
contexts or structural row errors. There are 4,184 distinct sample/facet gaps because
134 missing-base requirements are activated by two rules.

| Missing facet | Distinct samples |
|---|---:|
| Zero participation | 1,082 |
| Numeral system | 830 |
| Numeric base | 788 |
| Sign | 616 |
| Operand digits | 490 |
| Number kind | 222 |
| Fraction magnitude | 130 |
| Operand count | 26 |

These counts overlap and identify missing groups, not the correct additions. Next repairs
should review invariant declarations and existing schema annotations by complete family.
Before adding a label, check ownership, truth across supported variants and projections,
and newly activated dependencies. Do not use storage types or absent opposing labels as
proof. New positive capabilities can admit additional matching tuples and require review.

Keep targets, the Area allowlist and range policy fixed. Verify declaration/spec contracts,
unit/integration tests and coverage, matching differences, canonical data/seed/fingerprint/
image preservation, and changed-label VQA for actual content repairs.

## Verification

Code checkpoint `acc3f3bb` removes the misunderstood-scope machinery. Verification on
2026-10-27 confirms:

| Check | Result |
|---|---|
| Complete suite | 835 files / 6,096 tests pass. |
| Generator coverage | Every generator meets the existing coverage thresholds. |
| Evaluator and generic gate | 99 tests; 100% statements, branches, functions and lines. |
| Audit and inspection | 40 tests including real matched declarations; 100% statements/functions/lines and 97.22% branches. |
| Generation/manifest regressions | 35 tests pass; selected annotations, replay origin and solution fallback are preserved. |
| Type and documentation checks | Pass; only five existing external-document fetch warnings. |
| Core-result comparison | All 4,020 prior subjects have identical annotation contexts, group outcomes and conflicts. |
| Strict snapshot audit | Same 4,318 failures across 1,332 samples; 1,884 eligible samples checked. |
| Audit determinism | JSON and Markdown are byte-identical across two runs. |
| Obsolete command option | The removed payload-evidence option exits with an unsupported-option diagnostic. |
| Repository gates | Six pass; the annotation dependency gate fails for the known omissions. |
| Artifact preservation | Immutable snapshot pointer, existing annotations, images and VQA cache remain unchanged; no regeneration or Gemini calls. |

Local verification records are under `temp/annotation-scope-cleanup/`. Earlier scoped passes
did not establish annotation completeness for the entire dataset. The strict repository gate
continues to report the known missing requirements until ordinary label repairs address them.

## Parity declaration verification

Checkpoint `3993827f` fixes the inherited zero-absence declaration without changing schema
choices or mathematical generation. `NumbersWithoutZero` belongs to the four nonempty basic
projections, with ordinary positive-count payload validation; the selection producer retains
its previous claim explicitly. Parity advertises neither zero descriptor and does not match
an explicit request for either one. Its unresolved zero group is an annotation finding,
not an inferred replacement claim.

| Check | Result |
|---|---|
| Full test suite | 836 files / 6,120 tests pass; every generator meets its coverage thresholds. |
| Focused counting/parity regressions | 85 tests pass across nine files. |
| Positive-count payload guard | 22 cases; 100% statements, branches, functions and lines. |
| Target preservation | All 1,013 normalized CCSS target conjunctions unchanged. |
| Matching preservation | All 1,180 semantic tuples unchanged; zero added or removed. |
| Counting-plan comparison | All 14 plans checked; only the two parity selections lose zero absence. |
| Determinism | All 40 stored counting origins reproduce their data, configurations, prepared PRNG state, random continuation and content/task fingerprints. |
| Other counting annotations | Unchanged for 26 nonparity basic and 10 selection samples. |
| Future parity annotations | Four compared draws omit zero absence and infer no replacement; empty groups/remainders remain represented by the unchanged view. |
| Source contracts | Type, ownership/spec, label, documentation and standards checks pass. |
| Dependency audit | Existing snapshot retains 4,318 strict findings; two additional source-selection zero omissions remain advisory. No conflicts or incomplete tuples. |
| Scope preservation | Area allowlist, range schema/policy, targets, sampler and pipeline unchanged; no adapters, automatic completion, dataset regeneration, cache edits or Gemini calls. |

Comparison records and test logs are under `temp/parity-declaration/`; positive-count coverage
is under `temp/parity-declaration-fix/positive-count-coverage/`. The immutable dataset pointer
remains the snapshot recorded above. Canonical regeneration of parity still requires an
explicitly reviewed zero-classification declaration strategy; this fix removes the false
invariant without hiding that remaining dependency.

## First measurement declaration batch

Checkpoint `e0b128e5` adds only invariant declarations to the two reviewed families:

| Owner | Added labels | Reason |
|---|---|---|
| `measurement-number-line` generator | `NumbersWithZero`, `NumbersWithoutNegatives` | Every exact tick lattice starts at zero and progresses through nonnegative values. |
| `measurement-number-line` view | `ArabicNumerals`, `Base10` | Both modes label the zero endpoint and render values using decimal digits, fractions or decimal notation. |
| `measurement-conversion-problems` generator | `NumbersWithoutZero`, `NumbersWithoutNegatives` | Source quantities, conversion factors, converted values, additional amounts and totals are strictly positive. |
| `measure-conversion-problems` view | `ArabicNumerals`, `Base10` | Stories, equivalences and solution equations use decimal digits. A unit conversion factor such as 60 is not a numeral base. |

No schemas, resolvers, sampling, rendering, pipeline code, target declarations, Area roots
or range rules change. A zero digit in a positive amount such as `0.25` is not a separate
zero-valued quantity. There are no adapters or post-generation additions.

The exact comparison of all 24 existing family plans and 70 stored draw origins preserves
selected choices, typed configurations, prepared PRNG state, random continuation, payloads
and content/task fingerprints. Future emission adds exactly four labels per existing sample.
Reevaluating those label sets closes 128 number-line and 190 conversion-story non-range
assessments: **318 → 0**, with no newly missing groups or conflicts. The 280 new annotations
resolve 318 rule/facet assessments because decimal base is checked by two rules.

All 1,013 normalized target conjunctions remain unchanged. Positive capability expansion
retains every existing match and adds two supported matches, bringing the semantic tuple
count from 1,180 to 1,182. These use the existing Grade 6 nonnegative fraction and decimal
rational-positioning targets, `6.NS.C.6c-rational-numberline-positioning~936ac89c` and
`6.NS.C.6c-rational-numberline-positioning~3046c66c`. Their requested point lies on the
unchanged nonnegative number line. All five unit fallbacks, both modes and four draws per
selection pass mathematical validation and the non-range gate (80 draws). They introduce
four train slots before deduplication; this does not promise four additional physical rows.

Stored annotations are not rewritten. A read-only manifest build with the persisted canonical
renderer identity requires 352 affected pairs, including 350 outside the requested two-family
scope. The scope guard rejects a narrow refresh, so this declaration-only batch does not
regenerate the broader dataset, bypass checks, change caches or call Gemini. The stored
snapshot audit consequently retains its 4,318 known strict findings; the source replay proves
the intended 318-finding reduction for these families when the declarations are emitted.

The 29 real-target integration regressions cover the 24 existing Grade 4/5 alternatives and
the two new Grade 6 matches. The seven existing scoped generator/view test files pass
(70 tests), and ownership, type, label, documentation and standards checks pass. The full suite
passes **837 files / 6,149 tests**. Coverage is 98.46% statements, 96.96% branches, 100%
functions and 99.51% lines; every checked generator meets its coverage thresholds. Evidence is under
`temp/measurement-declarations/`, including `baseline.json`, `comparison.json`,
`new-matches-and-scope.json` and `impact-report.md`.

## Broader regeneration attempt

The 352-pair freshness delta compares the complete working tree with the stored dataset;
the measurement declarations do not themselves introduce dependencies on 350 other pairs.
Earlier cleanup commit `acc3f3bb` removed the obsolete `RealizedLabelReceipt` interface from
`src/types/generation-plan.ts`. The source index follows type-only imports and hashes their
source text, so that shared source change alone reaches all 352 persisted pairs. Comparing
the stored and current plans finds 1,044 existing plans whose content hashes are unchanged
and whose only changed field is the input-provenance hash. Other pending changes include
the counting/parity declarations and the measurement batch. Local causal evidence is in
`temp/measurement-declarations/refresh-causes.json`.

After approval to regenerate the complete affected scope, the canonical command
`npm run generate:dataset -- --spec=ccss --rebuild-graph` selected all 352 affected pairs
and passed preflight for all 330 renderer views. Generation then stopped on
`6.EE.A.2a-write-letter-expressions~c3d1497f`, using `algebra-expressions` and
`algebra-expression-write`: its first train question lacks the `LD-NUM-01` base,
number-kind, sign and zero annotation groups. This is within the agreed Area allowlist;
the boundary continues to follow the ontology's Formal Mathematics membership.

The ordinary annotation gate threw before this family's rendering, and the transaction
rolled back the preceding staged work. The immutable dataset pointer and its digest remain
unchanged, so the stored audit still has its known findings. No source repair, target change,
gate exception, adapter, completion, cache update or Gemini evaluation was performed.
The complete execution log is `temp/measurement-declarations/regenerate-affected.txt`.
Regeneration remains blocked on the remaining declaration gaps, independently of approval
for its broader execution scope.

## Repair rollout plan

Status: planned on 2026-10-27, following checkpoint `af69020e`; M2 and M2b are now implemented.
The inventory below retains the pre-M2 baseline. The M2b verification checkpoint records
the updated totals; the other proposed decisions remain open.
The agreed Area allowlist and range-policy exclusion above remain fixed, as do the 1,013
normalized target conjunctions. The existing 1,182 semantic matches are the comparison
baseline. Truthful capability additions may admit further matches; review them explicitly
and retain the existing target coverage.

Use the current admitted annotation selections as the working backlog. Their values come
from ordinary invariant declarations and selected schema alternatives. The existing audit
enumerates these assignments without inspecting payloads or rendering images. Source review
and focused tests establish which labels are true; the graph continues to validate annotations
only. No adapter, post-draw completion or producer-specific validator is part of this rollout.

Classify a proposed repair before implementing it:

| Repair class | Required evidence | Action |
|---|---|---|
| Invariant | True for every supported configuration and compatible projection owned by the module | Add an ordinary `generalLabels` declaration at the correct owner. |
| Existing choice | The current schema choice already determines the distinction | Add the truthful label to that existing alternative; prove identical resolved values, admissible configurations and mathematical draws. |
| Decision | The distinction varies within a configuration, depends on the task projection, or lacks a justified ontology meaning | Record concrete examples and a recommendation; agree a normal model/schema or semantic change before implementation. |

Do not treat a missing family as evidence for a particular member. In particular, an
unrequired zero or negative value does not establish its absence. Follow
[SPEC-6](../spec-general.md#spec-6--reuse-shared-resolvers-pass-them-as-references) for
choice/default semantics and [SPEC-8](../spec-general.md#spec-8--no-duplicate-parameterization-across-the-generatorview-pair)
for ownership. Existing configuration distinctions can be annotated without introducing
new sampling behavior; introducing a new mathematical distinction is a separate decision.

### Working checkpoints

1. Review the algebra/parity decisions early, in parallel with the narrowly scoped second
   measurement batch. Prioritize shared, proven omissions rather than the alphabetical
   order in which generation first encounters a failure.
2. Implement small related batches from the inventory below. Before each batch, identify
   all compatible producers/consumers, the declaration owner, and any newly activated
   dependency rules. Report remaining gaps explicitly when a batch is intentionally partial.
3. Verify each batch with ownership/type/spec checks and relevant regression tests. Compare
   targets, matches, schema selections and representative stored-origin replays. For an
   annotation-only change, preserve resolved configurations, mathematical data, random
   continuation and content/task fingerprints of existing samples. Inspect every added
   match. Run the full required coverage gate for implementation checkpoints.
4. Re-run the complete selection audit after each batch. Record distinct selection/facet
   gaps, raw assessments and selections with gaps, together with closed and newly introduced
   findings. Commit each coherent repair and its verification notes on this branch. A
   partial batch can reduce facet gaps while leaving the number of incomplete selections
   unchanged; report both metrics.
5. Use zero non-range missing requirements, conflicts, invalid contexts and incomplete
   enumerations across current admitted selections as the readiness checkpoint for another
   full canonical run. This is a project work criterion, not a change to the report-only
   treatment of pre-draw omissions in the shared validator.
6. At readiness, run the already authorized full affected regeneration with an authoritative
   graph rebuild. Audit the resulting stored annotations, exact target coverage, image
   integrity and train/validation separation; inspect churn and newly admitted matches.
   Refresh VQA only for records needing it, reusing exact passing cache entries, then run
   the strict dataset audit. The stored snapshot is replaced only by a successful transaction.

The agent handles routine source review, implementation, verification and commits. User
checkpoints concern concrete semantic ambiguity or a proposed change beyond declarations;
each decision should include examples, affected labels, a recommended option and its impact.
Broad regeneration is already authorized. A failing label contract remains actionable work,
and this plan proposes no bypass of the shared gate.

The reproducible audit command for this checkpoint is:

```bash
npm run audit:label-dependencies -- --spec=ccss --output-dir=temp/label-dependency-next-plan/audit
```

Its policy hash is `f80dac1bb77b364ca754903051efb979d2ab9f62ff2a5da1ba57eb01dcc4f505`.
The stored generation is `cada54596eb7b8fd3dc3dd293c5576d9ec8d6fa0f952134a356e1b462058f4c2`.
The committed inventory below is the durable checkpoint; local `backlog.json` and
`build-backlog.mjs` under `temp/label-dependency-next-plan/` retain pair-level detail and
aggregation checks. They are verification artifacts, not runtime dependencies.

### Consolidated declaration backlog (2026-10-27)

This pre-M2 baseline audit enumerates all **1,222 admitted selections**, including **807 eligible selections**.
**616 selections across 81 generators and 171 generator/view pairs** have missing non-range groups.
They contain **1,750 distinct selection/facet gaps** and **1,788 raw rule/facet assessments**;
the 38 additional assessments are repeated base checks under numeric and decimal rules.
There are no conflicts, invalid contexts, incomplete tuple enumerations or row/label-contract errors.
The existing snapshot still contains 4,318 strict findings across 1,332 stored samples. Source selection
counts are the repair progress measure; stored findings change only after successful regeneration.

A selection is one admitted label assignment for a target and compatible generator/view pair.
It is not an image, a distinct implementation edit, or proof that the missing label has a particular value.
The table groups work by producing generator; the label owner must still be determined for each consuming view.
Wave grouping is an investigation order, not a claim that every listed gap is already proven fixable by declarations.

| Investigation wave | Generators | Pairs | Selections with gaps | Distinct selection/facet gaps | Raw assessments |
|---|---:|---:|---:|---:|---:|
| D | 3 | 9 | 25 | 100 | 100 |
| M | 9 | 14 | 129 | 604 | 631 |
| A | 36 | 75 | 290 | 427 | 427 |
| F | 33 | 73 | 172 | 619 | 630 |
| **Total** | **81** | **171** | **616** | **1750** | **1788** |

- **D — Expression decisions:** algebra, numerical expressions and powers; review semantics early in parallel with routine batches.
- **M — Measurement contexts:** measurement, currency, time and unit dimensions; implement the narrowly reviewed second batch first.
- **A — Arithmetic and counting:** shared operation, digit/count and place-value choices. The parity decision is reviewed early; its counts remain in A.
- **F — Fractions, decimals and rational/ratio contexts:** fraction magnitude, sign/zero and representation distinctions.

Apply source review within every wave to classify each proposed repair as a guaranteed invariant,
a fact already determined by an existing schema choice, or a variable/ambiguous fact requiring a decision.
No broad generator-level label additions are implied by this inventory.

| Missing facet | Distinct selection/facet gaps | Raw assessments |
|---|---:|---:|
| numberKind | 93 | 93 |
| numeralSystem | 328 | 328 |
| base | 312 | 350 |
| sign | 226 | 226 |
| zero | 444 | 444 |
| operandCount | 13 | 13 |
| operandDigits | 279 | 279 |
| fractionMagnitude | 55 | 55 |

The complete generator inventory follows. **P** counts affected generator/view pairs, **S** counts
admitted selections with at least one gap, and **G** counts distinct selection/facet gaps. Facet codes:
**K** number kind, **N** numeral system, **B** base, **Sg** sign, **Z** zero, **O** operand count,
**Dg** operand digits, **F** fraction magnitude. Range is excluded from every count below.

| Generator | Wave | P | S | G | Missing facets |
|---|---|---:|---:|---:|---|
| `algebra-expressions` | D | 3 | 14 | 56 | K, B, Sg, Z |
| `arithmetic-equation-judgment` | A | 1 | 2 | 2 | Z |
| `arithmetic-estimation` | A | 1 | 4 | 4 | Z |
| `arithmetic-known-fact-derivation` | A | 2 | 9 | 9 | Dg |
| `arithmetic-numerical-expressions` | D | 4 | 6 | 24 | K, B, Sg, Z |
| `arithmetic-operation-table` | A | 1 | 2 | 2 | Z |
| `arithmetic-ops-four` | A | 4 | 4 | 4 | Dg |
| `arithmetic-ops-pairs` | A | 11 | 118 | 168 | N, Z, Dg |
| `arithmetic-ops-triples` | A | 6 | 12 | 20 | Z, Dg |
| `arithmetic-paired-patterns` | A | 3 | 3 | 12 | K, B, Sg, Z |
| `arithmetic-patterns` | A | 5 | 16 | 16 | Z |
| `arithmetic-property-relations` | A | 2 | 6 | 12 | Z, Dg |
| `arithmetic-word-problems-rounding` | A | 1 | 8 | 8 | N |
| `comparison` | A | 2 | 6 | 12 | N, B |
| `counting-basic` | A | 2 | 4 | 6 | N, B, Z |
| `counting-classify-sort` | A | 1 | 2 | 4 | N, B |
| `counting-hundred-offset` | A | 1 | 2 | 2 | O |
| `counting-ten-offset` | A | 1 | 4 | 4 | O |
| `currency-arithmetic` | M | 1 | 18 | 108 | K, N, B, Sg, Z, Dg |
| `decimal-addition-subtraction` | F | 1 | 2 | 4 | Z, Dg |
| `decimal-comparison` | F | 1 | 3 | 12 | N, B, Sg, Z |
| `decimal-division-model` | F | 1 | 1 | 2 | Z, Dg |
| `decimal-multiplication-model` | F | 1 | 1 | 2 | Z, Dg |
| `decimal-notation` | F | 4 | 4 | 19 | N, B, Sg, Z, F |
| `decimal-place-comparison` | F | 1 | 3 | 6 | Z, Dg |
| `decimal-place-value-expanded` | F | 1 | 1 | 1 | Z |
| `decimal-place-value-scaling` | F | 1 | 1 | 3 | N, Sg, Z |
| `decimal-power-ten-scaling` | F | 1 | 2 | 2 | Z |
| `decimal-rounding` | F | 1 | 1 | 1 | Z |
| `decimal-writing` | F | 3 | 3 | 4 | N, Z |
| `equal-groups-collection` | A | 1 | 3 | 6 | K, Dg |
| `fraction-arithmetic` | F | 4 | 24 | 113 | N, B, Sg, Z, F |
| `fraction-benchmark-arithmetic` | F | 2 | 4 | 20 | N, B, Sg, Z, F |
| `fraction-comparison` | F | 2 | 7 | 28 | N, B, Sg, Z |
| `fraction-division-relations` | F | 6 | 18 | 72 | K, N, B, Z |
| `fraction-equivalence` | F | 5 | 7 | 28 | N, B, Sg, Z |
| `fraction-number-line` | F | 1 | 3 | 12 | N, B, Sg, Z |
| `fraction-products` | F | 3 | 4 | 20 | N, B, Sg, Z, F |
| `fraction-quotient-model` | F | 6 | 34 | 105 | K, N, B, Sg, Z, F |
| `fraction-scaling` | F | 2 | 5 | 20 | N, B, Sg, Z |
| `fraction-tenths-equivalence` | F | 2 | 2 | 10 | N, B, Sg, Z, F |
| `fraction-whole-equivalence` | F | 3 | 3 | 11 | N, B, Sg, Z |
| `integer-add-subtract-strategies` | A | 1 | 8 | 8 | Dg |
| `integer-addition-counting-on` | A | 2 | 4 | 4 | Dg |
| `integer-rounding` | A | 1 | 7 | 7 | Z |
| `integer-subtraction-counting-back` | A | 1 | 2 | 2 | Dg |
| `measurement-conversion` | M | 2 | 21 | 84 | K, N, B, Sg, Z |
| `measurement-length` | M | 2 | 10 | 10 | Z |
| `measurement-ratio-relations` | M | 1 | 1 | 4 | N, B, Sg, Z |
| `measurement-word-problems` | M | 1 | 60 | 320 | N, B, Sg, Z, Dg, F |
| `multi-digit-division` | A | 1 | 3 | 3 | Z |
| `multiplicative-comparison` | A | 2 | 3 | 3 | Dg |
| `number-array` | A | 3 | 7 | 12 | K, Dg |
| `numerical-power-expressions` | D | 2 | 5 | 20 | K, B, Sg, Z |
| `percent-quantity-relations` | F | 2 | 2 | 6 | N, B, Z |
| `place-value-arithmetic` | A | 3 | 21 | 48 | N, Z, Dg |
| `place-value-expanded` | A | 1 | 4 | 12 | Sg, Z, Dg |
| `place-value-scaling` | A | 1 | 1 | 2 | N, Z |
| `powers-of-ten` | A | 1 | 1 | 1 | Z |
| `ratio-table-comparisons` | F | 1 | 3 | 9 | N, B, Z |
| `ratio-tables` | F | 2 | 2 | 6 | N, B, Z |
| `rational-magnitude-contexts` | F | 2 | 3 | 9 | N, B, Z |
| `rational-magnitude-relations` | F | 1 | 2 | 6 | N, B, Z |
| `rational-numberline-values` | F | 2 | 12 | 40 | N, B, Z, F |
| `rational-opposite-relations` | F | 3 | 3 | 6 | N, B |
| `rational-order-contexts` | F | 2 | 4 | 16 | N, B, Sg, Z |
| `rational-order-relations` | F | 1 | 2 | 8 | N, B, Sg, Z |
| `signed-rational-contexts` | F | 3 | 3 | 9 | N, B, Sg, Z |
| `standard-algorithm-add-subtract` | A | 1 | 4 | 4 | Dg |
| `standard-algorithm-decimal-add-subtract` | A | 1 | 2 | 4 | Z, O |
| `standard-algorithm-decimal-division` | A | 1 | 1 | 2 | Z, O |
| `standard-algorithm-decimal-multiplication` | A | 1 | 1 | 2 | Z, O |
| `standard-algorithm-division` | A | 1 | 3 | 6 | Z, O |
| `standard-algorithm-multiplication` | A | 1 | 1 | 1 | Z |
| `time` | M | 4 | 11 | 46 | K, N, B, Sg, Z |
| `time-elapsed` | M | 1 | 2 | 8 | N, B, Sg, Z |
| `time-interval-arithmetic` | M | 1 | 4 | 16 | N, B, Sg, Z |
| `unit-dimension-relations` | M | 1 | 2 | 8 | N, B, Sg, Z |
| `unit-rate-relations` | F | 2 | 3 | 9 | N, B, Z |
| `whole-number-power-ten-scaling` | A | 1 | 1 | 1 | Z |
| `writing` | A | 6 | 11 | 14 | N, Z |
| **Total** | | **171** | **616** | **1750** | |

The first measurement batch (`measurement-number-line` and `measurement-conversion-problems`) has no
remaining non-range source-selection gaps and therefore is absent from this outstanding-work inventory.
Their historic stored-row findings remain until regeneration publishes the changed annotations.

## Algebra and parity decision note

Status: recommendations for review; no semantic policy, schema or generator change has been
implemented by this note. The current algebra-expression work comprises 14 eligible
assignments and 56 missing assessments. Parity adds two assignments missing zero classification;
these are included in the `counting-basic` inventory row, which also contains another view.

The pinned ontology `0.31.0-pre.58.9231304124e9` describes zero presence as zero being an
involved numerical value, zero absence as no such occurrence, negative presence as at least
one negative number, and negative absence as none of the involved numbers being negative.
`RationalNumbers` describes a numerical domain; `FractionNumbers` additionally describes
numerator/denominator representation. Hidden payload values alone do not establish an
observable claim. These distinctions follow the evidence and ownership review in
[label architecture](../label-architecture.md#canonical-payload-and-observable-projection)
and the ontology-backed eligibility rule in [SPEC-3](../spec-general.md#spec-3--most-specific-does-not-mean-leaf).

### Algebra: establish the numerical context of each projection

| Current projection | Eligible assignments | Observable mathematical context | Repair implication |
|---|---:|---|---|
| `algebra-expression-write` | 1 | Operation prose, a positive integer constant, an explicit rational variable domain and any nonzero restrictions; the solution writes the expression. The sampled binding and calculated result stay hidden. | A hidden negative, zero or fractional binding does not justify its label. Domain statements and restrictions need their own interpretation. |
| `algebra-expression-parts` | 11 | Symbolic alternatives show a symbolic frame; numeric alternatives show the substituted frame. Coefficient tasks expose negative, zero or positive coefficients. | Distinguish each relation/projection; blanket generator-level sign or zero labels are false. |
| `algebra-subexpression-interpretation` | 2 | Either a symbolic or a substituted numeric grouped frame. | Only the numeric alternative exposes the sampled binding; review the two alternatives independently. |

Seven other assignments across evaluation, formula and modelling views already fall outside
the exact Area allowlist through `NumericSubstitution` or `AlgebraicModeling`. They are not
new blockers for this initiative. This is the existing ontology boundary, not an algebra exclusion.

The [generator](../../src/generators/algebra/algebra-expressions/generator.ts) samples signed
rational bindings and, in its coefficient relation, coefficients from `[-3, -1, 0, 1, 2, 5]`.
The [structural model](../../src/generators/algebra/algebra-expression-helpers.ts) chooses
symbolic versus substituted expressions. The actual [task projections](../../src/visuals/views/operations/algebra-expression-view.tsx)
and [domain formatting](../../src/visuals/views/operations/algebra-expression-format.tsx)
determine which evidence is exposed. Existing [renderer tests](../../src/visuals/views/operations/algebra-expression-view.test.tsx)
cover hidden bindings and negative/zero/implicit-unit coefficients.

**Straightforward candidate:** add view-owned `Base10` to the three eligible leaves after
their normal ownership/matching review. Their digit formatting is already decimal. On the
current assignments this closes 14 of the 56 assessments, leaving 42. This note does not
implement that change or assume that new matches have already been reviewed.

**Decision A1 — Does a permitted value count as an involved value?** A statement such as
"x is a rational number" supplies domain evidence, but the zero/sign definitions do not
explicitly say that every permitted value thereby occurs in the exercise. For example,
writing `3 + x` and writing `3 / x` can both state a rational domain, while the second
also requires `x` to be nonzero. The generator's single `plain` choice can produce either
operation. A blanket zero claim cannot be justified just by reading the domain's name.

Recommendation: use explicit domains as evidence for number-kind review, keep hidden
bindings out of symbolic-view annotation reasoning, and settle the occurrence-versus-domain
interpretation with these examples before adding sign/zero claims. If existing ontology
definitions do not resolve it, prepare a precise ontology clarification for user review.
No ontology issue or ontology change is authorized by this documentation checkpoint.
Do not infer `FractionNumbers` from the mere existence of a rational binding.

**Decision A2 — Represent genuinely varying visible facts before drawing.** Numeric frames
and coefficient tasks expose sign/zero distinctions that vary inside existing assignments.
Once A1 is settled, propose ordinary mathematical schema alternatives that guarantee the
selected distinctions, with correlated choices where needed. This would be model work
beyond invariant additions: document effects on distributions, payloads, existing matches
and question/solution evidence before implementation. Preserve targets and their coverage;
do not add sampled-payload classification to the validator or generation pipeline.

### Parity: retain singleton, even and larger-odd cases

The [parity view](../../src/visuals/views/counting/counting-objects-parity/view.tsx) displays
two groups and a remainder in both modes. Its [solution wording](../../src/visuals/views/counting/counting-objects-parity/helpers.ts)
makes the same quantities explicit:

| Count | Group size / remainder | Zero participation |
|---|---|---|
| 2 | 1 / 0 | The remainder is zero, shown as "None". |
| 1 | 0 / 1 | Both groups are empty. |
| 3 | 1 / 1 | The group sizes and remainder are nonzero. |

The existing [positive-count sampler](../../src/generators/counting/counting-quantity.ts)
and [parity choices](../../src/generators/counting/counting-quantity-schema.ts) admit these
cases. Evenness determines a zero remainder, but oddness alone does not distinguish a
singleton from a larger odd collection. Neither zero descriptor is an invariant of the view.

**Decision P1 — Make the grouping distinction an ordinary mathematical choice.** Recommended
direction: design pre-draw cases for even counts, singleton odd counts and larger odd counts,
with the group quantities and remainder guaranteed by the selected mathematical model.
Then the appropriate declaration is known before generation. Preserve every current count
case and both parity target conjunctions.

First assess a surgical extension of the existing model under
[IMPL-G7](../implementation-generator.md#impl-g7--extend-capabilities-within-a-stable-payload-contract).
Its zero declarations must not leak into unrelated counting views that expose only the
positive collection. If the necessary grouping contract cannot be expressed cleanly within
the existing producer/consumer boundary, review a dedicated grouping producer and explicit
parity consumer contract. That alternative requires a match-migration and coverage comparison;
it is not a proposed adapter or automatic completion step.

This model work requires a separate agreed implementation scope. Until then, keep the two
zero omissions visible. Do not restore inherited zero absence, label all odd counts zero-free,
discard the singleton case, change range policy or weaken the gate to close the report.

## Second measurement batch

### M2 — Invariant declarations for Grade 4 measurement word problems

Implemented on 2026-10-27 as one small, partial batch for `measurement-word-problems` and
its sole consumer `measurement-word-problem-grade4`. The production scope is exactly two
`spec.ts` files, plus regression tests and verification notes. The two first-batch families
remain complete for non-range source-selection requirements and are not included again.

| Owner | Addition to `generalLabels` | Source evidence |
|---|---|---|
| [Word-problem generator spec](../../src/generators/measurement/measurement-word-problems/spec.ts) | `NumbersWithoutNegatives`, `NumbersWithoutZero` | All operands, group counts and answers are strictly positive. Subtraction constructs the first value from a positive answer plus the second value. |
| [Grade 4 story view spec](../../src/visuals/views/measurement/measurement-word-problem-grade4/spec.ts) | `ArabicNumerals`, `Base10` | Both modes format values with decimal digit strings, fraction notation or decimal notation. |

The integer, fraction and decimal branches in the
[generator](../../src/generators/measurement/measurement-word-problems/generator.ts)
establish these quantity invariants. The existing
[view helpers](../../src/visuals/views/measurement/measurement-word-problem-grade4/helpers.ts)
validate positive exact values and implement the notation. The named payload
`MeasurementWordProblemGrade4` has one producer and one registered consumer. The change
preserves schemas, resolver behavior, configuration values, mathematical sampling and rendering.

The pre-implementation annotation-only counterfactual over the 60 assignments predicted:

| Measure | Before | After M2 | Reduction |
|---|---:|---:|---:|
| Family raw non-range assessments | 340 | 80 | 260 |
| Family distinct selection/facet gaps | 320 | 80 | 240 |
| Global raw non-range assessments | 1,788 | 1,528 | 260 |
| Global distinct selection/facet gaps | 1,750 | 1,510 | 240 |
| Global selections still containing a gap | 616 | 616 | 0 |

The counterfactual opens no new requirements and creates no conflicts on the retained
assignments. Twenty decimal assignments have a duplicated base obligation, explaining the
raw/distinct difference. **All 60 family assignments still lack operand-digit annotations;
20 fraction assignments additionally lack fraction magnitude.** This is a partial repair,
not a claim that the family or dataset is ready for generation.

These projections did not include a fresh capability rematch and are not stored-row changes.
The implementation checkpoint below confirms them after a complete rematch and replay.
The original counterfactual evidence is in
`temp/measurement-declarations/second-batch-counterfactual.ts` and `.json`.

### M2b — Existing proper-fraction choice

The current fraction branch always produces proper measured fractions, and the view validator
requires numerator < denominator. Additive numerators total at most 7 over 8; multiplication
and division totals reach at most 6 over 8. Implemented on 2026-10-27: the existing fraction
alternative now declares `[FractionNumbers, ProperFractions]` and retains the same `'fraction'`
configuration. The shared `selectExactLabelSetMap` resolver and three explicit fallback bundles
preserve the integer/fraction/decimal choices. Both a broad `FractionNumbers` request and an
explicit `ProperFractions` request select the same fraction bundle; no extra mathematical
configuration or runtime labelling step is introduced. The checkpoint below records resolver,
fallback and replay verification. This closes 20 further assessments and leaves 60 operand-digit
assessments in the family.

Operand digits need a separate review. Integer addition admits operands from 2 through 20,
and integer multiplication combines counts from 2 through 6 with measured values from 2
through 12. One fixed digit-profile label would therefore be false. Fractional/decimal digit
semantics also need review before proposing ordinary configuration distinctions.

### Deferred conversion decision — Cover legacy profiles and shared consumers

Keep `measurement-conversion` outside M2. Its
[numeric-profile schema](../../src/generators/measurement/measurement-conversion/spec.ts)
has `[] -> legacy`, `IntegerNumbers -> integer` and `DecimalNumbers -> decimal` choices.
Legacy and explicit-integer profiles both involve whole quantities but produce different
payload/task branches. Simply assigning the same exact choice label to both needs a design
review; a blanket generator kind also overlaps the existing schema ownership.

The current 35 assignments comprise seven legacy executions, seven legacy derivations,
seven legacy tables and 14 explicit integer/decimal executions. Only 21 currently contain
non-range gaps. Consumer review must cover:

- `measurement-conversion` supplying `measure-conversion-execution`,
  `measure-conversion-derivation` and `measure-conversion-table`.
- `measurement-unit-scale` also supplying `measure-conversion-derivation` through the shared
  `MeasurementConversionProblem` union, and supplying `measure-unit-scale-relation`.

Adding numeral/base declarations to all three conversion views and positive/nonzero
declarations to the conversion generator would have the following retained-assignment effect:

| Pair | Current raw assessments | After those additions |
|---|---:|---:|
| conversion / execution | 63 | 7 number-kind gaps |
| conversion / derivation | 0 | 7 newly triggered number-kind gaps |
| conversion / table | 28 | 7 existing number-kind gaps |
| unit-scale / conversion derivation | 0 | 3 newly triggered kind/sign/zero gaps |
| **Total across 36 assignments** | **91** | **24** |

That proposal would close 84 old assessments but open 17 new ones. Resolve the legacy
number-kind representation and both producers' projection contracts before making conversion
a later batch. This is why M2 is intentionally limited to the word-story pair.

### M2 acceptance and handoff

- Verify all 60 current measurement-kind × number-kind × operation assignments and both
  question/solution modes, including positive-value boundaries and subtraction results.
- Preserve the 1,013 normalized target conjunctions and existing target coverage. Review
  all new matches and re-enumerate the complete catalog after declaration additions.
- Compare existing configurations, prepared PRNG state/continuation, mathematical payloads
  and task/content fingerprints. Test the claims against generator and rendering contracts;
  declarations alone are not proof.
- Pass the relevant type, ownership/spec and regression checks, run required coverage, and
  report the full audit with the remaining 80 family assessments clearly identified.
- Commit M2 independently, followed by any separately accepted M2b or model decisions.
  The broader regeneration remains authorized and waits for the readiness checkpoint above.

### M2 implementation checkpoint (2026-10-27)

Implementation and regression tests are committed in `f300781a`. This is the pre-M2b baseline.
M2 adds the four declarations at the owners listed above. The generator guarantees strictly
positive operands, group counts and results; the view uses Arabic digits and base-10 notation.
A zero digit in a positive decimal such as `$1.20` does not represent a zero-valued quantity.
The implementation leaves targets, schemas, resolvers, mathematical sampling, rendering,
the Area allowlist and range-policy exclusion unchanged. M2b was deferred to the separate
checkpoint below; operand-digit decisions remain open. No adapters or automatic completion
were introduced.

The complete post-change report-only audit confirms:

| Measure | Before M2 | After M2 |
|---|---:|---:|
| Family raw non-range assessments | 340 | 80 |
| Family distinct selection/facet gaps | 320 | 80 |
| Global raw non-range assessments | 1,788 | 1,528 |
| Global distinct selection/facet gaps | 1,750 | 1,510 |
| Global selections still containing a gap | 616 | 616 |

All 1,222 selections were enumerated, including 807 eligible selections. There are no
conflicts, invalid contexts, incomplete enumerations or row/label-contract errors. The
remaining backlog still spans 81 generators and 171 pairs. The 80 family assessments are
exactly **60 operand-digit and 20 fraction-magnitude findings**; M2 activates no new missing
requirements. These are source-selection results, not changes to stored dataset rows.

Fresh matching preserves all **1,013 normalized target label sets and 1,182 semantic
matches**, with no added or removed matches. All 60 family plans retain the same choices.
Replaying all **140 stored family origins** preserves generator/view configurations,
prepared random state, PRNG continuation, payloads and content/task fingerprints. Each
replay adds exactly the four intended annotations and removes none. Raw non-range findings
on these source replays fall from 794 to 186: 140 operand-digit and 46 fraction-magnitude
findings remain. The actual stored family annotations still contain their original 794
findings. Captured schema serializations and implementation/policy hashes are unchanged.

The focused tests pass **65 cases**, including 720 planned draws across the 60 targets,
both modes, ordinary seeds and sampler boundaries. They check positive exact arithmetic,
numeral presentation, declaration ownership, unchanged target claims and the intentionally
remaining dependency findings. Mode checks use planned draws and presentation helpers;
rendering code is unchanged.

The full coverage run passes **838 files / 6,211 tests**. Aggregate generator coverage is
98.46% statements, 96.96% branches, 100% functions and 99.51% lines. The measurement
word-problem generator has 100% coverage in all four categories, and every checked
generator meets the repository thresholds. This runs the two `test:coverage` stages
(Vitest coverage and the generator coverage checker) with two workers and a 30-second
test timeout; coverage output is retained under `temp/measurement-m2/full-coverage/`.

`npm run check -- --spec=ccss` passes type, ownership/spec, label, documentation, standards
and split-integrity checks. Its final strict annotation gate still reports the known
**4,318 failures across 1,332 stored samples**, so the aggregate check is not green.
The dataset snapshot pointer is unchanged. Regeneration and VQA wait for the agreed
source-readiness checkpoint; this partial batch does not bypass it.

Verification artifacts are under `temp/measurement-m2/`: `baseline.json`, `comparison.json`,
`impact-report.md`, `audit/audit.json`, `check.txt`, `full-coverage.txt` and
`generator-coverage.txt`. Reproduce the selection audit with:

```bash
npm run audit:label-dependencies -- --spec=ccss --output-dir=temp/measurement-m2/audit
```

### M2b implementation checkpoint (2026-10-27)

Implementation and regression tests are committed in `b5f1fb7a`. The production change is
confined to the generator's existing `numberKind` declaration. It adds `ProperFractions`
to the fraction bundle without removing `FractionNumbers`; integer and decimal alternatives
remain unchanged. Every measured fraction and answer is proper. Whole-number group counts
are separate operands, so they are not classified as improper fractions.

The post-change audit enumerates the same 1,222 selections, including 807 eligible selections:

| Measure | After M2 | After M2b |
|---|---:|---:|
| Family raw non-range assessments / distinct selection-facet gaps | 80 | 60 |
| Global raw non-range assessments | 1,528 | 1,508 |
| Global distinct selection/facet gaps | 1,510 | 1,490 |
| Global selections still containing a gap | 616 | 616 |

Exactly 20 fraction-magnitude findings close. The family remainder is **60 operand-digit
findings**. There are no newly missing requirements, conflicts, invalid contexts, incomplete
enumerations or row/label-contract errors. The remaining source backlog still spans 81
generators and 171 pairs.

All **1,013 normalized targets and 1,182 semantic matches** are unchanged, with no added or
removed matches. Twenty fraction selections gain the new label; the other 40 selections
retain their annotations. All 140 stored-origin source replays preserve generator/view
configurations, payloads, prepared random states, PRNG continuation and content/task
fingerprints. Exactly 46 fractional replays gain `ProperFractions`, with no label removals.
Across all 140 replays, non-range findings fall from 186 to 140, all operand-digit findings.
All 60 plan hashes change with the declaration contract, and 20 fraction alternative IDs
change. Diagnostic selection receipts are refreshed accordingly, while the original sample
keys, seeds and attempts remain unchanged. No stored receipts or dataset rows are rewritten.

Comparison also covers 256 ordinary schema resolutions across omitted, integer, fraction
and decimal requests, plus 64 generated draws with number kind unspecified. Configuration
values, fallback sampling, random-state progression and
payloads remain unchanged. There are still exactly three number-kind alternatives. Partial
fraction requests and explicit proper-fraction requests resolve to the same bundle; competing
kind requests remain rejected. Other generator fields, the view schema, implementation and
policy hashes, targets, Area allowlist and range-policy exclusion are unchanged.

The focused regression run passes **73 tests**. It covers all 60 existing targets through
720 planned draws, both modes and sampler boundaries, plus choice ownership, partial and
explicit requests, conflicting requests and seeded fallback equivalence. Properness is
checked on measured fractions and answers, with group counts checked separately.

The full coverage run passes **838 files / 6,219 tests**. Aggregate generator coverage remains
98.46% statements, 96.96% branches, 100% functions and 99.51% lines. The measurement
word-problem generator has 100% in all four categories, and every checked generator meets
the repository thresholds. Both `test:coverage` stages ran with two workers and a 30-second
test timeout, retaining coverage under `temp/measurement-m2b/full-coverage/`.

`npm run check -- --spec=ccss` passes type, ownership/spec, label, documentation, standards
and split-integrity checks. The final strict annotation gate still fails on the known stored
findings, so the aggregate check is not green. Documentation references pass with external
link-fetch warnings.

The immutable dataset snapshot remains unchanged and retains **4,318 strict findings**,
including 794 in the stored word-problem family. M2b is a source declaration repair, not a
stored dataset refresh. Regeneration and VQA remain deferred until the agreed readiness
checkpoint; the 60 remaining family requirements are not bypassed.

Local evidence is under `temp/measurement-m2b/`: `baseline.json`, `comparison.json`,
`impact-report.md`, `audit/audit.json`, `check.txt`, `full-coverage.txt` and
`generator-coverage.txt`. Reproduce the selection audit with:

```bash
npm run audit:label-dependencies -- --spec=ccss --output-dir=temp/measurement-m2b/audit
```

## M3 operand-digit declarations (2026-10-27)

The reviewed follow-up covers 30 of the 60 operand-digit findings without changing the
mathematical sampling domains. Division always has a one-digit whole-number divisor.
Integer multiplication always has a one-digit smallest operand; fraction and decimal
multiplication always have a one-digit largest operand, the whole-number group count.
These are statements about the specified operand role, not a complete digit profile for
both operands. The existing graph checks family presence and remains unchanged.

### Checkpoint 1 — Division declarations

Committed as `c1cb43d8` (`fix: declare single-digit divisors for measurement stories`).

The existing division choice now declares `[Division, SingleDigitDivisor]`. A local
`operation-labels.ts` helper validates the authored bundle with the shared exact set-map,
then delegates to the existing operation resolver once. This preserves mathematical entropy
for every valid planned binding without changing the shared resolver or its metadata.
Incomplete or conflicting bindings consume no entropy. No payload is inspected and no
annotation is inferred after generation.

Verification preserves all **1,013 targets and 1,182 semantic matches**, with no additions
or removals. Exactly 15 family selections gain the divisor label. All **140 stored-origin
source replays** preserve configurations, payloads, prepared random states, PRNG continuation
and content/task fingerprints; exactly 34 division replays gain the label and none lose labels.
Source findings fall **60 → 45** per selection and **140 → 106** per replay. The fresh full
audit reports **1,493 raw / 1,475 distinct non-range source gaps across 601 selections**,
with no conflicts, invalid contexts, incomplete enumeration or row/contract errors.

All 2,560 actual planned fallback probes across 40 partial-request shapes preserve selected
configurations, data and randomness, and all admitted configuration sets remain unchanged.
The separate legacy `extractConfig` / `generateWithLabels` helper probes fallback resolvers:
1,280 formerly unsupported-operation cases now resolve; 960 specified addition/subtraction/
multiplication probes consume different mathematical entropy, changing 760 payloads. Division
probes remain identical. This is a legacy helper behavior change, not the production planned
path or stored-origin replay result. The shared helper is not modified.

Focused verification passes **95 tests across four files**, including the 60-target,
720-draw integration suite. Scoped coverage is **100%** for both the generator and the new
operation-label helper in statements, branches, functions and lines. Type and ownership/spec
checks pass. Full repository coverage is run after the multiplication checkpoint, which
retains these division regressions.

Targets, the Area allowlist, range-policy exclusion, mathematical generator and renderer
remain unchanged. The dataset snapshot and its 4,318 known stored strict findings remain
unchanged; regeneration awaits the agreed readiness checkpoint. Local evidence is under
`temp/measurement-m3/before/`, `division/`, `division-audit/` and `division-coverage/`.

### Checkpoint 2 — Multiplication declarations

The multiplication choice now has two authored bundles:

- `[Multiplication, SingleDigitSmallestOperand]` for the five integer selections.
- `[Multiplication, SingleDigitLargestOperand]` for the ten fraction/decimal selections.

The normal generator compatibility rule `measurement-multiplication-operand-digits`
correlates these bundles with the existing number-kind choice. Both bundles resolve to the
same multiplication configuration and preserve the existing resolver's entropy consumption.
No payload inspection, adapters or automatic annotation completion are involved.

All **1,013 targets, 1,182 semantic matches and 60 family configurations** remain unchanged.
This checkpoint adds labels to **15 selections and 38 stored-origin source replays**; across
both checkpoints, **30 selections and 72 replays** gain a label, with no removals. All 140
replays preserve configurations, payloads, prepared random states, PRNG continuation and
content/task fingerprints. Plan hashes change with the declaration contract; original
sample keys, seeds and attempts remain unchanged. No stored receipts or rows are rewritten.

| Source assessment | Before M3 | After division | After multiplication |
|---|---:|---:|---:|
| Family selections missing operand digits | 60 | 45 | 30 |
| Family source replays missing operand digits | 140 | 106 | 68 |
| Global raw non-range source gaps | 1,508 | 1,493 | 1,478 |
| Global distinct selection/facet gaps | 1,490 | 1,475 | 1,460 |
| Global selections still containing a gap | 616 | 601 | 586 |

The audit reports no conflicts, invalid contexts, incomplete enumeration or row/contract
errors. The remaining **30 family findings** are the ten integer and twenty fraction/decimal
addition/subtraction selections. These remain open: integer digit profiles vary, and the
fraction/decimal counting convention still needs a separate decision.

Partial-request verification compares 40 admitted configuration sets and 2,560 planned
draws. The configuration sets and their uniform probabilities are unchanged; every planned
selection and draw has the truthful role label. When both operation and number kind are
omitted, the planner samples twelve joint assignments instead of independent choices.
Consequently **231 of 320** such probes choose a different operation for the same seed;
the other **2,240** planned probes remain unchanged. Number kind, measurement kind and
mathematical PRNG states remain unchanged in every probe. Existing targets specify both
fields, so their replays are unaffected.

The legacy `extractConfig` / `generateWithLabels` test primitive does not apply generator
compatibility rules. In a separate 2,560-probe comparison, **545** direct resolutions select
a multiplication role bundle inconsistent with the number kind. This primitive therefore
cannot validate the new joint declaration; production and routed debugging already use
matched planned generation. The shared primitive is unchanged, and the regression tests
use the planner for role-label truth and reject unsupported explicit claims there.

Focused verification passes **115 tests across three files**, including 720 draws across
all 60 existing targets, both modes and sampler boundaries. It also covers partial requests,
explicit role claims, contradictory requests, complete semantic configuration sets and
resolver entropy.

The full coverage run passes **839 files / 6,261 tests**. Coverage includes every generator
and the new operation-label helper: aggregate coverage is 98.46% statements, 96.96% branches,
100% functions and 99.51% lines. This family's generator and operation-label helper each
have **100%** in all four categories. Every checked generator meets the repository coverage
thresholds. Both `test:coverage` stages ran with two workers and a 30-second test timeout,
retaining the coverage report under `temp/measurement-m3/full-coverage/`.

`npm run check -- --spec=ccss` passes type, ownership/spec, label, documentation, standards
and split-integrity checks. The final annotation gate still fails on the 4,318 known stored
findings, so the aggregate check is not green. Documentation references pass with external
link-fetch warnings.

Targets, the Area allowlist, range-policy exclusion, mathematical generator and renderer
remain unchanged. The immutable dataset snapshot retains **4,318 strict findings**, including
794 in this family; regeneration and VQA remain deferred until the agreed readiness
checkpoint. The source repair does not bypass the remaining requirements.

Local evidence is in `temp/measurement-m3/impact-report.md`, `multiplication/`,
`multiplication-audit/`, `full-coverage/`, `check.txt` and `generator-coverage.txt`. Reproduce
the report-only audit with:

```bash
npm run audit:label-dependencies -- --spec=ccss --output-dir=temp/measurement-m3/multiplication-audit
```

## Integer-only operand-digit gate (2026-10-28)

This checkpoint changes annotation-policy applicability and keeps the M3 declarations,
generator sampling, renderer, targets and stored dataset intact. The former combined
operand rule is split: `LD-OPERANDS-01` still assesses operand count; `LD-OPERANDS-02`
assesses width only in the positive integer arithmetic context documented above.

The twenty measurement fraction/decimal addition/subtraction findings are outside the
digit obligation. The ten integer addition/subtraction findings remain unresolved. Their
existing samplers cross one- and two-digit boundaries, so no new invariant width label is
declared and no generic role-group annotation is substituted for the missing classification.
The prior division and multiplication labels remain truthful authored declarations,
including whole-number group counts in fractional and decimal stories.

No graph condition reads payloads or producer identities. Evaluation and policy hashing
cover the authored conjunction, Area selector and complete number-kind qualifier. The
global Area allowlist, range-presence behavior, strict conflict handling and distinction
between advisory selections and enforced finalized annotations remain unchanged.

### Audit and preservation

Before/after comparison preserves all **1,013 target label sets, 1,182 semantic matches and
4,030 audited subjects**. Every subject's annotations, provenance and global Area context
are unchanged. The protected source inputs and immutable dataset snapshot are unchanged.
Only operand-digit applicability changes: **257 assessments** no longer apply, comprising
225 formerly missing and 32 formerly satisfied assessments. No assessment of another facet
changes, and no new assessment, conflict, invalid context, row/contract error or incomplete
enumeration appears.

Of the removed missing assessments, 27 source and 110 stored contexts declare noninteger
number kinds. The other 26 source and 62 stored contexts lack a number-kind annotation;
all 88 still report that missing number kind and do not become complete. No missing-digit
assessment disappears solely because of the additional Area qualification.
The noninteger reductions beyond measurement affect decimal place comparison, decimal
addition/subtraction, decimal division models and decimal multiplication models. Missing-kind
contexts belong to currency arithmetic, number arrays and equal-groups collections.

| Non-range finding count | Before integer gate | After integer gate |
|---|---:|---:|
| Measurement source selections missing operand digits | 30 | 10 |
| Global raw source gaps | 1,478 | 1,425 |
| Global distinct source selection/facet gaps | 1,460 | 1,407 |
| Global source selections containing a gap | 586 | 566 |
| Stored raw gaps | 4,318 | 4,146 |
| Stored distinct sample/facet gaps | 4,184 | 4,012 |
| Stored samples containing a gap | 1,332 | 1,332 |
| Stored measurement operand-digit gaps | 140 | 46 |

These reductions reflect a narrower obligation, not repaired or regenerated annotations.
The stored measurement family still has 700 raw non-range findings across all 140 rows,
including its stored notation, sign and zero omissions. Regeneration and VQA remain
deferred; the strict gate continues to reject the remaining stored findings.

Local audit and preservation evidence is under `temp/measurement-integer-gate/`, including
`comparison-summary.json`. Earlier checkpoint counts above describe their historical policy
and are retained as such.

Focused validation passes **261 tests across six files**, covering the evaluator, strict
gate, audit and measurement integration. The log is
`temp/integer-operand-digit-gate/focused-tests.txt`.

The full coverage run passes **839 files / 6,303 tests**. The changed evaluator has **100%**
coverage in all four categories: 226 statements, 209 branches, 59 functions and 162 lines.
Aggregate generator-plus-evaluator coverage is 98.53% statements, 97.14% branches, 100%
functions and 99.53% lines, and every checked generator meets its coverage thresholds.
Both `test:coverage` stages ran with two workers and a 30-second test timeout. Evidence is
in `temp/measurement-integer-gate/full-coverage.txt`, `full-coverage/coverage-summary.json`
and `generator-coverage.txt` under that same directory.

`npm run check -- --spec=ccss` passes type, ownership/spec, label, documentation, standards
and split-integrity checks. Its final strict annotation stage still fails on the **4,146**
remaining stored findings, so the aggregate check remains non-green. Separate final type
and documentation checks also pass. The repository-check log is
`temp/measurement-integer-gate/check.txt`.

### Required ontology corrections

The pinned ontology currently treats these organizational role groups as eligible labels:
`SmallestOperandDigitCount`, `LargestOperandDigitCount`, `DividendDigitCount` and
`DivisorDigitCount`. Each organizes possible width values but supplies no width value itself.
Their existing `partOf OperandDigitCount` links are already appropriate; the incoming
membership edges need correction.

For each role, change the direct `SingleDigit*` and `MultipleDigit*` links to its
`*DigitCount` group from `specializes` to `partOf`. For example:

```turtle
:SingleDigitLargestOperand edu:partOf :LargestOperandDigitCount.
:MultipleDigitLargestOperand edu:partOf :LargestOperandDigitCount.
:TwoDigitLargestOperand edu:specializes :MultipleDigitLargestOperand.
```

The first two edges make the grouping organizational and therefore ineligible under
[SPEC-3](../spec-general.md#spec-3--most-specific-does-not-mean-leaf). The third is a genuine
refinement and must remain `specializes`; apply the same distinction to the other roles
and their more-specific widths. Review the definitions to state integer-operand width
explicitly rather than imply an undefined fractional/decimal notation-counting convention.
Regression checks in the ontology should establish that the four groups are ineligible,
the concrete width descriptors remain eligible, structural family membership remains
available, and actual width refinements retain capability substitution.

The Area structure also needs review before any future Area-only integer qualification.
Generic operation Areas must remain usable across number kinds. The standard-algorithm
Areas used by decimal addition/subtraction currently descend from `IntegerArithmetic`;
that placement must not be treated as proof of integer-only operands. Review their shared
arithmetic placement or integer/decimal distinctions without adding organizational Areas
to dataset annotations. The implemented number-kind qualification makes the present gate
independent of that unresolved modeling issue.

This repository does not edit the sibling ontology or mutate the installed package in this
checkpoint. Until a corrected version is published and adopted, the explicit eight-root
operand-digit selector keeps the organizational groups from satisfying this facet. Global
label eligibility still follows the exact installed ontology. Adoption of the corrected
package should run the normal eligibility, matching and dependency audits, without rewriting
targets or inferring replacement labels.

## M4 integer additive width choices (2026-10-28)

The user approved splitting integer addition and subtraction into one- and two-digit
largest-operand choices, including the resulting sampling change. Each operation is a
separate implementation and commit checkpoint. All five measurement contexts keep their
existing targets. Fraction and decimal addition/subtraction remain outside the integer-only
digit requirement; organizational role groups are not added as labels.

### Local declarations and sampling

The `operation` field retains the four operation values and its existing single resolver
entropy draw. A separate `operandDigits` field owns every configurable width label in this
generator. It carries the existing multiplication and division declarations unchanged in
meaning, plus `SingleDigitLargestOperand` and `TwoDigitLargestOperand` for integer addition
and, at the second checkpoint, integer subtraction. Compatibility admits only the correct
operation/number-kind/width combinations. Empty width bindings resolve to `false`; they
are available only where no width is declared.

This field separation is necessary because an exact plain addition request otherwise
selects the plain operation alternative before considering width-specific alternatives.
Different width configurations are not declared equivalent. The width resolver deliberately
has no default empty choice, so compatibility can inspect all declared alternatives.
The shared planner, resolvers and annotation evaluator are unchanged.

The generator samples uniformly from the finite set permitted by the selected width.
This preserves the complete previous mathematical support:

| Operation | Existing support retained | One-digit largest | Two-digit largest |
|---|---|---:|---:|
| Integer addition | Each operand independently 2–20 | 64 pairs | 297 pairs |
| Integer subtraction | Subtrahend 2–10, positive answer 1–15, minuend their sum | 28 pairs | 107 pairs |

Widths classify the operands, not the answer. Thus `9 + 9 = 18` belongs to the one-digit
choice. The two-digit choice may include a one-digit smaller operand. Neither branch
silently narrows the set to equal-width operands.

The existing planner selects the two compatible widths equally for each fixed integer
operation/context target. This changes the one-digit proportion from 64/361 (17.7%) for
addition and 28/135 (20.7%) for subtraction to 50% each. Conditional sampling is uniform
within the chosen width. Broad requests that leave the operation or number kind open may
also redistribute across the larger set of admitted assignments. No weighting feature,
adapter, payload inference or automatic annotation completion is introduced.

The canonical payload and renderer contract remain unchanged. Runtime guards reject
missing integer additive widths and supplied profiles inconsistent with the operation
or number kind. The source declarations select the labels before generation; tests prove
that the generated operands satisfy those declarations.

### Addition checkpoint

The first checkpoint enables both integer addition widths in all five measurement
contexts. Integer subtraction retains its original sampler and five outstanding source
findings until the second checkpoint. Target matching and sample allocations are retained;
new plan receipts are derived from the changed schema rather than replaying stale receipts.

Verification preserves **1,013 targets, 1,182 matches and all 60 family assignments**.
Family source selections increase from 60 to 65, while missing operand-digit assessments
fall from 10 to 5. Global raw non-range source gaps fall from 1,425 to 1,420 (1,407 to
1,402 distinct) across 1,227 source selections. Each integer addition target admits both
widths equally. All 6,860 checked draws satisfy their selected width declarations.

Fresh generation at the 140 stored-origin keys changes exactly the 12 integer addition
payloads and fingerprints. The other 128 retain their content, annotations, semantic
configuration and mathematical/view random states. Their resolved configuration now records
the explicit digit field, and all family plan hashes change because the schema changed.
Targets, shared planner/resolvers, policy, view implementation and the dataset pointer are
unchanged; only the consuming view's direct test fixture needs the new addition profile.

The five focused test files pass **214 tests**. Both changed generator implementation files
have **100% statements, branches, functions and lines covered**. Type checking and the full
generator/view specification audit pass. Evidence is under
`temp/measurement-width-choices/addition/`, `addition-audit/`, `addition-coverage/` and the
corresponding command logs.

The stored dataset remains unchanged at **4,146 non-range strict findings**. Its 140
measurement rows still contain 700 raw findings, including 46 stored operand-digit gaps.
Canonical regeneration and VQA remain at the agreed readiness checkpoint; source repair
does not waive the strict gate or imply that stored annotations were repaired.
