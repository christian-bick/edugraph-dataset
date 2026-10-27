# Local label dependency graph

Status: annotation-only dependency validation is the core contract. Evidence adapters and
reviewed completion policies remain supplementary. The earlier evidence-scoped implementation
and its verification results are retained below as historical records.
Scope clarified on 2026-10-27.

Add a small repo-local graph of annotation obligations to `edugraph-content`. An edge means
that a label family requires another annotation group; it does not choose or append a label.
Apply the same graph to every eligible finalized sample, independently of generator, view,
payload, or evidence-adapter coverage.

## Scope and source material

Use declarative TypeScript data and the installed `edugraph-ts` ontology. No graph database,
new ontology relation, or runtime dependency on a sibling repository is needed.

The motivating analysis is in `../edugraph-classify/docs/`:

- `UPSTREAM-LABEL-COMPLETENESS-20261003.md` identifies inconsistent operand-digit,
  fraction-subtype, reference-frame, and explanation-Ability coverage.
- `UPSTREAM-ANNOTATION-HANDOFF-20261003.md` recommends a report-only rollout and
  preservation of generation and target provenance.

Those reports examined dataset v0.30.0-03 and older ontology snapshots. Resolve current
labels and definitions against this repo's exact pinned ontology rather than treating
historical examples as present defects.

Existing ownership, matching, and annotation contracts remain in
[label architecture](../label-architecture.md), [general spec rules](../spec-general.md),
and [target rules](../target-spec.md). Targets remain partial competency requests; the
complete resolved generator/view labels and supported realized additions describe the
produced task. Dependency checks do not change positive matching, label eligibility,
module ownership, generation configuration, or sampling.

**Range-policy work is excluded.** Retain the existing range-presence report only. Do not
calculate replacement bounds, choose strongest bounds, change thresholds or endpoint
semantics, rewrite range annotations, or add range evidence extractors. Range findings
never fail this dependency gate.

## Agreed Area allowlist

Apply the dependency policy only when at least one Area is present and **every involved
Area is a transitive structural descendant of at least one of**:

- `Area.Arithmetic`
- `Area.IntuitiveMathematics`
- `Area.FormalMathematics`

Use the complete resolved Area conjunction from generator and view, including invariant
and selected schema labels. Do not use only target Areas, choose a primary Area, or union
mutually exclusive schema alternatives. For Areas `A` and allowed roots `R`:

```text
A is nonempty AND
for every a in A, there exists r in R such that a is a transitive structural descendant of r
```

An Area with an allowed ancestry path satisfies this membership condition even when it has
other ancestors. There is no additional Arithmetic anchor or explicit algebra exclusion.
The roots are selectors, never emitted labels or matching guards. Organizational labels
remain ineligible annotations under the existing ontology contract.

An outside Area puts the entire sample outside this dependency policy. Empty Area sets,
unknown labels, and ineligible labels are contract errors, not successful empty checks.

| Resolved Areas | Context result |
|---|---|
| `Addition` | Eligible; annotation-family triggers select the obligations. |
| `Addition` and `Equation` | Eligible. |
| `AlgebraicExpression` and `Addition` | Eligible; this is the intended boundary. |
| The preceding set plus `EquationSolving` or `AlgebraicModeling` | Outside the allowed union. |
| Only allowed formal Areas, with no triggering annotations | Eligible, without numeric obligations. |
| No Area | Invalid context. |

Ontology membership is authoritative. Unexpected examples should prompt review of task
labels and ontology placement before adding local exceptions. This work does not authorize
an ontology migration.

## Annotation consistency and supplementary evidence

These are separate questions:

| Question | Core annotation check | Needs exercise evidence |
|---|---|---|
| Does a triggered required label group have an annotation? | Yes | No |
| Do explicitly incompatible annotations coexist? | Yes | No |
| Is `Base10`, a digit profile, or a zero claim supported by this exercise? | No | Yes |
| Which correct label should be added to a missing group? | No | Usually |

The core evaluator reads annotations and ontology membership. A missing required group is
reported immediately even when no adapter can identify its correct member. It does not
infer an opposing claim from absence, append parent labels, or invent values.

