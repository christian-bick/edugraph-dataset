# Language-neutral generator payload migration

**Status:** Complete
**Baseline:** label-architecture audit committed in `0da1621`  
**Parent plan:** [Complete label migration](complete-label-migration.md)

## Objective

Make every generator payload a canonical mathematical or semantic model that can support all
compatible views without preselecting a learner action or final wording.

This file records the completed inventory, contract decisions, and migrations. A module was
migrated only after its mathematical source of truth, structured witnesses, view-owned
projections, consuming views, and production targets were explicit.

## Evidence base

The Phase 0 audit reuses the persisted matching graph when its target postings, capability hashes,
compatible-pair topology, and tuple nodes are current. The original review baseline established:

- 79 generator modules and 162 view modules;
- 180 type-compatible generator/view pairs;
- 806 semantic production tuples across 653 targets;
- 24 lexical generator-payload candidates affecting 257 distinct targets (262 module-target
  references because five targets use two candidate generators);
- exact production target/generator/view provenance for every candidate module.

The 24 candidates are a starting set, not the migration boundary. The source scan intentionally
uses high-signal field names. The deep review found adjacent projection data under names such as
`story`, `givenEquation`, `comparisonStatement`, `positiveLabel`, `numberName`, `definition`, and
whole per-view subpayloads. A clean lexical scan therefore does not prove a neutral payload.

## Classification

Every payload field or nested structure receives one of these dispositions:

1. **Canonical** — mathematical objects, relations, invariants, or structured semantic facts.
2. **Witness** — mathematical evidence that remains in the payload but may need a typed form.
3. **Projection** — learner action, masking, wording, formatting, layout, or answer prose that
   moves to a view or reusable parent-level view code.
4. **Decision** — an unresolved ownership question that must be settled before migration.

The current deep pass supports four contract rules:

- A mathematical fact appears once canonically. Paired `question*` and `solution*` variants do not
  constitute two mathematical facts; the view projects an unknown or reveal state from one fact.
- A formatted sentence or equation cannot be the only witness for a generator-owned claim. Retain
  typed operands, relations, steps, models, or semantic roles and derive display text from them.
- A word-problem situation may be canonical, but its final story and question sentences are not.
  Preserve entities, quantities, units, events, roles, and relations as structured semantic data.
- Alternative subpayloads for drawing, identification, explanation, notation conversion, number
  lines, or measurement are view projections when they differ by learner action or representation.
  Leaf views select the projection and share parent-level components.

## First migration batch: 24 source-scan candidates

`T/V` is the count of distinct production targets and production views in the Phase 0 graph.
For all 24 modules, the compatible-pair index confirms that the listed production consumers are
also the complete type-compatible consumer set. Compatibility must still be recomputed when a
payload type changes.

