# Label declaration review

## Purpose

This inventory records the semantic review of view applicability, exclusion boundaries, and
view-owned Areas required by Phase 5 of
[complete-label-migration.md](complete-label-migration.md). The deterministic audit continues to
report these declarations as review signals because their correctness depends on task semantics;
this file records their durable disposition without turning the current module catalog into a
validator allowlist.

The reviewed CCSS K-4 catalog contains 653 targets, 80 generators, 182 views, 199 compatible
generator/view pairs, and 790 matched production tuples. The strict audit reports zero violations
and zero source signals.

## Review criteria

- `requiredLabels` is retained only when it states a necessary target precondition supported by
  every type-compatible generator/view pair, does not control rendering, and cannot be expressed
  more precisely by the payload type.
- `rejectedLabels` is retained only for a stable, complete invalid region of an otherwise
  compatible view contract.
- A view-owned Area is retained only when the projection adds a distinct mathematical task or
  independently acquired body of knowledge. Context or representation alone remains a Scope.

These criteria are normative in `SPEC-V3`, `SPEC-V7`, `SPEC-V8`, and `SPEC-11`.

## Positive applicability

All 38 current `requiredLabels` declarations are accepted. Each precondition is pair-supported;
the requirement itself supplies no capability.

| Family | Views and accepted applicability |
| --- | --- |
| Counting steps | `counting-ten-more-less` requires `StepsOf10`; `counting-hundred-more-less` requires `StepsOf100`. |
| Measurement | Conversion derivation/execution require `UnitScaleRelation` or `MeasuringWithUnits`; the generic unit-scale relation requires `UnitScaleRelation + LengthMeasurement`; mass leaves require `WeightMeasurement`; liquid-volume leaves require `LiquidVolumes`; line-plot arithmetic requires `FractionArithmetic`; length-drawing leaves require their invariant `VisualArticulation` task. |
| Number classification | Prime, composite, and factor/multiple leaves require their corresponding generator-established Areas. |
| Number writing | `numbers-write-count` requires `NumerationWithIntegers`; standard and stroke numeral-writing leaves require `DigitNotation`. |
| Operation strategies | Counting-on and counting-back derivation leaves require their corresponding strategy Areas. |
| Arithmetic patterns | The six leaves require the discriminated generator family they consume: `GenerativeRuleRecognition`, `PatternGeneration`, or `EmergentFeatureRecognition`. |
| Word problems | Equation formalization requires `Equation`; reasonableness requires `IntegerRounding`; remainder interpretation requires `ImperfectDivisibility + Modulo`. |
| Place value | The hundreds-bundle leaf requires `MultiplesOf100`. |
| Shape drawing | Circular and linear drawing require `Circle` or `Polygon`. |
| Square arrays | Tile projections require `TileScale`; arrangement projections require `BoxArrangement`. |
| Stronger sibling tasks | `operations-pattern-feature-explanation` requires its invariant `ProcedureExecution` claim; `place-value-arithmetic-written-method` requires its invariant `Formalization` claim. |

The stronger sibling requirements use the same dimension-neutral mechanism as every other target
precondition. Their Abilities remain invariant `generalLabels` capabilities and do not configure
the views.

## Exclusion boundaries

All 30 current `rejectedLabels` declarations are accepted after replacing negatively stated
positive applicability. Expanded range reports name every ontology range admitted by the boundary;
the source declarations use `deductAdmitting` rather than enumerating those derived labels.