Typed evidence adapters may assess actual mathematical data and view projections. They
can diagnose a finding, discover a content-dependent obligation that annotations cannot
express, or justify an additive repair. Their results live in a separate supplementary
channel. Missing adapters, unavailable replay, `not_applicable` evidence, and unresolved
payload variants cannot suppress an annotation finding or exempt a sample from the core.

Deleting all relevant annotations can remove an annotation-only trigger; this is an
inherent boundary of label-only validation. Supplementary evidence and existing VQA can
investigate content correctness, but neither is a prerequisite for dependency completeness.
An annotation-contract failure identifies a policy violation; the correct content repair
or a justified policy refinement still requires review.

## Graph markup

The authored graph is `src/validation/label-dependencies.ts`. It contains the unchanged
Area gate, named families/facets, stable rule IDs, and explicit conflict groups:

```ts
import {Ability, Area, Scope} from 'edugraph-ts/generated';
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
        fractionUnit: {labels: [Scope.UnitFractions, Scope.NonUnitFractions]},
        decimal: {root: Scope.DecimalNumbers},
        decimalPrecision: {labels: [Scope.TenthDecimals, Scope.HundredthDecimals, Scope.ThousandthDecimals]},
        referenceFrames: {root: Scope.ReferenceFrameComplexity},
        articulation: {labels: [Ability.TextualArticulation]}
    },
    rules: [
        {id: 'LD-NUM-01', when: {any: [{family: 'numeric'}, {family: 'numeralSystem'},
            {family: 'operandCount'}, {family: 'operandDigits'}, {evidence: 'numericTask'}]},
            assess: ['numberKind', 'numeralSystem', 'base', 'range', 'sign', 'zero']},
        {id: 'LD-OPERANDS-01', when: {any: [{family: 'operandCount'}, {family: 'operandDigits'},
            {evidence: 'arithmeticOperands'}]}, assess: ['operandCount', 'operandDigits']},
        {id: 'LD-FRACTION-01', when: {any: [{family: 'fraction'}, {evidence: 'fractionValues'}]},
            assess: ['fractionMagnitude']},
        // Unit/nonunit labels do not cover zero, negative, or all improper fractions.
        {id: 'LD-FRACTION-UNIT-01', when: {evidence: 'fractionValues'}, assess: ['fractionUnit']},
        {id: 'LD-DECIMAL-01', when: {any: [{family: 'decimal'}, {evidence: 'decimalRepresentation'}]},
            assess: ['base']},
        // The current precision catalog stops at thousandths; DecimalNumbers does not.
        {id: 'LD-DECIMAL-PRECISION-01', when: {evidence: 'decimalRepresentation'}, assess: ['decimalPrecision']},
        {id: 'LD-FRAME-01', when: {evidence: 'quantityReferenceFrames'}, assess: ['referenceFrames']},
        {id: 'LD-EXPLAIN-01', when: {evidence: 'writtenExplanation'}, assess: ['articulation']}
    ],
    conflicts: [
        {id: 'LD-ZERO-CONFLICT-01', facet: 'zero', labels: [Scope.NumbersWithZero, Scope.NumbersWithoutZero]},
        {id: 'LD-SIGN-CONFLICT-01', facet: 'sign', labels: [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives]},
        {id: 'LD-FRAME-CONFLICT-01', facet: 'referenceFrames',
            labels: [Scope.SingleFrameOfReference, Scope.MultipleFramesOfReference]}
    ]
} as const satisfies LabelDependencyGraph;
```

`root` selects eligible descriptors through structural membership. `labels` names an
explicit candidate family, including eligible specializations; it does not declare an
exactly-one constraint. `any` activates a rule when any annotation family is present.
The core treats evidence-only branches as inactive; the supplementary evaluator can use
them to assess a content-dependent obligation.

For an activated annotation rule, require at least one supplied member of each `assess`
facet. Do not add omitted values or use evidence's expected values as annotation requirements.
Rules inspect the original supplied label set: an obligation never creates labels or
recursively activates another rule. Deterministic ordering makes repeated reports identical.

Only declared conflict groups impose incompatibility. Zero-presence/absence, sign-presence/
absence, and single/multiple reference-frame claims are the initial groups. Different
operand counts, digit profiles, number forms, fraction subtypes, numeral systems, or range
bounds are not globally exclusive; mixed tasks and property witnesses can justify multiple
annotations (`TSPEC-14`).

## Initial annotation dependencies

All rows inherit the complete Area allowlist.

