# Language-neutral generator payload migration

**Status:** Phase 1 active  
**Baseline:** label-architecture audit committed in `0da1621`  
**Parent plan:** [Complete label migration](complete-label-migration.md)

## Objective

Make every generator payload a canonical mathematical or semantic model that can support all
compatible views without preselecting a learner action or final wording.

This phase is an inventory and contract-design phase. It precedes bulk generator changes. A
module is ready for migration only after its mathematical source of truth, structured witnesses,
view-owned projections, consuming views, and production targets are explicit.

## Evidence base

The Phase 0 audit reuses the persisted matching graph when its target postings, capability hashes,
compatible-pair topology, and tuple nodes are current. For CCSS it establishes:

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
| `angle-concepts` | 3/2 | **Projection:** `prompt`, `answerStatement`, `explanation`, and adjacent statement/answer prose. **Witness:** replace paired `questionRelation`/`solutionRelation` strings with one typed angle/turn relation; views control masking and reveal. |
| `angle-measurement` | 2/2 | **Projection:** prompt and answer/explanation prose. **Witness:** one typed angle-measure relation replaces question/solution strings. The measure-versus-sketch task discriminant is view-owned and must not select parallel payloads. |
| `comparison` | 18/4 | **Projection:** `prompt` and `evidence.explanation`. **Canonical:** numbers, relation, and first-differing-place evidence. Numeral, conclusion, and equation strings are derivable formatting. |
| `decimal-comparison` | 3/1 | **Projection:** every detected field (`prompt`, question/solution equations, answer statement, explanation) is losslessly derivable from the existing typed operands, relation, symbol, and deciding place. |
| `decimal-notation` | 4/3 | **Migrated:** the payload now contains only the coherent rational/decimal value facts. Shared view code derives notation strings, grids, place-value columns, scales, measurement presentation, requested unknowns, and all language. |
| `fraction-arithmetic` | 14/4 | **Projection:** prompts, questions, answer prose, and `unknownRole`. **Witness:** consolidate question/solution model pairs and equation strings into canonical fraction values, operations, decompositions, conversions, and complete models. **Decision:** replace English story context with a typed situation contract before removing it. |
| `fraction-comparison` | 7/2 | **Projection:** prompt, question equation, answer statement, rationale, and benchmark prose. **Canonical:** fractions, shared whole, relation, benchmark relation, and bar models already carry the proof. |
| `geometry-primitives` | 18/2 | **Projection:** drawing/identification prompts, answers, prose, candidate shuffle, guide/completed scenes, and the two task subpayloads. **Canonical:** primitive kind and its mathematical properties. Geometry renderers and definitions belong in reusable parent-level view code. |
| `integer-add-subtract-strategies` | 14/1 | **Migrated:** the payload now contains operands, strategy, adjustment, result, and typed decomposition/operation steps. Shared view code derives prompts, explanations, original and transformed equations, and step notation. |
| `integer-rounding` | 7/1 | **Projection:** prompt, question/solution equations, rounding statement, and decision explanation are derivable from number, magnitude, bounding multiples, distances, tie state, direction, and result. |
| `measurement-conversion` | 22/2 | **Migrated:** the payload now contains only typed unit identifiers, quantity/scaling kinds, factors, quantities, and table rows. Views derive all language and equations and choose withheld table cells. |
| `measurement-word-problems` | 60/1 | **Projection:** story, question, question/solution equation strings, answer statement, and explanation. **Decision/Witness:** operands and units are partly typed; add a typed situation/event contract so the same semantics can produce the story without keeping English as source data. |
| `multi-digit-division` | 4/1 | **Projection:** prompt, explanation, remainder prose, and all question-equation variants. **Witness:** numeric decompositions and partial-quotient steps remain; solved equations and the check are derived from those values. |
| `multi-digit-multiplication` | 5/1 | **Projection:** prompt, explanation, and question-equation variants. **Witness:** operands, decompositions, and partial products remain; formatted equations are derived. |
| `multiplicative-comparison` | 3/2 | **Projection:** `question`, story, given/solution equations, comparison sentence, and `unknownRole`. **Canonical:** reference quantity, scale factor, compared quantity, and structured entities. Each view resolves a valid unknown from the target and seed. |
| `place-value-arithmetic` | 21/2 | **Migrated:** the payload retains operands, digit decomposition, regrouping evidence, and typed strategy-step identities; equations, regrouping statements, and explanations are derived by the consuming views. |
| `place-value-expanded` | 3/1 | **Projection:** prompt and formatted expanded equation. **Canonical:** number, place values, and nonzero terms. |
| `place-value-scaling` | 1/1 | **Projection:** prompt and question multiplication/division equations; adjacent comparison and solved-equation prose are also derived. **Canonical:** repeated digit, adjacent places, values, and factor. |
| `shape-classify-attributes` | 17/1 | **Projection:** prompt, positive/negative labels, answer statement, explanation, category prose, and option ordering. **Canonical/Witness:** criterion, figure geometry, attributes, relations, markers, and satisfaction truth. The seeded view assigns displayed option order and IDs. |
| `shape-compare-attributes` | 9/1 | **Projection:** prompt and textual evidence. **Canonical:** shapes, dimension, selected attribute, counts, relation, and result. |
| `shape-patterns` | 3/3 | **Projection:** task discriminant, prompt, response positions, feature options, option shuffle, and explanation. **Witness:** replace rule/feature/evidence prose with a typed recurrence, term sequence, emergent property, and evidence observations that all three leaf views can project. |
| `standard-algorithm-add-subtract` | 4/1 | **Projection:** prompt, explanation, and regrouping instructions. **Witness:** operands, result, and numeric column steps remain; calculations and equations are derived. |
| `time-interval-arithmetic` | 4/1 | **Projection:** story and `unknown`. **Canonical:** start/end instants, offsets, elapsed duration, and operation constraints. The view selects and phrases the requested quantity. |
| `writing` | 16/6 | **Projection:** `prompt`, missed `readPrompt`/`writePrompt`, English `numberName`, and formatted numeral instructions. **Canonical:** integer and place-value decomposition. Notation and language formatting are view/shared-presenter responsibilities. |

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
| `arithmetic-equation-judgment` | 2 | `operations-equation-judgment` | **Project:** keep the exact operation; let the judgment view derive a seeded true/false claim instead of receiving `claimedAnswer` and `isTrue`. |
| `arithmetic-estimation` | 4 | `operations-answer-reasonableness` | **Project:** exact and estimated relations are canonical; the proposed answer and reasonableness truth are the PlausibilityEvaluation task projection. |
| `arithmetic-known-fact-derivation` | 6 | `operations-known-fact-derivation`, `operations-known-fact-inversion` | **Keep:** known fact, typed strategy, operands, and result support both views without selecting the unknown. |
| `arithmetic-ops-four` | 1 | `operations-boxes`, `operations-boxes-inversion`, `operations-vertical`, `operations-vertical-inversion`, `operations-word-problem`, `operations-word-problem-inversion` | **Keep:** canonical operands and result; inversion is already view-owned. |
| `arithmetic-ops-pairs` | 46 | `measurement-word-problem`, `operations-boxes`, `operations-boxes-inversion`, `operations-number-line`, `operations-representation`, `operations-vertical`, `operations-vertical-inversion`, `operations-word-problem`, `operations-word-problem-inversion`, `operations-word-problem-within-100`, `operations-word-problem-within-100-inversion` | **Keep:** canonical binary relation; no unknown position is stored. |
| `arithmetic-ops-triples` | 5 | `operations-boxes`, `operations-boxes-inversion`, `operations-properties`, `operations-vertical`, `operations-vertical-inversion`, `operations-word-problem`, `operations-word-problem-inversion` | **Keep:** canonical ternary relation; views own task direction. |
| `arithmetic-patterns` | 16 | `operations-pattern-explanation`, `operations-pattern-feature-explanation`, `operations-pattern-feature-table`, `operations-pattern-generation-practice`, `operations-pattern-generation-table`, `operations-pattern-table` | **Derive/Project:** retain recurrence, terms, property law, structured equivalent expressions, and evidence; remove rule, feature, evidence, and explanation prose. The leaf views select generation, identification, or explanation. |
| `arithmetic-word-problems-two-step` | 32 | `operations-word-problem-equation-formalization`, `operations-word-problem-reasoning`, `operations-word-problem-remainder-interpretation`, `operations-word-problem-within-100` | **Keep/Project:** two-step values, operations, letter-equation relation, and remainder data are canonical. Move the reasonableness proposal/truth to the PlausibilityEvaluation view as for `arithmetic-estimation`. |
| `equal-groups-collection` | 3 | `operations-equal-groups` | **Keep:** group count, group size, total, and operation relation are canonical. |
| `factor-multiple-relations` | 4 | `numbers-composite-classification`, `numbers-factors-multiples`, `numbers-prime-classification` | **Derive:** retain factors, pairs, quotient, remainder, and classification; derive factor-pair equation strings. |
| `number-array` | 7 | `operations-number-array` | **Keep:** rows, columns, total, and operation relation are canonical. |
| `counting-basic` | 8 | `counting-conservation`, `counting-objects-cardinality`, `counting-objects-count-out`, `counting-objects-one-to-one`, `counting-objects-parity`, `counting-objects-simple` | **Keep:** count and parity are canonical; views determine representation and learner action. |
| `counting-classify-count` | 1 | `sorting-classify-count` | **Project:** category counts are canonical; a generated item sequence is presentation ordering and should be seeded in the view. |
| `counting-classify-sort` | 2 | `sorting-classify-sort` | **Project:** retain category counts and most/least relation; derive the answer and seed item order in the view. |
| `counting-inc-dec` | 10 | `counting-inc-dec`, `counting-ten-more-less` | **Keep:** start, direction, step, and result are canonical. |
| `counting-sequence` | 9 | `counting-number-sequence` | **Project:** retain sequence and step; `missingIndex` and its redundant answer select the blank and move to the view. |
| `currency-arithmetic` | 18 | `currency-word-problem` | **Keep:** exact monetary quantities and arithmetic relation are canonical. |
| `fraction-equivalence` | 9 | `fractions-equivalence-completion-model`, `fractions-equivalence-explanation-model`, `fractions-equivalence-model`, `fractions-whole-equivalence`, `numbers-fraction-line`, `numbers-fraction-line-classification`, `numbers-fraction-line-explanation`, `numbers-fraction-line-formalization` | **Derive:** retain rational values, scale factors, equality, and models; derive notation/equation strings and do not store a completion direction. |
| `fraction-number-line` | 3 | `numbers-fraction-line`, `numbers-fraction-line-classification`, `numbers-fraction-line-explanation`, `numbers-fraction-line-formalization` | **Derive/Project:** retain numerator, denominator, unit steps, and whole count; derive notation, remove redundant `answer`, and let each leaf fix its task projection. |
| `angle-arithmetic` | 3 | `geometry-angle-arithmetic`, `geometry-angle-arithmetic-execution`, `geometry-angle-arithmetic-inversion` | **Derive:** retain geometry, measures, and additive relation; derive `relationStatement`. No unknown is stored. |
| `measurement-attribute` | 2 | `measure-attributes` | **Keep:** measured attribute is canonical semantic context. |
| `measurement-compare` | 4 | `measure-compare` | **Project:** retain attribute, relation, and two magnitudes; seed A/B placement in the view and derive the answer from it. |
| `measurement-length` | 6 | `measure-length-decimal`, `measure-length-integer` | **Keep:** exact length and scale data are canonical. |
| `measurement-length-difference` | 1 | `measure-length-difference` | **Keep/Derive:** length relation is canonical; represent the unit as a typed unit identifier rather than display text. |
| `measurement-length-estimation` | 4 | `measure-length-estimate` | **Keep:** object/reference size relation is canonical semantic evidence. |
| `measurement-mass-volume` | 3 | `measure-liquid-volume`, `measure-mass` | **Keep:** object, instrument, measurement kind, and quantity are semantic facts; use typed identifiers where final words are currently stored. |
| `measurement-mass-volume-estimation` | 3 | `measure-liquid-volume-estimate`, `measure-mass-estimate` | **Keep:** container/reference/quantity relations are canonical; identifiers remain non-display semantic values. |
| `measurement-mediated-comparison` | 1 | `measure-mediated-comparison` | **Keep/Derive:** object identities, premises, intermediary, and asked relation are canonical; derive the redundant answer. |
| `measurement-number-line` | 10 | `measurement-number-line` | **Derive/Project:** retain exact values, unit, interval, scale, ticks, and target; move prompt/answer/explanation prose and view label selection, and derive formatted quantities. |
| `measurement-order` | 2 | `measure-order` | **Project:** retain magnitudes and requested direction; seed presented order and IDs in the view, then derive the correct order. |
| `measurement-tool-selection` | 3 | `measure-select-tool` | **Project:** retain a typed object/tool suitability relation; candidate tools, placement, and `correctTool` response framing belong to the view. |
| `measurement-unit-scale` | 1 | `measure-unit-scale-relation` | **Keep:** counts and unit-size relation are canonical. |
| `ordering` | 0 | `numbers-order` | **Project:** retain the selected numeric set; the payload array must not encode presentation order. This compatible generator currently has no CCSS production tuple. |
| `place-value-bundles` | 4 | `place-value-hundreds-bundles`, `place-value-tens-bundles` | **Keep:** quantity and bundle decomposition are canonical. |
| `place-value-make-ten` | 1 | `place-value-make-ten` | **Keep:** addends and composed-ten relation are canonical. |
| `place-value-teen` | 3 | `place-value-compose-teen`, `place-value-decompose-teen` | **Keep:** teen quantity and ten/ones decomposition are canonical; leaf views own direction. |
| `area-decomposition` | 2 | `area-distributive-model`, `area-rectilinear-decomposition` | **Keep:** dimensions, partitions, areas, and law-bearing decomposition are canonical witnesses. |
| `area-perimeter-relations` | 2 | `area-perimeter-comparison`, `area-perimeter-construction` | **Migrated:** retains rectangle measures plus a typed equal-area/equal-perimeter relation; views derive task wording, formulas, and units. |
| `geometry-perimeter` | 10 | `geometry-perimeter`, `geometry-perimeter-inversion` | **Project:** retain polygon geometry, side lengths, and perimeter; `unknownDimension`/`unknownSideIndex`, known-side totals, and formula display are inversion projections. |
| `shape-build-shape` | 17 | `shape-build-shape`, `shape-draw-shape` | **Keep:** its discriminated variants represent materially different generator-owned shape facts and constraints, not parallel Ability behavior. View wording and rendering remain external. |
| `shape-classify-dim` | 9 | `shape-classify-dim` | **Derive:** retain shape/dimension relation and remove the redundant answer field. |
| `shape-compose-shapes` | 21 | `shape-compose-shapes` | **Project/Derive:** retain the typed composition tree and depth; move distractor/options/answer presentation to the view and replace display shape phrases with typed shape identifiers. |
| `shape-env-shapes` | 7 | `shape-env-shapes` | **Derive:** retain a typed environmental-object/shape relation; remove the redundant answer and final display names. |
| `shape-identity` | 14 | `shape-naming` | **Derive:** retain typed shape identity and attributes. The schema must resolve a typed shape value so `generator.ts` no longer falls back to parsing an ontology IRI with `split('/')`. |
| `shape-line-symmetry` | 2 | `shape-line-symmetry-drawing`, `shape-line-symmetry-identification` | **Project:** retain figure geometry and valid axes once; move identification options/IDs/shuffle and drawing completion into their respective leaf views. |
| `shape-partition` | 14 | `shape-partition-equal`, `shape-partition-fraction-interpretation`, `shape-partition-share-comparison`, `shape-partition-share-name`, `shape-partition-unit-fraction`, `shape-partition-whole-composition` | **Derive:** retain shape, partition counts, rational values, and comparison relation; replace display fraction strings and redundant model/task names with typed discriminants only where the mathematical variants differ. |
| `shape-partition-equivalence` | 2 | `shape-partition-equivalence` | **Derive:** retain shape, partition structures, and equality invariant; replace the English conclusion with a typed invariant. |
| `shape-position` | 5 | `shape-position` | **Derive:** spatial relation is canonical; remove the identical `answer` field. |
| `shape-same-attribute` | 3 | `shape-same-attribute` | **Derive:** retain typed shape/property relation and remove the redundant answer. Resolve the shape enum in the schema instead of parsing an ontology IRI in the generator. |
| `shape-square-array` | 14 | `shape-square-array`, `shape-square-array-interpretation`, `shape-square-array-inversion`, `shape-square-array-partition`, `shape-square-array-story`, `shape-square-array-understanding` | **Decision/Derive:** rows, columns, count, dimensions, and area relation are canonical. Retype units/formulas; retain a model discriminant only where it expresses a real mathematical variant, never an Ability projection. |
| `measurement-data` | 7 | `measurement-data-table`, `measurement-line-plot`, `measurement-line-plot-arithmetic` | **Keep:** values, unit, and optional arithmetic relation are canonical data evidence; views choose table or line-plot representation. |
| `statistical-graphs` | 22 | `data-bar-graph`, `data-bar-graph-arithmetic`, `data-bar-graph-classification`, `data-bar-graph-interpretation`, `data-picture-graph`, `data-picture-graph-arithmetic`, `data-picture-graph-classification`, `data-picture-graph-interpretation` | **Keep/Project:** category counts, scale, and requested arithmetic relation are canonical. Use semantic category IDs and seed raw-observation/category order in views rather than the generator. |
| `time` | 17 | `time-analog`, `time-analog-construction`, `time-digital`, `time-digital-construction` | **Migrated:** retains seconds since midnight, interval seconds, and a typed day period; shared view presenters derive numeral formatting and `a.m.`/`p.m.` notation. |
| `time-elapsed` | 2 | `time-elapsed` | **Derive:** retain typed start/end instants and duration decomposition; derive formatted time strings. |

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

## Remaining Phase 1 work

All 79 generators now have a first explicit structural disposition and a complete compatible-view
trace. Phase 1 is complete only when:

1. the typed replacements for every **Decision** and non-losslessly derivable field are accepted;
2. every display string is either losslessly derivable or preceded by a typed replacement;
3. representative arithmetic, measurement, geometry, fraction, and word-problem contracts are
   accepted as migration templates;
4. the generator implementation rules and the generator review/update skills cite the accepted
   boundary and require a consuming-view adoption matrix.

The next audit extension should index payload property origins and view property reads in one
source pass. It must reuse the compatible-pair and production-tuple graph, emit deterministic
field-to-view provenance, and stay linear in source size plus graph edges.
