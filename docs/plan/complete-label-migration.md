# Complete the label-ownership migration

**Status:** Complete. Structural ownership, Scope completeness, schema-resolution semantics, and
the final canonical proof all satisfy the completion gates below.

The separation of structural `part_of` and inheriting `specializes` relations is implemented and
tracked independently in [ontology-relations-migration.md](ontology-relations-migration.md). The
ordinary release using that ontology version remains a release operation, not unfinished work in
this label-ownership migration.

## Purpose

Complete the repository-wide migration to a strict relationship between competency targets,
ontology label dimensions, generators, views, and rendered artifacts.

The stable end state is:

```text
target claims
    -> matched generator/view capabilities
    -> canonical mathematical payload
    -> observable learner-facing projection
    -> artifact that defends the complete target conjunction
```

This file is the migration inventory and execution plan. The timeless conceptual model belongs
in a separate `docs/label-architecture.md`. Normative rules remain in the existing authoring
references under `docs/`, with stable rule IDs; neither this plan nor the architecture overview
should duplicate their full wording.

## Accepted architecture

The clean-state model is [docs/label-architecture.md](../label-architecture.md). Normative rules
remain in the authoring references indexed by [docs/README.md](../README.md). This plan records
migration evidence, sequencing, and completion status only; it does not redefine target
conjunctions, dimension ownership, applicability, payload/projection boundaries, or dataset
identities.

## Current inventory

The inventory below reflects the current CCSS K-4 state.

### Targets

- 653 normalized active targets.
- All 653 contain at least one Area.
- All 653 contain at least one Ability.
- 557 contain one Ability, 80 contain two, and 16 contain three.
- 263 contain one Area and 390 contain multiple Areas; multiple Areas are not inherently a defect.
- 27 contain no Scope; this is not inherently a defect.

### Generator declarations

- 80 generator modules.
- Zero generator `generalLabels` contain an Ability.
- Zero generator schemas contain an Ability.

This declaration-level part of Ability ownership is complete and already enforced.

### Ability-parameterized views

The Phase 2 queue began with eleven views that resolved an Ability through their schema. The
completed rows below name their invariant replacement leaves:

| Existing view | Current resolved modes | Initial review question |
| --- | ---: | --- |
| `measure-conversion` | 2 | **Migrated:** distinct derivation and execution actions now use `measure-conversion-derivation` and `measure-conversion-execution`, backed by one shared renderer. |
| `numbers-decimal-notation` | 2 | **Migrated:** distinct fraction-to-decimal formalization and decimal-to-fraction interpretation actions now use `numbers-fraction-to-decimal` and `numbers-decimal-to-fraction`, backed by one shared renderer. |
| `operations-add-subtract-strategy` | 2 | **Migrated:** general procedure understanding now uses `operations-add-subtract-strategy-understanding`; counting-on and counting-back concept derivation use separate required-label leaves over the same renderer. |
| `operations-equal-groups` | 1 | **Migrated:** `Interpretation` is invariant for this view, so it is now a fixed capability and the schema is empty. |
| `operations-number-array` | 3 | **Migrated:** execution, equation formalization, and interpretation now use three invariant leaves over one total renderer; formalization withholds the complete equation rather than merely its result. |
| `operations-number-line` | 2 | **Migrated:** number-line representation and number-line arithmetic are distinct learner actions and now use invariant leaves over one shared renderer. |
| `place-value-arithmetic-model` | 2 | **Migrated:** block procedure understanding and model-to-written-method formalization now use invariant leaves over one shared renderer; the paired generator payload is language-neutral. |
| `area-perimeter-comparison` | 2 | **Migrated:** classification and constrained rectangle construction now use separate invariant leaves over one shared renderer; the paired generator payload is language-neutral. |
| `shape-classify-attributes` | 2 | **Migrated:** visual recognition is invariant because every supported classification task requires inspection of rendered shapes or geometric evidence. The schema is empty, and the paired generator now supplies only typed shape definitions, geometry, relations, markers, counts, and membership truth; the view owns all language, distractors, option order, and answer identities. |
| `time-analog` | 3 | **Migrated:** analog reading/telling modes share one invariant reading leaf, while clock-hand construction is a separate invariant leaf over the shared analog renderer. |
| `time-digital` | 2 | **Migrated:** digital reading and display construction are separate invariant leaves over the shared digital renderer; both consume the neutral time payload. |