| Rule | Annotation trigger | Required groups |
|---|---|---|
| `LD-NUM-01` | Numeric Scope, numeral-system annotation, operand count, or operand-digit annotation | Number kind, numeral system, base, sign, zero, plus report-only range presence |
| `LD-OPERANDS-01` | Operand count or operand-digit annotation | Operand count and operand digits |
| `LD-FRACTION-01` | Fraction-family annotation | Fraction magnitude |
| `LD-DECIMAL-01` | Decimal-family annotation | Numeric base |

`LD-FRACTION-UNIT-01` and `LD-DECIMAL-PRECISION-01` remain supplementary evidence rules.
Their candidate groups do not cover every value permitted by their triggering annotation
families. Under the pinned ontology, `NonUnitFractions` means proper fractions with an
integer numerator greater than one; it is not the complement of `UnitFractions`. Values
such as `0/5`, `-1/2`, and `3/2` need not fit either candidate. Likewise, `DecimalNumbers`
permits `0.1234`, while the current precision selector lists only tenths, hundredths, and
thousandths. Do not create an impossible completeness requirement by treating those
selectors as exhaustive. Fraction magnitude and numeric base remain generic requirements.

`LD-FRAME-01` and `LD-EXPLAIN-01` also remain supplementary until a sound,
non-tautological annotation trigger is defined. The graph does not infer written explanation
from arbitrary text, or reference-frame obligations from panel count. Existing annotation
conflicts are still checked even when no dependency trigger activates.

These are explicit repo-local completeness requirements, not new ontology implication
relations. A numeral label alone does not prove its base; a missing base produces a required-
group finding without selecting `Base10`. Likewise, arithmetic Area membership alone does
not establish an operand structure or trigger numeric labels in a formal task.

## Results and diagnostics

Report context separately as `eligible`, `outside_policy_scope`, or `invalid_context`.
Core annotation assessments are `satisfied` when a required group is present and `missing`
when absent. Explicit conflicts have their own stable IDs and involved labels. Unknown or
ineligible supplied descriptors remain contract errors.

Supplementary evidence retains `satisfied`, `missing`, `not_applicable`, and `unresolved`
results, including concrete expected/missing labels and evidence references when available.
Its errors and trigger states remain separate from the annotation result. A core presence
pass is not a proof that the chosen label is correct for the exercise.

Every report retains rule ID, triggering annotations, facet, supplied labels, context,
and target/generator/view/sample/split/mode provenance where available. Summaries count
eligible checked samples, outside-policy subjects, invalid contexts, annotation omissions,
and conflicts separately from evidence availability and proof outcomes. Sample counts
measure dataset impact; adapters support producer/view contracts, not individual samples.

## Strict gate and integration

The strict gate applies to all eligible finalized annotation sets, without an adapter,
producer/view allowlist, payload variant registry, or named evidence deferral. It fails:

- Missing non-range groups activated by annotations.
- Declared conflicting annotation claims.
- Invalid contexts and annotation/structural row contract errors.
- Missing or empty stored snapshots and incomplete selection enumeration where a complete
  dataset audit is required.

Pre-draw selections receive the same annotation report. Their completeness omissions stay
report-only because reviewed completion may add descriptive labels after the draw. Their
conflicts and invalid contexts still fail. This does not filter selections out of matching
or demand complete artifact annotations from partial targets.

| Surface | Behavior |
|---|---|
| Graph integrity | Validate version, unique rule/conflict IDs, selectors, eligible explicit candidates, family/facet references, and evidence identifiers. |
| Resolved selections | Enumerate complete admitted generator/view assignments within the existing bound; report completeness and reject conflicts/invalid contexts. |
| Runtime | Check every completed annotation set before rendering, retry/fallback, or deduplicated association can hide a failure. Annotation failures are fatal contract failures. |
| Stored datasets | Evaluate actual labels for every row in both splits using authoritative resolved Areas; no replay or adapter is required for the core. |
| Dataset VQA | Run annotation validation before cached or live VQA against the same immutable snapshot. Passing cached judgments cannot bypass omissions. |
| Union merge | Validate source snapshots before replacing the union, then retain those snapshots through publication. Keep the public metadata shape unchanged. |
| Repository checks | Use the shared selection checks and strict snapshot audit; fresh clones without generated snapshots still run static checks. |

