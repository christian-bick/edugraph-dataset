import {Ability, Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'fraction-comparison',
    generalLabels: [
        Area.NumericComparison,
        Area.FractionNotation,
        Scope.ProperFractions,
        Scope.SingleFrameOfReference,
        Ability.ConceptDerivation
    ]
};

export const FractionComparisonGeneratorSchema = {
    comparisonFamily: [Scope.CommonDenominator, Scope.CommonNumerator],
    interpretation: [
        Area.FractionNumeratorInterpretation,
        Area.FractionDenominatorInterpretation
    ],
    relation: [Scope.Greater, Scope.Less]
} as const;

export type FractionComparisonGeneratorConfig = ConfigFromSchema<
    typeof FractionComparisonGeneratorSchema
>;