| Boundary class | Views | Rationale |
| --- | --- | --- |
| Finite visual or task capacity | `counting-conservation`, `counting-inc-dec`, `numbers-compare-counting`, `numbers-compare-matching`, `numbers-write-stroke`, `operations-answer-reasonableness`, `operations-representation`, `operations-word-problem`, `operations-word-problem-inversion`, `place-value-make-ten` | Each view accepts the complete domain up to a declared magnitude and rejects the full admitting range above it. |
| Number form or signed-domain boundary | `measure-length-decimal`, `measure-length-decimal-drawing`, `measure-length-integer`, `measure-length-integer-drawing`, `numbers-place-value-comparison`, `numbers-rounding-line`, `operations-number-line-arithmetic`, `operations-number-line-representation` | Decimal/integer, zero, negative, and bounded-line restrictions follow from the concrete representation contract. |
| Operation or operand-family boundary | `operations-number-line-arithmetic`, `place-value-arithmetic-model`, `place-value-arithmetic-written-method` | The renderer supports the complete declared operation/operand family and excludes the incompatible family. |
| Law-witness boundary | `operations-boxes-inversion`, `operations-vertical-inversion` | A single withheld operand preserves the operation relation but cannot expose the structured witness required for associative, commutative, or distributive-law claims. |
| Statistical task-family boundary | `data-picture-graph`, `data-picture-graph-arithmetic`, `data-picture-graph-classification`, `data-picture-graph-interpretation` | These picture-graph projections accept the non-step categorical-data and three-category-total families, while the explicit one- and multi-step comparison families use the corresponding bar-graph projections. |
| Independent-task conjunction | `measure-unit-scale-relation` | The generic unit-scale partition demonstrates relative unit size but does not claim the independent `MeasuringWithUnits` task. Concrete conversions use the conversion-derivation view. |
| Hierarchical family without a positive complement | `place-value-tens-bundles` | The tens leaf accepts the general multiples-of-ten family except the `MultiplesOf100` specialization. The hundreds sibling states its positive applicability directly. |
| Shape renderer and task boundary | `shape-draw-circular-shape`, `shape-draw-linear-shape` | Drawing leaves exclude property/count tasks; the linear renderer additionally excludes polygon kinds for which it has no total drawing projection. |

Any future expansion of a generator schema or ontology family must re-run this semantic review. An
exact exclusion remains valid only while the view accepts every other type-compatible member.

## View-owned Areas

All 24 current declarations are accepted. They fall into independent knowledge/task families:

| Independent task added by the view | Views |
| --- | --- |
| Numeric identity and conservation | `counting-conservation`, `counting-objects-cardinality` |
| Place-value reasoning | `counting-ten-more-less`, `counting-hundred-more-less`, `numbers-place-value-comparison` |
| Numeration or set comparison | `numbers-compare-counting`, `numbers-compare-matching`, `numbers-order` |
| Decimal/fraction notation and equivalence | `numbers-decimal-line`, `numbers-decimal-measurement`, `numbers-decimal-to-fraction`, `numbers-fraction-to-decimal` |
| Equation construction or judgment | `operations-boxes`, `operations-boxes-inversion`, `operations-equation-judgment`, `operations-multiplicative-comparison`, `operations-number-array-equation-formalization` |
| Equal-group interpretation | `operations-number-array-interpretation` |
| Collection composition/decomposition | `place-value-compose-teen`, `place-value-decompose-teen` |
| Geometric drawing or naming | `geometry-primitives-drawing`, `shape-draw-circular-shape`, `shape-draw-linear-shape`, `shape-naming` |

The notation Areas above are not passive representation indicators. Their tasks explicitly ask the
learner to interpret, construct, or relate decimal/fraction notation. Other fraction- or
decimal-rendering views use Scopes instead.

## Completion result

The declaration review is complete:

- positive family applicability is expressed through `requiredLabels` rather than an opposite
  rejection where the positive discriminator exists;
- redundant rejections that cannot affect matching are absent;
- all retained exclusions state contract-level boundaries;
- every view-owned Area has an independent-task rationale;
- both stronger-sibling Ability preconditions satisfy `SPEC-V8` without a dimension-specific
  property;
- the corrected declarations preserve all 790 matched production tuples.

The audit should continue to report these declarations for review whenever their modules or
ontology neighborhoods change. A review signal is not a migration defect and should not be hidden
by a permanent catalog-specific allowlist.