Canonical orchestration enforces the gate before accepting a candidate for deduplication or
rendering, and rechecks actual-mode solution fallback and retained target associations.
Pure draw/completion helpers remain available to inspect incomplete annotations; they do
not publish dataset artifacts or substitute for the canonical gate.

The default `audit:label-dependencies` command remains report-only and does not load runtime
generators or replay payloads. `--with-evidence` enables supplementary reconstruction and
diagnostics without changing the core annotation findings or strict outcome. `--strict` adds an
annotation enforcement summary and a failing exit status for the conditions above. Keep
range and supplementary evidence findings visible without making them strict failures.
Reports write only to `temp/`; auditing does not mutate labels, render images, call VQA,
or change caches, targets, or generated datasets.

Version graph/evaluator/report semantics and bind the policy identity to the graph and
relevant ontology records, including absent candidate labels and Area ancestry. Retain
separate evidence identity for optional replay and reviewed completion. Changes to report
wording alone should not invalidate images. Matching never executes payload adapters.

## Implementation and verification sequence

1. Separate pure annotation evaluation from supplementary evidence results. Add direct
   annotation-family triggers and declarative conflicts while preserving the Area gate.
2. Replace evidence-scoped strict enforcement with the generic finalized-annotation gate.
   Preserve report-only selection omissions and range findings.
3. Update runtime, audit, dataset, merge, and repository entry points to share that gate.
   Keep existing supported completion behavior separate; do not expand adapters merely to
   increase completeness coverage.
4. Run unit and integration regressions, full coverage, type/static/documentation checks,
   and two deterministic audits. Inspect every newly exposed omission and distinguish
   annotation-policy findings from incorrect mathematical labels.
5. Record real remaining findings explicitly. Repair declarations or add supported labels
   in a separately reviewed content increment; do not invent labels, alter targets, or
   weaken the allowlist to force a passing audit.

Regression tests cover all Area cases above; generic unknown producer/view combinations;
annotation omissions without adapters; evidence that cannot suppress a core omission;
exclusive conflicts without a numeric trigger; legitimate mixed counts/digits/forms;
structural descendants; deterministic hashes/diagnostics; pre-draw versus finalized checks;
nonexhaustive fraction-unit and decimal-precision selectors that must not become blanket obligations;
report-only range findings; immutable snapshots; cached VQA bypass prevention; and existing
completion receipts and question/solution behavior.

No dataset regeneration or Gemini requests are needed solely to change the label-only
validator. Actual label or presentation repairs still use the established canonical
generation, churn/split/image checks, and VQA workflow.

## Annotation-only implementation verification (2026-10-27)

Checkpoints `f9faeefa` and `508d6170` separate annotation requirements from payload evidence
and replace the adapter-scoped gate. Completion reads only supplementary proof assessments,
and its reviewed producer/view opt-in is explicit rather than implied by adapter registration.
No targets, declarations, generated rows, images, or VQA cache records changed in this increment.

The unchanged snapshot is
`cada54596eb7b8fd3dc3dd293c5576d9ec8d6fa0f952134a356e1b462058f4c2`:

- All 2,808 stored samples are inspected; 1,884 satisfy the unchanged Area allowlist and
  924 are outside it. All 1,212 pre-draw selections are enumerated, with 797 eligible.
- Core annotation results contain zero unresolved assessments, conflicts, invalid contexts,
  row integrity errors, or incomplete tuples. Adapter availability is not a completeness status.
- There are 4,318 missing non-range rule/facet assessments across 1,332 stored samples.
  Some rules require the same facet, so assessment counts are not distinct missing labels.
- Strict mode intentionally exits nonzero for those omissions. Repository checks pass the
  other six gates and fail the annotation dependency gate; these content findings remain
  visible rather than being deferred by producer or payload variant.
- Range presence remains report-only (944 sample and 402 selection assessments). The wider
  annotation triggers expose more existing omissions without calculating or changing ranges.
- Optional `--with-evidence` produces identical core annotation findings and strict failures.
  Payload replay and receipt-policy diagnostics remain supplementary.

| Missing facet | Distinct stored samples |
|---|---:|
| Zero participation | 1,082 |
| Numeral system | 830 |
| Numeric base | 788 |
| Sign | 616 |
| Operand digit group | 490 |
| Number kind | 222 |
| Fraction magnitude | 130 |
| Operand count | 26 |

