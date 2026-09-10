# Label Architecture

Conceptual map for reasoning across competency targets, generator/view capabilities, canonical
payloads, rendered tasks, and dataset identity.

This document explains how the pieces relate. The linked reference files remain normative:
use their stable rule IDs when authoring, reviewing, or reporting a violation.

## The claim pipeline

```text
target label conjunction
        |
        v
type-compatible generator + view pair
        |
        +-- positive capabilities cover every target claim
        +-- requiredLabels admits the target
        +-- rejectedLabels does not exclude the target
        |
        v
resolved generator config -> canonical mathematical payload
        |
        v
resolved view config -> one observable task projection
        |
        v
question / solution artifacts -> VQA of the complete conjunction
```

A target is a request. Generator and view declarations are capabilities. Matching succeeds only
when the compatible pair collectively supplies an equal or more-specific capability for every
target label; labels within a target are conjunctive. Applicability requirements and exclusion
boundaries are evaluated in addition to that positive coverage. See
[SPEC-1](spec-general.md#spec-1--matching-is-one-directional-capability-must-be-equal-or-more-specific),
[SPEC-V3](spec-view.md#spec-v3--rejectedlabels-declares-complete-exclusion-boundaries), and
[SPEC-V7](spec-view.md#spec-v7--requiredlabels-declares-target-preconditions).

Before matching, distinguish the ontology's organizational nodes from descriptors eligible for
labeling. The same eligibility requirement applies to target claims, module declarations, and
resolved dataset annotations. A specialization family can be a valid label; a field that groups
constituents cannot. See [SPEC-3](spec-general.md#spec-3--most-specific-does-not-mean-leaf), which
applies the ontology's content-evidence rule to this repository.

## Claims, capabilities, applicability, and boundaries

| Construct | Meaning | Does it satisfy a target claim? | May it change behavior? |
|---|---|---:|---:|
| Target label | A claim the competency requires | n/a | n/a |
| `generalLabels` | An invariant module capability | Yes | No; it is always true |
| Schema label | A supported configurable capability | Yes, after resolution | Yes, within the module's role |
| `requiredLabels` | An explicit target precondition for view participation | No | No |
| `rejectedLabels` | A stable, complete invalid domain for a view | No | No |

All label-bearing constructs are dimension-neutral mechanisms. Target labels, `generalLabels`,
schema-supported labels, `requiredLabels`, and `rejectedLabels` use ordinary ontology labels and
each construct's semantics apply without branching on whether a label is an Area, Scope, or
Ability. The schema labels used for parameterization are no exception: the resolved configuration
value, not a dimension-specific schema API, gives the label its operational meaning.

Dimension ownership still constrains valid declarations. For example, generators cannot declare
or parameterize Abilities, and views cannot reject them. A required capability must still be
provided by the compatible generator/view pair, but either role may be the provider. A view
capability that is also required remains invariant; the requirement does not make it conditional
and must never drive rendering. See
[SPEC-V7](spec-view.md#spec-v7--requiredlabels-declares-target-preconditions) and
[SPEC-V8](spec-view.md#spec-v8--requiredlabels-does-not-parameterize-the-view).

Positive ownership is non-polymorphic across a compatible pair: the roles do not split equal or
ancestor/descendant capability claims. Invariant claims belong in `generalLabels`; capabilities
that select valid module behavior belong in the owning schema. See
[SPEC-7](spec-general.md#spec-7--zero-overlap-between-schema-parameter-labels-and-generallabels),
[SPEC-8](spec-general.md#spec-8--no-duplicate-parameterization-across-the-generatorview-pair),
and [SPEC-11](spec-general.md#spec-11--area-changes-task-nature-scope-changes-task-context).

## Dimension ownership

| Dimension | Semantic question | Typical owner |
|---|---|---|
| Area | What mathematical task, relation, concept, procedure, or independently learned body of knowledge is involved? | The role that contributes that knowledge; usually the generator, sometimes an independent view task |
| Scope | What context, constraint, representation, range, evidence source, or challenge changes the same task? | The role that determines the distinction |
| Ability | What observable cognitive performance does the final task demand? | View only |

Area versus Scope is a semantic distinction, not a directory or ontology-depth convention. A Scope
changes the context of essentially the same task; an Area changes the nature of the mathematical
task or the independently required knowledge. A view may add an independent Area, but it may not
specialize a generator Area as presentation polymorphism. See
[SPEC-11](spec-general.md#spec-11--area-changes-task-nature-scope-changes-task-context).

Every production target contains at least one Area and one Ability. Scope is zero-or-more, and
multiple labels in any dimension remain a conjunction rather than alternatives. See
[TSPEC-14](target-spec.md#tspec-14--dimension-cardinality-and-conjunction).

Abilities are decided only by the final observable task. Generators therefore declare no Ability
and make no Ability-specific payload choice. When an Ability changes learner action or task
identity, it belongs on a thin leaf view; sibling leaves share parent-level rendering code. A small,
composable Ability parameter can remain only when all configurations preserve one learner action
and one coherent checklist.

For example, consider a target with:

```ts
[Area.Addition, Scope.NumbersSmaller100, Ability.ProcedureInversion]
```

`arithmetic-ops-pairs` resolves `Area.Addition` through its `operation` schema field and
`Scope.NumbersSmaller100` through `range`, then generates a canonical payload such as
`{num1: 23, num2: 18, answer: 41, operation: 'addition'}`. It does not choose an unknown.
`operations-vertical-inversion` invariantly declares `Ability.ProcedureInversion` and projects the
same payload as `23 + □ = 41`. The ordinary execution leaf projects it as `23 + 18 = □`. The Area
and Scope schema labels and the Ability view label use the same matching machinery; their different
owners follow from which behavior each label determines. See
[SPEC-V5](spec-view.md#spec-v5--abilities-are-exclusively-view-owned),
[SPEC-V6](spec-view.md#spec-v6--an-ability-driven-task-identity-is-a-leaf-view), and
[IMPL-V9](implementation-view.md#impl-v9--related-task-identities-share-parent-level-rendering-code).

## Canonical payload and observable projection

The generator creates an Ability-neutral canonical mathematical model. Its payload can contain:

- mathematical objects, quantities, relations, constraints, and calculated results;
- structured semantic context and typed identifiers;
- derivations, equivalent relations, laws, scales, intermediate values, or other evidence needed
  to prove generator-owned claims.

It cannot contain a learner-facing prompt, selected blank or unknown, requested explanation, hint,
answer prose, layout choice, or a decision whose purpose is one Ability projection. A useful
field review classifies each payload field as canonical mathematical data, calculated/structured
evidence, semantic context, or view projection; only the last category must move to the view. See
[IMPL-G8](implementation-generator.md#impl-g8--payloads-are-ability-neutral-mathematical-models).

The view projects that model into one task. It owns wording, unknown placement, requested response,
and presentation. Incidental seeded variation may live in either role: a generator may choose the
exact fraction, operands, or starting value of its canonical instance, while a view may choose
layout or other presentation details. An ontology-neutral view choice that changes task identity
belongs in resolved view configuration; presentation-only randomness remains in the renderer. The
owner follows whether the choice changes mathematical content, task identity, or only presentation.
A view must not compensate for missing mathematics, inspect raw labels, or erase evidence for
another matched claim. See
[IMPL-V8](implementation-view.md#impl-v8--needing-a-new-payload-field-is-a-two-module-change),
[IMPL-V9](implementation-view.md#impl-v9--related-task-identities-share-parent-level-rendering-code),
and [IMPL-V11](implementation-view.md#impl-v11--preserve-the-whole-matched-claim).

The rendered artifact, not a declaration by itself, is the empirical end of the contract. Every
target label must be reasonably identifiable and defensible from observable visual or necessary
textual evidence. The central VQA checklist evaluates the complete conjunction without privileging
one Ability or accepting a label name as a substitute for its witness. See
[TSPEC-13](target-spec.md#tspec-13--labels-require-observable-classification-evidence) and
[CHK-V6](checklist-view.md#chk-v6--keep-one-minimal-observable-contract-per-view).

Generators do not annotate their output with ontology labels. Orchestration derives the sample's
observable label set from the matched pair's invariant capabilities and resolved generator/view
schema capabilities. Applicability-only `requiredLabels` and `rejectedLabels` never become sample
labels; target labels record what the standard requested, not the complete description of what the
pair produced. See [IMPL-G3](implementation-generator.md#impl-g3--ontology-labels-are-resolved-outside-the-generator)
for the generator boundary and [SPEC-6](spec-general.md#spec-6--reuse-shared-resolvers-pass-them-as-references)
for resolved schema capabilities, including fallback choices.

## Four different identities

| Identity | Defined by | Purpose |
|---|---|---|
| Target identity | Spec module, authored competency prefix, and exact normalized target label conjunction; the target id suffix hashes that label set | Names one requested competency permutation |
| Sample identity | `(target.id, generatorId, viewId, split, mode, instanceIdx)` | Stable replay, seeding, filenames, and cache association |
| Content identity | Order-independent fingerprint of `problem.data` | Detects the same canonical mathematical payload and prevents train/validation leakage |
| Task identity | Order-independent fingerprint of `problem.data` plus resolved view config | Distinguishes what the selected view actually asks and governs task deduplication |

These identities answer different questions. Equal target labels do not imply equal generated
content, and equal content does not imply the same task. Question and solution have distinct sample
identities and normally use independent deterministic draws; when the content space cannot supply a
second unique solution draw, generation may render the question content in solution mode. Any view
configuration that changes the semantic task must therefore be deterministic and present in the
resolved config used by the task fingerprint. Operational details live in
[DOCS.md](../DOCS.md#sample-identity--determinism).

## Review order

When a match or artifact looks wrong, inspect it in this order:

1. Is every target claim eligible for labeling, truthful, most-specific, and observable
   (`SPEC-3`, `TSPEC-6`, `TSPEC-13`, `TSPEC-14`)?
2. Which generator or view capability positively satisfies each claim (`SPEC-1`)?
3. Does the generator payload prove its mathematical claims without selecting learner action
   (`IMPL-G4`, `IMPL-G8`)?
4. Does the view make its Ability true while preserving all payload evidence (`SPEC-V5`,
   `IMPL-V11`)?
5. Are `requiredLabels` and `rejectedLabels` genuine applicability contracts rather than matching
   repairs (`SPEC-V3`, `SPEC-V7`, `SPEC-V8`)?
6. Only after those contracts are sound, consider changing declarations, targets, ontology, or the
   checklist.

Use `npm run audit:label-architecture -- --spec=<module> --strict` for deterministic provenance,
ownership, overlap, implementation-isolation, and target-dimension checks. Matching and static
validation are logical proof; canonical generation plus VQA is the empirical proof of the final
artifact.

## Audit

- [ ] Target, module, and resolved dataset labels pass the eligibility review in SPEC-3;
  organizational relationships are not additional annotations or matching guards.
- [ ] Every label-bearing construct, including schema parameterization, is interpreted through its
  own semantics without a dimension-specific Area, Scope, or Ability channel.
- [ ] Every target label is traced to the positive generator or view capability that satisfies it;
  `requiredLabels` and `rejectedLabels` are treated only as applicability and boundary contracts.
- [ ] Area, Scope, and Ability ownership follows the determining behavior, with every Ability
  contributed by a view and every matched claim preserved in the final artifact.
- [ ] Generator payload fields are canonical mathematics, calculated/structured evidence, or
  semantic context; learner-action projection belongs to the view.
- [ ] Target, sample, content, and task identity are distinguished when reasoning about matching,
  seeding, deduplication, split leakage, or cache churn.
- [ ] The affected normative role references are loaded and findings cite their stable rule IDs.