The table records resolved configurations, not a lower bound on required leaf views. Each result
must follow rendered task evidence, implementation branch structure, and checklist coherence;
target cardinality and the presence of an Ability parameter do not decide leaf identity.

The current generator/view validator correctly rejects Abilities in generator schemas and allows
them in view schemas. The migration audit should report the latter for semantic review rather than
turning them into validation failures.

### Generator payloads and implementation isolation

The completed payload inventory records 81 historical module rows: 58 migrated, 22 explicitly
kept as canonical, and one redundant generator consolidated. The current catalog contains 80
generators. Every current payload has a compatible-view trace and no unresolved **Decision**
field remains.

The strict source audit reports no raw-label access, raw ontology-IRI parsing, or learner-action
payload-field signal. Static checks prevent Abilities in generator declarations and schemas and
reject unresolved ontology access in generator/view implementations.

### Applicability, boundaries, and view-owned Areas

- 38 views use `requiredLabels`; their static and semantic contracts pass.
- 30 views use `rejectedLabels`; each has a reviewed stable and complete exclusion boundary.
- 24 views declare general Areas. Current validation finds no
  taxonomic overlap with compatible generator Areas, and each independent-domain rationale is
  recorded in [label-declaration-review.md](label-declaration-review.md).
- The current catalog contains no unresolved generator-general/view-schema Scope overlap. This
  permits the complete positive-capability overlap rule to become strict without a known migration
  exception.

## Migration sequence

### Phase 0: establish audit output without weakening current gates

Add a deterministic label-architecture audit that reports:

- target dimension cardinalities;
- label-to-module ownership and the exact capability satisfying each matched target label;
- generator and view schema dimensions;
- Ability ownership and every view Ability schema parameter as a semantic review signal;
- positive cross-role equal/ancestor overlaps;
- raw ontology-label access in implementations;
- generator payload fields that resemble prompts, questions, blanks, unknown selections,
  instructions, hints, explanations, or answer prose;
- `requiredLabels`, `rejectedLabels`, and view-owned Area usage;
- production matched tuples affected by each finding.

The initial command may report known migration findings without failing. No permanent allowlist
should encode the old architecture as acceptable. Each check becomes a hard gate when its
corresponding migration phase reaches zero findings.

**Status: complete.** `npm run audit:label-architecture -- --spec=<module>` writes deterministic
Markdown and JSON reports under `temp/label-architecture/<spec>/`; `--strict` is available for
categories promoted to gates, while the default remains migration-report mode. The audit reuses
successful match tuples from the persisted dataset dependency graph only when all current
capability hashes, target postings, matching policy, and compatible-pair topology agree. The graph
does not encode `generalLabels` versus schema provenance, so the current catalogs supply that exact
declaration metadata. Source scans supply the implementation-only findings. This separation avoids
a graph-schema migration while keeping matching work delta-aware and all audit passes linear.

The current strict CCSS audit covers 653 targets and 790 matched production tuples. It reports zero
violations, zero source signals, and no Ability-parameterized views. Its 92 semantic review signals
cover 30 rejection declarations, 38 applicability declarations, and 24 view-owned Areas; Phase 5
records a durable disposition for all of them. There
are no positive cross-role capability overlaps and no target without an Area, Ability, or match.

### Phase 1: validate and formalize the language-neutral generator boundary

This is the highest-priority research and design phase.

The active module-by-module inventory is maintained in
[language-neutral-generator-payloads.md](language-neutral-generator-payloads.md). Its first deep
pass classifies the 24 Phase 0 source-scan candidates and records their production consumers. The
inventory deliberately remains open until the other 55 payload types and every type-compatible
consumer have been reviewed; absence from the lexical candidate set is not evidence of neutrality.

1. Review all 79 generator payload types, starting with the 24 source-scan candidates.
2. Trace every candidate field to all consuming views and production targets.
3. Classify each field using the four-way payload classification above.
4. Identify reusable structured contracts for relations, derivation steps, semantic situations,
   object descriptions, graph evidence, and other repeated witnesses.