These counts overlap. They identify missing annotation families, not the correct replacement
values. The next content increment should review declaration omissions and justified additive
labels without changing targets or treating label absence as an opposing claim.

Focused regressions pass (9 files / 259 tests), and final type checking passes. Evaluator
coverage is 100% for statements, branches, functions, and lines. Documentation validation
passes with the five existing external-fetch warnings. Two final strict audits produce
byte-identical JSON and Markdown; core findings and strict results also match exactly with
and without optional evidence.

| Final verification | Result |
|---|---|
| Complete test suite | 837 files / 6,304 tests pass. |
| Generator coverage gate | Every generator meets the existing statement/branch thresholds. |
| Changed libraries | 257 tests pass; 98.99% lines, 98.46% statements, 95.93% branches, 99.41% functions across validation, completion, and orchestration. |
| Generic evaluator | 100% lines, statements, branches, and functions. |
| Generic strict gate | 100% lines, statements, and functions; 97.05% branches. |
| Type and documentation checks | Pass; only the five existing external-fetch documentation warnings. |
| Repository check | Six gates pass; annotation dependency gate fails for the 4,318 known missing assessments. |
| Strict audit determinism | JSON and Markdown byte-identical across two runs. |
| Evidence independence | Core subject results and the complete strict output match with and without `--with-evidence`. |
| Artifact preservation | Same immutable snapshot pointer; no regeneration, image/metadata edits, cache writes, or Gemini calls. |

Local reports are under `temp/annotation-dependencies/`, including `final-plain/`,
`final-repeat/`, `final-evidence/`, `full-coverage-final.txt`, and `library-coverage/`.

## Historical evidence-scoped rollout

The following sections record earlier commits and their original verification scope.
Their passing counts do **not** establish annotation completeness for every eligible sample.
The 2026-10-27 annotation-only design above supersedes the former adapter-scoped gate and
any implication that further adapter coverage is required to check missing dependencies.

## Implemented additive repairs

Checkpoints `1cea4ec4`, `a28130a0`, and `d507fd41` implement the reviewed omissions without editing or
removing targets, changing the Area allowlist, or introducing range-policy work. The
report-only audit remains independent; these repairs do not enable strict dependency gates.

The declaration repairs add `Ability.TextualArticulation` to `counting-objects-simple`
because its question requests a written explanation and its solution supplies one, and
`Scope.ArabicNumerals` to `counting-objects-parity` for its reviewed numeral projection.
The four supported zero omissions in equal-addends samples use the reviewed post-draw
completion below. The arithmetic-pairs `requireZero` resolver retains its existing absence
branch: a generator-level fallback would also label number-line projections that visibly
include a zero origin. A nonzero mathematical payload alone does not prove absence of zero
from every view. The selected configuration and generated values remain unchanged.

The operand-digit repair uses the pure helper
[`src/lib/realized-labels.ts`](../../src/lib/realized-labels.ts), called after the ordinary
planned draw has produced mathematical data. Its supported boundary is
`arithmetic-ops-pairs`, `arithmetic-ops-triples`, and `arithmetic-ops-four` with the reviewed
`operations-boxes`, `operations-boxes-inversion`, `operations-vertical`, and
`operations-vertical-inversion` projections. It applies the unchanged complete Area gate
before using the existing typed evidence adapter and shared evaluator. It adds only
supported smallest/largest operand and applicable dividend/divisor digit descriptors.
Results cannot substitute for operands. For arithmetic pairs only, it also adds
`NumbersWithoutZero` when neither zero claim was planned and the reviewed zero assessment
establishes exactly that absence. It never adds `NumbersWithZero` or an opposing zero claim.
No other facet is completed by this helper; unsupported projections remain outside it.

The completion preserves every planned claim, the selected plan and schema bindings,
generator and view configuration, data, seeds, attempts, and random state. It does not
create target permutations or broaden matching and deduplication admission. Signed operand
profiles, property-law witnesses, malformed equations, and underdetermined question
projections stay unresolved without speculative additions. A reused question draw is
assessed again for the actual solution mode without drawing new data or changing its
recorded origin; direct reproduction and audit replay also pass the actual artifact mode.

