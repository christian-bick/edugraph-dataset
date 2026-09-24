import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'fraction-comparison',
    compatibility: [generatorLabelRule('fraction-comparison-strategy', [
        Area.NumericEquality, Area.NumericInequality, Area.FractionCommonDenominatorComparison,
        Area.FractionCommonNumeratorComparison, Area.FractionReferenceComparison,
        Scope.CommonDenominator, Scope.CommonNumerator, Scope.Equal, Scope.Greater, Scope.Less
    ], selected => {
        const denominator = selected(Scope.CommonDenominator);
        const numerator = selected(Scope.CommonNumerator);
        const unequal = selected(Scope.Greater) || selected(Scope.Less);
        if (selected(Area.FractionReferenceComparison)) {
            return !denominator && !numerator && (selected(Scope.Equal)
                ? selected(Area.NumericEquality)
                : unequal && selected(Area.NumericInequality));
        }
        return unequal && (selected(Area.FractionCommonDenominatorComparison) && denominator && !numerator
            || selected(Area.FractionCommonNumeratorComparison) && numerator && !denominator);
    })],
    generalLabels: [
        Scope.ProperFractions,
        Scope.SingleFrameOfReference
    ]
};

export const FractionComparisonGeneratorSchema = {
    comparisonMode: [[
        Area.NumericEquality,
        Area.NumericInequality,
        Area.FractionCommonDenominatorComparison,
        Area.FractionCommonNumeratorComparison
    ], selectExactMatch],
    usesReferenceComparison: [[
        Area.FractionReferenceComparison
    ], hasLabel(Area.FractionReferenceComparison)],
    usesCommonDenominator: [[Scope.CommonDenominator], hasLabel(Scope.CommonDenominator)],
    usesCommonNumerator: [[Scope.CommonNumerator], hasLabel(Scope.CommonNumerator)],
    relation: [[Scope.Greater, Scope.Equal, Scope.Less], selectExactMatch]
} as const;

export type FractionComparisonGeneratorConfig = ConfigFromSchema<
    typeof FractionComparisonGeneratorSchema
>;
