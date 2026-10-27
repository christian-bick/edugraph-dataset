# Local label dependency graph

Status: implemented as annotation-only validation. The repository contains one small graph,
a pure ontology-aware evaluator, and a shared strict gate and audit. Generator payloads and
rendered images are outside this initiative.

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
configuration, random draws, or images to make a dependency report pass.

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
        operandDigits: {root: Scope.OperandDigitCount},
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
            assess: ['operandCount', 'operandDigits']},
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

The four obligations are:

| Rule | Annotation trigger | Required groups |
|---|---|---|
| `LD-NUM-01` | Numeric Scope, numeral system, operand count, or operand digits | Number kind, numeral system, base, sign, zero, plus report-only range presence |
| `LD-OPERANDS-01` | Operand count or operand digits | Operand count and operand digits |
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
