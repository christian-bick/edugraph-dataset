# Spec Rules — General

Rules that apply to **every** `spec.ts` file, in both generators and views.

**Applies to:** `src/generators/[<category>/]<module>/spec.ts`, `src/visuals/views/[<category>/]<view>/spec.ts`
**Read with:** [spec-generator.md](spec-generator.md), [spec-view.md](spec-view.md)
**Verify with:** `npm run check:generator-view-specs`, `npm run check`

---

## Rules

### SPEC-1 — Matching is one-directional: capability must be equal or more specific

Standards/targets (`src/spec/`) are deliberately broad; generators and views are
**specific**. The matching predicate (`matchesTarget` in `src/lib/generation.ts`) satisfies
a target label `T` with a generator/view capability label `L` **only when `L` is equal to
or more specific than `T`** — `isSubConceptOf(L, T)`, i.e. `L partOf* T`. The reverse never
matches: a specific target is *not* satisfied by a merely more-general capability.

Matching is conjunctive across the target and collective across the pair. For every
ontology label `T` in the target, at least one capability label `L` in the union of the
generator and view declarations must satisfy `L = T` or `L partOf* T`:

```text
for every T in targetLabels:
    some L in (generatorLabels union viewLabels) satisfies isSubConceptOf(L, T)
```

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
`generalLabels`, schema-supported labels, `requiredLabels`, and `rejectedLabels` use the same
ontology-label type; each construct applies its semantics without a separate Area, Scope, or
Ability channel. Schema parameterization is dimension-neutral in the same sense. The resolved
configuration value and the role's ownership rules determine what a label controls; the schema API
does not.

Dimension-neutral machinery does not remove semantic ownership constraints. Generators still
cannot own Abilities, views cannot reject them, and Area/Scope ownership follows
[SPEC-11](#spec-11--area-changes-task-nature-scope-changes-task-context).

A view's `requiredLabels` applicability constraints and `rejectedLabels` boundaries are then
applied on top. They can respectively require an explicit target claim or veto an otherwise matching tuple
([SPEC-V3](spec-view.md#spec-v3--rejectedlabels-declares-complete-exclusion-boundaries)).

**Why:** declaring only an ancestor of what a target needs silently fails to match it — the
target simply produces no samples, with no error.

### SPEC-2 — Declare the most specific label that is still true, and never its ancestors

Declare the **most specific ontology label that is still a true statement** about what the
module produces or renders. A specific label automatically matches every broader standard
that subsumes it, so **never also declare an ancestor** of a label you already declare.

**Why:** an ancestor declaration cannot add any match, and `validate-generator-view-specs`
flags it as a redundant declaration.

### SPEC-3 — "Most specific" does not mean "leaf"

Several ontology branches bottom out in *instruments* or *subtypes* rather than in
refinements of the same claim — e.g. the only leaf under `Area.Rectangle` is `Area.Square`.
A generator emitting rectangles must **not** claim `Square`.

**Why:** a leaf label is a stronger claim, not a safer one. Claiming it makes the module
match targets whose output it cannot actually produce.

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

| Module                | Exports                                                                        |
|-----------------------|--------------------------------------------------------------------------------|
| `src/lib/resolvers.ts` | `hasLabel`, `hasSubConcept`, `matchAllLabels`, `selectExactMatch`, `matchAllExactLabels`, `selectCanonicalLabel`, `ontologyNeutral` |
| `src/lib/ontology.ts`  | label-derived value helpers such as `resolveRangeFromLabels`, `isSubConceptOf`  |

Resolver functions must be passed as **references** — or as the output of curried factory
functions, e.g. `hasLabel(Scope.TenFrame)` — to the schema arrays, and **not executed
prematurely** inside the array.

Every label-aware schema field declares a non-empty supported-label set. Never use an empty
label tuple to inspect target labels without contributing a resolved capability. A function-only
schema field is valid only for a choice that is independent of ontology labels; wrap that resolver
with `ontologyNeutral(() => value)`. Such a resolver cannot consume target labels, contributes no
output label, and its resolved value remains visible in generator data or the view task
fingerprint. For example, selecting which term of an otherwise fixed pattern is blank is a seeded
task-instance choice and may use `ontologyNeutral(selectMissingTermIndex)`; selecting addition
versus multiplication changes the mathematical capability and must use a labeled schema field.

When a resolver needs a conjunction rather than one supported label, add a third tuple element
containing its valid fallback label sets. The resolver must succeed for every listed set, and every
fallback label must belong to that field's supported-label declaration. An explicit empty set may
represent a default that contributes no capability from that field, but only when the resulting
configuration is ontologically accounted for elsewhere in the pair.

**Verified by:** `npm run check:generator-view-specs`.

### SPEC-7 — Zero overlap between schema parameter labels and `generalLabels`

There must be zero overlap — **including taxonomic ancestors via `partOf`** — between the
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

See [SPEC-V3](spec-view.md#spec-v3--rejectedlabels-declares-complete-exclusion-boundaries)
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

Across a compatible generator/view pair, ownership remains non-polymorphic. The pair must not
divide ownership by declaring equal or taxonomically overlapping Areas, and a view must not
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
- [ ] **SPEC-2** — no declared label is an ancestor of another declared label.
- [ ] **SPEC-3** — no leaf label is claimed where the leaf is an instrument/subtype the module does not actually produce.
- [ ] **SPEC-4** — no declared capability is broader than the module's real output; distinguishable members are enumerated individually.
- [ ] **SPEC-5** — the schema contains only parameters of this module's own concern (math for generators, visual for views).
- [ ] **SPEC-6** — all resolvers are imported from `src/lib/resolvers.ts` (or `src/lib/ontology.ts` for label-derived value helpers); none is defined inline; none is executed prematurely inside a schema array.
- [ ] **SPEC-7** — every invariant capability is general, every configurable capability is in the schema, and no schema parameter label or ancestor appears in `generalLabels`.
- [ ] **SPEC-8** — no label parameterized by the generator is re-queried by the matching view.
- [ ] **SPEC-9** — discrete label sets are expressed as plain arrays unless a resolver is genuinely required.
- [ ] **SPEC-10** — `deductCompatible` appears only in schemas; `deductAdmitting` only in rejection lists.
- [ ] **SPEC-11** — each Area changes the mathematical task or independently required body of knowledge; each Scope changes only the context, constraints, representation, range, or challenge within that task; notation Areas are not passive representation indicators; and no compatible generator/view pair shares equal or ancestor/descendant Areas.
- [ ] `npm run check:generator-view-specs` passes.
