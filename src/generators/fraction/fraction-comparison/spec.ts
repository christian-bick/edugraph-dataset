import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'fraction-comparison',
    generalLabels: [
        Area.FractionNotation,
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
