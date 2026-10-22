import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const operandProfiles = [
    [[Scope.FractionDividend, Scope.FractionDivisor], 'fraction-by-fraction'],
    [[Scope.FractionDividend, Scope.IntegerDivisor], 'fraction-by-integer'],
    [[Scope.IntegerDividend, Scope.FractionDivisor], 'integer-by-fraction']
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'fraction-division-relations',
    generalLabels: [Area.Division, Scope.NumbersWithoutNegatives]
};

export const FractionDivisionRelationsGeneratorSchema = {
    operandProfile: [
        [Scope.FractionDividend, Scope.FractionDivisor, Scope.IntegerDividend, Scope.IntegerDivisor],
        selectExactLabelSetMap(operandProfiles),
        operandProfiles.map(([labels]) => labels)
    ],
    withEquation: [[Area.Equation], hasLabel(Area.Equation)],
    withMultiplication: [[Area.Multiplication], hasLabel(Area.Multiplication)]
} as const;

export type FractionDivisionRelationsGeneratorConfig = ConfigFromSchema<typeof FractionDivisionRelationsGeneratorSchema>;
