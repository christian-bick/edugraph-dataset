# Payload-family matching and positive applicability

## Direction agreed with the user

Use explicit mathematical payload families and their view mappings as the primary
generator/view compatibility contract. Use positively formulated applicability filters for
restrictions within an accepted family, such as numeric range. Ontology capability coverage
remains necessary: type compatibility alone does not establish a target's claims.

This plan tracks adoption of that direction. It does not claim that the shared matcher or all
existing applicability declarations already implement it. Current normative rules remain in
[spec-view.md](../spec-view.md) and [implementation-generator.md](../implementation-generator.md).

## Problem to resolve

The matcher currently permits a generator returning `A | B` to feed a view accepting only `A`
when the view has a nonempty `requiredLabels` list. That check does not establish that the
requirement guarantees output `A`. A negative boundary such as “everything except B” would also
admit an unsupported new family C unless every consumer were updated.

Both current label filters examine requested target labels. They do not by themselves prove
what schema completion, fallback selection, and generation can produce. The safety criterion is:
every output reachable for an admitted target must satisfy the view's accepted input contract.

## First application: unit relations

Keep one concrete output family per generator entry point:

| Generator | Guaranteed output | Accepting views |
| --- | --- | --- |
| `measurement-conversion` | `StandardUnitEquivalencesProblem` | Conversion derivation, execution, and table |
| `measurement-unit-scale` | `GenericUnitScaleRelationProblem` | Conversion derivation and segment comparison |

`MeasurementConversionProblem` remains a view-side union. The derivation view explicitly accepts
both families; it does not require a label to narrow a generator's output. The other views declare
their precise member types. No conversion view needs family-selecting `requiredLabels` or
`rejectedLabels`.

Named-unit equivalences contain unit identities, a factor, and equivalent quantity pairs. The
segment model contains the two partition counts and their integer ratio. Neither model selects
an exercise mode. This follows the stable-payload and Ability-neutrality rules (`IMPL-G7`,
`IMPL-G8`), while the shared rendering stays reusable (`IMPL-V9`). Do not add a generator mode,
optional field, or ontology label solely to preserve one combined generator registration.

The separate entry points reuse the existing view components and measurement presentation
helpers. Their small mathematical generators do not need an artificial abstraction around a
single multiplication. The segment generator has an empty schema because its mathematical
capabilities are invariant; only concrete instance counts vary with the seed.

- [x] Split generator output contracts and remove conversion-family label guards.
- [x] Retain the existing views, canonical fields, and shared presentation code.
- [x] Add mathematical/schema tests and a typed-routing integration regression without pinning
  curriculum target IDs or migration-specific label permutations.
- [x] Finish matching, type, coverage, and server-render checks; record evidence in
  [observable-label-cleanup.md](observable-label-cleanup.md#batch-5-unit-conversion-contract).
- [ ] Regenerate canonical artifacts and validate their labels before claiming dataset completion.

## Broader adoption, in order

The second application is measurement observations versus extrema arithmetic, recorded in
[Batch 6](observable-label-cleanup.md#batch-6-measurement-extrema-arithmetic). It replaces an optional
relation and grouping-label guard with two precise generator outputs and shares observation
generation and line-plot components. A view's input type must reflect which mathematical claims
its projection preserves, not only whether it could access the payload's common fields.

The plain line-plot view's `usesUnitSteps` parameter is a concrete micro-filter review candidate:
an explicit whole-step requirement must be compatible with the generator's subdivisions. It is
not a reason to recreate payload-family routing through a grouping label.

[Batch 7](observable-label-cleanup.md#batch-7-shape-edge-composition) extracts shape edge composition
from the construction union. A dedicated assembly view consumes that exact family and owns the
GeometrySticks representation, sharing polygon/material components with attribute construction.
The new family needs no label guard or generator-owned task flag.

Remaining shape-construction work belongs in the inventory below: the old generator still selects
attribute/count, rotation, and excluded-subcategory branches through raw labels and returns a
task-shaped union. Its construction and drawing consumers are not total over that entire union.
Review those mathematical families and their projections together, remove raw-label implementation
access (`IMPL-G1`), and replace family-selecting guards without changing current truthful targets.
The edge-composition extraction does not claim to complete that wider normalization.

1. **Inventory payload-family routing.** Reuse the parsed type graph and compatible-pair index to
   list generator unions, member-only consumers, and requirements/exclusions used to distinguish
   output families. Record actual affected targets and whether configuration guarantees a member.
   Separate genuine within-family restrictions and explicit target-participation policies.
2. **Migrate family boundaries.** Prefer precise generator entry points and explicit view input
   types. Share pure implementation where useful. A view may accept a small named union only when
   it supports every member. First check whether an apparently split family instead has a genuinely
   uniform mathematical model; do not merge unrelated shapes through optional fields.
3. **Specify positive micro-filters.** Work through numeric-range and other within-family examples.
   Decide whether filtering examines requested constraints or resolved generator guarantees, how
   broad targets and fallbacks behave, and how bounded admissible domains are expressed. Existing
   flat `requiredLabels` means conjunction, not alternatives or a complete output-domain proof.
   Do not silently change its semantics or duplicate generator parameterization in views.
4. **Migrate existing boundaries.** Replace family blacklists with payload contracts and replace
   within-family rejections with the agreed positive filter. Preserve truthful labels and actual
   supported contexts; do not edit targets just to suppress invalid compositions. Record unresolved
   cases rather than inventing ontology distinctions for implementation routing.
5. **Tighten shared validation and matching.** After consumers are adopted, remove the presence-only
   union-member exception. Fail missing/unrecognized payload mappings rather than treating absent
   information as proof of compatibility. Verify direct and indexed matching agree. Update
   `SPEC-V3`, `SPEC-V4`, `SPEC-V6`, `SPEC-V7`, related implementation rules, and linked skills when
   the replacement semantics are implemented, preserving stable rule IDs.
6. **Verify extension safety and artifacts.** Test that a new unrelated output family does not
   silently become eligible for a narrower view, and that legitimate capability growth within a
   stable family still works. Test fallback and boundary behavior, compare complete matching sets,
   then regenerate and validate affected artifacts.

The new phase must retain linear indexed work and dependency-delta execution. Reuse type and
capability indexes rather than resolving every target against every module. Shared matching changes
require an authoritative graph rebuild before generation; do not assume source-only delta detection
covers matching machinery.

## Boundaries and decisions still needed

- No matcher extension is needed for the first application. Existing required/rejected semantics
  elsewhere remain unchanged until their replacements have been reviewed and adopted.
- Do not introduce conditional view capabilities or configuration-dependent output routing merely
  to keep one generator module. Explicit typed multi-output declarations are not part of this plan.
- A payload type name must describe a mathematical contract, not a standard, Ability, or particular
  view. Type compatibility does not replace preservation of observable label evidence (`IMPL-V11`).
- The positive micro-filter API and treatment of existing explicit target-participation requirements
  need concrete review before global changes. An allowlist of every generator label on every view
  is not the objective.
