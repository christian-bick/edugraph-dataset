# Separate structural and specialization ontology relations

**Status:** Ontology edge classification implemented on `add/specializes`; the two explicit
redesign cases and the downstream library/content migration remain open.

## Purpose

The ontology currently represents both structural membership and capability inheritance through
`partOf`. Content matching consequently interprets the complete `partOf*` closure as
specialization: a module capability on a descendant satisfies a target claim on any ancestor.

That behavior is correct for some edges and false for others. The migration separates the two
meanings so that matching, target authoring, schema resolution, dataset labels, and ontology
definitions all use the same explicit semantics.

This is intentionally a post-release migration. The current release candidate preserves the
existing relation model; the next ontology phase may change matching topology and must receive its
own complete canonical proof.

## Accepted theory

The ontology needs two dimension-neutral relations:

- `part_of` expresses part-whole organization. It structures a field but provides no capability
  inheritance. A task about the part does not satisfy a target asking for the whole merely because
  of this edge.
- `specializes` expresses a narrower form of the same capability. A specialization may satisfy a
  target asking for its ancestor.

Each branch has an ordered shape:

```text
field root
    -- part_of* --> structural component
    -- specializes* --> progressively narrower capability
```

The transition is branch-specific rather than one global ontology depth. A branch may contain only
`part_of`, only `specializes`, or either relation followed by the other in the order above. Once a
path enters `specializes`, it must not return to `part_of`. A proposed edge that requires that
reversal is evidence that the concepts, definitions, or placement need redesign; it is not a reason
to weaken the ordering rule.

Whether an ontology entity may appear in a target or module declaration is also not determined by
leaf status. A non-leaf concept is valid when it is itself the observable claim at the intended
granularity. A leaf is invalid when its definition does not describe a defensible competency claim.

## Evidence from the current ontology

The theory emerged from reviewing Scopes and was then tested against Abilities and Areas rather
than being assumed universal.

### Scopes

- Measurement scale families demonstrate a legitimate transition. A structural measurement-scale
  branch can reach `MetricAreaScale` or `ImperialAreaScale`, followed by concrete specializations
  such as square-centimeter or square-inch scales. Both the family and concrete scales can be
  valid observable claims.
- `Tapemeter` belongs to the length-measurement context through a true part-whole relation. Its
  name or a definition read without the Scope context must not turn that edge into inheritance.
- Number families invalidate a universal leaf-only rule. A broad family such as fraction numbers
  can itself be the observable context; forcing every use to an arbitrary terminal descendant
  would add false specificity.

These cases show why the relation, rather than hierarchy depth, must govern matching.

### Abilities

Abilities contain both structural decomposition and genuine specialization. The accepted
`ProcedureInversion` relationship is a clear specialization of `ProcedureUnderstanding`: an
inversion task truthfully realizes the broader understanding claim. Other branches decompose broad
capacities into constituent faculties without implying that any one constituent is a substitute
for the complete parent.

The cross-dimension audit found only two apparent pressures against the proposed relation ordering.
`AxiomDefinition` was judged an ontology-design defect rather than a valid exception. The remaining
pressure case must be remodeled or clarified during the edge inventory; it must not be grandfathered
as an ordering exception merely because the old ontology had only one relation.

### Areas

Areas exhibit the same distinction. High-level fields have genuine part-whole organization, while
narrower tasks can specialize a broader task. The new `MeasuringLength`, `MeasuringWeight`, and
`MeasuringVolumes` Areas illustrate the latter: they are independently learned measuring
activities and narrower forms of measuring objects, not presentation Scopes.

Finding the same two relation meanings in Scope, Ability, and Area makes the theory a strong
dimension-neutral ontology model. The small number of pressure cases is evidence that the ordering
already reflects the ontology's natural latent structure, even though it was not an authoring rule
when the ontology was created.

## Consequences for content matching

After the ontology exposes both relations:

1. Positive capability matching follows `specializes*` only.
2. `part_of` contributes structure and dependency provenance but never substitutes one claim for
   another.
