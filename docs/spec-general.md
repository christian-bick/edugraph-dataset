# Spec Rules — General

Rules that apply to **every** `spec.ts` file, in both generators and views.

**Applies to:** `src/generators/[<category>/]<module>/spec.ts`, `src/visuals/views/[<category>/]<view>/spec.ts`
**Read with:** [spec-generator.md](spec-generator.md), [spec-view.md](spec-view.md)
**Verify with:** `npm run check:generator-view-specs`, `npm run check`

---

## Rules

### SPEC-1 — Matching is one-directional: capability must be equal or more specific

Standards/targets (`src/spec/`) are deliberately broad; generators and views are
**specific**. The matching predicate (`matchesTarget` in `src/lib/matching.ts`) satisfies
a target label `T` with a generator/view capability label `L` **only when `L` is equal to
or more specific than `T`** — `capabilitySatisfies(L, T)`, i.e. `L specializes* T`. The reverse never
matches: a specific target is *not* satisfied by a merely more-general capability.

Matching is conjunctive across the target and collective across the pair. For every
ontology label `T` in the target, at least one capability label `L` in the union of the
generator and view declarations must satisfy `L = T` or `L specializes* T`:

```text
for every T in targetLabels:
    some L in (generatorLabels union viewLabels) satisfies capabilitySatisfies(L, T)
```