| Generator | T/V | Reviewed disposition |
|---|---:|---|
| `angle-concepts` | 3/2 | **Migrated:** each target-selected concept retains a typed fraction, turn, degree, iteration, and geometry witness. Shared view code derives prompts, point labels, fraction notation, question/solution relations, ray and unit statements, answers, and explanations. |
| `angle-measurement` | 2/2 | **Migrated:** both target paths produce the same neutral whole-degree angle relation. The protractor and drawing views independently derive task identity, geometry/orientation, tool configuration, point labels, prompts, question/solution relations, answers, and explanations; the target discriminator affects matching provenance, not payload behavior. |
| `comparison` | 18/4 | **Migrated:** legacy comparisons remain the neutral number pair and relation. Grade 4 comparisons add typed first-differing-place or all-equal evidence; the view derives numeral formatting, symbol, prompt, equation, conclusion, and explanation. **Deferred:** reconcile direct range-config boundary semantics with ontology `NumbersLarger*`/`NumbersSmaller*` exclusivity. |
| `decimal-comparison` | 3/1 | **Migrated:** retains operand precision, numeric place-value decomposition, normalized values, relation, and first-deciding-place evidence. The view derives both hundred-grid models, operand roles, decimal notation, normalized notation, place-value rows, the comparison symbol, equations, answer statement, and explanation. Schema resolvers translate ontology labels into typed comparison configuration before generation. |
| `decimal-notation` | 4/3 | **Migrated:** the payload now contains only the coherent rational/decimal value facts. Shared view code derives notation strings, grids, place-value columns, scales, measurement presentation, requested unknowns, and all language. |
| `fraction-arithmetic` | 14/4 | **Migrated:** the canonical payload contains numeric same-whole relations, retained decomposition term witnesses, mixed-number values, unit-fraction multiples, whole-number products, and a typed tenths-to-hundredths conversion. The four views derive notation, equations, stories and requested unknowns, visual models, procedure/regrouping displays, prompts, answers, and explanations. The existing mathematical variant and operation determine every current story projection, so no generator-owned situation contract or ontology support is required. |
| `fraction-comparison` | 7/2 | **Migrated:** common-component comparisons retain the fractions, family, relation, and shared whole; views derive the common component from the fractions. Unlike comparisons retain the numeric benchmark and its typed proof relations. Views derive symbols, equations, answers, prompts, benchmark statements, rationale, and all bar geometry. |
| `geometry-primitives` | 18/2 | **Migrated:** the payload contains only the target-selected primitive kind. Shared parent-level view code derives definitions, prompts, answers, construction guides, completed scenes, valid distractors, and seeded candidate order; the drawing and identification views independently project their learner actions from the same canonical primitive. |
| `integer-add-subtract-strategies` | 14/1 | **Migrated:** the payload now contains operands, strategy, adjustment, result, and typed decomposition/operation steps. Shared view code derives prompts, explanations, original and transformed equations, and step notation. |
| `integer-rounding` | 7/1 | **Migrated:** the payload contains only the source number, numeric rounding magnitude, bounding multiples, midpoint, distances, tie state, direction, and result. The view derives the place name, prompt, question/solution equations, rounding statement, and decision explanation. |
| `measurement-conversion` | 22/2 | **Migrated:** the payload now contains only typed unit identifiers, quantity/scaling kinds, factors, quantities, and table rows. Views derive all language and equations and choose withheld table cells. |
| `measurement-word-problems` | 60/1 | **Migrated:** the payload now contains only measurement kind, number kind, typed unit identity, operation, typed operands, and the exact rational answer. The view derives formatting, operand roles and labels, the situation story, question, equations, answer language, and explanation. The existing `measurementKind × operation` relation is the typed situation discriminator; no additional ontology or generator contract was required. |
| `multi-digit-division` | 4/1 | **Migrated:** the payload contains operands, quotient, remainder, digit counts, typed place-value decompositions, and the complete numeric partial-quotient chain. The view derives place names, decompositions, all equations, prompt, remainder statement, and explanation. |
| `multi-digit-multiplication` | 5/1 | **Migrated:** the payload contains operands, digit counts, typed place-value decompositions, partial-product pairings, and numeric products. The view derives place names, expanded forms, all equations, prompt, and explanation. |
| `multiplicative-comparison` | 3/2 | **Migrated:** the payload contains only the reference quantity, scale factor, compared quantity, and target-selected operation. Shared view code validates that relation, supplies the story context, derives all equations and language, and resolves a valid unknown from the operation and seed. |
| `place-value-arithmetic` | 21/2 | **Migrated:** the payload retains operands, digit decomposition, regrouping evidence, and typed strategy-step identities; equations, regrouping statements, and explanations are derived by the consuming views. |
| `place-value-expanded` | 3/1 | **Migrated:** the payload contains only the number, its complete place-value decomposition, and nonzero terms. The view owns the instruction and formatted expanded equation, validates the inclusive `1,000,000` boundary, and adapts the place strip for all seven positions. |
| `place-value-scaling` | 1/1 | **Migrated:** the payload contains the numeral digits, repeated digit, adjacent typed places and values, and factor-ten relation. The view derives the prompt, unknown placement, inverse equations, and comparison statement from that canonical relation. |
| `shape-classify-attributes` | 17/1 | **Migrated:** the payload contains typed shape definitions and selected defining facts, count facts, category relations, figure geometry, line/angle evidence, markers, and membership truth. The seeded view derives prompts, distractors, visible-attribute prose, explanations, option order, and answer identities, while validating that every projection agrees with the supplied mathematical evidence. |
| `shape-compare-attributes` | 9/1 | **Migrated:** the payload contains shape identities, dimension, selected attribute, counts, relation, and answer. The view derives the comparison prompt, count statements, inequality evidence, and answer statement. |
| `shape-patterns` | 3/3 | **Migrated:** every Area combination now produces the same neutral contract for a sampled pattern: a typed recurrence, complete geometric term sequence, and typed emergent property. The three leaf views derive task identity, rules, captions, prompts, response positions, feature choices, seeded option order, evidence wording, and explanations. |
| `standard-algorithm-add-subtract` | 4/1 | **Migrated:** the payload contains operands, result, and numeric place-value column steps with the complete carry or borrow chain. The view derives place names, calculations, regrouping instructions, equations, prompt, and explanation. |
| `time-interval-arithmetic` | 4/1 | **Migrated:** the payload contains the operation constraint, start/end instants, offsets, and elapsed duration. The view selects the requested quantity from the operation and derives the story, masking, equation, and answer language. |
| `writing` | 16/6 | **Migrated:** values through 1,000 retain the legacy integer payload; larger values use one notation-independent payload containing the integer and complete place-value decomposition. The views derive task identity, prompts, formatted numerals, English number names, response layout, and solution text. |