3. `requiredLabels` and `rejectedLabels` use the same specialization semantics as positive
   matching; neither receives a dimension-specific interpretation.
4. Targets and module declarations state every required structural claim explicitly unless it is
   independently entailed by another formal rule.
5. Dataset labels remain the resolved observable generator/view capabilities. Structural ancestry
   is not silently emitted as additional artifact labels.

This removes the current ambiguity in `isSubConceptOf`, which presently means `partOf*` while being
used as capability inheritance throughout matching and validation.

## Consequences for schema resolution

`selectCanonicalLabel` is transitional infrastructure, not part of the desired end state. Its
first-group-containing-any-label behavior currently combines three cases that must be separated:

- an exact ontology label selecting a typed configuration value;
- a specialization inheriting the implementation semantics of its ancestor;
- several correlated labels describing one valid capability bundle.

The replacement design should provide:

- exact, type-safe label-to-value mapping for the authoritative discriminator;
- specialization-aware inheritance through ontology semantics rather than alias lists;
- explicit allowed bundles for correlated claims;
- rejection of zero or multiple configuration matches where exactly one is required;
- shared implementation helpers when different exact capabilities use identical code, without
  collapsing their ontology identities.

For example, this grouped alias must disappear:

```ts
[[Scope.LengthMeasurement, Scope.MeterScale], 'length']
```

The concrete observable discriminator selects the configuration, while any broader or correlated
context is represented through the correct relation or an explicit capability bundle. `part_of`
members are never interchangeable aliases.

The current inventory contains 20 production `selectCanonicalLabel` calls across 16 generator
specs. Fourteen are simple exact mappings that can move to the stricter replacement mechanically;
six use grouped semantics and require the relation and bundle audit first.

## Migration phases

### Phase 0: preserve the release boundary

1. Complete and publish the current `v0.22.2`-aligned dataset release.
2. Record its exact content SHA, ontology version, matching totals, VQA coverage, and asset-index
   coverage.
3. Do not mix relation-semantics changes into that release cutoff.

### Phase 1: classify the ontology edges

1. Inventory every current `partOf` edge in Area, Scope, and Ability.
2. Classify it as `part_of`, `specializes`, or ontology redesign required.
3. Review every multi-parent node and every path that would violate the ordering rule.
4. Revisit names and definitions where lost parent context makes the intended relation ambiguous.
5. Resolve both known pressure cases without introducing permanent exceptions.

The output must be reviewable as an edge-level diff. Classification by naming convention, depth,
or dimension is insufficient.

#### Execution checklist

For every item below, the review followed the same sequence:

1. read the child and parent definitions in context;
2. ask whether the child is a narrower form of the same observable capability;
3. change only such edges to `specializes`;
4. retain constituent, stage, instrument, aspect, and field-membership edges as `partOf`;
5. validate both relation-specific acyclicity and the global `partOf* -> specializes*` path order.

The completed batches migrate 364 of 716 descriptor hierarchy edges. The remaining 352 edges were
reviewed and retained as structural `partOf`; retention means that a direct specialization was not
established, not that every name and definition is necessarily beyond future improvement.

##### Area — 63 migrated, 206 structural

- [x] Iterated arithmetic evaluation (1 edge).
- [x] Angle kinds (5 edges).
- [x] Decimal-padding equivalence (1 edge).
- [x] Division-of-collections variants (6 edges).
- [x] Geometric transformation kinds (4 edges).
- [x] Mathematical statement kinds (2 edges).
- [x] Measuring-object dimensions (3 edges).
- [x] Number-notation kinds (8 edges).
- [x] Numeration kinds and infinite intervals (5 edges).
- [x] Numeric approximation kinds (2 edges; `Subitizing` remains structural).
- [x] Pattern-recognition kinds (2 edges).
- [x] Circumference as perimeter calculation (1 edge).
- [x] Polygon, quadrilateral, rectangle, and triangle taxonomy (16 edges).
- [x] Polyhedron, prism, rectangular-prism, and cube taxonomy (4 edges).
- [x] Shape-conservation kinds (3 edges).
- [x] Review the complete Area remainder and retain constituent families such as Cartesian-plane
  components, circle parts, fraction/ratio roles, measuring-with-units topics, and shape
  part-whole operations as `partOf`.

