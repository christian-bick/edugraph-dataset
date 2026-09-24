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

## Initial pair inventory

Reviewed against dataset `07c57d6` on 2026-09-23, after the ontology-library adoption and D4/D5
validation commits. That baseline had 87 generators, 184 views, and 202 compatible pairs;
every module had a parsed output/input type. Unknown-type acceptance was a framework gap without
a production instance. The adopted catalog has 93 generators, 188 views and 208 compatible pairs.

Exactly six pairs relied on the matcher allowing a union producer to feed a member-only view merely
because `requiredLabels` was non-empty. All were produced by `arithmetic-patterns`, whose
former `ArithmeticPatternProblem` output was a recurrence or an operation table:

| View | Declared accepted member |
| --- | --- |
| `operations-pattern-explanation` | `ArithmeticRecurrencePatternProblem` |
| `operations-pattern-feature-explanation` | `ArithmeticRecurrencePatternProblem` |
| `operations-pattern-feature-table` | `ArithmeticRecurrencePatternProblem` |
| `operations-pattern-generation-practice` | `ArithmeticRecurrencePatternProblem` |
| `operations-pattern-generation-table` | `ArithmeticRecurrencePatternProblem` |
| `operations-pattern-table` | `ArithmeticOperationTablePatternProblem` |

The former schema chose `recurrence` for PatternGeneration/EmergentFeatureRecognition and
`operation-table` for GenerativeRuleRecognition. That concrete relationship explained why those
targets worked, but the framework did not prove it from the mere presence of a requirement. The
adoption below uses precise generator entry points, retaining requirements only where they
independently express a target participation policy.

This inventory covers declared type narrowing. A renderer that declares the entire union but
supports only some members will not appear here; the shape and fraction reviews below remain
necessary. D1–D5 and D10 do not establish that payload-totality property.

## Contract adoption

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

### Shape and fraction adoption

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

- [x] **Union-member matching.** After adopting the six arithmetic consumers,
  [matching.ts](../../src/lib/matching.ts) rejects a producer union unless every member is
  accepted by the view. Direct, indexed and delta regressions cover output widening, missing
  and unknown mappings. Nested unions and aliases are expanded through the shared parsed type
  graph; explicit input unions remain reusable. Inventory validation rejects unknown types even
  without an active target. Matching policy epoch 5 invalidates old matching results.
- [x] **Shape construction.** Precise mathematical producers and total, explicitly typed consumers
  replace the broad task union. Consumer and evidence checks are recorded above.
- [x] **Fraction equivalence.** `fraction-equivalence` now emits proper-fraction scaling only.
  `fraction-whole-equivalence` and `fraction-tenths-equivalence` supply their exact mathematical
  families. Classification views accept proper equivalence, whole-number notation accepts whole
  equivalence, and completion/explanation views accept only their fully supported unions.
  Number-line articulation accepts only fraction-location data. The former proper-to-whole
  false match is a permanent routing regression; all admitted scaling/whole projection combinations
  are rendered in both modes by regression tests. All active CCSS and test targets remain covered;
  five CCSS tuples move generator registration without changing target labels or mathematical
  payload fields. Proper-fraction ids and seeded scale selection are retained.
- [ ] **Positive micro-filters.** `measurement-line-plot` and its `usesUnitSteps` parameter provide
  a concrete starting case: an explicit whole-step requirement must agree with generated
  subdivisions. Decide whether filters inspect target constraints or resolved generator guarantees,
  and how broad targets, fallbacks, alternatives, and bounded domains are handled. A flat
  `requiredLabels` conjunction is not proof of the complete generated domain.
- [x] **Classification evidence.** The fraction-equivalence classification number-line
  question no longer prints the verdict "same point" in
  [fraction-line-view.tsx](../../src/visuals/views/numbers/fraction-line-view.tsx). It may disclose
  that caption only in the solution or in an equality-completion task (`IMPL-V5`).
  The number-line position remains the mathematical evidence for classification.

## Positive micro-filter decision

