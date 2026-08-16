import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const commonDenominatorBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericComparison,
        Area.FractionNotation,
        Area.FractionNumeratorInterpretation,
        Scope.ProperFractions,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Scope.CommonDenominator,
        Scope.Greater,
        Ability.ConceptDerivation
    ]);

const commonNumeratorBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericComparison,
        Area.FractionNotation,
        Area.FractionDenominatorInterpretation,
        Scope.ProperFractions,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Scope.CommonNumerator,
        Scope.Less,
        Ability.ConceptDerivation
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-fraction-comparison-common-denominator', commonDenominatorBuilder),
    ...toTargets('test-fraction-comparison-common-numerator', commonNumeratorBuilder)
];