### Production consumers

| Generator | Production views |
|---|---|
| `angle-concepts` | `geometry-angle-concepts`, `geometry-angle-one-degree-derivation` |
| `angle-measurement` | `geometry-angle-drawing`, `geometry-protractor` |
| `comparison` | `numbers-compare`, `numbers-compare-counting`, `numbers-compare-matching`, `numbers-place-value-comparison` |
| `decimal-comparison` | `numbers-decimal-comparison` |
| `decimal-notation` | `numbers-decimal-line`, `numbers-decimal-measurement`, `numbers-fraction-to-decimal`, `numbers-decimal-to-fraction` |
| `fraction-arithmetic` | `fractions-interpretation-model`, `fractions-operation-model`, `fractions-understanding-model`, `fractions-word-problem` |
| `fraction-comparison` | `fractions-compare-benchmark-models`, `fractions-compare-models` |
| `geometry-primitives` | `geometry-primitives-drawing`, `geometry-primitives-identification` |
| `integer-add-subtract-strategies` | `operations-add-subtract-strategy-understanding`, `operations-counting-on-operation-derivation`, `operations-counting-back-operation-derivation` |
| `integer-rounding` | `numbers-rounding-line` |
| `measurement-conversion` | `measure-conversion-derivation`, `measure-conversion-execution`, `measure-conversion-table` |
| `measurement-word-problems` | `measurement-word-problem-grade4` |
| `multi-digit-division` | `operations-division-area-model` |
| `multi-digit-multiplication` | `operations-multiplication-area-model` |
| `multiplicative-comparison` | `operations-multiplicative-comparison`, `operations-multiplicative-comparison-word-problem` |
| `place-value-arithmetic` | `place-value-arithmetic-explanation`, `place-value-arithmetic-model` |
| `place-value-expanded` | `place-value-expanded-form` |
| `place-value-scaling` | `place-value-scaling` |
| `shape-classify-attributes` | `shape-classify-attributes` |
| `shape-compare-attributes` | `shape-compare-attributes` |
| `shape-patterns` | `shape-patterns`, `shape-patterns-explanation`, `shape-patterns-identification` |
| `standard-algorithm-add-subtract` | `operations-standard-algorithm` |
| `time-interval-arithmetic` | `time-interval-word-problem` |
| `writing` | `numbers-read-standard`, `numbers-write-count`, `numbers-write-name`, `numbers-write-standard`, `numbers-write-stroke`, `operations-number-line` |

## Structural pass: remaining 55 generators

The second pass combines the same production-tuple and compatible-pair graph with a broader AST
scan of string origins, shorthand properties, response selectors, options, missing positions, and
nested task payloads. It covers the other 397 production targets. The dispositions are:

- **Keep** — the payload is already a canonical mathematical or semantic model;
- **Derive** — retain its mathematics but replace display strings or redundant answers with typed
  data and view/shared-presenter derivation;
- **Project** — move a learner-action, masking, ordering, distractor, or per-view subpayload;
- **Decision** — resolve the named contract question before implementation.

