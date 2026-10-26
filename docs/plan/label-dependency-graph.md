# Local label dependency graph

Status: graph, evaluator, initial evidence adapters, report-only audit, and reviewed additive
repairs implemented. Further evidence coverage and strict integration remain planned.
Consolidated on 2026-10-26.

Add a small graph of labeling obligations to `edugraph-content` so related facets are
assessed consistently across generators and views. An edge means that an applicable facet
must be determined; it does not automatically append a label. Start with a report-only
audit, then enforce reviewed dependencies through the existing validation pipeline.

## Scope and evidence

The graph and evaluator belong only to this repository. Use typed TypeScript data and the
installed `edugraph-ts` ontology; no graph database, new ontology relation, or sibling-repo
runtime dependency is needed.

The motivating analysis is in the `docs` directory of the sibling checkout
`../edugraph-classify/`:

- `UPSTREAM-LABEL-COMPLETENESS-20261003.md` identifies inconsistent operand-digit,
  fraction-subtype, reference-frame, and explanation-Ability coverage. It distinguishes
  checking supplied labels from finding omitted labels.
- `UPSTREAM-ANNOTATION-HANDOFF-20261003.md` recommends evidence-backed assessments,
  a report-only rollout, and preservation of generation and target provenance.

Those reports examined dataset v0.30.0-03 and older ontology snapshots. Treat their examples
as regression candidates, not assertions about current failures. Implementation must
resolve labels and definitions against this repo's exact pinned ontology. At planning time,
the pin is `0.31.0-pre.58.9231304124e9`.

Existing contracts remain in [label architecture](../label-architecture.md),
[general spec rules](../spec-general.md), and [target rules](../target-spec.md). Targets
remain partial competency requests; the combined resolved generator/view labels describe
the produced task. The graph adds completeness obligations without changing positive
capability matching, label eligibility, or ownership (`SPEC-1`, `SPEC-3`, `SPEC-5`, `SPEC-11`).

**Range-policy work is excluded.** Retain only range-facet presence/applicability under
existing semantics. This initiative does not choose strongest bounds, compute replacement
ranges, change thresholds or endpoint semantics, rewrite range annotations, or introduce
new range evidence extractors. Existing correctness checks continue unchanged.

An exhaustive ontology-wide annotation engine, automatic correction or removal of existing
claims, and a redesign of the VQA response contract remain outside this implementation.
The reviewed additive repair below permits narrow post-draw operand-digit and zero-absence completion;
its labels never feed back into matching or generation configuration.

## Agreed Area allowlist

Apply these dependency rules only when at least one Area is present, and **every involved
Area is a transitive descendant of at least one of**:

- `Area.Arithmetic`
- `Area.IntuitiveMathematics`
- `Area.FormalMathematics`

Evaluate the complete resolved Area set from both generator and view, including invariant
and selected schema labels. Do not use only target labels, choose a primary Area, or union
mutually exclusive schema alternatives.

For the resolved Area set `A` and allowed roots `R`, the context condition is:

```text
A is nonempty AND
for every a in A, there exists r in R such that a is a transitive structural descendant of r
```

Use the pinned ontology's structural traversal, as exposed by the existing ontology
helpers. An Area with membership in an allowed subtree satisfies this condition even if
it also has another ancestry path. No additional Arithmetic anchor or explicit algebra
exclusion is required. The roots are policy selectors, never emitted labels or module
matching guards; ordinary eligibility validation rejects organizational labels first.

An Area outside the allowed union puts the whole sample outside this policy's scope.
An empty Area set cannot pass vacuously; report it as an invalid context. Unknown or
ineligible labels remain contract errors, not an exemption from validation.

Passing the context gate does not itself activate any facet. Each dependency still needs
its own label-family or task-evidence trigger. Existing label-correctness checks apply
inside and outside this policy's scope.