5. Decide which existing display strings can be derived losslessly by views and which require a
   structured semantic replacement first.
6. Add or sharpen normative generator rules only after representative arithmetic, measurement,
   geometry, fraction, and word-problem cases validate the boundary.
7. Produce a reviewed module-by-module migration table before bulk code changes.

This phase validates the rule; it does not require one universal problem AST or new ontology
support. Domain-specific typed structures are acceptable when they preserve evidence and keep
learner action out of the payload.

**Status: complete.** The companion inventory records every current generator and compatible view,
with no unresolved **Decision** field. All accepted migrations and typed replacements are
implemented; the lone exact duplicate was subsequently consolidated.

### Phase 2: audit Ability-parameterized views and split parallel task behavior

For each remaining view in the inventory:

1. enumerate every production-used resolved task mode and Ability conjunction;
2. inspect representative canonical question and solution images;
3. decide whether all configurations preserve one learner action and one coherent checklist;
4. inspect whether the implementation uses large, mutually exclusive branches for instructions,
   requested responses, unknown placement, reasoning requests, or question/solution behavior;
5. retain the Ability schema when its variation is small, composable, total across compatible
   payloads, and limited to support or presentation within the same task;
6. when task identity changes, create thin leaf directories with their own `spec.ts`,
   `checklist.md`, `view.html`, and `withConfig` wrapper;
7. for split tasks, move shared renderers, helpers, and relevant tests to the category parent and
   pass a fixed local non-ontology task mode into shared rendering code;
8. narrow `ViewTypeMap` payloads or add `requiredLabels` only where mathematical applicability
   requires it;
9. run matching-diff, canonical scoped generation, VQA, churn, and split validation for every
   changed module.

Do not create a leaf for every target Ability subset or every Ability schema mechanically. Leaves
represent distinct observable task projections. Multiple target Ability sets may correctly use
the same leaf, and an Ability parameter may remain when all configurations satisfy the strict
same-task criteria.

**Status: complete.** The catalog contains no Ability-parameterized view. Every reviewed
task-changing mode now uses an invariant leaf over reusable parent-level rendering code; invariant
same-task capabilities remain declarative.

### Phase 3: neutralize generator payloads in pair-aligned batches

Use the Phase 1 inventory to migrate related generator/view families together. Prioritize:

1. preselected unknowns, blanks, and response direction;
2. imperative prompts and instructions;
3. answer and explanation prose;
4. question/solution display strings;
5. narrative text whose semantics should become structured context.

For every batch:

1. define or update the canonical payload contract first;
2. preserve every Area/Scope witness needed by current targets;
3. remove learner-action fields from the generator schema and payload;
4. adopt every real-standard consuming view, not only the test path;
5. keep wording, blanks, instructions, and requested reasoning in leaf views;
6. add generator tests for mathematical invariants and view tests for projection decisions;
7. regenerate and validate only the affected production closure during iteration;
8. verify matching and cache churn before continuing.

Where Phase 2 and Phase 3 affect the same generator/view family, perform them in one pair-aligned
batch so the shared renderer and payload contract are rewritten once.

**Status: complete.** All accepted payload migrations are implemented across every compatible
production consumer. Canonical generation and VQA verified the resulting projections.

### Phase 4: enforce implementation label isolation

Add static linting for rules that are mechanically decidable.

At minimum, reject:

- `payload.labels` and `problem.labels` access outside schema/orchestration infrastructure;
- raw ontology IRI string matching in generator and view implementations;
- `Ability` imports or references in `generator.ts`;
- label resolver imports in generator and view implementation files;
- Abilities in generator schemas or `rejectedLabels`;
- equal or ancestor/descendant positive capability overlap across compatible roles;
- active targets without an Area or Ability.

The lint must distinguish raw label parsing from valid consumption of a typed resolved config
value. Scope, Area, and Ability enum values may appear in rendering when they are the resolved
value of the module's own schema.

Report Ability schema parameters and high-level config-controlled rendering branches as review
signals. Whether a branch represents a distinct task identity is semantic and cannot be rejected
from syntax alone; review and VQA enforce the strict one-task-per-view rule.

