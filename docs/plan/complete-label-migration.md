# Complete the label-ownership migration

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

## Accepted decisions

The following decisions are settled and are not open migration questions.

### Targets are conjunctive competency descriptions

A target describes the competency required by a standard, independently of any generator or
view. Its labels are conjunctive:

```text
Target = Area(s) AND Scope(s) AND Ability(s)
```

This expression describes factorization, not a cardinality of exactly one label per dimension.
A target may require several independent Areas, Scopes, or Abilities when every claim is true and
observable in the resulting artifact.

Every production target must contain at least one Area and at least one Ability. Scope is
zero-or-more: a Scope is required when the competency has a meaningful contextual,
representational, range, object, relation, or other discriminator.

### Generators own canonical mathematics

A generator owns the mathematical objects, relations, invariants, semantic context, and
structured witnesses needed to prove its Area and Scope claims. It must not choose how the
learner is asked to engage with them.

A canonical payload may contain:

- mathematical operands, quantities, objects, relations, results, and constraints;
- structured semantic context such as entities, events, units, and their relationships;
- structured derivations, equivalent relations, law applications, intermediate values, graph
  scales, or other witnesses required by consuming views;
- deterministic mathematical variants selected from resolved generator configuration.

It must not contain:

- imperative prompts or instructions;
- a preselected blank, unknown position, or response direction chosen for an Ability;
- display-ready question or solution sentences;
- requested explanations, hints, or answer prose;
- presentation modes, layout decisions, or text whose only purpose is a particular learner
  action.

Validating and sharpening this language-neutral canonical-payload boundary is the highest
priority of the migration.

### Views own every Ability and one coherent task projection

Every Ability capability is contributed by the view, through either invariant `generalLabels` or
resolved view-schema configuration. Abilities remain forbidden from:

- every generator declaration and schema;
- `requiredLabels`;
- `rejectedLabels`.

An Ability schema parameter is valid when it changes observable support or another presentational
property while preserving the same learner action, remains valid for every compatible payload,
resolves deterministically from the target, and can be validated by one coherent checklist. Its
presence is nevertheless an architectural review signal because it may conceal parallel task
implementations inside one view.

When an Ability or Ability combination changes instructions, the requested response, unknown
placement, requested reasoning, question/solution behavior, or another part of task identity, it
uses a separate leaf view. A view must not dispatch between those behaviors through large,
mutually exclusive code branches. Related leaves reuse parent-level renderers, helpers, and tests;
each thin wrapper fixes its task mode without parsing ontology labels.

Several invariant Abilities may be declared in `generalLabels` only when every applicable render
makes all of them true. A schema may conditionally contribute an Ability only under the
same-task criteria above; conditional truth is not itself a reason to split the view.

### Area and Scope ownership follows the determining behavior

The generator owns invariant mathematical Areas and mathematical Scopes. A view owns Scopes
created by presentation, representation, evidence source, or other learner-visible context.

A view may contribute an Area only when the task adds an independent knowledge domain. It may
not redeclare or specialize a generator-owned Area. A contextual refinement within the same
knowledge domain is a Scope, not polymorphic Area ownership.

Equal or ancestor/descendant positive capabilities may not be split across a compatible
generator/view pair. `requiredLabels` are the explicit exception in role, not in ownership: they
reference generator-established Area/Scope applicability but do not contribute a capability.

### Applicability and boundaries are not capabilities

`requiredLabels` express positive mathematical applicability. They:

- contain Area or Scope labels only;
- must be supportable by every type-compatible generator;
- must not also be supplied or rejected by the view;
- should be replaced by a narrower payload type when static typing can express the boundary.

`rejectedLabels` express irreducible physical rendering boundaries only. They must never filter
an Ability, compensate for generator-side presentation logic, suppress an inconvenient match,
or express that a view merely prefers not to handle a competency.

### Implementations consume resolved contracts, not raw labels

Ontology labels are inspected by target construction, schema resolution, matching, and
validation. Generator and view implementations consume their resolved contracts:

- a generator consumes typed mathematical configuration;
- a view consumes typed presentation configuration and the canonical problem payload;
- shared view renderers receive a fixed local task mode from their leaf wrapper.