| Resolved Area context | Policy context result |
|---|---|
| `Addition` | Eligible; individual dependency triggers decide what to assess. |
| `Addition` and `Equation` | Eligible; an equation is also a valid arithmetic representation. |
| `AlgebraicExpression` and `Addition` | Eligible: this is an intended positive example because the expression belongs to Formal Mathematics and addition to Arithmetic. |
| The preceding set plus `EquationSolving` or `AlgebraicModeling` | Outside policy scope because an involved Area lies outside the allowed union. |
| Only allowed formal Areas, with no numeric content or other dependency trigger | Eligible context with no numeric obligations. |
| No Area | Invalid context, not a successful empty check. |

Ontology membership is authoritative for this boundary. If a future case behaves
unexpectedly, review the task's labels and ontology placement first. A genuine structural
mismatch may warrant an ontology correction; it should not automatically become a local
exception. This plan does not authorize or require an ontology migration.

## Graph markup

Proposed authored location: `src/validation/label-dependencies.ts`. Keep it a declarative
object containing the context gate, named facets, and rules with stable diagnostic IDs.
The following markup defines the implemented initial shape.

```ts
import {Ability, Area, Scope} from 'edugraph-ts/generated';

export const labelDependencies = {
  version: 1,
  context: {
    allAreasWithin: [
      Area.Arithmetic,
      Area.IntuitiveMathematics,
      Area.FormalMathematics,
    ],
    requireArea: true,
  },
  facets: {
    numeric:       {root: Scope.NumericAbstraction},
    numberKind:    {root: Scope.NumericSpace},
    numeralSystem: {root: Scope.Numerals},
    base:          {root: Scope.NumericBase},
    range:         {root: Scope.NumericRange, check: 'presence-only'},
    sign:          {root: Scope.NumericSign},
    zero:          {root: Scope.NumericZero},
    operandCount:  {root: Scope.OperandCardinality},
    operandDigits: {root: Scope.OperandDigitCount},
    fraction:      {root: Scope.FractionNumbers},
    fractionMagnitude: {labels: [Scope.ProperFractions, Scope.ImproperFractions]},
    fractionUnit:      {labels: [Scope.UnitFractions, Scope.NonUnitFractions]},
    decimal:           {root: Scope.DecimalNumbers},
    decimalPrecision:  {
      labels: [Scope.TenthDecimals, Scope.HundredthDecimals, Scope.ThousandthDecimals],
    },
    referenceFrames: {root: Scope.ReferenceFrameComplexity},
    articulation:    {labels: [Ability.TextualArticulation]},
  },
  rules: [
    {
      id: 'LD-NUM-01',
      when: {any: [{family: 'numeric'}, {evidence: 'numericTask'}]},
      assess: ['numberKind', 'numeralSystem', 'base', 'range', 'sign', 'zero'],
    },
    {
      id: 'LD-OPERANDS-01',
      when: {evidence: 'arithmeticOperands'},
      assess: ['operandCount', 'operandDigits'],
    },
    {
      id: 'LD-FRACTION-01',
      when: {any: [{family: 'fraction'}, {evidence: 'fractionValues'}]},
      assess: ['fractionMagnitude', 'fractionUnit'],
    },
    {
      id: 'LD-DECIMAL-01',
      when: {any: [{family: 'decimal'}, {evidence: 'decimalRepresentation'}]},
      assess: ['base', 'decimalPrecision'],
    },
    {
      id: 'LD-FRAME-01',
      when: {evidence: 'quantityReferenceFrames'},
      assess: ['referenceFrames'],
    },
    {
      id: 'LD-EXPLAIN-01',
      when: {evidence: 'writtenExplanation'},
      assess: ['articulation'],
    },
  ],
} as const;
```

`root` selects a reviewed family through structural membership, including the root itself
only when it is an eligible descriptor. `labels` names an explicit candidate set; it does
not imply exclusivity or automatic emission. Evidence identifiers refer to a small typed
adapter registry, not arbitrary functions embedded in the graph. Only evidence established
for the actual task activates an evidence trigger; unavailable evidence remains unresolved.