The concrete probe uses `measurement-data` and `measurement-line-plot`, which share a coherent
`MeasurementDataProblem` contract. The latter accepts whole-unit and fractional data, but its
`usesUnitSteps` view parameter requires `subdivisions === 1`. A target-only filter cannot establish
that constraint for every configuration produced by the generator schema.

All three cases below ask for Statistics, VisualArticulation, LinePlot and StepsOf1. The first
column is the additional number-kind request. The current direct and indexed matcher admits all
three. Schema resolution over 32 seeds reproduces the following domains:

| Number kind | Produced subdivisions | Unit-step view contract |
| --- | --- | --- |
| IntegerNumbers | 1 | Satisfied |
| FractionNumbers | 4 | Always violated |
| Omitted | 1 or 4 | Fallback-dependent failure |

Existing active CCSS whole-step targets also request IntegerNumbers; the fractional targets do not
request StepsOf1. This is a real contract gap outside those active combinations, not a failure of
their current artifacts. Keep it open explicitly rather than treating successful VQA as a proof
of totality for arbitrary targets.

The proposed semantics are a **positive guarantee filter within an accepted payload family**:

1. Type compatibility still establishes the mathematical family independently of labels.
2. The filter describes an accepted domain, not additional capabilities or a generator dispatch.
3. Admit a target only when every generator configuration reachable after schema resolution,
   including fallback alternatives, guarantees that domain. One passing seed is insufficient.
4. In this example, activating unit-step presentation requires a guaranteed subdivision of one.
   An explicit fractional request fails; an ambiguous fallback also fails under this policy.
5. Compute such guarantees from declarative finite choices/bounds and their tested payload
   contracts, not arbitrary code execution or the Cartesian product of every schema parameter.
   Unknown guarantees fail closed, with a diagnostic explaining the unproved boundary.

**Review before implementation:** should a filter only reject an ambiguous domain (recommended),
or also restrict the generator's fallback choices to the accepted subset? The latter is constraint
propagation into generator configuration and requires a shared resolution contract; it is not
merely another name for `requiredLabels`. Neither policy is implemented here. In particular,
`requiredLabels` and `rejectedLabels` retain their target-only semantics and no pair-conditional
capability API has been added. The accepted-family migrations and fail-closed type matcher are
independent of this remaining decision.

## Verification checkpoint — completed 2026-09-24

- Commits: `2b8ca71` arithmetic, `8553213` shapes, `d4acadd` fractions, `c30c171` strict matching.
- `npm run test:coverage`: 486 files and 2,666 tests pass. Generator coverage thresholds pass
  (96.35% statements, 92.71% branches, 100% functions, 99.19% lines). Focused type/parser,
  inventory, direct/indexed/delta and production-catalog tests also pass after the final parser edits.
- `npm run check -- --spec=ccss,test` passes. The complete matching comparison retains all
  681 CCSS targets with no target-label edits; registration moves account for the removed tuples.
- Canonical CCSS generation with `--rebuild-graph` passes: 1,944 images, zero rendering failures.
  The final run reused 275 shards and wrote nine (560,920 image bytes); earlier runs also adopted
  the arithmetic and shape changes. Source-shared type edits required broad graph regeneration.
- Inspected question and solution examples for fraction classification, count-based shape
  construction, circle rotation and excluded quadrilaterals. Their intended evidence is visible;
  classification questions no longer disclose the explicit "same point" verdict.
- With explicit user approval, all 47 uncached PNGs and their complete prompts were evaluated by
  Gemini and passed. The other 1,897 evaluations were reused; 47 obsolete cache records were pruned.
- Strict offline audit passes with exact coverage of all 1,944 samples (1,632 train and 312
  validation): zero failing, missing, stale, duplicate or malformed records, and no freshness,
  renderer-identity or dataset-structure issues. Split integrity passes.
- Churn review: 1,911 retained identities keep identical images; the one changed retained image
  is the intended removal of the fraction-classification question's "same point" caption. There
  are 32 added and 32 removed identities from the family/view registrations, with no attempt
  shifts, seed-scheme changes or unrelated image churn. Cache changes are committed separately
  from implementation and documentation.
- **Remaining decision:** positive micro-filter policy, as described above. Canonical generation,
  VQA and cache verification no longer block the completed payload-family/type-safety work.

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