Operational metadata records a versioned `realized_labels` receipt containing the policy
hash, actual mode, original `plannedLabels`, `addedLabels`, and operand/zero evidence labels and
references. Completion can therefore be repeated from the planned claims instead of
treating earlier additions as configuration. Audit replay checks a stored receipt against the
current evidence policy. Published metadata retains the existing three-field shape and
uses the final labels; VQA evaluates those final supplied claims through its existing
contract.

Supported generation-pair identities explicitly depend on the completion and integration
sources, the effective graph/evidence policy, candidate ontology descriptors even before
they appear in output, and all Area records and ancestry used by the context gate. Final
labels and the receipt participate in supported pairs' content and image identities, so
unchanged pixels cannot hide changed annotations. VQA keys include the final labels;
receipt-only provenance changes do not require a different visual judgment. Unrelated
pairs retain their existing identity inputs. First adoption requires rebuilding the
dependency graph before incremental reuse.

The zero review confirms two even-parity projection conflicts. The task describes the
empty leftover group as "None", so the grouping quantities and zero remainder are valid
evidence under the current ontology semantics, while the inherited labels claim
`NumbersWithoutZero`. Adding `NumbersWithZero` alongside that claim would leave a
contradiction. A later projection-specific correction must replace the false absence claim;
weakening the evidence would hide the defect. This additive repair leaves both findings
explicit, appends no contradictory zero label, and removes neither claims nor targets.

## First increment verification

Implemented on `codex/label-dependency-audit` with separate plan, evaluator, evidence-adapter,
and report/CLI checkpoints. Existing working-tree ontology-adoption changes were preserved
and excluded from those feature commits. The verification below uses the current pinned
ontology and dataset snapshot in that working tree.

| Check | Result |
|---|---|
| Focused graph, evidence, and audit unit tests | 118 pass. |
| Coverage of the three new library modules | 99.73% lines, 99.59% statements, 98.32% branches; evaluator and evidence adapters each have 100% line coverage. |
| Integration suite, including the real matched arithmetic/replay omission tests | 9 files / 26 tests pass. |
| Complete test and generator-coverage gate | 833 files / 6,058 tests pass; all generator minimum thresholds pass. |
| `npm run check -- --spec=ccss` | All six repository gates pass. |
| `npm run check:docs` | Pass; five external-document fetch warnings in the restricted network environment. |
| Repeated CCSS dependency audit | Both JSON and Markdown are byte-identical across two runs. |

The default coverage invocation encountered sandbox temporary-file rename errors, followed
by test timeouts under the default worker setup. The complete gate passed using
`VITEST_MAX_WORKERS=2`, `npx vitest run --coverage --pool=threads --testTimeout=30000`, and
the unchanged `check-generator-coverage.ts` gate.

The CCSS report inspects all 1,212 admitted selections and 2,808 stored samples, with zero
incomplete tuples, invalid contexts, evidence-provenance issues, or evaluator contract
errors. It verifies replay for 222 samples; the other 2,586 have unsupported adapters and
retain explicit unresolved evidence. Across selection and sample assessments it reports
2,323 satisfied, 1,344 missing, 12 not-applicable, and 11,599 unresolved results, plus 12,338
unresolved triggers. These are facet-assessment counts for review, not confirmed sample
defect counts or a claim of complete annotation coverage. Reports remain under
`temp/label-dependencies/ccss/`; no gold labels or generated artifacts were changed.

## Additive repair verification

The following checks passed for the additive repair checkpoints. The first-increment
results above remain the historical audit baseline, not results for regenerated repairs.

| Check | Result |
|---|---|
| Complete test and generator-coverage gate | 835 files / 6,114 tests pass; all generator minimum thresholds pass. |
| Realized-label helper tests and coverage | 41 tests pass; 100% coverage. |
| `npm run check -- --spec=ccss` | All six repository gates pass. |
| Integration suite | 9 files / 26 tests pass. |
| `npm run check:docs` | Pass; five external-document fetch warnings in the restricted network environment. |
| Canonical snapshot comparison | All 1,013 targets, 1,180 matching tuples, and 2,808 sample keys preserved. Seeds, attempts, replay origins, content/task fingerprints, target associations, and every PNG hash unchanged. Exactly 184 samples gained labels; none were added or removed and no existing label was removed. |
| Image and split audits | 2,808 images; zero duplicate groups, errors, or warnings. No train/validation leakage or configured-task redundancy. |
| Canonical VQA | 2,808/2,808 passing samples: 176 evaluated in the final run and 2,632 matching passes reused. |
| Strict dataset audit | Exact 2,808/2,808 passing cache coverage; zero structure, renderer, duplicate, failing, malformed, missing, stale, or obsolete-module issues. Freshness matches the final snapshot. |
| Repeated post-repair dependency audit | JSON and Markdown byte-identical across two runs. Operand-digit omissions 166→0; articulation 14→0; numeral system 4→0; zero 6→2. No provenance issues, evaluator contract errors, invalid contexts, or incomplete tuples. |