Rules form adjacency lists from triggers to required facet assessments. Evaluate each
activated rule/facet once, with deterministic ordering. Requiring a facet does not create
a label or establish evidence for another trigger. Family and context membership do not
turn `partOf`, `integrates`, `expands`, or other relations into annotation implications.

Avoid a general expression language. The initial evaluator needs family/evidence predicates
and `any` composition, plus the shared Area gate. Add operators only when a reviewed rule
needs them.

## Initial dependencies and evidence boundaries

All rows inherit the Area allowlist. A task outside it stays outside even when a dependency
would otherwise be relevant; there is no measurement, algebra, or per-module bypass.

| Rule | Trigger and required assessment | Evidence boundary |
|---|---|---|
| `LD-NUM-01` | Numeric Scopes or independently established numeric content require number kind, numeral system, base, range, sign, and zero assessments. | Object quantities can have number-kind and range labels while numeral system/base are inapplicable. Written or explicitly requested numeral answers can establish notation evidence. Range checks remain presence-only. |
| `LD-OPERANDS-01` | Arithmetic operands require operand cardinality and applicable digit profiles. | Count operand occurrences, including repeated values. Distinguish smallest/largest operand and dividend/divisor roles where applicable. A result's digits cannot substitute for operand digits. |
| `LD-FRACTION-01` | Fraction values require proper/improper and unit/nonunit assessments. | Use the actual values and exposed representation. Mixed fraction types may require multiple independent labels. |
| `LD-DECIMAL-01` | Decimal representation requires base and precision assessments. | Follow the representation and current definitions, not an internal storage format. An unsupported precision is unresolved, not silently rounded to a catalog label. |
| `LD-FRAME-01` | Relevant quantity representations require reference-frame assessment. | Several diagrams can share one frame. Missing frame evidence is unresolved; diagram count alone is insufficient. |
| `LD-EXPLAIN-01` | A requested or demonstrated written explanation requires articulation assessment. | Assess the observable learner action in each mode. Mere text presence does not establish an Ability, and the new assessment does not replace existing understanding claims. |

The [numeral-system ownership correction](numeral-system-ownership.md) is a required
regression reference: object-only counting does not acquire `ArabicNumerals` or `Base10`,
while an explicitly requested answer in digits can support numeral labels even when the
answer box is empty. Arabic digit symbols alone do not universally establish base 10.

Do not apply one numeric-field scan to every facet. Sign, zero, operand digits, fraction
forms, and representation facts have distinct evidence domains. Adapters inspect typed
mathematical data and the view's task projection, without adding label reads or annotation
logic to pure generators/renderers. Validate both question and solution modes.

No global exactly-one constraint applies to a facet. Mixed representations and number
forms can be valid conjunctions (`TSPEC-14`); lower and upper range labels can coexist.
Presence establishes only the structural part of satisfaction. Evidence-dependent
assessments must also establish that the relevant distinctions are accounted for.

## Assessment results and diagnostics

Record the context outcome separately as `eligible`, `outside_policy_scope`, or
`invalid_context`. For each activated facet use:

| Status | Meaning |
|---|---|
| `satisfied` | Applicable supported labels are present and the required evidence check succeeds. For range this establishes presence under the existing contract, not a new numeric proof. |
| `missing` | Evidence establishes an applicable label or distinction that the resolved labels omit. |
| `not_applicable` | Evidence establishes that this facet does not apply, with a specific reason. |
| `unresolved` | Applicability, evidence, or a suitable ontology label cannot yet be determined. Missing adapters and unsupported catalog cases belong here. |

Contradictory or unsupported existing claims remain correctness errors. Do not hide them
behind a completeness status. Unknown and ineligible descriptors also fail existing checks.

