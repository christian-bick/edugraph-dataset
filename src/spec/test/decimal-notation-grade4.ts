import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

const conversionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DecimalNotation,
        Area.DecimalEquivalence,
        Area.FractionNotation,
        Scope.DecimalNumbers,
        Scope.FractionNumbers,
        Scope.EqualShares,
        Scope.Equal,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers
    ])
    .applyLabelVariants([[Ability.Formalization], [Ability.Interpretation]]);

const numberLineBuilder = new DatasetPermutationBuilder().addLabels([
    Area.NumerationWithDecimals,
    Area.DecimalNotation,
    Scope.DecimalNumbers,
    Scope.Numberline,
    Scope.SingleFrameOfReference,
    Ability.VisualArticulation
]);

const measurementBuilder = new DatasetPermutationBuilder().addLabels([
    Area.DecimalNotation,
    Area.DecimalEquivalence,
    Area.FractionNotation,
    Area.MeasuringWithUnits,
    Scope.DecimalNumbers,
    Scope.FractionNumbers,
    Scope.LengthMeasurement,
    Scope.MeterScale,
    Scope.EqualShares,
    Scope.Equal,
    Scope.SingleFrameOfReference,
    Ability.Formalization
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-grade4-fraction-decimal-conversion', conversionBuilder),
    ...toTargets('test-grade4-decimal-number-line', numberLineBuilder),
    ...toTargets('test-grade4-decimal-measurement', measurementBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];
export const ontologyTodos: OntologyTodo[] = [];
export const beyondScope: BeyondScopeEntry[] = [];
export const equivalentTargets: TargetEquivalence[] = [];