| Generator | Targets | Complete compatible-view set | Disposition |
|---|---:|---|---|
| `arithmetic-decompose` | 1 | `operations-decompose` | **Keep:** numeric decomposition is canonical. |
| `arithmetic-equation-judgment` | 2 | `operations-equation-judgment` | **Migrated:** retains operands, operation, and the calculated exact answer. The judgment view derives a deterministic bounded true/false claim and its truth from `payload.seed`. |
| `arithmetic-estimation` | 4 | `operations-answer-reasonableness` | **Migrated:** retains operands, operation, nearest-ten values, and the calculated exact and estimated results. The view derives a deterministic bounded proposed answer, tolerance, distance, and reasonableness truth from `payload.seed`. |
| `arithmetic-known-fact-derivation` | 6 | `operations-known-fact-derivation`, `operations-known-fact-inversion` | **Keep:** known fact, typed strategy, operands, and result support both views without selecting the unknown. |
| `arithmetic-ops-four` | 1 | `operations-boxes`, `operations-boxes-inversion`, `operations-vertical`, `operations-vertical-inversion`, `operations-word-problem`, `operations-word-problem-inversion` | **Keep:** canonical operands and result; inversion is already view-owned. |
| `arithmetic-ops-pairs` | 46 | `measurement-word-problem`, `operations-boxes`, `operations-boxes-inversion`, `operations-number-line`, `operations-representation`, `operations-vertical`, `operations-vertical-inversion`, `operations-word-problem`, `operations-word-problem-inversion`, `operations-word-problem-within-100`, `operations-word-problem-within-100-inversion` | **Keep:** canonical binary relation; no unknown position is stored. |
| `arithmetic-ops-triples` | 5 | `operations-boxes`, `operations-boxes-inversion`, `operations-properties`, `operations-vertical`, `operations-vertical-inversion`, `operations-word-problem`, `operations-word-problem-inversion` | **Keep:** canonical ternary relation; views own task direction. |
| `arithmetic-patterns` | 16 | `operations-pattern-explanation`, `operations-pattern-feature-explanation`, `operations-pattern-feature-table`, `operations-pattern-generation-practice`, `operations-pattern-generation-table`, `operations-pattern-table` | **Migrated:** an Area-resolved discriminated union emits either canonical operation-table operands and calculated values for `GenerativeRuleRecognition`, or a typed recurrence, calculated terms, typed emergent feature, and structured law witness for `PatternGeneration` / `EmergentFeatureRecognition`. Required-label-guarded leaves validate their member and derive focus, missing-term selection, rule/feature/evidence/explanation prose, equations, options, and highlighting. Task-changing focus and missing-term choices live in resolved view config and therefore in the task fingerprint. |
| `arithmetic-word-problems-two-step` | 32 | `operations-word-problem-equation-formalization`, `operations-word-problem-reasoning`, `operations-word-problem-remainder-interpretation`, `operations-word-problem-within-100` | **Migrated:** retains two-step values, operations, letter-equation and remainder relations, and the calculated result-rounding relation. The PlausibilityEvaluation view derives its bounded proposal, rounded proposal, and verdict deterministically from `payload.seed`. |
| `equal-groups-collection` | 3 | `operations-equal-groups` | **Keep:** group count, group size, total, and operation relation are canonical. |
| `factor-multiple-relations` | 4 | `numbers-composite-classification`, `numbers-factors-multiples`, `numbers-prime-classification` | **Migrated:** retains exhaustive factors, numeric factor pairs, quotient, remainder, and classification as mathematical evidence; views derive all factor-pair equations and explanatory presentation. |
| `number-array` | 7 | `operations-number-array` | **Keep:** rows, columns, total, and operation relation are canonical. |
| `counting-basic` | 8 | `counting-conservation`, `counting-objects-cardinality`, `counting-objects-count-out`, `counting-objects-one-to-one`, `counting-objects-parity`, `counting-objects-simple` | **Keep:** count and parity are canonical; views determine representation and learner action. |
| `counting-classify-count` | 1 | `sorting-classify-count` | **Migrated:** retains category totals and the calculated overall count; the ShapeProperties view expands those totals into seeded visual items and owns their order, colors, and layout without inspecting raw labels. |
| `counting-classify-sort` | 2 | `sorting-classify-sort` | **Migrated:** retains category totals, calculated overall count, most/least relation, and its unique calculated answer. The ShapeProperties view expands totals into seeded visual items and owns ordering, color, layout, and response presentation without inspecting raw labels. |
| `counting-inc-dec` | 10 | `counting-inc-dec`, `counting-ten-more-less`, `counting-hundred-more-less` | **Keep:** start, direction, step, and result are canonical. |
| `counting-sequence` | 9 | `counting-number-sequence` | **Migrated:** retains only the sequence and step; the view selects the missing position deterministically from `payload.seed` and derives its displayed solution. |
| `currency-arithmetic` | 18 | `currency-word-problem` | **Keep:** exact monetary quantities and arithmetic relation are canonical. |
| `fraction-equivalence` | 9 | `fractions-equivalence-completion-model`, `fractions-equivalence-explanation-model`, `fractions-equivalence-model`, `fractions-whole-equivalence`, `numbers-fraction-line`, `numbers-fraction-line-classification`, `numbers-fraction-line-explanation`, `numbers-fraction-line-formalization` | **Migrated:** retains rational values, scale factors, equality, and shared-whole identity. Views derive notation, equations, scaling narration, completion direction, and tenths/hundredths grids. `Scope.TenthFractions` explicitly selects the 10-to-100 denominator relation instead of relying on a seeded choice between mathematical families. |
| `fraction-number-line` | 3 | `numbers-fraction-line`, `numbers-fraction-line-classification`, `numbers-fraction-line-explanation`, `numbers-fraction-line-formalization` | **Migrated:** retains numerator, denominator, unit-step witnesses, and whole count; the view derives all notation and the displayed endpoint answer. |
| `angle-arithmetic` | 3 | `geometry-angle-arithmetic`, `geometry-angle-arithmetic-execution`, `geometry-angle-arithmetic-inversion` | **Migrated:** retains one adjacent-angle measure tuple, its calculated whole, and the requested operation; views derive orientation, labels, notation, and unknown placement. |
| `measurement-attribute` | 2 | `measure-attributes` | **Keep:** measured attribute is canonical semantic context. |
| `measurement-compare` | 4 | `measure-compare` | **Migrated:** retains the measurable attribute, requested relation, and canonically ordered magnitudes. The view deterministically seeds A/B placement and derives the letter answer. |
| `measurement-length` | 6 | `measure-length-decimal`, `measure-length-integer` | **Keep:** exact length and scale data are canonical. |
| `measurement-length-difference` | 1 | `measure-length-difference` | **Migrated:** retains semantic longer/shorter magnitudes, the calculated difference, and a typed unit identifier. The view assigns A/B identities and renders unit notation. |
| `measurement-length-estimation` | 4 | `measure-length-estimate` | **Keep:** object/reference size relation is canonical semantic evidence. |
| `measurement-mass-volume` | 3 | `measure-liquid-volume`, `measure-mass` | **Keep:** object, instrument, measurement kind, and quantity are semantic facts; use typed identifiers where final words are currently stored. |
| `measurement-mass-volume-estimation` | 3 | `measure-liquid-volume-estimate`, `measure-mass-estimate` | **Keep:** container/reference/quantity relations are canonical; identifiers remain non-display semantic values. |
| `measurement-mediated-comparison` | 1 | `measure-mediated-comparison` | **Migrated:** the premise graph carries its node identities and intermediary once; the computed transitive answer remains an explicit mathematical result. |
| `measurement-number-line` | 10 | `measurement-number-line` | **Migrated:** retains the measurement kind, number form, typed unit identity, exact rational tick values, and target index. The view derives repeated positions/endpoints, scale labels, formatted quantities, and all learner-facing prose. |
| `measurement-order` | 2 | `measure-order` | **Migrated:** retains a canonical sorted magnitude triple and the requested direction. The view deterministically seeds presentation order, assigns A/B/C identities, and derives the correct letter order. |
| `measurement-tool-selection` | 3 | `measure-select-tool` | **Migrated:** retains the typed object and its mathematically suitable tool answer; the view owns the fixed candidate set, placement, labels, and response framing. |
| `measurement-unit-scale` | 1 | `measure-unit-scale-relation` | **Consolidated:** the canonical counts and unit-size relation are the `generic-unit-scale` member of `measurement-conversion`; the standalone generator was redundant. The view remains as a distinct abstract-partition projection of that shared payload and rejects concrete `MeasuringWithUnits` tasks. |
| `ordering` | 0 | `numbers-order` | **Migrated:** retains the selected numeric set in canonical ascending order. The view deterministically seeds question presentation and derives the requested ascending or descending solution; this pair currently has no CCSS production tuple. |
| `place-value-bundles` | 4 | `place-value-hundreds-bundles`, `place-value-tens-bundles` | **Keep:** quantity and bundle decomposition are canonical. |
| `place-value-make-ten` | 1 | `place-value-make-ten` | **Keep:** addends and composed-ten relation are canonical. |
| `place-value-teen` | 3 | `place-value-compose-teen`, `place-value-decompose-teen` | **Keep:** teen quantity and ten/ones decomposition are canonical; leaf views own direction. |
| `area-decomposition` | 2 | `area-distributive-model`, `area-rectilinear-decomposition` | **Keep:** dimensions, partitions, areas, and law-bearing decomposition are canonical witnesses. |
| `area-perimeter-relations` | 2 | `area-perimeter-comparison`, `area-perimeter-construction` | **Migrated:** retains rectangle measures plus a typed equal-area/equal-perimeter relation; views derive task wording, formulas, and units. |
| `geometry-perimeter` | 10 | `geometry-perimeter`, `geometry-perimeter-inversion` | **Migrated:** retains polygon geometry with measured sides or neutral rectangle dimensions plus the calculated perimeter; views seed unknown selection and derive formulas, units, and inverse summaries. |
| `shape-build-shape` | 17 | `shape-build-shape`, `shape-draw-circular-shape`, `shape-draw-linear-shape` | **Keep:** its discriminated variants represent materially different generator-owned shape facts and constraints, not parallel Ability behavior. View wording and rendering remain external. |
| `shape-classify-dim` | 9 | `shape-classify-dim` | **Migrated:** retains the shape/dimension relation once; the view uses `shapeType` directly instead of an identical answer alias. |
| `shape-compose-shapes` | 21 | `shape-compose-shapes` | **Migrated:** retains a typed semantic-ID composition tree and its calculated depth. The view maps local component IDs to display phrases and diagram families, derives the correct choice from uniform root inputs, and supplies target-specific distractors with seed-controlled answer placement. |
| `shape-env-shapes` | 7 | `shape-env-shapes` | **Keep:** `target` identifies the environmental object while `answer` identifies its geometric shape; these are distinct semantic roles in the classification relation, not duplicate encodings. Typed identifiers would improve the contract but do not change its ownership boundary. |
| `shape-identity` | 14 | `shape-naming` | **Migrated:** retains a typed shape identity and optional typed geometric definition. An explicit label map replaces ontology-IRI parsing; the view derives visible attribute prose, prompts, options, and answer presentation. |
| `shape-line-symmetry` | 2 | `shape-line-symmetry-drawing`, `shape-line-symmetry-identification` | **Migrated:** retains one canonical five-figure catalogue with vertices, normalized reflection-axis equations, and nonredundant vertex-correspondence orbits. Fingerprint-visible view config selects the semantic identification subset or drawing figure; views derive option letters, answer membership, card order, axis clipping endpoints, and completion presentation. |
| `shape-partition` | 14 | `shape-partition-equal`, `shape-partition-fraction-interpretation`, `shape-partition-share-comparison`, `shape-partition-share-name`, `shape-partition-unit-fraction`, `shape-partition-whole-composition` | **Migrated:** retains only the shape plus a typed partition, selected-region, or directed share-comparison relation. The six leaf views derive unit fractions, fraction notation, share names, whole composition, and all task presentation. |
| `shape-partition-equivalence` | 2 | `shape-partition-equivalence` | **Migrated:** retains the shape, equal-share count, and typed comparison of congruent wholes, equal measures, and different share shapes; the view owns concrete boundaries and wording. |
| `shape-position` | 5 | `shape-position` | **Migrated:** the spatial relation is the sole canonical fact; the view derives its response state without an identical `answer` alias. |
| `shape-same-attribute` | 3 | `shape-same-attribute` | **Migrated:** `attribute` identifies the sorting property while `answer` identifies the qualifying shape; both are distinct semantic roles. An explicit label-to-relation map replaces ontology-IRI parsing, and the view derives all action and option presentation. |
| `shape-equal-square-partition` | 2 | `shape-equal-square-count`, `shape-equal-square-count-story`, `shape-square-array-partition` | **Migrated:** the canonical decomposition contains only rows, columns, and calculated equal-part count. Counting, articulation, stories, grid visibility, prompts, and answers are view projections. |
| `shape-unit-square-grid` | 8 | `shape-square-array`, `shape-square-array-interpretation`, `shape-square-array-inversion`, `shape-square-array-story`, `shape-square-array-understanding` | **Migrated:** one typed unit-square grid retains dimensions, calculated tile count, and a semantic square-area unit ID. Views derive traversal, interpretation, multiplication, inversion, stories, unit language, and formulas. `TileScale` and `BoxArrangement` are explicit applicability preconditions for the corresponding thin leaves. |
| `shape-rectangle-area` | 4 | `shape-rectangle-area`, `shape-rectangle-area-story`, `shape-rectangle-area-inversion` | **Migrated:** one typed length × width = area relation supports plain, formula, story, and inverse projections. `Area.Equation` remains an optional generator capability; the literal formula and all requested unknowns are derived in views. |
| `measurement-data` | 7 | `measurement-data-table`, `measurement-line-plot`, `measurement-line-plot-arithmetic` | **Keep:** values, unit, and optional arithmetic relation are canonical data evidence; views choose table or line-plot representation. |
| `statistical-graphs` | 22 | `data-bar-graph`, `data-bar-graph-arithmetic`, `data-bar-graph-classification`, `data-bar-graph-interpretation`, `data-picture-graph`, `data-picture-graph-arithmetic`, `data-picture-graph-classification`, `data-picture-graph-interpretation` | **Migrated:** retains canonical semantic category IDs/counts, graph scale, requested arithmetic relation, and calculated intermediate/answer values. Views derive visible category names and seed category and observation order. |
| `time` | 17 | `time-analog`, `time-analog-construction`, `time-digital`, `time-digital-construction` | **Migrated:** retains seconds since midnight, interval seconds, and a typed day period; shared view presenters derive numeral formatting and `a.m.`/`p.m.` notation. |
| `time-elapsed` | 2 | `time-elapsed` | **Migrated:** retains start/end instants as whole minutes since midnight plus the calculated duration decomposition; analog and digital views derive every formatted clock string. |