Payload-language lint begins as a diagnostic because field names alone cannot prove semantics.
It may become a hard gate for explicitly forbidden shapes and imports after Phase 1 defines the
contract and affected payload types are migrated.

**Status: complete for mechanically decidable rules.** The strict CCSS audit currently reports
zero violations and zero source signals. Semantic questions remain review items rather than being
misclassified as syntax failures.

### Phase 5: review target, applicability, and boundary declarations

1. **Resolved:** every Grade 4 measurement kind, including `Scope.Dollar`, now belongs to
   `Area.MeasuringWithUnits`. The Scope authoritatively selects the unit system; dataset generation
   does not model currency-specific denomination availability.
2. Keep the production target dimension gate strict.
3. Review every `rejectedLabels` declaration and retain only stable, complete exclusion
   boundaries.
4. Review every view-owned Area and record why it is an independent knowledge domain.
5. Confirm every `requiredLabels` declaration is necessary, supported by every compatible pair,
   does not parameterize rendering, and is not better expressed by a narrower payload type.
6. Audit multiple-Ability view declarations for unconditional conjunction without introducing a
   primary Ability.

Zero-Scope targets and multiple-Area or multiple-Ability targets are not findings by themselves.

**Status: complete.** [label-declaration-review.md](label-declaration-review.md) records the durable
disposition of all 92 semantic review signals: 30 `rejectedLabels`, 38 `requiredLabels`, and 24
view-owned Area declarations. Positive mass/volume, notation, hundreds-bundle, and stronger-sibling
applicability is stated through dimension-neutral `requiredLabels`; the redundant
length-estimation rejection is absent. All retained declarations satisfy the accepted ownership
or boundary rules, and the normalized production match set contains 790 tuples.

### Phase 6: update documentation and skills

**Status: complete.** [label-architecture.md](../label-architecture.md) is the concise cross-role
entry point, [docs/README.md](../README.md) routes exact authoring work to the normative references,
and the project skills retain only workflow-specific decisions while citing those rule IDs. The
deterministic architecture audit remains the common inventory for CI and agentic review; no
separate interpretation skill was needed.

### Phase 7: scope completeness

The matched target proves that an artifact satisfies a requested competency. The released sample
must describe the complete observable result, including capabilities that were not needed to make
that match. Derive its labels from the resolved generator/view pair:

```text
generator generalLabels
union resolved generator schema labels
union view generalLabels
union resolved view schema labels
```

`requiredLabels` and `rejectedLabels` are applicability constraints and never contribute output
labels. A rejection is a gate, not a subtraction operation. Target labels remain provenance for
the standard association; they are not a substitute for deriving the artifact's labels from the
pair that produced it.

1. Remove all generator-authored ontology annotations and keep `ProblemStub` data-only.
2. Resolve both generator and view schemas into explicit capability-label sets.
3. Persist the complete pair-derived label set on `AbstractProblem` and in dataset metadata.
4. Audit every schema fallback and seeded parameter choice: competency-changing specializations
   must resolve through the schema; incidental instance variation remains unlabeled.
5. After resolving each matched tuple, verify that every target claim is covered by an equal or
   more-specific pair-derived label and that no resolved capability falls inside a rejected
   boundary. This is an end-to-end resolution and persistence invariant, not a second matching
   policy.
6. Inventory observable Scope leaves absent from the pair-derived set, prioritizing cases where a
   broad target did not need the more-specific Scope for matching.
7. Regenerate affected artifacts and verify matching, label churn, coverage, and VQA.