Ontology commit: `59c776a refactor: classify Area specializations`.

##### Scope — 243 migrated, 84 structural

- [x] Complexity and cardinality values: composition depth, operand cardinality, frame
  complexity, relation mediation, statement complexity, and step complexity (14 edges).
- [x] Dividend, divisor, largest-operand, and smallest-operand digit-count chains (18 edges).
- [x] Numeric bases (4 edges).
- [x] Numeric divisibility families (5 edges).
- [x] Numeric range boundaries (19 edges).
- [x] Numeric sign and zero families (4 edges).
- [x] Step magnitudes (8 edges).
- [x] Numeric-space, real, rational, decimal, and fraction hierarchy (6 edges).
- [x] Proper, improper, mixed, related, numerator/denominator, and fixed-denominator fraction
  families (13 edges).
- [x] Metric and imperial area-scale families (8 edges).
- [x] Metric and imperial distance-scale families (11 edges).
- [x] Metric and imperial volume-scale families (9 edges).
- [x] Metric and imperial weight-scale families (7 edges).
- [x] Temperature and rotation scales (5 edges).
- [x] Conversion, currency, and data representation families (8 edges).
- [x] Physical and visual geometry representation families (7 edges).
- [x] Numeral, physical, spatial, and visual number representation families (15 edges).
- [x] Object arrangement and object-type families (6 edges).
- [x] Currency denomination and currency-system families (11 edges).
- [x] Dimensional abstraction values (5 edges).
- [x] Compass, cardinal, intercardinal, spatial, and temporal direction families (19 edges).
- [x] Meridiem and time-interval families (13 edges).
- [x] Measurement mode, quantity-measurement, and liquid-volume families (6 edges).
- [x] Order and partition families (10 edges).
- [x] Shape attribute, property, and variation families (9 edges).
- [x] State-property values (3 edges).
- [x] Review the complete Scope remainder and retain structural category and instrument edges,
  including protractors, rulers, tape meters, thermometers, clocks, calendars, and weighing scales,
  as `partOf`.

Ontology commit: `e345a7b refactor: classify Scope specializations`.

##### Ability — 58 migrated, 62 structural

- [x] Non-deductive reasoning kinds and logical inference (5 edges).
- [x] Conceptual-thinking operations (5 edges).
- [x] Creativity kinds (5 edges).
- [x] Facilitation kinds (2 edges).
- [x] Evaluation kinds with clear entailment (4 edges).
- [x] Extraction kinds (4 edges).
- [x] Interpretation kinds with clear entailment (4 edges).
- [x] Direct, subtext, and supertext understanding (3 edges).
- [x] Expression kinds with clear entailment (6 edges).
- [x] Non-fringe articulation modalities and lexical/grammatical specializations (6 edges).
- [x] Non-fringe reception modalities and visual-reception specializations (6 edges).
- [x] Procedure-understanding specializations, including `ProcedureInversion` (4 edges).
- [x] Spatial-thinking specializations (4 edges).
- [x] Review the complete Ability remainder and retain structural faculties and stages, including
  procedure application, scientific thinking, empathy, introspection, and social scaling, as
  `partOf`.

Ontology commit: `60a4720 refactor: classify Ability specializations`.

#### Fringe-case resolution queue

- [ ] **Deductive reasoning and axiom definition.** `DeductiveReasoning` is a genuine
  specialization of `LogicalReasoning`, but `AxiomDefinition` is currently modeled as one of its
  parts. Converting the former while retaining the latter would create the forbidden
  `specializes -> partOf` order. Recommended redesign: split the current compound definition into
  premise/axiom identification and premise formalization where the observable actions differ;
  model those as specializations of appropriate conceptual or formalization abilities, and express
  their use by deductive reasoning through a compositional progression relation rather than the
  descriptor hierarchy. Then migrate `DeductiveReasoning specializes LogicalReasoning`.