The final repair adds 374 labels across 184 samples: 352 operand-digit descriptors, 14
`TextualArticulation`, four `ArabicNumerals`, and four `NumbersWithoutZero`. The two
even-parity conflicts deliberately remain flagged. Range-presence findings remain exactly
346 admitted selections and 808 samples; no range annotation or policy changed. The Area
gate and evidence-coverage boundary are unchanged, including 222 verified sample replays
and 2,586 unsupported adapters with explicit unresolved evidence.

The snapshot comparison uses the captured pre-repair working-tree dataset, rather than
attributing pre-existing ontology-adoption changes to this repair. Baseline generation:
`c785a210b0c3563a2c3be699b1419d2595dfb083aa260c6a38fda635f56bb564`; repaired generation:
`c4a377012fd532a789ca4b4c08cf77c2332cbe66e1afd3207052a840d0a89045`.
Local verification reports and comparisons are retained under `temp/label-omission-repairs/`.
The cache checkpoint replaces only the 184 repaired samples' records, preserving unrelated
pre-existing ontology-adoption changes outside these feature commits. The dependency audit
remains report-only; passing VQA and dataset audits do not dismiss the two reviewed parity
conflicts or claim complete evidence coverage.

## Parity zero correction follow-up

After review, replacement of the inherited zero-absence claim was explicitly approved for
the parity projection. The artifact annotation step now replaces `NumbersWithoutZero` with
`NumbersWithZero` only for `counting-basic` / `counting-objects-parity` when the existing
reviewed evidence establishes a zero-valued group or remainder. It preserves all other
labels, requires known target labels, and never rewrites an explicit zero-absence target
claim. The original planned labels and supporting zero evidence remain in the versioned
receipt. Matching declarations, targets, the Area allowlist, range policy, payloads,
configuration, and rendering remain unchanged.

Focused tests pass: 79 tests across the helper, planned generation, and parity spec; the
helper's 66 tests achieve 100% statement, branch, function, and line coverage. Type checking
passes. Deterministic replay of all four stored parity artifacts changes exactly the two
even artifacts (12 objects in the question and 16 in the solution). Both odd artifacts
retain their existing labels. All four zero assessments are satisfied, with unchanged
content/task fingerprints and replay origins. Reports are in `temp/parity-zero-fix/`.

At source checkpoint `7fb9bf10`, this follow-up changed source and tests only. The immutable generated snapshot and VQA
caches have not been regenerated; the historical audit results above remain the results
for that stored snapshot until canonical regeneration and validation run.

## Scoped strict coverage and property-law evidence

The next increment preserves the Area allowlist and excludes range-policy work. The
versioned registry in `src/validation/label-dependency-coverage.ts` declares producer/view,
payload variant, and facet coverage independently of adapter registration. Nonnegative
integer equations and commutative, associative, and distributive witnesses cover number
kind, numeral system, base, sign, zero, operand count, and operand digits. Reviewed counting
and count-out projections cover their numeric facets; explicit written explanation is
covered for `counting-objects-simple`.

Signed operand-digit profiles and quantities hidden by underdetermined inversion questions
remain named deferrals. Unsupported producers, views, rules, and facets remain visible in
the reports. Range is always report-only, including its existing presence checks. These
coverage declarations do not alter Area eligibility or silently convert unknown evidence
into not-applicable assessments.

The shared gate fails covered omissions and unresolved applicable evidence, contradictory
zero/sign claims, invalid contexts, provenance or evaluator contract errors, incomplete
selection enumeration, and unavailable/empty stored snapshots. A registered coverage
obligation survives removal of its evidence adapter. Invalid payloads fail closed.
`audit:label-dependencies -- --spec=ccss --strict` adds a versioned strict summary and a
failing exit status for those errors. The default audit remains report-only.