**Status: complete.** Steps 1 and 2 are complete: `ProblemStub` is data-only, and both schema
roles expose the exact labels selected by target matching or deterministic fallback. Step 3 is
complete in orchestration: `AbstractProblem.labels` and dataset rows contain only the union of
pair-general and pair-resolved capabilities, while `RenderPayload.targetLabels` remains a separate
configuration-selection input. Step 4 is complete: label-backed fields require a non-empty
supported-capability set, and function-only fields must be explicitly `ontologyNeutral`. The five
current function-only choices select a missing pattern term, a pattern-table operand, or a line-
symmetry figure and remain fingerprint-visible but unlabeled. The two hidden target-dependent
length-task switches were not valid fallbacks; measuring and drawing now use separate invariant
views over one renderer. Resolvers that need label conjunctions now declare and validate complete
fallback label sets; operand profiles, comparison relations, fraction-arithmetic tasks, and
measurement unit pairs no longer rely on invalid singleton fallback inputs. Step 6 is complete:
`npm run audit:scope-completeness -- --spec=ccss` reuses the active matching topology, resolves one
deterministic configuration per matched tuple, and inventories co-resolving schema labels whose
Scope conjunction is not present in the pair-derived set. The review recovered fixed meter, hour,
liter, and kilogram scales from measurement number lines and word problems, plus complete
increment/decrement direction Scopes from `counting-inc-dec`. All 790 CCSS tuples now have zero
unresolved co-resolving Scope candidates; the report separately records 30 additional Scope labels
and six more-specific target-Scope realizations already supplied by pair resolution. Complementary
presence predicates explicitly resolve a truthful absence default only when the negative branch
guarantees it. A non-negative domain therefore emits `NumbersWithoutNegatives`; `requireZero: false`
does not emit `NumbersWithoutZero`, because zero may still appear in derived values or a view. This is a
deterministic candidate audit rather than an observability oracle, so canonical VQA remains the
empirical proof. Step 5 is complete: release-index validation now applies the same one-directional,
equal-or-more-specific ontology coverage rule as matching. The gate exposed and corrected one
generator that matched the broad `ShapeAttributes` context without persisting a covering resolved
capability. Step 7 regeneration is complete, while its live VQA proof remains part of Phase 8.

### Phase 8: canonical validation and release proof

After all strict violations and source signals reach zero and semantic declarations are reviewed:

1. run generator/view spec validation;
2. run the label-architecture lint and ownership report;
3. run standards-spec validation and inspect the complete matching diff;
4. canonically regenerate affected scopes during development;
5. run live VQA for every changed canonical artifact;
6. require strict offline VQA audit, churn, and split reports;
7. run full repository checks;
8. perform one full canonical CCSS generation and VQA audit;
9. rebuild and validate the union asset index.

Canonical VQA is the required empirical proof that active target conjunctions survive generator
and view composition. The optional synthetic capability-totality investigation is not a release
gate.

**Status: complete.** Full canonical CCSS affected regeneration, repository checks, matching,
split integrity, and strict VQA coverage pass. The final fallback audit preserves all 1,878 sample
identities and image bytes with zero churn. Live validation rejected the proposed
`NumbersWithoutZero` default because derived values and views may still expose zero; removing that
overclaim restored the existing validated contexts. The 46 artifacts that truthfully gained
`NumbersWithoutNegatives` all passed focused live revalidation, and the strict audit covers all
1,878 artifacts. Future publication runs the same gates as ordinary release policy rather than
reopening this migration.

## Post-migration decisions and regression research

These items are not completion gates for the closed migration.

### Ontology-neutral schema choices

The `ontologyNeutral` marker is the explicit opt-in for a configuration choice that changes task
identity or configuration while contributing no ontology capability. It intentionally allows
ontology-independent dataset variation, and its resolved value participates in the relevant
fingerprint. It is not the universal home for seeded randomness:

- generator randomness that selects a concrete canonical instance remains in the generator and is
  captured by `problem.data` and the content fingerprint;
- a view choice that changes what the task asks, while remaining ontology-neutral, belongs in an
  `ontologyNeutral` schema field so it enters the task fingerprint;
- a view choice that changes only presentation remains seeded view logic and does not enlarge the
  schema.

All entropy still comes from the established sample or render seed. The five current uses are
view-owned task choices: missing pattern positions, a table focus operand, and line-symmetry figure
selection. A future generator use requires a concrete task-identity reason; ordinary mathematical
instance variation does not.

### Schema completion versus absence defaults

An absence default and a broad-target realization are different contracts even though both use
schema completion machinery.