Each finding should contain the rule ID, context decision, triggering labels/evidence,
facet, assessment status, current labels, evidence references/reason, and target,
generator, view, sample, split, and mode provenance where available. Group repeated findings
by owning declaration while retaining sample references. Include counts of unresolved and
outside-policy cases so a small passing subset cannot be presented as full coverage.

Evidence independent of existing labels is necessary: deleting every numeric trigger label
must not make a known numeric task silently pass. Begin with typed arithmetic and counting
adapters. Record which producer/view contracts are covered; an unreviewed adapter boundary
cannot be treated as proof that no trigger exists.

## Implementation and integration

Keep one evaluator in a proposed `src/lib/label-dependencies.ts`, with adjacent
`label-dependencies.test.ts`. Separate pure graph evaluation from the small typed evidence
adapters. The authored graph is the single source of dependency definitions; callers do
not copy rules into individual module specs.

| Surface | Integration |
|---|---|
| Graph integrity | Check version, unique IDs, known ontology selectors, eligible explicit label candidates, facet references, and registered evidence identifiers. Organizational roots remain valid selectors only. |
| Resolved selections | Inspect complete admitted generator/view selections. Reuse existing planner enumeration/factorization, with its bounds; do not flatten alternatives or treat one sampled selection as exhaustive. Evidence-dependent checks remain unresolved until a draw exists. |
| Runtime | Extend the boundary around [resolved-label validation](../../src/lib/label-contracts.ts) and [generation orchestration](../../src/lib/generation-orchestration.ts) to check actual draws before rendering and target-association reuse. Annotation contract failures bypass ordinary generation retries. |
| Stored datasets | Apply the same evaluator to every row in strict [dataset validation](../../src/scripts/validate-dataset.ts), using validated operational evidence or deterministic replay. A passing VQA cache entry cannot bypass missing dependencies. |
| Union publication | Validate source rows before replacement and the final public label projection in [merge-dataset](../../src/scripts/merge-dataset.ts). Keep richer evidence in operational metadata/sidecars. |
| Repository checks | Wire graph integrity and selection checks through [shared standards validation](../../src/lib/standards-validation.ts), full checks, and affected checks. Do not demand complete artifact labels from each target. |

The existing [scope-completeness inventory](../../src/lib/scope-completeness.ts) is useful
for candidate discovery and reporting conventions, but it inspects one deterministic
selection per tuple and treats co-resolution as a review signal. It is not the enforcement
engine or an observability proof.

Keep the first pass report-only. Later, label-only rules that are sound before generation
can participate in existing planner constraints, with explicit diagnostics for removed
selections and lost matches. Do not silently filter defective selections to hide an
annotation failure, and never run payload evidence adapters during matching.

Version the graph, evaluator/evidence contract, and deterministic reports. Validation
identity must include the effective graph, adapter policy, and relevant ontology records,
including candidate labels absent from existing annotations. The complete Area set and
ancestry used by the gate are dependencies too. If rules affect planner admission, include
their semantic hash in [matching policy identity](../../src/lib/matching.ts) and rebuild
persisted plans. Changes to report wording alone should not invalidate images.

Dependency audits run independently of VQA. Keep the existing public
`file_name`/`labels`/`solution` shape and existing VQA support contract. Changes to actual
labels or evidence-bearing presentation use the established regeneration and VQA workflow;
do not assume the existing supplied-label VQA response can discover omitted labels.

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

## Rollout and validation steps

The first increment provides `audit:label-dependencies`, the six-rule graph, the pure
evaluator, and reviewed arithmetic/counting adapters. It enumerates bounded admitted
selections and inspects every available stored row, with verified replay for supported
producer/view contracts. Fraction, decimal-precision, reference-frame, and other uncovered
evidence stays unresolved. No strict matching, generation, dataset-audit, or merge gate is
enabled yet. Operational usage is documented in [DOCS.md](../../DOCS.md).