Implementations must not inspect `payload.labels`, `problem.tags`, raw ontology IRIs, or other
unresolved label collections. Comparing a typed resolved configuration value with its enum value
is not raw-label parsing.

### The final artifact proves the complete conjunction

The generator supplies canonical evidence and the view preserves it while making its Ability
observable. A view may not flatten a law-bearing relation, omit a premise or scale, replace a
claimed object with a badge naming it, or otherwise erase evidence for generator-owned labels.

Canonical VQA remains the pragmatic artifact-level capability gate. It validates the complete
label set of every generated production artifact. A separate synthetic capability-totality gate
over all possible declared module configurations is optional and is not required to complete
this migration. It should be reconsidered only if unused capabilities or future composition
produce a concrete validation gap that active-target VQA cannot cover.

### Identity layers remain separate

- Target identity is the hash of the normalized requested label set.
- Sample identity is the structural target/generator/view/split/mode/instance tuple.
- Content identity is the canonical mathematical payload fingerprint.
- Task identity is the payload plus deterministically resolved view configuration.

Equal mathematical data with different task projections must remain distinct. View splitting
therefore changes sample identity intentionally even when shared rendering code and mathematical
payloads remain unchanged.

## Current inventory

The inventory below reflects the CCSS K-4 release state at commit
`5489ebca38b05225d03996a728f16f577d0f2912`.

### Targets

- 653 normalized active targets.
- All 653 contain at least one Ability.
- 557 contain one Ability, 80 contain two, and 16 contain three.
- 384 contain multiple Areas; this is not inherently a defect.
- 25 contain no Scope; this is not inherently a defect.
- Two Grade 4 measurement-number-line permutations contain no Area because the `Scope.Dollar`
  member of `measurementKinds` is not paired with an Area.

The two Area-less targets must be classified correctly after reviewing the ontology and source
standard. The migration must not guess an Area merely to satisfy the new gate.

### Generator declarations

- 79 generator modules.
- Zero generator `generalLabels` contain an Ability.
- Zero generator schemas contain an Ability.

This declaration-level part of Ability ownership is complete and already enforced.

### Ability-parameterized views

Eleven views resolve an Ability through their schema. They currently cover 94 production matched
tuples and at least 23 production-used resolved configurations. These are review candidates, not
known defects:

| Existing view | Current resolved modes | Initial review question |
| --- | ---: | --- |
| `measure-conversion` | 2 | Does derivation versus execution change the learner action? |
| `numbers-decimal-notation` | 2 | Are the two conversion directions distinct requested responses? |
| `operations-add-subtract-strategy` | 2 | Are understanding and derivation parallel task implementations? |
| `operations-equal-groups` | 1 | Is the schema intentional future capability or merely invariant today? |
| `operations-number-array` | 3 | Do execution, formalization, and interpretation require different checklists? |
| `operations-number-line` | 2 | Is visual articulation additive support or a different task? |
| `place-value-arithmetic-model` | 2 | Does the written-method variant change the requested response? |
| `area-perimeter-comparison` | 2 | Are classification and construction/explanation separate tasks? |
| `shape-classify-attributes` | 2 | Is recognition observable support within the same classification task? |
| `time-analog` | 3 | Which modes change task identity rather than presentation support? |
| `time-digital` | 2 | Are reading and construction distinct learner actions? |

The table records resolved configurations, not a lower bound on required leaf views. Each result
must follow rendered task evidence, implementation branch structure, and checklist coherence;
target cardinality and the presence of an Ability parameter do not decide leaf identity.

The current generator/view validator correctly rejects Abilities in generator schemas and allows
them in view schemas. The migration audit should report the latter for semantic review rather than
turning them into validation failures.

### Generator payload candidates

A source scan found at least 24 generator modules with fields that may cross the canonical
mathematics/task-projection boundary:

- 20 modules contain a `prompt` field;
- 17 contain `explanation` or `rationale` fields;
- 10 contain preformatted question artifacts such as `questionEquation`;
- three contain `unknown` or `unknownRole` fields.