- A predicate default is monotone: when the positive feature is absent, the generator uses the
  configuration without it. If that absence itself is a guaranteed observable capability, the
  complementary label must be an explicit fallback set. `NumbersWithNegatives` therefore defaults
  to the declared `NumbersWithoutNegatives` configuration; a false `requireEvenResult` does not
  imply `OddNumbers` and emits no opposite label.
- A broad target may require a concrete observable realization. Choosing `PhysicalRuler` versus
  `Tapemeter`, `Greater` versus `Less`, `ProperFractions` under `FractionNumbers`, or two versus
  three operands is not an absence default. It is a labeled specialization selection, and the
  selected label belongs in the pair-derived dataset description.
- Incidental instance variation that changes neither contract is not schema completion and remains
  unlabeled seeded implementation variation.

Keeping these meanings separate avoids treating every false predicate as an opposite claim while
still preserving the complete observable label set of a concrete realization.

### Synthetic capability-totality regression

VQA validates every generated active-target artifact and its full label conjunction, while the
hand-authored `test` spec provides curated smoke paths and regression fixtures. A synthetic matrix
could instead derive regression cases directly from generator/view declarations:

1. enumerate every valid schema resolution and explicit fallback set;
2. pair it only with type-compatible views whose requirements and boundaries admit it;
3. assert resolution totality, deterministic generation, view validation, question/solution task
   identity, and stable fingerprints;
4. render representative cases without claiming standards coverage; and
5. keep the work linear in declared choices plus compatible-pair edges by avoiding a blind label
   power set.

This could replace the `test` spec's generic reachability role, but not its deliberately authored
edge cases, bug reproductions, or human-readable fixtures. The useful experiment is to compare the
synthetic matrix with the existing test targets, retain unique curated cases, and measure whether
the remaining hand-authored smoke targets add coverage before removing any of them. Live VQA of
real standard targets remains the semantic release proof.

## Explicit non-goals

- Do not introduce a primary Ability.
- Do not split a view solely because an Ability appears in its schema.
- Do not require exactly one Area, Scope, or Ability.
- Do not make Scope mandatory when no contextual distinction exists.
- Do not move all Areas to generators or all Scopes to views.
- Do not weaken matching, remove labels, or add rejection boundaries to avoid migration work.
- Do not introduce ontology entities merely to encode implementation ownership.
- Do not require one universal canonical problem AST as a prerequisite.
- Do not replace canonical VQA with static declaration checks.

## Completion criteria

The migration is complete when:

1. every active target contains at least one Area and Ability;
2. every generator declaration and schema is Ability-free;
3. every target Ability is positively contributed by its matched view through `generalLabels` or
   resolved schema configuration;
4. no `rejectedLabels` declaration contains an Ability; every Ability in `requiredLabels` is an
   invariant view capability; and every view Ability schema has passed the same-task, totality,
   determinism, and checklist review;
5. no generator or view implementation parses raw labels;
6. no compatible generator/view pair has equal or ancestor/descendant positive capability
   ownership overlap;
7. generator payloads contain canonical mathematical and semantic structures but no learner-action
   prompt, selected blank, requested explanation, or answer prose;
8. every task-changing Ability is a leaf view with reusable parent-level rendering code, and no
   view hides parallel task implementations behind large config-controlled branches;
9. every `requiredLabels` declaration is a necessary dimension-neutral target precondition,
   supported by every compatible pair and independent of rendering behavior;
10. every `rejectedLabels` declaration is a stable, complete exclusion boundary;
11. every view-owned Area is demonstrably independent of compatible generator Areas;
12. matching provenance identifies the capability owner of every target claim;
13. all affected canonical artifacts pass live VQA and the complete cache passes strict audit;
14. churn and split reports show only intended changes;
15. `docs/label-architecture.md`, normative references, validators, and skills describe and
    enforce the same clean architecture;
16. the full CCSS generation, union merge, and asset-index validation pass without migration
    exceptions or permanent allowlists.

All sixteen gates are satisfied by the closing evidence: 653 active targets, 199 compatible pairs,
790 matched tuples, zero strict architecture violations, zero unresolved Scope candidates, 443
passing test files with 2,431 tests, stable identities and image bytes for all 1,878 canonical
artifacts, and strict live VQA coverage of 1,878/1,878.
