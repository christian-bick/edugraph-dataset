# Payload-family matching and regression follow-ups

## Agreed direction

Use mathematical payload families and explicit view input types as the primary generator/view
compatibility contract. Use positive applicability filters for restrictions within an accepted
family, such as numeric range. Ontology capability coverage remains necessary: type compatibility
alone does not establish a target's claims.

The unit-relation, measurement-extrema, shape-edge, fraction-partition, and angle-family splits are
implemented and canonically validated. This plan retains the unfinished framework and consumer
work. Current normative rules remain in [spec-view.md](../spec-view.md),
[implementation-generator.md](../implementation-generator.md), and
[implementation-view.md](../implementation-view.md); this plan does not silently change them.

## Verified pair inventory

Reviewed against dataset `07c57d6` on 2026-09-23, after the ontology-library adoption and D4/D5
validation commits. The current catalog has 87 generators, 184 views, and 202 compatible pairs;
every module has a parsed output/input type. Unknown-type acceptance remains a framework gap even
though it has no current production instance.

Exactly six pairs rely on the matcher allowing a union producer to feed a member-only view merely
because `requiredLabels` is non-empty. All are produced by `arithmetic-patterns`, whose
`ArithmeticPatternProblem` output is a recurrence or an operation table:

| View | Declared accepted member |
| --- | --- |
| `operations-pattern-explanation` | `ArithmeticRecurrencePatternProblem` |
| `operations-pattern-feature-explanation` | `ArithmeticRecurrencePatternProblem` |
| `operations-pattern-feature-table` | `ArithmeticRecurrencePatternProblem` |
| `operations-pattern-generation-practice` | `ArithmeticRecurrencePatternProblem` |
| `operations-pattern-generation-table` | `ArithmeticRecurrencePatternProblem` |
| `operations-pattern-table` | `ArithmeticOperationTablePatternProblem` |

The current schema chooses `recurrence` for PatternGeneration/EmergentFeatureRecognition and
`operation-table` for GenerativeRuleRecognition. That concrete relationship explains why current
targets work; the framework does not prove it from the mere presence of a requirement. Prefer two
precisely typed generator entry points sharing pure mathematical helpers. Retain requirements
only where they independently express a target participation policy.

This inventory covers declared type narrowing. A renderer that declares the entire union but
supports only some members will not appear here; the shape and fraction reviews below remain
necessary. D1–D5 and D10 do not establish that payload-totality property.

## Open contract findings

### Arithmetic adoption

`arithmetic-patterns` now emits only `ArithmeticRecurrencePatternProblem`;
`arithmetic-operation-table` emits only `ArithmeticOperationTablePatternProblem`.
PatternGeneration, EmergentFeatureRecognition and GenerativeRuleRecognition are invariant
capabilities of the respective task views. The generator owns the operation and law witnesses.
Existing target requirements remain participation policies, independent of payload typing.

| Consumers | Active CCSS targets | Adoption and verification |
| --- | --- | --- |
| `operations-pattern-table` | 3.OA.D.9 rule recognition | Uses the new table generator; payload fields and renderer unchanged; complete table arithmetic tests. |
| `operations-pattern-explanation` | 3.OA.D.9 law explanations | Existing recurrence generator and payload; law-witness and render tests. |
| `operations-pattern-generation-practice`, `operations-pattern-generation-table` | 4.OA.C.5 generation | Existing recurrence payload; both mode render tests. |
| `operations-pattern-feature-table`, `operations-pattern-feature-explanation` | 4.OA.C.5 features and explanations | Existing recurrence/feature evidence; both mode render tests. |

The focused suite passes 44 tests. Type, declaration and CCSS/test active-target checks pass.
The complete CCSS matching comparison changes only the two table-generator registrations;
all 681 active targets remain covered. Table sample identities change with the generator id;
recurrence ids are retained. Canonical rendering and final cache checks follow the contract work.

### Remaining work

Shape adoption uses four precise producers: polygon definitions (`shape-build-shape`),
circle definitions, attribute-count constraints, and excluded-quadrilateral relations.
The definition payloads no longer select rotation or drawing tasks or duplicate their counts.
Rotation and attribute drawing are thin leaves sharing `shape-drawing-view.tsx`; count and
attribute construction share `shape-construction-view.tsx`. Polygon drawing now supports
pentagons and hexagons throughout its declared family.

| Shape consumers | Active CCSS families | Contract verification |
| --- | --- | --- |
| `shape-build-shape`, `shape-draw-linear-shape` | 1.G.A.1 defining attributes | Polygon definitions; all six supported polygons render in both modes. |
| `shape-draw-circular-shape` | 1.G.A.1 circle attributes | Circle definition; attribute evidence retained. |
| `shape-draw-linear-rotation`, `shape-draw-circular-rotation` | K.G.B.5 rotation conservation | The same definitions; rotation selected by the leaf, including visible circle turning marks. |
| `shape-build-from-count` | 2.G.A.1 angle/equal-face counts | Count constraints only; varied polygon witnesses and cube net render tests. |
| `shape-draw-excluded-quadrilateral` | 3.G.A.1 other quadrilaterals | Exact exclusion relation; all subcategory witnesses remain visible. |