1. **Inventory and implement the contract.** Validate the markup against the exact ontology,
   freeze the Area-gate examples, and implement graph/evaluator unit tests. Register the
   initial facets and evidence interfaces. Start with arithmetic and counting adapters;
   record uncovered fraction, precision, frame, and explanation assessments explicitly.
2. **Run a report-only audit.** Use the implemented command
   `npm run audit:label-dependencies -- --spec=ccss`. Write deterministic `audit.json` and
   `audit.md` under `temp/label-dependencies/ccss/`. Inspect admitted selections and all
   available dataset rows, with assessed/unresolved coverage clearly separated. This pass
   changes no labels, targets, caches, or generated artifacts.
3. **Review and repair findings.** Expand adapters to the initial dependency table, verify
   candidate omissions against current definitions and rendered tasks, and repair the
   owning declarations/resolvers where they can truthfully supply the missing claims.
   Preserve partial targets, existing planned claims, generation configuration, seeds, and
   sampling. The reviewed post-draw operand-digit and zero-absence completion above may add supported
   observable facts within its declared producer/view boundary, with an actual-mode
   evidence receipt and explicit source/candidate identity. Other instance-dependent
   findings stay explicit until their annotation design is reviewed; do not force new
   target permutations. Range findings report missing presence only.
4. **Enable strict validation for reviewed coverage.** Add `--strict` to the audit, fail
   missing dependencies and unresolved applicable assessments within the declared supported
   coverage, and retain explicit outside-policy/uncovered totals. Wire the shared evaluator
   into runtime, dataset, merge, and repository checks. A completeness claim for the full
   initial rule set requires resolving its uncovered adapters; do not shrink the Area gate
   to obtain a passing run.
5. **Verify affected artifacts.** For actual declaration or rendering repairs, run scoped
   canonical generation and VQA, then label diffs, image-conflict checks, split checks,
   target-association validation, and churn review. Preserve independently correct labels.
   Dataset publication remains a separate release workflow.

The regression matrix must cover:

- Every allowed root, transitive descendants, an Area with multiple ancestry paths, an
  outside Area added to an otherwise allowed set, and an empty/unknown/ineligible Area.
- The intended `AlgebraicExpression + Addition` positive case, its extension with
  `EquationSolving` or `AlgebraicModeling`, and arithmetic equations that stay eligible.
- An eligible context without any trigger; targets whose extra facets come from the
  resolved pair; correlated choices where only one selection is incomplete.
- Seeded omissions of a required label and of every numeric trigger label; incorrect
  additions; deterministic diagnostics; and missing adapters producing unresolved findings.
- Object-only counting versus an explicit numeral response; mixed representations; and
  applicable positional bases without assuming every numeral is decimal.
- Operand/result digit distinctions, repeated operands, zero and negative values, proper
  and unit fractions, decimal precision, shared frames, and written explanation evidence.
- Range-facet presence with lower/upper compositions and missing-presence diagnostics,
  without calculating or asserting tighter replacement bounds.
- Both image modes, stale policy receipts, cached VQA passes with missing dependencies,
  deduplicated target associations, and source/final union row checks.

Implementation checks include adjacent unit tests for all new library code, integration
tests for selection/runtime/stored-row gates, `npm run test:coverage`,
`npm run test:integration`, `npm run check -- --spec=ccss`, and `npm run check:docs`.
Run the new audit twice to verify deterministic output. Use scoped canonical generation,
`validate:dataset`, `audit:dataset`, `audit:images`, `report:splits`, and `report:churn` only
when implementation repairs affect their inputs.

On implementation, document approved authoring obligations in the reference library and
commands/workflows in `DOCS.md`; link them from the existing indexes. This plan records the
design and sequence, rather than introducing new normative authoring rules by itself.

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

This follow-up changes source and tests only. The immutable generated snapshot and VQA
caches have not been regenerated; the historical audit results above remain the results
for that stored snapshot until canonical regeneration and validation run.