- [ ] **Linguistic modalities and performance facets.** `TextualReception`, `VocalReception`,
  `TextualArticulation`, and `VocalArticulation` are plausible modality specializations, while
  reading, writing, speaking, and listening fluency/precision/speed/capacity/flexibility are
  performance facets rather than parts below an already specialized modality. Recommended
  redesign: represent modality and transferable performance quality as atomic Ability labels—for
  example `TextualReception + Fluency` rather than the compound `ReadingFluency`—and move
  linguistic knowledge such as syntax or pronunciation into the appropriate Area when it is the
  learned subject matter. The modal Ability chains can then use `specializes` without placing a
  new structural decomposition beneath them.

Neither fringe case is an exception to the ordering rule. Both remain explicit ontology-design
tasks and were intentionally excluded from the Ability edge commit.

### Phase 2: add explicit ontology semantics

1. Add the `specializes` relation alongside non-inheriting `part_of`.
2. Expose direct and transitive relation access in generated TypeScript and Python packages.
3. Validate acyclicity and the `part_of* -> specializes*` ordering on every path.
4. Add relation-specific tests and document targetability independently of leaf status.
5. Publish one immutable ontology version containing the complete classified migration.

Whether the structural hierarchy must be a strict single-parent tree or may remain an ordered
acyclic graph is a separate modeling decision. It must not delay separating inheritance semantics.

### Phase 3: migrate content semantics

1. Replace `isSubConceptOf` with relation-specific APIs whose names state their semantics.
2. Make positive matching, requirements, rejections, overlap validation, target coverage, and
   scope completeness follow `specializes` only where inheritance is intended.
3. Record both relation types in dependency-graph semantic provenance so ontology deltas remain
   exact.
4. Audit every target and generator/view declaration whose successful match changes.
5. Reject declarations that depended on a `part_of` edge as an implicit capability substitute.

### Phase 4: remove ambiguous schema canonicalization

1. Introduce the exact, ambiguity-rejecting schema mapping primitive.
2. Migrate the fourteen simple `selectCanonicalLabel` calls.
3. Resolve the six grouped calls using authoritative discriminators, specialization, and allowed
   bundles.
4. Delete `selectCanonicalLabel` and its tests once production usage reaches zero.
5. Add validation preventing first-match label precedence from reappearing in custom resolvers.

### Phase 5: canonical proof

1. Run the complete repository and ontology test suites.
2. Produce before/after matching and label-resolution reports for every production target.
3. Rebuild the complete dependency graph because matching semantics changed.
4. Canonically generate every affected CCSS tuple and inspect additions and removals.
5. Revalidate every changed label/image context through VQA.
6. Require strict VQA audit, split integrity, union merge, and exact asset-index coverage before the
   first release using the new relations.

## Completion gates

The migration is complete only when:

1. every ontology hierarchy edge has an explicit reviewed relation;
2. no path changes from `specializes` back to `part_of`;
3. `part_of` produces no capability inheritance in matching or applicability checks;
4. all intended specialization matches remain covered;
5. all targets and module declarations use defensible observable concepts, independent of leaf
   status;
6. `selectCanonicalLabel` has no production or test usage and is removed;
7. the dependency graph tracks both relation types and preserves delta behavior;
8. no permanent compatibility allowlist conceals an unclassified edge;
9. the complete canonical dataset and VQA cache prove the resulting observable labels;
10. the release asset index covers every exact normalized production target.

## Non-goals

- Do not impose one global depth at which every ontology branch changes relation.
- Do not require targets or modules to use leaves exclusively.
- Do not treat every child as a specialization merely because its artifact could be shown in a
  broad classroom context.
- Do not treat `part_of` as weak inheritance.
- Do not add dimension-specific matching or schema-resolution rules.
- Do not preserve a bad ontology placement to avoid content migration.
- Do not redesign generator/view ownership as part of the relation migration unless a changed
  match exposes a concrete existing defect.
