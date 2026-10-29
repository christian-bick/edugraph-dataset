# Local label dependency graph

Status: implemented as annotation-only validation. The repository contains one small graph,
a pure ontology-aware evaluator, and a shared strict gate and audit. Payload and rendering
changes are outside ordinary annotation repairs. The separately proposed
[measurement split](#proposed-measurement-generatorview-split-2026-10-29) is a separately
approved structural decision batch; it does not expand the graph's role.

The approved [configuration-inference extension](#configuration-inference-checkpoints-2026-10-29)
adds a narrowly scoped fallback for additional annotations. Its output inventory never supplies
matching capabilities; representation completeness remains separate.

## Configuration inference checkpoints (2026-10-29)

The user approved configuration-based `inferredLabels`, superseding the proposed conditional-alias
library repair for the six settled cases. Prefer matching-capable invariants and schema choices;
use inference only when these cannot express a sound declaration without inappropriate behavior
changes. See [SPEC-12](../spec-general.md#spec-12--inferred-annotations-are-a-fallback-without-matching-capabilities)
for alternatives, ownership and the deliberate matching limitation.

1. **Contract and validation:** common schema-typed spec field, output eligibility/ownership,
   pure synchronous runtime checks, read-only complete configuration and unchanged random state.
2. **Resolution, identity and audit:** integrate planned/direct owner resolution before generation;
   bind source and output ontology semantics into artifact identity; verify replay; distinguish
   static omissions, pending inference and exhaustively validated configuration outcomes.
3. **Six acceptance cases:** two near-doubles width claims and four expanded-form zero claims,
   preserving configuration, sampling, targets, matching and rendering. Verify all old choices,
   both generation paths and both modes before updating closure counts.

All callbacks receive the same owning configuration, with no feedback between rules. No generated
payload, image or graph-driven label completion participates. The existing annotation evaluator,
Area allowlist and range-policy exclusion remain unchanged. Inference outputs cannot admit new
matches, select configurations or satisfy target participation requirements.

The source baseline is **391** unresolved selection/facet requirements. `produces` is only a
possible-output declaration, so introducing a callback closes no finding by itself. Unknown
configuration outcomes remain pending; sampled checks cannot be presented as exhaustive proof.
The completed third checkpoint establishes six closures, leaving **385** source gaps. The known
reasoning-view content defect remains separately open. Dataset regeneration and VQA still wait
for source readiness under the existing agreement.

Checkpoint 1 introduces the contract and guards without adding module inference declarations
or connecting them to production generation yet. Validation and subsequent checkpoint results
are recorded in the progress ledger as they complete.

Checkpoint 2 connects both planned and direct configuration resolution. Each owning callback
runs before mathematical generation, using the same read-only snapshot as its sibling callbacks.
The resulting annotations are checked by the existing shared contract and dependency gate.
Replay resolves the same configuration and recomputes these annotations; the browser consumes
the prepared configuration without rerunning inference.

The static audit keeps the original `declaredLabels` alongside `annotationResolution`:

| State | Dependency input and readiness meaning |
|---|---|
| `not_required` | No inference entries; assess ordinary declarations. |
| `exhaustive` | A reviewed resolver contract establishes the complete configuration; assess the actual combined output and retain the parent selection ID. |
| `pending` | Complete outcomes are unproven; retain declaration findings and block source readiness. |
| `invalid` | Declaration, ownership or execution contract failed; retain declaration findings and report the error. |

The first proof mechanism supports singleton outcomes from direct label arrays and the reviewed
`selectExactMatch`, `selectExactLabelSetMap` and `resolveRangeFromLabels` factories. Arbitrary
callbacks, copied resolver metadata and ontology-neutral functions do not establish exhaustive
outcomes. No seeds are sampled to infer determinism. A later reviewed finite-outcome mechanism
can extend this without treating potential `produces` labels as actual output.

Module artifacts bind the inference source/import closure and declared output ontology semantics.
These outputs do not enter matching capabilities. At source readiness, run the authoritative
dataset graph rebuild (`--rebuild-graph`); existing no-op receipts alone do not establish freshness
after the pipeline-version change. The current stored snapshot remains an audit of persisted
labels, without retroactively applying source inference.

Current batch: the [measurement generator/view split and matching migration review](#proposed-measurement-generatorview-split-2026-10-29).
The broader work remains in the [refreshed backlog](#consolidated-declaration-backlog-2026-10-28),
[remaining batch roadmap](#remaining-batch-roadmap) and
[algebra/parity decisions](#algebra-and-parity-decision-note). The
[second measurement batch](#second-measurement-batch), including M2b, is implemented.
[M3 operand-digit declarations](#m3-operand-digit-declarations-2026-10-27) are implemented
in separate division and multiplication checkpoints. The
[integer-only operand-digit gate](#integer-only-operand-digit-gate-2026-10-28) narrows the
remaining measurement obligation to ten integer addition/subtraction selections. The
[M4 width choices](#m4-integer-additive-width-choices-2026-10-28) resolve all ten through
explicitly selected generator configurations and a separately approved sampling change.
The [C1 currency batch](#c1-currency-word-problem-declarations-2026-10-28) adds supported
quantity and notation invariants in two separate checkpoints.
The [C2 currency batch](#c2--currency-number-kinds-preserving-the-conversion-competency)
closes all 18 remaining currency source findings and preserves the eight integer digit
obligations. Autonomous execution started from **1,307 distinct non-range source gaps**;
the [progress ledger](label-dependency-progress.md) tracks current counts and child decisions.
The unchanged stored snapshot has **2,542 raw / 2,528 distinct non-range findings** under the
narrowed policy, compared with 4,146 raw / 4,012 distinct under the preceding policy.

The autonomous declaration pass and necessary-evidence re-review have triaged all 26 original
source scopes, followed by the six configuration-inference acceptance cases:
**959 requirements repaired, 75 newly exposed, 38 retired by policy, 385 remaining**.
All remaining gaps have exact owners in **26 decision batches**; the reasoning-view content
defect remains a separate open scope even though its numeral requirement is retired.
No independent declaration repair remains queued. The Area allowlist, integer-only
digit qualification and range-policy exclusion are unchanged. Dataset acceptance still waits
for the remaining source decisions and their implementations. The implemented narrowing is
[conditional notation dependencies](#agreed-direction-conditional-notation-dependencies);
representation completeness remains a separate design question.

### Completed inference acceptance cases

| Owner / resolved configuration | Added annotation | Exhaustive evidence | Why use the fallback here? |
|---|---|---|---|
| Near-doubles, maximum 10 or 20 | `SingleDigitSmallestOperand` | The smaller positive integer is `b`, with `2b + 1` below the configured bound. Thus `b <= 9`; the other operand may be 10. | Width depends on both strategy and range. A strategy-wide label overclaims wider configurations; additional selectable profiles would require redesigning legacy choice and sampling behavior. |
| Expanded form, existing maximum-at-most-1000 branch, two or three terms | `NumbersWithoutZero` | Every required expansion term is positive; solutions show these terms. Zero digits inside a numeral are not separate zero-valued operands/components in this layout. | Zero occurrence differs by the existing generator/rendering branch; it is not a module or cardinality invariant. |
| Expanded form, larger branch, two or three nonzero terms | `NumbersWithZero` | The complete place strip has at least four positions and only two or three nonzero coefficients, so a zero coefficient is visible in both modes. | The claim requires the complete range/cardinality configuration; adding branch aliases would change existing fallback selection. |

These are the six original selection/facet findings, not six labels or six sampled successes.
All 12 admitted selections for these two owners have exhaustive singleton configuration outcomes;
six add a label and six retain their existing annotations. `declaredLabels` still exposes the
original six omissions, while actual resolved output closes them. The source report therefore
contains **385 effective gaps**, with zero pending/invalid inference selections and no new gaps.

All 1,013 targets, 1,195 matches and 1,263 selections remain unchanged. The complete preservation
comparison covers 2,526 question/solution probes and 2,808 stored-origin draws: configuration,
mathematical payload, view configuration, fingerprints and random continuation are identical.
The two generators only gain spec metadata and annotation declarations; mathematical branches,
schemas and view sources are unchanged. The stored dataset itself is unchanged, so its findings
are not counted as repaired before regeneration. See the
[checkpoint ledger](label-dependency-progress.md#configuration-inference-checkpoint-3--six-acceptance-cases-2026-10-29).

## Proposed measurement generator/view split (2026-10-29)

**Status: implementation approved on 2026-10-29 in three checkpoints.** This is the RB-M1-D1
repair batch. It supersedes the proposed
`numericProfile === 'legacy'` inference for the 21 remaining conversion number-kind gaps.
The foundation checkpoint closes no source gap: the baseline remains **385** until the
implemented migration and fresh audit verify the original requirements' successors.

Structural splits should be rare. First consider a truthful invariant, a label bundle on an
existing choice, or a coherent explicit schema profile. Consider a split when mathematical
contracts or learner tasks genuinely differ, as described by
[IMPL-7](../implementation-general.md#impl-7--extend-before-you-create-extend-only-when-changes-are-surgical-otherwise-create),
[IMPL-G7](../implementation-generator.md#impl-g7--extend-capabilities-within-a-stable-payload-contract)
and [SPEC-V6](../spec-view.md#spec-v6--an-ability-driven-task-identity-is-a-leaf-view).
Under this initiative, prepare the contract boundary and migration evidence and obtain explicit
confirmation before implementing such a split. Routine autonomous declaration approval does
not cover it. `inferredLabels` remains the fallback when good matching-capable alternatives
are unsuitable, with the matching limitation in [SPEC-12](../spec-general.md#spec-12--inferred-annotations-are-a-fallback-without-matching-capabilities).

The user clarified the migration criteria:

- A broad target may validly match both resulting generators. Additional supported matches
  are acceptable; they do not require artificial exclusive routing.
- No currently covered target may lose coverage. Also retain a semantically equivalent path
  for each existing conversion task/configuration family, so a surviving unrelated match
  cannot hide the removal of a supported exercise.
- New module IDs changing sample keys, seeds, replay identities and cache/artifact identities
  are already accounted for. Exact old tuple or sample identity preservation is not an
  acceptance criterion for this proposed split.
- Targets, existing task layouts and mathematical case domains stay intact. The complete
  Area allowlist, integer-only digit qualification and range-policy exclusion stay intact;
  representation completeness stays separate. No payload adapters or graph-driven completion
  are introduced. The matcher itself is unchanged; ordinary module capabilities change.

### Contract and declaration boundary

Today `measurement-conversion` always creates an integer equivalence sequence. Its `legacy`
profile stops there; its `integer` and `decimal` profiles additionally create two exact
equalities in `numericExamples`. The execution view uses the optional field's presence to
switch from larger-to-smaller conversion to bidirectional conversion. Derivation and table
views use the integer sequence and ignore the additional numeric examples. Consequently,
letting a decimal-producing contract feed either projection would not establish decimal
evidence in the rendered exercise.

The split makes these two mathematical contracts explicit. It needs no conditional inference
for number kind and no third producer merely to distinguish integers from decimals.
The names below define the approved new IDs/types; checkpoint results are recorded below.

| Role | Proposed contract and declarations | Consumers / task |
|---|---|---|
| Generator `measurement-unit-equivalences` | `UnitEquivalenceSequenceProblem`: required `pair` and five `equivalents`; existing seven `unitPair` choices; invariant `IntegerNumbers`, `NumbersWithoutNegatives`, `NumbersWithoutZero` and `UnitScaleRelation`. No `numericProfile`. | One-way conversion, standard-unit derivation and conversion table. |
| Generator `measurement-conversion-values` | `MeasurementConversionValuesProblem`: required `pair` and required `numericExamples` containing number kind and two exact equalities. Existing seven `unitPair` choices and ordinary `integer` / `decimal` schema choices; existing positive/nonzero and relation invariants. No `legacy` alternative or unused sequence. | Bidirectional conversion. |
| View `measure-conversion-to-smaller` | Accept only `UnitEquivalenceSequenceProblem`; retain `ProcedureExecution`, `ArabicNumerals`, `Base10` and an empty view schema. | Current larger-to-smaller task, fixed by the leaf view. |
| View `measure-conversion-bidirectional` | Accept only `MeasurementConversionValuesProblem`; retain the same Ability and notation declarations and an empty view schema. | Current two-direction task, fixed by the leaf view. |
| Existing `measure-conversion-derivation` | Accept `GenericUnitScaleRelationProblem` or `UnitEquivalenceSequenceProblem`; retain current declarations. | Preserve both `measurement-unit-scale` and standard-unit derivation paths. |
| Existing `measure-conversion-table` | Accept only `UnitEquivalenceSequenceProblem`; retain `Formalization`, `ConversionTable` and notation declarations. | Preserve the current table task. |

Keep all unit-pair label bundles and scale factors, including volume context on liter/milliliter.
Number kind belongs to each producer; notation and Ability stay view-owned. The sequence
producer's invariant must not also appear in its schema. The numeric producer's two number
kinds stay schema-owned. Check ownership against every compatible consumer, including the
unchanged generic-unit-scale producer.

Define the concrete object types and `ViewTypeMap` contracts before independent role work
([IMPL-8](../implementation-general.md#impl-8--establish-the-shared-problem-contract-before-parallel-role-implementation)).
Use the types to express real payload boundaries, not labels or target IDs to discriminate
between producer implementation branches. Both models remain Ability-neutral under
[IMPL-G8](../implementation-generator.md#impl-g8--payloads-are-ability-neutral-mathematical-models):
retain exact equalities and sequence witnesses, but put conversion direction, blanks, prompts
and requested responses in the views. Reuse the unit-factor definitions, exact arithmetic,
formatters and React components. Remove the old optional-field task dispatch when its consumers
have migrated; do not retain a compatibility adapter or duplicate production modules.

### Matching migration review

The baseline is the current working-tree catalog on `codex/label-dependency-audit`, after
`b485b36b` and including the already present ontology-adoption work. It has **1,013 normalized
targets, all covered; 1,195 target/generator/view tuples; and 1,263 admitted selections**.
The affected `measurement-conversion` family has **35 targets, tuples and selections**.
The additional generic `measurement-unit-scale` / derivation path must also survive.

| Existing route / resolved profile | Required successor | Existing selections |
|---|---|---:|
| `measurement-conversion` / execution / `legacy` | Unit-equivalence generator / to-smaller view, same unit pair | 7 |
| `measurement-conversion` / execution / `integer` | Conversion-values generator / bidirectional view / `integer`, same unit pair | 7 |
| `measurement-conversion` / execution / `decimal` | Conversion-values generator / bidirectional view / `decimal`, same unit pair | 7 |
| `measurement-conversion` / derivation / `legacy` | Unit-equivalence generator / existing derivation, same unit pair | 7 |
| `measurement-conversion` / table / `legacy` | Unit-equivalence generator / existing table, same unit pair | 7 |

The review uses the actual catalog loader, nominal payload-type parser, matcher and admitted
selection planner with prospective descriptors and a scratch type fixture. It leaves production
types, specs and targets unchanged. Its counts establish feasibility of matching the proposed
contracts; they do not establish implemented generation or render correctness. Re-run the
same comparison against the real modules after implementation.

The completed in-memory comparison gives:

| Measure | Current catalog | Proposed catalog |
|---|---:|---:|
| Covered normalized targets | 1,013 | 1,013 |
| Target/generator/view tuples | 1,195 | 1,209 |
| Admitted selections | 1,263 | 1,284 |
| Targets served by the conversion family | 35 | 35 |
| Conversion-family tuples | 35 | 49 |
| Conversion-family selections | 35 | 56 |

There are **zero lost targets**, all **35** old selections have the designated successor,
and unaffected tuple keys are unchanged, including the generic derivation path. The proposed
type graph admits only the intended producer/consumer combinations. The 56 local selections
have **zero non-range missing requirements, conflicts or prospective ownership violations**.
This is declaration/configuration evidence for the proposed descriptors, not an implemented
source closure or verification of rendered evidence.

The **14 additional tuples / 21 additional selections** are fully accounted for:

| Existing target family | Additional path | Tuples | Selections | Review |
|---|---|---:|---:|---|
| Seven `4.MD.A.1-convert-larger-to-smaller` targets | Conversion-values / bidirectional, integer and decimal alternatives | 7 | 14 | Their conjunction requests the unit-pair relation and `ProcedureExecution`, with no number-kind or direction restriction. Both alternatives cover those claims. The original one-way path remains. |
| Seven integer `5.MD.A.1-convert-within-system` targets | Unit-equivalences / to-smaller | 7 | 7 | The new integer invariant supplies the requested kind; unit-pair and Ability claims are preserved. The original bidirectional integer path remains. |

Target IDs describe their provenance; they do not add unexpressed matching constraints.
Accept the additional paths under the current conjunctions, subject to implementation and
render checks. If an actual task-evidence defect is found, isolate it as a decision rather
than editing targets or inventing a routing restriction to make counts match.

Local review evidence is in `temp/measurement-split-plan/matching-review.json` (SHA-256
`a3d8b79aaa8b2c3a5f7fe958348427a4eecdebc540a7f9fac9042d9bf646572f`), with
`matching-review.ts` and the scratch nominal-type fixture. This section preserves the durable
result and exact proposed transformation; scratch files are not production implementation.
Regenerate the review from the then-current catalog before implementation, as the working
tree includes independent ongoing changes.

For that comparison, require set inclusion of all previously covered target IDs, not equality
of old module tuples. Check the successor table by target, unit pair, profile and learner task;
report retired IDs, mapped successors and additional routes separately. Additional routes
must cover the complete target conjunction, admit valid configurations and expose the claimed
evidence in both modes. Do not introduce grade gates, target-ID routing, arbitrary number-kind
exclusions or extra participation requirements simply to preserve historical match counts.
Inspect broad targets explicitly: the two execution leaves have the same Ability, so both may
provide legitimate paths without a new task-routing label.

### Behavior, identity and backlog accounting

Preserve the sequence family: start uniformly from integers 2 through 9, retain five successive
larger values, and multiply by the unchanged pair factor. Preserve the numeric family: choose
two distinct larger values from the existing eight whole-number candidates or 75 fractional
candidates, and retain exact hundredths arithmetic. Test every unit pair and both numeric
profiles. A decimal conversion can have an integral smaller-unit result; it must still expose
the nonintegral larger-unit value where the decimal claim applies.
Keep validators specific to their contracts: a sequence can reach larger value 13, so the
numeric-equality formatter's display bound must not accidentally truncate its supported cases.

Preserve each family's supported cases and draw probabilities. A new numeric producer need
not generate and discard the old unused integer sequence or consume a dummy random draw.
New IDs already change seeds; old-to-new PRNG continuation and byte-identical generated images
are not promised. Keep existing task components, wording, answer placement and formatting;
use matched payload fixtures to verify rendering separately from new sample identities.
Additional routes and alternatives can also change per-target allocation and the dataset's
overall task distribution. Quantify those changes in the migration report rather than claim
that global sampling remains unchanged.

Do not rename old replay receipts or relabel old rows as though new modules generated them.
Bind new IDs, sources and contracts through the existing artifact/cache identity mechanisms;
verify deterministic replay within each new identity. Keep the current immutable dataset until
a successful pipeline-generated successor is accepted.

The expected repair concerns the **21 original number-kind omissions** on legacy executions,
derivations and tables. They become ordinary, matching-capable `IntegerNumbers` declarations.
Map their findings to the successors and validate actual resolved labels before crediting
closure. A deleted module ID is not itself a repaired finding. Additional matches can create
additional selections and obligations, so do not assume a final total of `385 - 21` merely
from the declaration change. Report original requirements repaired, carried-forward gaps,
newly admitted obligations and the new effective total separately. Keep the historical RB-M1
counterfactual below as history; this proposal replaces its unresolved legacy-profile approach.

### Approved implementation checkpoints

1. **Establish contracts and shared helpers.** Capture the fresh complete catalog, target
   hashes, admitted configurations, affected rendering fixtures and existing dirty paths.
   Add the two concrete problem types; extract pure shared
   math/render helpers without changing active behavior. Check types and existing tests before
   independent producer/view work. A temporary old type may remain solely for still-active
   modules during this checkpoint; it is removed in the migration checkpoint.
2. **Migrate the complete producer/consumer family.** Add and typecheck the new view-map
   contracts before role work diverges. Introduce the two generators and two
   execution leaves, narrow derivation/table types, apply ordinary number-kind declarations,
   and retire the old generator/execution view and optional payload branch together. Preserve
   the generic-unit-scale derivation route. Include generator/spec tests and both leaf
   checklists. Commit only after integrated types, ownership, matching and focused behavioral
   checks pass; a partially disconnected family is not a checkpoint.
3. **Verify migration and reconcile the backlog.** Run the full matching/configuration
   comparison, review every additional path, verify rendering and replay, and run the fresh
   source dependency audit. Update this plan and the progress ledger with measured closures,
   introduced requirements, remaining counts and evidence. Resolve migration regressions before
   the checkpoint commit. This is not authorization for unrelated structural changes.

Validation must include:

- Unchanged target source hashes and normalized conjunctions; zero lost covered targets;
  successors for all 35 old family selections; retention of the generic producer's consumers.
- Exhaustive review of the seven sequence configurations and fourteen numeric configurations,
  plus every newly admitted selection. Finite candidate domains support exact arithmetic and
  positive/nonzero proofs; sampled images alone cannot establish universal label claims.
- Generator and spec tests for invalid/missing configuration, all unit pairs, whole/decimal
  boundaries, distinct equality values, label ownership and deterministic generation. View
  tests and question/solution fixtures cover all four consumers and the generic derivation
  member. Re-run `npm run check:types`, `npm run check:generator-view-specs`,
  `npm run check:labels`, `npm run check:docs`, and `npm run test:coverage`.
- The unchanged annotation evaluator and strict gate, including the complete Area allowlist:
  a nonempty Area set whose every member is within Arithmetic, IntuitiveMathematics or
  FormalMathematics. Preserve the integer-only digit qualification. Do not broaden graph
  obligations or add range-policy/representation-completeness work to make this split pass.
- Actual resolved annotations and complete source-audit reconciliation. Canonical regeneration,
  authoritative graph rebuild and VQA remain at the agreed source-readiness checkpoint; preview
  fixtures and a successful matching review do not establish final dataset acceptance.

The user confirmed this two-producer/two-execution-leaf boundary, ordinary matching-capable
number-kind declarations and the reviewed migration consequences. New splits elsewhere
require their own justification and confirmation.

Planning verification: independent contract and migration reviews completed;
`npm run check:docs` passed with five unavailable external-document fetch warnings, and
`git diff --check` passed. Only this plan changes in the documentation checkpoint.

### Split checkpoint 1 — contract foundation

Add the concrete sequence and numeric-values types before changing active consumers.
Extract the existing samplers into category helpers and the
table renderer into a pure shared component. The existing generator still draws its sequence
before numeric examples, preserving this checkpoint's configurations, payloads and random
continuation. Existing target declarations and active matching capabilities are unchanged.
The new producer/view paths become active together in checkpoint 2.
The prospective view mappings typechecked during contract preparation, but the catalog validator
correctly rejects entries without discovered leaves. Keep them out of the foundation commit;
add and typecheck them again at the start of checkpoint 2 before parallel role implementation.

The immutable baseline records all seven target source hashes and the current dirty paths.
The foundation preserves all 1,013 covered targets, 1,195 tuples and 1,263 admitted selections.
All 88 payload/PRNG probes and 288 exact rendered-markup fixtures match the baseline. A further
384 conversion-story probes preserve configuration, labels, payloads and random continuation.
Shared-builder tests exhaust all 56 sequence outcomes and 39,242 ordered numeric outcomes
across the seven pairs; helper and old-generator coverage is 100%. Local evidence is under
`temp/measurement-split-implementation/`.

Checkpoint validation passes types, spec ownership, documentation and independent review.
Full coverage passes **849 suites / 6,692 tests**, including every generator coverage threshold.
The coverage workflow used four workers after a sandbox transform-cache failure and a
default-worker timeout; no validation was disabled.

## Agreed direction: conditional notation dependencies

**Implemented on 2026-10-28.** The graph narrows the overly broad numeral/base dependencies.
Completeness of representation labels remains a separate design question. This supersedes
the earlier proposal to require `NumberRepresentation`
whenever a numeric context is declared; that replacement obligation was not adopted.

The graph changes; the pure evaluator and shared strict-gate semantics remain unchanged.
The before/after audit retires **38 requirements**, reducing source findings from **429 to 391**.
This is policy reclassification, with **zero label repairs and zero new distinct gaps**.

The necessary-evidence re-review closes 23 findings without changing policy: thirteen explicit
or necessarily required zero values and ten digital-construction numeral/base requirements.
The visible request to build a digital time establishes its required notation even with blank
digit slots. This follows the installed ontology's content-evidence rule; it does not require
copying labels from a solution into its question. The
[checkpoint](label-dependency-progress.md#necessary-mathematical-and-notation-evidence-re-review)
records source proof and preservation.

The remaining notation problem cannot be solved by adding Arabic numerals everywhere:

| Scope before narrowing | Requirements retired | Evidence and remaining work |
|---|---:|---|
| Object-only conservation, comparison, matching and sorting | 20 | Ten selections display object quantities without written count symbols or positional places. Numerals and Base10 are not justified. |
| Analog-clock reading | 10 | Five questions show an unnumbered dial and a generic response field. They do not require the Arabic-digit response used in the solution. |
| Rounding-reasoning view | 8 | Numeral evidence is present, but declaring it admits an unsafe new target match: 23+32+45=100 can produce a proposed answer200. The existing rendering guarantee still needs its separate decision; retiring the requirement does not fix it. |

Number kind, numeral system and positional base answer different questions. Integers or
fractions can be involved without written numerals. Numeral systems describe conventional
written representations; not every such system has positional place values. The existence
of quantities therefore does not by itself require either a numeral-system label or a base.

The implemented rules:

1. Remove the blanket `numeralSystem` and `base` assessments from `LD-NUM-01`, retaining its
   other assessments and existing trigger. Do not replace them with a blanket representation
   assessment.
2. Require a base when positive declared evidence establishes positional representation or
   place value, using the reviewed selectors below. Keep the existing decimal-to-base obligation.
3. Keep numeral-omission detection separate. No mandatory numeral-system assessment is added.
   Any future dependency needs an independently declared fact that necessarily establishes
   numeral usage; a rule triggered solely by a numeral label cannot detect that label's absence.

The graph uses existing evaluator mechanisms:

```ts
// Keep LD-NUM-01's existing trigger. Replace only its assessed groups:
assess: ['numberKind', 'range', 'sign', 'zero']

positionalRepresentation: {labels: [
    Scope.RodNumerals, Scope.BaseTenBlocks, Scope.ScientificExponentNotation
]}

// Keep LD-DECIMAL-01; add the other proven positional dependencies:
{id: 'LD-POSITIONAL-01', when: {any: [
    {family: 'positionalRepresentation'},
    {areaWithin: Area.PlaceValue},
    {areaWithin: Area.DecimalNotation}
]}, assess: ['base']}
```

The pinned ontology `0.31.0-pre.58.9231304124e9` defines rod numerals through place values,
base-ten blocks through successive place units, and scientific exponent notation through
scaled powers of ten. `PlaceValue` and `DecimalNotation` Areas independently establish
positional usage. The existing `DecimalNumbers` family rule includes its precision descendants.

`ArabicNumerals` describes the digit symbols 0–9, so it alone does not establish positional
usage. Its `translates Base10` relation is not an implication; Roman numerals also have that
relation. Arabic digits with an independent positional declaration acquire the base requirement
through that declaration. Generic physical/visual/spatial representations, Roman numerals,
an abacus or an analog clock alone do not establish positional place values. Any eligible
numeric-base label satisfies the existing presence facet; this checkpoint adds no value
inference, default Base10 label, or base-specific conflict policy.

Number-kind, sign, zero, fraction and operand obligations retain their own conditions. Preserve
the complete Area allowlist, integer-only digit qualification and range-policy exclusion.
No adapters, automatic completion, payload classification or per-view exceptions are introduced.

### Separate question: representation completeness

How to detect every applicable but undeclared representation remains open. A mixed task can
contain both objects and written numerals. `PhysicalNumbers` does not say that numerals are
absent, and an absent numeral label supplies no evidence that no numerals occur. Requiring
one `NumberRepresentation` family member would not establish that all coexisting
representations were annotated, so it is not adopted as a general solution.

Future work may identify independent positive triggers that establish a particular
representation, or establish a justified applicability contract. It must distinguish number
kind from written notation, review both pure and mixed cases, and avoid relying on hidden
metadata. Source review can investigate omissions; VQA of supplied labels must not be claimed
to exhaustively find undeclared ones. No ontology additions or new representation requirement
are authorized by this plan refinement.

The previous `NumberRepresentation` proposal's read-only simulation, **429 → 406** source
gaps and **4,012 → 3,212** distinct stored gaps, is superseded. It remains historical scratch
evidence in `temp/label-dependency-decisions/representation-counterfactual.json`, not a forecast
for this narrower direction. Do not reuse those counts or count removed obligations as
additive label repairs. The known reasoning-view rendering defect remains open even if a
dependency rule no longer reports its numeral omission.

### Implementation and validation checkpoint

Regression coverage includes object-only, mixed, Roman, Arabic-only, decimal, rod, block and
scientific-notation contexts, both positional Areas, missing bases, absent numeral labels,
and unchanged Area/integer/range boundaries. Integration and orchestration fixtures use
independent positional evidence for missing-base failures. The evaluator still reads only
annotations and ontology membership and never adds labels.

The fresh audit is bound to policy
`de3acb553955484a3f8452b6fb149a079777ba3985f042a113fd23a402a50d1c`:

| Measurement | Before | After |
|---|---:|---:|
| Source distinct / raw non-range findings | 429 / 429 | 391 / 391 |
| Source selections with findings | 329 | 311 |
| Stored distinct / raw non-range findings | 4,012 / 4,146 | 2,528 / 2,542 |
| Stored samples with findings | 1,332 | 1,282 |

All 1,263 selections (848 eligible), 1,195 matched tuples and 2,808 stored samples (1,884
eligible) are unchanged. All 4,071 subjects retain their annotations, resolved Areas,
configuration/plan identity and provenance. Other facet assessments, conflicts and context
results are identical. Source retirement is 23 numeral-system and 15 base requirements;
stored retirement is 830 numeral-system and 654 base requirements, counted distinctly.
Neither count is a label repair. There are no new distinct findings, conflicts, invalid
contexts, incomplete enumerations or contract errors. Raw counts also change when a
duplicate rule assessment disappears; they are not a measure of separate repaired labels.

Exact accounting, ownership and preservation evidence is under
`temp/label-dependency-narrowing/`; the durable checkpoint and validation results are in the
[progress ledger](label-dependency-progress.md). Full regeneration still waits for the agreed
source readiness conditions, including resolution or explicit user-approved disposition of the known
reasoning-view content defect. Representation completeness remains separate. This checkpoint
does not approve reasoning rendering changes, clock-mode architecture, zero ownership redesign
or new mathematical sampling profiles.

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
- a nonempty set of declared number-kind labels, all structurally within `Scope.IntegerNumbers`
  after excluding the `Scope.DecimalNumbers` representation branch from this qualification;
- an operand-count or actual operand-digit descriptor.

This is a positive integer-context check. Fractional, decimal-only, other mixed, and
missing-number-kind annotations do not trigger a digit requirement. A missing number kind
still produces the existing numeric dependency finding; it is not inferred from an Area or
payload. Integer annotations outside the two arithmetic branches likewise do not trigger
operand-digit enforcement. Operand-count, numeric, fraction, decimal and conflict checks
keep their own existing triggers.

`DecimalNumbers` describes base-ten representation, including whole-number notation. An
explicit integer claim therefore retains the digit obligation alongside that representation.
Ignoring decimal representation for this qualification never establishes an integer claim;
the remaining selected number-kind family must be nonempty and entirely integer.

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
        positionalRepresentation: {labels: [
            Scope.RodNumerals, Scope.BaseTenBlocks, Scope.ScientificExponentNotation
        ]},
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
            assess: ['numberKind', 'range', 'sign', 'zero']},
        {id: 'LD-POSITIONAL-01', when: {any: [
            {family: 'positionalRepresentation'},
            {areaWithin: Area.PlaceValue},
            {areaWithin: Area.DecimalNotation}
        ]}, assess: ['base']},
        {id: 'LD-OPERANDS-01', when: {any: [{family: 'operandCount'}, {family: 'operandDigits'}]},
            assess: ['operandCount']},
        {id: 'LD-OPERANDS-02', when: {all: [
            {any: [{areaWithin: Area.ArithmeticOperations}, {areaWithin: Area.IntegerArithmetic}]},
            {familyWithin: {family: 'numberKind', root: Scope.IntegerNumbers, ignore: [Scope.DecimalNumbers]}},
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
root. Its optional `ignore` list excludes members under explicitly named structural roots
only from this qualification. It cannot succeed vacuously when the family is absent or
every member is ignored. The ignored labels remain annotations and participate in all
other facet checks. These selectors use only annotations and ontology relations.

The six obligations are:

| Rule | Annotation trigger | Required groups |
|---|---|---|
| `LD-NUM-01` | Numeric Scope, numeral system, operand count, or operand digits | Number kind, sign, zero, plus report-only range presence |
| `LD-POSITIONAL-01` | Rod numerals, base-ten blocks, scientific exponent notation, or an Area within Place Value / Decimal Notation | Numeric base |
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

## Scope-cleanup audit baseline (2026-10-27)

This section records the scope-cleanup checkpoint, not the current repair inventory.
Use the [refreshed backlog](#consolidated-declaration-backlog-2026-10-28) for present totals.
The immutable snapshot at that checkpoint is
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

Status: refreshed on 2026-10-28 after C2b (`62ff0736`). M2, M2b, M3, M4, C1 and C2
are implemented; the current audit replaces the former pre-M2 inventory below. Earlier
verification sections retain their historical counts and policies. Algebra, parity and
legacy conversion decisions remain open.
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

1. Review the algebra, parity and legacy conversion decisions early, in parallel with the
   next supported declaration batches. Prioritize shared, proven omissions rather than the alphabetical
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
   full canonical run. Known content defects also require resolution or explicit user-approved disposition;
   retiring a dependency does not repair them. This is a project work criterion, not a change to the report-only
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

### Autonomous execution agreement (2026-10-28)

The user approved autonomous processing of repairs that are provable within the agreed
constraints. Technical difficulty alone is not a reason to defer a repair. Routine evidence
review, declaration edits, validation and checkpoint commits do not need individual user
approval. Execution started with RB-A3. The
[progress and decision ledger](label-dependency-progress.md) records the baseline, verified
closures, newly admitted obligations, deferred child scopes and the next queued batch.

The authorization covers truthful additive invariants and labels on existing choices whose
resolved values and behavior remain unchanged. Preserve target conjunctions and existing
coverage, rendering, supported configurations, sampling and random continuation. Review all
consumers of a shared declaration and both question and solution evidence. Preserve the
complete Area allowlist and the current integer-only digit qualification, including C2b's
decimal-representation treatment. Range-policy work remains excluded. Do not add adapters,
automatic completion, payload classification or weaker validation rules.

The separately approved conditional-notation checkpoint narrows blanket numeral/base
requirements as documented above. This specific authorization does not extend to other
policy changes; representation completeness remains a separate design question.

A repair requiring a new semantic interpretation, ontology or evaluator change, mathematical
schema distinction, or sampling/rendering change belongs in a decision batch. Previous
specific approvals, such as M4 and C2b, do not authorize new changes of the same kind.
Record concrete counterexamples, the affected projections and labels, options, a recommendation
and its consequences before requesting that decision. Missing evidence is not permission to
choose a convenient label. Continue independent provable work while a decision remains open.

Generator/view splits are a rare option when a coherent mathematical contract or learner-task
boundary warrants them. Prepare a migration review and obtain explicit user confirmation
before implementation; the [measurement split proposal](#proposed-measurement-generatorview-split-2026-10-29)
records the current case. Additional valid matches are acceptable. Preserve previously covered
targets and document successor paths; do not equate retired module tuples with lost coverage.

For each implementation checkpoint:

1. Capture the current audit, matching/configuration baseline and touched-file state. Reconcile
   intervening changes before editing; preserve unrelated work and stage only owned paths or
   hunks. Review the full declaration ownership and impact scope, including currently gap-free
   consumers and requirements that an added label activates.
2. Establish the invariant or existing-choice proof, implement the additive repair, and run the
   working-checkpoint checks above. A separate agent reviews the evidence, diff and validation
   results before the checkpoint commit. Resolve actionable review findings before committing.
3. Reconcile before/after selections using target, generator, view and preserved mathematical
   configuration lineage. Label additions can change selection/variant hashes without changing
   exercises; hash churn alone is neither a closed gap nor a new one. Retain explicit mappings
   for ambiguous identities and inspect genuinely new matches.
4. Update the ledger with raw and distinct findings, selections still affected, verified gaps
   closed, newly introduced or reopened gaps, exact deferred subsets, evidence and review results.
   Commit the coherent change and verification note on `codex/label-dependency-audit`.

Split an unresolved subset into a named child, for example `RB-A3-D1`, only after identifying
its actual selection/facet scope. Transfer ownership without counting the same gap in both
parent and child or reporting a transfer as closure. Track an open decision topic separately
from gaps assigned to it; the initial three known topics have not yet been fully triaged.
If all remaining work needs decisions, present the consolidated decision queue to the user.

Readiness to start autonomous repairs is distinct from dataset readiness. Deferred gaps remain
part of the outstanding total. **All source gaps, including deferred gaps and newly activated
requirements, must be resolved** before RB-V1; structural/contract errors and incomplete
enumerations must also be zero. Known content defects, including RB-A3-D3, retain their own
resolution or explicit user-approved disposition requirement even after their dependency findings disappear.
The existing full regeneration and selective Gemini VQA
authorization then applies to RB-V1/RB-V2. No regeneration or VQA runs during this preparation.

The reproducible audit command for the historical preparation checkpoint was:

```bash
npm run audit:label-dependencies -- --spec=ccss --output-dir=temp/label-backlog-refresh/audit
```

Its policy hash was `01584d603f3c0b48a0c882f3a0350acc7b0dc511553560e50c390ed52b41122c`;
the implemented narrowing above records the current hash.
The stored generation is `cada54596eb7b8fd3dc3dd293c5576d9ec8d6fa0f952134a356e1b462058f4c2`.
The committed inventory below is the durable checkpoint; local `backlog.json` and
`build-backlog.mjs` under `temp/label-backlog-refresh/` retain pair-level detail and
aggregation checks. They are verification artifacts, not runtime dependencies.

### Consolidated declaration backlog (2026-10-28)

The inventory and roadmap below preserve the execution baseline at `d0beb699`. See the
[progress ledger](label-dependency-progress.md) for subsequent closures, new requirements,
split ownership and current counts.

The fresh post-C2b audit enumerates **1,232 admitted selections**, including **817 eligible selections**.
**538 selections across 79 generators and 169 generator/view pairs** still have non-range omissions.
They contain **1,307 distinct selection/facet gaps** and **1,325 raw rule/facet findings**; the extra
18 findings are repeated base checks. No conflicts, invalid contexts, incomplete enumerations or
row/label-contract errors are present. These are missing annotation groups, not 1,307 independent
code edits or proof that a particular label can be added.

At this historical baseline, the stored snapshot has **4,146 raw / 4,012 distinct sample/facet findings across 1,332 samples**.
That is a separate snapshot of the same repair effort, not an additional source backlog to add to
1,307. The implemented conditional-notation checkpoint above gives its current policy counts.
Source declarations and stored rows are reconciled at the final regeneration checkpoints.

| Workstream | Generators | Pairs | Selections with gaps | Distinct gaps | Raw findings |
|---|---:|---:|---:|---:|---:|
| D — Algebra and numerical expressions | 3 | 9 | 25 | 100 | 100 |
| M — Measurement conversion, time and units | 7 | 12 | 51 | 176 | 183 |
| A — Arithmetic and counting | 36 | 75 | 290 | 419 | 419 |
| F — Fractions, decimals, rationals and ratios | 33 | 73 | 172 | 612 | 623 |
| **Total** | **79** | **169** | **538** | **1,307** | **1,325** |

| Missing facet | Distinct selection/facet gaps | Raw findings |
|---|---:|---:|
| numberKind | 75 | 75 |
| numeralSystem | 250 | 250 |
| base | 234 | 252 |
| sign | 148 | 148 |
| zero | 366 | 366 |
| operandCount | 13 | 13 |
| operandDigits | 186 | 186 |
| fractionMagnitude | 35 | 35 |

### Remaining batch roadmap

**Baseline: 26 source-repair batches, followed by two dataset acceptance batches = 28 planned batches.**
A source batch is one coherent review, repair and acceptance scope; it can contain several commits.
It is not one label, one generator, one image, or a guarantee that declarations alone are sufficient.
The 26 scopes below assign every current missing selection/facet to exactly one owner. Batches
cover all current findings, but a completed batch must also resolve any new obligations it activates
or explicitly create a follow-up batch before the source-readiness gate can pass.

**Working planning allowance: 28–38 total batches.** The additional ten are a contingency of up to
one split each for RB-A1, RB-A2, RB-A6, RB-A9, RB-F2, RB-F3, RB-F4, RB-F9, RB-M1 and RB-D1.
Their width, zero, shared-consumer or visible/domain distinctions may separate a model decision
from declaration work. This is an allowance based on the identified risks, not a statistical estimate
or a hard upper bound. Clock, parity or another source review can reveal further work; a shared
declaration can also close gaps in several scopes and reduce the eventual number of batches.

| Workstream | Planned source batches | Current distinct gaps |
|---|---:|---:|
| Arithmetic and counting | 10 | 419 |
| Fractions, decimals, rationals and ratios | 10 | 612 |
| Measurement conversion, time and units | 4 | 176 |
| Algebra and numerical expressions | 2 | 100 |
| **Source total** | **26** | **1,307** |
| Canonical dataset refresh and VQA/strict acceptance | **2** | Reconciles stored annotations |
| **Baseline total** | **28** | |

All source batches start with evidence/ownership review. The counts below are assigned backlog,
not promised closure counts. Known decisions are part of their owning batch, not separately
double-counted: algebra A1/A2 belongs to RB-D1, parity P1 to RB-A7, and legacy conversion to RB-M1.
Other batches can still require a decision if an invariant or existing choice cannot express the fact.

| Batch | Review and repair scope | Distinct gaps | Main uncertainty to resolve |
|---|---|---:|---|
| RB-A1 | Binary arithmetic operand widths | 118 | 118 selections span eleven projections. Width variation may need separately agreed pre-draw choices and multiple operation checkpoints; do not infer widths from sampled payloads. |
| RB-A2 | Binary arithmetic zero participation | 28 | Whole-task zero occurrence depends on projection and optional zero support. Review guarantees before adding absence or introducing explicit cases. |
| RB-A3 | Elementary numeral/base and number-view declarations | 64 | Most findings concern notation/base; writing also has zero omissions. Review each view owner, mode and plain-language/numeral projection; do not assume every representation is Arabic/Base10. |
| RB-A4 | Three- and four-operand arithmetic | 24 | Coordinate width and zero guarantees across forward and inversion projections. Variable profiles may split the implementation into operation checkpoints. |
| RB-A5 | Arithmetic strategies and property relations | 38 | Mainly operand widths; property relations also need zero classification across nested/transformed expressions. Shared helpers may help, but separate producers still require proof. |
| RB-A6 | Patterns, estimation and equation-zero contexts | 36 | Mostly zero, with paired-pattern number-kind/base/sign gaps. Review visible sequence values, permitted values and nested relations; further pre-draw cases may be necessary. |
| RB-A7 | Parity grouping and zero classification | 2 | Agree pre-draw even, singleton-odd and larger-odd grouping cases. Preserve all counts/targets; no inherited zero absence or post-draw completion. Producer boundary may need a dedicated model. |
| RB-A8 | Counting offsets, equal groups and arrays | 16 | Operand counts and number kinds need support from the entire requested operation/model. Adding integer kinds can activate new digit obligations; include those in this batch review. |
| RB-A9 | Place-value, rounding and powers-of-ten contexts | 71 | Notation plus sign/zero/width vary across place-value and rounding projections. Review representation of zero, regrouping and displayed intermediate values; split if these need different models. |
| RB-A10 | Written algorithms and division models | 22 | Mainly operand count and zero, plus integer addition/subtraction widths. Review long-form algorithm steps and remainders without imposing digits on decimal-only contexts. |
| RB-D1 | Symbolic and substituted algebra expressions | 56 | Base10 is a documented candidate for 14 gaps; the remaining 42 need per-projection kind/sign/zero reasoning. No blanket generator invariant. |
| RB-D2 | Numerical expressions and powers | 44 | Same four missing facets across six views make one coherent expression review, but current gaps do not prove invariant number-kind/sign/zero values. |
| RB-F1 | Decimal notation, comparison and transcription | 35 | Projection and mode review required: numeral-name tasks and fraction transcription cannot inherit one blanket notation or magnitude claim. |
| RB-F2 | Decimal operations and place-value zero participation | 14 | A zero digit is not necessarily a numerical zero. Zero results, displayed intermediates and equality cases must be checked; varying claims may need an agreed mathematical choice. |
| RB-F3 | Fraction arithmetic and benchmark estimation | 133 | Proper/improper magnitude and zero-result behavior may vary by existing operation/profile; do not infer a magnitude label from the missing group. |
| RB-F4 | Fraction division and quotient projections | 177 | Highest shared-consumer risk: a common view declaration affects both producers and can activate new obligations. Separate checkpoints may be needed for invariant notation and mathematical kind/magnitude/zero choices. |
| RB-F5 | Fraction equivalence and whole/tenths projections | 49 | Whole equivalents and line origins may change observable zero/magnitude participation; inspect all consumers before declaring invariants. |
| RB-F6 | Fraction comparison and number-line placement | 40 | Line origins and comparison benchmarks are part of the visible task; their participation must be distinguished from the sampled fractions alone. |
| RB-F7 | Fraction products and scaling | 40 | Magnitude can differ between input fractions and products; varying truthful values require existing-choice annotation or a separately agreed model distinction. |
| RB-F8 | Rational number-line value representations | 40 | Representation alternatives and visible line zero must be assessed independently; the currently missing fraction magnitude is not automatically proper. |
| RB-F9 | Signed rational contexts, order, magnitude and opposites | 54 | Different requested tasks expose different quantities; sign/zero declarations cannot be inherited from hidden payload values. Split contextual and line/magnitude repairs if their evidence contracts diverge. |
| RB-F10 | Ratios, rates and percentages | 30 | Positive sampled quantities alone do not prove absence of zero in every table, prompt and solution; check all projections before adding the zero declaration. |
| RB-M1 | Legacy conversion profiles and shared consumers | 84 | Known historical counterfactual closes 84 old assessments but opens 17 new ones; this is a joint profile/ownership repair, not a safe blanket label addition. |
| RB-M2 | Clock reading and construction | 46 | Four views expose different clock evidence; number-kind, sign and zero guarantees must hold across each supported projection. |
| RB-M3 | Elapsed time and interval arithmetic | 24 | Positive duration alone does not establish absence of every displayed zero. |
| RB-M4 | Length measurement and unit relations | 22 | Small remaining clusters share measurement/unit context but must retain their distinct declaration owners. |
| **Total** | | **1,307** | |

#### Execution order and exit conditions

1. Begin the lower-dependency declaration reviews with **RB-A3**, then **RB-F1, RB-F6 and RB-F10**.
   Together these own 169 current distinct gaps. They are candidates for early work, not pre-approved
   label values; their zero or representation edge cases still need evidence.
2. Review **RB-D1, RB-A7 and RB-M1** early alongside routine work, using the existing decision notes.
   Preserve every target and existing supported case. Agree any mathematical/schema, sampling or
   other semantic change before implementing it; never classify sampled payloads to fill labels.
3. Process the remaining scopes by shared producers/consumers, re-auditing after each batch. Assign
   newly activated findings to the owning batch and update remaining counts. RB-M1 must also inspect
   `measurement-unit-scale` and currently gap-free conversion derivation consumers; their absence
   from the current 79-generator inventory does not exempt them from impact review.
4. **RB-V1 — Source readiness and canonical refresh:** require zero non-range source omissions,
   conflicts, invalid contexts and incomplete enumerations; run the already-authorized affected
   canonical regeneration with authoritative graph rebuild. Check coverage, images, splits and churn.
5. **RB-V2 — VQA and stored acceptance:** refresh only necessary VQA results, reuse exact passing
   cache entries and pass strict stored annotation, image and coverage checks. Fix any newly exposed
   defects and repeat affected validation. Merely scheduling V1/V2 is not proof that they will pass.

The agreed Area allowlist and range-policy exclusion remain fixed. No adapter, automatic completion,
new target requirement or gate weakening is authorized by this roadmap. Upstream digit-group and
arithmetic-hierarchy corrections remain a parallel follow-up under the documented local safeguards;
they are not counted as extra source-repair batches unless a particular ambiguity blocks a repair.

#### Generator inventory and exact batch boundaries

**P** = affected pairs, **S** = selections with gaps, **G** = distinct selection/facet gaps.
Facet codes: **K** number kind, **N** numeral system, **B** base, **Sg** sign, **Z** zero,
**O** operand count, **Dg** operand digits, **F** fraction magnitude. Range is excluded.

| Generator | Batches | P | S | G | Missing facets |
|---|---|---:|---:|---:|---|
| `algebra-expressions` | RB-D1 | 3 | 14 | 56 | K, B, Sg, Z |
| `arithmetic-equation-judgment` | RB-A6 | 1 | 2 | 2 | Z |
| `arithmetic-estimation` | RB-A6 | 1 | 4 | 4 | Z |
| `arithmetic-known-fact-derivation` | RB-A5 | 2 | 9 | 9 | Dg |
| `arithmetic-numerical-expressions` | RB-D2 | 4 | 6 | 24 | K, B, Sg, Z |
| `arithmetic-operation-table` | RB-A6 | 1 | 2 | 2 | Z |
| `arithmetic-ops-four` | RB-A4 | 4 | 4 | 4 | Dg |
| `arithmetic-ops-pairs` | RB-A1, RB-A2, RB-A3 | 11 | 118 | 168 | N, Z, Dg |
| `arithmetic-ops-triples` | RB-A4 | 6 | 12 | 20 | Z, Dg |
| `arithmetic-paired-patterns` | RB-A6 | 3 | 3 | 12 | K, B, Sg, Z |
| `arithmetic-patterns` | RB-A6 | 5 | 16 | 16 | Z |
| `arithmetic-property-relations` | RB-A5 | 2 | 6 | 12 | Z, Dg |
| `arithmetic-word-problems-rounding` | RB-A3 | 1 | 8 | 8 | N |
| `comparison` | RB-A3 | 2 | 6 | 12 | N, B |
| `counting-basic` | RB-A3, RB-A7 | 2 | 4 | 6 | N, B, Z |
| `counting-classify-sort` | RB-A3 | 1 | 2 | 4 | N, B |
| `counting-hundred-offset` | RB-A8 | 1 | 2 | 2 | O |
| `counting-ten-offset` | RB-A8 | 1 | 4 | 4 | O |
| `decimal-addition-subtraction` | RB-F2 | 1 | 2 | 2 | Z |
| `decimal-comparison` | RB-F1 | 1 | 3 | 12 | N, B, Sg, Z |
| `decimal-division-model` | RB-F2 | 1 | 1 | 1 | Z |
| `decimal-multiplication-model` | RB-F2 | 1 | 1 | 1 | Z |
| `decimal-notation` | RB-F1 | 4 | 4 | 19 | N, B, Sg, Z, F |
| `decimal-place-comparison` | RB-F2 | 1 | 3 | 3 | Z |
| `decimal-place-value-expanded` | RB-F2 | 1 | 1 | 1 | Z |
| `decimal-place-value-scaling` | RB-F2 | 1 | 1 | 3 | N, Sg, Z |
| `decimal-power-ten-scaling` | RB-F2 | 1 | 2 | 2 | Z |
| `decimal-rounding` | RB-F2 | 1 | 1 | 1 | Z |
| `decimal-writing` | RB-F1 | 3 | 3 | 4 | N, Z |
| `equal-groups-collection` | RB-A8 | 1 | 3 | 3 | K |
| `fraction-arithmetic` | RB-F3 | 4 | 24 | 113 | N, B, Sg, Z, F |
| `fraction-benchmark-arithmetic` | RB-F3 | 2 | 4 | 20 | N, B, Sg, Z, F |
| `fraction-comparison` | RB-F6 | 2 | 7 | 28 | N, B, Sg, Z |
| `fraction-division-relations` | RB-F4 | 6 | 18 | 72 | K, N, B, Z |
| `fraction-equivalence` | RB-F5 | 5 | 7 | 28 | N, B, Sg, Z |
| `fraction-number-line` | RB-F6 | 1 | 3 | 12 | N, B, Sg, Z |
| `fraction-products` | RB-F7 | 3 | 4 | 20 | N, B, Sg, Z, F |
| `fraction-quotient-model` | RB-F4 | 6 | 34 | 105 | K, N, B, Sg, Z, F |
| `fraction-scaling` | RB-F7 | 2 | 5 | 20 | N, B, Sg, Z |
| `fraction-tenths-equivalence` | RB-F5 | 2 | 2 | 10 | N, B, Sg, Z, F |
| `fraction-whole-equivalence` | RB-F5 | 3 | 3 | 11 | N, B, Sg, Z |
| `integer-add-subtract-strategies` | RB-A5 | 1 | 8 | 8 | Dg |
| `integer-addition-counting-on` | RB-A5 | 2 | 4 | 4 | Dg |
| `integer-rounding` | RB-A9 | 1 | 7 | 7 | Z |
| `integer-subtraction-counting-back` | RB-A5 | 1 | 2 | 2 | Dg |
| `measurement-conversion` | RB-M1 | 2 | 21 | 84 | K, N, B, Sg, Z |
| `measurement-length` | RB-M4 | 2 | 10 | 10 | Z |
| `measurement-ratio-relations` | RB-M4 | 1 | 1 | 4 | N, B, Sg, Z |
| `multi-digit-division` | RB-A10 | 1 | 3 | 3 | Z |
| `multiplicative-comparison` | RB-A5 | 2 | 3 | 3 | Dg |
| `number-array` | RB-A8 | 3 | 7 | 7 | K |
| `numerical-power-expressions` | RB-D2 | 2 | 5 | 20 | K, B, Sg, Z |
| `percent-quantity-relations` | RB-F10 | 2 | 2 | 6 | N, B, Z |
| `place-value-arithmetic` | RB-A9 | 3 | 21 | 48 | N, Z, Dg |
| `place-value-expanded` | RB-A9 | 1 | 4 | 12 | Sg, Z, Dg |
| `place-value-scaling` | RB-A9 | 1 | 1 | 2 | N, Z |
| `powers-of-ten` | RB-A9 | 1 | 1 | 1 | Z |
| `ratio-table-comparisons` | RB-F10 | 1 | 3 | 9 | N, B, Z |
| `ratio-tables` | RB-F10 | 2 | 2 | 6 | N, B, Z |
| `rational-magnitude-contexts` | RB-F9 | 2 | 3 | 9 | N, B, Z |
| `rational-magnitude-relations` | RB-F9 | 1 | 2 | 6 | N, B, Z |
| `rational-numberline-values` | RB-F8 | 2 | 12 | 40 | N, B, Z, F |
| `rational-opposite-relations` | RB-F9 | 3 | 3 | 6 | N, B |
| `rational-order-contexts` | RB-F9 | 2 | 4 | 16 | N, B, Sg, Z |
| `rational-order-relations` | RB-F9 | 1 | 2 | 8 | N, B, Sg, Z |
| `signed-rational-contexts` | RB-F9 | 3 | 3 | 9 | N, B, Sg, Z |
| `standard-algorithm-add-subtract` | RB-A10 | 1 | 4 | 4 | Dg |
| `standard-algorithm-decimal-add-subtract` | RB-A10 | 1 | 2 | 4 | Z, O |
| `standard-algorithm-decimal-division` | RB-A10 | 1 | 1 | 2 | Z, O |
| `standard-algorithm-decimal-multiplication` | RB-A10 | 1 | 1 | 2 | Z, O |
| `standard-algorithm-division` | RB-A10 | 1 | 3 | 6 | Z, O |
| `standard-algorithm-multiplication` | RB-A10 | 1 | 1 | 1 | Z |
| `time` | RB-M2 | 4 | 11 | 46 | K, N, B, Sg, Z |
| `time-elapsed` | RB-M3 | 1 | 2 | 8 | N, B, Sg, Z |
| `time-interval-arithmetic` | RB-M3 | 1 | 4 | 16 | N, B, Sg, Z |
| `unit-dimension-relations` | RB-M4 | 1 | 2 | 8 | N, B, Sg, Z |
| `unit-rate-relations` | RB-F10 | 2 | 3 | 9 | N, B, Z |
| `whole-number-power-ten-scaling` | RB-A9 | 1 | 1 | 1 | Z |
| `writing` | RB-A3 | 6 | 11 | 14 | N, Z |
| **Total** | **26 source batches** | **169** | **538** | **1,307** | |

Only two generators have split ownership in this inventory:

- `arithmetic-ops-pairs`: RB-A1 owns operand digits (118), RB-A2 owns zero (28), and RB-A3
  owns numeral system (22).
- `counting-basic`: RB-A7 owns the parity view's two zero gaps; RB-A3 owns the conservation
  view's four numeral/base gaps.

All other generators belong wholly to the listed batch. Source-gap ownership is exclusive, but
shared views and helpers may require coordinated implementation across batches. Reuse a shared
fix rather than duplicate it, and credit every affected scope in the next audit.

`measurement-number-line`, `measurement-conversion-problems`, `measurement-word-problems` and
`currency-arithmetic` have no remaining non-range source gaps and are intentionally absent.
Legacy conversion and other measurement/time/unit families remain open. Stored-row findings
for the completed families remain until successful regeneration publishes the new annotations.

The refresh is based on source checkpoint `62ff0736`. The audit SHA-256 is
`d76c73c1e18cfbb96142fb4c066ad75bf5bb9e1f18abb16f957588d13ce16813`. `backlog.json`, `batches.json` and the builder/renderer scripts
under `temp/label-backlog-refresh/` retain the reproducible aggregation and exact partition checks.
The committed tables are the durable work inventory; these scratch artifacts are not runtime
dependencies. Earlier implementation checkpoints below retain their historical verification counts.

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

**Historical counterfactual.** The current remaining scope is 21 number-kind omissions.
The [2026-10-29 split proposal and matching review](#proposed-measurement-generatorview-split-2026-10-29)
supersedes this legacy-profile decision approach; implementation was approved on 2026-10-29.
The counts below describe the earlier declaration state, not the current 385-gap baseline.

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

### Subtraction checkpoint

The second checkpoint enables the same two largest-operand choices for integer subtraction
in all five measurement contexts. Its finite pair pool retains all 135 former pairs, with
28 in the one-digit choice and 107 in the two-digit choice. The minuend is always the
largest operand because the original sampler requires a positive answer and subtrahend.
Addition's pair pools and the remaining operation/number-kind samplers are unchanged.

All **70 family source selections now have zero non-range dependency findings**, compared
with 60 selections and ten missing operand-digit assessments before M4. Globally there are
1,232 source selections and **1,415 raw / 1,397 distinct non-range gaps**; the remaining
backlog belongs to other families. Targets remain at 1,013, semantic matches at 1,182, and
the family's 60 target assignments/sample allocations remain intact.

Compared with the addition checkpoint, exactly ten integer subtraction draws change and
the other 130 stored-origin draws retain their content and fingerprints. Against the
pre-M4 baseline, 22 additive examples change and the remaining 118 preserve payloads,
labels, semantic configurations and random states. All **7,180 final verification draws**
satisfy their selected width declarations. Each of the ten integer additive target plans
admits both widths equally. Protected target, policy, shared implementation and renderer
hashes, plus the immutable dataset pointer, are unchanged.

The five focused test files pass **230 tests** and TypeScript checking passes. Tests
exhaust every original integer additive pair in all five measurement contexts, verify
partial and explicit requests, reject contradictory width/number-kind claims, and check
both question and solution modes. Local evidence is under
`temp/measurement-width-choices/subtraction/` and `subtraction-audit/`.

Four fresh native `test:target --render` runs cover money and time for both operations.
All eight inspected images cover the two widths in both question and solution modes:
`6 + 6`, `18 + 6 = 24`, `17 + 2`, `2 + 4 = 6`, `7 - 5`, `10 - 9 = 1`, `19 - 9`
and `7 - 5 = 2`. Stories, operand cards, equations and answers remain coherent and
unclipped. Images are local target-test artifacts; these checks do not publish or refresh
the dataset, invoke VQA, or change its cache. Logs are the
`{addition,subtraction}-render-{money,time}.log` files in the same evidence directory.

The full coverage run passes **839 files / 6,345 tests**. The measurement generator and
operand-digit/operation resolver each have **100% statements, branches, functions and
lines covered**. Aggregate generator coverage is 98.47% statements, 96.98% branches,
100% functions and 99.51% lines; every checked generator meets its thresholds. Both
`test:coverage` stages ran with two workers and a 30-second test timeout. The initial
sandboxed run encountered 26 filesystem/Git permission failures; the full rerun with
normal fixture permissions passes without code changes. Evidence is in
`verified-full-coverage.txt`, `verified-full-coverage/` and `generator-coverage.txt` under
`temp/measurement-width-choices/`.

`npm run check -- --spec=ccss` passes types, generator/view specifications, labels,
documentation references, standards and split integrity. Its final annotation gate still
fails on the 4,146 existing stored findings, so the aggregate check remains non-green.
There are no annotation conflicts or incomplete enumerations. The command log is
`temp/measurement-width-choices/check.txt`.

This completes the measurement **word-problem** source-declaration backlog under the agreed scope;
the separate legacy conversion, length, time and unit families remain in the consolidated inventory. The
stored snapshot still has 4,146 non-range findings pending the agreed regeneration
and VQA readiness checkpoint. The global Area allowlist and range-policy
exclusion remain unchanged; no evidence adapter or automatic completion is present.

## C1 currency word-problem declarations (2026-10-28)

C1 adds four existing invariant capabilities to their owning declarations. It does not
change schemas, compatibility, sampling, mathematical payloads or rendering. Targets,
the complete Area allowlist and the range-policy exclusion remain unchanged. Labels are
not inferred from generated data or completed automatically.

| Checkpoint | Owner | Additions | Currency source gaps |
|---|---|---|---:|
| C1a | `currency-arithmetic` generator | `NumbersWithoutNegatives`, `NumbersWithoutZero` | 90 → 54 |
| C1b | `currency-word-problem` view | `ArabicNumerals`, `Base10` | 54 → 18 |

The generator constructs every item from positive denominations and counts. It adjusts
equal operand totals before arithmetic and orders subtraction operands from larger to
smaller, so operands and answers are strictly positive. These are mathematical invariants
owned by the generator under [SPEC-G3](../spec-generator.md#spec-g3--declare-the-area-and-scope-capabilities-the-math-produces).
The renderer's existing formatter uses Arabic base-ten numerals for item values, amounts,
story text and revealed answers. Those representation claims belong to the view under
[SPEC-11](../spec-general.md#spec-11--area-changes-task-nature-scope-changes-task-context).

The payload remains `CurrencyArithmeticProblem`: operation and item counts/denominations
are canonical mathematical data; totals and answer are calculated evidence; item kind is
semantic context. No payload field contains view projection decisions. The sole consuming
view keeps its existing contract, so no renderer adoption is needed.

The remaining 18 number-kind findings are intentionally unresolved. The same existing
configuration can display integer cents, whole dollars or decimal dollars. C1 does not
assert a blanket integer or decimal kind, introduce a new mathematical choice, or infer
one after generation. A future kind declaration must also reassess any newly activated
integer operand-digit obligations.

### C1a — Positive/nonzero quantities

This checkpoint adds only the two generator invariants. Its 18 existing source selections
retain their number-kind, numeral-system and base findings; no new dependency obligation
is introduced. The declaration is tested across all nine currency representations, both
operations, equal totals and both subtraction-order branches.

The baseline under `temp/currency-c1/before/` records all 1,013 target label sets, 1,182
matches, 18 currency assignments, 42 stored-origin draws and 432 further planned draws.
The stored-origin content and task fingerprints match the stored rows before the changes.
Protected inputs include the policy, target files, shared implementation, producer and
renderer implementations, schemas and the immutable dataset pointer. Fresh report-only
audit output is under `temp/currency-c1/before-audit/`.

C1a verification preserves every target, match, currency selection and schema. All 42
stored-origin draws and 432 further question/solution draws retain configurations, random
states, payloads and content/task fingerprints; their annotations gain exactly the two
quantity labels. The eight native rendered images are byte-identical to baseline. Policy,
shared implementation, producer/renderer implementation and snapshot hashes are unchanged.

Currency source gaps fall from **90 to 54**. Global raw non-range source gaps fall from
**1,415 to 1,379**, and distinct gaps from **1,397 to 1,361**, with no conflicts, invalid
contexts, row/contract errors or incomplete enumerations. The 18 remaining assessments
for each of number kind, numeral system and base are still reported.

The focused suite passes **55 tests across four files**; currency generator coverage is
**100% statements, branches, functions and lines**. Type checking and the generator/view
specification audit pass. Evidence is under `temp/currency-c1/generator/`,
`generator-audit/`, `generator-coverage/` and the corresponding logs.

The immutable stored snapshot remains at **4,146 non-range findings**, including 210
currency findings across 42 rows. Current plan references change with declarations, while
stored annotations and their assessments remain intact. Canonical regeneration and VQA
remain deferred to the agreed readiness checkpoint.

### C1b — Numeral and base notation

This checkpoint adds `ArabicNumerals` and `Base10` to the currency view's `generalLabels`.
The existing formatter and renderer remain unchanged: cents, whole dollars and decimal
dollars already use these representations in both question and solution modes. No number
kind is added, and the view does not take ownership of the generator's quantity invariants.

The 18 currency source selections now retain only their number-kind findings. Both
checkpoints are declaration-only and keep every existing mathematical configuration and
all supported sampling behavior intact.

C1b closes the next **36** source assessments, for **72** closed across C1. Global raw
non-range source gaps are now **1,343** and distinct gaps **1,325**. All 1,013 target
label sets, 1,182 matches and 18 currency selections remain unchanged. All 42 stored-origin
draws and 432 further planned draws retain configurations, random states, payloads and
fingerprints; annotations gain only the four intended invariant labels across C1.
No other source assessment changes and no new conflict, context/contract error or
incomplete enumeration appears.

The focused suite passes **65 tests across four files** and type checking passes.
Generator and currency-formatter coverage are **100%** in all four categories. Tests
cover the 99/100/101-cent formatting boundary, forced dollar notation, all representation
choices, both operations and both modes, while preserving the unresolved number-kind
assessments. Evidence is in `temp/currency-c1/notation-tests.txt`, `notation-types.txt`
and `notation-coverage/`.

Native rendering checks cover coins, banknotes and mixed amounts in question and solution
modes, including mixed validation examples. All **eight images are byte-identical** to
the pre-C1 baseline after both commits' source changes and pass visual inspection. These
local target-test artifacts do not update the stored dataset or VQA cache. Their manifests
are `temp/currency-c1/render-{before,generator,view}.json`; impact and fresh audit reports
are under `view/` and `view-audit/` in the same directory.

`npm run check -- --spec=ccss` passes types, generator/view specifications, labels,
documentation references, standards and split integrity. The final strict annotation
stage still reports the **4,146 existing stored findings**, including 210 currency
findings. The aggregate check therefore remains non-green until the stored snapshot is
repaired through the agreed regeneration workflow. The source-only additions do not
weaken that gate. The check log is `temp/currency-c1/check.txt`.

The complete `npm run test:coverage` command passes **840 files / 6,398 tests** and all
generator coverage thresholds. Currency generator coverage is **100%** in every category;
aggregate generator coverage is 98.49% statements, 97.05% branches, 100% functions and
99.51% lines. The run uses two workers and normal permissions for Git/filesystem fixtures.
Evidence is saved in `temp/currency-c1/full-coverage.txt` and
`full-coverage-summary.json`; final documentation references also pass.

## C2 — Currency number kinds, preserving the conversion competency

C2 retains the existing cents/dollars transitions in questions and solutions. In
particular, `$1 - 75¢`, `75¢ + 50¢ = $1.25` and `60¢ + 50¢ = $1.10` remain valid
exercises; uniform-cents rendering is not an accepted repair.

### C2a — Eight supported integer profiles

The existing denomination choice now includes equivalent bundles carrying
`IntegerNumbers` and a supported operand-width descriptor. A generator compatibility
rule correlates those bundles with the existing banknote, coin and operation choices.
Configuration fields and values, the mathematical implementation and the renderer do
not change. No target, Area policy, range policy, adapter or automatic completion is added.

| Existing profile | Selections | Added width, alongside `IntegerNumbers` |
|---|---:|---|
| Banknotes only, either operation | 2 | `SingleDigitLargestOperand` |
| Pennies only, either operation | 2 | `SingleDigitLargestOperand` |
| Nickels only, either operation | 2 | `TwoDigitLargestOperand` |
| Dimes only, subtraction | 1 | `TwoDigitLargestOperand` |
| Quarters only, subtraction | 1 | `TwoDigitSmallestOperand` |

For quarter subtraction, compare operands as monetary quantities and count digits in
the smaller operand's displayed unit. Its complete support has a smaller operand of
25, 50 or 75 cents, including the `$1 - 75¢` case. The largest-operand descriptor would
not hold across that support. Tests enumerate every initial count pair for all eight
integer selections, including equal-count adjustment and subtraction order.

The payload/ownership review is unchanged from C1: counts, denominations and operation
are mathematical data, totals and answer are calculated evidence, and item kind is
semantic context. The view retains its monetary-story learner action and all projection
logic. The added bundles follow [SPEC-G3](../spec-generator.md#spec-g3--declare-the-area-and-scope-capabilities-the-math-produces)
and [SPEC-6](../spec-general.md#spec-6--reuse-shared-resolvers-pass-them-as-references).

Preservation evidence is recorded under `temp/currency-c2/before/` and `integer/`:
all **1,013 targets, 1,182 matches and 18 currency selections** remain. All **42
stored-origin and 432 further planned draws** preserve configuration, random states,
payloads and content/task fingerprints. The annotations gain only the intended integer
and width descriptors. All 20 protected file hashes and the immutable dataset pointer
remain unchanged.

The fresh report-only audit reduces currency source findings **18 to 10**, global raw
non-range findings **1,343 to 1,335**, distinct findings **1,325 to 1,317**, and failing
source selections **556 to 548**. No new operand-digit omission, conflict, invalid context,
contract/row error or incomplete enumeration appears. The stored snapshot remains at
**4,146** global findings, including **210** currency findings; canonical regeneration
and VQA remain deferred to the agreed readiness checkpoint.

The C2a focused suite passes **80 tests across four files**, including 20 integration
tests against the real Grade 2 targets. Currency generator coverage is **100%** in all
four categories. Type checking, the generator/view specification audit and documentation
references pass. Evidence is in `temp/currency-c2/focused-coverage.log`,
`focused-coverage/`, `integer-types.log`, `integer-specs.log` and `docs.log`.

### C2b — Decimal representation and preserved integer qualification

The installed `DecimalNumbers` definition describes base-ten positional representation;
it does not assert a fractional part. Consequently it is true across the currency view,
including whole-number cents and dollars. The earlier proposal to declare it conditionally
on ten profiles overlooked the invariant/declaration boundary in
[SPEC-7](../spec-general.md#spec-7--zero-overlap-between-schema-parameter-labels-and-generallabels).
The view has no existing schema field, and adding an unused field solely to attach the
label would also conflict with SPEC-6. Introducing a formatter parameter would add
complexity and change task fingerprints without resolving that invariant meaning.

The user approved extending C2b to the shared evaluator on 2026-10-28. The view now declares
`DecimalNumbers` invariantly; its schema remains empty and its renderer/helpers are
unchanged. The graph's `familyWithin` trigger supports an optional explicit `ignore` list
of structural roots. Only the integer operand-digit rule uses it, with `DecimalNumbers`.
After excluding that representation branch from the condition, the remaining selected
number-kind family must be nonempty and entirely integer. Ignored labels remain in the
annotations and all other facet assessments. No labels are inferred or completed.

Decimal-only contexts still do not require digit widths; integer-plus-decimal notation
retains the obligation. Fraction, rational, real, irrational and complex co-claims retain
their exclusions. The decimal precision descendants are representation claims too and are
covered by the same explicit branch. The complete Area allowlist, arithmetic qualification,
range-presence policy, conflict rules and all other graph selectors remain unchanged.

The evaluator validates ignored roots, normalizes their order for policy hashing and
includes their ontology semantics in policy identity. Its evaluator version advances from
4 to 5. Annotation/plan/validation identities change; configurations, sampling, payloads,
rendering and content/task fingerprints do not.

C2b verification closes all **18 currency source findings** across C2: eight at the
integer checkpoint and ten at this checkpoint. All 18 selections declare decimal
representation, and exactly eight still activate and satisfy the integer digit rule.
Global raw source omissions fall **1,343 to 1,325**, distinct omissions **1,325 to
1,307**, and failing selections **556 to 538**. No other source family's findings change;
there are no conflicts, invalid contexts, row/contract errors or incomplete enumerations.

All **1,013 target label sets, 1,182 matches and 18 currency selections** remain. The
**42 stored-origin draws and 432 additional planned draws** retain configurations,
random states, payloads and content/task fingerprints. All **12 native rendered images**
are byte-identical. Comparison of the full graph proves that its only change is the
explicit ignored decimal branch on the integer qualification: the Area allowlist, range
facet, all other facets, conflicts and triggers are identical. Evidence is under
`temp/currency-c2/view/` and `view-image-summary.json`.

Stored assessment results remain **4,146 global / 210 currency**; the active dataset
pointer is unchanged. Ignored decimal labels no longer appear as witnesses of the
integer qualifier, but those diagnostic trace differences do not alter stored assessment
statuses. Canonical regeneration and VQA remain deferred to the readiness checkpoint.
The final `npm run check -- --spec=ccss` passes types, generator/view declarations,
labels, documentation, standards and split integrity; its final strict annotation stage
still reports those 4,146 existing stored findings. See `temp/currency-c2/check-final.log`.

Focused validation passes **260 tests across seven files**, including the actual strict
gate: removing a width from an integer-plus-decimal annotation still fails. The evaluator
has **100%** statement, branch, function and line coverage. Evidence is in
`temp/currency-c2/view-tests.log`, `strict-gate-tests.log`, `evaluator-coverage.log` and
`evaluator-coverage/`.

The final **`npm run test:coverage` passes 840 files / 6,436 tests** and every generator
coverage threshold. Currency generator coverage remains 100% in all categories; aggregate
generator coverage is 98.49% statements, 97.05% branches, 100% functions and 99.51% lines.
The complete run uses two workers and normal filesystem permissions for Git/temporary-file
fixtures. Evidence is `temp/currency-c2/c2b-full-coverage.log` and
`full-coverage-summary.json`. Final documentation validation also passes.