`partOf` is structural and never provides capability substitution. For example,
`Scope.PhysicalRuler partOf Scope.LengthMeasurement` does not make the instrument a substitute
for its organizational field. `LengthMeasurement` is not eligible as a target or module label
under [SPEC-3](#spec-3--most-specific-does-not-mean-leaf); declaring both labels explicitly is not
a valid repair. Declare the evidenced instrument instead.

Consequently, two labels on one target mean **A AND B**, not two independently selectable
representations. The generator and view do not match the target separately; their combined
capabilities match it as one type-compatible pair.

This directionality holds for Area, Scope **and** Ability. A target label is satisfied by
the module that owns the corresponding behavior:

| Target label kind | Satisfied by |
|-------------------|--------------|
| Area, Scope | the generator or view that owns the corresponding mathematical or presentational behavior |
| Ability | the view whose final observable task makes the ability claim true |

All label-bearing spec constructs are dimension-neutral mechanisms. Target labels,
`generalLabels`, schema-supported labels, `requireTargetLabels`, and `rejectTargetLabels` use the same
ontology-label type; each construct applies its semantics without a separate Area, Scope, or
Ability channel. Schema parameterization is dimension-neutral in the same sense. The resolved
configuration value and the role's ownership rules determine what a label controls; the schema API
does not.

Dimension-neutral machinery does not remove semantic ownership constraints. Generators still
cannot own Abilities, views cannot reject them, and Area/Scope ownership follows
[SPEC-11](#spec-11--area-changes-task-nature-scope-changes-task-context).

After complete payload-type compatibility and positive coverage, one planner evaluates the
specs' `compatibility` rules over declared schema-label alternatives. A match requires at least
one valid joint assignment. Its mandatory generation plan retains correlated choices; generation
samples only from that plan, preserving the sample count and split allocation per matched tuple.
An explicit target choice cannot be rewritten to obtain compatibility.

Rules have a stable `id`, a pure boolean `predicate`, and optional declared label `dependencies`.
The query facade provides ontology-aware `has(scope, label)` and exact `exact(scope, label)`.
`target` always means the original request; `generator` and `view` contain each role's invariants
and the current candidate's selected capabilities. Views see semantic labels, never generator
parameter names, config values, payloads, or generator identifiers. Generator rules can query only
target and generator labels within their ownership constraints. Rules must not invoke resolvers,
generators, randomness, I/O, or clocks. Exceptions and undeclared optimized queries are contract
errors, not ordinary unsupported candidates.

`requireTargetLabels(id, labels)` and `rejectTargetLabels(id, labels)` are helpers returning
target-scope rules inside `compatibility`; they are not separate matching fields. They preserve
original-target requirements and exclusions without supplying positive capabilities. A fallback
label selected later cannot satisfy an explicit-target participation policy.
Author browser-loaded specs with imports from `src/lib/target-policies.ts`; the server planner
and content hashing modules must not enter renderer dependency trees.

Declared dependencies let the planner factor independent fields and enumerate only connected
choice groups. The current contract bounds each group at 4,096 assignments and fails explicitly
above that bound; do not replace this with an unbounded whole-catalog Cartesian product.

**Why:** declaring only an ancestor of what a target needs silently fails to match it — the
target simply produces no samples, with no error.

### SPEC-2 — Declare the most specific label that is still true, and never its ancestors

Declare the **most specific ontology label that is still a true statement** about what the
module produces or renders. A specific label automatically matches every broader standard
that subsumes it through `specializes`, so **never also declare a specialization ancestor** of a
label you already declare. Structural ancestors are not inherited claims.

**Why:** an ancestor declaration cannot add any match, and `validate-generator-view-specs`
flags it as a redundant declaration.

The automatic redundancy check applies to invariant `generalLabels`. Related supported schema
alternatives are not an invariant conjunction and are not redundant merely because one specializes
another; the resolver contract decides which configuration and labels are selected.

### SPEC-3 — "Most specific" does not mean "leaf"

Apply the ontology's
[ONT-E7 labeling eligibility rule](https://github.com/christian-bick/edugraph-ontology/blob/main/docs/content-evidence.md#ont-e7--label-observable-descriptors-not-organizational-nodes)
before choosing specificity. Labels must have no constituent children (`hasPart`) in the complete
pinned ontology. Structural leaves and families with only specialization children are eligible;
organizational nodes and nodes with mixed child roles are not.

This applies dimension-neutrally to target labels, generator/view `generalLabels`, schema-supported
and fallback labels, and the labels used in `requireTargetLabels` and `rejectTargetLabels`. Every resolved
dataset annotation must satisfy it too. Structural families may organize code or discovery, but
must not be exported as claims or used as matching guards.

For example, `Area.CircularShapes` organizes `Circle`, `HalfCircle`, and `QuarterCircle`; declare
the actual supported shape rather than the grouping. `Area.Rectangle`, however, remains eligible
despite having `Area.Square` as a specialization. A generator emitting general rectangles must
**not** claim `Square` merely to reach a leaf.

Eligibility is only the first check: select the most specific meaning justified by the module's
output or the target's competency. Never replace a grouping with all its children or an arbitrary
child. If no eligible descriptor expresses the intended claim, review the ontology gap under
[TSPEC-6](target-spec.md#tspec-6--never-stretch-labels-to-force-a-match).

**Review:** inspect the complete installed ontology, not a filtered tree or only the declarations
that happen to match. Module and standards checks enforce eligibility against the complete pinned
descriptor index, and generation checks resolved annotations. Whether an eligible label is
justified by the actual mathematics remains an authoring and review requirement.

### SPEC-4 — Never declare a capability broader than the module can deliver

Do not declare a capability broader than what the module can do — e.g. a generator
supporting specifically Multiplication, Division and Modulo must not declare
`Area.BaseOperations`. Even if a generator would support *all* members of a broader
concept, as long as they are distinguishable through parameterization, list every single
member individually.

**Why:** a broad claim matches targets the module will then fail, and it erases the
parameterization distinctions the dataset labels depend on.

### SPEC-5 — Separation of concerns between generator and view specs

- **Generator specs** map ontology labels **only** to abstract mathematical configuration.
- **View specs** map ontology labels **only** to presentation configuration that preserves
  learner action. Ability-driven task identities are invariant leaf-view capabilities.

The role-specific parameter lists and worked cases live in
[spec-generator.md](spec-generator.md) and [spec-view.md](spec-view.md).

### SPEC-6 — Reuse shared resolvers; pass them as references

Do not define custom resolvers inline. Import them from the module that owns them. Common
examples include:

| Module                 | Exports                                                                        |
|------------------------|--------------------------------------------------------------------------------|
| `src/lib/resolvers.ts` | `hasLabel`, `hasAllLabels`, `hasCapability`, `matchAllCapabilities`, `selectExactMatch`, `selectExactLabelMap`, `selectExactLabelSetMap`, `matchAllExactLabels`, `ontologyNeutral` |
| `src/lib/ontology.ts`  | label-derived helpers such as `resolveRangeFromLabels`, `capabilitySatisfies`, `getCapabilityAncestors`, `getStructuralAncestors` |
| `src/types/schema.ts`  | `exactResolver`, `predicateResolver`, `aggregateResolver`, and `compositionalResolver` for explicit custom resolver semantics |

Resolver functions must be passed as **references** — or as the output of curried factory
functions, e.g. `hasLabel(Scope.TenFrame)` — to the schema arrays, and **not executed
prematurely** inside the array.

An exact-choice field must not depend on declaration order. Use `selectExactMatch` when the exact
label is the configuration value, `selectExactLabelMap` when one exact label maps to another typed
value, and `selectExactLabelSetMap` when one of several explicitly allowed correlated label bundles
selects the value. These resolvers reject multiple competing matches and undeclared combinations.
Wrap a custom exact resolver with `exactResolver` only when it performs additional validation or
classification and enforces the same rejection contract.
Ontology specialization is handled by schema fallback completion and must not be recreated as a
list of parent/child aliases inside an exact mapping.

Every labeled field also needs inspectable `labelChoices`: alternatives and any conditional
defaults, conjunction semantics, equivalent-value bundles, or contextual label reads. Shared
resolver factories attach this metadata. Custom resolvers use `withLabelChoices` with an explicit
contract. Normalization must never execute value resolvers or consume randomness. Empty selections
mean a declared no-label configuration, not an opportunity for later random capability selection.
Field resolution receives only its admitted binding plus declared context; a value resolver must
not recreate an unrestricted fallback after matching.

Every multi-label resolver declares one dimension-neutral contract. `exact` selects one declared
alternative or exact bundle; `predicate` answers one fixed capability question; `aggregate`
preserves every matching member; and `compositional` combines independent constraints into a new
value. These markers document and validate resolver behavior; they do not change positive matching,
which continues to use the field's supported capability labels.

Only wrap a resolver with `compositionalResolver` when several independent labels jointly constrain
one result rather than select alternatives. Numeric range resolution is the canonical example: a
lower-bound Scope and an upper-bound Scope combine into `{min, max}`. The wrapper must not be used
to conceal first-match precedence between competing operations, units, shapes, or task kinds.

Every label-aware schema field declares a non-empty supported-label set. Never use an empty label
tuple to inspect target labels without contributing a resolved capability. A function-only schema
field is valid only for a choice that is independent of ontology labels but must remain visible in
configuration or task identity; wrap that resolver with `ontologyNeutral(() => value)`. Such a
resolver cannot consume target labels and contributes no output label. For example, selecting which
term of an otherwise fixed pattern is blank may use `ontologyNeutral(selectMissingTermIndex)`;
selecting addition versus multiplication changes the mathematical capability and must use a labeled
schema field.

`ontologyNeutral` is not a container for all seeded randomness. A generator chooses concrete
operands, fractions, or starting values in its implementation, and `problem.data` records that
instance in the content fingerprint. A view task choice with no ontological meaning uses
`ontologyNeutral` when it must enter the task fingerprint. Presentation-only shuffles, positions,
or rotations remain seeded view logic and do not become schema fields.

When a resolver needs a conjunction rather than one supported label, add a third tuple element
containing its valid fallback label sets. The resolver must succeed for every listed set, and every
fallback label must belong to that field's supported-label declaration. An explicit empty set may
represent a default that contributes no capability from that field, but only when the resulting
configuration is ontologically accounted for elsewhere in the pair. Resolution records the whole
compatible set, even when one requested label was already sufficient to select the configuration;
when several sets remain valid, it prefers the most-specific truthful realization before using the
seed to choose among equivalent sets. This prevents a broad target from hiding additional
observable capabilities supplied by the resolved configuration. Every member of the resolved set
must satisfy [SPEC-3](#spec-3--most-specific-does-not-mean-leaf).

An explicit absence default is narrower than general fallback completion. Use it only when the
false configuration has a truthful meaning. If the generator guarantees the complementary
capability, declare both singleton fallback sets so the default label is emitted—for example,
`NumbersWithNegatives` may default to `NumbersWithoutNegatives`. A false one-sided predicate such
as `requireEvenResult` means only that evenness is not required; it must not manufacture
`OddNumbers`.

Do not add fallback label sets merely because several exact labels map to the same implementation
value. Shared code does not make those labels a conjunction. When each label independently selects
the value, let the exact resolver complete directly so the resolved dataset labels contain only the
capability actually requested or deliberately selected.

**Verified by:** `npm run check:generator-view-specs`.

### SPEC-7 — Zero overlap between schema parameter labels and `generalLabels`

There must be zero overlap — **including capability ancestors via `specializes`** — between the
labels checked inside schema parameters and the spec's `generalLabels`. When a label is
declared as part of a schema parameter, neither it nor any of its ancestors may appear in
`generalLabels`.

Choose between them by behavior:

- `generalLabels` are invariant claims that are true for every output of the module and do
  not select configuration;
- schema labels distinguish supported configurations and change generated mathematics or
  rendered presentation.

For example, every `counting-sequence` output moves to a subsequent sequence position, so
`Scope.After` is general there. `counting-inc-dec` supports both subsequent and preceding
positions, so `Scope.After` and `Scope.Before` belong to its direction schema.

**Verified by:** `npm run check:generator-view-specs`.

### SPEC-8 — No duplicate parameterization across the generator/view pair

When a generator maps a label to configure the mathematical properties of a problem
payload, that label — and none of its ancestors or descendants — may be queried in the
schema of the matching view. The view must rely purely on the generated problem payload
(e.g. `problem.data`) rather than querying the ontology itself.

**Verified by:** `npm run check:generator-view-specs`.

### SPEC-9 — Prefer simple arrays over resolvers

When mapping a parameter to a set of compatible standard labels (e.g. arrangements), prefer
a simple array — `arrangement: [Scope.LinearArrangement, Scope.CircularArrangement,
Scope.ScatteredArrangement]` — over using resolvers. Fallbacks for missing labels are
generated generically already and do not require specific resolvers.

### SPEC-10 — Capabilities use `deductCompatible`, boundaries use `deductAdmitting`

The two deduction operators are duals and are not interchangeable:

- **Capabilities** are declared with `deductCompatible`, in generator/view schemas.
- **Boundaries** are declared with `deductAdmitting`, in view rejection lists.

See [SPEC-V3](spec-view.md#spec-v3--rejecttargetlabels-declares-complete-exclusion-boundaries)
and [SPEC-V4](spec-view.md#spec-v4--expand-rejection-boundaries-with-deductadmitting).

### SPEC-11 — Area changes task nature; Scope changes task context

An Area identifies the mathematical task, relation, concept, procedure, or body of knowledge
involved in a competency. A Scope changes the context, constraints, representation, range, or
challenge within essentially the same mathematical task. An Ability identifies the observable
cognitive performance demanded from the learner. Here *mathematical task* means competency
content, not the final prompt or learner action constructed by a view.

Use knowledge transfer as the semantic test. When changing a label can require separately
acquired mathematical knowledge, it changes the nature of the task and remains an Area. When
the underlying knowledge and success criterion stay the same while only the inputs, boundaries,
representation, evidence source, or difficulty context change, use a Scope. A common ancestor
and a lossless `parent Area × proposed Scope` encoding do not by themselves prove that an Area
is really a Scope: related domains such as measuring time and measuring weight, or reasoning
about circles and rectangles, may still require independently acquired knowledge.

Do not use an Area merely to report that content happens to appear in a particular notation or
representation. For example, `Area.FractionNotation` is true when understanding or using fraction
notation is itself part of the competency. A comparison task whose values are merely displayed as
fractions instead uses the relevant fraction and representation Scopes; the visible fraction bar
alone does not establish a fraction-notation learning claim. Apply the same distinction to decimal,
digit, number-name, and other notation Areas.

Across a compatible generator/view pair, positive ownership remains non-polymorphic across all
dimensions and declaration forms: equal or specialization-overlapping capabilities must not be
split between the roles' `generalLabels` and schemas. In particular, the pair must not
divide ownership by declaring equal or specialization-overlapping Areas, and a view must not
specialize a generator-owned Area with a descendant Area. Presentation, representation, evidence
source, or another contextual change within the same mathematical task is a Scope. A view may
contribute an unrelated Area when its projection adds an independent mathematical task or body of
knowledge—for example, an equation view can add `Area.Equation` to an arithmetic generator.

If a contextual distinction has no suitable Scope, create an ontology gap instead of using Area
specialization as polymorphism. If the distinction changes the nature of the mathematical task,
retain or add the appropriate Area and audit whether a separate canonical mathematical model is
required.

**Verified by:** `npm run check:generator-view-specs`.

---

## Audit

- [ ] **SPEC-1** — every target label is satisfied by the combined generator/view capabilities in the correct ontology direction, with every label-bearing construct interpreted dimension-neutrally and every Ability owned by a view.
- [ ] **SPEC-2** — no declared label is a specialization ancestor of another declared label.
- [ ] **SPEC-3** — every target, module, fallback, applicability, and resolved output label is structurally eligible in the complete pinned ontology and justified by its actual meaning; specificity does not force a leaf.
- [ ] **SPEC-4** — no declared capability is broader than the module's real output; distinguishable members are enumerated individually.
- [ ] **SPEC-5** — the schema contains only parameters of this module's own concern (math for generators, visual for views).
- [ ] **SPEC-6** — all resolvers are imported from `src/lib/resolvers.ts` (or `src/lib/ontology.ts` for label-derived value helpers); none is defined inline or executed prematurely; every multi-label resolver declares exact, predicate, aggregate, or compositional semantics; conjunctions and truthful complementary defaults declare complete fallback sets; `ontologyNeutral` is used only for unlabeled choices that must enter configuration or task identity.
- [ ] **SPEC-7** — every invariant capability is general, every configurable capability is in the schema, and no schema parameter label or ancestor appears in `generalLabels`.
- [ ] **SPEC-8** — no label parameterized by the generator is re-queried by the matching view.
- [ ] **SPEC-9** — discrete label sets are expressed as plain arrays unless a resolver is genuinely required.
- [ ] **SPEC-10** — `deductCompatible` appears only in schemas; `deductAdmitting` only in rejection lists.
- [ ] **SPEC-11** — each Area changes the mathematical task or independently required body of knowledge; each Scope changes only the context, constraints, representation, range, or challenge within that task; notation Areas are not passive representation indicators; and no compatible generator/view pair shares equal or specialization-overlapping positive capabilities in any dimension or invariant/schema combination.
- [ ] `npm run check:generator-view-specs` passes.