This pass found two raw resolved-label parsing cases missed by the Phase 0 rule, in
`shape-identity` and `shape-same-attribute`. The future lint must cover ontology-IRI parsing in
generator/view implementations in addition to direct `payload.labels` and `problem.tags` access.

## Reusable contracts indicated by the review

The review does not justify one universal problem AST. It does justify a small set of reusable,
typed patterns:

- **Relation:** operands/terms, operator or comparator, result, and optional unit; masking is a
  view projection rather than a second question relation.
- **Derivation:** ordered typed steps with inputs, transformation, outputs, and retained law or
  regrouping evidence; explanation sentences are rendered from the steps.
- **Semantic situation:** entities, quantities, units, event/action, role relationships, and
  temporal or measurement constraints; story wording and requested unknown remain view-owned.
- **Object/property evidence:** object geometry or identity plus typed attributes, relations, and
  truth values; option order, letters, and classification labels remain view-owned.
- **Sequence/property evidence:** recurrence or transformation, structured terms, emergent
  property, and observations; generation, identification, and explanation are leaf projections.

Domain-specific types should implement these patterns when a shared type would erase useful
constraints.

## Completion

The inventory records 81 reviewed module rows: 58 migrated payloads, 22 payloads explicitly kept
as canonical, and the redundant `measurement-unit-scale` generator consolidated into
`measurement-conversion`. The repository now contains 80 generators. No **Decision** disposition
or unresolved non-lossless field remains.

Representative arithmetic, measurement, geometry, fraction, word-problem, and structured-law
contracts established the domain-specific migration patterns. Generator implementation rules and
the generator review/update skills enforce the accepted boundary and require adoption of every
compatible consuming view.

A future field-origin/read index may improve audit explanations, but it is not required to prove
the completed migration. If added, it must reuse the compatible-pair and production-tuple graph,
emit deterministic field-to-view provenance, and remain linear in source size plus graph edges.