Integration points are:

- Completed draws, including actual-mode solution fallback, before retries or deduplicated
  target reuse can hide an annotation contract failure.
- Shared standards checks over complete bounded selections; payload obligations remain
  deferred until a draw exists and never filter matching.
- Repository checks over generated snapshots.
- Dataset validation before either cached or live VQA, bound to its immutable snapshot.
- Union source validation before replacement, reusing the same validated snapshots for both
  splits and preserving their labels in the public projection.

Property-law evidence version 2 validates both rendered sides and necessary intermediate
values. Distributive witnesses include the factorized three-operand expression, expanded
four-operand expression, and two-operand partial sum. Each expression establishes its own
operand count and digit profiles. Completion appends supported count/digit facts and zero
absence for those reviewed witnesses, records their evidence, and preserves all target
claims, configuration, data, entropy, and matching. The parity correction remains the sole
bounded replacement of an inherited non-target claim.

Deterministic preflight replay verifies all 222 supported stored draws under the new runtime
gate. Exactly 18 artifacts change annotation: two even-parity zero replacements and 16
property-law completions. The latter comprise six commutative, four associative, and six
distributive samples. They gain 64 labels: 16 `NumbersWithoutZero`, 36 operand-digit
descriptors, and 12 operand-count labels. Content and task fingerprints are unchanged.

| Check | Result |
|---|---|
| Parity checkpoint regressions | 79 tests pass. |
| Property-law evidence tests | 112 pass; 100% lines/statements/functions, 99.35% branches. |
| Strict coverage engine | 69 tests pass; 100% statements, branches, functions, and lines. |
| Shared snapshot inspection | 26 tests pass; 100% statements, branches, functions, and lines. |
| Integration suite | 9 files / 26 tests pass. |
| Full test/coverage | 837 files / 6,305 tests pass; all generator minimum coverage thresholds pass. |
| Completion and selection gate coverage | 100% statements, branches, functions, and lines. Runtime omission regression aborts after one draw. |
| Repository checks | All seven gates pass against the regenerated snapshot; documentation and standards checks pass. |
| Canonical snapshot | 1,013 targets, 1,180 matching tuples, and 2,808 samples preserved; all PNGs, content/task fingerprints, seeds, attempts, replay origins, and target associations unchanged. Exactly the 18 preflight annotation changes occur. |
| Parity VQA | All four parity samples pass; two corrected samples evaluated and two unchanged passes reused. |
| Full VQA | 2,808/2,808 pass; 16 property-law samples evaluated and 2,792 passes reused. |
| Scoped strict dependency audit | Zero failures across 222 covered samples / 1,488 covered facets. All five formerly unresolved property-law facets are satisfied for each of the 16 samples. |
| Audit determinism | Strict JSON and Markdown reports are byte-identical across two runs. |
| Strict dataset/cache audit | Exact 2,808/2,808 passing cache coverage; zero dependency, freshness, structure, renderer, duplicate, malformed, missing, stale, obsolete-module, or failing-cache issues. |

Reports for this increment are retained under `temp/label-dependency-strict/`.
The real matched-artifact regression removes `Base10` and verifies exactly one strict
missing-base failure, independently of supplied-label VQA. Live VQA honors its generator/view
scope; strict dataset audit always checks the full snapshot.

The former two parity conflicts and all other non-range missing findings are now absent.
The 346 selection and 808 sample range-presence findings are unchanged and remain
report-only. Unsupported adapters (2,586 samples), 90 deferred selections, and all named
facet deferrals remain visible; the gate does not claim exhaustive annotation coverage.
No targets or generation constraints were changed.

Verification compares baseline generation
`c4a377012fd532a789ca4b4c08cf77c2332cbe66e1afd3207052a840d0a89045` with final generation
`cada54596eb7b8fd3dc3dd293c5576d9ec8d6fa0f952134a356e1b462058f4c2` in the current pinned
ontology-adoption working tree. Those pre-existing changes remain outside the feature
commits. Source checkpoints are `7fb9bf10` (parity), `f4f351ba` (property evidence),
`841a25fe` (strict coverage), and `9d48ad55` (live-validation scope preservation).