The shape-focused suite passes 204 tests and the added payload-totality suite passes nine.
Type, spec ownership/applicability and active CCSS/test checks pass. Every previous active
target still matches; the only added realization is hexagon drawing for the existing Grade 1
attribute target. No target labels were changed. New generator/view ids deliberately change
sample seeds and split assignments; cache verification must follow canonical generation.

- [ ] **Union-member matching.** [matching.ts](../../src/lib/matching.ts) permits a generator
  returning `A | B` to feed a view accepting only `A` when the view has any `requiredLabels`.
  Their presence does not prove that the generated payload is `A`. Adopt the six inventoried
  arithmetic-pattern pairs are adopted; remove that exception from matching and the parsed type contract.
- [x] **Shape construction.** Precise mathematical producers and total, explicitly typed consumers
  replace the broad task union. Consumer and evidence checks are recorded above.
- [ ] **Fraction equivalence.** `fraction-equivalence` returns proper-fraction scaling,
  whole-number equivalence, or tenths-to-hundredths relations. Several views declare the whole
  union while accepting only a subset. A synthetic target with FractionEquivalence, ProperFractions,
  EqualShares, Equal, Formalization, and ArabicNumerals matches `fractions-whole-equivalence`, which
  rejects the proper-fraction payload. Current active CCSS/test targets avoid that combination.
  Decide whether a uniform mathematical model is truthful or precise generator entry points are
  needed, then align view input types. No blacklist or artificial family flag should conceal it.
- [ ] **Positive micro-filters.** `measurement-line-plot` and its `usesUnitSteps` parameter provide
  a concrete starting case: an explicit whole-step requirement must agree with generated
  subdivisions. Decide whether filters inspect target constraints or resolved generator guarantees,
  and how broad targets, fallbacks, alternatives, and bounded domains are handled. A flat
  `requiredLabels` conjunction is not proof of the complete generated domain.
- [ ] **Classification evidence.** Review the fraction-equivalence classification number-line
  question's literal "same point" caption in
  [fraction-line-view.tsx](../../src/visuals/views/numbers/fraction-line-view.tsx). It may disclose
  the requested verdict (`IMPL-V5`). Replay representative question/solution artifacts before
  deciding on a change; the completed structural cleanup does not settle this independent issue.

## Adoption order and boundaries

1. Use the verified union/member inventory above as the starting point. Extend it with broad-type
   partial consumers and family-selecting requirements/exclusions. Record affected targets and
   concrete failures; separate within-family limits from explicit target-participation policies.
2. Establish precise mathematical output contracts. A view may accept a small named union only
   when it supports every member. Share pure helpers and rendering components; do not manufacture
   unrelated optional fields merely to preserve one generator registration.
3. Migrate arithmetic patterns, shape construction, and fraction equivalence one module at a time,
   with a tested commit for each. Review the positive micro-filter API with concrete examples before changing required/rejected
   semantics globally. Preserve dimension neutrality and avoid duplicate generator parameterization
   in views. An allowlist of every generator label on every view is not the objective.
4. Adopt consumers, then tighten matching and validation. Reject missing/unrecognized mappings and
   remove the presence-only union exception. Do not add pair-conditional capabilities or
   configuration-dependent output routing to keep a combined generator.
5. Verify direct and indexed matching agree. Test that unrelated new payload members cannot become
   eligible for narrower views, while valid capability extensions within a family remain reusable.
   Update the affected normative rules and skill references only when replacement behavior exists.
6. Rebuild the graph after matching-machinery changes, compare complete match sets, and canonically
   regenerate and validate affected artifacts. Keep indexed work and dependency-delta execution.

Every output reachable for an admitted target must satisfy the view's accepted payload contract.
Neither target-only label filters nor a passing sample prove that property for all configurations.

## Optional synthetic regression experiment

Compare declaration-derived regression cases with the hand-authored `test` spec:

- [ ] Derive valid schema choices and explicit fallback sets, paired only with compatible views
  whose applicability admits them. Avoid a blind label power set or unrestricted Cartesian product.
- [ ] Check resolution, deterministic generation, rendering in both modes, task identities, and
  fingerprints. Keep work proportional to declared choices, compatible-pair edges, and emitted cases.
- [ ] Compare detected failures and coverage with existing test targets. Preserve unique authored
  edge cases, bug reproductions, and human-readable fixtures. Replace generic reachability targets
  only if the experiment establishes an equivalent or stronger check.

This could strengthen regression testing; it does not replace live VQA of real standard artifacts
or establish standards coverage. No synthetic probing framework is implemented by this plan.