Field names are an audit signal, not final proof. Each payload field must be classified as one
of:

1. canonical mathematical or semantic data;
2. a structured mathematical witness that should remain but may need a typed representation;
3. learner-action or display prose that must move to the view;
4. an ambiguous case requiring an explicit architectural decision.

Imperative prompts, blank markers, selected unknowns, and answer/explanation prose are presumed
presentation defects unless the review establishes a different mathematical invariant. Narrative
context such as a word-problem situation must be reviewed separately: its semantics may be
canonical even when its final wording should be view-owned.

### Raw-label access

Two view implementations currently inspect `payload.labels` directly:

- `sorting-classify-sort`;
- `sorting-classify-count`.

These decisions must move into resolved view configuration or canonical payload fields. Static
linting must prevent recurrence.

### Applicability, boundaries, and view-owned Areas

- Seven views use `requiredLabels`; their current static contracts pass.
- 30 views use `rejectedLabels`; each needs a semantic review proving a physical rendering
  boundary.
- 18 views declare general Areas and two view schemas declare Areas. Current validation finds no
  taxonomic overlap with compatible generator Areas, but the independent-domain rationale remains
  a semantic review responsibility.
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

### Phase 1: validate and formalize the language-neutral generator boundary

This is the highest-priority research and design phase.

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

### Phase 2: audit Ability-parameterized views and split parallel task behavior

For each of the 11 views:

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

### Phase 4: enforce implementation label isolation

Add static linting for rules that are mechanically decidable.

At minimum, reject:

- `payload.labels` and `problem.tags` access outside schema/orchestration infrastructure;
- raw ontology IRI string matching in generator and view implementations;
- `Ability` imports or references in `generator.ts`;
- label resolver imports in generator and view implementation files;
- Abilities in generator schemas, `requiredLabels`, or `rejectedLabels`;
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

### Phase 5: review target, applicability, and boundary declarations

1. Correct the two Area-less Grade 4 measurement-number-line permutations after an ontology and
   standards review.
2. Add the production target dimension gate.
3. Review every `rejectedLabels` declaration and retain only physical rendering boundaries.
4. Review every view-owned Area and record why it is an independent knowledge domain.
5. Confirm every `requiredLabels` declaration is necessary, generator-established, and not better
   expressed by a narrower payload type.
6. Audit multiple-Ability view declarations for unconditional conjunction without introducing a
   primary Ability.

Zero-Scope targets and multiple-Area or multiple-Ability targets are not findings by themselves.

### Phase 6: update documentation and skills

Create `docs/label-architecture.md` as the concise conceptual entry point covering:

- requested target claims versus module capabilities;
- matching direction and conjunction;
- dimension ownership;
- invariant capabilities, configurable capabilities, applicability, and boundaries;
- canonical payloads and task projections;
- observable evidence;
- target, sample, content, and task identity.

Update `docs/README.md` to route cross-role architecture work through that document. Keep
`DOCS.md` focused on architecture, scripts, and workflows, and keep normative rules in the
existing reference files.

Append missing normative rules to:

- `docs/spec-general.md`: capability provenance and complete cross-role positive overlap;
- `docs/spec-view.md`: view-owned Abilities, the same-task criteria for Ability schemas, and leaf
  views for task-changing Abilities;
- `docs/implementation-generator.md`: canonical semantic data versus forbidden learner-action
  data;
- `docs/implementation-view.md`: no raw-label access, no parallel task dispatcher, and fixed local
  task modes for shared leaf renderers;
- `docs/target-spec.md`: at least one Area and Ability, Scope zero-or-more, and conjunctive
  cardinality;
- `docs/checklist-view.md`: the artifact must defend the complete target conjunction without
  privileging one Ability.

Update skills by referencing those rule IDs rather than restating their prose:

- `/create-spec-from-standard`: require a label-ownership table and expected view capability for
  every Ability;
- `/review-gen`: classify payload fields and flag learner-action or display-ready data;
- `/review-view`: inspect Ability schemas for parallel task behavior; reject raw-label access,
  task-changing configuration branches, and unjustified Area ownership;
- `/update-gen`: require a consuming-view adoption matrix for payload neutralization;
- `/update-view`: require an Ability-schema task-identity assessment and, when splitting is needed,
  a leaf plan with parent-level renderer reuse;
- `/implement-spec`: preserve the reviewed ownership trace through matching and VQA;
- `/fix-spec`: include capability provenance before considering a declaration correction;
- `/release-dataset`: run the strict label-architecture audit before canonical generation and
  release publication.

Add a cross-role `/review-label-architecture [--spec=<module>]` skill only if the audit needs an
agentic interpretation layer. The underlying deterministic inventory must remain a script so CI
and non-agent workflows receive the same facts.

### Phase 7: canonical validation and release proof

After all strict findings reach zero:

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

## Low-priority investigations

These questions do not block the migration.

### Ontology-relevant fallback variation

Whether a choice is ontologically relevant depends on the target. The same visual or mathematical
choice may instantiate a required distinction for one target and be incidental for another.

Research should distinguish:

- a target explicitly requiring a concrete capability;
- a broad target intentionally realized through one valid specialization;
- a target silent about a choice that is incidental to its competency;
- a resolved specialization that should be added to runtime tags because it materially changes
  the artifact's ontological description.

Do not assume that every schema fallback is either ontology-relevant or irrelevant globally. No
fallback redesign is required for the current migration unless a concrete mislabeled artifact is
found.

### Pair-conditional view capabilities

The current preferred tools are:

1. a narrower payload type;
2. a separate leaf view with shared rendering code;
3. `requiredLabels` for generator-established Area/Scope applicability.

Do not add pair-conditional capability syntax without a real case where all three mechanisms are
inadequate. Parameter defaults do not by themselves justify conditional capability semantics.

### Synthetic capability-totality probing

VQA already validates every generated active-target artifact and its full label conjunction. A
synthetic matrix that probes every declared module capability across every type-compatible partner
could detect unused or future-facing declaration defects, but it creates substantial combination
and fixture complexity.

Keep this as an optional diagnostic. Promote it only when evidence shows that active-target VQA,
static ownership validation, and test-spec coverage leave a recurring blind spot.

## Explicit non-goals

- Do not introduce a primary Ability.
- Do not split a view solely because an Ability appears in its schema.
- Do not require exactly one Area, Scope, or Ability.
- Do not make Scope mandatory when no contextual distinction exists.
- Do not move all Areas to generators or all Scopes to views.
- Do not weaken matching, remove labels, or add rejection boundaries to avoid migration work.
- Do not introduce ontology entities merely to encode implementation ownership.
- Do not build pair-conditional capability infrastructure without a concrete counterexample.
- Do not require one universal canonical problem AST as a prerequisite.
- Do not replace canonical VQA with static declaration checks.

## Completion criteria

The migration is complete when:

1. every active target contains at least one Area and Ability;
2. every generator declaration and schema is Ability-free;
3. every target Ability is positively contributed by its matched view through `generalLabels` or
   resolved schema configuration;
4. no `requiredLabels` or `rejectedLabels` declaration contains an Ability, and every view Ability
   schema has passed the same-task, totality, determinism, and checklist review;
5. no generator or view implementation parses raw labels;
6. no compatible generator/view pair has equal or ancestor/descendant positive capability
   ownership overlap;
7. generator payloads contain canonical mathematical and semantic structures but no learner-action
   prompt, selected blank, requested explanation, or answer prose;
8. every task-changing Ability is a leaf view with reusable parent-level rendering code, and no
   view hides parallel task implementations behind large config-controlled branches;
9. every `requiredLabels` declaration is a valid generator-established applicability condition;
10. every `rejectedLabels` declaration is an irreducible physical rendering boundary;
11. every view-owned Area is demonstrably independent of compatible generator Areas;
12. matching provenance identifies the capability owner of every target claim;
13. all affected canonical artifacts pass live VQA and the complete cache passes strict audit;
14. churn and split reports show only intended changes;
15. `docs/label-architecture.md`, normative references, validators, and skills describe and
    enforce the same clean architecture;
16. the full CCSS generation, union merge, and asset-index validation pass without migration
    exceptions or permanent allowlists.
